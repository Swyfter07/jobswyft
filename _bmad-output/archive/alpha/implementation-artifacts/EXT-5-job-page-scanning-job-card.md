# Story EXT.5: Job Page Scanning & Job Card

Status: done

## Story

As a **job seeker browsing job postings**,
I want **the extension to detect and scan job pages automatically**,
So that **I can see job details and save jobs without copy-pasting**.

## Acceptance Criteria

1. **AC1 — Auto-Detection:** Given the extension is loaded and user is authenticated, when the user navigates to a job posting page (LinkedIn, Indeed, Greenhouse, Lever, Workday, etc.), then the background service worker detects the URL change via `chrome.tabs.onUpdated`, the content script extracts job details from the DOM, the sidebar state transitions from "Non-Job Page" to "Job Detected", and the JobCard renders with extracted data. SPA navigation (URL changes without full page reload) must also be detected.

2. **AC2 — JobCard Rendering:** Given auto-scan completes successfully, when the scan data is relayed to the Side Panel via background service worker, then the JobCard renders in the Scan tab with extracted data, metadata badges show location/salary/employment_type when available, and missing required fields (title, company, description) are indicated with warning icons.

3. **AC3 — Manual Entry Fallback:** Given auto-detection fails on an unknown job site, when the user sees the scan empty state, then a "Scan This Page" manual trigger button is displayed, an "Or paste a job description" link is shown, clicking manual trigger attempts DOM extraction via programmatic content script injection, and clicking paste link opens edit mode with textarea for full job description paste.

4. **AC4 — Edit Mode:** Given the JobCard is displaying scanned data, when the user clicks the edit toggle (pencil icon), then fields become editable inline, the user can correct extracted data directly, and changes are reflected in the scan store (ephemeral, not persisted until saved). Cancel (X icon) reverts to display mode.

5. **AC5 — Save Job:** Given a successful scan with complete data, when the user clicks "Save Job", then `POST /v1/jobs/scan` is called with `status: "applied"` (per FR49 — overrides API default of `"saved"`), and visual confirmation is shown (checkmark or toast). Note: UX spec mentions "Analyze Job" button in edit mode — that is EXT.6 scope (match analysis). For EXT.5, the primary action is "Save Job" only.

6. **AC6 — Loading & Error States:** Given a scan is in progress, then a loading skeleton shows in the Scan tab (shadcn `<Skeleton>` composition, NOT a separate component). Given a scan fails, then an inline error message with retry option is displayed per Tier 1 error pattern.

7. **AC7 — Messaging:** Given the content script needs to communicate with the Side Panel, then the background service worker relays messages using typed constants from a shared `message-types.ts` file. The Side Panel receives scan data and updates the scan-store.

## FRs Addressed

FR14 (auto-scan), FR14a (URL patterns), FR14b (manual entry with paste fallback), FR15-FR18 (field extraction), FR19 (ephemeral questions — defer extraction logic, just wire infrastructure), FR21 (manual edit), FR22 (missing field indicators), FR48 (save job), FR49 (auto "Applied" status)

**Deferred to EXT.6:** FR20 (element picker), `onAnalyze` callback, skill pills (SkillPill promotion), match analysis integration.

## Tasks / Subtasks

### Task 1: Extend `JobData` Type in UI Package (AC: #2, #5)
- [x] 1.1 Add missing fields to `JobData` in `packages/ui/src/lib/mappers.ts`:
  ```typescript
  export interface JobData {
    title: string
    company: string
    location: string
    salary?: string
    employmentType?: string   // NEW — maps from employment_type
    sourceUrl?: string        // NEW — maps from source_url
    status?: string           // NEW — maps from status
    postedAt?: string
    description?: string
    logo?: string
  }
  ```
- [x] 1.2 Update `mapJobResponse()` in `mappers.ts` to map the new fields:
  ```typescript
  employmentType: job.employment_type ?? undefined,
  sourceUrl: job.source_url ?? undefined,
  status: job.status ?? undefined,
  ```
- [x] 1.3 Update `ApiJobResponse` in `api-types.ts` if `employment_type` or `source_url` are missing
- [x] 1.4 Reconcile sidebar-store `JobData` with `@jobswyft/ui` `JobData`:
  - **Current conflict:** `sidebar-store.ts` defines its own `JobData` (`{ title, company, description, url }`) which differs from `@jobswyft/ui`'s `JobData`
  - **Resolution:** Delete the local `JobData` interface from sidebar-store, import from `@jobswyft/ui` instead
  - Update `sidebar-store.ts` to use the shared type — `url` field maps to `sourceUrl`
  - Update all sidebar-store references that used the old shape
- [x] 1.5 Update existing mappers tests if needed, add tests for new fields

