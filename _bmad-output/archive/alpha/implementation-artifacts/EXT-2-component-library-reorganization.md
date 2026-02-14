# Story EXT.2: Component Library Reorganization

Status: done

## Story

As a **developer working on Jobswyft**,
I want **a properly organized component library with clear categories and reference separation**,
so that **every future story follows consistent patterns and builds on a clean foundation**.

**FRs addressed:** None (infrastructure/DX story — enables all subsequent EXT stories)

## Acceptance Criteria

### AC1: Reference Snapshot

**Given** 14 custom components exist in `packages/ui/src/components/custom/`
**When** the developer runs the reorganization
**Then** all original component files (`.tsx` and `.stories.tsx`) are copied to `packages/ui/src/components/_reference/`
**And** the `_reference/` directory contains a `README.md` stating these are original demos — read-only, not to be imported
**And** the `_reference/` files are exact copies, untouched by subsequent steps

### AC2: Directory Restructure

**Given** the reference snapshot is complete
**When** the developer moves components to their new directories
**Then** the following structure exists:

| Directory | Files (component + stories) |
|-----------|-----------------------------|
| `components/blocks/` | `icon-badge.tsx`, `icon-badge.stories.tsx`, `skill-pill.tsx`, `skill-pill.stories.tsx`, `selection-chips.tsx`, `selection-chips.stories.tsx`, `credit-bar.tsx`, `credit-bar.stories.tsx`, `credit-balance.tsx`, `credit-balance.stories.tsx`, `match-indicator.tsx`, `match-indicator.stories.tsx` |
| `components/features/` | `job-card.tsx`, `job-card.stories.tsx`, `resume-card.tsx`, `resume-card.stories.tsx`, `ai-studio.tsx`, `ai-studio.stories.tsx`, `coach.tsx`, `coach.stories.tsx`, `autofill.tsx`, `autofill.stories.tsx`, `logged-out-view.tsx`, `logged-out-view.stories.tsx` |
| `components/layout/` | `extension-sidebar.tsx`, `extension-sidebar.stories.tsx`, `app-header.tsx`, `app-header.stories.tsx` |

**And** the old `components/custom/` directory is deleted entirely

### AC3: Package Exports Intact

**Given** components have been moved to new directories
**When** `packages/ui/src/index.ts` export paths are updated
**Then** `import { Button, JobCard, AppHeader, SkillPill } from '@jobswyft/ui'` resolves correctly
**And** every existing export in `index.ts` still resolves (zero broken exports)
**And** no public API changes — only internal paths change

### AC4: Storybook Renders Correctly

**Given** the reorganization is complete
**When** `pnpm storybook` is run from `packages/ui/`
**Then** all 21 story files (14 custom + 7 shadcn) render without errors
**And** custom stories are organized under new group prefixes:
  - `Blocks/IconBadge`, `Blocks/SkillPill`, `Blocks/SelectionChips`, etc.
  - `Features/JobCard`, `Features/ResumeCard`, `Features/AiStudio`, etc.
  - `Layout/ExtensionSidebar`, `Layout/AppHeader`
  - `UI/Button`, `UI/Card`, etc. (unchanged)

### AC5: Build Verification

**Given** the reorganization is complete
**When** `pnpm build` is run from `packages/ui/`
**Then** the library builds successfully with zero errors
**And** `apps/extension/` builds without errors (`pnpm build` from extension dir)
**And** extension's `@jobswyft/ui` imports still resolve (package exports are the public API — internal paths don't leak)

### AC6: Internal Cross-References Preserved

**Given** 12 cross-directory imports exist between components (11 `@/components/custom/` alias + 1 relative `./`)
**When** components are in different directories after the move
**Then** all 11 `@/components/custom/` alias imports are updated to their new directory (`@/components/blocks/`, `@/components/features/`, or `@/components/layout/`)
**And** the 1 relative import (`extension-sidebar.tsx` → `credit-bar`) is updated from `"./credit-bar"` to `"../blocks/credit-bar"`
**And** `grep -r "@/components/custom" packages/ui/src/` returns zero results
**And** no circular dependency is introduced

