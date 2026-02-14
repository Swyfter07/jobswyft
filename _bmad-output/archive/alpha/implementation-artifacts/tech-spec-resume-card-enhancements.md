---
title: 'Resume Card Enhancements — Parsing, Editing & Loading UX'
slug: 'resume-card-enhancements'
created: '2026-02-10'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: [FastAPI, Python 3.11+, WXT 0.20.13, React 19, Zustand 5, Supabase, Tailwind v4, Chrome Extension MV3]
files_to_modify:
  # Backend
  - apps/api/app/models/resume.py
  - apps/api/app/services/ai/prompts.py
  - apps/api/app/routers/resumes.py
  - apps/api/app/services/resume_service.py
  # UI Package
  - packages/ui/src/lib/api-types.ts
  - packages/ui/src/lib/mappers.ts
  - packages/ui/src/components/features/resume/resume-card.tsx
  - packages/ui/src/components/features/resume/experience-section.tsx
  - packages/ui/src/components/features/resume/education-section.tsx
  - packages/ui/src/components/features/resume/projects-section.tsx
  # Extension
  - apps/extension/src/components/resume-detail-view.tsx
  - apps/extension/src/stores/resume-store.ts
  - apps/extension/src/lib/api-client.ts
code_patterns:
  - Pydantic BaseModel with Optional fields + model_dump(exclude_none=True)
  - ApiClient class-based singleton with this.fetch<T>() + unwrap() envelope
  - Zustand + chromeStorageAdapter persistence (partialize for selected fields)
  - UI edit pattern — isEditing + onChange props (established in PersonalInfo + SkillsSection)
  - Sub-components export their own type interfaces (e.g. ResumeExperienceEntry)
  - API types (snake_case) → mappers → UI types (camelCase)
  - setActiveResume() nulls activeResumeData → then fetches (causes lag)
test_patterns:
  - Backend: pytest in apps/api/tests/test_resumes.py
  - UI mappers: vitest in packages/ui/src/lib/mappers.test.ts
---

# Tech-Spec: Resume Card Enhancements — Parsing, Editing & Loading UX

**Created:** 2026-02-10

## Overview

### Problem Statement

Resume experience is incomplete — backend parsing dumps everything into a single `description` string with no separate bullet points, editing is limited to PersonalInfo and Skills only, the loading state is a bare skeleton placeholder, and resume switching triggers redundant API calls instead of using cached data.

### Solution

Enhance backend data model with `description` + `highlights[]` fields on ExperienceItem, EducationItem, and ProjectItem. Improve the AI parsing prompt to extract bullets separately (new uploads only). Add a PATCH endpoint for server-side saves. Port V4's loading UX with simulated progress stages. Extend V4 edit mode to all sections with individual auto-height textareas. Cache resume details locally to prevent redundant fetches on resume switch.

### Scope

**In Scope:**
- Backend model: add `description` + `highlights[]` to ExperienceItem, EducationItem, ProjectItem (NOT certifications)
- AI parsing prompt: extract bullets separately (new uploads only)
- `PATCH /v1/resumes/{id}/parsed-data` endpoint for saving edits
- Delete all users + data from backend (clean slate)
- V4 loading state: Loader2 spinner + descriptive text + simulated progress bar (hardcoded frontend stages)
- V4 edit mode for ALL sections: per-bullet auto-height textareas, add/remove bullets, editable descriptions
- Resume detail caching: cache fetched details locally, skip API call on resume switch if data exists
- Server-side save on edit (via new PATCH endpoint)

**Out of Scope:**
- Reparse existing resumes
- Backend progress events (SSE/WebSocket)
- Certification description/highlights
- Web app (apps/web/)
- Automated tests (manual smoke only)

## Context for Development

### Codebase Patterns

