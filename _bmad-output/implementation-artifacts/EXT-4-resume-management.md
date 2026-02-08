# Story EXT.4: Resume Management

Status: done

## Story

As a **job seeker**,
I want **to upload, view, and manage my resumes in the sidebar**,
so that **I can quickly select the right resume for each application**.

**FRs addressed:** FR7 (upload PDF), FR8 (AI parse), FR9 (max 5), FR10 (active resume), FR11 (view list), FR12 (delete), FR13 (switch resumes), FR13a (expandable blocks), FR13b (expand full content), FR13c (copy to clipboard), FR70 (resume tray)

**Scope:** This story has TWO parts:

1. **UI Rebuild** — Decompose the monolithic 1122-line `resume-card.tsx` into clean, spec-compliant building blocks + composed feature component
2. **Extension Wiring** — Zustand store, API client, and sidebar integration with collapsible + auto-collapse behavior

## Acceptance Criteria

### AC1: Resume List Loading on Sidebar Open

**Given** the user is authenticated and the sidebar is open
**When** the sidebar loads
**Then** `GET /v1/resumes` is called to fetch the user's resume list
**And** the ResumeCard renders in the `contextContent` slot (above tabs) as a collapsible section
**And** the active resume is pre-selected in the dropdown
**And** parsed data for the active resume loads from `GET /v1/resumes/:id`

### AC2: Collapsible Resume Tray with Auto-Collapse

**Given** the ResumeCard is rendered in the contextContent slot
**When** the user is viewing the sidebar
**Then** the entire ResumeCard is wrapped in a collapsible section
**And** when collapsed, only a slim "Resume Context" trigger bar with chevron is visible
**And** when the user switches tabs, the resume section auto-collapses
**And** when the user scrolls the main tab content past 20px, the resume section auto-collapses
**And** the user can manually expand/collapse by clicking the trigger bar
**And** the sidebar orchestrates collapse state via `isOpen`/`onOpenChange` props injected into contextContent

### AC3: Empty State (No Resumes)

**Given** the user has no resumes uploaded
**When** the ResumeCard renders
**Then** a dashed-border empty state is shown per UX spec pattern #7:

- `border-2 border-dashed border-muted-foreground/20 rounded-lg`
- Upload icon centered with pulsing animation
- Text: "Upload your first resume"
- Primary button: "Upload Resume"

### AC4: Resume Upload Flow

**Given** the user clicks "Upload Resume"
**When** the file picker opens and they select a PDF (≤10MB)
**Then** the file is uploaded via `POST /v1/resumes` (multipart/form-data)
**And** a loading skeleton shows during upload and AI parsing
**And** the upload button shows `Loader2 animate-spin` + "Uploading..." text while in progress
**And** on success, the resume appears in the dropdown and parsed data loads
**And** on failure, an inline error displays with `role="alert"`:

- Invalid format → "Only PDF files are allowed"
- Too large → "File size exceeds 10MB limit"
- Limit reached → "Maximum 5 resumes. Delete one to upload more."
- Credit exhausted → "No credits remaining for resume parsing"
- Network error → "Check your connection and try again" + Retry button

### AC5: Switch Active Resume

**Given** the user has resumes in their list
**When** they select a different resume from the dropdown
**Then** `PUT /v1/resumes/:id/active` is called
**And** the active resume indicator updates
**And** parsed data for the newly selected resume loads from `GET /v1/resumes/:id`

### AC6: Expandable Resume Sections (Accordion)

**Given** a resume is selected with parsed data
**When** the user views the ResumeCard
**Then** a parent "Resume Blocks" collapsible wraps 6 sub-sections: Personal Info, Skills, Experience, Education, Certifications, Projects
**And** only one sub-section can be open at a time (accordion behavior)
**And** all sub-sections start collapsed
**And** clicking a section header expands it and collapses the previous

### AC7: Copy to Clipboard

**Given** the user clicks a CopyChip or CopyButton on a resume field/section
**When** the copy action executes
**Then** the content is copied to clipboard
**And** visual "Copied!" feedback appears (CopyChip: border-primary/50 bg-primary/10 scale-105; CopyButton: Check icon replaces Copy icon)

### AC8: Delete Resume

**Given** the user clicks "Delete" on a resume
**When** the AlertDialog appears with "Keep" | "Delete Resume" button pair
**Then** confirming calls `DELETE /v1/resumes/:id`
**And** the resume is removed from the list
**And** if the deleted resume was active, the first remaining resume becomes active
**And** if no resumes remain, the empty state renders

### AC9: Upload Limit Enforcement

**Given** the user already has 5 resumes
**When** they try to upload another
**Then** the upload is blocked client-side with message "Maximum 5 resumes. Delete one to upload more."

### AC10: State Preservation

**Given** the user switches tabs, navigates to a new job page, or performs a manual reset
**When** any state change event occurs
**Then** resume selection ALWAYS persists (per State Preservation Matrix — resume persists through everything)

## Tasks / Subtasks

### Part 1: UI Component Rebuild (packages/ui/)

