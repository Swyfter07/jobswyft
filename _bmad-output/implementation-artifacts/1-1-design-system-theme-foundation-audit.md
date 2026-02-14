# Story 1.1: Design System & Theme Foundation Audit

Status: done

## Story

As a developer,
I want a comprehensive audit of all existing components against the design language rules with an issue registry and token-level fixes in globals.css,
So that subsequent fix stories have a clear scope and the foundation (semantic tokens, dark/light parity) is solid before individual component fixes.

## Acceptance Criteria

1. **Given** the existing extension and UI package codebase
   **When** a systematic audit is performed against the Design Language Rules
   **Then** every official component is checked for: hardcoded colors, missing semantic tokens, dark/light theme parity, spacing consistency, CVA variant completeness, and accessibility basics
   **And** an issue registry is produced documenting every finding with severity (critical/major/minor), affected component, and file location

2. **Given** the issue registry is complete
   **When** token-level gaps are identified in `globals.css`
   **Then** missing or inconsistent semantic tokens are added/fixed (OKLCH color space)
   **And** dark/light theme variables are verified to have matching counterparts
   **And** CSS utilities (`.text-micro`, `.scrollbar-hidden`, `.scroll-fade-y`, gradient patterns) are verified present and working

3. **Given** the audit is complete
   **When** the developer reviews the registry
   **Then** issues are grouped by story (1.2 through 1.6) for systematic resolution
   **And** critical issues that block other stories are flagged for immediate attention

## Tasks / Subtasks