- Backend Pydantic models in `apps/api/app/models/resume.py`
- AI parsing prompt in `apps/api/app/services/ai/prompts.py`
- Resume service in `apps/api/app/services/resume_service.py`
- Resume router in `apps/api/app/routers/resumes.py`
- Extension resume store with chrome.storage persistence in `apps/extension/src/stores/resume-store.ts`
- UI sub-components in `packages/ui/src/components/features/resume/`
- V4 reference code on branch `v4-alpha` in `V4 code/` folder
- API response types + mappers in `packages/ui/src/lib/api-types.ts` and `mappers.ts`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/api/app/models/resume.py` | Backend Pydantic models (ParsedResumeData, ExperienceItem, etc.) |
| `apps/api/app/services/ai/prompts.py` | AI parsing prompt template |
| `apps/api/app/services/resume_service.py` | Resume upload + parse flow |
| `apps/api/app/routers/resumes.py` | Resume API endpoints |
| `packages/ui/src/lib/api-types.ts` | Frontend TypeScript API types |
| `packages/ui/src/lib/mappers.ts` | snake_case → camelCase mappers |
| `packages/ui/src/components/features/resume/resume-card.tsx` | ResumeCard with loading skeleton |
| `packages/ui/src/components/features/resume/experience-section.tsx` | Experience rendering |
| `packages/ui/src/components/features/resume/education-section.tsx` | Education rendering |
| `packages/ui/src/components/features/resume/projects-section.tsx` | Projects rendering |
| `apps/extension/src/components/resume-detail-view.tsx` | Detail view with edit mode |
| `apps/extension/src/stores/resume-store.ts` | Resume state + caching |
| `apps/extension/src/components/authenticated-layout.tsx` | Mount effects + resume fetch orchestration |

### Technical Decisions

1. **Certifications unchanged** — keep current model (name, issuer, date). No description or highlights.
2. **New parsing only** — updated prompt only affects new uploads. Existing data untouched.
3. **Clean slate** — delete all users + data before model changes.
4. **Simulated progress** — frontend hardcodes 3 progress stages (0→40→75→100) with timed transitions. No backend events.
5. **V4 edit pattern** — each bullet = separate auto-height textarea. Add/remove buttons per entry. Description = separate auto-height textarea above bullets.
6. **Resume detail cache** — cache `Map<id, ResumeData>` in resume-store (runtime-only). On `setActiveResume()`, check cache before API call. Invalidate on edit save.
7. **PATCH contract** — `PATCH /v1/resumes/{id}/parsed-data` accepts full `ParsedResumeData` JSON body. Overwrites entire `parsed_data` column. Returns updated `ResumeDetailResponse`.
8. **Education model expansion** — `EducationItem` gets `start_date`, `end_date`, `description`, `highlights[]` (backend already has `graduation_year` which maps to `endDate`; add proper date fields + content).
9. **Project model expansion** — `ProjectItem` gets `highlights[]` field. Already has `description` + `tech_stack`.
10. **Root cause of switch lag** — `setActiveResume()` line 205 does `set({ activeResumeData: null })` forcing UI to show loading, then calls `fetchResumeDetail()`. Fix: check cache first, set from cache immediately, skip API call.

## Implementation Plan

### Tasks

#### Phase 0: Data Wipe

- [ ] **Task 0: Delete all users and data from Supabase**
  - Action: Use Supabase MCP or SQL to truncate all user-related tables (profiles, resumes, jobs, usage_events, etc.) in dependency order. Storage bucket files should also be cleared.
  - Notes: This is a one-time destructive operation. Confirm with user before executing. Order: usage_events → jobs → resumes → profiles (or CASCADE from auth.users if possible). Also clear `resumes` storage bucket.

#### Phase 1: Backend Model + Prompt + Endpoint

- [ ] **Task 1: Enhance Pydantic resume models**
  - File: `apps/api/app/models/resume.py`
  - Action: Modify existing models:
    - `ExperienceItem`: already has `description: Optional[str]` — add `highlights: Optional[List[str]] = None`
    - `EducationItem`: add `start_date: Optional[str] = None`, `end_date: Optional[str] = None`, `description: Optional[str] = None`, `highlights: Optional[List[str]] = None` (keep existing `graduation_year` for backward compat)
    - Add new models:
      - `CertificationItem(BaseModel)`: `name`, `issuer`, `date` (all Optional[str])
      - `ProjectItem(BaseModel)`: `name`, `description`, `tech_stack: Optional[List[str]]`, `url`, `highlights: Optional[List[str]]` (all Optional)
    - `ParsedResumeData`: add `certifications: Optional[List[CertificationItem]] = None`, `projects: Optional[List[ProjectItem]] = None`
  - Notes: All new fields are Optional with None defaults → fully backward compatible with existing parsed_data JSON. No migration needed (JSONB is schemaless).

- [ ] **Task 2: Rewrite resume parsing prompt**
  - File: `apps/api/app/services/ai/prompts.py`
  - Action: Rewrite `RESUME_PARSE_PROMPT` to:
    - Extract `description` as a 1-2 sentence role summary for each experience entry
    - Extract `highlights` as an array of individual bullet points (one per array element)
    - Extract `education` with `start_date`, `end_date` (or `graduation_year` fallback), `description`, `highlights`
    - Extract `certifications` array with `name`, `issuer`, `date`
    - Extract `projects` array with `name`, `description`, `tech_stack`, `url`, `highlights`
    - Keep `contact`, `summary`, `skills` as-is
    - JSON schema in prompt must match the updated Pydantic models exactly
    - Add explicit instruction: "For highlights, extract each bullet point as a separate string in the array. Do NOT concatenate multiple bullets into the description field."
  - Notes: Only affects NEW uploads. Existing parsed_data is untouched.

- [ ] **Task 3: Add update_parsed_data() to ResumeService**
  - File: `apps/api/app/services/resume_service.py`
  - Action: Add method:
    ```python
    async def update_parsed_data(
        self, user_id: str, resume_id: str, parsed_data: dict
    ) -> Optional[dict]:
        # 1. Verify resume exists and belongs to user
        # 2. Validate parsed_data against ParsedResumeData schema
        # 3. Update parsed_data column in resumes table
        # 4. Return updated resume record with is_active computed
    ```
  - Notes: Uses `admin_client.table("resumes").update({"parsed_data": validated_data}).eq("id", resume_id).eq("user_id", user_id)`. Must recompute `is_active` from profiles table (same pattern as `get_resume()`).

- [ ] **Task 4: Add PATCH endpoint to router**
  - File: `apps/api/app/routers/resumes.py`
  - Action: Add new endpoint:
    ```python
    @router.patch("/{resume_id}/parsed-data")
    async def update_resume_parsed_data(
        resume_id: UUID,
        body: ParsedResumeData,
        user: CurrentUser,
        resume_service: ResumeService = Depends(get_resume_service),
    ) -> dict:
    ```
  - Action: Import `ParsedResumeData` from models. Call `resume_service.update_parsed_data()`. Return `ok(ResumeDetailResponse)`.
  - Notes: No signed download URL needed in response (client already has it). But include it for consistency with GET endpoint. Raise `ResumeNotFoundError` if resume not found.

#### Phase 2: Frontend Types + Mappers

- [ ] **Task 5: Update API types**
  - File: `packages/ui/src/lib/api-types.ts`
  - Action:
    - `ApiExperienceItem`: already has `highlights?: string[]` — no change needed
    - `ApiEducationItem`: add `start_date?: string | null`, `end_date?: string | null`, `description?: string | null`, `highlights?: string[]`
    - `ApiCertificationItem`: already correct (name, issuer, date) — no change needed
    - `ApiProjectItem`: add `highlights?: string[]`
    - `ApiParsedResumeData`: already has `certifications?` and `projects?` — no change needed

- [ ] **Task 6: Update mappers**
  - File: `packages/ui/src/lib/mappers.ts`
  - Action:
    - `mapEducation()`: map `start_date` → `startDate`, `end_date` → `endDate` (fallback to `graduation_year` if both null), add `description` → `description`, `highlights` → `highlights`
    - `mapProject()`: add `highlights` → `highlights`
    - Update `ResumeEducationEntry` type (in education-section.tsx): add `description?: string`, `highlights?: string[]`
    - Update `ResumeProjectEntry` type (in projects-section.tsx): add `highlights?: string[]`
  - Notes: Mappers must handle missing fields gracefully (default to empty string / empty array). Existing data without new fields should still map correctly.

#### Phase 3: V4 Loading State

- [ ] **Task 7: Replace loading skeleton with V4 loading UX**
  - File: `packages/ui/src/components/features/resume/resume-card.tsx`
  - Action: Replace `ResumeLoadingSkeleton` component and the loading state render with V4's pattern:
    ```tsx
    function ResumeParsingState() {
      const [progress, setProgress] = useState(0)

      useEffect(() => {
        // Simulated progress: 0 → 40 (1s) → 75 (3s) → stays at 75 until done
        const t1 = setTimeout(() => setProgress(40), 1000)
        const t2 = setTimeout(() => setProgress(75), 3000)
        return () => { clearTimeout(t1); clearTimeout(t2) }
      }, [])

      return (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 text-primary animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Parsing Resume...</p>
              <p className="text-xs text-muted-foreground">
                Extracting skills, experience, and education
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              {progress > 0 ? (
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              ) : (
                <div className="h-full w-1/3 bg-primary rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
              )}
            </div>
            {progress > 0 && (
              <p className="text-micro text-muted-foreground text-right">{progress}%</p>
            )}
          </div>
        </div>
      )
    }
    ```
  - Action: Update the loading state render (currently lines 250-256) to use `<ResumeParsingState />` instead of `<ResumeLoadingSkeleton />` when `isUploading` is true. Keep indeterminate bar for `isLoading` (non-upload loading like fetching detail).
  - Notes: `Loader2` is already imported. `useState`/`useEffect` need to be imported from React (already available via `* as React`). The `animate-[indeterminate_...]` keyframe already exists in globals.css.

#### Phase 4: UI Edit Mode Components

- [ ] **Task 8: Add edit mode to ExperienceSection**
  - File: `packages/ui/src/components/features/resume/experience-section.tsx`
  - Action: Add props to `ExperienceSectionProps`:
    ```typescript
    isEditing?: boolean
    onChange?: (entries: ResumeExperienceEntry[]) => void
    ```
  - Action: In `ExperienceEntryCard`, when `isEditing`:
    - **Title**: `<Input>` (h-7 text-xs)
    - **Company**: `<Input>` (h-7 text-xs)
    - **Start/End Date**: Two `<Input>` side-by-side (h-7 text-xs)
    - **Description**: `<Textarea>` with auto-height (min-h-[60px], resize-none, overflow-hidden). Auto-adjust via `onInput` handler: `e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'`
    - **Highlights**: Each bullet = `<Textarea>` with auto-height (min-h-[40px]) + bullet dot indicator + X remove button. V4 pattern:
      ```tsx
      <div className="flex gap-2 items-start">
        <div className="mt-3 h-1 w-1 rounded-full bg-primary shrink-0" />
        <Textarea
          value={h}
          onChange={(e) => handleHighlightChange(idx, e.target.value)}
          onInput={autoResize}
          className="min-h-[40px] text-xs flex-1 resize-none overflow-hidden"
        />
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeHighlight(idx)}>
          <X className="size-3" />
        </Button>
      </div>
      ```
    - **Add Bullet**: `<Button variant="ghost" size="sm">Add Bullet</Button>` below highlights
  - Action: Pass `isEditing` and entry-level `onChange` through from parent. Parent `ExperienceSection` manages the full array and calls `props.onChange(updatedEntries)` on any change.
  - Notes: Import `Input`, `Textarea` from shadcn. Import `X` from lucide-react. Auto-height textareas use the `onInput` trick (no library needed).

