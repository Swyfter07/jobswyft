# Story 1.3: Card & Block Component Standardization

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want all card-based UI elements (resume cards, job details, sign-in) to have consistent borders, spacing, and padding,
So that the extension looks cohesive and professionally designed.

## Acceptance Criteria

1. **Given** Story 1.2 consolidated from 4 tabs to 3 tabs (removing Coach as main tab)
   **When** Sprint Change Proposal reversed this decision (Coach = main tab, Chat = AI Studio sub-tab)
   **Then** the following revert task must be completed before other Story 1.3 work begins:
   - Restore `coachContent` prop to `ExtensionSidebar` component
   - Add Coach tab trigger (4th tab: Bot icon, "Coach" label)
   - Restore `"coach"` to `MainTab` type in `sidebar-store.ts`
   - Update `authenticated-layout.tsx` to pass `coachContent` prop
   - Update `sidebar-store.test.ts` to include "coach" tab
   - Update ExtensionSidebar Storybook stories for 4-tab structure
   - Verify `isLocked` disables AI Studio, Autofill, AND Coach when no job data

2. **Given** the `ResumeCard` component
   **When** rendered in the sidebar
   **Then** border color uses `border-card-accent-border` pattern (border-2 to show over shadcn ring-1)
   **And** padding and spacing match the UX spec
   **And** the active resume indicator is visually distinct
   **And** dark/light themes render correctly

3. **Given** the Job Details Card (`features/job-card.tsx`)
   **When** rendered after a successful scan
   **Then** the top padding cropping issue is fixed — the `CardHeader` currently uses `-mt-4 pt-4` (line 158) which clips content; adjust to proper padding
   **And** border color matches the standardized card accent pattern
   **And** gradient header pattern (`bg-gradient-to-r from-card-accent-bg to-transparent`) is applied — currently uses solid `bg-card-accent-bg` which must be changed to the gradient
   **And** all fields (title, company, location, salary) have consistent spacing

4. **Given** the sign-in / Google OAuth elements
   **When** rendered in the Logged Out state
   **Then** card border and background follow the same accent pattern as other cards
   **And** the Google sign-in button has proper sizing and alignment
   **And** dark/light themes render correctly

5. **Given** all existing block components (`IconBadge`, `CopyChip`/`CopyButton`, `SkillPill`, `CollapsibleSection`)
   **When** reviewed against design language rules
   **Then** each uses semantic tokens only (zero hardcoded colors)
   **And** CVA variants are complete for all supported states
   **And** sizing uses `size-X` tokens, not `h-X w-X`
   **Note:** `CopyButton` is an export from `copy-chip.tsx`, not a separate component. `CreditBar` does not exist yet — it is a future feature component (not in scope for this story).

6. **Given** all card and block components are fixed
   **When** Storybook stories are reviewed
   **Then** each component has stories for: default, all variants, all states (loading/error/empty/active), dark/light, 360x600 viewport
   **And** all audit issues tagged for Story 1.3 are resolved

## Tasks / Subtasks

### Task 0: Revert 3-Tab to 4-Tab Navigation (AC: #1, Sprint Change Proposal)

**Context:** Story 1.2 consolidated Coach into AI Studio (4 tabs → 3 tabs). Sprint Change Proposal 2026-02-14 reverses this: Coach = main tab, Chat = AI Studio sub-tab (Story 1.4 wires Chat). This task restores the 4-tab structure.

- [ ] 0.1 Update `packages/ui/src/components/layout/extension-sidebar.tsx`:
  - Restore `coachContent` prop to the component interface (was removed in Story 1.2)
  - Add 4th tab trigger: Bot icon, "Coach" label (after Autofill), with `aria-label="Coach"`
  - Add 4th `TabsContent` panel for `coachContent` with `forceMount` + `hidden` pattern
  - Change tab grid from `grid-cols-3` to `grid-cols-4`
  - Add Coach tab to `isLocked` behavior (disabled when no job data, like AI Studio and Autofill)
