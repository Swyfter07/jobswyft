# Block Components - Official

This directory contains **official** block components used in production extension features (EXT.1-4).

## Official Blocks

| Block Component | Used By | Purpose |
|----------------|---------|---------|
| `icon-badge` | `LoginView` | Icon container with variants (primary, success, warning, etc.) and sizes (sm, md, lg) |
| `copy-chip` | Resume sections (personal-info, skills, projects, experience, education, certifications) | Copyable text chip with clipboard icon and success feedback |
| `collapsible-section` | `ResumeCard` | Expandable/collapsible content section with smooth animation |

## Reference Blocks

Blocks **NOT** used by official components have been moved to `_reference/blocks/`:
- `credit-balance` — Only used in stories, not in extension
- `match-indicator` — Only used in unofficial components (job-card, ai-studio)
- `skill-pill` — Only used in unofficial components (job-card, ai-studio)
- `selection-chips` — Only used in unofficial components (ai-studio)

## Adding New Blocks

When creating new blocks:
1. Start from UX Design Specification first
2. Build component with semantic tokens (no hardcoded colors)
3. Create Storybook story with all variants and viewports
4. Export from `packages/ui/src/index.ts` only after it's used in an official feature
5. Document usage in this README

## Cross-Cutting Patterns

All blocks follow these patterns (established in Epic 0):
- **Zero hardcoded colors** — use semantic CSS variables from `globals.css`
- **Consistent sizing** — `size-X` pattern (not `h-X w-X`)
- **Micro text** — `.text-micro` CSS utility (not `text-[10px]`)
- **Dark mode parity** — every component works in light AND dark themes
- **Accessible** — WCAG 2.1 AA compliant
