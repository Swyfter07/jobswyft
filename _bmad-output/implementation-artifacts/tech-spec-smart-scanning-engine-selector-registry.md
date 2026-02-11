---
title: 'Smart Scanning Engine + Selector Registry'
slug: 'smart-scanning-engine-selector-registry'
created: '2026-02-10'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript', 'WXT', 'Chrome Extension APIs', 'Zustand', 'React', 'Vitest']
files_to_modify:
  - 'apps/extension/src/entrypoints/background/index.ts'
  - 'apps/extension/src/entrypoints/content-sentinel.content.ts'
  - 'apps/extension/src/features/scanning/scanner.ts'
  - 'apps/extension/src/features/scanning/selector-registry.ts (NEW)'
  - 'apps/extension/src/stores/scan-store.ts'
  - 'apps/extension/src/stores/settings-store.ts'
  - 'apps/extension/src/components/authenticated-layout.tsx'
  - 'apps/extension/src/lib/constants.ts'
  - 'packages/ui/src/components/layout/app-header.tsx'
  - 'packages/ui/src/components/features/scan-empty-state.tsx'
code_patterns:
  - 'Chrome executeScript with args[] for serializable data injection'
  - 'Zustand persist + chromeStorageAdapter for cross-context state'
  - 'chrome.storage.session for ephemeral signaling (cooldown, sentinel)'
  - 'chrome.storage.local for durable auto-scan request signals'
  - 'Deduplication via crypto.randomUUID per signal'
  - 'Content script matches[] restricts to specific URL patterns'
  - 'Scanner function must remain zero-import (Chrome serialization constraint)'
test_patterns:
  - 'Vitest with describe/it/expect'
  - 'Pure function tests: job-detector.test.ts, extraction-validator.test.ts'
  - 'Store tests: scan-store.test.ts, sidebar-store.test.ts (mock chrome APIs)'
  - 'Integration test: scanner.integration.test.ts (HTML fixture-based)'
---

# Tech-Spec: Smart Scanning Engine + Selector Registry

**Created:** 2026-02-10

## Overview

### Problem Statement

The current scanning engine has several critical UX and architecture problems:

1. **Blind auto-scanning** — No user control. Scanning triggers on every detected job URL with no way to disable it.
2. **Aggressive content sentinel** — The `content-sentinel.content.ts` clicks "show more" buttons, expands `<details>`, and clicks `[aria-expanded="false"]` elements on ALL pages (`<all_urls>`). This causes random menus to open on non-job pages (e.g., application forms), confusing users.
3. **No journey awareness** — When a user scans a job on LinkedIn and clicks "Apply Now," the auto-scan triggers again on the application page, overwriting the extracted job data. There's no concept of a user being "in the middle of applying."
4. **Monolithic scanner** — The `scanner.ts` function is a 443-line self-contained function with 55+ hardcoded CSS selectors. All selectors run on every page regardless of board. Adding, deprecating, or measuring selector health is impossible.
5. **No auto-analysis toggle** — The V4 code had a Sparkles button for auto-analysis (match analysis after scan) which the current build lacks.

### Solution

Build a page-aware, journey-tracking scanning engine with user controls and a data-driven selector registry:

- **Two toggles:** Auto-scan (controls background detection triggers) and auto-analysis (controls post-scan match analysis) as separate user preferences
- **Page-aware sentinel:** Only activates on confirmed job URLs; stays dormant on non-job pages
- **No more auto-clicking "show more"** — Replace with a side panel banner notifying the user about potentially incomplete descriptions
- **Journey tracking:** Retain scanned job data when navigating from job page to application/form page; detect form fields to transition to "Full Power" state
- **Manual rescan with override warning:** User can rescan on any page, but gets a confirmation if it would replace existing job data
- **Selector registry:** Extract all 55+ selectors into a typed, data-driven `SelectorEntry[]` structure with board filtering, priority ordering, lifecycle tracking, and injection via `chrome.scripting.executeScript({ args })`

### Scope

