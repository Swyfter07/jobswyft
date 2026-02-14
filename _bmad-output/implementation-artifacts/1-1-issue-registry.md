# Story 1.1 — Issue Registry

Generated: 2026-02-14
Auditor: Claude Opus 4.6

## Summary

- **Critical:** 8 issues
- **Major:** 14 issues
- **Minor:** 12 issues
- **Total:** 34 issues

---

## Issues by Target Story

### Immediate (Fix in Story 1.1)

| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 1 | critical | globals.css | `packages/ui/src/styles/globals.css` | Missing 12 functional area tokens (scan/studio/autofill/coach accent + foreground + muted) | Add 24 CSS variables (12 light + 12 dark) |
| 2 | critical | globals.css | `packages/ui/src/styles/globals.css` | Missing `--destructive-foreground` token | Add to both `:root` and `.dark` |
| 3 | critical | globals.css | `packages/ui/src/styles/globals.css` | Missing `--info` and `--info-foreground` tokens | Add to both `:root` and `.dark` |
| 4 | critical | globals.css | `packages/ui/src/styles/globals.css` | Missing `@theme inline` mappings for functional area tokens | Add 12 `--color-*` mappings |
| 5 | critical | globals.css | `packages/ui/src/styles/globals.css` | Missing `.btn-gradient-depth-{area}` utility classes (4 areas) | Add 4 gradient button utilities |
| 6 | critical | globals.css | `packages/ui/src/styles/globals.css` | Missing reduced motion support (`@media (prefers-reduced-motion)`) | Add `--motion-duration` and `--motion-enabled` custom properties |
| 7 | major | toast.tsx | `packages/ui/src/components/ui/toast.tsx` | Hardcoded green/red/blue color classes in success/error/info CVA variants (18 classes across 3 lines) | Replace with `--success`, `--destructive`, `--info` semantic tokens |
| 8 | major | autofill-tab.tsx | `apps/extension/src/components/autofill-tab.tsx` | 7 hardcoded color instances: green-600/400, amber-600/400, red-600/400 (lines 402, 414, 471-474, 516, 519, 531, 537) | Replace with `text-success`, `text-warning`, `text-destructive`, `border-success`, `border-warning` |
| 9 | major | ai-studio-tab.tsx | `apps/extension/src/components/ai-studio-tab.tsx` | 3 hardcoded color instances (lines 237-239): green, amber, blue for Section headings | Replace with `text-success`, `text-warning`, `text-info` |
| 10 | major | toast-context.tsx | `apps/extension/src/components/toast-context.tsx` | 1 hardcoded green color instance (line 51) | Replace with `border-success/50 bg-success/10 text-success` |
| 11 | major | Storybook | `packages/ui/.storybook/preview.tsx` | Viewport "Extension Popup: 400x600" incorrect per UX spec | Change to "Extension Default: 360x600" and add "Extension Wide: 500x600" |

### Story 1.2 (Shell, Layout & Navigation)

| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 12 | major | app-header | `packages/ui/src/components/layout/app-header.tsx` | Settings icon button (line 127) uses `title` without `aria-label` | Add `aria-label="Settings"` |
| 13 | minor | app-header stories | `packages/ui/src/components/custom/app-header.stories.tsx` | Misplaced story file — `app-header.tsx` is in `layout/`, not `custom/` | Move story to `layout/app-header.stories.tsx` |
| 14 | minor | extension-sidebar | `packages/ui/src/components/layout/extension-sidebar.tsx` | No issues found | N/A — compliant |

### Story 1.3 (Cards & Blocks)

| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 15 | critical | skill-pill (dup) | `packages/ui/src/components/custom/skill-pill.tsx` | Byte-for-byte identical duplicate of `blocks/skill-pill.tsx` | Remove `custom/skill-pill.tsx`, update imports in `custom/job-card.tsx` and `custom/ai-studio.tsx` to use `@/components/blocks/skill-pill` |
| 16 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | Broken import: `MatchIndicator` from `@/components/custom/match-indicator` — file does not exist (only at `_reference/blocks/`) | Fix import path or create component at expected path |
| 17 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | Broken import: `IconBadge` from `@/components/custom/icon-badge` — file does not exist (only at `blocks/icon-badge.tsx`) | Fix import to `@/components/blocks/icon-badge` |
| 18 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | `dark:bg-muted/40` on line 66 — manual dark mode override instead of semantic token | Use a single opacity or dedicated semantic token |
| 19 | major | job-card (custom) | `packages/ui/src/components/custom/job-card.tsx` | Edit toggle icon button (line 103) missing `aria-label` | Add `aria-label={isEditing ? "Cancel editing" : "Edit job details"}` |
| 20 | minor | copy-chip | `packages/ui/src/components/blocks/copy-chip.tsx` | CopyChip button relies on Tooltip for label but lacks `aria-label` | Add `aria-label="Copy"` |
| 21 | minor | copy-chip | `packages/ui/src/components/blocks/copy-chip.tsx` | `max-w-[180px]` arbitrary value (line 131) | Consider Tailwind utility or CSS variable |
| 22 | minor | icon-badge | `packages/ui/src/components/blocks/icon-badge.tsx` | Uses manual `Record<Variant, string>` map instead of CVA | Consider migrating to CVA for consistency |
| 23 | minor | skill-pill (blocks) | `packages/ui/src/components/blocks/skill-pill.tsx` | Uses manual `Record<Variant, string>` map instead of CVA | Consider migrating to CVA for consistency |

