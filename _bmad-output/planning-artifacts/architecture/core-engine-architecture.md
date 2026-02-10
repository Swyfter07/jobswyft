# Core Engine Architecture — Extraction, Element Picker, Autofill & Telemetry

> **Addendum to:** [Architecture Decision Document](./index.md)
> **Supersedes:** [Scan Engine Architecture](./scan-engine-architecture.md) (which remains as EXT-5/5.5 historical record)
> **Scope:** Unified architecture for scanning, element picker, autofill, selector registry, telemetry, and learning
> **Status:** Draft — 2026-02-08
> **Decisions by:** jobswyft + Winston (Architect Agent)

---

## 1. Philosophy & Design Principles

The Core Engine is the foundation every downstream feature depends on. Match analysis, cover letters, coaching, autofill — all of it starts with accurate data extraction and ends with reliable DOM interaction.

### Guiding Principles

| # | Principle | Implication |
|---|-----------|-------------|
| P1 | **Rule-based first, AI as fallback** | AI is expensive and slow. The rule engine must handle 80%+ of cases. AI fills gaps and feeds learning. |
| P2 | **Speed is a feature** | Target: scan result in <2s (rule-based), <4s (with AI). Users won't wait 10–30s. |
| P3 | **Every interaction teaches** | User corrections, element picks, successful fills — all feed back into selector quality metrics. |
| P4 | **Auditable by default** | Every extraction and fill produces a trace. When something goes wrong, you can reconstruct exactly what happened. |
| P5 | **Shared infrastructure** | Scanning (reads DOM) and autofill (writes DOM) share the same sentinel, selector engine, and telemetry layer. |
| P6 | **Graceful degradation** | If CSS selectors break, heuristics kick in. If heuristics fail, AI kicks in. If AI fails, the user can manually correct via element picker. Every layer is a safety net for the one above. |

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE ENGINE                                      │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Selector    │  │   Content    │  │  Extraction  │  │  Telemetry │  │
│  │   Registry    │  │   Sentinel   │  │    Trace     │  │   Client   │  │
│  │              │  │              │  │              │  │            │  │
│  │  Board defs  │  │  DOM ready   │  │  Per-field   │  │  Events →  │  │
│  │  Selectors   │  │  Show More   │  │  journey     │  │  Backend   │  │
│  │  Priority    │  │  Observer    │  │  recording   │  │            │  │
│  │  Health      │  │              │  │              │  │            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                │          │
│  ┌──────┴─────────────────┴─────────────────┴────────────────┴──────┐   │
│  │                      SHARED CORE LAYER                            │   │
│  │  - Selector execution (querySelector + trace)                     │   │
│  │  - Board detection (URL pattern matching)                         │   │
│  │  - Frame aggregation (multi-frame merge)                          │   │
│  │  - Confidence scoring (source → score mapping)                    │   │
│  │  - Correction recording (user edit → feedback event)              │   │
│  └──────┬──────────────────────────────────┬────────────────────────┘   │
│         │                                  │                            │
│  ┌──────┴──────────┐              ┌────────┴────────────┐               │
│  │  SCAN ENGINE    │              │  AUTOFILL ENGINE    │               │
│  │  (reads DOM)    │              │  (writes DOM)       │               │
│  │                 │              │                     │               │
│  │  Extract job    │              │  Detect form fields │               │
│  │  data from page │              │  Map to user data   │               │
│  │                 │              │  Fill + undo        │               │
│  │  → JobCard UI   │              │  Resume upload      │               │
│  └─────────────────┘              └─────────────────────┘               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ELEMENT PICKER (user-initiated, shared by scan + autofill)      │   │
│  │  - SVG overlay on active tab                                     │   │
│  │  - User clicks element → selector generated                      │   │
│  │  - Selector stored as correction → feeds learning                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Current Implementation: Scanning Engine

### 3.1 What Shipped (EXT-5 + EXT-5.5)

Three commits, ~6,200 lines across 47 files:

| Commit | Scope |
|--------|-------|
| `3f192bf` EXT-5 | Core scanner (5-layer cascade, 55+ CSS selectors, 28 URL patterns), JobCard, scan-store, background triggers |
| `e308c7f` EXT-5.5 | Confidence scoring, content sentinel, AI fallback endpoint (`POST /v1/ai/extract-job`), session cooldowns |
| `ff9e401` EXT-5.5 fix | Frame aggregator rewrite (LinkedIn SPA), AI model/timeout tuning |

### 3.2 Module Map

```
apps/extension/src/
├── entrypoints/
│   ├── background/index.ts          # 4 navigation triggers, cooldown, storage signaling
│   └── content-sentinel.content.ts  # MutationObserver, Show More expansion, readiness signal
├── features/scanning/
│   ├── scanner.ts                   # Self-contained scraper (443 lines, zero imports)
│   ├── frame-aggregator.ts          # Multi-frame merge (quality scoring)
│   ├── extraction-validator.ts      # Confidence scoring, completeness, validation
│   ├── html-cleaner.ts              # Page HTML → cleaned 8KB for AI fallback
│   └── job-detector.ts              # 28 URL patterns, board identification
├── stores/
│   ├── scan-store.ts                # Zustand + chrome.storage persistence
│   └── sidebar-store.ts             # Four-state model, tab management
├── components/
│   └── authenticated-layout.tsx     # performScan() orchestration, storage listeners
└── lib/
    ├── api-client.ts                # extractJobWithAI(), saveJob()
    └── constants.ts                 # Storage keys, API URL

apps/api/app/
├── routers/ai.py                    # POST /v1/ai/extract-job endpoint
├── services/extract_job_service.py  # LLM extraction, 50/day rate limit
└── models/ai.py                     # ExtractJobRequest/Response

packages/ui/src/components/features/
├── job-card.tsx                     # View/edit mode, accent header
└── scan-empty-state.tsx             # Empty state with manual scan button
```