- [ ] **Task 9: Add edit mode to EducationSection**
  - File: `packages/ui/src/components/features/resume/education-section.tsx`
  - Action: Expand `ResumeEducationEntry` type:
    ```typescript
    export interface ResumeEducationEntry {
      degree: string
      school: string
      startDate: string
      endDate: string
      description?: string    // NEW
      highlights?: string[]   // NEW
    }
    ```
  - Action: Add props to `EducationSectionProps`:
    ```typescript
    isEditing?: boolean
    onChange?: (entries: ResumeEducationEntry[]) => void
    ```
  - Action: In read mode, render `description` (if present) below school/dates, and `highlights` as bullet list (same pattern as ExperienceSection).
  - Action: In edit mode, same pattern as Task 8: Input fields for degree/school/dates, auto-height Textarea for description, per-bullet Textareas for highlights, Add Bullet button.
  - Notes: Keep backward compat — entries without `description`/`highlights` still render correctly.

- [ ] **Task 10: Add edit mode to ProjectsSection**
  - File: `packages/ui/src/components/features/resume/projects-section.tsx`
  - Action: Expand `ResumeProjectEntry` type:
    ```typescript
    export interface ResumeProjectEntry {
      name: string
      description: string
      techStack: string[]
      url?: string
      highlights?: string[]   // NEW
    }
    ```
  - Action: Add props to `ProjectsSectionProps`:
    ```typescript
    isEditing?: boolean
    onChange?: (entries: ResumeProjectEntry[]) => void
    ```
  - Action: In read mode, render `highlights` as bullet list below description (before tech stack badges).
  - Action: In edit mode: Input for name/url, auto-height Textarea for description, per-bullet Textareas for highlights, comma-separated Textarea for techStack (same pattern as SkillsSection parse-on-blur), Add Bullet button.
  - Notes: Tech stack editing follows the established Skills pattern: comma-separated text → array on blur.