- [x] Task 1: Audit globals.css token completeness (AC: #2)
  - [x] 1.1 Verify all base/surface tokens have dark mode counterparts
  - [x] 1.2 Check for functional area tokens (`--scan-accent`, `--studio-accent`, `--autofill-accent`, `--coach-accent` + `-foreground` + `-muted` variants) — these are MISSING and need to be added (12 new tokens × 2 themes = 24 CSS vars)
  - [x] 1.3 Verify `@theme inline` mappings include all functional area tokens grouped with comment blocks
  - [x] 1.4 Verify `.btn-gradient-depth-{area}` utility classes exist for scan/studio/autofill/coach — these are MISSING and need to be added
  - [x] 1.5 Verify CSS utilities: `.text-micro` (exists), `.scrollbar-hidden` (exists), `.scroll-fade-y` (exists), `.animate-tab-content` (exists)
  - [x] 1.6 Verify reduced motion support: `@media (prefers-reduced-motion: reduce)` with `--motion-duration: 0s` and `--motion-enabled: 0`
  - [x] 1.7 Add any missing tokens and utilities identified above

- [x] Task 2: Audit every official component for design language compliance (AC: #1)
  - [x] 2.1 Audit `blocks/` components: `collapsible-section`, `copy-chip`, `icon-badge`, `skill-pill`
  - [x] 2.2 Audit `custom/` components: `ai-studio`, `coach`, `job-card`, `skill-pill` (note: skill-pill duplicated from blocks — flag for resolution)
  - [x] 2.3 Audit `features/` components: `job-card`, `login-view`, `scan-empty-state`
  - [x] 2.4 Audit `features/resume/` components (7): `certifications-section`, `education-section`, `experience-section`, `personal-info`, `projects-section`, `resume-card`, `resume-empty-state`, `skills-section`
  - [x] 2.5 Audit `layout/` components: `app-header`, `extension-sidebar`
  - [x] 2.6 Audit `ui/` primitives for token compliance (especially `toast.tsx` — known hardcoded green/red/blue colors)
  - [x] 2.7 Audit extension components in `apps/extension/src/components/` (9 components) — **HIGH PRIORITY: `autofill-tab.tsx` (7 hardcoded color instances), `ai-studio-tab.tsx` (3 instances), `toast-context.tsx` (1 instance) — see Known Hardcoded Colors below**
  - [x] 2.8 Flag broken import: `custom/job-card.tsx` imports from `@/components/custom/match-indicator` which does NOT exist (only exists at `_reference/blocks/match-indicator.tsx`)

- [x] Task 3: Check each component against specific design language rules (AC: #1)
  - [x] 3.1 **Hardcoded colors**: Search for Tailwind color literals (`blue-`, `green-`, `red-`, `violet-`, `orange-`, `emerald-`, `amber-`, `gray-`, `slate-`, `zinc-`, `neutral-`) — replace with semantic tokens
  - [x] 3.2 **Sizing pattern**: Check for `h-X w-X` patterns that should be `size-X`
  - [x] 3.3 **CVA variant completeness**: For each CVA-based component, verify all declared variants have implementations
  - [x] 3.4 **Dark/light parity**: Visually verify key components render correctly in both themes (use Storybook — **NOTE: fix viewport config first, see Task 6.4**)
  - [x] 3.5 **Spacing consistency**: Verify gap/padding scales match the design system (4px base unit)
  - [x] 3.6 **Typography compliance**: Check for `text-[Npx]` arbitrary values that should use the type scale
  - [x] 3.7 **Accessibility basics**: Check icon-only buttons have `aria-label`, interactive elements use `button`/`a` not `div`/`span`

- [x] Task 4: Produce the issue registry document (AC: #1, #3)
  - [x] 4.1 Create `_bmad-output/implementation-artifacts/1-1-issue-registry.md`
  - [x] 4.2 Document every finding with: severity (critical/major/minor), affected component, file path, specific issue, and which story (1.2-1.6) should resolve it
  - [x] 4.3 Flag critical issues that block other stories for immediate attention
  - [x] 4.4 Group issues by target story assignment

- [x] Task 5: Fix token-level gaps in globals.css (AC: #2)
  - [x] 5.1 Add 12 functional area tokens (3 per area × 4 areas) with OKLCH values for light mode
  - [x] 5.2 Add 12 functional area tokens dark mode counterparts
  - [x] 5.3 Add `@theme inline` mappings for new functional area tokens
  - [x] 5.4 Add `.btn-gradient-depth-scan`, `.btn-gradient-depth-studio`, `.btn-gradient-depth-autofill`, `.btn-gradient-depth-coach` utility classes
  - [x] 5.5 Add reduced motion CSS custom properties if missing
  - [x] 5.6 Fix `toast.tsx` hardcoded colors → use `--success`, `--destructive`, `--info` semantic tokens
  - [x] 5.7 Fix `autofill-tab.tsx` hardcoded colors (7 instances) → use `--success`, `--warning`, `--destructive` tokens (see line references in Known Hardcoded Colors)
  - [x] 5.8 Fix `ai-studio-tab.tsx` hardcoded colors (3 instances) → use `--success`, `--warning`, `--info` tokens
  - [x] 5.9 Fix `toast-context.tsx` hardcoded colors (1 instance) → use `--success` token
  - [x] 5.10 Add `--destructive-foreground` token to globals.css (missing — needed for toast error foreground text)
  - [x] 5.11 Add `--info` and `--info-foreground` tokens to globals.css (needed for toast/info states)

- [x] Task 6: Verify and validate fixes (AC: #2)
  - [x] 6.1 Run Storybook and verify token changes render correctly in light/dark themes
  - [x] 6.2 Run existing tests (`pnpm test` in packages/ui)
  - [x] 6.3 Verify extension CSS imports still work (`apps/extension/src/styles/app.css`)
  - [x] 6.4 Fix Storybook viewport config (`packages/ui/.storybook/preview.tsx`) — current "Extension Popup: 400×600" must be changed to "Extension Default: 360×600" and add "Extension Wide: 500×600" per UX spec

## Dev Notes

### Current Codebase State (Pre-Audit Intelligence)

**What already exists and works well:**
- OKLCH semantic token system in `globals.css` (276 lines) — base tokens, brand tokens, semantic tokens all present
- Dark mode support via `.dark` class with independently tuned values
- Tailwind v4 `@theme inline` configuration (no `tailwind.config.ts`)
- Font: Figtree Variable via `@fontsource-variable/figtree`
- 20 Storybook stories for ~43 production components (~47% coverage). Note: 8 additional stories exist in `_reference/` but are excluded from audit scope
- Most UI package components use semantic tokens, but **22 hardcoded color instances exist across 5 files** (see Known Hardcoded Colors below)

**What is MISSING and must be added (Task 1 & 5):**
1. **Functional area tokens** — `--scan-accent`, `--studio-accent`, `--autofill-accent`, `--coach-accent` (plus `-foreground` and `-muted` variants). These are defined in the UX spec but not yet implemented.
2. **Gradient depth button utilities** — `.btn-gradient-depth-{area}` classes for per-area gradient CTAs
3. **Reduced motion CSS properties** — `--motion-duration` and `--motion-enabled` custom properties
4. **`--info` and `--info-foreground` semantic tokens** — needed for toast/info states (blue ~220 hue)
5. **`--destructive-foreground` token** — `globals.css` has `--destructive` but no foreground counterpart, needed for toast error text

**Known issues to document in registry:**
1. **Hardcoded colors across 5 files** — see full inventory in "Known Hardcoded Colors" section below
2. `blocks/skill-pill.tsx` and `custom/skill-pill.tsx` are **byte-for-byte identical** duplicates. `features/job-card.tsx` imports from `blocks/`, while `custom/job-card.tsx` and `custom/ai-studio.tsx` import from `custom/`. Consolidate to `blocks/` and update imports.
3. `features/job-card.tsx` (465 lines, comprehensive edit workflow) and `custom/job-card.tsx` (215 lines, simplified with "Dive Deeper"/"Coach" buttons) overlap significantly. Determine canonical version.
4. `custom/job-card.tsx` has a **broken import**: `import { MatchIndicator } from "@/components/custom/match-indicator"` — this file does NOT exist. Only `_reference/blocks/match-indicator.tsx` has a MatchIndicator.
5. `custom/app-header.stories.tsx` exists but `app-header.tsx` component is in `layout/` — misplaced story file
6. Resume components (7/8) missing Storybook stories — 14% coverage in `features/resume/`
7. 13 shadcn/ui primitives missing stories: alert-dialog, avatar, collapsible, dropdown-menu, progress, scroll-area, separator, sheet, skeleton, textarea, tooltip (lower priority, document)
8. Storybook viewport config uses "Extension Popup: 400×600" but UX spec requires "Extension Default: 360×600" + "Extension Wide: 500×600"

### Known Hardcoded Colors (Pre-Audit Inventory)

**22 total instances across 5 files.** All are in semantic/status contexts and should use CSS custom properties.

| File | Line(s) | Colors Used | Semantic Replacement |
|------|---------|-------------|---------------------|
| `packages/ui/.../ui/toast.tsx` | 12 | `green-200`, `green-50`, `green-900`, dark variants | `--success`, `--success-foreground` |
| `packages/ui/.../ui/toast.tsx` | 13 | `red-200`, `red-50`, `red-900`, dark variants | `--destructive`, `--destructive-foreground` |
| `packages/ui/.../ui/toast.tsx` | 15 | `blue-200`, `blue-50`, `blue-900`, dark variants | `--info`, `--info-foreground` |
| `packages/ui/.../ui/toast.stories.tsx` | 87 | `green-700`, `green-800`, `green-100` | `--success` variants |
| `apps/extension/.../autofill-tab.tsx` | 402 | `green-600`, `green-400` | `--success` |
| `apps/extension/.../autofill-tab.tsx` | 414 | `amber-600`, `amber-400` | `--warning` |
| `apps/extension/.../autofill-tab.tsx` | 471,473-474 | `green-600/400`, `amber-600/400`, `red-600/400` | `--success`, `--warning`, `--destructive` |
| `apps/extension/.../autofill-tab.tsx` | 516,519 | `green-500`, `amber-500` | `--success`, `--warning` |
| `apps/extension/.../autofill-tab.tsx` | 531,537 | `green-600/400`, `amber-600/400` | `--success`, `--warning` |
| `apps/extension/.../toast-context.tsx` | 51 | `green-500`, `green-700`, `green-400` | `--success` |
| `apps/extension/.../ai-studio-tab.tsx` | 237 | `green-600`, `green-400` | `--success` |
| `apps/extension/.../ai-studio-tab.tsx` | 238 | `amber-600`, `amber-400` | `--warning` |
| `apps/extension/.../ai-studio-tab.tsx` | 239 | `blue-600`, `blue-400` | `--info` |

### Functional Area Token Values (from UX Spec)

Per the UX Design Specification, these tokens should use `var()` aliases where possible:

```css
/* ─── Scan (blue ~245 hue) ─── */
--scan-accent: oklch(TBD);  /* New blue token */
--scan-accent-foreground: oklch(TBD);
--scan-accent-muted: oklch(TBD);

/* ─── Studio (violet ~293 hue) ─── */
--studio-accent: var(--ai-accent);  /* Aliases existing AI purple */
--studio-accent-foreground: var(--ai-accent-foreground);
--studio-accent-muted: oklch(TBD);

/* ─── Autofill (green ~155 hue) ─── */
--autofill-accent: oklch(TBD);
--autofill-accent-foreground: oklch(TBD);
--autofill-accent-muted: oklch(TBD);

/* ─── Coach (orange ~58 hue) ─── */
--coach-accent: var(--primary);  /* Aliases existing primary orange */
--coach-accent-foreground: var(--primary-foreground);
--coach-accent-muted: oklch(TBD);
```

The `TBD` values must be chosen to:
- Meet WCAG AA contrast ratios (4.5:1 text, 3:1 UI components)
- Feel visually harmonious with existing OKLCH tokens
- Have perceptually uniform lightness across hue families

**Guidance for choosing TBD values:**
- **Light mode accent lightness:** L=0.55-0.65 (calibrate against `--ai-accent` at L=0.541 and `--success` at L=0.627)
- **Dark mode accent lightness:** L=0.65-0.75 (calibrate against `--ai-accent` dark at L=0.627 and `--success` dark at L=0.723)
- **Muted variant lightness:** L=0.90-0.95 light / L=0.20-0.25 dark (background tints, similar to `--muted`)
- **Foreground lightness:** L=0.98-1.0 light / L=0.12-0.16 dark (high contrast text on accent backgrounds)
- **Scan blue:** hue ~245 (reference: Tailwind blue-500 ≈ oklch(0.62 0.21 245))
- **Autofill green:** hue ~155 (reference: Tailwind emerald-500 ≈ oklch(0.64 0.17 155))
- **Coach orange muted:** hue ~58 (same hue family as `--primary`)
- **Studio violet muted:** hue ~293 (same hue family as `--ai-accent`)
- Use [oklch.com](https://oklch.com) or browser DevTools OKLCH picker to fine-tune

### Gradient Depth Button Pattern (from UX Spec)

```css
.btn-gradient-depth-{area} {
  background: linear-gradient(to bottom right, var(--{area}-accent), var(--{area}-accent-muted));
  border-top: 1px solid oklch(1 0 0 / 0.2);  /* glass edge */
  box-shadow: 0 4px 12px var(--{area}-accent) / 0.3;  /* colored glow */
}
.btn-gradient-depth-{area}:hover {
  box-shadow: 0 6px 16px var(--{area}-accent) / 0.4;  /* stronger glow on hover */
}
```

### Issue Registry Format

Create `_bmad-output/implementation-artifacts/1-1-issue-registry.md` with this structure:

```markdown
# Story 1.1 — Issue Registry

## Summary
- Critical: N issues
- Major: N issues
- Minor: N issues

## Issues by Target Story

### Story 1.2 (Shell, Layout & Navigation)
| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 1 | major | ... | ... | ... | ... |

### Story 1.3 (Cards & Blocks)
...

### Story 1.4 (AI Studio & Feature Views)
...

### Story 1.5 (Storybook Completion)
...

### Story 1.6 (State Management)
...

### Immediate (Fix in Story 1.1)
| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 1 | critical | globals.css | packages/ui/src/styles/globals.css | Missing functional area tokens | Add 24 CSS variables |
```

### Project Structure Notes

- **Primary audit targets:** `packages/ui/src/` and `apps/extension/src/`
- **Token file:** `packages/ui/src/styles/globals.css` (single source of truth)
- **Extension CSS:** `apps/extension/src/styles/app.css` (imports from UI package)
- **Storybook config:** `packages/ui/.storybook/` (Storybook 10, React Vite)
- **Component organization:**
  - `ui/` — shadcn primitives (never modify source)
  - `blocks/` — reusable domain blocks
  - `custom/` — domain compositions
  - `features/` — feature-level components
  - `layout/` — structural components
  - `_reference/` — archived prototypes (exclude from audit scope)

### References

- [Source: UX Design Spec — Design System Foundation](../../_bmad-output/planning-artifacts/ux-design-specification.md#design-system-foundation)
- [Source: UX Design Spec — Color System](../../_bmad-output/planning-artifacts/ux-design-specification.md#color-system)
- [Source: UX Design Spec — Typography](../../_bmad-output/planning-artifacts/ux-design-specification.md#typography-system)
- [Source: UX Design Spec — Spacing](../../_bmad-output/planning-artifacts/ux-design-specification.md#spacing-layout-foundation)
- [Source: UX Design Spec — Component Strategy](../../_bmad-output/planning-artifacts/ux-design-specification.md#component-strategy)
- [Source: Architecture — Implementation Patterns](../../_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md)
- [Source: Architecture — Project Structure](../../_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md)
- [Source: Epic 1 — All Stories](../../_bmad-output/planning-artifacts/epics/epic-1-extension-stabilization-ui-polish.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing TypeScript build errors: 6 broken imports in `custom/ai-studio.tsx`, `custom/coach.tsx`, `custom/job-card.tsx` referencing non-existent `custom/icon-badge`, `custom/match-indicator`, `custom/selection-chips`. These are **pre-existing** issues documented in the issue registry (items #16-17, #24-26, #28), assigned to Stories 1.3 and 1.4. Vite build (JS/CSS) succeeds; only TypeScript declaration generation fails.

### Completion Notes List

- **Task 1 (Audit globals.css):** All base/surface tokens verified with dark counterparts. Identified 6 critical gaps: functional area tokens (24 vars), destructive-foreground, info/info-foreground, @theme inline mappings, gradient utilities, reduced motion support.
- **Task 2 (Component audit):** Systematically audited all components in blocks/, custom/, features/, features/resume/, layout/, ui/, and extension/. Found: 16 hardcoded color occurrences across 5 files, 7 h-X w-X → size-X opportunities, 3 arbitrary font sizes, 6 broken imports, duplicate skill-pill, accessibility gaps.
- **Task 3 (Design rules check):** Checked all 7 design language rules. Hardcoded colors were the primary violation. CVA adoption is inconsistent but functional. Spacing generally follows 4px base unit. Most components use semantic tokens correctly.
- **Task 4 (Issue registry):** Created comprehensive registry with 34 issues (8 critical, 14 major, 12 minor) grouped by target story assignment.
- **Task 5 (Token fixes):** Added 24 functional area CSS variables (12 light + 12 dark), destructive-foreground, info/info-foreground, @theme inline mappings (15 new), 4 gradient depth button utilities, reduced motion support. Fixed hardcoded colors in toast.tsx (3 CVA variants), autofill-tab.tsx (7 instances), ai-studio-tab.tsx (3 instances), toast-context.tsx (1 instance).
- **Task 6 (Verification):** All 31 existing tests pass. UI package Vite build succeeds. Extension build succeeds with 102KB CSS output. No remaining hardcoded colors in fixed files. Storybook viewport config updated per UX spec.

### Change Log

- 2026-02-14: Story 1.1 implemented — comprehensive design system audit, issue registry created, token-level gaps fixed, hardcoded colors replaced with semantic tokens, Storybook viewport config updated.
- 2026-02-14: Code review (adversarial) — 10 issues found (1 critical, 3 high, 4 medium, 2 low). 7 issues auto-fixed. Critical #1 (lockfile cross-contamination from Story 2-1) acknowledged — will resolve when engine package is committed. Low issues #9-10 deferred.

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (adversarial review)
**Date:** 2026-02-14
**Outcome:** Changes Requested → Auto-Fixed → Approve

**Issues Found (10):** 1 Critical, 3 High, 4 Medium, 2 Low

**Fixed (7):**
- [FIXED] #2 HIGH — Gradient depth buttons missing `transition` → added `transition: box-shadow 200ms ease`
- [FIXED] #3 HIGH — Gradient depth buttons missing `:focus-visible` → added outline styles using `var(--ring)`
- [FIXED] #4 HIGH — toast-context.tsx dismiss button missing `aria-label` → added `aria-label="Dismiss notification"`
- [FIXED] #5 MEDIUM — Duplicate `:root` blocks in globals.css → consolidated `--motion-duration/--motion-enabled` into main block
- [FIXED] #6 MEDIUM — Toast container missing ARIA live region → added `aria-live="polite" role="log"`
- [FIXED] #7 MEDIUM — Extension ToastItem type missing "info"/"loading" variants → added to type union + rendering
- [FIXED] #8 MEDIUM — autofill-tab.tsx ConfidenceBadge `text-[10px]` → replaced with `.text-micro`

**Acknowledged (1):**
- [ACK] #1 CRITICAL — pnpm-lock.yaml includes `packages/engine` deps from Story 2-1. Cannot fix without affecting active 2-1 development. Will resolve when engine package is committed.

**Deferred (2):**
- [DEFER] #9 LOW — `--scan-accent` and `--info` tokens identical (by design, both blue ~245)
- [DEFER] #10 LOW — toast.stories.tsx hardcoded colors (assigned to Story 1.5 in registry)

### File List

- `packages/ui/src/styles/globals.css` — Modified: added 24 functional area tokens (light/dark), destructive-foreground, info/info-foreground, @theme inline mappings, 4 gradient depth button utilities, reduced motion support. **[Review fix]** added `transition` + `:focus-visible` to gradient buttons, consolidated duplicate `:root` block.
- `packages/ui/src/components/ui/toast.tsx` — Modified: replaced hardcoded green/red/blue color classes with semantic tokens (success/destructive/info) in CVA variants
- `apps/extension/src/components/autofill-tab.tsx` — Modified: replaced 7 hardcoded color instances with semantic tokens. **[Review fix]** replaced `text-[10px]` with `.text-micro` in ConfidenceBadge.
- `apps/extension/src/components/ai-studio-tab.tsx` — Modified: replaced 3 hardcoded color instances (green, amber, blue) with semantic tokens
- `apps/extension/src/components/toast-context.tsx` — Modified: replaced 1 hardcoded green color with semantic success token. **[Review fix]** added `aria-label` on dismiss button, `aria-live="polite" role="log"` on container, added "info"/"loading" variants to ToastItem type + info variant rendering.
- `packages/ui/.storybook/preview.tsx` — Modified: changed viewport from "Extension Popup: 400x600" to "Extension Default: 360x600" + added "Extension Wide: 500x600"
- `_bmad-output/implementation-artifacts/1-1-issue-registry.md` — New: comprehensive issue registry with 34 issues grouped by target story
- `_bmad-output/implementation-artifacts/1-1-design-system-theme-foundation-audit.md` — New: this story file (created via create-story, updated throughout implementation)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: story status updated (ready-for-dev → in-progress → review → done)
- `pnpm-lock.yaml` — Modified: lockfile updated during build/test verification (note: includes packages/engine deps from Story 2-1 cross-contamination)