### 3.3 Extraction Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  scrapeJobPage(board?)  — injected via chrome.scripting.executeScript │
│                                                                      │
│  For each field (title, company, description, location, salary,      │
│  employmentType): try each layer in order, stop on first match.      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Layer 1: JSON-LD                                  conf 0.95 │     │
│  │                                                             │     │
│  │ Parse all <script type="application/ld+json"> blocks        │     │
│  │ Recursive search for @type: "JobPosting" (handles @graph)   │     │
│  │ Extract: title, hiringOrganization.name, description        │     │
│  │          (HTML→text), jobLocation, baseSalary, employmentType│     │
│  │ Stop on first JobPosting found.                             │     │
│  │                                                             │     │
│  │ Best case: one JSON-LD block fills all 6 fields.            │     │
│  │ Reality: ~40% of job pages have JSON-LD (Indeed, Greenhouse  │     │
│  │ usually do; LinkedIn sometimes does).                       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                    │ fields still empty?                              │
│                    v                                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Layer 2: CSS Selectors                       conf 0.85/0.60 │     │
│  │                                                             │     │
│  │ Board-specific selectors first, then generic fallback.      │     │
│  │ qs() helper: iterate selector array, return first non-empty │     │
│  │ textContent match.                                          │     │
│  │                                                             │     │
│  │ Title:       17 selectors (LinkedIn ×8, Indeed ×2, etc.)    │     │
│  │ Company:     10 selectors + og:site_name fallback           │     │
│  │ Description: 27 selectors (8 boards + generic patterns)     │     │
│  │ Location:     8 selectors                                   │     │
│  │ Salary:       6 selectors + currency regex validation       │     │
│  │ EmployType:   2 selectors                                   │     │
│  │                                                             │     │
│  │ Title validated via isValidJobTitle() — rejects             │     │
│  │ "Top job picks", "Recommended for you", etc.                │     │
│  │ Notification prefix stripped: "(3) " → ""                   │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                    │ fields still empty?                              │
│                    v                                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Layer 3: OpenGraph Meta                           conf 0.40 │     │
│  │                                                             │     │
│  │ <meta property="og:title"> for title only.                  │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                    │ fields still empty?                              │
│                    v                                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Layer 4: Generic Fallback                         conf 0.30 │     │
│  │                                                             │     │
│  │ Title: document.title.split(/[|\-–—]/).shift()              │     │
│  │ Description: <meta name="description">                      │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                    │ fields still empty?                              │
│                    v                                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Layer 5: Heuristic                                conf 0.30 │     │
│  │                                                             │     │
│  │ Only runs if title OR company OR description missing/short. │     │
│  │ Expand <details>, click [aria-expanded="false"],            │     │
│  │ read CSS-hidden content, extended generic selectors.         │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Post-processing:                                                    │
│  Strip heading prefixes ("About the job", "Job Description", etc.)   │
│                                                                      │
│  RETURNS: { title, company, description, location, salary,           │
│             employmentType, sourceUrl, sources: Record<string,string>}│
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Post-Extraction Pipeline (Side Panel)

```
performScan(tabId) in authenticated-layout.tsx:

  1. executeScript → scrapeJobPage (all frames)
  2. aggregateFrameResults() → best frame wins, gaps filled
  3. validateExtraction() → confidence + completeness score
  4. completeness < 0.7?
     YES → cleanHtmlForAI() → POST /v1/ai/extract-job → merge
     NO  → continue
  5. title && company present?
     YES → setScanResult() → JobCard renders
     NO  → setScanError() → error state
  6. completeness < 0.8?
     YES → setTimeout(5s) → re-scan (rule-based only) → "Refining..." badge
```

### 3.5 Known Gaps in Current Implementation

| # | Gap | Impact | Section Addressing It |
|---|-----|--------|-----------------------|
| G1 | `_board` param is never read inside scanner — all 55+ selectors run on every page | Wasted work, no board filtering | §4 Selector Registry |
| G2 | `qs()` discards which selector matched | Can't trace why a value was extracted | §5 Extraction Trace |
| G3 | Source tags inconsistent (`<meta name>` tagged as `"og-meta"`) | Misleading confidence scores | §5 Extraction Trace |
| G4 | Description source preserved from Layer 1 when Layer 2 overwrites value | Source doesn't match value | §5 Extraction Trace |
| G5 | User edits in JobCard don't feed back to selector quality | No learning from corrections | §7 Correction Feedback Loop |
| G6 | No way for user to point at a DOM element and say "that's the salary" | Manual editing only — not targeted | §6 Element Picker |
| G7 | No backend telemetry for scan quality | Can't see trends, can't detect selector rot | §8 Backend Telemetry |
| G8 | Scanner function is 443-line monolith (Chrome constraint) | Hard to add/remove selectors | §4 Selector Registry |

---

## 4. Selector Registry

### 4.1 Problem

Selectors are hardcoded inline in a 443-line function that must have zero imports (Chrome serialization). Adding a selector for a new job board means editing this monolith. There's no way to version, deprecate, or measure selector health.

### 4.2 Design: Registry-as-Data

The selector registry is a **JSON-serializable data structure** passed as a function argument to `scrapeJobPage()`. Chrome's `args` parameter handles serialization. The scanner function stays self-contained — it just reads from the arg instead of inline arrays.

```typescript
// features/scanning/selector-registry.ts

export interface SelectorEntry {
  id: string;                // Unique ID, e.g., "li-title-unified-v3"
  board: string;             // "linkedin" | "indeed" | ... | "generic"
  field: string;             // "title" | "company" | "description" | "location" | "salary" | "employmentType"
  selectors: string[];       // CSS selectors, tried in order within this entry
  priority: number;          // Lower = tried first (within same board+field)
  added: string;             // ISO date when selector was added
  lastVerified?: string;     // Last confirmed working date
  status: "active" | "degraded" | "deprecated";
  notes?: string;            // Context, e.g., "LinkedIn redesign Q1 2026"
}

export const SELECTOR_REGISTRY: SelectorEntry[] = [
  // ─── LinkedIn: Title ──────────────────────────────────
  {
    id: "li-title-unified-v3",
    board: "linkedin",
    field: "title",
    selectors: [
      ".job-details-jobs-unified-top-card__job-title h1",
      ".job-details-jobs-unified-top-card__job-title a",
      ".job-details-jobs-unified-top-card__job-title",
    ],
    priority: 10,
    added: "2026-02-01",
    lastVerified: "2026-02-08",
    status: "active",
  },
  {
    id: "li-title-legacy-v1",
    board: "linkedin",
    field: "title",
    selectors: [
      ".jobs-unified-top-card__job-title a",
      ".jobs-unified-top-card__job-title",
    ],
    priority: 20,
    added: "2026-01-15",
    lastVerified: "2026-01-28",
    status: "degraded",
    notes: "Old LinkedIn layout, still seen on some profiles",
  },
  // ... 40+ more entries covering all boards and fields
];
```