### Task 2: Build JobCard Feature Component in UI Package (AC: #2, #4)
- [x] 2.1 Read reference pattern: `_reference/future-features/job-card.tsx` (inspiration only — do NOT copy wholesale)
- [x] 2.2 Read UX spec "Job Detected" state section for exact UI requirements
- [x] 2.3 Create `packages/ui/src/components/features/job-card.tsx` — brand new, UX-spec-compliant
  - Props: `job: JobData`, `isEditing?: boolean`, `onEditToggle?: () => void`, `onSave?: (job: JobData) => void`, `onFieldChange?: (field: keyof JobData, value: string) => void`, `isLoading?: boolean`, `isSaving?: boolean`
  - View mode: Card with company/title header, metadata badges (location, salary, employmentType), truncated description with `line-clamp-4`
  - Edit mode: Input fields for title/company/location/salary, Textarea for description, explicit "Save Job" button (NOT "Analyze Job" — that's EXT.6)
  - Missing field indicators: `AlertTriangle` warning icon on empty required fields (title, company, description)
  - Edit toggle: Pencil icon (`ghost` variant, `size-8` touch target) / X icon to cancel
  - No SkillPill, no MatchIndicator, no onAnalyze — those are EXT.6 scope
- [x] 2.4 Create `packages/ui/src/components/features/job-card.stories.tsx`
  - Stories: Default, WithAllFields, MissingFields, EditMode, Loading (skeleton), Saving, EmptyDescription
  - Test at 360×600 viewport, dark + light mode
- [x] 2.5 Export JobCard from `packages/ui/src/index.ts`

### Task 3: Build ScanEmptyState Component (AC: #3)
- [x] 3.1 Create `packages/ui/src/components/features/scan-empty-state.tsx`
  - Container: `border-2 border-card-accent-border rounded-lg p-6` (accent border matching card pattern)
  - Icon: `Search` from lucide-react, `size-8 text-muted-foreground/40` centered
  - Text: `text-sm text-muted-foreground text-center` — "Navigate to a job posting to get started"
  - "Or paste a job description" link → calls `onManualEntry` callback
  - "Scan This Page" button → calls `onManualScan` callback (shown when `canManualScan` prop is true)
- [x] 3.2 Create `scan-empty-state.stories.tsx` (Default, WithManualScan)
- [x] 3.3 Export from `packages/ui/src/index.ts`

### Task 4: Build ScanLoadingState & ScanErrorState (AC: #6)
- [x] 4.1 Create scan loading state as inline Skeleton composition (NOT a separate component)
  - Use shadcn `<Skeleton>` — compose to match JobCard layout shape
  - Pattern: `<Skeleton className="h-5 w-3/4" />` for title, `<Skeleton className="h-4 w-1/2" />` for company, etc.
- [x] 4.2 Create scan error state inline
  - `<p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>`
  - "Retry" button
  - "Or paste a job description" fallback link

### Task 5: Create Message Types (AC: #7)
- [x] 5.1 Create `apps/extension/src/lib/message-types.ts`
  ```typescript
  export const MSG = {
    JOB_SCANNED: 'JOB_SCANNED',
    NOT_JOB_PAGE: 'NOT_JOB_PAGE',
    MANUAL_SCAN_REQUEST: 'MANUAL_SCAN_REQUEST',
    SCAN_ERROR: 'SCAN_ERROR',
  } as const

  export type MessageType = typeof MSG[keyof typeof MSG]

  export interface ScanMessage {
    type: typeof MSG.JOB_SCANNED
    data: { title?: string; company?: string; description?: string; location?: string; salary?: string; employmentType?: string; sourceUrl: string }
  }

  export interface NotJobPageMessage {
    type: typeof MSG.NOT_JOB_PAGE
  }

  export interface ManualScanMessage {
    type: typeof MSG.MANUAL_SCAN_REQUEST
  }

  export type ExtensionMessage = ScanMessage | NotJobPageMessage | ManualScanMessage
  ```

### Task 6: Create Content Script — Job Detector (AC: #1)
- [x] 6.1 Create WXT content script entrypoint: `apps/extension/src/entrypoints/content/index.ts`
  - WXT auto-discovers entrypoints in `src/entrypoints/` directory
  - Use `defineContentScript({ matches: ['<all_urls>'], main() {...} })` API
- [x] 6.2 Create `apps/extension/src/features/scanning/job-detector.ts`
  - URL pattern matching for major job boards (see URL Pattern Reference below)
  - Export `detectJobPage(url: string): boolean` — pure function
  - Export `getJobBoard(url: string): string | null` — returns board name for board-specific extraction
- [x] 6.3 Create `apps/extension/src/features/scanning/scanner.ts`
  - Export `scanJobPage(board: string | null): ScanResult`
  - Board-specific DOM extraction rules (per-board CSS selectors for title, company, description, etc.)
  - Generic fallback: `document.title`, meta tags, structured data (JSON-LD `JobPosting`), Open Graph tags
  - Always include `sourceUrl: window.location.href`
  - Return type: `ScanMessage['data']`
- [x] 6.4 Wire content script to detect and scan on page load:
  ```typescript
  import { detectJobPage, getJobBoard } from '@/features/scanning/job-detector'
  import { scanJobPage } from '@/features/scanning/scanner'
  import { MSG } from '@/lib/message-types'

  export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
      if (detectJobPage(window.location.href)) {
        const board = getJobBoard(window.location.href)
        const result = scanJobPage(board)
        chrome.runtime.sendMessage({ type: MSG.JOB_SCANNED, data: result })
      }
    }
  })
  ```
  - **SPA handling:** LinkedIn/Indeed are SPAs — URL can change without full page reload. The background worker (Task 7) handles SPA re-detection via `chrome.tabs.onUpdated` and re-injects the content script when a new job URL is detected.

### Task 7: Extend Background Service Worker (AC: #1, #7)
- [x] 7.1 Add `chrome.tabs.onUpdated` listener — **primary scan trigger**
  - On URL change: check new URL against job board patterns (import `detectJobPage` logic or duplicate the regex check)
  - If job page detected → use `chrome.scripting.executeScript()` to inject content script (handles SPA navigation where content script doesn't auto-re-run)
  - If NOT job page → send `{ type: MSG.NOT_JOB_PAGE }` to side panel
  - Track `lastDetectedUrl` to avoid duplicate scans on same URL
- [x] 7.2 Relay content script messages to side panel
  - Listen for `chrome.runtime.onMessage` with `type === MSG.JOB_SCANNED`
  - Forward scan data to side panel via `chrome.runtime.sendMessage`
- [x] 7.3 Handle `MANUAL_SCAN_REQUEST` from side panel
  - Use `chrome.scripting.executeScript()` to inject content script into active tab
  - Content script scans with generic fallback (no board-specific rules)
- [x] 7.4 Update `apps/extension/wxt.config.ts` manifest permissions:
  - Add `"scripting"` — required for `chrome.scripting.executeScript()` (manual scan + SPA re-injection)
  - `"tabs"` is NOT needed — `chrome.tabs.onUpdated` works without it when `host_permissions: ["<all_urls>"]` is set (the `url` property in changeInfo is accessible because of host_permissions)

### Task 8: Create Scan Store (AC: #1, #2, #4, #6)
- [x] 8.1 Create `apps/extension/src/stores/scan-store.ts`
  - **Import `JobData` from `@jobswyft/ui`** — do NOT define a local JobData interface
  ```typescript
  import { create } from "zustand"
  import { persist, createJSONStorage } from "zustand/middleware"
  import { chromeStorageAdapter } from "../lib/chrome-storage-adapter"
  import type { JobData } from "@jobswyft/ui"
  import { apiClient } from "../lib/api-client"

  interface ScanState {
    scanStatus: 'idle' | 'scanning' | 'success' | 'error'
    jobData: JobData | null
    editedJobData: Partial<JobData> | null  // Working copy during edit mode
    isEditing: boolean
    isSaving: boolean
    error: string | null

    startScan: () => void
    setScanResult: (data: Partial<JobData>) => void
    setScanError: (error: string) => void
    toggleEdit: () => void
    updateField: (field: keyof JobData, value: string) => void
    saveJob: (token: string) => Promise<void>
    resetScan: () => void
  }
  ```
- [x] 8.2 Persist ONLY `jobData` to chrome.storage (scan is ephemeral, but preserve across tab switches)
  ```typescript
  partialize: (state) => ({ jobData: state.jobData })
  ```
- [x] 8.3 Wire `saveJob` action: calls `apiClient.saveJob()` → `POST /v1/jobs/scan`
  - On success: set `scanStatus: 'success'`, `isSaving: false`
  - On error: set `isSaving: false`, `error: message`

### Task 9: Extend API Client (AC: #5)
- [x] 9.1 Add `saveJob` method to `apps/extension/src/lib/api-client.ts`:
  ```typescript
  async saveJob(token: string, jobData: {
    title: string; company: string; description: string;
    location?: string; salary?: string; employmentType?: string; sourceUrl?: string
  }): Promise<ApiJobResponse> {
    return this.fetch<ApiJobResponse>("/v1/jobs/scan", {
      method: "POST",
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        location: jobData.location ?? null,
        salary_range: jobData.salary ?? null,        // camelCase → snake_case
        employment_type: jobData.employmentType ?? null,
        source_url: jobData.sourceUrl ?? null,
        status: "applied",  // FR49: auto "Applied" — overrides API default "saved"
      }),
      token,
    })
  }
  ```

### Task 10: Wire Sidebar Integration (AC: #1, #2, #3, #6)
- [x] 10.1 Update `apps/extension/src/components/authenticated-layout.tsx`
  - Import `useScanStore` and new UI components
  - Replace placeholder scan content:
    - `scanStatus === 'idle'` → `<ScanEmptyState />`
    - `scanStatus === 'scanning'` → Skeleton composition (inline)
    - `scanStatus === 'success'` → `<JobCard />`
    - `scanStatus === 'error'` → Inline error with retry button
  - Pass scan-store state to JobCard props
  - Wire `onSave` → `scanStore.saveJob(accessToken)`
- [x] 10.2 Listen for scan messages from background/content script
  - Add `chrome.runtime.onMessage.addListener` in a `useEffect` hook
  - On `MSG.JOB_SCANNED` → `scanStore.setScanResult(data)` + `sidebarStore.setSidebarState('job-detected')`
  - On `MSG.NOT_JOB_PAGE` → preserve last job context (FR72b — do NOT clear)
- [x] 10.3 Update sidebar-store integration
  - When scan succeeds → `sidebarStore.setSidebarState('job-detected')`
  - When save succeeds → show confirmation (brief inline checkmark, no toast library needed)
  - Tab unlock: `isLocked = sidebarState === "non-job-page" || sidebarState === "logged-out"` (already implemented)

### Task 11: State Preservation (AC: #1, FR72a-d)
- [x] 11.1 On job URL change (new job page — triggered by background worker):
  - Reset: `scanStore.resetScan()`, `sidebarStore.resetJob()` (clears jobData, matchData, editedJobData, isEditing)
  - Preserve: resume selection, auth, credits
  - Set `activeTab` to "scan"
- [x] 11.2 On non-job page navigation:
  - Preserve ALL current state (FR72b) — do NOT clear job context
- [x] 11.3 On manual reset (FR72c — already wired to AppHeader reset button):
  - Clear: job, match, AI Studio outputs, chat
  - Preserve: resume, auth, credits

### Task 12: Build & Test Validation
- [x] 12.1 `pnpm build` in `packages/ui` — verify JobCard, ScanEmptyState exported, no regressions
- [x] 12.2 `pnpm storybook` — verify new stories render correctly at 360×600 in dark + light mode
- [x] 12.3 `pnpm test` in `packages/ui` — all existing tests pass + new mapper tests
- [x] 12.4 `npm run build` in `apps/extension` — verify content script bundled, no type errors
- [x] 12.5 Test in Chrome: navigate to a LinkedIn/Indeed job page → verify auto-scan → JobCard renders
- [x] 12.6 Test SPA navigation: click a different job listing on LinkedIn → verify re-scan triggers
- [x] 12.7 Test manual entry: paste a job description → verify JobCard populates
- [x] 12.8 Test save job: click Save → verify `POST /v1/jobs/scan` called with `status: "applied"`
- [x] 12.9 Test state preservation: switch tabs → return to Scan → job data preserved
- [x] 12.10 Test non-job page: navigate away from job → verify last job context preserved

## Dev Notes

### Guardrails

**Type Safety — Single `JobData` Source of Truth:**
- Import `JobData` from `@jobswyft/ui` everywhere — scan-store, sidebar-store, API client, components
- sidebar-store currently has its own `JobData` (with `url` instead of `sourceUrl`) — must be updated in Task 1.4
- The reference `job-card.tsx` also defines its own `JobData` — ignore it, use the shared type
- `mapJobResponse()` maps snake_case API response → camelCase `JobData`

**Status Field — "applied" vs "saved":**
- Backend API defaults to `"saved"` when status is omitted
- FR49 specifies auto "Applied" — story explicitly sends `status: "applied"` to override the default
- Valid enum values: `saved`, `applied`, `interviewing`, `offered`, `rejected`, `accepted`

**EXT.5 Scope Boundary — No Match Analysis:**
- No SkillPill, MatchIndicator, or onAnalyze callback — those are EXT.6
- No "Analyze Job" button — UX spec's "Analyze Job" is the EXT.6 button after match analysis is wired
- EXT.5 JobCard: view mode + edit mode + "Save Job" only
- SkillSectionLabel is already exported from `@jobswyft/ui` but unused until EXT.6

**Detection Flow — V1 Architecture (executeScript + Storage Signaling):**
- Background worker detects job pages via 3 triggers: `chrome.tabs.onUpdated` (full loads), `chrome.webNavigation.onHistoryStateUpdated` (SPA navigation — critical for LinkedIn), `chrome.tabs.onActivated` (tab switching)
- Background signals side panel via `chrome.storage.local.set({ 'jobswyft-auto-scan-request': { tabId, url, timestamp } })`
- Side panel listens via `chrome.storage.onChanged` and calls `chrome.scripting.executeScript({ func: scrapeJobPage, target: { tabId, allFrames: true } })` directly
- `scrapeJobPage()` is a self-contained function (no imports/closures) that gets serialized and injected into the page
- Results aggregated from multiple frames — longest description wins
- 1.5s delay after URL detection for SPA content to render before signaling
- 30s cooldown per URL prevents duplicate scans
- Content script is a minimal placeholder — NOT used in the scanning chain
- Manual scan: side panel queries `chrome.tabs.query({ active: true, currentWindow: true })` and calls `performScan(tabId)` directly

**Why V1 Pattern Over Content Script Messaging:**
- Content scripts only run once on initial page load — miss SPA navigation (LinkedIn)
- `chrome.runtime.sendMessage` is unreliable when side panel isn't open yet (messages lost)
- Message relay through background creates race conditions and loops
- `chrome.scripting.executeScript({ func })` works on-demand from any context, any time

### Design Language Rules

- ZERO hardcoded colors — all from `globals.css` semantic tokens
- Dark + Light mode — test both in Storybook and extension
- `size-X` pattern — not `h-X w-X` (e.g., `size-4` for icons)
- `.text-micro` for 10px text — never `text-[10px]`
- `border-2 border-card-accent-border` for accent card pattern
- Empty states — `border-2 border-card-accent-border rounded-lg p-6` (accent border matching card pattern, NOT dashed)
- Metadata badges — `<Badge variant="outline">` with icon + text
- Icon sizing — Lucide icons via `size` prop or `size-X` className
- Reduced motion — all animations respect `prefers-reduced-motion`
- Error format: `<p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">`

### API Contract

**`POST /v1/jobs/scan` — Required fields:** `title`, `company`, `description` (422 if missing)
**Optional fields:** `location`, `salary_range`, `employment_type`, `source_url`, `status`
**Response:** `{ success: true, data: { id, user_id, title, company, description, location, salary_range, employment_type, source_url, status, notes, created_at, updated_at } }`
**Use `unwrap()` from `@jobswyft/ui`** in api-client for error handling.
**`posted_at` and `logo_url`** are in TypeScript types but NOT in backend. Backlog Story 3.3.

### URL Pattern Reference

```typescript
const JOB_BOARD_PATTERNS: Array<{ pattern: RegExp; board: string }> = [
  { pattern: /linkedin\.com\/jobs\/view/, board: "linkedin" },
  { pattern: /indeed\.com\/viewjob/, board: "indeed" },
  { pattern: /boards\.greenhouse\.io\/.*\/jobs/, board: "greenhouse" },
  { pattern: /jobs\.lever\.co/, board: "lever" },
  { pattern: /myworkdayjobs\.com/, board: "workday" },
  { pattern: /icims\.com/, board: "icims" },
  { pattern: /smartrecruiters\.com/, board: "smartrecruiters" },
  { pattern: /glassdoor\.com\/job-listing/, board: "glassdoor" },
  { pattern: /ziprecruiter\.com\/jobs/, board: "ziprecruiter" },
  { pattern: /angel\.co\/.*\/jobs/, board: "wellfound" },
]
```

### Previous Story Learnings (EXT.4.5)

1. **Type management:** Shared types in `mappers.ts` or `api-types.ts` — NOT in component files
2. **Border hierarchy:** Parent containers shouldn't duplicate child borders
3. **Icon positioning:** Explicit conditional slots for stateful icon swaps (pencil/X toggle)
4. **Story accuracy:** Stories MUST match production usage (collapsible mode, real props)
5. **Component organization:** Official in `blocks/` + `features/` + `layout/`, reference in `_reference/`
6. **No empty collapsibles:** Don't wrap in Collapsible if no expanded content
7. **No placeholders:** Storybook shows what EXISTS, not what MIGHT exist

### Project Structure Notes

**New files to create:**
```
packages/ui/src/components/
├── features/
│   ├── job-card.tsx              # NEW — feature component
│   ├── job-card.stories.tsx      # NEW — Storybook stories
│   ├── scan-empty-state.tsx      # NEW — empty state component
│   └── scan-empty-state.stories.tsx  # NEW

apps/extension/src/
├── entrypoints/
│   └── content/
│       └── index.ts              # NEW — content script (injected by background)
├── features/
│   └── scanning/
│       ├── job-detector.ts       # NEW — URL pattern matching
│       └── scanner.ts            # NEW — DOM extraction
├── lib/
│   └── message-types.ts          # NEW — shared message type constants
└── stores/
    └── scan-store.ts             # NEW — Zustand store
```

**Files to modify:**
```
packages/ui/src/
├── lib/
│   ├── mappers.ts                # MODIFY — extend JobData with employmentType, sourceUrl, status
│   └── api-types.ts              # MODIFY — verify ApiJobResponse has all fields
└── index.ts                      # MODIFY — export new components

apps/extension/src/
├── components/
│   └── authenticated-layout.tsx  # MODIFY — wire scan content into ExtensionSidebar slots
├── entrypoints/
│   └── background/index.ts       # MODIFY — add tabs.onUpdated listener + message relay
├── lib/
│   └── api-client.ts             # MODIFY — add saveJob method
├── stores/
│   └── sidebar-store.ts          # MODIFY — replace local JobData with @jobswyft/ui import
└── wxt.config.ts                 # MODIFY — add "scripting" permission
```

### References

- [Source: _bmad-output/planning-artifacts/epics/story-ext5-job-page-scanning-job-card.md]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — "Job Detected" state, Journey 2, Edit-in-Place pattern]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md — Four-State Progressive Model]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md — Skeleton, Error, Loading patterns]
- [Source: _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md — Content script architecture]
- [Source: _bmad-output/planning-artifacts/epics/component-development-methodology.md — Build order, design language rules]
- [Source: apps/api/app/routers/jobs.py — POST /v1/jobs/scan endpoint]
- [Source: apps/api/app/models/job.py — JobCreateRequest (title, company, description required), JobStatus enum]
- [Source: apps/api/app/services/job_service.py — Default status "saved", field mapping]
- [Source: packages/ui/src/lib/mappers.ts — mapJobResponse, JobData type (needs extension)]
- [Source: packages/ui/src/lib/api-types.ts — ApiJobResponse, ApiMatchAnalysis]
- [Source: apps/extension/src/stores/sidebar-store.ts — SidebarState, onUrlChange, resetJob, local JobData conflict]
- [Source: apps/extension/src/lib/api-client.ts — ApiClient.fetch pattern, unwrap usage]
- [Source: apps/extension/src/components/authenticated-layout.tsx — placeholder scan content to replace]
- [Source: apps/extension/src/entrypoints/background/index.ts — current minimal background worker]
- [Source: apps/extension/wxt.config.ts — current permissions: activeTab, storage, identity, sidePanel]
- [Source: packages/ui/src/components/_reference/future-features/job-card.tsx — Reference pattern only]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing `theme-store.test.ts` failure (window not defined) — not related to EXT.5 changes