#### Phase 5: Extension Integration

- [ ] **Task 11: Add resume detail cache + save to resume-store**
  - File: `apps/extension/src/stores/resume-store.ts`
  - Action: Add to state interface:
    ```typescript
    resumeCache: Record<string, ResumeData>;  // runtime-only cache by resume ID
    saveResumeData: (token: string, data: ResumeData) => Promise<void>;
    ```
  - Action: Modify `fetchResumeDetail()`:
    ```typescript
    fetchResumeDetail: async (token, id) => {
      // Check cache first
      const cached = get().resumeCache[id];
      if (cached) {
        set({ activeResumeData: cached, isLoading: false });
        return;
      }
      // ... existing fetch logic ...
      // On success, cache the result:
      set({
        activeResumeData: resumeData,
        resumeCache: { ...get().resumeCache, [id]: resumeData },
        isLoading: false
      });
    }
    ```
  - Action: Modify `setActiveResume()` — remove `activeResumeData: null` from the initial `set()`. Check cache before calling `fetchResumeDetail()`:
    ```typescript
    setActiveResume: async (token, id) => {
      const cached = get().resumeCache[id];
      set({
        error: null,
        activeResumeId: id,
        activeResumeData: cached ?? null,  // instant if cached
      });
      // ... API call to set active ...
      if (!cached) {
        await get().fetchResumeDetail(token, id);
      }
    }
    ```
  - Action: Add `saveResumeData()`:
    ```typescript
    saveResumeData: async (token, data) => {
      set({ error: null });
      try {
        const apiData = reverseMapResumeData(data);  // camelCase → snake_case
        await apiClient.updateParsedData(token, data.id, apiData);
        // Update cache + active data
        set({
          activeResumeData: data,
          resumeCache: { ...get().resumeCache, [data.id]: data },
        });
      } catch (error) {
        set({ error: getErrorMessage(error) });
        throw error;  // re-throw so UI can handle
      }
    }
    ```
  - Action: `resumeCache` must NOT be in `partialize` (runtime-only, not persisted).
  - Notes: `reverseMapResumeData()` is a new utility function that converts the UI's camelCase ResumeData back to the API's snake_case ParsedResumeData shape. Add it either in the store file or as a new export in mappers.ts.