## Tasks / Subtasks

- [x] **Task 1: Create reference snapshot** (AC: #1)
  - [x] 1.1: Create `packages/ui/src/components/_reference/` directory
  - [x] 1.2: Copy all 28 files from `components/custom/` to `_reference/` (14 components × 2 files each)
  - [x] 1.3: Create `_reference/README.md` with read-only notice
  - [x] 1.4: Verify all 28 files exist in `_reference/` (confirmed: 29 files = 28 tsx + README.md)

- [x] **Task 2: Create new directories and move files** (AC: #2)
  - [x] 2.1: Create `components/blocks/`, `components/features/`, `components/layout/`
  - [x] 2.2: Move blocks (6 components, 12 files):
    - `icon-badge.tsx` + `.stories.tsx` → `blocks/`
    - `skill-pill.tsx` + `.stories.tsx` → `blocks/`
    - `selection-chips.tsx` + `.stories.tsx` → `blocks/`
    - `credit-bar.tsx` + `.stories.tsx` → `blocks/`
    - `credit-balance.tsx` + `.stories.tsx` → `blocks/`
    - `match-indicator.tsx` + `.stories.tsx` → `blocks/`
  - [x] 2.3: Move features (6 components, 12 files):
    - `job-card.tsx` + `.stories.tsx` → `features/`
    - `resume-card.tsx` + `.stories.tsx` → `features/`
    - `ai-studio.tsx` + `.stories.tsx` → `features/`
    - `coach.tsx` + `.stories.tsx` → `features/`
    - `autofill.tsx` + `.stories.tsx` → `features/`
    - `logged-out-view.tsx` + `.stories.tsx` → `features/`
  - [x] 2.4: Move layout (2 components, 4 files):
    - `extension-sidebar.tsx` + `.stories.tsx` → `layout/`
    - `app-header.tsx` + `.stories.tsx` → `layout/`
  - [x] 2.5: Delete `components/custom/` directory entirely

- [x] **Task 3: Update internal cross-references** (AC: #6)
  - [x] 3.1: Update `@/components/custom/` alias imports in feature components (features → blocks):
    - `ai-studio.tsx`: `@/components/custom/selection-chips` → `@/components/blocks/selection-chips`
    - `ai-studio.tsx`: `@/components/custom/match-indicator` → `@/components/blocks/match-indicator`
    - `ai-studio.tsx`: `@/components/custom/skill-pill` → `@/components/blocks/skill-pill`
    - `ai-studio.tsx`: `@/components/custom/icon-badge` → `@/components/blocks/icon-badge`
    - `job-card.tsx`: `@/components/custom/match-indicator` → `@/components/blocks/match-indicator`
    - `job-card.tsx`: `@/components/custom/skill-pill` → `@/components/blocks/skill-pill`
    - `job-card.tsx`: `@/components/custom/icon-badge` → `@/components/blocks/icon-badge`
    - `autofill.tsx`: `@/components/custom/icon-badge` → `@/components/blocks/icon-badge`
    - `coach.tsx`: `@/components/custom/icon-badge` → `@/components/blocks/icon-badge`
    - `logged-out-view.tsx`: `@/components/custom/icon-badge` → `@/components/blocks/icon-badge`
  - [x] 3.2: Update `@/components/custom/` alias imports in block components (blocks → blocks):
    - `credit-bar.tsx`: `@/components/custom/icon-badge` → `@/components/blocks/icon-badge`
  - [x] 3.3: Update relative import in layout component:
    - `extension-sidebar.tsx`: `"./credit-bar"` → `"../blocks/credit-bar"`
  - [x] 3.4: Verify — `grep -r "@/components/custom" packages/ui/src/` returns ZERO results (excluding `_reference/`)
  - [x] 3.5: Story files (`.stories.tsx`) use `"./component-name"` relative imports to their sibling component — valid. Additional fix: `extension-sidebar.stories.tsx` had cross-directory relative imports to feature/block components that needed updating.

- [x] **Task 4: Update `index.ts` barrel exports** (AC: #3)
  - [x] 4.1: Replace ALL `@/components/custom/` paths in component export section
  - [x] 4.2: Replace ALL `@/components/custom/` paths in type export section
  - [x] 4.3: Verify every export and type export in `index.ts` has a valid target path (confirmed via build)
  - [x] 4.4: Update section comments in `index.ts`: `// Components — blocks`, `// Components — features`, `// Components — layout`, `// Types — blocks`, `// Types — features`, `// Types — layout`

- [x] **Task 5: Update Storybook story titles** (AC: #4)
  - [x] 5.1: Update story `title` in all `blocks/*.stories.tsx` (6 files: IconBadge, SkillPill, SelectionChips, CreditBar, CreditBalance, MatchIndicator)
  - [x] 5.2: Update story `title` in all `features/*.stories.tsx` (6 files: JobCard, ResumeCard, AIStudio, Coach, Autofill, LoggedOutView)
  - [x] 5.3: Update story `title` in all `layout/*.stories.tsx` (2 files: ExtensionSidebar, AppHeader)
  - [x] 5.4: All 14 story files updated from `"Custom/..."` to `"Blocks/"`, `"Features/"`, or `"Layout/"` prefixes.

- [x] **Task 6: Build verification** (AC: #5)
  - [x] 6.1: `grep -r "@/components/custom" packages/ui/src/` — ZERO results (excluding `_reference/`)
  - [x] 6.2: `pnpm build` from `packages/ui/` — SUCCESS (119.36 kB, 38 modules, gzip: 23.61 kB)
  - [x] 6.3: `pnpm build` from `apps/extension/` — SUCCESS (548.4 kB total)
  - [x] 6.4: `storybook build` — SUCCESS (1910 modules, all 14 custom + shadcn stories compiled)
  - [x] 6.5: `pnpm test` from `packages/ui/` — 23 tests passed (2 files: mappers.test.ts + utils.test.ts)
  - [x] 6.6: `.storybook/main.ts` updated to use explicit directory patterns (excluding `_reference/`); `tsconfig.json` updated to exclude `_reference/` from tsc

## Dev Notes

### CRITICAL: No Component Logic Changes

This story is **file moves + import path updates ONLY**. Do NOT:
- Modify any component props, behavior, or rendering logic
- Refactor any component internals
- Add new features or remove existing ones
- Change any CSS classes or token usage

If you discover something that "should" be fixed — add it to the Tech Debt section but do NOT fix it in this story.

### Current File Inventory (28 files to move)

All in `packages/ui/src/components/custom/`:

| File | Category | Imports From (cross-directory after move) |
|------|----------|------------------------------------------|
| `icon-badge.tsx` + `.stories.tsx` | blocks | None — standalone |
| `skill-pill.tsx` + `.stories.tsx` | blocks | None — standalone (exported to others) |
| `selection-chips.tsx` + `.stories.tsx` | blocks | None — standalone |
| `credit-bar.tsx` + `.stories.tsx` | blocks | `icon-badge` (blocks→blocks, path stays `@/components/blocks/`) |
| `credit-balance.tsx` + `.stories.tsx` | blocks | None — standalone |
| `match-indicator.tsx` + `.stories.tsx` | blocks | None — standalone |
| `job-card.tsx` + `.stories.tsx` | features | `match-indicator`, `skill-pill`, `icon-badge` (all via `@/components/custom/` → `@/components/blocks/`) |
| `resume-card.tsx` + `.stories.tsx` | features | None — standalone |
| `ai-studio.tsx` + `.stories.tsx` | features | `selection-chips`, `match-indicator`, `skill-pill`, `icon-badge` (all via `@/components/custom/` → `@/components/blocks/`) |
| `coach.tsx` + `.stories.tsx` | features | `icon-badge` (via `@/components/custom/` → `@/components/blocks/`) |
| `autofill.tsx` + `.stories.tsx` | features | `icon-badge` (via `@/components/custom/` → `@/components/blocks/`) |
| `logged-out-view.tsx` + `.stories.tsx` | features | `icon-badge` (via `@/components/custom/` → `@/components/blocks/`) |
| `extension-sidebar.tsx` + `.stories.tsx` | layout | `credit-bar` (via relative `"./credit-bar"` → `"../blocks/credit-bar"`) |
| `app-header.tsx` + `.stories.tsx` | layout | None — standalone |

**Total cross-directory imports to update: 12** (11 `@/components/custom/` alias + 1 relative)

### Cross-Reference Resolution Strategy

Components import from each other using two patterns. **Both** need updating after the move:

**Pattern 1: `@/` alias imports (10 of 11 cross-refs)** — Most cross-references use the `@/` path alias which resolves to `packages/ui/src/`. These need the directory segment updated:

```
Before:
  ai-studio.tsx → import { IconBadge } from "@/components/custom/icon-badge"

After:
  ai-studio.tsx → import { IconBadge } from "@/components/blocks/icon-badge"
```

**Pattern 2: Relative imports (1 cross-ref)** — Only `extension-sidebar.tsx` uses a relative import:

```
Before:
  extension-sidebar.tsx → import { CreditBar } from "./credit-bar"

After:
  layout/extension-sidebar.tsx → import { CreditBar } from "../blocks/credit-bar"
```

**Verification:** After all updates, run `grep -r "@/components/custom" packages/ui/src/` — must return **zero results**.

### Story Files Travel WITH Components

Each `.stories.tsx` file imports its component via `"./component-name"` (relative sibling). Since stories move to the same directory as their component, these imports remain valid. Only the `title` field in the stories' meta needs updating for Storybook grouping.

### Storybook Title Convention

Current pattern: `title: "Custom/ComponentName"` (seen in `icon-badge.stories.tsx`, `resume-card.stories.tsx`).

New convention:
- `"Blocks/ComponentName"` for blocks
- `"Features/ComponentName"` for features
- `"Layout/ComponentName"` for layout
- `"UI/ComponentName"` for shadcn primitives (unchanged)

All 14 custom story files have explicit `title: "Custom/..."` fields — none rely on auto-derived titles. All need updating to the new convention.

### Extension Builds Are Safe

The extension at `apps/extension/` imports from `@jobswyft/ui` via the **package export** (`"."` → `"./dist/index.js"`). It does NOT import from internal file paths. So as long as `index.ts` exports resolve correctly and `pnpm build` generates a valid `dist/`, the extension is unaffected.

Verification: `apps/extension/src/components/sidebar-app.tsx` imports:
```tsx
import { ExtensionSidebar, LoggedOutView } from "@jobswyft/ui";
```
This goes through `dist/index.js` → no internal paths exposed.

### Package Build Pipeline

The build command is: `vite build && tsc --emitDeclarationOnly --declaration --outDir dist`

1. **Vite** bundles `src/index.ts` → `dist/index.js` (ES module)
2. **tsc** generates `dist/*.d.ts` type declarations

Both use `src/index.ts` as entry. So updating import paths in `index.ts` is the ONLY change needed for the build to work.

### Existing Tests

`packages/ui/` has `vitest` tests:
- `src/lib/mappers.test.ts` — 18 tests for API mappers

These tests don't import from `components/` — they test `lib/mappers.ts`. They should pass without changes. Run them to verify no accidental breakage.

### `_reference/` Directory Purpose

The `_reference/` directory is a **safety net** during the EXT epic. Future stories may consult these files to see original component behavior/design intent. After all EXT stories complete, `_reference/` gets deleted in a final cleanup.

**Do NOT:**
- Import from `_reference/` anywhere
- Add `_reference/` exports to `index.ts`
- Include `_reference/` in the build

### Project Structure Notes

**Target `packages/ui/src/components/` structure after this story:**

```
packages/ui/src/components/
├── ui/                    # shadcn primitives (UNCHANGED — never touch)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── blocks/                # NEW — shared building blocks
│   ├── icon-badge.tsx
│   ├── icon-badge.stories.tsx
│   ├── skill-pill.tsx     # exports SkillPill + SkillSectionLabel
│   ├── skill-pill.stories.tsx
│   ├── selection-chips.tsx
│   ├── selection-chips.stories.tsx
│   ├── credit-bar.tsx
│   ├── credit-bar.stories.tsx
│   ├── credit-balance.tsx
│   ├── credit-balance.stories.tsx
│   ├── match-indicator.tsx
│   └── match-indicator.stories.tsx
├── features/              # NEW — domain-specific feature components
│   ├── job-card.tsx
│   ├── job-card.stories.tsx
│   ├── resume-card.tsx
│   ├── resume-card.stories.tsx
│   ├── ai-studio.tsx
│   ├── ai-studio.stories.tsx
│   ├── coach.tsx
│   ├── coach.stories.tsx
│   ├── autofill.tsx
│   ├── autofill.stories.tsx
│   ├── logged-out-view.tsx
│   └── logged-out-view.stories.tsx
├── layout/                # NEW — structural/shell components
│   ├── extension-sidebar.tsx
│   ├── extension-sidebar.stories.tsx
│   ├── app-header.tsx
│   └── app-header.stories.tsx
└── _reference/            # NEW — read-only snapshot of originals
    ├── README.md
    ├── icon-badge.tsx
    ├── icon-badge.stories.tsx
    └── ... (all 28 original files)
```

### Architecture Compliance

| Requirement | How This Story Complies |
|-------------|------------------------|
| Component categories from architecture.md Component Inventory | Blocks, Features, Layout match architecture doc categories |
| Zero public API changes | All `@jobswyft/ui` exports remain identical |
| Storybook grouping from epics.md | Story titles update to `Blocks/`, `Features/`, `Layout/` |
| `_reference/` safety net from epics.md | Read-only originals preserved |
| No component logic changes | File moves and import paths only |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story EXT.2: Component Library Reorganization]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Inventory]
- [Source: _bmad-output/planning-artifacts/architecture.md#UI Package Architecture]
- [Source: packages/ui/src/index.ts — barrel exports]
- [Source: packages/ui/vite.config.ts — build entry point]
- [Source: packages/ui/package.json — exports config]
- [Source: packages/ui/.storybook/main.ts — story glob pattern `../src/**/*.stories.@(ts|tsx)`]
- [Source: _bmad-output/implementation-artifacts/EXT-1-wxt-extension-setup-ui-integration-login.md — previous story file list]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Shell CWD crashed after deleting `custom/` directory (Bash tool inherited stale CWD). Required session restart.
- `_reference/` files caused tsc and Storybook build failures: tsc tried to type-check broken imports; Storybook glob included reference stories that imported deleted paths.
- `extension-sidebar.stories.tsx` had cross-directory relative imports to feature/block components (not just sibling import) — required additional path updates beyond what story subtask 3.5 anticipated.

### Completion Notes List

- All 28 component files copied to `_reference/` as read-only snapshots with README.md
- 14 components reorganized: 6 → `blocks/`, 6 → `features/`, 2 → `layout/`; `custom/` directory deleted
- 12 cross-directory imports updated (11 alias + 1 relative) in component source files
- 8 additional cross-directory imports updated in `extension-sidebar.stories.tsx` (story imported components from other categories)
- `index.ts` barrel exports restructured with new section comments (blocks/features/layout)
- All 14 story titles updated from `Custom/` to `Blocks/`/`Features/`/`Layout/`
- `tsconfig.json` updated to exclude `_reference/` from tsc compilation
- `.storybook/main.ts` updated with explicit directory patterns to exclude `_reference/`
- Build verification: UI build (119.36 kB), extension build (548.4 kB), storybook build (1910 modules), 23 tests passed — all green

### Change Log

- 2026-02-07: Component library reorganization complete — `custom/` → `blocks/`+`features/`+`layout/`, all imports updated, builds verified
- 2026-02-07: **Code Review (Opus 4.6)** — 0 HIGH, 2 MEDIUM fixed, 3 LOW (informational). Fixed: M1 `extension-sidebar.tsx` relative→alias import, M2 `extension-sidebar.stories.tsx` 7 relative→alias cross-directory imports. All builds re-verified green.

### File List

**New files:**
- `packages/ui/src/components/_reference/README.md`
- `packages/ui/src/components/_reference/*.tsx` (28 files — read-only snapshots)
- `packages/ui/src/components/blocks/` (12 files moved from custom)
- `packages/ui/src/components/features/` (12 files moved from custom)
- `packages/ui/src/components/layout/` (4 files moved from custom)

**Modified files:**
- `packages/ui/src/index.ts` — barrel export paths updated, section comments renamed
- `packages/ui/src/components/features/ai-studio.tsx` — 4 import paths updated
- `packages/ui/src/components/features/job-card.tsx` — 3 import paths updated
- `packages/ui/src/components/features/autofill.tsx` — 1 import path updated
- `packages/ui/src/components/features/coach.tsx` — 1 import path updated
- `packages/ui/src/components/features/logged-out-view.tsx` — 1 import path updated
- `packages/ui/src/components/blocks/credit-bar.tsx` — 1 import path updated
- `packages/ui/src/components/layout/extension-sidebar.tsx` — 1 import path updated (relative → cross-directory)
- `packages/ui/src/components/layout/extension-sidebar.stories.tsx` — 8 cross-directory imports updated
- `packages/ui/src/components/blocks/*.stories.tsx` (6 files) — title: `Custom/` → `Blocks/`
- `packages/ui/src/components/features/*.stories.tsx` (6 files) — title: `Custom/` → `Features/`
- `packages/ui/src/components/layout/*.stories.tsx` (2 files) — title: `Custom/` → `Layout/`
- `packages/ui/tsconfig.json` — added `src/components/_reference` to exclude
- `packages/ui/.storybook/main.ts` — explicit story directory patterns (excludes `_reference/`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — EXT-2 status updated

**Deleted:**
- `packages/ui/src/components/custom/` (entire directory — all 28 files moved to new locations)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-07 | **Outcome:** Approved (with 2 auto-fixes)

### Verification Summary

| Check | Result |
|-------|--------|
| AC1: Reference Snapshot (28 tsx + README) | PASS |
| AC2: Directory Restructure (blocks/features/layout, custom/ deleted) | PASS |
| AC3: Package Exports (`index.ts` updated, zero broken exports) | PASS |
| AC4: Storybook (14 stories with correct group prefixes, build success) | PASS |
| AC5: Builds (UI 119.36 kB, extension 548.4 kB, 23 tests, storybook) | PASS |
| AC6: Cross-References (zero `@/components/custom` outside _reference/) | PASS |
| No component logic changes (diff verified against _reference/) | PASS |
| Git vs Story File List alignment | PASS |

### Issues Found & Resolved

| # | Severity | Description | Resolution |
|---|----------|-------------|------------|
| M1 | MEDIUM | `extension-sidebar.tsx:5` used relative import `"../blocks/credit-bar"` while all other cross-directory imports use `@/components/` alias | **Auto-fixed** → `@/components/blocks/credit-bar` |
| M2 | MEDIUM | `extension-sidebar.stories.tsx` lines 4-10, 106 used 7 relative cross-directory imports (`../features/`, `../blocks/`) instead of alias pattern | **Auto-fixed** → `@/components/features/` and `@/components/blocks/` |
| M3 | MEDIUM | `.storybook/main.ts` missing `addons`/`docs` config (pre-existing, not introduced by this story) | Informational only |
| L1 | LOW | No guard against future catch-all glob re-inclusion of `_reference/` stories | Informational — explicit patterns are sufficient |
| L2 | LOW | `_reference/` stories have broken `@/components/custom/` imports (by design) | Expected — excluded from tsc and Storybook |
| L3 | LOW | Story count "21" verified correct (7 shadcn + 14 custom) | Confirmed accurate |

### Post-Fix Build Verification

All 4 checks re-run after M1/M2 fixes:
- `pnpm build` (UI): 119.36 kB, 38 modules — SUCCESS
- `pnpm test` (UI): 23 tests passed — SUCCESS
- Extension build: 548.4 kB — SUCCESS
- Storybook build: completed successfully — SUCCESS