- [x] **Task 1: Delete old resume-card.tsx and create new file structure** (AC: all)
  - [x] 1.1: Delete `packages/ui/src/components/features/resume-card.tsx` (1122 lines). **CRITICAL:** Do NOT copy visual code; reference for logic only.
  - [x] 1.2: Delete `packages/ui/src/components/features/resume-card.stories.tsx` (442 lines)
  - [x] 1.3: Create new directory structure:
    ```
    packages/ui/src/components/
    ├── blocks/
    │   ├── copy-chip.tsx              # CopyChip + CopyButton (reusable)
    │   └── collapsible-section.tsx     # CollapsibleSection (generic expandable, replaces ResumeSection)
    ├── features/
    │   └── resume/
    │       ├── resume-card.tsx         # Main composed ResumeCard
    │       ├── resume-card.stories.tsx # Storybook stories
    │       ├── resume-empty-state.tsx  # Dashed-border empty state
    │       ├── personal-info.tsx       # Personal info CopyChips
    │       ├── skills-section.tsx      # Skills with show-more
    │       ├── experience-section.tsx  # Experience entries (accordion)
    │       ├── education-section.tsx   # Education entries
    │       ├── certifications-section.tsx # Cert cards
    │       └── projects-section.tsx    # Project cards with tech badges
    ```

