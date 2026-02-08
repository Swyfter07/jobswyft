# Scan Engine Architecture — Job Extraction Pipeline

> **Addendum to:** [Architecture Decision Document](./index.md)
> **Scope:** Job page detection, DOM extraction, AI fallback, delayed verification, confidence scoring
> **Status:** Approved — 2026-02-08
> **Decisions by:** jobswyft + Winston (Architect Agent)

---

## 1. Problem Statement

The scan engine is the critical first touchpoint in the user's workflow. Every downstream feature (match analysis, cover letter, autofill, coaching) depends on the quality, completeness, and speed of job extraction. The EXT-5 implementation proved the core pattern but revealed fragility points that must be addressed before scaling to real-world usage across diverse job boards.

**Key challenges:**
- CSS selectors break silently when job boards refactor their DOM
- LinkedIn/Indeed/Glassdoor truncate descriptions behind "Show More" buttons
- Fixed 1.5s delay for SPA content is unreliable (too short on slow networks, too long on fast ones)
- No quality signal — the system cannot distinguish a high-confidence JSON-LD extraction from a wildcard CSS guess
- No fallback when rule-based extraction produces incomplete results
- Service worker in-memory state is lost on Chrome's automatic SW pause/restart

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DETECTION LAYER                              │
│                                                                  │
│  Background Service Worker (4 triggers):                         │
│  ├─ chrome.tabs.onUpdated (full page loads)                     │
│  ├─ chrome.webNavigation.onHistoryStateUpdated (SPA pushState)  │
│  ├─ chrome.webNavigation.onReferenceFragmentUpdated (hash SPA)  │
│  └─ chrome.tabs.onActivated (tab switch)                        │
│                                                                  │
│  Cooldown: chrome.storage.session (survives SW restart)          │
│  Dedup: URL + timestamp key in session storage                   │
│                                                                  │
│  Content Sentinel (lightweight content script):                  │
│  ├─ MutationObserver → signals "content-ready" via storage      │
│  ├─ Auto-expands "Show More" buttons before signaling           │
│  └─ Fallback: background fires executeScript after 3s timeout   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTRACTION PIPELINE                            │
│                                                                  │
│  Side Panel calls chrome.scripting.executeScript({ func })       │
│                                                                  │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────┐          │
│  │  Layer 1   │  │    Layer 2     │  │   Layer 3    │          │
│  │  JSON-LD   │  │  CSS Selectors │  │   OG/Meta    │          │
│  │ conf: 0.95 │  │  Board: 0.85   │  │  conf: 0.40  │          │
│  │            │  │  Generic: 0.60 │  │              │          │
│  └─────┬──────┘  └───────┬────────┘  └──────┬───────┘          │
│        └─────────────────┼──────────────────┘                   │
│                          ▼                                       │
│                ┌──────────────────┐                              │
│                │   Field Merger   │  Per-field best value        │
│                │   + Validator    │  + confidence tracking       │
│                └────────┬─────────┘                              │
│                         │                                        │
│              ┌──────────┴──────────┐                             │
│     score ≥ 0.7                score < 0.7                       │
│              │                     │                             │
│              ▼                     ▼                             │
│      ┌────────────┐     ┌──────────────────┐                    │
│      │   Return   │     │  Layer 4: Heur.  │                    │
│      │   Result   │     │  Readability.js  │                    │
│      └────────────┘     │  + expanded CSS  │                    │
│                         └────────┬─────────┘                    │
│                                  │                               │
│                       ┌──────────┴──────────┐                    │
│              score ≥ 0.7                score < 0.7              │
│                       │                     │                    │
│                       ▼                     ▼                    │
│               ┌────────────┐     ┌──────────────────┐           │
│               │   Return   │     │  Layer 5: AI     │           │
│               │   Result   │     │  POST /v1/ai/    │           │
│               └────────────┘     │  extract-job     │           │
│                                  │  conf: 0.90      │           │
│                                  └────────┬─────────┘           │
│                                           ▼                     │
│                                   ┌────────────┐                │
│                                   │   Return   │                │
│                                   │   Result   │                │
│                                   └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DELAYED VERIFICATION                            │
│                                                                  │
│  If completeness < 0.8 after initial scan:                       │
│  ├─ Schedule re-scan after 5 seconds                            │
│  ├─ Show subtle "refining..." badge on JobCard                  │
│  ├─ Re-run extraction pipeline (catches lazy-loaded content)    │
│  ├─ If new result has higher completeness → merge silently      │
│  ├─ Remove "refining..." badge                                  │
│  └─ If no improvement → keep original, remove badge             │
│                                                                  │
│  Does NOT re-trigger AI fallback (one AI call per scan max)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Architectural Decisions