**In Scope:**
- Auto-scan toggle in header bar (controls background detection triggers)
- Auto-analysis toggle (Sparkles button, controls post-scan match analysis)
- Page-aware sentinel: only activates on confirmed job URLs via `getJobBoard(url)`
- Kill "show more" auto-click entirely — replace with side panel banner ("Incomplete description detected")
- Journey tracking: retain scanned job data across navigation to application pages
- Form detection on application pages to transition sidebar to "Full Power" state
- Manual "Rescan" with override warning ("This will replace the current job data")
- Selector registry: extract 55+ selectors from scanner monolith into `SelectorEntry[]`
- Board-aware selector filtering: only run selectors matching detected board + generic fallbacks
- Scanner refactor: `scrapeJobPage(board, registry)` signature with registry passed via Chrome `args`
- Selector lifecycle metadata: `id`, `board`, `field`, `priority`, `status`, `added`, `lastVerified`

**Out of Scope:**
- Extraction trace / per-field journey recording (Phase 2)
- Element picker with DOM overlay (Phase 2)
- Correction feedback loop and CorrectionEvent recording (Phase 2)
- Backend telemetry endpoint `POST /v1/telemetry/events` (Phase 3)
- Autofill engine implementation — form fill, undo, resume upload (Phase 4; we only detect forms here)
- AI-assisted selector regeneration (Phase 5)
- Selector health dashboards and aggregation views (Phase 5)

## Context for Development

### Codebase Patterns

- Extension uses WXT framework with `srcDir: "src"`, `outDir: "_output"`
- Scanner is injected via `chrome.scripting.executeScript({ func, args })` — must be self-contained (zero imports). Chrome serializes the function + args, so registry data must be JSON-serializable.
- Background uses `chrome.storage.session` for cooldown (`COOLDOWN_STORAGE_KEY`) and sentinel signaling (`SENTINEL_STORAGE_KEY`). Signals auto-scan via `chrome.storage.local` (`AUTO_SCAN_STORAGE_KEY`) with `crypto.randomUUID()` deduplication.
- Content sentinel (`content-sentinel.content.ts`) currently has `matches: [...]` restricted to job board URLs (LinkedIn, Indeed, Greenhouse, etc.) — NOT `<all_urls>`. However, its `expandShowMore()` blindly clicks `[aria-expanded="false"]` elements and generic `[class*="show-more"]` buttons on any matched page, which can trigger unintended UI interactions on application/form pages within those same domains.
- Zustand stores with `chrome.storage.local` persistence via `chromeStorageAdapter`. Stores persist `partialize`-selected fields only.
- Side panel (`authenticated-layout.tsx`) has TWO scan listeners: one for `AUTO_SCAN_STORAGE_KEY` (background signals), one for `SENTINEL_STORAGE_KEY` (content sentinel readiness). Both trigger `performScan()`.
- `settings-store.ts` ALREADY has `autoScan: boolean` and `autoAnalysis: boolean` with `setAutoScan`/`setAutoAnalysis` — but neither is wired into the background or UI header yet.
- `sidebar-store.ts` has `onUrlChange(url, isJobPage)` which preserves job context on non-job pages (FR72b) — this is the foundation for journey tracking.
- V4 code (reference): had `isAutoScanEnabled` in storage + ScanTab toggle, `autoAnalysis` in App.tsx header (Sparkles button toggling `bg-primary/20`).
- All UI components use semantic CSS tokens from `globals.css` — zero hardcoded colors.

### Technical Preferences & Constraints

- User wants the engine to be "fast, predictable, and auditable"
- No over-engineering — find the balance between smart and simple
- Scanning and autofill will share infrastructure later (shared sentinel, selector registry, board detection) — design for that extensibility now
- Content sentinel must NOT click "show more" or interact with DOM elements — detection only + side panel notification
- "Show more" notification approach: banner in side panel, NOT auto-clicking DOM elements
- Scanner function's Layer 5 heuristic also clicks `[aria-expanded="false"]` and opens `<details>` — this must also be removed (same problem as sentinel)

### Key Discovery: The Real "Show More" Problem

The "show more" clicking happens in TWO places:
1. **Content sentinel** (`content-sentinel.content.ts:65-122`) — `expandShowMore()` clicks LinkedIn/Indeed show-more buttons, generic `[class*="show-more"]`, `<details>`, and `[aria-expanded="false"]` BEFORE signaling readiness
2. **Scanner function** (`scanner.ts:373-423`) — Layer 5 heuristic also opens `<details>` and clicks `[aria-expanded="false"]` if key fields are missing

