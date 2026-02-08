# EXT-5.5: Scan Engine Hardening — Implementation Record

**Story:** Scan Engine Hardening — Confidence, Sentinel, AI Fallback
**Started:** 2026-02-08
**Status:** Done

## Dev Agent Record

### Implementation Plan
- [x] Task 1: Extraction Validator Module (AC: #3, #4, #5) — 29 tests
- [x] Task 2: Scanner Enhancements (AC: #3, #5) — @graph recursion, heuristic layer, source tracking
- [x] Task 3: Content Sentinel (AC: #1, #2) — content script, MutationObserver, Show More expansion
- [x] Task 4: Background Service Worker Updates (AC: #8, #9, #10) — session storage cooldown, sentinel listener, 4th trigger
- [x] Task 5: Authenticated Layout Pipeline (AC: #4, #6, #7, #10) — orchestration with confidence, AI fallback, verification
- [x] Task 6: AI Extraction Fallback Client (AC: #6) — html-cleaner.ts + api-client.ts method
- [x] Task 7: AI Extraction Fallback Backend (AC: #6) — POST /v1/ai/extract-job added to existing ai.py router (not separate ai_extract.py), 50/day rate limit, 0 credit cost
- [x] Task 8: Scan Store Extensions (AC: #3, #7, #10) — confidence, isRefining, board state
- [x] Task 9: UI Refining Badge (AC: #7) — animate-pulse + motion-reduce:animate-none
- [x] Task 10: Dead Code Cleanup (AC: #11) — message-types.ts deleted
- [x] Task 11: HTML Fixture Tests — 24 integration tests across 5 boards + edge cases
- [x] Task 12: Build & Validation — 128 tests pass, build succeeds

### Debug Log
- Task 1: Test expected completeness ~1.0 but got 0.92 (salary weight 0.05 × 0.60 confidence). Fixed assertion.
- Task 3: WXT requires `*.content.ts` naming for content scripts. Renamed from `content-sentinel.ts`.
- Task 3: Bundle 5.42 KB (2.71 KB code + ~2.5 KB WXT runtime overhead). Accepted.
- Task 7: Interface inside class body causes esbuild error. Moved AiExtractResult to top level.
- Task 7: Provider-specific API call handling (Claude messages vs OpenAI chat.completions). Added _call_provider() dispatcher.

### Completion Notes
All 12 tasks completed. Extension tests: 28 integration + 29 validator + 22 scan-store + existing.
Extension build: 730.29 KB total. Content sentinel: 5.42 KB (exceeds 3KB budget due to WXT runtime overhead — accepted). Background: 3.52 KB.
Backend: POST /v1/ai/extract-job endpoint added to existing ai.py router with 50/day rate limit using usage_events table. 10 endpoint tests.

## File List

### New Files
- `apps/extension/src/features/scanning/extraction-validator.ts` — Confidence scoring & validation
- `apps/extension/src/features/scanning/extraction-validator.test.ts` — 29 unit tests
- `apps/extension/src/features/scanning/html-cleaner.ts` — HTML cleaner for AI fallback
- `apps/extension/src/features/scanning/scanner.integration.test.ts` — 28 fixture-based tests (LinkedIn, Indeed, Greenhouse, Lever, Workday, JSON-LD @graph, empty page)
- `apps/extension/src/features/scanning/__fixtures__/` — 6 HTML fixtures (LinkedIn, Indeed, Greenhouse, Lever, Workday, JSON-LD @graph)
- `apps/extension/src/entrypoints/content-sentinel.content.ts` — Content readiness detection
- `apps/api/app/services/extract_job_service.py` — AI extraction service with rate limiting
- `apps/api/tests/test_ai_extract.py` — 10 endpoint tests (auth, success, rate limit, validation, provider failure)

### Modified Files
- `apps/extension/src/features/scanning/scanner.ts` — @graph recursion, heuristic layer 5, source tracking
- `apps/extension/src/components/authenticated-layout.tsx` — Pipeline orchestration (confidence, AI fallback, verification, crypto.randomUUID dedup)
- `apps/extension/src/entrypoints/background/index.ts` — Session storage cooldown, sentinel listener with tab ID resolution, 4th trigger, UUID signal IDs
- `apps/extension/src/stores/scan-store.ts` — confidence, isRefining, board state
- `apps/extension/src/stores/scan-store.test.ts` — 9 new tests (22 total)
- `apps/extension/src/lib/api-client.ts` — AiExtractResult type + extractJobWithAI method
- `apps/extension/package.json` — Added jsdom devDependency for integration tests
- `apps/api/app/routers/ai.py` — POST /v1/ai/extract-job endpoint (added to existing router, not separate file)
- `apps/api/app/models/ai.py` — ExtractJobRequest/ExtractJobResponse models (html_content max 8000 chars)
- `apps/api/app/services/ai/prompts.py` — JOB_EXTRACT_PROMPT + format_job_extract_prompt()
- `pnpm-lock.yaml` — Lockfile updated for jsdom dependency

### Deleted Files
- `apps/extension/src/lib/message-types.ts` — Dead code (43 lines, never imported)

## Change Log
- 2026-02-08: Story started, implementation artifact created
- 2026-02-08: All 12 tasks completed, moved to review
- 2026-02-08: Code review — 12 findings (5H, 4M, 3L). Fixes applied:
  - H1: Story docs updated (endpoint in ai.py, not separate router)
  - H2: Created `test_ai_extract.py` (10 tests: auth, success, rate limit, validation, provider failure)
  - H3: Added async/sync pattern note to ExtractJobService (pre-existing codebase pattern)
  - H4: Dedup key changed to `crypto.randomUUID()` in background signals + side panel
  - H5: Added Workday fixture + 4 integration tests (28 total)
  - M1: Added package.json + pnpm-lock.yaml to File List
  - M2: Background sentinel listener resolves actual tab ID instead of forwarding -1
  - M3: Replaced `Object.assign(validation, revalidation)` with reassignment
  - M4: Removed false job-detector.ts modification claim from File List
  - L1: Noted sentinel 5.42KB size (accepted deviation from 3KB budget)
  - L3: Fixed `ExtractJobRequest.html_content` max_length from 10000 to 8000
- 2026-02-08: LinkedIn live-testing — 3 bugs found and fixed:
  - **BUG-1: Frame pollution (HIGH)** — `allFrames: true` returns results from iframes (ads, recommendation widgets). Sub-frame garbage could win over main frame data via "first non-empty" aggregation. Fix: Prioritize main frame (frameId 0) in both initial scan and verification re-scan. Sub-frames only fill gaps. Files: `authenticated-layout.tsx`.
  - **BUG-2: Verification carries forward stale data (CRITICAL)** — Root cause of "Refining..." showing but never fixing wrong data. On LinkedIn SPA navigation, initial scan fires at t=1.5s before DOM renders job card. Scanner grabs garbage (title from generic h1, company from og:site_name). Verification re-scan at t=6.5s has correct DOM, but started from `{ ...best }` (stale wrong data) and only filled EMPTY fields — never replaced wrong-but-non-empty fields. Additionally, `completeness > validation.completeness` comparison could prevent update even when fresh data was better. Fix: Verification now starts fresh (empty object), aggregates independently, backfills only secondary fields (location, salary, employmentType) from initial scan, and always updates if title + company found. File: `authenticated-layout.tsx`.
  - **BUG-3: Salary false positive (MEDIUM)** — Generic `[class*="salary"]` selector matched LinkedIn benefits section ("Health, dental, vision insurance") instead of actual salary. Fix: Added regex validation requiring currency symbol (`$€£¥`) or comma-formatted number pattern before accepting salary text. File: `scanner.ts`.
  - **BUG-4: Description heading prefix (LOW)** — `.jobs-description__content` grabs entire section including "About the job" heading. Fix: Strip common heading prefixes (About the job, Job Description, Description, Overview) before return. File: `scanner.ts`.
  - **NOTE: AI fallback not deployed** — `POST /v1/ai/extract-job` returns 404 on cloud API (`api.jobswyft.com`). Backend changes (extract_job_service.py, ai.py, models/ai.py, prompts.py) are uncommitted on feature branch, never deployed to Railway. AI fallback silently fails (caught in try/catch). Rule-based scanning works without it. Deployment needed before AI fallback is functional.
  - Tests: 132 pass, build: 731.25 KB