- [ ] 0.2 Update `apps/extension/src/stores/sidebar-store.ts`:
  - Restore `"coach"` to `MainTab` type: `"scan" | "ai-studio" | "autofill" | "coach"`
- [ ] 0.3 Update `apps/extension/src/stores/sidebar-store.test.ts`:
  - Update tab preservation test to include `"coach"` in the tab list
- [ ] 0.4 Update `apps/extension/src/components/authenticated-layout.tsx`:
  - Restore `coachContent` prop passing to `ExtensionSidebar`
  - Wire `CoachTab` component as `coachContent` prop value (re-import `CoachTab` if removed)
- [ ] 0.5 Update `packages/ui/src/components/layout/extension-sidebar.stories.tsx`:
  - Update all stories to use 4-tab structure
  - Add Coach tab stories (default, locked)
  - Verify grid layout at 360x600 viewport with 4 tabs
- [ ] 0.6 Verify: Run `pnpm test` in `packages/ui/` — all tests pass
- [ ] 0.7 Verify: Run `pnpm build` in `apps/extension/` — build succeeds

### Task 1: Resolve Duplicate Skill-Pill (AC: #5, Registry #15)

- [ ] 1.1 Delete `packages/ui/src/components/custom/skill-pill.tsx` (byte-for-byte duplicate of `blocks/skill-pill.tsx`)
- [ ] 1.2 Update imports in `packages/ui/src/components/custom/job-card.tsx`:
  - Change `import { SkillPill, SkillSectionLabel } from "@/components/custom/skill-pill"` → `"@/components/blocks/skill-pill"`
- [ ] 1.3 Update imports in `packages/ui/src/components/custom/ai-studio.tsx`:
  - Change any `custom/skill-pill` import → `"@/components/blocks/skill-pill"`
- [ ] 1.4 Verify no other files import from `custom/skill-pill` (search codebase)

### Task 2: Fix Broken Imports in custom/job-card.tsx (AC: #5, Registry #16, #17)

**DEPENDENCY: Task 2.2 depends on Task 3 decision. Complete Task 3 first to determine if `custom/job-card.tsx` remains in use before fixing MatchIndicator import.**

- [ ] 2.1 Fix `import { IconBadge } from "@/components/custom/icon-badge"` → `"@/components/blocks/icon-badge"` (file at `blocks/icon-badge.tsx` exists, `custom/icon-badge.tsx` does NOT)
- [ ] 2.2 Fix `import { MatchIndicator } from "@/components/custom/match-indicator"`:
  - **Decision needed:** `MatchIndicator` only exists at `_reference/blocks/match-indicator.tsx` (archived vibecoded prototype — see `_reference/` note below). Options:
    - A) Promote: copy `_reference/blocks/match-indicator.tsx` to `packages/ui/src/components/blocks/match-indicator.tsx` and update import
    - B) If `custom/job-card.tsx` is not the canonical job card (see Task 3), this import fix may be moot
  - **Recommended:** Determine canonical job card first (Task 3), then fix imports only if `custom/job-card.tsx` remains in use
- [ ] 2.3 Verify TypeScript compilation succeeds after import fixes

### Task 3: Determine Canonical Job Card (AC: #3, Registry note)

**Context:** Two overlapping job card implementations exist:
- `features/job-card.tsx` (465 lines) — comprehensive edit workflow, correct imports from `blocks/`, has Storybook story
- `custom/job-card.tsx` (215 lines) — simplified with "Dive Deeper"/"Coach" buttons, broken imports, missing Storybook story

- [ ] 3.1 Analyze both components:
  - `features/job-card.tsx`: Full edit mode, field-by-field editing, scan trigger, gradient header, proper imports. Used by `features/job-card.stories.tsx`.
  - `custom/job-card.tsx`: Simplified display + "Dive Deeper" + "Talk to Coach" CTAs, broken imports, dark mode hack. Used by `custom/ai-studio.tsx` and `custom/coach.tsx`.