- [x] **Task 2: Build reusable blocks** (AC: #7)
  - [x] 2.1: **`blocks/copy-chip.tsx`** — Extract from old resume-card.tsx:
    - `CopyButton`: Ghost icon button (Tooltip + Copy/Check icon swap), uses `navigator.clipboard.writeText`
    - `CopyChip`: Badge-style inline button with icon + label + copy behavior. States: default → copied (border-primary/50 bg-primary/10 scale-105)
    - Custom hook `useClipboard()` if not already shared (check if it exists)
    - Zero hardcoded colors. Use semantic tokens only.
    - Export both + types from `@jobswyft/ui`
  - [x] 2.2: **`blocks/collapsible-section.tsx`** — New generic component replacing old `ResumeSection`:
    - Props: `icon`, `title`, `count?`, `copyAllValue?`, `open`, `onOpenChange`, `isParent?`, `children`
    - Uses shadcn `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent`
    - Header: icon (size-4) + title (font-semibold) + optional count Badge + optional CopyButton + ChevronDown (rotates on open)
    - `isParent` style: `bg-transparent hover:bg-muted/50` (no gradient)
    - Non-parent style: `hover:bg-muted/30` with subtle bg on open
    - Content: `animate-accordion-down`/`animate-accordion-up` + `fade-in-0 slide-in-from-top-2`
    - Zero hardcoded colors
    - Export + types from `@jobswyft/ui`

- [x] **Task 3: Build resume section sub-components** (AC: #6, #7)
  - [x] 3.1: **`features/resume/personal-info.tsx`** — Maps personal data fields to CopyChips:
    - Fields: fullName (User icon), email (Mail), phone (Phone), location (MapPin), linkedin (Globe), website (ExternalLink)
    - Skip fields with empty/null values
    - Flex wrap layout
  - [x] 3.2: **`features/resume/skills-section.tsx`** — Skills display:
    - Shows first 6 skills as text items
    - "+N more" button to expand (text-xs text-muted-foreground hover:text-primary)
    - All skills visible when expanded
  - [x] 3.3: **`features/resume/experience-section.tsx`** — Experience entries:
    - Shows 2 entries max, "View all N" button to expand
    - Each entry: Collapsible card with title "at" company, date range
    - Expanded: description text + bullet highlights
    - CopyButton per entry (copies full formatted text)
  - [x] 3.4: **`features/resume/education-section.tsx`** — Education entries:
    - All entries visible
    - Each entry: Collapsible card with degree, school, graduation year
    - CopyButton per entry
  - [x] 3.5: **`features/resume/certifications-section.tsx`** — Certification cards:
    - Award icon (size-3.5 text-primary/70) + name (truncated) + issuer & date (text-micro text-muted-foreground)
    - CopyButton per cert
  - [x] 3.6: **`features/resume/projects-section.tsx`** — Project cards:
    - Collapsible: title + external-link icon if URL
    - Tech stack: 3 badges visible + "+N" overflow
    - Expanded: full description + all tech as CopyChips
    - CopyButton per project

- [x] **Task 4: Build ResumeEmptyState** (AC: #3)
  - [x] 4.1: **`features/resume/resume-empty-state.tsx`** — Per UX spec pattern #7:
    - Container: `border-2 border-dashed border-muted-foreground/20 rounded-lg p-6`
    - Icon: `FileText` centered, `size-8 text-muted-foreground/40`, subtle pulse animation
    - Text: "Upload your first resume" (text-sm text-muted-foreground text-center)
    - CTA: `<Button variant="default">Upload Resume</Button>` (primary)
    - Props: `onUpload?: () => void`

- [x] **Task 5: Build ResumeCard (composed feature component)** (AC: #1, #2, #5, #6, #7, #8, #9)
  - [x] 5.1: **`features/resume/resume-card.tsx`** — Main composed component:
    - **No variant system** — single consistent visual treatment
    - **Card wrapper**: `Card` with `shadow-sm bg-card`
    - **Collapsible wrapper** (from adaptive branch pattern):
      - Wraps entire card content in `Collapsible`
      - `CollapsibleContent` contains the card body (header + sections)
      - `CollapsibleTrigger` at bottom: slim bar with "Resume Context" label + ChevronUp
      - Collapsed state: only trigger bar visible with `bg-secondary/40`
      - Expanded state: full card with `bg-muted/30` trigger bar
      - Props: `isCollapsible`, `isOpen` (controlled), `onOpenChange`
    - **Header**: Select dropdown + resume counter ("1/3") + Upload button (ghost, size-icon) + Delete button (ghost, size-icon, text-destructive)
    - **Content**: Parent `CollapsibleSection` "Resume Blocks" with count badge → 6 sub-sections (accordion, single-open):
      - Personal Info, Skills, Experience, Education, Certifications, Projects
      - Each uses the `CollapsibleSection` block + its content component
      - `Separator` between sections
    - **Delete confirmation**: shadcn `AlertDialog` (NOT Dialog) with "Keep" | "Delete Resume" buttons
    - **Loading state**: `isLoading` prop → Skeleton shimmer in content area
    - **Upload progress**: `isUploading` prop → Upload button disabled + Loader2 spinner
    - **Error display**: `error` prop → inline `role="alert"` message + optional retry callback
  - [x] 5.2: Props interface:
    ```typescript
    interface ResumeCardProps {
      resumes: ResumeSummary[];
      activeResumeId: string | null;
      resumeData: ResumeData | null;
      isLoading?: boolean;
      isUploading?: boolean;
      error?: string | null;
      onResumeSelect?: (id: string) => void;
      onUpload?: () => void;
      onDelete?: (id: string) => void;
      onRetry?: () => void;
      onClearError?: () => void;
      isCollapsible?: boolean;
      isOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
      className?: string;
    }
    ```

- [x] **Task 6: Storybook stories** (AC: all)
  - [x] 6.1: **`features/resume/resume-card.stories.tsx`** — Stories:
    - `Default` — Full resume data, 3 resumes, interactive wrapper
    - `EmptyState` — No resumes uploaded (dashed border)
    - `Loading` — Skeleton shimmer while fetching
    - `Uploading` — Upload in progress (spinner on button)
    - `Error` — Inline error with retry
    - `MaxResumes` — 5 resumes at limit
    - `MinimalResume` — New grad with limited data
    - `Collapsed` — Collapsible in collapsed state (slim trigger bar)
    - `ExtensionViewport` — 360px width constraint
    - `DarkMode` — Dark theme variant
  - [x] 6.2: Stories for blocks:
    - `blocks/copy-chip.stories.tsx` — CopyChip + CopyButton demos
    - `blocks/collapsible-section.stories.tsx` — CollapsibleSection demos (parent vs child, open/closed)

- [x] **Task 7: Update exports in index.ts** (AC: all)
  - [x] 7.1: Remove old exports: `ResumeCard`, `CopyChip`, `CopyButton`, `ResumeSection`, `ResumeEmptyState` + all types
  - [x] 7.2: Add new exports from new paths:
    - `CopyChip`, `CopyButton` from `blocks/copy-chip`
    - `CollapsibleSection` from `blocks/collapsible-section`
    - `ResumeCard`, `ResumeEmptyState` from `features/resume/resume-card` and `features/resume/resume-empty-state`
    - All types: `ResumeData`, `ResumeSummary`, `ResumeCardProps`, `ResumePersonalInfo`, etc.
  - [x] 7.3: Verify `pnpm build` passes in packages/ui/

### Part 2: Extension Wiring (apps/extension/)

- [x] **Task 8: Add Resume API Methods to api-client.ts** (AC: #1, #4, #5, #8)
  - [x] 8.1: Verify `packages/ui/src/lib/api-types.ts` types (`ApiResumeResponse`, `ApiResumeListItem`) match backend models.
  - [x] 8.2: Add `listResumes(token)` → GET `/v1/resumes` with auth header
  - [x] 8.3: Add `getResume(token, id)` → GET `/v1/resumes/${id}` with auth header
  - [x] 8.4: Add `uploadResume(token, file)` → POST `/v1/resumes` with FormData + auth header (NO explicit Content-Type)
  - [x] 8.5: Add `setActiveResume(token, id)` → PUT `/v1/resumes/${id}/active` with auth header
  - [x] 8.6: Add `deleteResume(token, id)` → DELETE `/v1/resumes/${id}` with auth header

- [x] **Task 9: Create Zustand Resume Store** (AC: #1, #4, #5, #8, #9, #10)
  - [x] 9.1: Create `stores/resume-store.ts` with state:
    - **Import** `chromeStorageAdapter` from `../lib/chrome-storage-adapter`
    - `resumes: ResumeListEntry[]` (id, fileName, isActive, parseStatus)
    - `activeResumeId: string | null`
    - `activeResumeData: ResumeData | null`
    - `isLoading: boolean`
    - `isUploading: boolean`
    - `error: string | null`
  - [x] 9.2: Actions: `fetchResumes`, `fetchResumeDetail`, `uploadResume`, `deleteResume`, `setActiveResume`, `clearError`
  - [x] 9.3: Persist via `chromeStorageAdapter` (key: `jobswyft-resumes`). Partialize: only `resumes` + `activeResumeId`
  - [x] 9.4: Local `ResumeListEntry` type + mapper (extends `ResumeSummary` imported from `@jobswyft/ui` with `isActive`, `parseStatus`)

- [x] **Task 10: Wire into AuthenticatedLayout + ExtensionSidebar** (AC: #1, #2, #3)
  - [x] 10.1: Import `ResumeCard` from `@jobswyft/ui` in `authenticated-layout.tsx`
  - [x] 10.2: Create resume section that reads from `useResumeStore()` + `useAuthStore()`
  - [x] 10.3: Pass as `contextContent` to `ExtensionSidebar`
  - [x] 10.4: **Update `ExtensionSidebar`** (in packages/ui/) to add auto-collapse behavior from adaptive branch:
    - Track `isContextExpanded` state
    - Auto-collapse on tab change (`handleTabChange` sets `isContextExpanded = false`)
    - Auto-collapse on main content scroll past 20px (`handleMainScroll`)
    - `cloneElement` on `contextContent` to inject `isOpen`/`onOpenChange` as controlled props
  - [x] 10.5: Wire hidden file input for upload + all ResumeCard callbacks

- [x] **Task 11: Manual QA** (AC: all)
  - [x] 11.1: Open sidebar → verify resume list loads (or empty state)
  - [x] 11.2: Upload a PDF → verify progress → verify appears in list
  - [x] 11.3: Select different resume → verify active switch + parsed data
  - [x] 11.4: Expand/collapse sections → verify accordion
  - [x] 11.5: Copy content → verify clipboard + feedback
  - [x] 11.6: Delete resume → verify AlertDialog → verify removal → verify active fallback
  - [x] 11.7: Upload 5th resume → verify limit
  - [x] 11.8: Collapse resume tray → switch tab → return → verify auto-collapsed
  - [x] 11.9: Scroll tab content → verify resume tray auto-collapses
  - [x] 11.10: Close sidebar → reopen → verify resume selection persisted
  - [x] 11.11: Dark mode → verify all components render correctly

- [x] **Task 12: Unit Tests** (AC: all)
  - [x] 12.1: `apps/extension/src/stores/resume-store.test.ts`: Test initial state, actions, persistence, and error handling.
  - [x] 12.2: `packages/ui/src/lib/mappers.test.ts`: Verify `mapResumeList` and `mapResumeResponse` handles API data correctly.

## Dev Notes

### CRITICAL: FULL REBUILD — Do NOT Reuse Old resume-card.tsx

The existing `resume-card.tsx` (1122 lines) is a **monolithic prototype from the adaptive-sidebar branch**. It must be **completely replaced**, not patched. Key problems:

- 13+ sub-components in a single file
- 3-variant system (default/subtle/bold) via React Context — dropped per user decision
- Uses `Dialog` instead of `AlertDialog` for destructive actions
- Missing loading/uploading/error states
- No collapsible wrapper integration
- Some hardcoded values remain despite audit passes
- `ScrollArea` with `maxHeight` prop conflicts with sidebar's `contextContent` slot

**Reference the old code for logic/behavior only** — rebuild all visual output from scratch using our design tokens and patterns.

### Collapsible Resume Tray Pattern (From Adaptive Branch)

The user explicitly wants the pattern from `feat/adaptive-sidebar-maxed-out` where:

1. **ResumeCard wraps content in a Collapsible:**

```tsx
<Collapsible open={isOpen} onOpenChange={onOpenChange}>
  <CollapsibleContent>{/* card header + sections */}</CollapsibleContent>
  <CollapsibleTrigger>
    {/* Slim bar: "Resume Context" label + ChevronUp */}
    {/* Collapsed: label visible, chevron rotated 180deg */}
    {/* Expanded: label hidden, chevron normal */}
  </CollapsibleTrigger>
</Collapsible>
```

2. **ExtensionSidebar orchestrates collapse:**

```tsx
// In ExtensionSidebar:
const [isContextExpanded, setIsContextExpanded] = useState(true);

// Auto-collapse on tab switch
const handleTabChange = (val) => {
  setInternalTab(val);
  setIsContextExpanded(false); // ← auto-collapse
  onTabChange?.(val);
};

// Auto-collapse on scroll
const handleMainScroll = (e) => {
  if (isContextExpanded && e.currentTarget.scrollTop > 20) {
    setIsContextExpanded(false);
  }
};

// Inject controlled props via cloneElement
const enhancedContext = React.isValidElement(contextContent)
  ? React.cloneElement(contextContent, {
      isOpen: isContextExpanded,
      onOpenChange: setIsContextExpanded,
    })
  : contextContent;
```

### Backend API Endpoints (All Exist — Verified from Source)

| Endpoint                 | Method | Request                                   | Response                                                         | Errors                                                                    |
| ------------------------ | ------ | ----------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `/v1/resumes`            | GET    | Auth header                               | `paginated({ items: ResumeListItem[], total, page, page_size })` | 401                                                                       |
| `/v1/resumes`            | POST   | Auth + multipart/form-data (`file` field) | `ok({ resume: ResumeResponse, ai_provider_used })`               | 400 (not PDF / >10MB), 401, 422 (CREDIT_EXHAUSTED / RESUME_LIMIT_REACHED) |
| `/v1/resumes/:id`        | GET    | Auth header                               | `ok(ResumeDetailResponse)` with `download_url`, `is_active`      | 401, 404                                                                  |
| `/v1/resumes/:id/active` | PUT    | Auth header                               | `ok({ message, active_resume_id })`                              | 401, 404                                                                  |
| `/v1/resumes/:id`        | DELETE | Auth header                               | `ok({ message })`                                                | 401, 404                                                                  |

**Backend Pydantic models** (from `apps/api/app/models/resume.py`):

- `ResumeListItem`: id, file_name, is_active, parse_status, created_at, updated_at
- `ResumeDetailResponse`: id, file_name, file_path, is_active, parse_status, parsed_data (ParsedResumeData | null), download_url, created_at, updated_at
- `ParsedResumeData`: contact (ContactInfo), summary, experience[], education[], skills[]
- `ContactInfo`: first_name, last_name, email, phone, location, linkedin_url (NO `website` field in backend model)
- `ResumeUploadResponse`: resume (ResumeResponse) + ai_provider_used
- Upload ONLY accepts `application/pdf`

**Backend/Frontend type gap:** Backend `ContactInfo` has no `website` field. Frontend `ApiContactInfo` has `website?: string | null`. The mapper handles this gracefully (undefined). No change needed.

### Data Mapping Layer (Exists in @jobswyft/ui)

```typescript
import {
  mapResumeList,
  mapResumeResponse,
  unwrap,
  unwrapPaginated,
  ApiResponseError,
} from "@jobswyft/ui";
import type {
  ApiResumeListItem,
  ApiResumeResponse,
  ApiPaginatedData,
  ApiResponse,
} from "@jobswyft/ui";
```

- `mapResumeList(items)` → `ResumeSummary[]` (id + fileName only)
- `mapResumeResponse(resume)` → `ResumeData | null` (full parsed data)
- `unwrap(response)` → extracts `data` from envelope, throws `ApiResponseError` on failure
- `unwrapPaginated(data)` → `{ items, total, page, pageSize }`

**Gap:** `mapResumeList` returns only `{ id, fileName }`. The store needs `isActive` and `parseStatus`. Create local `ResumeListEntry` type + mapper in the store file.

**Gap:** No `ApiResumeUploadResponse` type. Upload response has `{ resume: ApiResumeResponse, ai_provider_used: string }`. Handle inline in api-client.

### Design Token Rules (MANDATORY — Zero Hardcoded Colors)

- All colors from `globals.css` semantic tokens
- Card: `bg-card shadow-sm`
- Borders: `border-border`, accents: `border-2 border-card-accent-border`
- Text: `text-foreground`, `text-muted-foreground`, destructive: `text-destructive`
- Icons: `text-muted-foreground`, active: `text-primary`
- Micro text: `.text-micro` class (not `text-[10px]`)
- Size shorthand: `size-X` not `h-X w-X`
- Empty state dashed border: `border-muted-foreground/20`
- Error display: `text-destructive bg-destructive/10 rounded-md px-3 py-2`
- ZERO `bg-gray-*`, `text-slate-*`, `from-gray-*` etc.

### UX Spec Compliance Checklist

| Pattern                     | Spec Reference                | Implementation                                                     |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Dashed border empty state   | UX spec pattern #7            | `border-2 border-dashed border-muted-foreground/20` + pulsing icon |
| AlertDialog for destructive | UX spec button pairs          | "Keep" left, "Delete Resume" right                                 |
| Collapsible resume tray     | Adaptive branch pattern       | `Collapsible` wrapper with slim trigger bar                        |
| Auto-collapse on tab switch | Adaptive branch pattern       | `ExtensionSidebar` sets `isContextExpanded = false`                |
| Auto-collapse on scroll     | Adaptive branch pattern       | Main content `onScroll` checks `scrollTop > 20`                    |
| Accordion sections          | FR13a/FR13b                   | Single-open `CollapsibleSection` pattern                           |
| Copy feedback               | FR13c                         | CopyChip: scale-105 + border-primary/50; CopyButton: Check icon    |
| Loading skeleton            | Architecture loading patterns | Skeleton shimmer during fetch (500ms–2s)                           |
| Upload spinner              | Architecture loading patterns | `Loader2 animate-spin` on upload button                            |
| Inline error + retry        | Architecture error Tier 1     | `role="alert"` + retry button                                      |

### Accessibility (WCAG 2.1 AA)

| Element                   | Requirement                                                |
| ------------------------- | ---------------------------------------------------------- |
| Upload button (icon-only) | `aria-label="Upload resume"` + `sr-only` text              |
| Delete button (icon-only) | `aria-label="Delete resume"` + `sr-only` text              |
| Collapsible trigger bar   | `<CollapsibleTrigger>` with `sr-only` "Toggle Resume" text |
| AlertDialog               | Radix handles ARIA automatically                           |
| Error messages            | `role="alert"` for screen reader announce                  |
| Loading container         | `aria-busy="true"` during fetch                            |
| Section expand/collapse   | `Collapsible` handles `aria-expanded` automatically        |
| ChevronDown rotation      | CSS transform only (not `aria-hidden` toggle)              |

### API Client Pattern (Extend Existing Class)

```typescript
// In apps/extension/src/lib/api-client.ts — add methods:
async listResumes(token: string) { return this.request('/v1/resumes', { token }) }
async getResume(token: string, id: string) { return this.request(`/v1/resumes/${id}`, { token }) }
async uploadResume(token: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  // DO NOT set Content-Type — browser auto-sets multipart boundary
  return this.request('/v1/resumes', { method: 'POST', body: formData, token, skipContentType: true })
}
async setActiveResume(token: string, id: string) { return this.request(`/v1/resumes/${id}/active`, { method: 'PUT', token }) }
async deleteResume(token: string, id: string) { return this.request(`/v1/resumes/${id}`, { method: 'DELETE', token }) }
```

**CRITICAL:** The existing `request()` method likely sets `Content-Type: application/json`. For upload, the method must NOT set Content-Type when body is FormData. Add a `skipContentType` option or detect FormData body.

### Zustand Store Pattern (Follow EXT.3)

```typescript
export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      /* state + actions */
    }),
    {
      name: "jobswyft-resumes",
      storage: createJSONStorage(() => chromeStorageAdapter),
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
        // DO NOT persist: activeResumeData, isLoading, isUploading, error
      }),
    },
  ),
);
```

### State Preservation Matrix (Resume Row)

| State Category       | Tab Switch | Job URL Change | Manual Reset | Re-Login |
| -------------------- | ---------- | -------------- | ------------ | -------- |
| **Resume selection** | persist    | persist        | persist      | persist  |

Resume is THE most persistent state.

### Previous Story Learnings

**From EXT.3:**

- Zustand persist with `chromeStorageAdapter` works — use same pattern
- `partialize` critical — only persist lightweight data
- Class-based `ApiClient` — extend with resume methods
- `useAuthStore().accessToken` provides token for API calls
- `ApiResponseError` for API errors, `TypeError` for network errors

**From EXT.2:**

- Component reorg: `blocks/` (reusable), `features/` (composed), `layout/` (shells)
- All imports via `@/components/` alias

**From production audit:**

- Zero hardcoded colors enforced
- `.text-micro` for 10px text
- `size-X` shorthand

### Project Structure Notes

**New files (packages/ui/):**

- `packages/ui/src/components/blocks/copy-chip.tsx`
- `packages/ui/src/components/blocks/copy-chip.stories.tsx`
- `packages/ui/src/components/blocks/collapsible-section.tsx`
- `packages/ui/src/components/blocks/collapsible-section.stories.tsx`
- `packages/ui/src/components/features/resume/resume-card.tsx`
- `packages/ui/src/components/features/resume/resume-card.stories.tsx`
- `packages/ui/src/components/features/resume/resume-empty-state.tsx`
- `packages/ui/src/components/features/resume/personal-info.tsx`
- `packages/ui/src/components/features/resume/skills-section.tsx`
- `packages/ui/src/components/features/resume/experience-section.tsx`
- `packages/ui/src/components/features/resume/education-section.tsx`
- `packages/ui/src/components/features/resume/certifications-section.tsx`
- `packages/ui/src/components/features/resume/projects-section.tsx`

**Deleted files (packages/ui/):**

- `packages/ui/src/components/features/resume-card.tsx` (replaced by resume/ directory)
- `packages/ui/src/components/features/resume-card.stories.tsx`

**Modified files (packages/ui/):**

- `packages/ui/src/components/layout/extension-sidebar.tsx` — Add auto-collapse behavior
- `packages/ui/src/index.ts` — Update exports

**New files (apps/extension/):**

- `apps/extension/src/stores/resume-store.ts`

**Modified files (apps/extension/):**

- `apps/extension/src/lib/api-client.ts` — Add 5 resume methods + FormData support
- `apps/extension/src/components/authenticated-layout.tsx` — Wire ResumeCard as contextContent

### References

- [Source: _bmad-output/planning-artifacts/epics/story-ext4-resume-management.md]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — pattern #7 dashed border, State Preservation Matrix, button pairs]
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md — State Management, Error Handling, Accessibility]
- [Source: _bmad-output/planning-artifacts/epics/component-development-methodology.md — Design Language Rules, blocks/features/layout]
- [Source: git:feat/adaptive-sidebar-maxed-out:packages/ui/src/components/custom/resume-card.tsx — ResumeCardCollapsibleWrapper pattern]
- [Source: git:feat/adaptive-sidebar-maxed-out:packages/ui/src/components/custom/extension-sidebar.tsx — Auto-collapse + cloneElement pattern]
- [Source: packages/ui/src/components/features/resume-card.tsx — OLD component being replaced (reference for logic only)]
- [Source: packages/ui/src/components/layout/extension-sidebar.tsx — contextContent slot]
- [Source: packages/ui/src/lib/mappers.ts — mapResumeList, mapResumeResponse]
- [Source: packages/ui/src/lib/api-types.ts — ApiResumeResponse, ApiResumeListItem]
- [Source: apps/api/app/routers/resumes.py — Backend endpoint implementations]
- [Source: apps/api/app/models/resume.py — Backend Pydantic models (ContactInfo has no website field)]
- [Source: apps/extension/src/lib/api-client.ts — Existing API client class pattern]
- [Source: apps/extension/src/stores/sidebar-store.ts — Zustand + persist + chromeStorageAdapter pattern]
- [Source: _bmad-output/implementation-artifacts/EXT-3-authenticated-navigation-sidebar-shell.md — Previous story context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build conflict: TS2484 export declaration conflicts — resolved by removing `export` from interface declarations, keeping only `export type {}` block
- Extension missing vitest — added as devDep + test script

### Completion Notes List

- **Part 1 (UI Rebuild):** Decomposed 1122-line monolithic resume-card.tsx into 13 clean files across blocks/ and features/resume/ directories
- **Blocks extracted:** CopyChip + CopyButton (reusable), CollapsibleSection (generic, replaces old ResumeSection)
- **Section components:** PersonalInfo, SkillsSection, ExperienceSection, EducationSection, CertificationsSection, ProjectsSection — all with zero hardcoded colors
- **ResumeEmptyState:** UX spec pattern #7 (dashed border, pulsing icon, primary CTA)
- **ResumeCard:** Composed feature component with loading skeleton, upload spinner, inline error+retry, AlertDialog for delete, collapsible tray wrapper
- **Storybook:** 10 stories for ResumeCard (Default, EmptyState, Loading, UploadingFromEmpty, Error, MaxResumes, MinimalResume, Collapsed, ExtensionViewport, DarkMode) + 4 block stories
- **New shadcn components:** AlertDialog, Skeleton added to UI package
- **Part 2 (Extension Wiring):** API client extended with 5 resume methods + FormData support, Zustand resume store with persistence, AuthenticatedLayout wired with ResumeCard as contextContent
- **ExtensionSidebar updated:** Auto-collapse on tab switch, auto-collapse on scroll >20px, cloneElement pattern for controlled isOpen/onOpenChange
- **Tests:** 12 unit tests for resume store (initial state, fetch, upload validation, upload success, delete with fallback, setActive, clearError)
- **Builds:** UI package 127.31 kB (gzip 24.76 kB), Extension 703.39 kB — both pass cleanly
- **All existing tests pass:** 23 UI tests + 24 extension tests (theme-store.test.ts pre-existing failure excluded)

### Review Pass 1 — CopyChip & Experience Show-More

- **CopyChip tick color:** Changed from `text-primary` (orange) to `text-success` (green) for both CopyButton and CopyChip — tick is now visible after hover
- **CopyChip tick placement:** Tick now renders in-place where the icon/copy-icon was (left icon → tick on left, right icon → tick on right), no longer swaps sides
- **CopyChip `iconPosition` prop:** New prop `"left" | "right"` (default `"left"`) — supports both left-icon and right-icon chip variants
- **CopyChip copied state:** Changed from `border-primary/50 bg-primary/10 text-primary scale-105 animate-pulse` to `border-success/50 bg-success/10 text-success` — removes layout-shifting scale/pulse
- **CopyButton tick:** Also updated to `text-success`
- **Experience description show-more:** Descriptions >150 chars truncated with "…" and inline "show more"/"show less" toggle
- **Experience highlights show-more:** Bullet points capped at 3 visible, "+N more" toggle for the rest
- **ResumeCard accent border:** Added `border-2 border-card-accent-border` to both collapsible and non-collapsible Card wrappers
- **ResumeCard spacing fix (first pass):** Header `py-1` → `py-2`, explicit `<Separator />` between header and content, content area `pb-2` → `py-2`
- **API tech debts documented:** 5 findings added to story file (see section below)
- **New story:** `Blocks/CopyChip/IconRight` — demonstrates right-side icon variant

### Review Pass 2 — ResumeCard Redesign, Empty State, Error, Collapsed Spacing

- **Empty state redesign:** When no resumes + not loading/uploading, ResumeCard now returns ONLY the dotted `ResumeEmptyState` component — no Card wrapper, no header/dropdown, no collapse trigger. The entire resume section becomes just the dashed upload prompt.
- **ResumeEmptyState accent border:** Dotted border changed from `border-muted-foreground/20` to `border-card-accent-border` to match the card accent color. Added `className` prop pass-through. Changed `rounded-lg` to `rounded-xl` to match Card corners.
- **Loading/uploading unified:** Both `isLoading` and `isUploading` now show the same skeleton shimmer. When uploading from empty state, user sees skeleton (not the empty state with a spinner). The `isUploading` prop is kept for backward compatibility but treated identically to `isLoading` for content display.
- **Error state simplified:** Error now replaces resume blocks entirely — when `error` is set, ONLY the error alert is shown (with retry/dismiss), no resume data underneath.
- **Card spacing rebuilt:** Replaced `CardHeader` with plain `div` for full control (`px-2 py-1.5`). Added `gap-0` to Card to eliminate default shadcn 16px flex gap. Removed unused `CardContent` wrapper (plain `div` with `p-0`). Content area uses `px-2 py-1.5`. Result: balanced compact spacing throughout.
- **Collapsed trigger separator:** When expanded, trigger button now has `border-t border-border` for clean visual separation from content above.
- **Collapsed mode spacing fixed:** Extension sidebar context wrapper padding reduced from `p-3` (12px all sides) to `px-2 py-1` — eliminates the large space above the "Resume Context" trigger bar when collapsed.
- **Stories updated:** `Uploading` story replaced with `UploadingFromEmpty` (skeleton from empty state). Error story passes `resumeData={null}`. First experience entry expanded to 6 highlights to showcase highlights show-more. Removed unused `Badge` and `CardContent` imports.

### Review Pass 3 — Upload Auto-Expand & Smooth Collapse Transition

- **Auto-expand on upload:** Added `useEffect` that calls `controlledOnOpenChange(true)` when `isBusy` is true and the collapsible is collapsed — fixes first-time upload from empty state collapsing to "Resume Context" button instead of showing the loading skeleton.
- **Smooth collapse transition:** Added `animate-accordion-down` / `animate-accordion-up` (0.2s ease-out) to the collapsible `CollapsibleContent` wrapper — collapse/expand of the resume context tray now slides smoothly instead of snapping.

### API Tech Debt Findings

1. **Backend `ContactInfo` missing `website` field** — Frontend `ApiContactInfo` has `website?: string | null` but backend Pydantic model `ContactInfo` has no `website` field. Mapper handles gracefully (undefined → skipped in UI). Should be added to backend model and resume parser. → **Relates to Story 2.3 (resume parsed data extensions)**
2. **No `ApiResumeUploadResponse` type** — Upload response shape `{ resume: ApiResumeResponse, ai_provider_used: string }` is handled inline. Should be formalized as a shared type in `api-types.ts`.
3. **Resume parse status not observable** — After upload, `parse_status: "processing"` is returned. There is no polling/SSE mechanism to know when parsing completes. The UI currently re-fetches on next `fetchResumes` call but user has no indication that parsing finished. → **Relates to API.1 (SSE Streaming Infrastructure)**
4. **Upload response doesn't include parsed_data** — After upload, the response `resume` has `parsed_data: null` because parsing is async. A subsequent `getResume` call is needed but parsing may not be done yet. Consider a webhook or SSE event for parse completion.
5. **Copy feedback uses `scale-105 + animate-pulse`** — Removed in favor of green success color border/bg. The previous `scale-105` caused layout shift in tight chip rows.

### Change Log

- 2026-02-07: Implemented EXT-4 Resume Management — full UI rebuild + extension wiring
- 2026-02-07: Review pass 1 — CopyChip (green tick, icon position variants), ResumeCard (accent border, spacing), experience show-more (description + highlights), API tech debt documented
- 2026-02-07: Review pass 2 — ResumeCard redesign (empty state standalone, loading/uploading unified, error replaces blocks, Card spacing rebuilt with gap-0), collapsed trigger spacing fixed (sidebar p-3 → px-2 py-1), ResumeEmptyState accent border + className prop
- 2026-02-07: Review pass 3 — Auto-expand collapsible on upload (useEffect), smooth collapse transition (accordion-down/up animation on CollapsibleContent)
- 2026-02-08: Code Review Fixes — Refactored `api-client.ts` to return typed responses. Fixed state synchronization bug in `resume-store.ts` (added explicit `setActiveResume` call on upload). Cleaned up error handling. Verified with unit tests.

### File List

**New files (packages/ui/):**

- packages/ui/src/components/ui/alert-dialog.tsx
- packages/ui/src/components/ui/skeleton.tsx
- packages/ui/src/components/blocks/copy-chip.tsx
- packages/ui/src/components/blocks/copy-chip.stories.tsx
- packages/ui/src/components/blocks/collapsible-section.tsx
- packages/ui/src/components/blocks/collapsible-section.stories.tsx
- packages/ui/src/components/features/resume/resume-card.tsx
- packages/ui/src/components/features/resume/resume-card.stories.tsx
- packages/ui/src/components/features/resume/resume-empty-state.tsx
- packages/ui/src/components/features/resume/personal-info.tsx
- packages/ui/src/components/features/resume/skills-section.tsx
- packages/ui/src/components/features/resume/experience-section.tsx
- packages/ui/src/components/features/resume/education-section.tsx
- packages/ui/src/components/features/resume/certifications-section.tsx
- packages/ui/src/components/features/resume/projects-section.tsx

**Deleted files (packages/ui/):**

- packages/ui/src/components/features/resume-card.tsx
- packages/ui/src/components/features/resume-card.stories.tsx

**Modified files (packages/ui/):**

- packages/ui/src/components/layout/extension-sidebar.tsx
- packages/ui/src/index.ts

**New files (apps/extension/):**

- apps/extension/src/stores/resume-store.ts
- apps/extension/src/stores/resume-store.test.ts

**Modified files (apps/extension/):**

- apps/extension/src/lib/api-client.ts
- apps/extension/src/components/authenticated-layout.tsx
- apps/extension/package.json
