# @jobswyft/ui

Production-grade React component library for Jobswyft, built with shadcn/ui primitives and semantic design tokens.

## Overview

This package provides official UI components used across the Jobswyft extension and web dashboard. All components follow the [UX Design Specification](_bmad-output/planning-artifacts/ux-design-specification.md) and are built with:

- **shadcn/ui primitives** — Radix UI + Tailwind CSS
- **Semantic design tokens** — OKLCH colors from `globals.css` (single source of truth)
- **Dark mode parity** — Every component works flawlessly in light AND dark themes
- **Accessibility** — WCAG 2.1 AA compliant
- **Fluid sizing** — Optimized for 360px-700px Chrome Side Panel

## Official vs Reference Components

### Official Components ✅

Components in the main structure (`blocks/`, `features/`, `layout/`) are **official** — they've been designed per UX spec, implemented in the extension (EXT.1-4), and are production-ready.

### Reference Components ⚠️

Components in `_reference/` are **NOT official** — they're prototype patterns to reuse, NOT complete implementations. They have NOT been officially designed per UX spec and should not be imported directly.

## Installation

```bash
# From monorepo root
pnpm install

# Build UI package
cd packages/ui
pnpm build

# Run Storybook
pnpm storybook
```

## Usage

```tsx
import { LoginView, AppHeader, ResumeCard } from "@jobswyft/ui"
import "@jobswyft/ui/styles" // Import semantic tokens

function App() {
  return (
    <div>
      <AppHeader onSignOut={handleSignOut} />
      <LoginView onSignIn={handleSignIn} />
    </div>
  )
}
```

## Official Components

### Layout Components

| Component | Description | Used By |
|-----------|-------------|---------|
| `AppHeader` | Top navigation bar with theme toggle, settings dropdown, reset button | Extension authenticated view |
| `ExtensionSidebar` | Side panel shell with tab navigation, context content, credit footer | Extension authenticated view |

### Feature Components

| Component | Description | Used By |
|-----------|-------------|---------|
| `LoginView` | Logged-out state with feature showcase + Google sign-in CTA | Extension unauthenticated view |
| `ResumeCard` | Resume management with collapsible sections | Extension authenticated view |
| `ResumeEmptyState` | Empty state when no resumes uploaded (dashed border pattern) | ResumeCard |

### Block Components

| Component | Description | Used By |
|-----------|-------------|---------|
| `IconBadge` | Icon container with 6 variants × 3 sizes | LoginView, feature components |
| `CopyChip` | Copyable text chip with clipboard icon and success feedback | Resume sections |
| `CopyButton` | Inline icon button for copying text | Resume sections |
| `CollapsibleSection` | Expandable/collapsible content section with smooth animation | ResumeCard |

### UI Components (shadcn/ui)

All standard shadcn/ui components are available:
- `Button`, `Badge`, `Card`, `Input`, `Textarea`, `Select`
- `Dialog`, `DropdownMenu`, `Tabs`, `Collapsible`, `Tooltip`
- `Separator`, `ScrollArea`, `Progress`, `Avatar`, `Skeleton`, `AlertDialog`

## Semantic Design Tokens

All components use semantic CSS variables from `globals.css`:

```css
/* Core semantic tokens */
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--muted, --muted-foreground
--destructive, --success, --warning

/* Card accent (two-tone pattern) */
--card-accent-bg, --card-accent-border

/* Functional area colors (future use) */
--scan-primary, --ai-studio-primary
--autofill-primary, --coach-primary
```

**Important:** Never use hardcoded Tailwind colors (e.g., `blue-500`, `violet-600`). Always use semantic tokens.

## Cross-Cutting Patterns

1. **Accent Border Card** — `border-2 border-card-accent-border` (must be border-2 to show over shadcn ring-1)
2. **Two-Tone Card** — Main body + accent-tinted section (`bg-card-accent-bg` + `border-t`)
3. **Dashed Border Empty States** — `border-2 border-dashed` for missing/incomplete items
4. **Icon Sizing** — Consistent `size-X` pattern (not `h-X w-X`)
5. **Micro Text** — `.text-micro` CSS utility (10px) instead of `text-[10px]`

## API Mappers

The package exports data transformation utilities for API responses:

```typescript
import { unwrap, mapResumeResponse, mapJobResponse } from "@jobswyft/ui"

// Unwrap API envelope
const resume = unwrap(apiResponse)

// Map snake_case → camelCase
const resumeData = mapResumeResponse(apiResumeResponse)
const jobData = mapJobResponse(apiJobResponse)
```

Available mappers:
- `unwrap()`, `unwrapPaginated()`
- `mapResumeList()`, `mapResumeResponse()`
- `mapJobResponse()`, `mapMatchAnalysis()`
- `mapUsageResponse()`, `mapProfileResponse()`

## Development

### Running Storybook

```bash
cd packages/ui
pnpm storybook  # → http://localhost:6006
```

Storybook features:
- **Theme toggle** — Switch between dark/light modes
- **Viewports** — Side Panel (360px, 500px), Mobile, Tablet
- **Autodocs** — Automatically generated component documentation

### Adding New Components

1. Start from UX Design Specification
2. Build component with semantic tokens (no hardcoded colors)
3. Create Storybook story with all variants and viewports
4. Test in light AND dark modes
5. Export from `src/index.ts` only after used in an official feature
6. Document in this README

### Testing

```bash
cd packages/ui
pnpm test       # Run Vitest tests
pnpm test:watch # Watch mode
```

## Build

```bash
cd packages/ui
pnpm build  # → dist/
```

Build output:
- `dist/index.js` — Vite bundle (ESM)
- `dist/index.d.ts` — TypeScript declarations

## Links

- [UX Design Specification](../../_bmad-output/planning-artifacts/ux-design-specification.md)
- [Architecture](../../_bmad-output/planning-artifacts/architecture.md)
- [Component Development Methodology](../../_bmad-output/planning-artifacts/epics/component-development-methodology.md)
- [Storybook](http://localhost:6006) (when running)

## License

Private