### Completion Notes List

- **Task 1:** Extended `JobData` with `employmentType`, `sourceUrl`, `status` fields. Updated `mapJobResponse()` to map them. Reconciled sidebar-store to import shared `JobData`/`MatchData` from `@jobswyft/ui` instead of local definitions. Updated sidebar-store tests to match new type shapes (sourceUrl instead of url, matchedSkills/missingSkills instead of strengths/gaps). All 23 UI tests + 22 extension tests passing.
- **Task 2:** Built production-grade `JobCard` feature component with view/edit mode, missing field indicators (AlertTriangle), metadata badges (location, salary, employmentType), Save Job button with loading state, edit toggle (pencil/X icons). Created 8 Storybook stories including Loading skeleton. Exported from `@jobswyft/ui`.
- **Task 3:** Built `ScanEmptyState` component with accent border card pattern (`border-2 border-card-accent-border`), manual scan button, and paste fallback link. 2 stories. Exported from `@jobswyft/ui`.
- **Task 4:** Loading skeleton and error state implemented inline in `authenticated-layout.tsx` per story spec (NOT separate components).
- **Task 5:** Created typed message constants (`MSG.JOB_SCANNED`, `NOT_JOB_PAGE`, `MANUAL_SCAN_REQUEST`, `SCAN_ERROR`) with discriminated union types.
- **Task 6:** Created WXT content script with job-detector (10 board URL patterns) and scanner (board-specific CSS selectors for LinkedIn/Indeed/Greenhouse/Lever + JSON-LD + OpenGraph + generic fallback).
- **Task 7:** Extended background service worker with `chrome.tabs.onUpdated` listener (primary scan trigger), content script injection via `chrome.scripting.executeScript()`, message relay, and manual scan handler. Added `"scripting"` permission to manifest.
- **Task 8:** Created Zustand scan-store with persistence (jobData only), edit mode with working copy, save integration.
- **Task 9:** Added `saveJob()` method to API client — `POST /v1/jobs/scan` with `status: "applied"` (FR49).
- **Task 10:** Wired all scan states into `authenticated-layout.tsx` — empty/scanning/success/error → ScanEmptyState/Skeleton/JobCard/error-inline. Message listener for JOB_SCANNED with sidebar state transition.
- **Task 11:** State preservation: FR72a (new job URL resets scan+job), FR72b (non-job page preserves), FR72c (manual reset clears scan+job).
- **Task 12:** UI build: 97.35 kB (42 modules). Extension build: 718 kB total, content script 7.26 kB. All tests green.

