# Story EXT.5.5: Scan Engine Hardening — Confidence, Sentinel, AI Fallback

**As a** job seeker using the extension on diverse job boards,
**I want** the scan engine to reliably extract complete job data even on pages where the initial extraction is incomplete,
**So that** I always have accurate job details for matching, saving, and AI features without manual intervention.

**FRs addressed:** FR14 (auto-scan robustness), FR15-FR18 (field extraction completeness), FR22 (missing field handling)

**Depends on:** EXT.5 (complete)
**Blocked by:** None
**Enables:** EXT.6 (match analysis quality depends on extraction quality)

**Architecture reference:** [Scan Engine Architecture](../architecture/scan-engine-architecture.md)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Modified | `scanner.ts` | Extension `features/scanning/` | Confidence scoring, `@graph` handling, Show More, heuristic layer |
| Unchanged | `job-detector.ts` | Extension `features/scanning/` | Already exports `getJobBoard()` — no changes needed |
| Modified | `background/index.ts` | Extension `entrypoints/background/` | 4th trigger, session storage cooldown, sentinel integration |
| Modified | `authenticated-layout.tsx` | Extension `components/` | Verification re-scan, refining badge, strict validation, AI fallback |
| Modified | `scan-store.ts` | Extension `stores/` | Confidence state, isRefining, board name |
| New | `content-sentinel.ts` | Extension `entrypoints/` | MutationObserver + Show More expansion |
| New | `extraction-validator.ts` | Extension `features/scanning/` | Confidence scoring + field validation |
| New | `html-cleaner.ts` | Extension `features/scanning/` | DOM→cleaned HTML for AI fallback |
| Deleted | `message-types.ts` | Extension `lib/` | Dead code cleanup |
| New (API) | `POST /v1/ai/extract-job` | API `routers/` | LLM-based extraction fallback |

## Acceptance Criteria

**AC1 — Content Sentinel:** Given the user navigates to a known job board, when the content sentinel detects that job content has loaded (via MutationObserver + board-specific signals), then the side panel begins extraction immediately (no fixed delay). If the sentinel does not signal within 3 seconds, extraction proceeds anyway as a fallback.

**AC2 — Show More Expansion:** Given a job page has a truncated description behind a "Show More" button (LinkedIn, Indeed, Glassdoor), when the content sentinel runs, then it programmatically expands all collapsed/truncated sections before signaling readiness. The extracted description should be the full text, not the truncated preview.

**AC3 — Confidence Scoring:** Given extraction completes from any layer, when results are merged, then each field carries a confidence score (0-1) based on its extraction source. The overall completeness score is computed as a weighted average of required fields.

**AC4 — Strict Success Validation:** Given extraction produces results, when the merger evaluates success, then `title AND company` are both required for success. Missing description triggers a warning indicator but does not block rendering. Missing title OR company triggers error state with manual entry prompt.

**AC5 — Heuristic Fallback:** Given rule-based extraction (JSON-LD + CSS + OG) produces completeness < 0.7, when the heuristic layer runs, then it reads hidden content (CSS-hidden elements), expands `<details>`/accordion sections, and applies extended generic selectors to fill missing fields.

**AC6 — AI Extraction Fallback:** Given heuristic fallback still produces completeness < 0.7, when the side panel calls `POST /v1/ai/extract-job` with cleaned page HTML, then the backend uses a fast LLM model to extract structured job data, and the result is merged with existing partial data (AI fills only empty fields).

**AC7 — Delayed Verification:** Given initial extraction completeness < 0.8, when 5 seconds have elapsed, then a re-scan runs (rule-based only, no AI). A subtle "Refining..." badge appears on the JobCard during verification. If re-scan finds better data, fields update silently and badge disappears. If no improvement, badge disappears and original data is kept.

**AC8 — Service Worker Cooldown Persistence:** Given the background service worker restarts (Chrome pauses it), when the user navigates back to a recently-scanned URL within the 30s cooldown window, then the cooldown is still respected (no duplicate scan). Cooldown data uses `chrome.storage.session`.

**AC9 — Hash-Based SPA Detection:** Given a job board uses hash-based routing (e.g., `#/job/123`), when the URL fragment changes, then `webNavigation.onReferenceFragmentUpdated` triggers detection and auto-scan.

**AC10 — Board-Aware Extraction:** Given `getJobBoard(url)` identifies the job board, when extraction runs, then the board name is passed through the pipeline and available in scan-store for debugging and analytics.

**AC11 — Dead Code Cleanup:** `message-types.ts` is deleted. No remaining imports reference it.

## Tasks / Subtasks

