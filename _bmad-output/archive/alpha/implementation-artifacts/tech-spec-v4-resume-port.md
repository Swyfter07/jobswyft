# Tech Spec: Port V4 Resume Features to Extension

**Status:** `done`
**Branch:** `feat/jobswyft-alpha`
**Created:** 2026-02-09
**Completed:** 2026-02-09
**Commit:** `59a9761` — `feat(ui,extension): port V4 resume detail view with drill-down and edit mode`

---

## Context

The V4 codebase has a rich resume experience with click-to-copy everywhere, collapsible entries, compact trigger mode, and inline editing. Our UI package sub-components (`PersonalInfo`, `SkillsSection`, `ExperienceSection`, etc.) already have the rich read-only display (CopyChip, collapsible entries, highlights). However:

1. The extension's **ResumeDetailView** (`resume-detail-view.tsx`) doesn't use these — it renders basic HTML with plain inputs
2. There's **no drill-down trigger** to open the detail view (the `viewLayer` state exists but nothing sets it to `"resume_detail"`)
3. Sub-components have **no edit mode** — editing only exists in the basic detail view
4. Sub-components are **not exported** from `@jobswyft/ui` (only `ResumeCard` is exported)
5. No **parse progress indicator** — just skeleton during upload

**Excluded:** Variant system (per user request), reparse (no API endpoint exists)

---

## Tasks

### Task 1: Export sub-components from `@jobswyft/ui` — DONE

**File:** `packages/ui/src/index.ts`

Added exports for all 6 resume sub-components + their prop types:

```
PersonalInfo, PersonalInfoProps
SkillsSection, SkillsSectionProps
ExperienceSection, ExperienceSectionProps
EducationSection, EducationSectionProps
CertificationsSection, CertificationsSectionProps
ProjectsSection, ProjectsSectionProps
```

**AC:**
- [x] All 6 components exported from `@jobswyft/ui`
- [x] All 6 prop types exported from `@jobswyft/ui`
- [x] `pnpm build` passes in `packages/ui/`

---

### Task 2: Add `onDrillDown` prop to ResumeCard — DONE

**File:** `packages/ui/src/components/features/resume/resume-card.tsx`

- Added `onDrillDown?: () => void` to `ResumeCardProps`
- Imported `Maximize2` from lucide-react
- Tooltip-wrapped icon button in header action row (between counter and Upload), visible only when `onDrillDown` is provided AND `resumeData` exists

**Post-plan change:** Also stripped the entire resume blocks section and collapsible wrapper from ResumeCard per user request. The card is now a compact header bar: dropdown selector + counter + Maximize2 + Upload + Delete. Resume data is only viewable via the drill-down detail view. Removed 12 unused imports (ChevronUp, Collapsible*, CollapsibleSection, Separator, all sub-component imports, all section icons). UI bundle dropped ~6 kB.

**Removed props:** `isCollapsible`, `isOpen`, `onOpenChange` — no longer needed.

**AC:**
- [x] `onDrillDown` prop in `ResumeCardProps` interface
- [x] Maximize2 button visible in header when `onDrillDown` + `resumeData` provided
- [x] Button hidden when no resume data or no callback
- [x] Existing behavior unchanged when prop not provided
- [x] Resume blocks stripped from card (post-plan user decision)
- [x] Collapsible wrapper removed (post-plan user decision)

---

### Task 3: Add edit mode to `PersonalInfo` — DONE

**File:** `packages/ui/src/components/features/resume/personal-info.tsx`

- Extended `PersonalInfoProps` with `isEditing?: boolean` and `onChange?: (field: keyof ResumePersonalInfo, value: string) => void`
- Imported shadcn `Input` component
- Added `PERSONAL_INFO_FIELDS` constant array defining the 6 fields with their keys, labels, icons, and colSpan
- When `isEditing`, renders a 2-column grid of labeled `Input` fields (`h-7 text-xs`)
- When not editing, CopyChip layout unchanged

**AC:**
- [x] `isEditing` and `onChange` props added (both optional)
- [x] Edit mode renders Input fields in 2-column grid
- [x] Read mode unchanged (CopyChip display)
- [x] No breaking changes to existing consumers

---

### Task 4: Add edit mode to `SkillsSection` — DONE

**File:** `packages/ui/src/components/features/resume/skills-section.tsx`

