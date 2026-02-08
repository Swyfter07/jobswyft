# Reference Components - Pattern Library

⚠️ **IMPORTANT:** Components in this directory are **NOT official** implementations. They are prototype patterns to reuse, NOT complete production-ready components.

## Purpose

This directory serves as a **pattern library** for future feature development. Components here demonstrate interaction patterns, visual styles, and reusable logic that can be adapted when building new official features.

## Why Not Official?

Components in `_reference/` have **NOT been officially designed** using the UX Design Specification. They were built during prototyping to explore patterns and may contain:

- Incomplete UX compliance (missing states, animations, accessibility)
- Hardcoded values that need to be refactored
- Patterns that work but haven't been finalized for production
- Features that are planned but not yet part of the MVP

## Structure

### `_reference/future-features/`

Unofficial feature components that will be built in future stories:

- `ai-studio.tsx` — Match analysis, cover letter, outreach generation (EXT.6-7, 9)
- `autofill.tsx` — Sequential field-by-field autofill animation (EXT.8)
- `coach.tsx` — AI career coaching chat interface (EXT.12)
- `job-card.tsx` — Job details card with match indicator (EXT.5)

### `_reference/blocks/`

Block components **NOT yet used** by official features:

- `credit-balance.tsx` — Standalone credit display (only used in stories)
- `match-indicator.tsx` — Animated SVG radial score (used in job-card, ai-studio)
- `skill-pill.tsx` — Matched/missing skill pills (used in job-card, ai-studio)
- `selection-chips.tsx` — Multi-select chip group (used in ai-studio)

## How to Use Reference Components

When building a new feature (e.g., EXT.5 Job Page Scanning):

1. **Start from UX spec** — Read the relevant UX Design Specification section first
2. **Review reference pattern** — Check if `_reference/` has a similar component
3. **Extract reusable logic** — Copy only the patterns you need (not the whole component)
4. **Rebuild from scratch** — Create a new component following UX spec, using reference patterns for inspiration
5. **Never import directly** — Reference components are NOT exported from `@jobswyft/ui`

### Example Workflow

**Task:** Build JobCard for EXT.5

```tsx
// ❌ WRONG: Don't import from _reference
import { JobCard } from "@jobswyft/ui" // This won't work - not exported

// ✅ CORRECT: Build new component using reference as pattern
// 1. Read _reference/future-features/job-card.tsx to see the pattern
// 2. Read UX spec section for "Job Detected" state
// 3. Create new src/components/features/job-card.tsx following UX spec
// 4. Reuse patterns: MatchIndicator animation, SkillPill layout, two-tone card
// 5. Update with UX requirements: gradient depth buttons, proper spacing, etc.
```

## Extracting Patterns

Common patterns worth extracting:

### From ai-studio.tsx:
- Sequential content reveal animation (framer-motion)
- Sub-tab navigation structure
- Credit lock pattern (blurred preview + "Unlock" CTA)
- Streaming AI response with skeleton states

### From autofill.tsx:
- Sequential field animation (staggered with checkmarks)
- Field-by-field completion feedback
- "Always verify" disclaimer pattern

### From job-card.tsx:
- Animated match score (SVG radial fill + count-up)
- Two-tone card with accent footer
- Skill pill grouping (matched vs. missing)

### From coach.tsx:
- Chat message bubbles (user vs. AI)
- Streaming message animation
- Message history scroll behavior

## Moving Components to Official

When a reference component is implemented officially:

1. New official component built in `src/components/features/` or `src/components/blocks/`
2. Reference component stays in `_reference/` (for pattern reference)
3. Official component exported from `src/index.ts`
4. Official component documented in `packages/ui/README.md`

## Testing Reference Components

Reference components still have Storybook stories for pattern demonstration, but they are **excluded from main Storybook navigation** (via `.storybook/main.ts` configuration).

To view reference stories during development:
1. Temporarily add `_reference/` to stories glob in `.storybook/main.ts`
2. Restart Storybook
3. Revert changes when done

## Design System Compliance

Reference components may **NOT** follow all design system rules:

- ⚠️ May use hardcoded colors instead of semantic tokens
- ⚠️ May use `text-[10px]` instead of `.text-micro` utility
- ⚠️ May use `h-X w-X` instead of `size-X` pattern
- ⚠️ May not support reduced motion
- ⚠️ May not meet WCAG 2.1 AA contrast requirements

**Always audit and fix these issues** when extracting patterns for official components.

## Rules

- **DO NOT** import from this directory anywhere in the codebase
- **DO NOT** add exports for these files to `index.ts`
- **DO NOT** modify these files — they are read-only patterns

## Questions?

- Read: [UX Design Specification](../../../_bmad-output/planning-artifacts/ux-design-specification.md)
- Read: [Component Development Methodology](../../../_bmad-output/planning-artifacts/epics/component-development-methodology.md)
- Check: Official components in `src/components/blocks/`, `features/`, `layout/`