### 4.3 Injection

```typescript
// In authenticated-layout.tsx (performScan)
import { SELECTOR_REGISTRY } from "@/features/scanning/selector-registry";

const results = await chrome.scripting.executeScript({
  target: { tabId, allFrames: true },
  func: scrapeJobPage,
  args: [board, SELECTOR_REGISTRY, { trace: true }],
});
```

### 4.4 Scanner Reads Registry

```typescript
// Inside scrapeJobPage — still zero imports, registry comes via args
export function scrapeJobPage(
  board: string | null,
  registry: SelectorEntry[],
  options?: { trace?: boolean }
) {
  // Filter to relevant selectors for THIS board + generic fallbacks
  const relevantSelectors = registry
    .filter(r => r.status !== "deprecated")
    .filter(r => r.board === board || r.board === "generic")
    .sort((a, b) => a.priority - b.priority);

  // Layer 2 becomes data-driven instead of hardcoded
  for (const field of FIELDS) {
    if (data[field]) continue; // filled by Layer 1 (JSON-LD)

    const fieldEntries = relevantSelectors.filter(r => r.field === field);
    for (const entry of fieldEntries) {
      for (const sel of entry.selectors) {
        const el = document.querySelector(sel);
        const text = el?.textContent?.trim();
        // ... trace recording (see §5)
        if (text && validate(field, text)) {
          data[field] = clean(text);
          sources[field] = entry.board === "generic" ? "css-generic" : "css-board";
          sourceSelectorId[field] = entry.id;
          break;
        }
      }
      if (data[field]) break;
    }
  }
}
```

### 4.5 Benefits

| Before | After |
|--------|-------|
| Add selector = edit 443-line function | Add selector = add entry to registry array |
| All 55 selectors run on every page | Only board-relevant selectors run |
| Can't deprecate a selector | `status: "deprecated"` skips it |
| No version history | `added`, `lastVerified`, `status` track lifecycle |
| No way to measure selector health | Telemetry + corrections per `entry.id` |

---

## 5. Extraction Trace

### 5.1 Problem

The current `sources` object is a flat `Record<string, string>` — it tells you WHICH layer provided the final value but not WHY. When something goes wrong on a specific page, you can't reconstruct what happened.

### 5.2 Design: Per-Field Trace

Every field records its full extraction journey — every layer attempted, every selector tried, every rejection reason.

```typescript
// features/scanning/extraction-trace.ts

export interface TraceAttempt {
  layer: "json-ld" | "css" | "og-meta" | "generic-fallback" | "heuristic";
  attempted: true;
  matched: boolean;
  selectorId?: string;       // From registry, e.g., "li-title-unified-v3"
  selector?: string;         // Actual CSS selector string
  rawValue?: string;         // What was extracted before cleaning
  cleanedValue?: string;     // After clean()
  accepted: boolean;         // Did it pass validation?
  rejectionReason?: string;  // e.g., "failed_isValidJobTitle", "empty", "placeholder"
}

export interface FieldTrace {
  field: string;
  finalValue: string;
  finalSource: string;            // "json-ld" | "css-board" | etc.
  finalSelectorId?: string;       // Which registry entry provided the value
  attempts: TraceAttempt[];
  attemptCount: number;           // Total selectors tried
  matchCount: number;             // Selectors that found something
  timeMs?: number;                // Time spent extracting this field
}

export interface ExtractionTrace {
  fields: FieldTrace[];
  board: string | null;
  url: string;
  timestamp: number;
  totalTimeMs: number;
  registryVersion?: string;       // Hash/version of selector registry used
  frameCount: number;             // How many frames were scanned
  winningFrameId: number;         // Which frame produced the best result
  aiTriggered: boolean;           // Whether AI fallback was needed
  aiTimeMs?: number;              // If AI triggered, how long it took
  completeness: number;           // Final completeness score
  confidence: Record<string, number>; // Final per-field confidence
}
```

### 5.3 Trace Example (LinkedIn Scan)

```json
{
  "fields": [
    {
      "field": "title",
      "finalValue": "Senior Backend Engineer",
      "finalSource": "css-board",
      "finalSelectorId": "li-title-unified-v3",
      "attempts": [
        {
          "layer": "json-ld",
          "attempted": true,
          "matched": false,
          "accepted": false,
          "rejectionReason": "no_job_posting_block"
        },
        {
          "layer": "css",
          "attempted": true,
          "matched": false,
          "selectorId": "li-title-unified-v3",
          "selector": ".job-details-jobs-unified-top-card__job-title h1",
          "accepted": false,
          "rejectionReason": "empty"
        },
        {
          "layer": "css",
          "attempted": true,
          "matched": true,
          "selectorId": "li-title-unified-v3",
          "selector": ".job-details-jobs-unified-top-card__job-title a",
          "rawValue": "(3) Senior Backend Engineer",
          "cleanedValue": "Senior Backend Engineer",
          "accepted": true
        }
      ],
      "attemptCount": 3,
      "matchCount": 1,
      "timeMs": 12
    }
  ],
  "board": "linkedin",
  "url": "https://www.linkedin.com/jobs/view/12345",
  "timestamp": 1707350400000,
  "totalTimeMs": 85,
  "frameCount": 3,
  "winningFrameId": 1,
  "aiTriggered": false,
  "completeness": 0.92
}
```