- [ ] **Task 12: Add updateParsedData() to API client**
  - File: `apps/extension/src/lib/api-client.ts`
  - Action: Add method to `ApiClient` class:
    ```typescript
    /** PATCH /v1/resumes/:id/parsed-data — Update resume parsed data. */
    async updateParsedData(
      token: string,
      resumeId: string,
      parsedData: Record<string, unknown>
    ): Promise<ApiResumeResponse> {
      return this.fetch<ApiResumeResponse>(`/v1/resumes/${resumeId}/parsed-data`, {
        method: "PATCH",
        body: JSON.stringify(parsedData),
        token,
      });
    }
    ```
  - Notes: Accepts the snake_case `ParsedResumeData` shape. Returns the full resume response.

- [ ] **Task 13: Rewrite ResumeDetailView for full edit mode + server save**
  - File: `apps/extension/src/components/resume-detail-view.tsx`
  - Action: Major refactor:
    - **State**: Replace `editPersonalInfo`/`editSkills` with a full `editData: ResumeData | null` clone
    - **Enter edit**: Deep-clone entire `activeResumeData` into `editData`
    - **Cancel**: Discard `editData`, exit edit mode
    - **Save**: Call `saveResumeData(token, editData)` from resume-store (server-side save via PATCH). Show loading state on Save button. On success, exit edit mode. On error, show toast/inline error.
    - **Section wiring**: Pass `isEditing` + section-specific `onChange` to ALL sub-components:
      - `PersonalInfo`: existing `isEditing`/`onChange` — update `editData.personalInfo`
      - `SkillsSection`: existing `isEditing`/`onChange` — update `editData.skills`
      - `ExperienceSection`: new `isEditing`/`onChange` — update `editData.experience`
      - `EducationSection`: new `isEditing`/`onChange` — update `editData.education`
      - `ProjectsSection`: new `isEditing`/`onChange` — update `editData.projects`
      - `CertificationsSection`: NO edit mode (per scope decision)
    - **Auth token**: Get from `useAuthStore().accessToken` for the save call
  - Notes: The edit data must be a deep clone to avoid mutating the store directly. Use `JSON.parse(JSON.stringify(data))` or a structured clone.

