# Component Development Methodology

> **PERSISTENT GUIDANCE — applies to ALL stories in Epic EXT.**
> Every story writer and dev agent MUST follow these rules. Do not deviate without user approval.

## Build Order: Atomic → Composite → Feature

Every story follows this iterative build sequence. Start with the smallest pieces and compose upward:

1. **Audit** — Check `_reference/` for original demos and current `@jobswyft/ui` components
2. **Primitives First** — Ensure shadcn primitives have the right variants (Button sizes, Badge colors, Input states)
3. **Building Blocks** — Build small reusable compositions from primitives (e.g., CreditBar = Progress + Badge + Button)
4. **Feature Components** — Assemble feature-level components from primitives + blocks (e.g., JobCard = Card + Badge + SkillPill + MatchIndicator)
5. **Storybook Verify** — Every component gets stories, tested in dark + light at 360×600
6. **User Verify** — Present to user before proceeding to extension integration
7. **Extension Integrate** — Wire into WXT side panel with Zustand state management
8. **Backend Wire** — Connect to existing API endpoints (build new ones if gaps found)
9. **E2E Verify** — Complete flow works: UI → Extension → API → Database → UI update

## Component Directory Structure

```
packages/ui/src/components/
├── ui/              # shadcn primitives (installed via CLI, minimal customization)
│                    # Button, Card, Badge, Input, Tabs, Dialog, Select, etc.
│
├── blocks/          # Small reusable building blocks — domain-specific but generic
│                    # IconBadge, SkillPill, SelectionChips, CreditBar,
│                    # MatchIndicator, SkillSectionLabel, CreditBalance
│
├── features/        # Feature-level compositions — assembled from ui/ + blocks/
│                    # JobCard, ResumeCard, AiStudio, Coach, Autofill,
│                    # LoggedOutView, FeedbackForm
│
├── layout/          # Shell, navigation, page-level wrappers
│                    # ExtensionSidebar, AppHeader
│
└── _reference/      # Prototype patterns (NOT official, will be deleted after EXT epic)
    ├── future-features/  # Unofficial feature components (ai-studio, autofill, coach, job-card)
    └── blocks/           # Unused block components (credit-balance, match-indicator, skill-pill, selection-chips)
```

| Category | Directory | When to Use | Import Pattern |
|----------|-----------|-------------|----------------|
| **Primitives** | `ui/` | Base interactive elements from shadcn | `import { Button } from '@jobswyft/ui'` |
| **Building Blocks** | `blocks/` | Reusable domain pieces, used in 2+ features | `import { SkillPill } from '@jobswyft/ui'` |
| **Features** | `features/` | Complete feature panels, one per sidebar section | `import { JobCard } from '@jobswyft/ui'` |
| **Layout** | `layout/` | Page/shell-level wrappers, sidebar chrome | `import { AppHeader } from '@jobswyft/ui'` |
| **Reference** | `_reference/` | NEVER import. Pattern reference only — NOT production-ready | N/A — read for patterns, rebuild from UX spec |

## Official vs Reference Components (EXT.4.5+)

**After EXT.4.5 cleanup, components are organized by production readiness:**

### Official Components ✅
- **Location:** `blocks/`, `features/`, `layout/`, `ui/` (main directories)
- **Status:** Designed per UX spec, implemented in extension (EXT.1-4), production-ready
- **Exports:** Exported from `packages/ui/src/index.ts`
- **Import:** `import { Component } from '@jobswyft/ui'`
- **Storybook:** Visible in main navigation

**Official components as of EXT.4:**
- **Layout:** `AppHeader`, `ExtensionSidebar`
- **Features:** `LoginView`, `NonJobPageView`, `ResumeCard`, `ResumeEmptyState`
- **Blocks:** `IconBadge`, `CreditBar`, `CopyChip`, `CopyButton`, `CollapsibleSection`
- **UI:** All shadcn primitives (Button, Card, Badge, etc.)

### Reference Components ⚠️
- **Location:** `_reference/future-features/`, `_reference/blocks/`
- **Status:** Prototype patterns to reuse — NOT officially designed per UX spec
- **Exports:** NOT exported from package
- **Import:** Cannot import — read for patterns only
- **Storybook:** Hidden from main navigation (excluded in `.storybook/main.ts`)

**Reference components (future features):**
- `_reference/future-features/ai-studio.tsx` — Match analysis, cover letter, outreach (EXT.6-7, 9)
- `_reference/future-features/autofill.tsx` — Sequential autofill animation (EXT.8)
- `_reference/future-features/coach.tsx` — Career coaching chat (EXT.12)
- `_reference/future-features/job-card.tsx` — Job details card with match (EXT.5)