- [ ] 3.2 **Decision:** `features/job-card.tsx` is the canonical component. However, `custom/job-card.tsx` serves a different purpose — it's a **compact job summary card** used within AI Studio and Coach views (display-only, no edit mode). Both should remain but with distinct names/purposes:
  - `features/job-card.tsx` → Full interactive JobCard (scan tab, edit mode)
  - `custom/job-card.tsx` → Rename to `custom/job-summary-card.tsx` OR fix imports and keep as the compact variant
- [ ] 3.3 Fix remaining broken imports in `custom/job-card.tsx` per Task 2 decision
- [ ] 3.4 Fix `dark:bg-muted/40` on line 66 of `custom/job-card.tsx` → replace with `bg-muted/40` (which works in both themes via semantic token) or use `bg-card-accent-bg` for consistent card accent pattern
- [ ] 3.5 Fix missing `aria-label` on edit toggle button (line ~103): add `aria-label={isEditing ? "Cancel editing" : "Edit job details"}`

### Task 4: Card Accent Border Standardization (AC: #2, #3, #4)

**Context:** All card-based UI elements should use consistent `border-2 border-card-accent-border` pattern. The `border-2` is required to show over shadcn's default `ring-1`.

- [ ] 4.1 Audit `features/resume/resume-card.tsx`:
  - Verify `border-2 border-card-accent-border` is applied (currently at line 176 — confirmed present)
  - Verify active resume indicator uses semantic tokens
  - Verify padding matches UX spec: card body `p-4` or `p-5`, internal sections `space-y-3`
  - Verify dark/light theme renders correctly