### 5.4 Trace Storage

- **In scan-store:** Full trace stored alongside `jobData`. Persisted to `chrome.storage.local`.
- **On save:** When user saves job (`POST /v1/jobs/scan`), a summarized trace is sent to the telemetry endpoint (see §8).
- **Debug panel:** Collapsible trace viewer in side panel (dev mode only) for real-time debugging.
- **Trace is optional:** Controlled by `options.trace` flag. Can be disabled in production if storage is a concern, though it's typically <2KB per scan.

---

## 6. Element Picker

### 6.1 Problem

When scanning extracts wrong data for a field, the user's only option is manual text editing in the JobCard. But the correct value is RIGHT THERE on the page — the user can see it. They should be able to point at it.

### 6.2 User Flow

```
User sees: JobCard with salary = "" (missing)
        or JobCard with title = "Top job picks" (wrong)

  1. User clicks the ✏️ pick icon next to the field in JobCard

  2. Side panel sends message → content script activates picker overlay

  3. Content script injects SVG overlay on the tab:
     - Semi-transparent overlay covers entire page
     - As user hovers, the hovered DOM element is highlighted
       with a colored border + tooltip showing element tag + text preview
     - Cursor changes to crosshair

  4. User clicks on the correct element (e.g., the salary text on the page)

  5. Content script:
     a. Extracts textContent from the clicked element
     b. Generates a stable CSS selector for the element (see §6.4)
     c. Walks UP the DOM hierarchy to find the most stable ancestor selector
     d. Sends { value, selector, elementPath } back to side panel

  6. Side panel:
     a. Updates the field value in scan-store
     b. Records a CorrectionEvent (see §7)
     c. Removes the overlay
     d. Shows brief "Updated" confirmation on the field
```

### 6.3 Overlay Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  ACTIVE TAB (job page)                                          │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PICKER OVERLAY (injected by content script)              │  │
│  │                                                           │  │
│  │  - Full-viewport SVG overlay (pointer-events: none        │  │
│  │    except on highlighted element)                         │  │
│  │  - mousemove listener on document                         │  │
│  │  - elementFromPoint(x, y) identifies hovered element      │  │
│  │  - Highlight box drawn around hovered element             │  │
│  │  - Click captures element → extracts data → removes       │  │
│  │    overlay                                                │  │
│  │  - Escape key cancels picker                              │  │
│  │                                                           │  │
│  │  Visual:                                                  │  │
│  │  ┌──────────────────────────────────────────────┐         │  │
│  │  │  $120,000 - $150,000/year                    │ ← blue  │  │
│  │  │                                    highlight  │         │  │
│  │  └──────────────────────────────────────────────┘         │  │
│  │  Tooltip: "span.salary-range • $120,000 - $150,000/year"  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Communication: chrome.runtime.sendMessage ↔ Side Panel          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Selector Generation: Finding the RIGHT Selector

This is the critical insight — the element the user clicks may not be the one you should target in future scans. A `<span>` inside a `<div>` inside a card — the span is too specific (might have a random class), but the card-level container has a stable class name.

**Strategy: Walk Up, Score Stability**

```typescript
function generateStableSelector(element: HTMLElement): SelectorCandidate[] {
  const candidates: SelectorCandidate[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && depth < 6) {
    const sel = buildSelector(current);
    candidates.push({
      selector: sel.full,          // e.g., "div.salary-info > span"
      specificity: sel.specificity, // How unique is this selector on the page?
      stability: scoreStability(current), // Does it use stable class names?
      depth: depth,                // Distance from clicked element
      matchCount: document.querySelectorAll(sel.full).length, // Uniqueness check
      textContent: current.textContent?.trim().substring(0, 200),
    });
    current = current.parentElement;
    depth++;
  }

  // Return candidates sorted by stability score
  return candidates.sort((a, b) => b.stability - a.stability);
}

function scoreStability(el: HTMLElement): number {
  let score = 0;

  // data-testid attributes are highly stable (added intentionally by developers)
  if (el.dataset.testid) score += 50;
  if (el.getAttribute('data-automation-id')) score += 50;

  // Semantic class names are moderately stable
  const classes = el.className.toString();
  if (/salary|compensation|pay/i.test(classes)) score += 30;
  if (/title|position|role/i.test(classes)) score += 30;
  if (/company|employer|org/i.test(classes)) score += 30;
  if (/location|address|region/i.test(classes)) score += 30;
  if (/description|details|content/i.test(classes)) score += 20;

  // Hash-like or generated class names are unstable
  if (/[a-f0-9]{6,}|__[a-z]{5,}|css-[a-z0-9]/i.test(classes)) score -= 20;

  // IDs are usually stable
  if (el.id && !/\d{4,}/.test(el.id)) score += 40;

  // Semantic HTML tags are stable
  if (['article', 'main', 'section', 'h1', 'h2', 'h3'].includes(el.tagName.toLowerCase())) score += 15;

  // ARIA attributes are intentional and stable
  if (el.getAttribute('role')) score += 20;
  if (el.getAttribute('aria-label')) score += 15;

  return score;
}
```

**What Gets Stored:**

```typescript
interface ElementPickResult {
  // What the user selected
  value: string;                     // Cleaned text content
  rawValue: string;                  // Unprocessed text content

  // The clicked element
  clickedSelector: string;           // Exact selector for the clicked element
  clickedTag: string;                // e.g., "span"

  // The BEST stable ancestor (what we should use in future scans)
  stableSelector: string;            // Highest-stability ancestor selector
  stableScore: number;               // Stability score

  // All candidates (for learning/review)
  candidates: SelectorCandidate[];   // Full hierarchy with scores

  // Context
  board: string | null;
  url: string;
  field: string;                     // Which job field this corrects
  timestamp: number;
}
```

### 6.5 Element Picker for Autofill (Write Mode)

The same picker is reused for autofill, but in reverse:

- **Scan mode:** "Click where the SALARY is" → reads textContent
- **Autofill mode:** "Click where NAME should go" → identifies input/textarea to fill

