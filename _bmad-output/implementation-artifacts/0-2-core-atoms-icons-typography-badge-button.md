# Story 0.2: Core Atoms (Icons, Typography, Badge, Button)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Epic Context

**Epic 0: Platform Foundation (UI Component Library Migration)**

This story is part of the UI foundation that enables all user experiences across the 3-surface product: Chrome Extension (sidebar + popup), Web Dashboard, and future integrations. These atomic components must work seamlessly in all contexts.

**Epic Scope:** Establish shared packages (design-tokens, ui, types) that provide consistent UX across Extension, Dashboard, and API surfaces.

**Surfaces:** All (infrastructure) - Extension content scripts, extension popup, and dashboard pages will consume these components.

## Story

As a **developer building molecules, organisms, and compositions**,
I want **core atomic components (Button, Badge, Icon, Typography) implemented with Storybook documentation**,
So that **I can compose higher-level UI patterns with consistent styling, behavior, and multi-surface compatibility**.

## Acceptance Criteria

### AC1: Button Component (`packages/ui/src/atoms/Button/`)

**Given** the design tokens and UI scaffold exist
**When** I create the Button component
**Then** the following deliverables exist:

#### Button.tsx Implementation
- `forwardRef` component extending `ButtonHTMLAttributes<HTMLButtonElement>`
- Props interface with:
  - `variant`: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger' (default: 'primary')
  - `size`: 'sm' | 'md' | 'lg' (default: 'md')
  - `loading`: boolean - shows spinner, disables interaction (default: false)
  - `leftIcon`: React.ReactNode - icon displayed on left
  - `rightIcon`: React.ReactNode - icon displayed on right
  - `fullWidth`: boolean (default: false)
- Spinner SVG in loading state with animation
- Icon positioning with negative margin compensation
- Accessibility: focus-visible outline, aria-label on spinner

#### Button.module.css Styling
- **Base styles:**
  - `display: inline-flex` with center alignment
  - `gap: var(--space-2)` between children and icons
  - `font-weight: var(--font-weight-semibold)`
  - `border-radius: var(--radius-lg)`
  - `transition: all var(--transition-base)`
  - `:focus-visible` with 2px outline
  - `:disabled` with 0.5 opacity and `cursor: not-allowed`

- **Sizes:**
  - `sm`: 8px 16px padding, var(--font-size-sm), 32px min-height
  - `md`: 12px 24px padding, var(--font-size-md), 40px min-height
  - `lg`: 14px 28px padding, var(--font-size-lg), 48px min-height

- **Variants:**
  - `primary`: gradient background, white text, shadow-md, hover lift (-2px transform), glow shadow on hover
  - `secondary`: glassmorphism (var(--theme-glass-bg) bg, 1px border, blur(10px) backdrop), theme-aware styling for light mode
  - `tertiary`: transparent bg, color-inherit, glass bg on hover
  - `success`: rgba(34,197,94,0.15) bg, success-500 text, 0.3 border alpha
  - `danger`: rgba(239,68,68,0.15) bg, danger-500 text, 0.3 border alpha

- **Loading state:**
  - `.loading` class hides text
  - `.spinner` absolutely positioned over button
  - SVG with spin animation (0.75 opacity path, 0.25 opacity circle)

#### Button.stories.tsx
- Meta with `tags: ['autodocs']` for auto-documentation
- ArgTypes for variant, size, loading, disabled, fullWidth
- Stories: Primary, Secondary, Tertiary, Success, Danger
- Size stories: Small, Medium, Large
- State stories: Loading, Disabled, FullWidth
- Icon stories: WithLeftIcon, WithRightIcon
- Showcase stories: AllVariants, AllSizes

#### Button/index.ts
- Export Button component and ButtonProps interface

---

### AC2: Badge Component (`packages/ui/src/atoms/Badge/`)

**Given** the design tokens exist
**When** I create the Badge component
**Then** the following deliverables exist:

#### Badge.tsx Implementation
- Functional component (no forwardRef needed for `<span>`)
- Props extending `HTMLAttributes<HTMLSpanElement>`:
  - `variant`: 'success' | 'info' | 'purple' | 'warning' | 'danger' (default: 'info')
  - `size`: 'sm' | 'md' (default: 'md')
- Uses `cn()` utility for conditional styling
- JSDoc documentation

#### Badge.module.css Styling
- **Base:**
  - `display: inline-flex` with center alignment
  - `font-weight: var(--font-weight-medium)`
  - `border-radius: var(--radius-sm)`
  - `white-space: nowrap`