- [ ] **Task 14: Add reverse mapper (camelCase → snake_case)**
  - File: `packages/ui/src/lib/mappers.ts`
  - Action: Add `reverseMapResumeData()` function:
    ```typescript
    /** Reverse-map UI ResumeData → API ParsedResumeData (for PATCH endpoint) */
    export function reverseMapResumeData(data: ResumeData): Record<string, unknown> {
      return {
        contact: {
          first_name: data.personalInfo.fullName.split(' ')[0] || null,
          last_name: data.personalInfo.fullName.split(' ').slice(1).join(' ') || null,
          email: data.personalInfo.email || null,
          phone: data.personalInfo.phone || null,
          location: data.personalInfo.location || null,
          linkedin_url: data.personalInfo.linkedin || null,
          website: data.personalInfo.website || null,
        },
        skills: data.skills,
        experience: data.experience.map(e => ({
          title: e.title || null,
          company: e.company || null,
          start_date: e.startDate || null,
          end_date: e.endDate || null,
          description: e.description || null,
          highlights: e.highlights.length > 0 ? e.highlights : null,
        })),
        education: data.education.map(e => ({
          degree: e.degree || null,
          institution: e.school || null,
          start_date: e.startDate || null,
          end_date: e.endDate || null,
          graduation_year: e.endDate || null,
          description: e.description || null,
          highlights: e.highlights && e.highlights.length > 0 ? e.highlights : null,
        })),
        certifications: data.certifications?.map(c => ({
          name: c.name || null,
          issuer: c.issuer || null,
          date: c.date || null,
        })) ?? null,
        projects: data.projects?.map(p => ({
          name: p.name || null,
          description: p.description || null,
          tech_stack: p.techStack.length > 0 ? p.techStack : null,
          url: p.url || null,
          highlights: p.highlights && p.highlights.length > 0 ? p.highlights : null,
        })) ?? null,
      }
    }
    ```
  - Notes: Export from `@jobswyft/ui` via index.ts. The `fullName` split is a best-effort reverse of the forward mapper's `[first, last].join(" ")`.

### Acceptance Criteria

- [ ] **AC1:** Given the updated parsing prompt, when a new PDF resume is uploaded, then the response contains `experience[].description` as a role summary AND `experience[].highlights` as an array of individual bullet points (not concatenated).

- [ ] **AC2:** Given a newly parsed resume with education data, when the response is received, then `education[]` entries contain `start_date`, `end_date`, `description`, and `highlights` fields where available in the source PDF.

- [ ] **AC3:** Given a newly parsed resume, when the response is received, then `certifications[]` and `projects[]` arrays are populated with structured data extracted from the PDF.

- [ ] **AC4:** Given a resume with parsed data, when the user sends `PATCH /v1/resumes/{id}/parsed-data` with modified `ParsedResumeData`, then the parsed_data column is updated in the database and the response contains the updated data.

- [ ] **AC5:** Given an unauthorized user, when they call PATCH on another user's resume, then a 404 (RESUME_NOT_FOUND) is returned.

- [ ] **AC6:** Given a resume is uploading, when the ResumeCard renders the loading state, then a Loader2 spinner + "Parsing Resume..." text + animated progress bar (0→40→75%) is shown instead of the skeleton.

- [ ] **AC7:** Given a resume is loading (non-upload fetch), when the ResumeCard renders, then the indeterminate progress bar is shown (existing behavior preserved).

- [ ] **AC8:** Given the ResumeDetailView in edit mode, when the user modifies an experience entry's description or a bullet point, then the change is reflected in the edit state with auto-adjusting textarea height.