In autofill mode, the picker:
1. Highlights only interactive elements (`<input>`, `<textarea>`, `<select>`, `[contenteditable]`)
2. Shows a tooltip with the field type and current value
3. On click, maps the input to the user's data field
4. Records the mapping for future visits to the same domain

### 6.6 Content Script: `element-picker.content.ts`

Separate content script from the sentinel. Injected on-demand (not on every page load).

```
apps/extension/src/features/core/
├── element-picker.content.ts     # Overlay, hover detection, selector generation
├── selector-generator.ts         # DOM → stable CSS selector
└── element-picker.types.ts       # Shared types for picker ↔ side panel
```

**Size budget:** < 8KB bundled. No React, no heavy dependencies. Pure DOM manipulation.

---

## 7. Correction Feedback Loop

### 7.1 Problem

When a user edits a field in the JobCard (or picks an element), that's a signal: "the scan engine got this wrong." Today, that signal is lost. The corrected value is saved, but there's no record of what was wrong, where it came from, or what the user thinks is correct.

### 7.2 CorrectionEvent

Every user correction creates an event:

```typescript
interface CorrectionEvent {
  // What was wrong
  field: string;                    // "title" | "company" | "description" | etc.
  originalValue: string;            // What the scan engine extracted
  originalSource: ExtractionSource; // "json-ld" | "css-board" | etc.
  originalSelectorId?: string;      // Which registry entry was responsible

  // What the user says is correct
  correctedValue: string;
  correctionMethod: "inline-edit" | "element-picker";

  // If element picker was used
  pickerResult?: ElementPickResult; // Full picker result including stable selector

  // Context
  board: string | null;
  url: string;
  domain: string;                   // e.g., "linkedin.com"
  timestamp: number;

  // Trace reference
  traceId?: string;                 // Links to the ExtractionTrace that produced the original
}
```

### 7.3 Local Storage

Corrections accumulate in `chrome.storage.local` under a rolling buffer:

```typescript
const CORRECTIONS_KEY = "jobswyft-corrections";
const MAX_LOCAL_CORRECTIONS = 500; // Rolling buffer, oldest dropped

// On user edit or element pick:
async function recordCorrection(event: CorrectionEvent) {
  const data = await chrome.storage.local.get(CORRECTIONS_KEY);
  const corrections: CorrectionEvent[] = data[CORRECTIONS_KEY] ?? [];
  corrections.push(event);
  // Trim to buffer size
  if (corrections.length > MAX_LOCAL_CORRECTIONS) {
    corrections.splice(0, corrections.length - MAX_LOCAL_CORRECTIONS);
  }
  await chrome.storage.local.set({ [CORRECTIONS_KEY]: corrections });
}
```

### 7.4 Learning Signals

Even without a backend, corrections provide immediate local learning:

```
Per selector (aggregated from correction events):

  Selector: "li-title-unified-v3"
  ├── Hit count:       142        (times this selector provided a value)
  ├── Correction count: 12        (times user overrode this selector's value)
  ├── Accuracy:        91.5%      (1 - corrections/hits)
  ├── Last hit:        2026-02-08
  ├── Last correction: 2026-02-07
  └── Status signal:   ACTIVE ✓

  Selector: "li-salary-highlight-v1"
  ├── Hit count:        38
  ├── Correction count: 14
  ├── Accuracy:        63.2%      ← DEGRADED (below 70% threshold)
  ├── Last hit:        2026-02-08
  ├── Last correction: 2026-02-08
  └── Status signal:   DEGRADED ⚠️   → should be reviewed

Per board (aggregated):

  Board: linkedin
  ├── Avg completeness: 0.78
  ├── AI fallback rate: 22%
  ├── Most corrected:   salary (37% correction rate)
  └── Element picks:    8 (users used picker 8 times)
```

### 7.5 Learning from Element Picker Selections

When a user picks an element, the `stableSelector` from §6.4 becomes a **candidate for the selector registry**. If multiple users on the same domain pick the same stable selector for the same field, that's a strong signal to add it to the registry.

```
User picks salary on linkedin.com/jobs/view/123
  → stableSelector: ".job-details-jobs-unified-top-card__job-insight--highlight"
  → stableScore: 45

User picks salary on linkedin.com/jobs/view/456
  → stableSelector: ".job-details-jobs-unified-top-card__job-insight--highlight"
  → stableScore: 45

Signal: same domain, same field, same stable selector, picked 2+ times
  → Candidate for registry addition as a new SelectorEntry
```

---

## 8. Backend Telemetry

### 8.1 Why Backend

Local telemetry (chrome.storage) is limited to one user's data. Backend telemetry aggregates across all users, enabling:

- **Selector health dashboards** — which selectors are breaking across the user base
- **Board-level quality metrics** — which job boards have the worst extraction rates
- **AI fallback cost tracking** — how much AI extraction is being triggered
- **Element picker patterns** — common corrections that should become registry entries

### 8.2 Data Model

```python
# apps/api/app/models/telemetry.py

class ScanEvent(BaseModel):
    """Sent when a scan completes (success or failure)."""
    event_type: Literal["scan_complete"]
    board: str | None
    domain: str
    url_hash: str              # SHA256 of URL (not the URL itself, for privacy)
    completeness: float        # 0-1
    ai_triggered: bool
    ai_time_ms: int | None
    total_time_ms: int
    fields_extracted: int      # How many of 6 fields were filled
    field_sources: dict        # { "title": "json-ld", "company": "css-board", ... }
    field_selector_ids: dict   # { "title": "li-title-v3", ... }
    success: bool
    timestamp: str             # ISO 8601

class CorrectionEvent(BaseModel):
    """Sent when a user corrects an extracted field."""
    event_type: Literal["field_correction"]
    board: str | None
    domain: str
    field: str
    original_source: str
    original_selector_id: str | None
    correction_method: Literal["inline-edit", "element-picker"]
    # NO values sent — we don't need the actual text, just the signal
    stable_selector: str | None    # From element picker, if used
    stable_score: float | None
    timestamp: str

class AutofillEvent(BaseModel):
    """Sent when an autofill completes."""
    event_type: Literal["autofill_complete"]
    domain: str
    fields_detected: int
    fields_mapped: int
    fields_filled: int
    fields_undone: int         # If user used undo
    fill_time_ms: int
    timestamp: str
```