### ADR-SCAN-1: Content Sentinel with Fallback Timeout

**Decision:** Add a lightweight content script that uses MutationObserver to detect when job content has loaded, with a 3-second fallback timeout in the background worker.

**Context:** The current implementation uses a fixed 1.5s `setTimeout` before signaling the side panel. This is too short for slow networks (LinkedIn can take 3s+) and unnecessarily slow for fast connections where content loads in 200ms.

**Pattern:**
1. Background detects job URL → injects content sentinel script
2. Sentinel watches for content readiness signals (board-specific selectors or generic heuristics)
3. Sentinel auto-expands "Show More" / collapsed sections
4. Sentinel signals readiness via `chrome.storage.session`
5. Side panel receives signal → runs extraction
6. If no signal within 3s → side panel extracts anyway (fallback)

**Why not sentinel-only:** If the MutationObserver fails (permissions, CSP, browser bugs), the user would never get a scan. The fallback guarantees extraction always happens.

**Consequences:**
- Content script must be registered for `<all_urls>` matching job board patterns
- Adds ~2KB to extension bundle (minimal sentinel, not full scanner)
- Requires `webNavigation` permission (already have it)

### ADR-SCAN-2: Per-Field Confidence Scoring

**Decision:** Every extracted field carries a confidence score based on its extraction source layer.

**Confidence scale:**

| Source | Confidence | Rationale |
|---|---|---|
| JSON-LD `JobPosting` | 0.95 | Structured data, high fidelity |
| Board-specific CSS selector | 0.85 | Maintained selectors, site-specific |
| Generic CSS wildcard | 0.60 | Heuristic, may grab wrong element |
| OpenGraph / meta tags | 0.40 | Often site name, not job-specific |
| AI LLM extraction | 0.90 | High quality but variable by page complexity |
| User manual edit | 1.00 | Ground truth |

**Completeness score:** Weighted average across required fields:
- `title` (weight: 0.25), `company` (weight: 0.25), `description` (weight: 0.35), `location` (weight: 0.10), `salary` (weight: 0.05)

**Usage:**
- Completeness < 0.7 → triggers heuristic fallback (Layer 4)
- After heuristic, still < 0.7 → triggers AI fallback (Layer 5)
- Completeness < 0.8 → triggers delayed verification re-scan
- Confidence metadata stored in scan-store (not persisted to backend)

### ADR-SCAN-3: Sequential Fallback (Heuristic → AI)

**Decision:** When rule-based extraction is incomplete, try expanded heuristics first, then AI extraction if still incomplete.

**Rationale:** User chose "both in sequence" — heuristic-first is instant and free, AI adds 1-2s latency and ~$0.001/call. Most incomplete extractions can be rescued by expanded heuristics (hidden content reading, accordion expansion). AI is the safety net for truly unstructured pages.

**Heuristic Layer (Layer 4):**
- Read hidden content directly (CSS `display: none` elements that contain full descriptions)
- Expand `<details>` elements, accordion sections
- Apply Readability.js-style content extraction (inline implementation)
- Extended generic CSS selectors for common patterns

**AI Layer (Layer 5):**
- Triggered only when heuristic still produces completeness < 0.7
- Side panel sends cleaned HTML to `POST /v1/ai/extract-job`
- HTML preparation: strip `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>` tags
- Send `<main>` or `<article>` content if available, otherwise `<body>` (max 8000 chars)
- Uses fast/cheap model (Haiku or equivalent)
- Returns structured JSON matching JobData schema
- One AI call per scan maximum (no retry on AI failure)