Both need to be neutered. The sentinel should only DETECT show-more buttons (not click them) and signal to the side panel. The scanner's Layer 5 should stop interacting with the DOM entirely.

### Key Discovery: settings-store.ts Already Has Toggles

`settings-store.ts` already defines `autoScan: boolean` (default `true`) and `autoAnalysis: boolean` (default `true`) with setters. They just aren't connected to:
- Background worker (doesn't check `autoScan` preference before signaling)
- AppHeader UI (no toggle buttons rendered)
- `authenticated-layout.tsx` scan listeners (don't check `autoScan` before executing)

The wiring work is: (1) background checks preference, (2) AppHeader gets toggle buttons, (3) scan listeners gate on the preference.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/extension/src/entrypoints/background/index.ts` | Background triggers for auto-scan (4 navigation listeners) |
| `apps/extension/src/entrypoints/content-sentinel.content.ts` | MutationObserver + show-more expansion (to be neutered) |
| `apps/extension/src/features/scanning/scanner.ts` | 443-line monolith scanner with 55+ inline selectors |
| `apps/extension/src/features/scanning/job-detector.ts` | 28 URL patterns for board detection |
| `apps/extension/src/features/scanning/frame-aggregator.ts` | Multi-frame merge with quality scoring |
| `apps/extension/src/features/scanning/extraction-validator.ts` | Confidence scoring + completeness |
| `apps/extension/src/stores/scan-store.ts` | Zustand scan state (idle/scanning/success/error) |
| `apps/extension/src/stores/sidebar-store.ts` | Four-state model + tab management |
| `apps/extension/src/stores/settings-store.ts` | Extension settings (theme, etc.) |
| `apps/extension/src/components/authenticated-layout.tsx` | `performScan()` orchestration + storage listeners |
| `apps/extension/src/lib/constants.ts` | Storage keys and API URL |
| `_bmad-output/planning-artifacts/architecture/core-engine-architecture.md` | Brainstorming doc with full engine vision |
| `V4 code/src/components/App.tsx` (V4-Alpha branch) | V4 header with Sparkles toggle + auto-analysis |
| `V4 code/src/components/ScanTab.tsx` (V4-Alpha branch) | V4 auto-scan toggle in ScanTab/JobCard |
| `V4 code/src/entrypoints/background.ts` (V4-Alpha branch) | V4 background with auto-scan preference check |
| `V4 code/src/services/storage.ts` (V4-Alpha branch) | V4 storage service with auto-scan + auto-analysis getters |

### Technical Decisions

- **TD-1:** Two separate toggles — auto-scan and auto-analysis — persisted in `settings-store.ts` (or new scan preferences in scan-store)
- **TD-2:** Content sentinel restricted to job pages only — uses `getJobBoard(url)` check before activating MutationObserver
- **TD-3:** "Show more" auto-click removed entirely — replaced with detection-only + side panel banner
- **TD-4:** Journey state tracked in scan-store — `journeyJobData` persists across page navigation within an application flow
- **TD-5:** Selector registry as a separate module (`selector-registry.ts`) — JSON-serializable data passed to scanner via `args`
- **TD-6:** Scanner function signature changes to `scrapeJobPage(board, registry)` — board-aware filtering inside
- **TD-7:** Background checks `autoScanEnabled` preference before signaling (like V4 did)

## Implementation Plan

### Tasks

#### Task 1: Create Selector Registry Module

- [x] **Task 1.1: Define `SelectorEntry` interface and registry data**
  - File: `apps/extension/src/features/scanning/selector-registry.ts` (NEW)
  - Action: Create a new module exporting `SelectorEntry` interface and `SELECTOR_REGISTRY: SelectorEntry[]` constant
  - Interface fields: `id` (unique string), `board` (string), `field` (string: title|company|description|location|salary|employmentType), `selectors` (string[]), `priority` (number, lower = tried first), `status` ("active"|"degraded"|"deprecated"), `added` (ISO date string), `lastVerified` (optional ISO date string), `notes` (optional string)
  - Extract ALL existing CSS selectors from `scanner.ts` Layer 2 (lines 161-344) into registry entries, grouped by board and field
  - Each board-specific selector group becomes one `SelectorEntry` with the board name; generic fallbacks get `board: "generic"`
  - All entries start with `status: "active"`, `added: "2026-02-10"`
  - Expected: ~25-30 entries covering LinkedIn (title, company, description, location, salary), Indeed, Greenhouse, Lever, Workday, Glassdoor, ZipRecruiter, Ashby, SmartRecruiters, Wellfound, and generic fallbacks
  - Notes: Must be JSON-serializable (no functions, no classes) because Chrome serializes `args` for `executeScript`

- [x] **Task 1.2: Add registry type export to constants**
  - File: `apps/extension/src/features/scanning/selector-registry.ts`
  - Action: Export the `SelectorEntry` type so it can be imported by `authenticated-layout.tsx` (for injection) and used in the scanner's type annotation within the function body (as inline type, since scanner has zero imports)

#### Task 2: Refactor Scanner to Use Registry

- [x] **Task 2.1: Change scanner function signature**
  - File: `apps/extension/src/features/scanning/scanner.ts`
  - Action: Change `scrapeJobPage(_board?: string | null)` to `scrapeJobPage(board: string | null, registry: Array<{id: string; board: string; field: string; selectors: string[]; priority: number; status: string}>)`
  - The registry type is inlined in the function signature (not imported) because Chrome serializes the function
  - `board` parameter changes from optional/unused to required/used for filtering

- [x] **Task 2.2: Replace Layer 2 hardcoded selectors with registry-driven extraction**
  - File: `apps/extension/src/features/scanning/scanner.ts`
  - Action: Replace the entire Layer 2 section (lines ~143-344) with a data-driven loop:
    1. Filter registry: `registry.filter(r => r.status !== "deprecated" && (r.board === board || r.board === "generic")).sort((a, b) => a.priority - b.priority)`
    2. For each field that wasn't filled by Layer 1 (JSON-LD), iterate matching registry entries
    3. For each entry, try each selector in `entry.selectors` using the existing `qs()` helper pattern
    4. On first match that passes validation, set the field value and record source as `entry.board === "generic" ? "css-generic" : "css-board"`
    5. Also record `entry.id` in a new `sourceSelectorIds` record alongside existing `sources` record
  - The `qs()` helper stays inlined but now operates per-entry rather than on one big array
  - Title validation (`isValidJobTitle`, `stripNotificationPrefix`) stays unchanged

- [x] **Task 2.3: Remove DOM interaction from Layer 5 (Heuristic)**
  - File: `apps/extension/src/features/scanning/scanner.ts`
  - Action: In the Layer 5 heuristic section (lines ~370-424):
    1. REMOVE the `<details>` expansion code (lines 376-379)
    2. REMOVE the `[aria-expanded="false"]` clicking code (lines 382-384)
    3. KEEP the CSS-hidden content reading (lines 388-399) — this reads `style*="display: none"` but doesn't click anything
    4. KEEP the extended generic selectors (lines 401-416) — these are read-only `qs()` calls
    5. ADD a new field `hasShowMore: boolean` to the return object — set to `true` if any "show more" buttons are detected (check for `.show-more-less-html__button--more`, `[class*="show-more"]`, `details:not([open])`)
  - Notes: The scanner should DETECT expandable content but never CLICK it

- [x] **Task 2.4: Return `sourceSelectorIds` in scanner output**
  - File: `apps/extension/src/features/scanning/scanner.ts`
  - Action: Add `sourceSelectorIds: Record<string, string>` to the return object alongside existing `sources`. Each field that was matched by a registry entry records `sourceSelectorIds[field] = entry.id`. This prepares for future extraction trace (Phase 2) without implementing the full trace now.

#### Task 3: Wire Auto-Scan Toggle

- [x] **Task 3.1: Background checks `autoScan` preference before signaling**
  - File: `apps/extension/src/entrypoints/background/index.ts`
  - Action: In `triggerAutoScan()`, before checking cooldown, read `autoScan` from `chrome.storage.local` (key: `jobswyft-settings`). If `autoScan` is `false`, return early without signaling. The settings-store persists under this key via Zustand.
  - Implementation: `const settingsResult = await chrome.storage.local.get("jobswyft-settings"); const settings = settingsResult["jobswyft-settings"]; if (settings?.state?.autoScan === false) return;`
  - Notes: Background can't use Zustand directly (no React context), so it reads raw chrome.storage. Zustand persist stores data as `{ state: {...}, version: N }`.

- [x] **Task 3.2: Side panel scan listeners gate on `autoScan`**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: In both storage change listeners (AUTO_SCAN_STORAGE_KEY and SENTINEL_STORAGE_KEY effects), check `useSettingsStore.getState().autoScan` before calling `performScan()`. If `false`, ignore the signal.
  - Notes: Side panel CAN use Zustand directly since it's a React context.

- [x] **Task 3.3: Add auto-scan toggle button to AppHeader**
  - File: `packages/ui/src/components/layout/app-header.tsx`
  - Action:
    1. Add new props: `autoScanEnabled?: boolean`, `onAutoScanToggle?: () => void`, `autoAnalysisEnabled?: boolean`, `onAutoAnalysisToggle?: () => void`
    2. Add two toggle buttons in the right actions area (before the theme toggle):
       - **Auto-scan toggle:** `Zap` icon (from lucide-react). When enabled: `bg-primary/15 text-primary`. When disabled: default ghost style with `opacity-60`. Title: "Auto-scan: ON/OFF"
       - **Auto-analysis toggle:** `Sparkles` icon (from lucide-react). Same styling pattern. Title: "Auto-analysis: ON/OFF"
    3. Both buttons use the existing `Button variant="ghost" size="icon"` pattern with `size-8` class
    4. Use semantic tokens only — `bg-primary/15 text-primary` for active state (matches V4's `bg-primary/20` but uses design system opacity)
  - Notes: These are in the shared UI package. The extension wires them up via props. `Zap` icon chosen because it conveys "automatic/instant" without conflicting with existing icons (Settings gear, RefreshCw reset, Sun/Moon theme).

- [x] **Task 3.4: Wire toggles in authenticated-layout**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: Pass `autoScanEnabled`, `onAutoScanToggle`, `autoAnalysisEnabled`, `onAutoAnalysisToggle` props to `<AppHeader>`, reading from and writing to `useSettingsStore`.
  - Implementation:
    ```tsx
    const { autoScan, autoAnalysis, setAutoScan, setAutoAnalysis } = useSettingsStore();
    // In header JSX:
    <AppHeader
      autoScanEnabled={autoScan}
      onAutoScanToggle={() => setAutoScan(!autoScan)}
      autoAnalysisEnabled={autoAnalysis}
      onAutoAnalysisToggle={() => setAutoAnalysis(!autoAnalysis)}
      // ...existing props
    />
    ```

#### Task 4: Neuter Content Sentinel

- [x] **Task 4.1: Remove `expandShowMore()` function and all click interactions**
  - File: `apps/extension/src/entrypoints/content-sentinel.content.ts`
  - Action:
    1. Delete the entire `expandShowMore()` function (lines 65-122)
    2. Replace all calls to `expandShowMore()` with a new `detectShowMore()` function that DETECTS but does NOT click:
       ```typescript
       function detectShowMore(): boolean {
         const showMoreSelectors = [
           '.show-more-less-html__button--more',           // LinkedIn
           'button[aria-label="Show full description"]',   // Indeed
           '[class*="show-more"]', '[class*="showMore"]',
           '[class*="read-more"]', '[class*="readMore"]',
           'details:not([open])',
         ];
         return showMoreSelectors.some(sel => document.querySelector(sel) !== null);
       }
       ```
    3. In the readiness signal, include `hasShowMore: boolean` alongside the existing `url` and `timestamp`:
       ```typescript
       chrome.storage.session.set({
         [SENTINEL_KEY]: {
           tabId: -1,
           url: window.location.href,
           timestamp: Date.now(),
           hasShowMore: detectShowMore(),
         },
       });
       ```
    4. Remove the `POST_EXPAND_DELAY_MS` constant and all `setTimeout(signalReady, POST_EXPAND_DELAY_MS)` — signal immediately since we're not waiting for animations
    5. Signal readiness immediately when content is detected (no expand step)

- [x] **Task 4.2: Add `hasShowMore` to scan-store and surface as banner**
  - File: `apps/extension/src/stores/scan-store.ts`
  - Action: Add `hasShowMore: boolean` to `ScanState` interface (default `false`). Add `setHasShowMore(value: boolean)` action. Persist it alongside `scanStatus` in `partialize`.
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: When processing sentinel signal, read `hasShowMore` from the signal data and call `scanStore.setHasShowMore(signal.hasShowMore)`.

- [x] **Task 4.3: Show "incomplete description" banner in scan content**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: In the `scanStatus === "success"` render branch, if `scanStore.hasShowMore` is `true`, render a banner above the JobCard:
    ```tsx
    {scanStore.hasShowMore && (
      <div className="rounded-md bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning-foreground flex items-center gap-2">
        <AlertTriangle className="size-3.5 shrink-0" />
        <span>Description may be incomplete. Expand "Show More" on the page and rescan for full details.</span>
      </div>
    )}
    ```
  - Notes: Uses existing warning semantic tokens. `AlertTriangle` from lucide-react.

#### Task 5: Journey Tracking + Rescan Override Warning

- [x] **Task 5.1: Gate auto-scan on journey state**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: In the AUTO_SCAN_STORAGE_KEY listener, before calling `performScan()`:
    1. Check if there's already a successful scan (`scanStore.scanStatus === "success"` and `scanStore.jobData !== null`)
    2. Check if the incoming URL is DIFFERENT from the stored job's `sourceUrl`
    3. If both true AND the new URL is NOT a job page (per `detectJobPage()`): skip the scan entirely (user navigated away from job page to apply page — preserve context)
    4. If both true AND the new URL IS a different job page: proceed with scan (user navigated to a new job)
    5. If same URL: proceed with scan (re-scan same page, e.g., after show-more)
  - Notes: This is the core journey tracking logic. The `detectJobPage` import from `job-detector.ts` is already available.

- [x] **Task 5.2: Add `isJobPage` to background signals**
  - File: `apps/extension/src/entrypoints/background/index.ts`
  - Action: In `triggerAutoScan()`, add `isJobPage: true` to the storage signal payload. This is always true for background signals (background only fires on detected job pages), but makes it explicit for the side panel's journey logic.
  - Also add a new constant `SETTINGS_STORAGE_KEY = "jobswyft-settings"` to `constants.ts` for the background's raw storage read.

- [x] **Task 5.3: Manual "Rescan" with override warning**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: Modify `handleManualScan` to check if there's existing job data:
    ```typescript
    const handleManualScan = useCallback(() => {
      const hasExistingJob = scanStore.jobData !== null && scanStore.scanStatus === "success";
      if (hasExistingJob) {
        setShowRescanWarning(true); // New state
        return;
      }
      doManualScan();
    }, [scanStore.jobData, scanStore.scanStatus]);
    ```
  - Add `showRescanWarning` state and render a confirmation dialog/inline prompt:
    ```tsx
    {showRescanWarning && (
      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs flex flex-col gap-2">
        <span className="font-medium text-destructive">Rescan will replace the current job data.</span>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => { setShowRescanWarning(false); doManualScan(); }}>
            Rescan
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRescanWarning(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )}
    ```

- [x] **Task 5.4: Form detection signal for "Full Power" state**
  - File: `apps/extension/src/entrypoints/content-sentinel.content.ts`
  - Action: The sentinel already has form detection code (`DETECT_FORM_FIELDS` message handler, lines 303-335). Add a passive form detection that runs on mount alongside content readiness:
    ```typescript
    function detectFormFields(): number {
      const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select';
      return document.querySelectorAll(selector).length;
    }
    ```
  - In the readiness signal, include `formFieldCount: number`:
    ```typescript
    chrome.storage.session.set({
      [SENTINEL_KEY]: {
        tabId: -1,
        url: window.location.href,
        timestamp: Date.now(),
        hasShowMore: detectShowMore(),
        formFieldCount: detectFormFields(),
      },
    });
    ```
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: When processing sentinel signal, if `formFieldCount >= 3` AND there's existing job data, transition sidebar to "full-power" state: `setSidebarState("full-power")`.

#### Task 6: Inject Registry into performScan

- [x] **Task 6.1: Import registry and pass via executeScript args**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action:
    1. Import `SELECTOR_REGISTRY` from `../features/scanning/selector-registry`
    2. In `performScan()`, change the `executeScript` call:
       ```typescript
       const results = await chrome.scripting.executeScript({
         target: { tabId, allFrames: true },
         func: scrapeJobPage,
         args: [board, SELECTOR_REGISTRY],
       });
       ```
    3. Update the verification re-scan call the same way (around line 200)
  - Notes: Chrome serializes `SELECTOR_REGISTRY` as a JSON argument. The registry is ~3-5KB — well within Chrome's serialization limits.

- [x] **Task 6.2: Update frame-aggregator for new scanner output**
  - File: `apps/extension/src/features/scanning/frame-aggregator.ts`
  - Action: Update the `aggregateFrameResults` function to handle the new `hasShowMore` and `sourceSelectorIds` fields from the scanner's return type. Merge `hasShowMore` as `OR` across frames (if ANY frame has show-more, report true). Merge `sourceSelectorIds` same as `sources` (winning frame's IDs).

#### Task 7: Add New Storage Keys

- [x] **Task 7.1: Add settings storage key constant**
  - File: `apps/extension/src/lib/constants.ts`
  - Action: Add `export const SETTINGS_STORAGE_KEY = "jobswyft-settings";` for the background worker's raw storage reads.

### Acceptance Criteria

- [x] **AC1:** Given auto-scan is enabled (default), when user navigates to a LinkedIn job page, then the background signals the side panel and job data is extracted automatically.

- [x] **AC2:** Given auto-scan is disabled (user clicked Zap toggle OFF), when user navigates to a LinkedIn job page, then NO auto-scan occurs. The side panel shows the idle/empty state. User can still manually click "Scan This Page."

- [x] **AC3:** Given auto-analysis is enabled and a job has been scanned and a resume is active, when the scan completes, then match analysis runs automatically (existing behavior, now gated on Sparkles toggle).

- [x] **AC4:** Given auto-analysis is disabled, when a job is scanned, then match analysis does NOT run automatically. User can still trigger it from AI Studio.

- [x] **AC5:** Given user is on a LinkedIn job page, when the sentinel detects a "show more" button on the page, then the sentinel does NOT click it. Instead, the side panel shows a warning banner: "Description may be incomplete."

- [x] **AC6:** Given user is on a LinkedIn job page with a "show more" button, when the user manually expands "show more" on the page and clicks "Rescan", then the scanner extracts the now-visible full description.

- [x] **AC7:** Given user scanned a job on LinkedIn and then clicked "Apply Now" to a form page (non-job URL), when the page loads, then the existing job data is PRESERVED in the side panel. No auto-rescan occurs.

- [x] **AC8:** Given user is on an application form page with existing job data AND the sentinel detects 3+ form fields, then the sidebar transitions to "full-power" state (autofill tab unlocks).

- [x] **AC9:** Given user has existing scanned job data, when user clicks "Scan This Page" manually, then a confirmation appears: "Rescan will replace the current job data." User can confirm or cancel.

- [x] **AC10:** Given user navigates from LinkedIn job to a DIFFERENT LinkedIn job (new URL with `currentJobId`), when the page loads, then auto-scan triggers normally and replaces the previous job data (this is a new job, not an apply flow).

- [x] **AC11:** Given the selector registry has entries for LinkedIn and Indeed, when scanning a LinkedIn page, then ONLY LinkedIn-specific + generic selectors are tried (not Indeed selectors). Board filtering reduces wasted DOM queries.

- [x] **AC12:** Given the scanner is called with `(board, registry)` args, when a field is matched by a registry entry, then `sourceSelectorIds[field]` contains the entry's `id` (e.g., `"li-title-unified-v3"`) for future traceability.

- [x] **AC13:** Given a deprecated selector entry (status: "deprecated"), when scanning runs, then that entry is excluded from the selector filtering — its selectors are never tried.

- [x] **AC14:** Given the scanner's Layer 5 heuristic runs, when it encounters `<details>` or `[aria-expanded="false"]` elements, then it does NOT click or expand them. It only reads already-visible content.

## Additional Context

### Dependencies

- **No new external libraries required.** All changes use existing dependencies (Zustand, lucide-react, Chrome Extension APIs).
- **No API changes required.** All changes are extension-side.
- **No database migrations required.**
- Depends on existing `settings-store.ts` autoScan/autoAnalysis fields (already present).
- Depends on existing `sidebar-store.ts` four-state model and `onUrlChange()` (already present).
- Depends on existing `job-detector.ts` `detectJobPage()` and `getJobBoard()` (already present, may need import in `authenticated-layout.tsx`).

### Testing Strategy

**Unit Tests:**

- [x] `selector-registry.test.ts` (NEW) — Validate registry data integrity:
  - Every entry has a unique `id`
  - Every entry has valid `board`, `field`, `priority`, `status` values
  - No duplicate selector strings across entries for the same board+field
  - Board names match known boards from `job-detector.ts`
  - All entries are JSON-serializable (no functions, no circular refs)

- [x] `scanner.test.ts` (UPDATE existing `scanner.integration.test.ts`) — Test registry-driven extraction:
  - Given a LinkedIn HTML fixture + LinkedIn registry entries, scanner extracts title/company/description correctly
  - Given board="linkedin" and registry with both LinkedIn and Indeed entries, only LinkedIn + generic entries are used
  - Given a deprecated entry in registry, it is not tried
  - `hasShowMore` is `true` when `.show-more-less-html__button--more` exists in DOM
  - Layer 5 does NOT click any elements (verify no `click()` calls)

- [x] `settings-store.test.ts` (NEW or update) — Test toggle persistence:
  - `setAutoScan(false)` persists and `autoScan` reads `false`
  - `setAutoAnalysis(false)` persists and `autoAnalysis` reads `false`
  - Defaults are both `true`

**Integration Tests (Manual):**

- [ ] Open side panel on LinkedIn job page → auto-scan extracts job data
- [ ] Toggle auto-scan OFF → navigate to new job page → no auto-scan fires
- [ ] Toggle auto-scan ON → navigate to new job page → auto-scan fires again
- [ ] On LinkedIn job with "show more" → verify banner appears, NOT auto-clicked
- [ ] Click "show more" on page → click "Rescan" in side panel → full description extracted
- [ ] Scan job → click "Apply Now" → verify job data preserved, no rescan
- [ ] On apply page with form → verify sidebar shows "full-power" state
- [ ] On apply page → click "Scan This Page" → override warning appears → confirm → rescans
- [ ] Navigate to different job → auto-scan replaces old data (no override warning for auto)

### Notes

**Risk: Background reading Zustand storage format**
The background worker reads raw `chrome.storage.local` to check the `autoScan` preference. Zustand persist stores data as `{ state: { autoScan: true, ... }, version: 0 }`. If the Zustand persist format changes, this could break. Mitigation: add a comment in background referencing the expected format, and test this path.

**Risk: Registry size in executeScript args**
The selector registry with ~25-30 entries is ~3-5KB JSON. Chrome's `executeScript` args limit is much larger (megabytes), so this is not a concern. However, if the registry grows to 200+ entries in the future, consider splitting by board and only injecting the relevant board's entries.

**Future: Extraction Trace (Phase 2)**
Task 2.4 adds `sourceSelectorIds` to the scanner output. This is the seed for the full extraction trace planned in Phase 2. The trace will record every selector attempted, not just the winner.

**Future: Shared Core Module (Phase 4)**
The selector registry is designed to be usable by both scan and autofill engines. In Phase 4, registry entries will gain a `mode: "read" | "write" | "both"` field. The current implementation uses all entries as `mode: "read"` implicitly.

**Implementation Order**
Tasks 1-2 (registry + scanner refactor) have no UI impact and can be validated with unit tests alone. Tasks 3-5 (toggles + sentinel + journey) have UI impact and require the side panel running. Task 6 (injection wiring) connects everything. Recommended order: 1 → 2 → 7 → 6 → 3 → 4 → 5.