### 8.3 API Endpoint

```
POST /v1/telemetry/events
Content-Type: application/json
Authorization: Bearer <token>

{
  "events": [
    { "event_type": "scan_complete", ... },
    { "event_type": "field_correction", ... }
  ]
}
```

- **Batched:** Client batches events and sends every 30 seconds or on extension unload.
- **Best-effort:** If the endpoint fails, events are kept in local storage and retried next session.
- **No PII:** No actual field values, no URLs (only hashed), no user-identifiable data beyond the auth token.
- **Rate limit:** 100 events/user/hour (more than enough for normal usage).

### 8.4 Backend Storage

```sql
-- Lightweight telemetry table (append-only)
CREATE TABLE scan_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,      -- "scan_complete", "field_correction", "autofill_complete"
  payload JSONB NOT NULL,         -- Full event payload
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for aggregation queries
CREATE INDEX idx_telemetry_event_type ON scan_telemetry (event_type, created_at);
CREATE INDEX idx_telemetry_board ON scan_telemetry ((payload->>'board'), created_at);
```

### 8.5 Aggregation Views (Future Dashboard)

```sql
-- Selector health: correction rate per selector
SELECT
  payload->>'original_selector_id' AS selector_id,
  payload->>'board' AS board,
  payload->>'field' AS field,
  COUNT(*) AS correction_count,
  MAX(created_at) AS last_correction
FROM scan_telemetry
WHERE event_type = 'field_correction'
  AND created_at > now() - interval '7 days'
GROUP BY 1, 2, 3
ORDER BY correction_count DESC;

-- Board quality: avg completeness + AI fallback rate
SELECT
  payload->>'board' AS board,
  AVG((payload->>'completeness')::float) AS avg_completeness,
  AVG(CASE WHEN (payload->>'ai_triggered')::boolean THEN 1 ELSE 0 END) AS ai_fallback_rate,
  COUNT(*) AS scan_count
FROM scan_telemetry
WHERE event_type = 'scan_complete'
  AND created_at > now() - interval '7 days'
GROUP BY 1
ORDER BY scan_count DESC;
```

---

## 9. Shared Core Engine: Scan + Autofill

### 9.1 What's Shared

Scanning and autofill are two sides of the same coin:

| Capability | Scan Engine | Autofill Engine |
|-----------|-------------|-----------------|
| **Direction** | Reads DOM → extracts data | Writes data → fills DOM |
| **Content Sentinel** | ✅ Detects when job content is ready | ✅ Detects when form fields are ready |
| **Board Detection** | ✅ `getJobBoard(url)` for selector filtering | ✅ Same — ATS forms have board-specific layouts |
| **Selector Registry** | ✅ CSS selectors for reading values | ✅ CSS selectors for finding inputs to fill |
| **Element Picker** | ✅ "That's the salary" (read mode) | ✅ "Put name here" (write mode) |
| **Confidence Scoring** | ✅ How sure are we about extracted value? | ✅ How sure are we this is the name field? |
| **Correction Feedback** | ✅ User edits wrong extraction | ✅ User unmaps a wrong mapping |
| **Telemetry** | ✅ Scan events | ✅ Autofill events |
| **Frame Aggregation** | ✅ Multi-frame extraction | ⬜ Usually single-frame (forms rarely in iframes) |
| **AI Fallback** | ✅ LLM extracts from HTML | 🔮 Future: LLM identifies form fields |

### 9.2 Shared Module Structure

```
apps/extension/src/features/core/
├── selector-registry.ts           # SHARED: Board selectors for both read + write
├── selector-executor.ts           # SHARED: Run selectors with tracing
├── board-detector.ts              # SHARED: Moved from scanning/job-detector.ts
├── element-picker.content.ts      # SHARED: Visual DOM element picker
├── selector-generator.ts          # SHARED: DOM → stable CSS selector
├── extraction-trace.ts            # SHARED: Trace types and utilities
├── correction-recorder.ts         # SHARED: CorrectionEvent recording
├── telemetry-client.ts            # SHARED: Batched event sending
└── types.ts                       # SHARED: Core engine types

apps/extension/src/features/scanning/
├── scanner.ts                     # SCAN-SPECIFIC: Injected extraction function
├── frame-aggregator.ts            # SCAN-SPECIFIC: Multi-frame merge
├── extraction-validator.ts        # SCAN-SPECIFIC: Confidence scoring
├── html-cleaner.ts                # SCAN-SPECIFIC: Page cleanup for AI fallback
└── content-sentinel.content.ts    # SHARED (used by both scan and autofill)

apps/extension/src/features/autofill/
├── field-detector.ts              # AUTOFILL-SPECIFIC: Detect form inputs
├── field-mapper.ts                # AUTOFILL-SPECIFIC: Map inputs to user data
├── field-filler.ts                # AUTOFILL-SPECIFIC: DOM write + highlight
├── undo-manager.ts                # AUTOFILL-SPECIFIC: Snapshot + restore
└── resume-uploader.ts             # AUTOFILL-SPECIFIC: File input handling
```

### 9.3 Content Sentinel: Dual Purpose

The sentinel already watches for job content readiness. It should also detect form fields:

```
Content Sentinel Modes:

  JOB CONTENT MODE (current):
    Watch for: .jobs-description__content, #jobDescriptionText, etc.
    Action: Expand "Show More", signal readiness
    Triggers: Scan engine

  FORM FIELD MODE (new):
    Watch for: input[type="text"], textarea, select, [type="file"]
    Action: Count detected fields, signal field readiness
    Triggers: Autofill engine, state → "full-power"

  Both modes run simultaneously on application pages (which have
  both job content AND form fields).
```

### 9.4 Selector Registry: Read + Write Entries

