# Story EXT.2: Component Library Reorganization

**As a** developer working on Jobswyft,
**I want** a properly organized component library with clear categories and reference separation,
**So that** every future story follows consistent patterns and builds on a clean foundation.

**FRs addressed:** None (infrastructure/DX story — enables all subsequent stories)

## Component Inventory

**Current state:** 14 custom components in flat `components/custom/` directory.

**Target state:**

| Category | Directory | Components to Move |
|----------|-----------|--------------------|
| **Blocks** | `components/blocks/` | IconBadge, SkillPill, SelectionChips, CreditBar, CreditBalance, MatchIndicator, SkillSectionLabel |
| **Features** | `components/features/` | JobCard, ResumeCard, AiStudio, Coach, Autofill, LoggedOutView |
| **Layout** | `components/layout/` | ExtensionSidebar, AppHeader |
| **Reference** | `components/_reference/` | Copy of ALL originals before reorganization (read-only) |

## Acceptance Criteria

**Given** 14 custom components exist in `components/custom/`
**When** the developer runs the reorganization
**Then** all original component files are copied to `components/_reference/` as read-only reference
**And** the `_reference/` directory has a README noting these are original demos, not to be imported

**Given** components are being reorganized
**When** the developer moves components to their new directories
**Then** `components/blocks/` contains: IconBadge, SkillPill, SelectionChips, CreditBar, CreditBalance, MatchIndicator, SkillSectionLabel
**And** `components/features/` contains: JobCard, ResumeCard, AiStudio, Coach, Autofill, LoggedOutView
**And** `components/layout/` contains: ExtensionSidebar, AppHeader
**And** the old `components/custom/` directory is removed

**Given** components have been reorganized
**When** `packages/ui/src/index.ts` is updated
**Then** all exports resolve correctly from the new paths
**And** `import { Button, JobCard, AppHeader, SkillPill } from '@jobswyft/ui'` still works

**Given** the reorganization is complete
**When** `pnpm storybook` is run
**Then** all 21 story files render correctly (story imports updated to new paths)
**And** stories are organized under groups matching the directory structure

**Given** the reorganization is complete
**When** `pnpm build` is run from `packages/ui/`
**Then** the library builds successfully
**And** the extension at `apps/extension/` builds without errors
**And** all component imports in the extension still resolve

## Developer Notes

- Story files (`*.stories.tsx`) move WITH their components to the new directories
- NO component logic changes in this story — only file moves and import path updates
- The `_reference/` components are a safety net during migration; each future story may consult them for original behavior/design intent
- After all EXT stories complete, `_reference/` will be deleted in a final cleanup

---