### ADR-SCAN-4: Cooldown State in chrome.storage.session

**Decision:** Move the `recentlyScanned` cooldown map from in-memory to `chrome.storage.session`.

**Context:** Chrome pauses service workers after ~30s of inactivity. The current in-memory `Map` is lost on restart, causing duplicate scans. `chrome.storage.session` persists across SW restarts but clears when the browser session ends (not synced, not persisted to disk).

**Implementation:**
```typescript
const COOLDOWN_KEY = 'jobswyft-scan-cooldown';

async function wasRecentlyScanned(url: string): Promise<boolean> {
  const data = await chrome.storage.session.get(COOLDOWN_KEY);
  const map: Record<string, number> = data[COOLDOWN_KEY] ?? {};
  const now = Date.now();
  // Prune expired entries
  for (const [key, time] of Object.entries(map)) {
    if (now - time > SCAN_COOLDOWN_MS) delete map[key];
  }
  if (map[url] && now - map[url] < SCAN_COOLDOWN_MS) return true;
  map[url] = now;
  await chrome.storage.session.set({ [COOLDOWN_KEY]: map });
  return false;
}
```

### ADR-SCAN-5: Delayed Verification with Subtle Indicator

**Decision:** When initial extraction completeness < 0.8, schedule a re-scan after 5 seconds with a subtle "refining..." badge on the JobCard.

**UX:**
- Initial result renders immediately (fast perceived performance)
- Small badge/pill below the JobCard header: `"Refining..."` with a subtle pulse
- After re-scan completes: badge disappears, fields update if better data found
- If no improvement: badge disappears, original data preserved
- No AI re-call on verification pass (rule-based only)

**Why not silent:** User indicated preference for subtle indicator. This builds trust — users know the system is working to improve, not just showing incomplete data.

### ADR-SCAN-6: Hash-Based SPA Trigger

**Decision:** Add `chrome.webNavigation.onReferenceFragmentUpdated` as a 4th detection trigger.

**Context:** Some ATS platforms (certain Workday implementations, custom career sites) use hash-based routing (`#/job/123`). The existing three triggers miss these transitions. This is a low-effort, high-impact addition.

### ADR-SCAN-7: Strict Success Validation

**Decision:** Change scan success check from `if (title || description || company)` to `if (title && company)` minimum, with description strongly encouraged.

**Rationale:** The current OR-based check means a scan with only a title (no company, no description) is treated as "success" and displayed. This leads to poor quality data flowing to match analysis and save. Title AND company are the minimum viable extraction. Description is critical for AI features but should trigger a warning, not a block.

**Implementation:**
- `title && company` → success, render JobCard
- Missing description → render with warning indicator + encourage edit
- Missing title OR company → error state, suggest manual entry/edit

### ADR-SCAN-8: Board-Aware Extraction (Activate getJobBoard)

**Decision:** Wire `getJobBoard(url)` into the extraction pipeline to enable board-specific extraction strategies.

**Context:** `getJobBoard()` already exists and returns the board name, but is never called. Connecting it to the scanner allows:
- Board-specific CSS selectors (already organized by board in scanner.ts but not selected by board)
- Board-specific "Show More" button selectors
- Board-specific content readiness signals in the sentinel
- Future: board-specific selector versioning

---

## 4. Data Model Extensions

### ExtractionResult (Internal — Not Persisted to Backend)

```typescript
interface ExtractionConfidence {
  overall: number;           // 0-1, weighted average of required fields
  completeness: number;      // Fraction of non-empty required fields (0-1)
  perField: Record<string, {
    confidence: number;      // 0-1
    source: ExtractionSource;
  }>;
}

type ExtractionSource =
  | 'json-ld'
  | 'css-board-specific'
  | 'css-generic'
  | 'og-meta'
  | 'heuristic'
  | 'ai-llm'
  | 'user-edit';

interface ExtractionResult {
  data: JobData;
  confidence: ExtractionConfidence;
  board: string | null;      // From getJobBoard()
  extractedAt: number;       // Timestamp
  isRefinement: boolean;     // True if this is a delayed verification result
}
```