The registry gains a `mode` field:

```typescript
export interface SelectorEntry {
  // ... existing fields
  mode: "read" | "write" | "both";  // NEW
  // "read"  = scan engine uses this to extract values
  // "write" = autofill engine uses this to find inputs to fill
  // "both"  = shared (e.g., detecting if an element exists)
}

// Example: autofill registry entries
{
  id: "generic-name-input",
  board: "generic",
  field: "name",
  mode: "write",
  selectors: [
    'input[name="name"]',
    'input[autocomplete="name"]',
    'input[name*="full_name"]',
    'input[placeholder*="name" i]',
    'input[aria-label*="name" i]',
  ],
  priority: 10,
  status: "active",
}
```

---

## 10. Autofill Engine Architecture

### 10.1 Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTOFILL PIPELINE                                               │
│                                                                  │
│  1. DETECTION (field-detector.ts)                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Scan DOM for form elements:                                │  │
│  │ - <input> (text, email, tel, url, file)                   │  │
│  │ - <textarea>                                               │  │
│  │ - <select>                                                 │  │
│  │ - [contenteditable="true"]                                 │  │
│  │                                                            │  │
│  │ For each element, record:                                  │  │
│  │ - elementRef (CSS selector to relocate it)                 │  │
│  │ - fieldType (inferred from name/label/placeholder/aria)    │  │
│  │ - currentValue (for undo snapshot)                         │  │
│  │ - confidence (how sure we are about fieldType)             │  │
│  │ - label (human-readable label for the field)               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         v                                        │
│  2. MAPPING (field-mapper.ts)                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Map detected fields to user data:                          │  │
│  │ - Use registry selectors (mode: "write")                   │  │
│  │ - Match field names/labels to data keys:                   │  │
│  │   "Full Name" / name / full_name → userData.name           │  │
│  │   "Email" / email → userData.email                         │  │
│  │   "Resume" / file input → resume PDF download              │  │
│  │   "Cover Letter" / textarea → generated cover letter       │  │
│  │                                                            │  │
│  │ Confidence scoring for mappings:                           │  │
│  │   exact match (name="email"):   0.95                       │  │
│  │   autocomplete attr:            0.90                       │  │
│  │   placeholder match:            0.75                       │  │
│  │   label text match:             0.70                       │  │
│  │   aria-label match:             0.65                       │  │
│  │   heuristic (nearby text):      0.40                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         v                                        │
│  3. REVIEW (Autofill UI Component)                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Side panel shows:                                          │  │
│  │ - Detected fields grouped by category                      │  │
│  │ - Status per field: ready / missing / already-filled       │  │
│  │ - Low-confidence mappings flagged for user review          │  │
│  │ - "Fill Application" button                                │  │
│  │ - Option to use element picker for unmapped fields         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         │ user clicks "Fill"                     │
│                         v                                        │
│  4. FILL (field-filler.ts via content script)                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ For each mapped field (sequential, 600ms stagger):         │  │
│  │                                                            │  │
│  │ a. Snapshot current value (for undo)                       │  │
│  │ b. Set value on DOM element                                │  │
│  │ c. Dispatch input/change/blur events (framework compat)    │  │
│  │ d. Add visual highlight (green border flash)               │  │
│  │ e. Report status back to side panel                        │  │
│  │                                                            │  │
│  │ File uploads:                                              │  │
│  │ - Download resume PDF via signed URL                       │  │
│  │ - Set via DataTransfer API on file input                   │  │
│  │                                                            │  │
│  │ Cover letter:                                              │  │
│  │ - Paste into textarea/contenteditable                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         v                                        │
│  5. UNDO (undo-manager.ts)                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ If user clicks "Undo" (10s window):                        │  │
│  │ - Restore all fields to pre-fill values from snapshot      │  │
│  │ - Remove visual highlights                                 │  │
│  │ - Record undo event in telemetry                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  6. TELEMETRY                                                    │
│  Record: fields_detected, fields_mapped, fields_filled,          │
│  fields_undone, mapping_confidence_avg, fill_time_ms             │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Form Detection via Sentinel

The content sentinel gains a second observation mode:

```typescript
// In content-sentinel.content.ts — new form detection logic

const FORM_READINESS_SELECTORS = [
  'form input[type="text"]',
  'form input[type="email"]',
  'form textarea',
  'input[name*="name"]',
  'input[autocomplete]',
];

function detectFormFields(): number {
  let count = 0;
  for (const sel of FORM_READINESS_SELECTORS) {
    count += document.querySelectorAll(sel).length;
  }
  return count;
}

// Signal form detection alongside content readiness
if (formFieldCount >= 3) {
  chrome.storage.session.set({
    [FORM_DETECTED_KEY]: {
      url: window.location.href,
      fieldCount: formFieldCount,
      timestamp: Date.now(),
    }
  });
}
```

This signal triggers the sidebar state transition to "full-power" (autofill tab unlocks).

---

## 11. Performance Strategy

### 11.1 Performance Budget

| Metric | Target | Strategy |
|--------|--------|----------|
| Scan → JobCard (rule-based) | **< 1.5s** | Sentinel signals readiness, no fixed delay. Registry filters by board. |
| Scan → JobCard (with AI) | **< 4s** | AI only when completeness < 0.7. Fast model (Haiku). 35s hard timeout. |
| Element picker activation | **< 200ms** | Lightweight overlay, no React. |
| Autofill detection | **< 500ms** | Sentinel detects forms alongside job content. |
| Autofill fill execution | **< 4s** | 600ms stagger × ~6 fields. Parallel for hidden fields. |
| Telemetry send | **0ms (async)** | Batched, background, best-effort. Never blocks UI. |

### 11.2 AI Call Minimization