- Extended `SkillsSectionProps` with `isEditing?: boolean` and `onChange?: (skills: string[]) => void`
- Imported shadcn `Textarea` component
- Local `draft` state synced on entering edit mode via `useEffect`
- Textarea renders comma-separated skills; parses on blur (not every keystroke)
- Read mode unchanged (CopyChip + show more/less)

**AC:**
- [x] `isEditing` and `onChange` props added (both optional)
- [x] Edit mode renders Textarea with comma-separated skills
- [x] Blur handler parses and calls `onChange`
- [x] Read mode unchanged

---

### Task 5: Rewrite `ResumeDetailView` using UI package sub-components — DONE

**File:** `apps/extension/src/components/resume-detail-view.tsx`

Complete rewrite. Replaced the basic 182-line view with a rich composition using V4-style styling:

**Final structure (adapted from V4 editor drawer):**
```
ResumeDetailView
├── Header (sticky, backdrop-blur)
│   ├── ChevronLeft (back button) → onClose
│   ├── fileName + "Read-Only" Badge (when not editing)
│   └── Edit button (outline) / Save + Cancel buttons (when editing)
└── Scrollable Body (bg-muted/5, scrollbar-hidden)
    ├── SectionHeader "Personal Info" (User icon badge)
    │   └── <PersonalInfo isEditing onChange />
    ├── Separator
    ├── SectionHeader "Skills" (Wrench icon badge)
    │   └── <SkillsSection isEditing onChange />
    ├── Separator
    ├── SectionHeader "Experience" (Briefcase icon badge)
    │   └── <ExperienceSection />  (read-only, has internal collapsibles)
    ├── Separator
    ├── SectionHeader "Education" (GraduationCap icon badge)
    │   └── <EducationSection />  (read-only)
    ├── Separator (conditional)
    ├── SectionHeader "Certifications" (Award icon badge) — conditional
    │   └── <CertificationsSection />  (read-only)
    ├── Separator (conditional)
    └── SectionHeader "Projects" (FolderOpen icon badge) — conditional
        └── <ProjectsSection />  (read-only, has internal collapsibles)
```

**V4-style adaptations (post-plan user decision):**
- Dropped `CollapsibleSection` accordion — flat sections, all visible, scrollable (matching V4 drawer)
- V4 section headers: `SectionHeader` with icon in `bg-primary/10 text-primary p-1 rounded` badge + `text-xs font-bold uppercase tracking-widest` label
- Header: "Read-Only" `Badge` when not editing, text "Edit"/"Save"/"Cancel" buttons (not bare icons)
- Sticky header: `bg-background/95 backdrop-blur z-10`
- Spacier layout: `p-4 space-y-6` (was `px-3 py-2 space-y-1`)
- Scroll area: `bg-muted/5 scrollbar-hidden` for subtle depth
- `Separator` between all sections

**Edit flow:**
- Local `editPersonalInfo` and `editSkills` state (snapshots on entering edit)
- Cancel discards edits, Save merges via `updateLocalResumeData`
- Sub-components handle their own edit rendering

**AC:**
- [x] All 6 sections render using UI package sub-components
- [x] V4-style flat layout with icon badge section headers
- [x] Edit mode toggles PersonalInfo and Skills between read/edit
- [x] Save persists edits to resume store
- [x] Cancel discards edits
- [x] Back button calls `onClose`
- [x] Dark mode works throughout
- [x] Zero hardcoded colors

---

### Task 6: Wire drill-down in `AuthenticatedLayout` — DONE

**File:** `apps/extension/src/components/authenticated-layout.tsx`

Added `onDrillDown` prop to `ResumeCard`:
```tsx
onDrillDown={() => setViewLayer("resume_detail")}
```

Also removed `isCollapsible` prop (no longer exists after Task 2 changes).

**AC:**
- [x] `onDrillDown` callback wired to `setViewLayer("resume_detail")`
- [x] Clicking Maximize2 button opens ResumeDetailView
- [x] Back button in ResumeDetailView returns to main view

---

### Task 7: Add `updateLocalResumeData` to resume store — DONE

**File:** `apps/extension/src/stores/resume-store.ts`

Added action to store interface and implementation:

```tsx
updateLocalResumeData: (updates: Partial<ResumeData>) => void

// Implementation:
updateLocalResumeData: (updates) => {
  const current = get().activeResumeData
  if (!current) return
  set({ activeResumeData: { ...current, ...updates } })
}
```

Local-only — not persisted to chrome.storage (since `activeResumeData` is excluded from `partialize`).

**AC:**
- [x] Action added to store interface and implementation
- [x] Merges partial updates correctly
- [x] Does not persist to chrome.storage (by design)

---

### Task 8: Add indeterminate progress bar during upload — DONE

**File:** `packages/ui/src/components/features/resume/resume-card.tsx`

Prepended `ResumeLoadingSkeleton` with indeterminate progress bar:
```tsx
<div className="h-1 w-full bg-muted rounded-full overflow-hidden">
  <div className="h-full w-1/3 bg-primary rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
</div>
```

Also trimmed the skeleton (removed last 2 rows since resume blocks are no longer shown inline).

**File:** `packages/ui/src/styles/globals.css`

Added `indeterminate` keyframe:
```css
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
```

**AC:**
- [x] Indeterminate progress bar visible above skeleton during loading
- [x] Animation smooth and non-distracting
- [x] Works in both dark and light mode

---

## Post-Plan Changes (User Decisions During Implementation)

1. **Resume blocks stripped from ResumeCard** — User decided the card should only show the header bar (dropdown + icons). Resume data is exclusively accessed via the drill-down detail view. Removed `isCollapsible`/`isOpen`/`onOpenChange` props.

2. **V4-style flat sections instead of accordion** — User requested V4 drawer styling for the detail view. Replaced `CollapsibleSection` accordion with flat `SectionHeader` components using V4's icon badge pattern (`bg-primary/10 text-primary p-1 rounded` + uppercase tracking-widest). All sections visible and scrollable.

3. **Header with mode badge and text buttons** — Adopted V4's "Read-Only" badge and Edit/Save/Cancel text button pattern instead of bare icon toggles.

---

## Build Results

| Package | Size | Status |
|---------|------|--------|
| `@jobswyft/ui` | 103.56 kB (gzip: 20.45 kB) | Clean, 43 modules |
| Extension | 778.84 kB total | Clean, no type errors |

UI bundle dropped ~6 kB from 109.43 kB after stripping resume blocks from ResumeCard.

---

## Files Modified

| File | Change |
|------|--------|
| `packages/ui/src/index.ts` | Added 6 component + 6 type exports |
| `packages/ui/src/components/features/resume/resume-card.tsx` | Stripped to compact header bar: `onDrillDown` + Maximize2, removed blocks/collapsible, added progress bar |
| `packages/ui/src/components/features/resume/personal-info.tsx` | Added `isEditing`/`onChange` props + 2-column Input grid |
| `packages/ui/src/components/features/resume/skills-section.tsx` | Added `isEditing`/`onChange` props + Textarea with parse-on-blur |
| `packages/ui/src/styles/globals.css` | Added `indeterminate` keyframe |
| `apps/extension/src/components/resume-detail-view.tsx` | Full rewrite with V4-style flat sections, icon badges, edit mode |
| `apps/extension/src/components/authenticated-layout.tsx` | Added `onDrillDown`, removed `isCollapsible` |
| `apps/extension/src/stores/resume-store.ts` | Added `updateLocalResumeData` action |

## Not In Scope

- **Reparse** — No API endpoint exists (`POST /v1/resumes/:id/reparse`). Defer to future API story.
- **Server-side edit persistence** — No PATCH endpoint for parsed_data. Edits are local-only.
- **Edit mode for Experience/Education/Certifications/Projects** — Complex structured entries, defer to later iteration.
- **Variant system** — Excluded per user request.

## Verification

1. `cd packages/ui && pnpm build` — **PASSED** (103.56 kB, 43 modules)
2. `cd apps/extension && npm run build` — **PASSED** (778.84 kB total)
3. Manual test: Open extension → Maximize2 button in ResumeCard header → click → ResumeDetailView opens with V4-style sections, CopyChip, collapsible entries, highlights
4. Manual test: In detail view → click Edit → PersonalInfo shows Input grid, Skills shows Textarea → edit and Save → data persists in store; Cancel discards
5. Manual test: Upload a resume → indeterminate progress bar appears above skeleton
6. Manual test: Dark mode works throughout all new/modified components