- [ ] 4.2 Audit and fix `features/job-card.tsx`:
  - Verify `border-2 border-card-accent-border` is applied
  - **Apply** gradient header: replace current `bg-card-accent-bg` (line 158) with `bg-gradient-to-r from-card-accent-bg to-transparent` — the solid background must become a gradient per UX spec
  - Fix top padding cropping: `CardHeader` has `-mt-4 pt-4` (line 158) which clips content — adjust to proper padding without negative margin
  - Verify field spacing: `space-y-2` or `space-y-3` between fields
  - Verify dark/light theme renders correctly
  - **DO NOT** fix aria-labels on edit/scan icon buttons — those are Story 1.4 scope (Registry #30, #31)
- [ ] 4.3 Audit `features/login-view.tsx`:
  - Verify sign-in card uses `bg-card-accent-bg border-2 border-card-accent-border` (currently at line 64 — confirmed)
  - Verify Google sign-in button sizing and alignment
  - Verify dark/light theme renders correctly
- [ ] 4.4 Audit `features/scan-empty-state.tsx`:
  - Verify dashed border pattern: `border-2 border-dashed border-muted-foreground/20`
  - OR if using accent border: `border-2 border-card-accent-border` (currently at line 21)
  - Verify empty state pattern matches UX spec: pulsing icon + descriptive text + CTA
- [ ] 4.5 Audit `custom/job-card.tsx` (if kept): Apply same accent border pattern

### Task 5: Block Component Design Language Compliance (AC: #5, Registry #20-23)

- [ ] 5.1 `blocks/copy-chip.tsx` (Registry #20):
  - Add `aria-label="Copy"` to the CopyChip button (line ~117)
  - Review `max-w-[180px]` arbitrary value (line ~131) — consider if a standard Tailwind max-width (`max-w-xs` = 320px or `max-w-48` = 192px) works, or keep if 180px is a deliberate design choice
- [ ] 5.2 `blocks/icon-badge.tsx` (Registry #22):
  - **Defer CVA migration to Story 1.5.** Current `Record<Variant, string>` map works correctly — CVA is a cosmetic consistency improvement, not a functional fix.
  - Verify all 6 variants x 3 sizes use semantic tokens (no hardcoded colors)
  - Verify sizing uses `size-X` pattern
- [ ] 5.3 `blocks/skill-pill.tsx` (Registry #23):
  - **Defer CVA migration to Story 1.5.** Same rationale as icon-badge.
  - Verify variants (`matched`, `missing`, `neutral`) use semantic tokens
  - Verify sizing uses `size-X` pattern
- [ ] 5.4 `blocks/collapsible-section.tsx`:
  - Verify semantic tokens only, no hardcoded colors
  - Verify supports controlled/uncontrolled modes correctly
- [ ] 5.5 Apply `h-X w-X` → `size-X` fixes in Story 1.3 scope only:
  - **In scope:** Any `h-X w-X` patterns found in files modified by this story (blocks/, custom/job-card.tsx, features/job-card.tsx, features/login-view.tsx, features/scan-empty-state.tsx)
  - **Out of scope:** `features/resume/` components (6 instances — defer to Story 1.5 Storybook pass) and `ui/sheet.tsx` (1 instance — DO NOT modify shadcn primitives)

### Task 6: Storybook Story Coverage (AC: #6)

- [ ] 6.1 Create `packages/ui/src/components/blocks/skill-pill.stories.tsx`:
  - Default story: all 3 variants (`matched`, `missing`, `neutral`)
  - SkillSectionLabel story: `success` and `warning` variants
  - Dark mode story
  - Extension viewport (360x600)
- [ ] 6.2 Update `packages/ui/src/components/features/resume/resume-card.stories.tsx`:
  - Ensure stories cover: default, active resume, inactive resume, dark mode, 360x600 viewport
  - Verify accent border pattern is visible in stories
- [ ] 6.3 Update `packages/ui/src/components/features/job-card.stories.tsx`:
  - Ensure stories cover: default, editing mode, scanning/loading (skeleton), dark mode, 360x600 viewport
  - Verify gradient header and accent border visible
- [ ] 6.4 Verify existing stories at 360x600 viewport for:
  - `blocks/icon-badge.stories.tsx` — all 6 variants × 3 sizes
  - `blocks/copy-chip.stories.tsx` — default, copy action, dark mode
  - `blocks/collapsible-section.stories.tsx` — open, closed, controlled
  - `features/login-view.stories.tsx` — default, loading, dark mode
  - `features/scan-empty-state.stories.tsx` — default, dark mode
- [ ] 6.5 Verify all stories render correctly in both light and dark themes

### Task 7: Final Verification (All ACs)

- [ ] 7.1 Run `pnpm test` in `packages/ui/` — all tests pass
- [ ] 7.2 Run `pnpm build` in `packages/ui/` — build succeeds
- [ ] 7.3 Run `pnpm build` in `apps/extension/` — build succeeds
- [ ] 7.4 Run `pnpm storybook` in `packages/ui/` — all stories render at 360x600
- [ ] 7.5 Visual verification: dark/light theme toggle on all modified stories
- [ ] 7.6 Confirm: zero hardcoded colors remain in modified files
- [ ] 7.7 Confirm: all audit issues tagged for Story 1.3 are resolved (Registry #15-23)

## Dev Notes

### Issue Registry Items (from Story 1.1 Audit)

| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 15 | critical | skill-pill (dup) | `packages/ui/src/components/custom/skill-pill.tsx` | Byte-for-byte duplicate of `blocks/skill-pill.tsx` | Remove duplicate, update imports |
| 16 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | Broken import: `MatchIndicator` from `custom/match-indicator` — does not exist | Fix import or resolve canonical card |
| 17 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | Broken import: `IconBadge` from `custom/icon-badge` — does not exist | Fix to `blocks/icon-badge` |
| 18 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | `dark:bg-muted/40` manual dark mode override | Use semantic token |
| 19 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | Edit toggle icon button missing `aria-label` | Add `aria-label` |
| 20 | minor | copy-chip | `packages/ui/src/components/blocks/copy-chip.tsx` | CopyChip button lacks `aria-label` | Add `aria-label="Copy"` |
| 21 | minor | copy-chip | `packages/ui/src/components/blocks/copy-chip.tsx` | `max-w-[180px]` arbitrary value | Review/keep if intentional |
| 22 | minor | icon-badge | `packages/ui/src/components/blocks/icon-badge.tsx` | Uses manual `Record<Variant, string>` map instead of CVA | Consider CVA migration (defer if needed) |
| 23 | minor | skill-pill | `packages/ui/src/components/blocks/skill-pill.tsx` | Uses manual `Record<Variant, string>` map instead of CVA | Consider CVA migration (defer if needed) |

### Sprint Change Proposal Impact (Task 0)

**What changed (2026-02-14):** Coach is restored as a dedicated main-level tab. Chat becomes an AI Studio sub-tab (Story 1.4 wires the Chat content). This reverses Story 1.2's consolidation.

**Files to modify for 4-tab revert:**

| File | Lines | Current State | Target State |
|------|-------|---------------|--------------|
| `packages/ui/src/components/layout/extension-sidebar.tsx` | ~157 | 3 tabs (Scan, Studio, Autofill), `grid-cols-3`, no `coachContent` prop | 4 tabs, `grid-cols-4`, `coachContent` prop restored |
| `apps/extension/src/stores/sidebar-store.ts` | ~12 | `MainTab = "scan" \| "ai-studio" \| "autofill"` | Add `\| "coach"` |
| `apps/extension/src/stores/sidebar-store.test.ts` | varies | Tests 3 tabs | Test 4 tabs including "coach" |
| `apps/extension/src/components/authenticated-layout.tsx` | ~580-596 | No `coachContent` prop | Restore `coachContent={<CoachTab />}` |
| `packages/ui/src/components/layout/extension-sidebar.stories.tsx` | ~235 | 3-tab stories | 4-tab stories |

**What NOT to change (Story 1.4 scope):**
- AI Studio sub-tab internals (Match | Cover Letter | Outreach | Chat)
- Coach component internals (skill-based coaching UI)
- Chat component creation

### Dual Job Card Analysis

**`features/job-card.tsx` (465 lines):**
- Full interactive card with edit mode (pencil toggle), field-by-field editing
- Scan trigger button, solid header `bg-card-accent-bg` (needs gradient fix — see Task 4.2)
- Correct imports from `blocks/` components
- Has Storybook story (`features/job-card.stories.tsx`)
- Used as the primary job card on the Scan tab

**`custom/job-card.tsx` (215 lines):**
- Compact display card with "Dive Deeper" and "Talk to Coach" action buttons
- Broken imports (`custom/icon-badge`, `custom/match-indicator` — don't exist)
- `dark:bg-muted/40` manual dark mode hack on line 66
- Missing `aria-label` on edit toggle
- No Storybook story
- Used by `custom/ai-studio.tsx` and `custom/coach.tsx` as a job context summary

**Resolution:** Both serve distinct purposes — keep both but fix `custom/job-card.tsx` imports and styling issues. The custom version is a compact "job context" card embedded in AI Studio and Coach views.

### `_reference/` Directory Context

The `packages/ui/src/components/_reference/` directory contains archived prototypes from the initial vibecoding phase. These are NOT production components — they were reference implementations used during rapid prototyping. Files here should be treated as source material to potentially promote into official directories (`blocks/`, `custom/`, `features/`), not imported directly.

### MatchIndicator Component Status

`MatchIndicator` exists ONLY in `_reference/blocks/match-indicator.tsx` (archived vibecoded prototype — see above). It is NOT in the official `blocks/` directory. `custom/job-card.tsx` tries to import it from `custom/match-indicator` (also doesn't exist).

**Options:**
1. **Promote:** Copy from `_reference/` to `blocks/match-indicator.tsx` and fix all imports
2. **Inline:** If the component is simple enough, inline the score display in the custom job card
3. **Defer:** If `custom/job-card.tsx` is not actively rendered (broken imports prevent it), defer until Story 1.4 where AI Studio views are fixed

**Recommended:** Option 1 — promote MatchIndicator to `blocks/` since it's referenced in the UX spec as a shared primitive and will be needed across multiple views.

### Card Accent Pattern Reference

From UX Design Specification:

```css
/* Card accent tokens (already in globals.css from Story 1.1) */
--card-accent-border: oklch(0.89 0.068 70);  /* light */
--card-accent-border: oklch(0.37 0.08 55);    /* dark */
--card-accent-bg: oklch(0.97 0.014 70);       /* light */
--card-accent-bg: oklch(0.20 0.025 55);        /* dark */
```

**Standard card pattern:**
```html
<Card className="border-2 border-card-accent-border">
  <CardHeader>...</CardHeader>
  <CardContent className="space-y-3">...</CardContent>
  <!-- Optional two-tone footer -->
  <div className="bg-primary/5 border-t px-4 py-3">...</div>
</Card>
```

**Gradient header pattern (Job Card):**
```html
<CardHeader className="bg-gradient-to-r from-card-accent-bg to-transparent">
  ...
</CardHeader>
```

### Previous Story Intelligence

**Story 1.1 (Design System Audit) — Key Learnings:**
- Added 24 functional area CSS tokens (scan/studio/autofill/coach)
- Fixed 22 hardcoded color instances across 5 files
- Pre-existing broken imports in `custom/` components — specifically `custom/ai-studio.tsx`, `custom/coach.tsx`, `custom/job-card.tsx` reference non-existent `custom/icon-badge`, `custom/match-indicator`, `custom/selection-chips`
- Vite build succeeds despite TypeScript declaration errors (6 broken imports)
- All 31 existing tests pass in `packages/ui`
- `pnpm-lock.yaml` includes `packages/engine` deps from parallel Story 2-1 — do not be alarmed

**Story 1.2 (Shell Layout) — Key Learnings:**
- Consolidated 4→3 tabs (NOW BEING REVERTED in Task 0)
- Shell layout contract enforced: semantic HTML (`aside > header + nav + main + footer`)
- `forceMount` + `hidden` pattern preserves DOM state across tab switches
- `animate-tab-content` only applied after first tab change (not on initial render)
- Tab labels always visible at 360px with `grid-cols-3` (will need verification at `grid-cols-4`)
- Code review patterns: always add `aria-label` to icon buttons, use `Button` from shadcn not raw `<button>`

**Code review fix patterns from previous stories:**
- Added `transition` + `:focus-visible` to gradient buttons (1.1)
- Added `aria-label` on interactive elements (1.1, 1.2)
- Used `.text-micro` class instead of `text-[10px]` (1.1)
- Replaced raw `<button>` with shadcn `<Button>` in Storybook (1.2)
- Conditional `DropdownMenuSeparator` (1.2)

### Git Intelligence (Recent Commits)

```
b7754b2 feat(ui): story 1-2 — shell layout, 3-tab nav, a11y fixes with code review
adbbf16 feat(engine): story 2-1 — engine package scaffold & scan extraction with code review fixes
3c60fa3 fix(ui): story 1-1 code review — gradient a11y, toast fixes, token cleanup
5dfa9fb feat(ui): story 1-1 — design system audit, token gaps fixed, hardcoded colors replaced
```

**Patterns from recent commits:**
- Commit message format: `feat(ui): story X-Y — description with code review`
- UI changes in `packages/ui/` committed with `feat(ui):` prefix
- Extension changes in `apps/extension/` included in same commit
- Code review fixes applied in same commit or separate fix commit

### Testing Standards

- Run `pnpm test` in `packages/ui/` — 31+ existing tests must continue to pass
- Run `pnpm build` in both `packages/ui/` and `apps/extension/` — no build breaks
- Storybook: `pnpm storybook` in `packages/ui/` — verify all stories at 360x600
- Manual verification: dark/light theme toggle
- Check: no hardcoded Tailwind colors in modified files
- Verify: `aria-label` on all icon-only buttons

### Anti-Patterns to Avoid

- Do NOT create separate `*Skeleton` components — compose with `<Skeleton>` inline
- Do NOT use `div`/`span` for interactive elements — use `button`, `a`, or Radix primitives
- Do NOT suppress focus outlines without visible alternative
- Do NOT add CSS with hardcoded colors — use semantic tokens from `globals.css`
- Do NOT fix broken imports in `custom/ai-studio.tsx` or `custom/coach.tsx` — those are Story 1.4 scope (EXCEPT the skill-pill duplicate fix in Task 1 which affects ai-studio imports)
- Do NOT fix aria-labels on `features/job-card.tsx` edit/scan icon buttons — those are Story 1.4 scope (Registry #30, #31)
- Do NOT modify shadcn/ui primitives in `ui/` directory (including `ui/sheet.tsx` `h-X w-X` patterns)
- Do NOT use `h-X w-X` when `size-X` works — check all modified files
- Do NOT use `text-[Npx]` arbitrary font sizes — use `.text-micro` or the type scale

### Framework Versions (Dev Agent Guardrails)

Use these exact versions — do not use APIs or patterns from older versions:

| Framework | Version | Notes |
|-----------|---------|-------|
| React | 19 | Use React 19 APIs (e.g., `use`, server components awareness) |
| Tailwind CSS | 4 | CSS-first config via `@theme inline` in `globals.css` — no `tailwind.config.ts` |
| shadcn/ui | 3 | Latest shadcn patterns — components in `ui/` directory |
| Storybook | 10 | `@storybook/react-vite`, autodocs tag enabled |
| Vitest | 3 | Test runner for `packages/ui/` |
| WXT | ^0.20.13 | Chrome extension framework |
| TypeScript | 5.7 | Strict mode |

### Project Structure Notes

- **Primary files:** `packages/ui/src/components/blocks/`, `packages/ui/src/components/custom/`, `packages/ui/src/components/features/`
- **Archived prototypes:** `packages/ui/src/components/_reference/` — vibecoded prototypes, NOT production code (see `_reference/` note above)
- **Token file:** `packages/ui/src/styles/globals.css` (single source of truth)
- **Extension components:** `apps/extension/src/components/` (authenticated-layout, sidebar-app)
- **Extension stores:** `apps/extension/src/stores/` (sidebar-store)
- **Storybook config:** `packages/ui/.storybook/` (Storybook 10, React Vite)
- **Naming:** kebab-case for TS files, camelCase for TS vars/props
- **Styling:** semantic CSS tokens first, Tailwind utilities second
- **Import paths:** `@/components/blocks/*` for shared blocks, `@/components/custom/*` for compositions

### References

- [Source: UX Design Spec — Card Patterns](../../_bmad-output/planning-artifacts/ux-design-specification.md#visual-design-foundation)
- [Source: UX Design Spec — Component Strategy](../../_bmad-output/planning-artifacts/ux-design-specification.md#component-strategy)
- [Source: UX Design Spec — Spacing & Layout](../../_bmad-output/planning-artifacts/ux-design-specification.md#spacing-layout-foundation)
- [Source: UX Design Spec — Accessibility](../../_bmad-output/planning-artifacts/ux-design-specification.md#accessibility-strategy)
- [Source: Architecture — Implementation Patterns](../../_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- [Source: Architecture — Project Structure](../../_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- [Source: Issue Registry — Story 1.3 Items](../../_bmad-output/implementation-artifacts/1-1-issue-registry.md#story-13-cards--blocks)
- [Source: Sprint Change Proposal](../../_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-14.md)
- [Source: Story 1.1 — Dev Notes & Learnings](../../_bmad-output/implementation-artifacts/1-1-design-system-theme-foundation-audit.md)
- [Source: Story 1.2 — Dev Notes & Learnings](../../_bmad-output/implementation-artifacts/1-2-shell-layout-navigation-fixes.md)
- [Source: Epic 1 — Story 1.3 Definition](../../_bmad-output/planning-artifacts/epics/epic-1-extension-stabilization-ui-polish.md#story-13)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
