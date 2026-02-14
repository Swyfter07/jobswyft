# Component Inventory — UI Package

**Package:** `@jobswyft/ui`  
**Path:** `packages/ui/src/components/`

---

## Layout Components

| Component | Path | Description |
|-----------|------|-------------|
| AppHeader | layout/app-header.tsx | Top nav, theme toggle, settings, reset |
| ExtensionSidebar | layout/extension-sidebar.tsx | Side panel shell, tabs, credit footer |

---

## Feature Components

| Component | Path | Description |
|-----------|------|-------------|
| LoginView | features/login-view.tsx | Logged-out state, Google sign-in |
| ResumeCard | features/resume-card.tsx | Resume management, collapsible sections |
| ResumeEmptyState | features/resume-empty-state.tsx | Empty state when no resumes |
| JobCard | features/job-card.tsx | Job display card |
| ScanEmptyState | features/scan-empty-state.tsx | Empty state for scan |

**Resume subcomponents:** personal-info, experience-section, education-section, skills-section, projects-section, certifications-section

---

## Block Components

| Component | Path | Description |
|-----------|------|-------------|
| IconBadge | blocks/icon-badge.tsx | Icon container, 6 variants × 3 sizes |
| CopyChip | blocks/copy-chip.tsx | Copyable text chip |
| CollapsibleSection | blocks/collapsible-section.tsx | Expandable section |
| SkillPill | blocks/skill-pill.tsx | Skill tag display |

---

## UI Primitives (shadcn/ui)

| Component | Path |
|-----------|------|
| Button, Badge, Card | ui/ |
| Input, Textarea, Select | ui/ |
| Dialog, DropdownMenu, Tabs | ui/ |
| Collapsible, Tooltip, Sheet | ui/ |
| Separator, ScrollArea, Progress | ui/ |
| Avatar, Skeleton, AlertDialog | ui/ |
| Toast | ui/ |

---

## Reference Components (_reference/)

**Not for production use.** Prototype patterns for future features:

- future-features: job-card, coach, autofill, ai-studio
- blocks: skill-pill, selection-chips, match-indicator, credit-balance

---

## Design System

- **Tokens:** Semantic CSS variables in `globals.css` (OKLCH)
- **Patterns:** Accent border card, two-tone card, dashed empty states
- **Sizing:** Fluid 360px–700px (Chrome side panel)