### Change Log

- 2026-02-08: EXT-5 implementation — Job page scanning, JobCard component, content script, scan store, save job integration
- 2026-02-08: Review fix — Auto-scan not triggering. Root cause: content script auto-scans on page load but side panel isn't open yet (message lost). Fix: added scan-on-mount in authenticated-layout (side panel requests scan when it opens) + 8s timeout fallback to idle.
- 2026-02-08: Review fix — Manual scan stuck in loading. Root cause: background tried re-injecting WXT bundled content script (doesn't re-execute `main()`), plus message relay loop (background forwarded its own relayed JOB_SCANNED). Fix: content script now also listens for MANUAL_SCAN_REQUEST; background uses `sender.tab` check to only relay content script messages; uses `chrome.tabs.sendMessage` instead of file re-injection.
- 2026-02-08: Review fix — Separator/border visible on job card. Fix: removed `<Separator />` between CardHeader and CardContent; removed Separator import.
- 2026-02-08: Review fix — Tab bar removed entirely. User decision: tabs (Scan, AI Studio, Autofill, Coach) are not part of EXT.5 scope. Fix: authenticated-layout now uses ExtensionSidebar `children` prop pattern, composing header + resume context + scan content directly without the tab system. Tab-based rendering returns in EXT.6+.
- 2026-02-08: Review fix — JobCard dual-tone styling. User wants flat `bg-card-accent-bg` on top header half (no gradient). Fix: CardHeader uses `-mt-4 pt-4 pb-3 bg-card-accent-bg` to bleed accent into Card's top padding (eliminates white strip). CardContent below remains on default card bg.
- 2026-02-08: **ARCHITECTURE REWRITE — V1 scanning pattern adoption.** Previous content-script-messaging chain was fragile (messages lost, timing issues, SPA misses). Replaced with V1 prototype's proven pattern: `chrome.scripting.executeScript({ func: scrapeJobPage, target: { tabId, allFrames: true } })` called directly from side panel. Key changes:
  - `scanner.ts` — Complete rewrite as self-contained function (no imports/closures) for executeScript serialization. 4-layer extraction: JSON-LD → CSS selectors (55+ selectors covering LinkedIn, Indeed, Greenhouse, Lever, Workday, Glassdoor, ZipRecruiter, Ashby, etc.) → OpenGraph → generic fallbacks. Includes `window.getSelection()` strategy from V1.
  - `job-detector.ts` — Expanded from 10 → 28 URL patterns from V1 (added LinkedIn `currentJobId=` for SPA modal, Indeed query params, Workday variants, Monster, Dice, SimplyHired, CareerBuilder, BuiltIn, generic career pages).
  - `background/index.ts` — Complete rewrite: three detection triggers (`chrome.tabs.onUpdated` for full loads, `chrome.webNavigation.onHistoryStateUpdated` for SPA/LinkedIn, `chrome.tabs.onActivated` for tab switch). 1.5s delay for SPA content rendering. 30s cooldown per URL. Storage-based signaling (`chrome.storage.local`) instead of runtime.sendMessage.
  - `authenticated-layout.tsx` — Core `performScan(tabId)` uses executeScript directly, aggregates results from multiple frames (longest description wins). Listens for `chrome.storage.onChanged` for auto-scan signals. Scan-on-mount via `chrome.tabs.query`. No more content script messaging chain.
  - `content/index.ts` — Simplified to minimal placeholder (scanning handled by side panel + executeScript).
  - `wxt.config.ts` — Added `tabs` and `webNavigation` permissions.
- 2026-02-08: Review fix — ScanEmptyState styling. Changed from dashed border (`border-dashed border-muted-foreground/20`) to accent border card (`border-2 border-card-accent-border`) matching resume card pattern. "Scan This Page" button changed from `variant="outline"` to default (primary color) for visibility.
- 2026-02-08: Review fix — Error state in authenticated-layout styled with `border-2 border-card-accent-border` card, retry button + paste fallback (matches empty state pattern).
- 2026-02-08: Review fix — Loading skeleton storybook fix. `job-card.stories.tsx` replaced `require("@/components/ui/skeleton")` with static `import { Skeleton }` (ESM/Vite incompatibility).
- 2026-02-08: Review fix — Extension sidebar stories complete rewrite. Removed old tab-based stories. New stories use `children` prop pattern: ScanEmpty, ScanLoading, ScanSuccess, ScanError, MaxedOut, Login. Added `AuthenticatedShell` helper for consistent layout.
- 2026-02-08: **Code review (adversarial) — 10 issues found, 7 fixed automatically:**
  - **H1 FIXED:** `handleManualEntry` used `window.location.href` (returns `chrome-extension://…` in side panel). Fixed: uses `chrome.tabs.query` to get active tab URL.
  - **H2 FIXED:** `performScan` and `handleSaveJob` never synced job data to `sidebarStore.jobData` (only scan-store held it). Fixed: `setJobData()` called after scan success and after save.
  - **H3 FIXED:** Spread order bug in `scan-store.saveJob()` — `...editedJobData` after explicit fallbacks overwrote them with `undefined`. Fixed: spread comes first, fallbacks override.
  - **M1 FIXED:** Empty content script (`<all_urls>`, `document_idle`) injected 3.34 kB into every page for zero functionality. Fixed: removed entirely (scanning uses `executeScript` from side panel).
  - **M2 FIXED:** `recentlyScanned` Map cleanup only triggered at size > 50. Fixed: prune expired entries on every insert.
  - **M3 FIXED:** Zero test coverage for scan-store, job-detector. Fixed: added 13 scan-store tests + 31 job-detector tests.
  - **M4 FIXED:** Unused `ApiJobResponse` import in scan-store. **L2 FIXED:** Duplicate `WithAllFields` story identical to `Default`.
  - **L1 NOT FIXED (deferred):** Skeleton composition duplicated in 3 places — acceptable per story spec ("NOT a separate component").
  - **L3 FIXED:** Stale completion note said "dashed border" for ScanEmptyState but implementation uses accent border.
  - Extension build: 719.4 kB → 716.26 kB (content script removed). Tests: 66 extension (was 22) + 23 UI = 89 total.

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 — 2026-02-08
**Outcome:** Approved with fixes applied
**Issues Found:** 3 High, 4 Medium, 3 Low (7 fixed, 2 deferred, 1 doc-only)
**Test Coverage Added:** 44 new tests (31 job-detector + 13 scan-store)

### File List

**New files:**
- `packages/ui/src/components/features/job-card.tsx`
- `packages/ui/src/components/features/job-card.stories.tsx`
- `packages/ui/src/components/features/scan-empty-state.tsx`
- `packages/ui/src/components/features/scan-empty-state.stories.tsx`
- `apps/extension/src/lib/message-types.ts`
- `apps/extension/src/features/scanning/job-detector.ts`
- `apps/extension/src/features/scanning/job-detector.test.ts` ← review: M3 fix
- `apps/extension/src/features/scanning/scanner.ts`
- `apps/extension/src/stores/scan-store.ts`
- `apps/extension/src/stores/scan-store.test.ts` ← review: M3 fix

**Modified files:**
- `packages/ui/src/lib/mappers.ts` — extended JobData with employmentType, sourceUrl, status
- `packages/ui/src/lib/mappers.test.ts` — updated tests for new fields
- `packages/ui/src/index.ts` — export JobCard, ScanEmptyState, types
- `packages/ui/src/components/features/job-card.stories.tsx` — static Skeleton import (ESM fix), removed duplicate story (L2)
- `packages/ui/src/components/features/scan-empty-state.tsx` — accent border, primary button
- `packages/ui/src/components/layout/extension-sidebar.stories.tsx` — REWRITE: children prop pattern, scan state stories
- `apps/extension/src/stores/sidebar-store.ts` — import shared JobData/MatchData from @jobswyft/ui
- `apps/extension/src/stores/sidebar-store.test.ts` — updated imports and mock data shapes
- `apps/extension/src/lib/api-client.ts` — added saveJob() method
- `apps/extension/src/entrypoints/background/index.ts` — REWRITE: 3 triggers, storage signaling, improved cleanup (M2)
- `apps/extension/src/features/scanning/scanner.ts` — REWRITE: self-contained function, 55+ selectors, 4-layer extraction
- `apps/extension/src/features/scanning/job-detector.ts` — EXPANDED: 10→28 URL patterns from V1
- `apps/extension/src/components/authenticated-layout.tsx` — REWRITE: V1 executeScript, sidebar sync (H1/H2), storage listener
- `apps/extension/src/stores/scan-store.ts` — spread fix (H3), unused import (M4)
- `apps/extension/wxt.config.ts` — added scripting, tabs, webNavigation permissions

**Removed files:**
- `apps/extension/src/entrypoints/content/index.ts` ← review: M1 fix (empty placeholder, injected on all URLs for nothing)