### Story 1.4 (AI Studio & Feature Views)

| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 24 | critical | ai-studio (custom) | `packages/ui/src/components/custom/ai-studio.tsx` | Broken import: `SelectionChips` from `@/components/custom/selection-chips` — does not exist | Fix import path or create component |
| 25 | major | ai-studio (custom) | `packages/ui/src/components/custom/ai-studio.tsx` | Broken import: `MatchIndicator` from `@/components/custom/match-indicator` — does not exist | Fix import path or create component |
| 26 | major | ai-studio (custom) | `packages/ui/src/components/custom/ai-studio.tsx` | Broken import: `IconBadge` from `@/components/custom/icon-badge` — should be `blocks/icon-badge` | Fix import to `@/components/blocks/icon-badge` |
| 27 | major | ai-studio (custom) | `packages/ui/src/components/custom/ai-studio.tsx` | Reset button (line 324) uses `title="Reset All"` without `aria-label` | Add `aria-label="Reset All"` |
| 28 | major | coach (custom) | `packages/ui/src/components/custom/coach.tsx` | Broken import: `IconBadge` from `@/components/custom/icon-badge` — should be `blocks/icon-badge` | Fix import to `@/components/blocks/icon-badge` |
| 29 | major | coach (custom) | `packages/ui/src/components/custom/coach.tsx` | `text-[9px]` arbitrary font size (line 117) | Replace with `.text-micro` utility class |
| 30 | minor | job-card (features) | `packages/ui/src/components/features/job-card.tsx` | Edit icon button (line 173) missing `aria-label` (only has no accessible name) | Add `aria-label` |
| 31 | minor | job-card (features) | `packages/ui/src/components/features/job-card.tsx` | Scan/edit icon buttons (lines 215, 225) use `title` without `aria-label` | Add `aria-label` alongside `title` |

### Story 1.5 (Storybook Completion)

| # | Severity | Component | File | Issue | Fix |
|---|----------|-----------|------|-------|-----|
| 32 | minor | resume components | `packages/ui/src/components/features/resume/` | 7 resume components (certifications, education, experience, personal-info, projects, resume-card, skills-section) missing Storybook stories (14% coverage) | Create stories for each |
| 33 | minor | shadcn primitives | `packages/ui/src/components/ui/` | 13 shadcn primitives missing stories: alert-dialog, avatar, collapsible, dropdown-menu, progress, scroll-area, separator, sheet, skeleton, textarea, tooltip | Create stories for production-used primitives |
| 34 | minor | toast.stories | `packages/ui/src/components/ui/toast.stories.tsx` | Line 87 uses hardcoded `green-700/800/100` colors | Replace with semantic success tokens |

### Story 1.6 (State Management & Integration)

No design-language-specific issues found for this story scope. State management audit is code-level, not token-level.

---

## Additional Findings (Not Mapped to Specific Stories)

### `h-X w-X` → `size-X` Opportunities (7 instances)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `features/resume/experience-section.tsx` | 166 | `h-1 w-1` | `size-1` |
| `features/resume/experience-section.tsx` | 177 | `h-6 w-6` | `size-6` |
| `features/resume/projects-section.tsx` | 234 | `h-1 w-1` | `size-1` |
| `features/resume/projects-section.tsx` | 245 | `h-6 w-6` | `size-6` |
| `features/resume/education-section.tsx` | 129 | `h-1 w-1` | `size-1` |
| `features/resume/education-section.tsx` | 140 | `h-6 w-6` | `size-6` |
| `ui/sheet.tsx` | 68 | `h-4 w-4` | `size-4` |

### Arbitrary Font Size Violations (3 instances)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `custom/coach.tsx` | 117 | `text-[9px]` | Use `text-micro` |
| `ui/button.tsx` | 22 | `text-[0.8rem]` | Acceptable for button variant scale |
| `extension/autofill-tab.tsx` | 476 | `text-[10px]` | Use `text-micro` |

### Accessibility Gaps

| File | Line | Issue |
|------|------|-------|
| `extension/autofill-tab.tsx` | 497-521 | Interactive `<div>` in FieldGroup lacks `role="button"`, `tabIndex`, `onKeyDown` |
| `extension/toast-context.tsx` | 62-65 | Dismiss button `&times;` missing `aria-label` |
| `extension/toast-context.tsx` | container | Missing `role="alert"` / `aria-live` |
| `extension/settings-dialog.tsx` | 27 | Close button missing `aria-label` |
| `extension/settings-dialog.tsx` | 136-147 | Toggle switch missing `role="switch"` + `aria-checked` |
| `extension/settings-dialog.tsx` | 19-21 | Backdrop missing Escape key handler |

### Duplicate Components

| Original | Duplicate | Resolution |
|----------|-----------|------------|
| `blocks/skill-pill.tsx` | `custom/skill-pill.tsx` | Remove duplicate; update imports to use `blocks/` |

### Job Card Overlap

`features/job-card.tsx` (465 lines, full edit workflow) and `custom/job-card.tsx` (215 lines, simplified with "Dive Deeper"/"Coach" buttons) have significant overlap. Both import `MatchIndicator` and `IconBadge` from non-existent `custom/` paths. Canonical version should be determined in Story 1.3.