### Task 1: Extraction Validator Module (AC: #3, #4, #5)
- [ ] 1.1 Create `apps/extension/src/features/scanning/extraction-validator.ts`
  - `computeFieldConfidence(field, value, source): number`
  - `computeCompleteness(data, confidenceMap): number` — weighted average
  - `validateExtraction(data): { isValid, issues, completeness, confidence }`
  - Field weights: title 0.25, company 0.25, description 0.35, location 0.10, salary 0.05
  - Cross-field checks: title-contains-company, suspicious lengths, placeholder detection ("N/A", "UNAVAILABLE")
- [ ] 1.2 Create `apps/extension/src/features/scanning/extraction-validator.test.ts`
  - Tests for each validation rule, edge cases (empty strings, very long strings, placeholders)
  - Tests for completeness scoring with various field combinations
- [ ] 1.3 Export `ExtractionConfidence`, `ExtractionSource`, `ValidationResult` types

### Task 2: Scanner Enhancements (AC: #3, #5)
- [ ] 2.1 Add `@graph` array handling to JSON-LD layer
  - Recurse into `@graph` arrays to find `JobPosting` type
  - Handle nested arrays and mixed type graphs
- [ ] 2.2 Add heuristic fallback layer (Layer 4) inside `scrapeJobPage()`
  - Read CSS-hidden content: `document.querySelectorAll('[style*="display: none"], [style*="max-height"]')` — extract `textContent` from elements whose parent containers match description patterns
  - Expand `<details>` elements: `details:not([open])` → set `.open = true`
  - Expand accordion sections: `[aria-expanded="false"]` → `.click()`
  - Extended generic selectors: `[role="main"] p`, `article p`, `.content p`
- [ ] 2.3 Track extraction source per field
  - Return `{ data: JobData, sources: Record<string, ExtractionSource> }` from `scrapeJobPage()`
  - Each field records which layer produced it
- [ ] 2.4 Add `board` parameter to `scrapeJobPage()` — currently unused but available for future board-specific selector ordering

### Task 3: Content Sentinel (AC: #1, #2)
- [ ] 3.1 Create `apps/extension/src/entrypoints/content-sentinel.ts` (WXT content script)
  - `matches`: Known job board URL patterns (NOT `<all_urls>`)
  - `runAt`: `document_idle`
  - MutationObserver watches for board-specific readiness signals
  - Board detection via URL pattern (reuse patterns from `job-detector.ts`)
- [ ] 3.2 Implement "Show More" auto-expansion
  - Click selectors: LinkedIn `.show-more-less-html__button--more`, Indeed `button[aria-label="Show full description"]`, generic `[class*="show-more"]`, `[aria-expanded="false"]`, `details:not([open])`
  - Wait 500ms after expansion before signaling ready
  - Read hidden content directly where possible (LinkedIn `.show-more-less-html__markup` has full text in DOM even when collapsed)
- [ ] 3.3 Signal readiness via `chrome.storage.session.set({ 'jobswyft-content-ready': { tabId, url, timestamp } })`
- [ ] 3.4 Register content script in `wxt.config.ts` with appropriate URL matches
- [ ] 3.5 Size budget check: bundled sentinel must be < 3KB

### Task 4: Background Service Worker Updates (AC: #8, #9, #10)
- [ ] 4.1 Replace in-memory `recentlyScanned` Map with `chrome.storage.session`
  - `wasRecentlyScanned(url)` reads/writes session storage
  - Prune expired entries on every check
  - Survives service worker restart
- [ ] 4.2 Add 4th trigger: `chrome.webNavigation.onReferenceFragmentUpdated`
  - Filter for `frameId === 0` (main frame only)
  - Check against `detectJobPage(details.url)`
  - Same cooldown and delay logic as other triggers
- [ ] 4.3 Integrate content sentinel signal
  - Listen for `chrome.storage.session` changes with key `jobswyft-content-ready`
  - Forward to side panel via existing `jobswyft-auto-scan-request` storage key
  - If sentinel signals, cancel the fallback timeout (no double-scan)
- [ ] 4.4 Pass `board` from `getJobBoard(url)` in the auto-scan signal payload

### Task 5: Authenticated Layout — Pipeline Orchestration (AC: #4, #6, #7, #10)
- [ ] 5.1 Update `performScan(tabId)` to use confidence scoring
  - After `scrapeJobPage()` returns, compute confidence via `validateExtraction()`
  - If `completeness < 0.7` → run heuristic layer (already in scanner via Task 2.2)
  - If still `< 0.7` → trigger AI fallback (Task 6)
- [ ] 5.2 Implement strict success validation
  - `title && company` required → success
  - Missing description → render with warning, set `confidence.completeness` accordingly
  - Missing title OR company → error state with retry + manual entry
- [ ] 5.3 Wire delayed verification
  - If `completeness < 0.8` after initial scan → `scanStore.setRefining(true)`
  - `setTimeout(5000)` → re-run `performScan(tabId)` (rule-based only, no AI)
  - Compare completeness: if better → `scanStore.setScanResult(newData)`, else keep original
  - `scanStore.setRefining(false)` when done