- **Sizes:**
  - `sm`: 2px 8px padding, var(--font-size-xs)
  - `md`: 4px 10px padding, var(--font-size-xs)

- **Variants (all use 0.15 bg alpha + 0.3 border alpha):**
  - `success`: rgba(34,197,94,...) bg/border, success-500 text
  - `info`: rgba(59,130,246,...) bg/border, blue-500 text
  - `purple`: rgba(139,92,246,...) bg/border, purple-500 text
  - `warning`: rgba(245,158,11,...) bg/border, warning-500 text
  - `danger`: rgba(239,68,68,...) bg/border, danger-500 text

#### Badge.stories.tsx
- Meta with `tags: ['autodocs']`
- ArgTypes for variant and size
- Variant stories: Success, Info, Purple, Warning, Danger
- Size stories: Small, Medium
- Showcase stories: AllVariants, AllSizes, JobStatusExample, JobDetailsExample

#### Badge/index.ts
- Export Badge component and BadgeProps interface

---

### AC3: Icon Component (`packages/ui/src/atoms/Icon/`)

**Given** the design tokens exist
**When** I create the Icon system
**Then** the following deliverables exist:

#### Icon.tsx (Base Component)
- `forwardRef` component extending `SVGAttributes<SVGElement>`
- Props:
  - `size`: number (default: 24) - width and height
  - `color`: string (default: 'currentColor')
  - `strokeWidth`: number (default: 2)
  - `className`: string - additional classes
- Returns `<svg>` with:
  - `viewBox="0 0 24 24"`
  - `fill="none"`, `stroke={color}`, `strokeWidth={strokeWidth}`
  - `strokeLinecap="round"`, `strokeLinejoin="round"`
  - Children as SVG paths/elements
- JSDoc documentation

#### Icon Collection (63+ Individual Icon Components)

**Icon SVG Source Strategy:**
- **Primary Source:** Heroicons v2 (outline variant) - MIT licensed
- **Fallback:** Custom SVG paths matching Heroicons style consistency
- **Reference Implementation:** `/Users/enigma/Documents/Projects/storybook-demo/packages/ui/src/atoms/Icon/icons/`
- **Constraints:** All icons use `viewBox="0 0 24 24"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`

Each icon exports as a functional component that uses the base Icon component:

**Navigation Icons (6):**
- Home, Menu, Search, Bell, User, Settings

**Action Icons (15):**
- Plus, Edit, Trash, Copy, Save, Share, Download, Upload, Bookmark, ExternalLink

**Status Icons (8):**
- Check, CheckCircle, CheckSquare, X, XCircle, AlertCircle, AlertTriangle, Info

**Business Icons (10):**
- Briefcase, Building, MapPin, Calendar, Clock, DollarSign, FileText, File, Folder, Filter

**AI/Feature Icons (9):**
- Sparkles, Brain, Target, Wand, Bot, Scan, BarChart, Rocket, Zap

**UI Icons (8):**
- ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, MoreVertical, Eye, EyeOff

**Theme Icons (2):**
- Sun, Moon

**Communication Icons (2):**
- Mail, MessageSquare

**Social Icons (3):**
- Linkedin, Github, Heart

**Total: 63 icons**

#### Icon/index.ts
- Export Icon base component and IconProps
- Export all icon components (63+ items)

#### Icon.stories.tsx
- ArgTypes for size, color, strokeWidth
- Stories:
  - **Default**: Single icon example
  - **AllIcons**: Grid of all icons with labels
  - **Sizes**: 16px, 20px, 24px, 32px, 48px
  - **Colors**: Primary, danger, success, warning, purple
  - **NavigationIcons**: 6 nav icons
  - **ActionIcons**: 15 action icons
  - **StatusIcons**: 8 status icons with semantic colors
  - **AIFeatureIcons**: 9 icons in gradient boxes (Match, Cover Letter, Answer, Outreach, etc.)
  - **BusinessIcons**: 10 business-related icons
  - **SocialIcons**: 3 social icons

---

### AC4: Typography Component (`packages/ui/src/atoms/Typography/`)

**Given** the design tokens exist
**When** I create the Typography component
**Then** the following deliverables exist:

#### Typography.tsx Implementation
- Functional component with polymorphic `as` prop
- Props extending `HTMLAttributes<HTMLElement>`:
  - `as`: ElementType - HTML element to render (smart defaults by variant)
  - `variant`: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'small' | 'xs' (default: 'body')
  - `color`: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'success' | 'danger' | 'warning' (default: 'primary')
  - `weight`: 'normal' | 'medium' | 'semibold' | 'bold' (optional)
  - `align`: 'left' | 'center' | 'right' (optional)
  - `children`: ReactNode (required)
- `getDefaultElement()` function:
  - h1 → `<h1>`, h2 → `<h2>`, h3 → `<h3>`, h4 → `<h4>`, small/xs → `<small>`, default → `<p>`
- Uses `cn()` utility for conditional styling

#### Typography.module.css Styling
- **Base:**
  - `font-family: var(--font-family-base)`
  - `margin: 0`

- **Variants:**
  - `h1`: var(--font-size-6xl), bold, tight letter-spacing, tight line-height
  - `h2`: var(--font-size-5xl), semibold, tight letter-spacing, tight line-height
  - `h3`: var(--font-size-4xl), semibold, tight letter-spacing, tight line-height
  - `h4`: var(--font-size-3xl), semibold, tight line-height
  - `bodyLarge`: var(--font-size-lg), normal line-height
  - `body`: var(--font-size-base), normal line-height
  - `small`: var(--font-size-sm), normal line-height
  - `xs`: var(--font-size-xs), normal line-height

- **Colors:**
  - `color-primary`: var(--theme-text-primary)
  - `color-secondary`: var(--theme-text-secondary)
  - `color-tertiary`: var(--theme-text-tertiary)
  - `color-muted`: var(--theme-text-muted)
  - `color-success`: var(--color-success-500)
  - `color-danger`: var(--color-danger-500)
  - `color-warning`: var(--color-warning-500)

- **Weights:**
  - `weight-normal`: var(--font-weight-normal)
  - `weight-medium`: var(--font-weight-medium)
  - `weight-semibold`: var(--font-weight-semibold)
  - `weight-bold`: var(--font-weight-bold)

- **Alignment:**
  - `align-left`: text-align: left
  - `align-center`: text-align: center
  - `align-right`: text-align: right

#### Typography.stories.tsx
- ArgTypes for variant, color, weight, align
- Heading stories: Heading1-4
- Body stories: BodyLarge, Body, Small, ExtraSmall
- Color stories: Primary, Secondary, Tertiary, Muted, Success, Danger, Warning
- Weight stories: WeightNormal, WeightMedium, WeightSemibold, WeightBold
- Alignment stories: AlignLeft, AlignCenter, AlignRight
- Showcase stories: TypographyScale, ColorPalette, JobCardExample

#### Typography/index.ts
- Export Typography component and TypographyProps interface

---

## Tasks / Subtasks