- [ ] **AC9:** Given the ResumeDetailView in edit mode, when the user clicks "Add Bullet" on an experience entry, then a new empty bullet textarea is added to that entry.

- [ ] **AC10:** Given the ResumeDetailView in edit mode, when the user clicks the X button on a bullet, then that bullet is removed from the entry.

- [ ] **AC11:** Given the ResumeDetailView in edit mode with changes, when the user clicks Save, then the data is sent to `PATCH /v1/resumes/{id}/parsed-data` and on success the edit mode exits with updated data visible.

- [ ] **AC12:** Given the ResumeDetailView in edit mode, when the user clicks Cancel, then all changes are discarded and the original data is restored.

- [ ] **AC13:** Given a user has 2+ resumes with detail data cached, when they switch between resumes using the dropdown, then the detail view updates instantly without an API call or loading flash.

- [ ] **AC14:** Given a user switches to a resume not yet cached, when the detail is fetched from API, then the result is cached and subsequent switches are instant.

- [ ] **AC15:** Given a user edits and saves a resume, when the save succeeds, then the cache is updated with the new data (not stale).

- [ ] **AC16:** Given an education entry has description and highlights, when viewed in read mode, then the description text and bullet points are visible below the degree/school row.

- [ ] **AC17:** Given a project entry has highlights, when viewed in read mode, then the bullet points are visible below the description and above the tech stack badges.

## Additional Context

### Dependencies

**New npm packages:** None required.

**New Python packages:** None required.

**Runtime dependencies:**
- Local API server: `cd apps/api && uvicorn app.main:app --reload --port 3001`
- Extension env: `WXT_API_URL=http://localhost:3001` in `apps/extension/.env`
- Supabase: Remote instance (already configured)

### Testing Strategy

**Manual smoke testing:**
1. Start local API server
2. Upload a new resume PDF → verify parsed_data has separate `description` + `highlights[]`
3. Open extension → verify V4 loading state during upload
4. Open Resume Detail → click Edit → verify all sections editable
5. Edit bullets (add/remove/modify) → Save → verify PATCH call succeeds
6. Switch between resumes → verify instant switch (no loading flash)
7. Reload extension → switch back → verify cache is cleared (fresh fetch)

**Existing tests to update:**
- `packages/ui/src/lib/mappers.test.ts` — add test cases for new education/project fields + `reverseMapResumeData()`
- `apps/api/tests/test_resumes.py` — add test for PATCH endpoint

### Notes

1. **Task execution order:** Phase 0 (data wipe) → Phase 1 (backend) → Phase 2 (types/mappers) → Phase 3 (loading UX, parallel with Phase 4) → Phase 4 (edit mode components) → Phase 5 (extension integration). Tasks 7-10 can run in parallel. Task 13 depends on Tasks 8-10 + 11-12.
2. **Backward compatibility:** All model changes add Optional fields with None defaults. Old parsed_data (missing `highlights`, `certifications`, `projects`) will parse fine — Pydantic treats missing optional fields as None, mappers default to empty arrays.
3. **fullName split risk:** The reverse mapper splits `fullName` back into `first_name`/`last_name` by space. Names with 3+ parts (e.g. "Mary Jane Watson") put everything after first space into `last_name`. This is acceptable — the AI prompt also originally splits names, so the round-trip is consistent.
4. **Cache invalidation:** Cache is runtime-only (not persisted). On extension reload, cache is empty → fresh fetch for all resumes. On save, cache is updated immediately. On delete, remove from cache.
5. **Auto-height textarea:** Uses the DOM trick `e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'`. No library needed. Works in all modern browsers.
6. **High-risk items:** (a) AI parsing quality — the prompt change may produce inconsistent bullet extraction across different resume formats. (b) Large parsed_data payloads — resumes with many entries could produce large PATCH bodies. (c) The auto-height textarea DOM manipulation may interact poorly with React's synthetic events in rare cases.
7. **Future considerations:** (a) Server-side edit for Experience/Education structured entries (add/remove entire entries, not just edit existing). (b) Reparse existing resumes with updated prompt. (c) Real progress events via SSE during parsing. (d) Optimistic UI updates on save (show changes immediately, rollback on error).