```
Goal: AI fallback triggers on < 20% of scans

Strategy:
  1. JSON-LD covers ~40% of pages (Indeed, Greenhouse, many ATS platforms)
  2. Board-specific CSS covers another ~35% (LinkedIn, Glassdoor, Lever)
  3. Generic CSS + heuristics cover ~10%
  4. AI fallback handles the remaining ~15%

  ┌─────────────────────────────────────────────────────────────────┐
  │  EXTRACTION SUCCESS BY LAYER (target distribution)              │
  │                                                                  │
  │  JSON-LD          ████████████████████████░░░░░░░░░░░░  40%    │
  │  CSS Board        ██████████████████░░░░░░░░░░░░░░░░░░  35%    │
  │  CSS Generic +    █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10%    │
  │  Heuristic                                                      │
  │  AI Fallback      ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  15%    │
  │                                                                  │
  │  User correction  Feeds back → improves CSS layer over time     │
  └─────────────────────────────────────────────────────────────────┘

Feedback loop:
  - Element picker selections → new registry entries → fewer AI calls
  - Correction events → degraded selectors identified → fixed proactively
  - AI results → extracted values become training signal for new selectors
```

### 11.3 Caching

```
Per-domain selector cache (chrome.storage.session):

  If a scan on linkedin.com used selectors [A, B, C] successfully,
  cache that combo. Next scan on linkedin.com tries [A, B, C] first
  before falling through the full registry.

  Cache invalidation: 24 hours or on extension update.
```

---

## 12. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Element picker overlay → clickjacking risk | Overlay is injected by the extension (trusted context), not by the page. Escape always cancels. |
| Telemetry data → privacy | No field values sent. URLs are SHA256-hashed. Only structural metadata (source types, selectors, confidence scores). |
| Autofill writes to page DOM | User must explicitly click "Fill." Undo available for 10s. No auto-fill without user action. |
| AI extraction → prompt injection | HTML is sanitized (scripts stripped, 8KB truncated). Server-side validation. Structured output only. |
| Selector registry → malicious selectors | Registry ships with the extension (not fetched remotely). No user-injectable selectors in production builds. |
| Resume upload → file access | Resume PDF fetched via signed URL (1h expiry). Extension doesn't access local filesystem. |

---

## 13. Phasing & Roadmap

### Phase 1: Selector Registry + Trace (EXT-5.6)
**Scope:** Refactor scanner.ts to use registry, add extraction trace.
- Extract 55+ hardcoded selectors into `selector-registry.ts`
- Change `scrapeJobPage` signature to accept registry as arg
- Add `ExtractionTrace` to scanner return value
- Store trace in scan-store alongside jobData
- Dev-mode trace viewer (collapsible panel)
- **No backend changes needed.**

### Phase 2: Element Picker + Corrections (EXT-5.7)
**Scope:** User can point at elements to correct scanned fields.
- `element-picker.content.ts` with overlay and hover detection
- `selector-generator.ts` with stability scoring
- Correction event recording in chrome.storage.local
- JobCard gains per-field "pick" icon
- Local correction analytics (selector hit/correction rates)

### Phase 3: Backend Telemetry (API.7)
**Scope:** Server-side aggregation for cross-user insights.
- `POST /v1/telemetry/events` endpoint
- `scan_telemetry` table (append-only, JSONB payload)
- Batched client-side telemetry sender
- Aggregation SQL views for selector health + board quality

### Phase 4: Autofill Engine (EXT-9 + shared core)
**Scope:** Form detection, field mapping, fill execution.
- Refactor sentinel for dual-purpose (job content + form detection)
- Move shared modules to `features/core/`
- `field-detector.ts`, `field-mapper.ts`, `field-filler.ts`
- `autofill-store.ts` with undo snapshot
- Element picker in write mode (for unmapped fields)
- Resume upload via DataTransfer API
- Autofill telemetry events

### Phase 5: Learning & Adaptation (Future)
**Scope:** Semi-automated selector improvement.
- Dashboard: selector health, board quality, AI fallback trends
- Alert when a board's success rate drops below threshold
- Element picker selections → candidate registry entries (manual review)
- AI-assisted selector regeneration for degraded entries
- A/B testing for selector alternatives

---

## 14. ADR Summary

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-SCAN-1 | Content sentinel with fallback timeout | Implemented (EXT-5.5) |
| ADR-SCAN-2 | Per-field confidence scoring | Implemented (EXT-5.5) |
| ADR-SCAN-3 | Sequential fallback (heuristic → AI) | Implemented (EXT-5.5) |
| ADR-SCAN-4 | Cooldown in chrome.storage.session | Implemented (EXT-5.5) |
| ADR-SCAN-5 | Delayed verification with refining badge | Implemented (EXT-5.5) |
| ADR-SCAN-6 | Hash-based SPA trigger | Implemented (EXT-5.5) |
| ADR-SCAN-7 | Strict success validation (title && company) | Implemented (EXT-5.5) |
| ADR-SCAN-8 | Board-aware extraction via getJobBoard | Partially (board passed but unused in scanner) |
| ADR-CORE-1 | Selector registry as injected data | **New — this document** |
| ADR-CORE-2 | Extraction trace per field | **New — this document** |
| ADR-CORE-3 | Element picker with stability-scored selectors | **New — this document** |
| ADR-CORE-4 | Correction feedback loop | **New — this document** |
| ADR-CORE-5 | Backend telemetry (batched, no PII) | **New — this document** |
| ADR-CORE-6 | Shared core for scan + autofill | **New — this document** |
| ADR-CORE-7 | Dual-purpose sentinel (content + forms) | **New — this document** |

---

## References

- [Previous: Scan Engine Architecture](./scan-engine-architecture.md) — EXT-5/5.5 decisions (historical)
- [Story EXT.9: Form Autofill](../epics/story-ext9-form-autofill.md) — Autofill acceptance criteria
- [optimal-select](https://github.com/autarc/optimal-select) — CSS selector generation library
- [Schema.org JobPosting](https://schema.org/JobPosting) — JSON-LD standard for job listings
- [Chrome Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting) — executeScript with args
- [Self-Healing Scrapers (Kadoa)](https://www.kadoa.com/blog/autogenerate-self-healing-web-scrapers)
- [Crawl4AI Extraction Strategies](https://docs.crawl4ai.com/extraction/no-llm-strategies/)