- [x] Task 1: Create Button Component (AC: #1)
  - [x] 1.1: Create `packages/ui/src/atoms/Button/Button.tsx` with all props and loading state
  - [x] 1.2: Create `packages/ui/src/atoms/Button/Button.module.css` with all variants and sizes
  - [x] 1.3: Create `packages/ui/src/atoms/Button/Button.stories.tsx` with full story coverage
  - [x] 1.4: Create `packages/ui/src/atoms/Button/index.ts` with exports
  - [x] 1.5: Verify Button builds and displays in Storybook

- [x] Task 2: Create Badge Component (AC: #2)
  - [x] 2.1: Create `packages/ui/src/atoms/Badge/Badge.tsx`
  - [x] 2.2: Create `packages/ui/src/atoms/Badge/Badge.module.css` with 5 variants and 2 sizes
  - [x] 2.3: Create `packages/ui/src/atoms/Badge/Badge.stories.tsx`
  - [x] 2.4: Create `packages/ui/src/atoms/Badge/index.ts`
  - [x] 2.5: Verify Badge builds and displays in Storybook

- [x] Task 3: Create Icon Base + Collection (AC: #3)
  - [x] 3.1: Create `packages/ui/src/atoms/Icon/Icon.tsx` base component
  - [x] 3.2: Create 63+ individual icon components in `packages/ui/src/atoms/Icon/icons/` directory
  - [x] 3.3: Create `packages/ui/src/atoms/Icon/index.ts` with all exports
  - [x] 3.4: Create `packages/ui/src/atoms/Icon/Icon.stories.tsx` with comprehensive stories
  - [x] 3.5: Verify all icons display correctly in Storybook

- [x] Task 4: Create Typography Component (AC: #4)
  - [x] 4.1: Create `packages/ui/src/atoms/Typography/Typography.tsx` with polymorphic `as` prop
  - [x] 4.2: Create `packages/ui/src/atoms/Typography/Typography.module.css` with variants, colors, weights, alignment
  - [x] 4.3: Create `packages/ui/src/atoms/Typography/Typography.stories.tsx`
  - [x] 4.4: Create `packages/ui/src/atoms/Typography/index.ts`
  - [x] 4.5: Verify Typography builds and displays in Storybook

- [x] Task 5: Update Package Exports (AC: #1-4)
  - [x] 5.1: Update `packages/ui/src/atoms/index.ts` to export all new components
  - [x] 5.2: Update `packages/ui/src/index.ts` to include atoms in public exports

- [x] Task 6: Verify Integration & Multi-Surface Testing
  - [x] 6.1: Run `pnpm build` in packages/ui
  - [x] 6.2: Run Storybook: `pnpm storybook` from packages/ui
  - [x] 6.3: Test theme toggle (dark/light) across all components
  - [x] 6.4: Test Button in Extension Popup viewport (400×600)
    - Verify no overflow, loading state preserves layout, fullWidth works
  - [x] 6.5: Test Typography in Extension Sidebar viewport (400×800)
    - Verify h1-h4 scale appropriately, line wrapping works, color contrast sufficient
  - [x] 6.6: Test Badge + Icon in Desktop viewport (1440×900)
    - Verify badge sizing, icon alignment, responsive behavior
  - [x] 6.7: Verify auto-documentation generation (autodocs tag working)

---

## Dev Notes

### Styling Decision Matrix

| Use Case | Tool | Example |
|----------|------|---------|
| Colors, spacing, typography, shadows | Design Token CSS vars | `var(--color-primary-500)`, `var(--space-4)` |
| Layout, responsive, utilities | Tailwind | `flex gap-4 md:grid-cols-2` |
| Glassmorphism, animations, complex effects | CSS Modules | `styles.glassMorph`, `styles.loading` |

**Merge strategy:** `cn(tailwindClasses, styles.moduleClasses)` - uses `tailwind-merge` for conflict resolution.

### Component Architecture Pattern

**Standard structure (applies to all 4 components):**
```
atoms/ComponentName/
├── ComponentName.tsx          # forwardRef if needs ref, functional otherwise
├── ComponentName.module.css   # Design tokens + CSS Modules
├── ComponentName.stories.tsx  # autodocs tag + comprehensive stories
└── index.ts                   # Export component + Props interface
```

| Pattern | Components | Rationale |
|---------|------------|-----------|
| **forwardRef** | Button, Icon, Typography | Need ref forwarding; Typography uses polymorphic `as` |
| **Functional** | Badge | Simple span element, no ref needed |
| **CSS Modules** | All 4 | Component-scoped styling, not global classes |
| **Design Tokens** | All 4 | Always use `var(--token-name)` from `@jobswyft/design-tokens` |
| **cn() utility** | All 4 | Merge conditional classes with conflict resolution |
| **TypeScript** | All 4 | Props extend appropriate HTML element attributes |
| **JSDoc** | All 4 | Document component props and behavior |

### Icon System Architecture

The Icon system uses a two-tier approach:
1. **Base Icon Component** (`Icon.tsx`): Handles sizing, color, strokeWidth
2. **Individual Icon Components** (`icons/*.tsx`): Each icon passes its unique SVG paths to base

**Advantages:**
- Consistent sizing/styling across all icons
- Easy to add new icons (just create new file with paths)
- Type-safe icon composition
- Tree-shakeable (only bundle icons actually used)

**Icon structure:**
```tsx
// icons/Home.tsx
export const Home = (props: Partial<IconProps>) => (
  <Icon {...props}>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </Icon>
);
```

### shadcn/ui Integration Strategy

**Critical Architectural Decision:**

| Component Type | Implementation | Rationale |
|----------------|----------------|-----------|
| **Custom (This Story)** | Button, Badge, Typography, Icon | Full design control for gradients, glow shadows, loading states, glassmorphism |
| **shadcn/ui (Future)** | Select, Dialog, Dropdown, Tooltip, Tabs, Popover | Complex interaction patterns, accessibility, keyboard nav |

**Why Button is custom:** Requires gradient backgrounds, glow shadows on hover, custom loading spinner - shadcn Button doesn't support these design system requirements.

**Future shadcn integration:** Story 0.3+ will install shadcn primitives with CSS variable overrides:
```css
/* globals.css - Map shadcn variables to design tokens */
--background: var(--theme-background-primary);
--foreground: var(--theme-text-primary);
--primary: var(--color-primary-500);
```

**Developer guardrail:** Do NOT use shadcn Button/Badge - use custom components from this story for consistent design system.

### Atomic Design Progression (Epic 0 Roadmap)

**This story creates ATOMS** - the smallest, reusable building blocks with single responsibility.

| Story | Level | Components | Purpose |
|-------|-------|------------|---------|
| ✅ 0.1 | Foundation | Design tokens, ThemeProvider, cn() | Visual language |
| 🚀 **0.2** | **Atoms** | **Button, Badge, Icon, Typography** | **Basic UI primitives** |
| 📋 0.3 | Atoms | Input, Textarea, Select, ProgressBar, Logo | Form & branding atoms |
| 📋 0.4 | Molecules | Card, Modal | Composed from atoms |
| 📋 0.5 | Organisms | Navbar, JobCard, Tabs, EmptyState | Business components |
| 📋 0.6 | Compositions | ExtensionSidebar, FAB, ExtensionPopup | Full UI sections |

**Design Principles for Atoms:**
- **Single responsibility:** One visual/interaction pattern per component
- **No business logic:** Pure presentation, no API calls or state management
- **Highly reusable:** Used 10+ times across Extension, Dashboard, and future surfaces
- **Well-documented props:** Enable composition in molecules/organisms/compositions

**Example future composition:**
```tsx
// Story 0.5: JobCard organism will compose these atoms
<Card>
  <Typography variant="h3">{jobTitle}</Typography>
  <Badge variant="success">Remote</Badge>
  <Button variant="primary" leftIcon={<Sparkles />}>
    Generate Match
  </Button>
</Card>
```

### Typography Polymorphic Component

Typography uses a polymorphic `as` prop to allow semantic HTML flexibility:
```tsx
// Render h2 HTML element with h3 styling
<Typography variant="h3" as="h2">Section Title</Typography>

// Render div with bodyLarge styling
<Typography variant="bodyLarge" as="div">Description text</Typography>
```

**Smart defaults by variant:**
- h1-h4 variants → corresponding HTML heading elements
- small/xs variants → `<small>` element
- body variants → `<p>` element

### Button Loading State

The loading state implementation:
- Shows animated spinner over button content
- Hides button text (opacity 0) but preserves button size
- Disables all interactions (`disabled` + `pointer-events: none`)
- Spinner animation: 1s linear infinite rotation
- Accessible via `aria-label="Loading"` on spinner

### Badge Variant Color System

All badge variants use consistent alpha transparency:
- **Background**: 0.15 alpha (15% opacity)
- **Border**: 0.3 alpha (30% opacity)
- **Text**: 500 shade (full opacity)

This creates subtle, readable badges that work in both dark and light themes.

### Component Consumption (Multi-Surface)

**How these atoms are consumed across the 3-surface product:**

```tsx
// Extension Content Script (apps/extension/src/entrypoints/content/index.tsx)
import { Button, Badge, Icon, Typography } from '@jobswyft/ui';
import '@jobswyft/design-tokens/tokens.css';
import '@jobswyft/design-tokens/themes.css';

// Renders in Chrome extension sidebar (400×800 viewport)
<Button variant="primary" leftIcon={<Sparkles />}>
  Generate Match
</Button>
```

```tsx
// Dashboard Page (apps/web/src/app/jobs/page.tsx)
import { Button, Badge, Icon, Typography } from '@jobswyft/ui';
// Design tokens auto-imported via globals.css

// Renders in web dashboard (responsive 375px → 1440px+)
<Typography variant="h2">Your Jobs</Typography>
<Badge variant="success">Applied</Badge>
```

**Build Output Expectations (from Story 0.1):**
- Package size: ~60.67 kB (dist)
- Gzipped: ~11.18 kB
- Tree-shakeable: Only imported components bundled
- ESM + CJS exports for compatibility

**Consumer Integration Checklist:**
- ✅ Import components from `@jobswyft/ui`
- ✅ Import design token CSS in entry point
- ✅ Wrap app in `<ThemeProvider>` for theme switching
- ✅ Use `cn()` utility for class merging

### Storybook Configuration

**Autodocs:**
- All components use `tags: ['autodocs']` for automatic documentation generation
- ArgTypes define interactive controls for props
- Showcase stories demonstrate multiple variants/combinations

**Viewport presets (from Story 0.1):**
- Mobile: 375×667
- Tablet: 768×1024
- Desktop: 1440×900
- Extension Popup: 400×600

**Theme toggle:**
- Dark/light theme switcher in Storybook toolbar
- All components must look correct in both themes

### Project Structure Notes

**Alignment with unified project structure:**
- All components in `packages/ui/src/atoms/`
- Each component in its own folder (Button/, Badge/, Icon/, Typography/)
- Standard file structure: Component.tsx, Component.module.css, Component.stories.tsx, index.ts
- Public exports via `packages/ui/src/atoms/index.ts` → `packages/ui/src/index.ts`

**No conflicts detected** - Story 0.1 established the foundation correctly:
- Design tokens package built and working
- UI package scaffold with Storybook configured
- Theme provider and cn() utility ready
- Tailwind config extending design tokens

### References

**Source Code Reference (storybook-demo):**
- Button: `/Users/enigma/Documents/Projects/storybook-demo/packages/ui/src/atoms/Button/`
- Badge: `/Users/enigma/Documents/Projects/storybook-demo/packages/ui/src/atoms/Badge/`
- Icon: `/Users/enigma/Documents/Projects/storybook-demo/packages/ui/src/atoms/Icon/`
- Typography: `/Users/enigma/Documents/Projects/storybook-demo/packages/ui/src/atoms/Typography/`

**Project Documentation:**
- [Source: _bmad-output/planning-artifacts/architecture.md#UI-Package-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Hybrid-Styling-Approach]
- [Source: _bmad-output/implementation-artifacts/0-1-foundation-design-tokens-ui-scaffold.md]

**Design Tokens Available (from Story 0.1):**
- Colors: primary (500-700), purple, blue, success, warning, danger, grayscale, glass
- Typography: font sizes (xs 11px → 6xl 48px), weights (400-700), line heights
- Spacing: 4px base scale (space-1 4px → space-10 40px)
- Radius: sm 6px → 3xl 20px
- Shadows: sm (0 2px 8px) → xl (0 20px 60px)
- Transitions: fast 0.15s → slow 0.3s
- Themes: dark (default), light (via `data-theme="light"`)

**Key Architecture Decisions:**
- CSS Modules for component-specific styles (not global classes)
- Design tokens via CSS variables (single source of truth)
- Tailwind for utilities, not component styling
- Storybook for documentation and visual testing
- No shadcn/ui for atomic components (custom implementation)

### Previous Story Intelligence

**Story 0.1 Learnings:**

**What worked well:**
- Style Dictionary build process generates clean CSS variables
- Theme switching via `data-theme` attribute is reliable
- Storybook 8.x with React-Vite is fast
- pnpm workspace linking works correctly
- CSS Modules + Tailwind hybrid approach is flexible

**Code patterns established:**
- All packages use TypeScript strict mode
- Build output: dist/ directory (git-ignored)
- CSS variable naming: `--color-{name}-{shade}`, `--theme-{category}-{name}`
- Package exports: ES modules (`.mjs`) + CommonJS (`.js`) + types (`.d.ts`)

**Files created in Story 0.1:**
- `packages/design-tokens/` - 13 files (token JSONs, build scripts, package config)
- `packages/ui/` - 19 files (scaffold, utilities, providers, Storybook config)

**Testing approach:**
- Vitest for unit tests
- Storybook for visual testing
- Tests run in CI (pnpm test)

**Git commit pattern from Story 0.1:**
- First commit: `feat(ui): implement design tokens and UI package scaffold (Story 0.1)`
- Second commit: `chore(story-0.1): mark story as done after code review fixes`

### Build Commands

```bash
# From packages/ui directory:
pnpm build                # Build components (tsc + vite build)
pnpm storybook           # Start Storybook → http://localhost:6006
pnpm test                # Run Vitest tests

# From project root:
pnpm -F @jobswyft/ui build
pnpm -F @jobswyft/ui storybook
pnpm -F @jobswyft/ui test
```

### Completion Criteria

Story 0.2 is complete when:

✅ All 4 atomic components created (Button, Badge, Icon, Typography)
✅ Each component has:
  - TypeScript component file with JSDoc
  - CSS Module with all variants/sizes from AC
  - Storybook stories with autodocs tag
  - index.ts with exports
✅ All components render in Storybook
✅ Theme toggle works for all components (dark/light)
✅ All viewport presets display components correctly
✅ Build succeeds: `pnpm build` in packages/ui (no errors)
✅ No TypeScript errors or warnings
✅ Public exports updated in:
  - `packages/ui/src/atoms/index.ts`
  - `packages/ui/src/index.ts`

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

- All components built successfully with `pnpm build`
- Storybook running on http://localhost:6006
- All 4 atomic components (Button, Badge, Icon, Typography) rendering correctly
- 63 individual icon components created from Heroicons reference
- CSS Module type declarations added via `global.d.ts`
- TypeScript strict mode passing with no errors

### Completion Notes List

**Task 1: Button Component** ✅
- Implemented forwardRef component with 5 variants (primary, secondary, tertiary, success, danger)
- 3 sizes (sm, md, lg) with proper padding and min-heights
- Loading state with animated spinner SVG
- Left/right icon support with negative margin compensation
- Accessibility: focus-visible outline, aria-label on spinner
- All Storybook stories passing: Primary, Secondary, Tertiary, Success, Danger, Small, Medium, Large, Loading, Disabled, FullWidth, WithLeftIcon, WithRightIcon, AllVariants, AllSizes

**Task 2: Badge Component** ✅
- Functional component with 5 variants (success, info, purple, warning, danger)
- 2 sizes (sm, md)
- Consistent alpha transparency: 0.15 bg, 0.3 border, 500 shade text
- Storybook stories: Success, Info, Purple, Warning, Danger, Small, Medium, AllVariants, AllSizes, JobStatusExample, JobDetailsExample

**Task 3: Icon System** ✅
- Base Icon component with forwardRef, size, color, strokeWidth props
- 63 individual icon components organized by category:
  - Navigation (6): Home, Menu, Search, Bell, User, Settings
  - Action (15): Plus, Edit, Trash, Copy, Save, Share, Download, Upload, Bookmark, ExternalLink, Star, Tag, Link, Paperclip, RefreshCw
  - Status (8): Check, CheckCircle, CheckSquare, X, XCircle, AlertCircle, AlertTriangle, Info
  - Business (10): Briefcase, Building, MapPin, Calendar, Clock, DollarSign, FileText, File, Folder, Filter
  - AI/Feature (9): Sparkles, Brain, Target, Wand, Bot, Scan, BarChart, Rocket, Zap
  - UI (8): ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, MoreVertical, Eye, EyeOff
  - Theme (2): Sun, Moon
  - Communication (2): Mail, MessageSquare
  - Social (3): Linkedin, Github, Heart
- Storybook stories: Default, AllIcons, Sizes, Colors, NavigationIcons, ActionIcons, StatusIcons, AIFeatureIcons, BusinessIcons, SocialIcons

**Task 4: Typography Component** ✅
- Polymorphic component with `as` prop for semantic HTML flexibility
- 8 variants: h1, h2, h3, h4, bodyLarge, body, small, xs
- 7 colors: primary, secondary, tertiary, muted, success, danger, warning
- 4 weights: normal, medium, semibold, bold
- 3 alignments: left, center, right
- Smart defaults: h1-h4 → corresponding HTML elements, small/xs → `<small>`, body → `<p>`
- Storybook stories: Heading1-4, BodyLarge, Body, Small, ExtraSmall, Primary-Warning colors, Weight variants, Alignment variants, TypographyScale, ColorPalette, JobCardExample

**Task 5: Package Exports** ✅
- Updated `packages/ui/src/atoms/index.ts` with all 4 components + 63 icons
- Main `packages/ui/src/index.ts` already exports from atoms (no changes needed)
- All components and types properly exported for consumption

**Task 6: Integration Testing** ✅
- Build successful: `pnpm build` in packages/ui
- Storybook running: http://localhost:6006
- Theme toggle tested: All components render correctly in dark/light themes
- Viewport testing:
  - Extension Popup (400×600): Button variants render without overflow, fullWidth works
  - Extension Sidebar (400×800): Typography scaling appropriate, line wrapping works
  - Desktop (1440×900): Badge + Icon sizing correct, responsive behavior verified
- Autodocs tag working: All components show auto-generated documentation

**Build Output:**
- dist/style.css: 23.06 kB (gzip: 4.71 kB)
- dist/index.mjs: 85.92 kB (gzip: 16.79 kB) - ESM
- dist/index.js: 40.52 kB (gzip: 12.47 kB) - CJS

### File List

**New Files Created (80 total):**

Button Component (4 files):
- `packages/ui/src/atoms/Button/Button.tsx`
- `packages/ui/src/atoms/Button/Button.module.css`
- `packages/ui/src/atoms/Button/Button.stories.tsx`
- `packages/ui/src/atoms/Button/index.ts`

Badge Component (4 files):
- `packages/ui/src/atoms/Badge/Badge.tsx`
- `packages/ui/src/atoms/Badge/Badge.module.css`
- `packages/ui/src/atoms/Badge/Badge.stories.tsx`
- `packages/ui/src/atoms/Badge/index.ts`

Icon System (68 files):
- `packages/ui/src/atoms/Icon/Icon.tsx`
- `packages/ui/src/atoms/Icon/Icon.stories.tsx`
- `packages/ui/src/atoms/Icon/index.ts`
- `packages/ui/src/atoms/Icon/icons/` (63 individual icon .tsx files):
  - Navigation: Home.tsx, Menu.tsx, Search.tsx, Bell.tsx, User.tsx, Settings.tsx
  - Action: Plus.tsx, Edit.tsx, Trash.tsx, Copy.tsx, Save.tsx, Share.tsx, Download.tsx, Upload.tsx, Bookmark.tsx, ExternalLink.tsx, Star.tsx, Tag.tsx, Link.tsx, Paperclip.tsx, RefreshCw.tsx
  - Status: Check.tsx, CheckCircle.tsx, CheckSquare.tsx, X.tsx, XCircle.tsx, AlertCircle.tsx, AlertTriangle.tsx, Info.tsx
  - Business: Briefcase.tsx, Building.tsx, MapPin.tsx, Calendar.tsx, Clock.tsx, DollarSign.tsx, FileText.tsx, File.tsx, Folder.tsx, Filter.tsx
  - AI/Feature: Sparkles.tsx, Brain.tsx, Target.tsx, Wand.tsx, Bot.tsx, Scan.tsx, BarChart.tsx, Rocket.tsx, Zap.tsx
  - UI: ChevronUp.tsx, ChevronDown.tsx, ChevronLeft.tsx, ChevronRight.tsx, MoreHorizontal.tsx, MoreVertical.tsx, Eye.tsx, EyeOff.tsx
  - Theme: Sun.tsx, Moon.tsx
  - Communication: Mail.tsx, MessageSquare.tsx
  - Social: Linkedin.tsx, Github.tsx, Heart.tsx

Typography Component (4 files):
- `packages/ui/src/atoms/Typography/Typography.tsx`
- `packages/ui/src/atoms/Typography/Typography.module.css`
- `packages/ui/src/atoms/Typography/Typography.stories.tsx`
- `packages/ui/src/atoms/Typography/index.ts`

Modified Files:
- `packages/ui/src/atoms/index.ts` - Added exports for all 4 components + 63 icons
- `packages/ui/src/global.d.ts` - Added CSS Module type declarations

Total: 80 new files, 2 modified files

---

## Change Log

**Date:** 2026-02-02

**Summary:** Implemented all 4 atomic components (Button, Badge, Icon system with 63 icons, Typography) with complete Storybook documentation and multi-surface testing.

**Changes:**
- ✅ Created Button component with 5 variants, 3 sizes, loading state, icon support
- ✅ Created Badge component with 5 variants, 2 sizes
- ✅ Created Icon base component + 63 individual icon components from Heroicons
- ✅ Created Typography component with polymorphic `as` prop, 8 variants, 7 colors, 4 weights, 3 alignments
- ✅ Updated package exports in `atoms/index.ts`
- ✅ Added CSS Module type declarations (`global.d.ts`)
- ✅ Build successful: 85.92 kB (gzip: 16.79 kB) ESM, 40.52 kB (gzip: 12.47 kB) CJS
- ✅ Storybook running with all components rendering correctly
- ✅ Theme toggle tested (dark/light)
- ✅ Viewport testing completed (Extension Popup, Extension Sidebar, Desktop)
- ✅ Autodocs generation verified

**Technical Notes:**
- Used exact reference implementation from storybook-demo for consistency
- All components follow design token system (CSS variables)
- CSS Modules for component-scoped styling
- TypeScript strict mode compliance
- forwardRef pattern for Button, Icon, Typography (ref forwarding needed)
- Functional pattern for Badge (simple span element)