**Reference blocks (unused):**
- `_reference/blocks/credit-balance.tsx` — Only in stories, not in extension
- `_reference/blocks/match-indicator.tsx` — Only in job-card, ai-studio
- `_reference/blocks/skill-pill.tsx` — Only in job-card, ai-studio
- `_reference/blocks/selection-chips.tsx` — Only in ai-studio

### Using Reference Components

When building a new feature (e.g., EXT.5 Job Page Scanning):

1. **Start from UX spec** — Read relevant UX Design Specification section FIRST
2. **Review reference pattern** — Check if `_reference/` has similar component
3. **Extract patterns** — Copy ONLY the patterns you need (not whole component)
4. **Rebuild from scratch** — Create new component following UX spec
5. **Refine to spec** — Fix hardcoded colors, add dark mode, proper sizing, etc.
6. **Export** — Add to `packages/ui/src/index.ts` when complete
7. **Document** — Update `packages/ui/README.md` official components list

**Example:**
```tsx
// ❌ WRONG: Don't import from _reference
import { JobCard } from "@jobswyft/ui" // Won't work — not exported

// ✅ CORRECT: Build new component using reference as pattern
// 1. Read _reference/future-features/job-card.tsx for patterns
// 2. Read UX spec for "Job Detected" state requirements
// 3. Create new src/components/features/job-card.tsx
// 4. Reuse patterns: MatchIndicator animation, SkillPill layout
// 5. Fix: hardcoded colors → semantic tokens, proper spacing, etc.
```

## Design Language Rules (ALL Components)

These are NON-NEGOTIABLE for every component in every story:

1. **Zero hardcoded colors** — No `bg-gray-*`, `text-slate-*`, `text-blue-*`. ALL colors from `globals.css` semantic tokens
2. **Dark + Light mode** — Every component tested in both themes. Use semantic tokens that auto-switch
3. **Size tokens** — Use `size-X` not `h-X w-X` (e.g., `size-8` not `h-8 w-8`)
4. **Text micro** — Use `.text-micro` CSS utility for 10px text, never `text-[10px]`
5. **Accent card pattern** — `border-2 border-card-accent-border` (border-2 required to show over shadcn ring-1)
6. **Gradient header pattern** — `bg-gradient-to-r from-card-accent-bg to-transparent`
7. **Scrollbar pattern** — `.scrollbar-hidden` + `.scroll-fade-y` CSS utilities for scroll areas
8. **Icon sizing** — Lucide icons via `size` prop or consistent `size-X` className
9. **Font** — Figtree Variable (loaded via globals.css, never override)
10. **Color space** — OKLCH (configured in globals.css `:root` and `.dark` blocks)

## Variant Pattern (CVA)

Every component with visual variants uses class-variance-authority:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const myComponentVariants = cva("base-classes-here", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
})

interface MyComponentProps extends VariantProps<typeof myComponentVariants> {
  // additional props
}
```

## Storybook Pattern

Every component MUST have stories following this structure:

- **Default** — All variants displayed in a grid/row
- **Sizes** — All size variants if applicable
- **States** — Loading, error, empty, disabled where applicable
- **Extension Viewport** — Rendered at 360×600 viewport
- **Dark Mode** — Only if visual differences go beyond automatic token swap

## Extension Integration Pattern

When integrating a component into the extension:

1. Import from `@jobswyft/ui` — NEVER recreate components locally
2. Create Zustand store for the feature domain if state management needed
3. Use `chrome.storage.local` for persistence across sessions
4. Wire API calls through a shared `api-client.ts` helper
5. Handle loading/error/offline states at the integration point
6. Test in Chrome Side Panel with real data

## Backend Integration Rules

1. **Check existing endpoints first** — 36 API endpoints already exist (10 routers)
2. **If endpoint exists** — Wire directly, document any response shape mismatches
3. **If endpoint missing** — Build it following architecture patterns (envelope, error codes, Pydantic models)
4. **API gaps** — Document in story's "Tech Debt" section for tracking
5. **Snake → camelCase** — Use existing mappers from `@jobswyft/ui` (`mapResumeResponse`, `mapJobResponse`, etc.)

## Cross-Story Learning Protocol

> **MANDATORY for every story.** Dev agents MUST follow this protocol at the end of each story.

**1. Pattern Extraction → globals.css**

After completing any story, the dev agent must audit the components built and:
- Extract any repeated color, spacing, animation, or typography pattern into a CSS utility in `globals.css`
- If a Tailwind utility is used 3+ times in a specific combination, create a CSS class for it
- Document the new utility in the story's dev notes AND update the [Design Language Rules](#design-language-rules-all-components) list above
- Example: if `flex items-center gap-1.5 text-micro text-muted-foreground` appears in multiple components, extract to `.meta-label` in globals.css

**2. Story Learnings → Architecture File**

Each completed story MUST append learnings to `_bmad-output/planning-artifacts/architecture.md` in a dedicated section:

```markdown