### Scan Store Extensions

```typescript
interface ScanState {
  // Existing fields...
  scanStatus: 'idle' | 'scanning' | 'success' | 'error';
  jobData: JobData | null;

  // New fields
  confidence: ExtractionConfidence | null;
  isRefining: boolean;       // True while delayed verification is pending
  board: string | null;      // Detected job board name
}
```

### API: POST /v1/ai/extract-job (New Endpoint)

```python
class ExtractJobRequest(BaseModel):
    html_content: str        # Cleaned HTML, max 8000 chars
    source_url: str          # For context/logging
    partial_data: dict       # What rule-based extraction already found

class ExtractJobResponse(BaseModel):
    title: str | None
    company: str | None
    description: str | None
    location: str | None
    salary: str | None
    employment_type: str | None
```

**Endpoint behavior:**
- Uses fast model (Haiku or equivalent)
- Structured output via tool use / function calling
- Returns only fields with values — empty fields omitted
- Merges with `partial_data` on the client side
- No credit cost (extraction is infrastructure, not a user-facing AI feature)
- Rate limited: 50 extractions/user/day

---

## 5. Content Sentinel Design

### Purpose
Lightweight content script that monitors DOM readiness and prepares the page for extraction.

### Responsibilities
1. **Content readiness detection** — MutationObserver watches for board-specific signals
2. **Auto-expand hidden content** — Clicks "Show More", opens `<details>`, expands accordions
3. **Signal side panel** — Sets `chrome.storage.session` flag when content is ready

### Readiness Signals (Board-Specific)

| Board | Ready When | Loading Indicator |
|---|---|---|
| LinkedIn | `.jobs-description__content` exists AND no `*[class*="--loading"]` | `.jobs-ghost-fadein-placeholder` |
| Indeed | `#jobDescriptionText` exists | `.jobsearch-ViewJobLayout--loading` |
| Greenhouse | `.content .body` exists | None (server-rendered) |
| Lever | `.posting-page` exists | None (server-rendered) |
| Workday | `[data-automation-id="jobPostingDescription"]` exists | `[class*="spinner"]` |
| Generic | `document.readyState === "complete"` + 500ms | None |

### "Show More" Expansion Selectors

```typescript
const SHOW_MORE_SELECTORS = [
  '.show-more-less-html__button--more',           // LinkedIn
  'button[aria-label="Show full description"]',    // Indeed
  '[class*="show-more"]:not([class*="less"])',     // Generic
  'button[class*="expand"]',                       // Generic
  '[aria-expanded="false"]',                       // ARIA pattern
  'details:not([open])',                            // HTML5 details
];
```

### Content Script Registration

```typescript
// In wxt.config.ts or as a separate entrypoint
export default defineContentScript({
  matches: [
    '*://*.linkedin.com/jobs/*',
    '*://*.indeed.com/*',
    '*://boards.greenhouse.io/*',
    '*://jobs.lever.co/*',
    '*://*.myworkdayjobs.com/*',
    '*://*.glassdoor.com/job-listing/*',
    // ... other known boards
  ],
  runAt: 'document_idle',
  main() {
    // Lightweight sentinel logic
  }
});
```

### Size Budget
- Target: < 3KB bundled
- No React, no Zustand, no UI
- Pure DOM observation + storage signaling

---

## 6. Cleanup: Dead Code Removal

The following should be removed as part of engine hardening:

| File | Issue | Action |
|---|---|---|
| `apps/extension/src/lib/message-types.ts` | Entire file unused — V2 uses storage signaling, not messages | Delete |
| `job-detector.ts: getJobBoard()` | Currently dead code | Wire into extraction pipeline (ADR-SCAN-8) |
| In-memory `recentlyScanned` Map | Volatile, lost on SW restart | Replace with `chrome.storage.session` (ADR-SCAN-4) |

---

## 7. Performance Budget