- [ ] 5.4 Listen for content sentinel readiness signal
  - `chrome.storage.onChanged` listener for `jobswyft-content-ready` key
  - If sentinel signal arrives before fallback timeout → trigger scan immediately, cancel timeout
- [ ] 5.5 Pass `board` from scan signal to `performScan()` and store in scan-store
- [ ] 5.6 Fix timestamp dedup: use `crypto.randomUUID()` instead of timestamp for dedup key

### Task 6: AI Extraction Fallback — Client Side (AC: #6)
- [ ] 6.1 Create `apps/extension/src/features/scanning/html-cleaner.ts`
  - `cleanHtmlForAI(tabId): Promise<string>` — inject a cleaning function via `executeScript`
  - Strip `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>`, `<aside>` tags
  - Prefer `<main>` or `<article>` content if present
  - Truncate to 8000 chars max
  - Return cleaned HTML string
- [ ] 6.2 Add `extractJobWithAI(token, html, sourceUrl, partialData)` to `api-client.ts`
  - `POST /v1/ai/extract-job`
  - Send `{ html_content, source_url, partial_data }`
  - Returns `{ title?, company?, description?, location?, salary?, employment_type? }`
  - 5-second timeout via AbortController
- [ ] 6.3 Wire into `performScan()` flow
  - After heuristic fallback, if `completeness < 0.7`:
    - Call `cleanHtmlForAI(tabId)` to get cleaned HTML
    - Call `extractJobWithAI()` with cleaned HTML + partial data
    - Merge AI results: AI fills only fields that are empty/low-confidence
    - Set source as `'ai-llm'` for AI-provided fields
  - Catch errors gracefully — AI failure should not block the scan result
  - One AI call per scan maximum

### Task 7: AI Extraction Fallback — Backend Endpoint (AC: #6)
- [ ] 7.1 Create `apps/api/app/routers/ai_extract.py`
  - `POST /v1/ai/extract-job`
  - Request: `{ html_content: str, source_url: str, partial_data: dict }`
  - Uses fast model (Haiku or equivalent) with structured output
  - Prompt: "Extract job posting details from this HTML. Return only fields with values."
  - Response: `{ success: true, data: { title?, company?, description?, location?, salary?, employment_type? } }`
- [ ] 7.2 Rate limit: 50 extractions/user/day
  - Use existing rate limiting infrastructure from `usage_events`
  - Operation type: `"extraction"` (separate from match/chat/cover-letter)
- [ ] 7.3 No credit cost — extraction is infrastructure (like scanning), not a user-facing AI feature
- [ ] 7.4 Register router in `app/main.py`
- [ ] 7.5 Add tests for the endpoint

### Task 8: Scan Store Extensions (AC: #3, #7, #10)
- [ ] 8.1 Add `confidence: ExtractionConfidence | null` to scan-store state
- [ ] 8.2 Add `isRefining: boolean` — true while delayed verification is pending
- [ ] 8.3 Add `board: string | null` — detected job board name
- [ ] 8.4 Add actions: `setRefining(value)`, `setConfidence(conf)`, `setBoard(name)`
- [ ] 8.5 Update `setScanResult()` to accept optional confidence and board
- [ ] 8.6 Add `isRefining` to the `partialize` persistence (so badge state survives side panel re-render)
- [ ] 8.7 Update scan-store tests for new state shape

### Task 9: UI — Refining Badge (AC: #7)
- [ ] 9.1 Add subtle "Refining..." badge to JobCard
  - Render below card header when `isRefining === true`
  - Style: `text-micro text-muted-foreground` with subtle pulse animation (`animate-pulse` from Tailwind)
  - Badge: `<span className="text-micro text-muted-foreground animate-pulse">Refining...</span>`
  - Respects `prefers-reduced-motion` (no animation, just text)
- [ ] 9.2 Update confidence display (optional, low priority)
  - If confidence data exists, show a small completeness indicator next to field labels
  - Only for fields with confidence < 0.7 — subtle warning icon

### Task 10: Dead Code Cleanup (AC: #11)
- [ ] 10.1 Delete `apps/extension/src/lib/message-types.ts`
- [ ] 10.2 Search entire codebase for any remaining imports of `message-types` — remove them
- [ ] 10.3 Verify build succeeds after deletion

### Task 11: HTML Fixture Tests (Regression)
- [ ] 11.1 Create `apps/extension/src/features/scanning/__fixtures__/` directory
- [ ] 11.2 Save representative HTML from top 5 boards: LinkedIn, Indeed, Greenhouse, Lever, Workday
  - Save as `.html` files (one per board, actual job page content)
  - Strip any personal/auth content
- [ ] 11.3 Create `scanner.integration.test.ts`
  - Load each fixture HTML into JSDOM
  - Run extraction (mock `scrapeJobPage()` logic — note: can't use `executeScript` in tests)
  - Assert expected fields are extracted
  - Assert confidence scores are reasonable
- [ ] 11.4 Update extraction-validator tests with fixture data

### Task 12: Build & Validation
- [ ] 12.1 `pnpm test` in `packages/ui` — no regressions
- [ ] 12.2 Extension unit tests: validator, scan-store, job-detector
- [ ] 12.3 `npm run build` in `apps/extension` — verify content sentinel bundled, < 3KB
- [ ] 12.4 `pytest` in `apps/api` — new extract endpoint tests pass
- [ ] 12.5 Manual test: LinkedIn scan → verify sentinel triggers, Show More expanded, full description
- [ ] 12.6 Manual test: Unknown site → verify heuristic fallback, then AI fallback
- [ ] 12.7 Manual test: Delayed verification → verify "Refining..." badge appears and disappears
- [ ] 12.8 Manual test: Close/reopen extension during scan → cooldown respected
- [ ] 12.9 Manual test: Hash-based SPA navigation → scan triggers

## Dev Notes

### Guardrails

**Self-Contained Scanner Constraint:**
The `scrapeJobPage()` function MUST remain self-contained (no imports, no closures) because it's serialized and injected via `chrome.scripting.executeScript({ func })`. Any new extraction logic (heuristic layer, confidence tracking) must be written inline within the function.

**Content Sentinel ≠ Scanner:**
The content sentinel is a *separate* content script from the scanner. The sentinel only observes and signals — it does NOT extract data. Extraction still happens via `executeScript` from the side panel. This keeps the two concerns cleanly separated.

**AI Fallback Is Optional:**
If the `POST /v1/ai/extract-job` endpoint fails, the scan should still succeed with whatever rule-based data was extracted. AI failure must never block the scan result.

**One AI Call Per Scan:**
The delayed verification re-scan does NOT trigger AI fallback. Only the initial scan can invoke AI. This keeps costs predictable and prevents cascading API calls.

### Design Language Rules (Unchanged from EXT-5)
- ZERO hardcoded colors — all from `globals.css` semantic tokens
- Dark + Light mode — test both
- `size-X` pattern for icons
- `.text-micro` for 10px text
- `border-2 border-card-accent-border` for accent cards
- `animate-pulse` for refining badge (respects `prefers-reduced-motion`)

### API Contract

**New endpoint: `POST /v1/ai/extract-job`**
- Auth: Required (Bearer token)
- Rate limit: 50/user/day (separate from AI credits)
- Cost: Free (no credit deduction)
- Request: `{ html_content: string (max 8000 chars), source_url: string, partial_data: object }`
- Response: `{ success: true, data: { title?, company?, description?, location?, salary?, employment_type? } }`
- Error: `{ success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "..." } }`

### Project Structure Notes

**New files to create:**
```
apps/extension/src/
├── entrypoints/
│   └── content-sentinel.ts              # NEW — lightweight MutationObserver
├── features/
│   └── scanning/
│       ├── extraction-validator.ts       # NEW — confidence + validation
│       ├── extraction-validator.test.ts  # NEW — tests
│       ├── html-cleaner.ts              # NEW — DOM→cleaned HTML for AI
│       └── __fixtures__/                # NEW — HTML test fixtures
│           ├── linkedin-job.html
│           ├── indeed-job.html
│           ├── greenhouse-job.html
│           ├── lever-job.html
│           └── workday-job.html

apps/api/app/
├── routers/
│   └── ai_extract.py                    # NEW — LLM extraction endpoint
```

**Files to modify:**
```
apps/extension/src/
├── features/scanning/scanner.ts          # MODIFY — @graph, heuristic layer, source tracking
├── features/scanning/job-detector.ts     # MODIFY — wire getJobBoard into exports
├── entrypoints/background/index.ts       # MODIFY — session storage, 4th trigger, sentinel
├── components/authenticated-layout.tsx   # MODIFY — pipeline orchestration, verification, AI
├── stores/scan-store.ts                  # MODIFY — confidence, isRefining, board
├── lib/api-client.ts                     # MODIFY — extractJobWithAI method

apps/api/app/
├── main.py                               # MODIFY — register ai_extract router
```

**Files to delete:**
```
apps/extension/src/lib/message-types.ts   # DELETE — dead code
```

### References

- [Scan Engine Architecture](../architecture/scan-engine-architecture.md) — ADR-SCAN-1 through ADR-SCAN-8
- [EXT-5 Implementation Record](../../implementation-artifacts/EXT-5-job-page-scanning-job-card.md)
- [Story EXT.5](./story-ext5-job-page-scanning-job-card.md)
- [UX Spec: Job Detected State](../ux-design-specification.md)
- [Architecture: Core Decisions](../architecture/core-architectural-decisions.md)