| Metric | Target | Current | Notes |
|---|---|---|---|
| **Time to JobCard** (rule-based) | < 2s | ~2.5s (1.5s delay + extraction) | Sentinel reduces to ~1s for fast pages |
| **Time to JobCard** (with AI fallback) | < 4s | N/A | AI adds ~1.5-2s only when needed |
| **Content script size** | < 3KB | N/A (new) | Sentinel only, no scanner |
| **Scanner function size** | < 15KB | ~10KB | Self-contained, no imports |
| **AI fallback trigger rate** | < 20% of scans | N/A | JSON-LD + CSS handles ~80%+ |
| **Delayed verification trigger rate** | < 30% of scans | N/A | Most pages load content before initial extraction |

---

## 8. Security Considerations

- **AI extraction endpoint** rate-limited to 50/user/day (prevents abuse)
- **HTML content** sent to AI endpoint is sanitized server-side (strip scripts, limit size)
- **Content sentinel** only runs on matched job board URLs, not `<all_urls>`
- **No user data** included in AI extraction requests (no resume, no profile)
- **Board detection patterns** validated against safe URL schemes (HTTPS only)

---

## 9. Testing Strategy

| Test Type | Scope | Tool |
|---|---|---|
| **Unit: job-detector** | URL pattern matching, board detection | Vitest |
| **Unit: confidence scoring** | Validation logic, completeness calculation | Vitest |
| **Unit: field merger** | Multi-source field selection, confidence tracking | Vitest |
| **Unit: scan-store** | State transitions, persistence, save flow | Vitest |
| **Integration: extraction pipeline** | JSON-LD + CSS + OG layers with mock DOM | Vitest + JSDOM |
| **E2E: LinkedIn scan** | Full flow from URL detection to JobCard render | Manual (Chrome) |
| **E2E: delayed verification** | Incomplete scan → re-scan → field update | Manual (Chrome) |
| **Snapshot: HTML fixtures** | Saved HTML from LinkedIn/Indeed/Greenhouse for regression | Vitest |

**HTML fixtures approach:** Download and save representative job page HTML from major boards. Use these as regression tests for selector changes. When a selector breaks in production, save the broken HTML as a new fixture.

---

## 10. Phasing

### EXT-5.5: Engine Hardening (This Story)
- Content sentinel + fallback timeout
- Confidence scoring + field validation
- Strict success validation
- Cooldown in `chrome.storage.session`
- Hash-based SPA trigger
- "Show More" auto-expansion
- Heuristic fallback layer
- AI extraction fallback (backend endpoint)
- Delayed verification with "refining..." indicator
- Dead code cleanup
- Wire `getJobBoard()` into pipeline
- HTML fixture tests for top 5 boards

### EXT-5.6: Element Picker (Separate Story)
- SVG overlay + hover detection
- CSS selector generation (optimal-select)
- Field → element association workflow
- User correction storage (domain, field, selector)
- Analytics: which boards fail most

### Future: Self-Healing Selectors
- Monitor extraction failure rates per domain
- Alert when a board's success rate drops below threshold
- Use stored user corrections to suggest selector updates
- Eventually: automated selector regeneration via AI

---

## References

- [Schema.org JobPosting Adoption Analysis](https://skeptric.com/schema-jobposting/)
- [LinkedIn Job Scanner (Chrome Extension)](https://dev.to/lico/chrome-extension-linkedin-job-scanner-1m96)
- [llm-scraper](https://github.com/mishushakov/llm-scraper) — Zod schema + LLM structured extraction
- [optimal-select](https://github.com/autarc/optimal-select) — CSS selector generation
- [Self-Healing Scrapers (Kadoa)](https://www.kadoa.com/blog/autogenerate-self-healing-web-scrapers)
- [Self-Healing Scraper Patterns 2025](https://www.botsol.com/blog/whats-new-in-web-scraping-2025-ai-driven-self-healing)
- [Crawl4AI Extraction Strategies](https://docs.crawl4ai.com/extraction/no-llm-strategies/)
- [Chrome Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [Chrome webNavigation API](https://developer.chrome.com/docs/extensions/reference/api/webNavigation)
