# Story 0.1-NEW: shadcn UI Setup & Initial Component Migration

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Architectural Decision: Vite over Next.js

**Decision:** Use Vite as the build tool for `packages/ui` when installing shadcn/ui.

**Rationale:**
- `packages/ui` is a **component library**, not an application
- Vite is the existing build tool for the package (already configured)
- WXT (extension framework) uses Vite → tooling consistency
- Next.js is optimized for full-stack apps (SSR, routing, API routes) → unnecessary complexity for a library
- Storybook uses `@storybook/react-vite` builder → native integration
- shadcn's Vite template is designed for component libraries
- Faster builds, simpler configuration, framework-agnostic output

**What We're NOT Doing:**
- Installing shadcn in a Next.js project then trying to extract it
- Fighting Next.js conventions (App Router, server components) for a client-only library

**Outcome:** Clean, fast, portable component library that both WXT and Next.js apps can consume identically.

---

## Story

As a **UI developer**,
I want to **install and configure shadcn/ui with a custom theme (Nova style, Amber accent, Stone base) as the component library foundation**,
so that **the Extension and Dashboard have an accessible, customizable, production-ready component system with a cohesive design language built on Radix UI primitives**.

## Acceptance Criteria

### AC1: shadcn/ui CLI Installation & Configuration with Custom Theme
**Given** the `packages/ui/` package exists with Tailwind and Storybook,
**When** I run shadcn initialization with the custom preset,
**Then:**
- `components.json` configuration file is created at `packages/ui/`
- Configuration specifies:
  - TypeScript: true
  - Style: Nova (modern design style from shadcn themes)
  - Base color: Stone (neutral base)
  - Theme: Amber (accent color for primary actions)
  - Icon library: Lucide (standard for shadcn)
  - Font: Figtree (Google Font)
  - CSS variables: true
  - Border radius: medium
  - Template: Vite (library build tool)
  - Tailwind config: `tailwind.config.ts`
  - Components path: `src/components/ui`
  - Utils path: `src/lib/utils.ts`
  - React Server Components: false (client components)
  - Aliases configured: `@/components`, `@/lib`
- `src/lib/utils.ts` contains `cn()` utility function (clsx + tailwind-merge)
- Figtree font files downloaded and configured in globals.css

### AC2: Theme Configuration (Stone/Amber Palette)
**Given** shadcn is initialized with the custom preset,
**When** I verify the theme configuration,
**Then:**
- `src/styles/globals.css` contains:
  - Figtree font-face declarations (variable weights)
  - CSS variables for light theme (`:root`) using stone base and amber accent
  - CSS variables for dark theme (`.dark`) with adjusted stone/amber values
  - Base layer with shadcn defaults
  - Nova style-specific customizations (if any)
- `tailwind.config.ts` extends theme to reference CSS variables:
  - `colors.primary` (amber accent), `colors.secondary`, `colors.background` (stone), etc. mapped to `hsl(var(--primary))` pattern
  - `borderRadius` using `var(--radius)` (set to medium: 0.5rem)
  - `fontFamily` includes Figtree as default sans-serif
  - Plugin `tailwindcss-animate` added
  - darkMode: `class` strategy
- Color palette is cohesive: warm neutrals (stone) + amber highlights

### AC3: Core Component Installation
**Given** shadcn CLI is configured,
**When** I install initial core components,
**Then** the following components are added to `src/components/ui/`:
- `button.tsx` - Button component with variants (default, destructive, outline, ghost, link)
- `badge.tsx` - Badge component with variants (default, secondary, destructive, outline)
- `card.tsx` - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `input.tsx` - Input component
- `select.tsx` - Select component with Radix UI primitives
- `dialog.tsx` - Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription
- `tabs.tsx` - Tabs, TabsList, TabsTrigger, TabsContent

### AC4: Lucide Icons Integration
**Given** Lucide is the shadcn standard icon library,
**When** I install and configure Lucide icons,
**Then:**
- `lucide-react` dependency added to `packages/ui/package.json`
- Example usage documented in Dev Notes
- Icon mapping table created from previous 63 custom icons to Lucide equivalents

### AC5: Storybook Stories for shadcn Components
**Given** core shadcn components are installed,
**When** I create Storybook stories,
**Then** for each component:
- Story file created (e.g., `Button.stories.tsx`)
- All variants showcased (default, destructive, outline, ghost, link for Button)
- Theme toggle functional (dark/light mode)
- Viewport presets available (Mobile, Tablet, Desktop, Extension Popup)
- Autodocs enabled
- Example: Button story shows icon + text, loading state, disabled state

### AC6: Package Exports Updated
**Given** shadcn components are installed,
**When** I update `packages/ui/src/index.ts`,
**Then:**
- All shadcn UI components exported (Button, Badge, Card, Input, Select, Dialog, Tabs)
- `cn()` utility exported
- CSS styles exported via `./styles` entry point (already configured)
- No design-tokens imports (removed in previous cleanup)

### AC7: Multi-Surface Consumption Pattern Validated
**Given** the UI package is ready,
**When** I test consumption from extension and web apps,
**Then:**
- Extension can import: `import { Button } from '@jobswyft/ui'`
- Web can import: `import { Button } from '@jobswyft/ui'`
- Styles CSS: `import '@jobswyft/ui/styles'`
- Theme classes work: `<div className="dark">` applies dark theme
- Components render correctly with Tailwind utilities

## Tasks / Subtasks

- [ ] **Task 1: shadcn CLI Initialization with Custom Theme** (AC: #1, #2)
  - [ ] Navigate to `packages/ui/` directory
  - [ ] Run the custom preset command:
    ```bash
    pnpm dlx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=amber&iconLibrary=lucide&font=figtree&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false" --template vite
    ```
  - [ ] Verify `components.json` created with correct configuration (Vite template, stone/amber theme)
  - [ ] Verify `src/lib/utils.ts` contains `cn()` utility (clsx + tailwind-merge)
  - [ ] Verify `src/styles/globals.css` contains:
    - Figtree font-face declarations
    - Stone base color CSS variables for `:root` and `.dark`
    - Amber accent color CSS variables
  - [ ] Verify `tailwind.config.ts` includes:
    - Stone/amber color mappings via CSS variables
    - Figtree font family
    - Medium border radius (0.5rem)
    - `tailwindcss-animate` plugin
    - `darkMode: "class"`

- [ ] **Task 2: Install Core shadcn Components** (AC: #3)
  - [ ] Run `pnpm dlx shadcn@latest add button`
  - [ ] Run `pnpm dlx shadcn@latest add badge`
  - [ ] Run `pnpm dlx shadcn@latest add card`
  - [ ] Run `pnpm dlx shadcn@latest add input`
  - [ ] Run `pnpm dlx shadcn@latest add select`
  - [ ] Run `pnpm dlx shadcn@latest add dialog`
  - [ ] Run `pnpm dlx shadcn@latest add tabs`
  - [ ] Verify all components in `src/components/ui/` directory
  - [ ] Verify each component imports from correct paths (`@/lib/utils`, Radix UI primitives)

- [ ] **Task 3: Lucide Icons Setup** (AC: #4)
  - [ ] Add `lucide-react` to dependencies: `pnpm add lucide-react`
  - [ ] Create icon mapping table (63 previous icons → Lucide equivalents)
  - [ ] Document common icon patterns in Dev Notes

- [ ] **Task 4: Create Storybook Stories** (AC: #5)
  - [ ] Create `src/components/ui/Button/Button.stories.tsx` with all variants
  - [ ] Create `src/components/ui/Badge/Badge.stories.tsx` with all variants
  - [ ] Create `src/components/ui/Card/Card.stories.tsx` with composition examples
  - [ ] Create `src/components/ui/Input/Input.stories.tsx`
  - [ ] Create `src/components/ui/Select/Select.stories.tsx`
  - [ ] Create `src/components/ui/Dialog/Dialog.stories.tsx` with trigger example
  - [ ] Create `src/components/ui/Tabs/Tabs.stories.tsx` with multiple tabs
  - [ ] Verify theme toggle works in all stories
  - [ ] Verify viewport presets functional

- [ ] **Task 5: Update Package Exports** (AC: #6)
  - [ ] Update `packages/ui/src/index.ts` to export all shadcn components
  - [ ] Export `cn` utility from `src/lib/utils.ts`
  - [ ] Verify no design-tokens imports remain
  - [ ] Test exports with `pnpm build` in packages/ui/

- [ ] **Task 6: Validate Multi-Surface Consumption** (AC: #7)
  - [ ] Test import in extension: Create test file importing Button
  - [ ] Test import in web: Create test file importing Button
  - [ ] Verify dark theme class works: `<div className="dark">`
  - [ ] Run Storybook: `pnpm storybook` and manually test all components

---

## Dev Notes

### Why This Preset?

The custom preset (Nova/Stone/Amber) was generated via the shadcn UI theme builder at [ui.shadcn.com](https://ui.shadcn.com). This ensures:
- **Visual coherence**: Stone (warm neutral) + Amber (warm accent) = cohesive, professional palette
- **Modern aesthetics**: Nova style represents contemporary UI design patterns
- **Readability**: Figtree font is optimized for screen reading
- **Accessibility**: shadcn components with Radix UI primitives are WCAG 2.1 compliant out-of-the-box

### Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Run shadcn preset command in packages/ui/               │
│    → Installs theme, creates components.json, sets up utils│
├─────────────────────────────────────────────────────────────┤
│ 2. Install individual shadcn components via CLI            │
│    → Components copied to src/components/ui/ (owned code)  │
├─────────────────────────────────────────────────────────────┤
│ 3. Create Storybook stories for each component             │
│    → Document variants, test dark/light, verify styling    │
├─────────────────────────────────────────────────────────────┤
│ 4. Build library with Vite                                 │
│    → Output: dist/index.js, dist/index.css                 │
├─────────────────────────────────────────────────────────────┤
│ 5. Consume in apps (WXT extension, Next.js dashboard)      │
│    → import '@jobswyft/ui/styles'                           │
│    → import { Button } from '@jobswyft/ui'                  │
└─────────────────────────────────────────────────────────────┘
```

### Design Token Extraction Strategy

After initialization, design tokens live in two places:

1. **`src/styles/globals.css`** - CSS Custom Properties (CSS Variables)
   ```css
   :root {
     --background: 0 0% 100%;           /* Stone-based background */
     --foreground: 20 14.3% 4.1%;       /* Stone-based text */
     --primary: 38 92% 50%;             /* Amber accent */
     --primary-foreground: 48 96% 89%; /* Amber text contrast */
     --radius: 0.5rem;                  /* Medium border radius */
     /* ... all other tokens */
   }

   .dark {
     --background: 20 14.3% 4.1%;       /* Dark stone */
     --foreground: 60 9.1% 97.8%;       /* Light stone */
     --primary: 48 96% 89%;             /* Lighter amber for dark mode */
     /* ... dark mode overrides */
   }
   ```

2. **`tailwind.config.ts`** - Tailwind Theme Extension
   ```typescript
   export default {
     darkMode: ["class"],
     theme: {
       extend: {
         colors: {
           background: "hsl(var(--background))",
           foreground: "hsl(var(--foreground))",
           primary: {
             DEFAULT: "hsl(var(--primary))",
             foreground: "hsl(var(--primary-foreground))",
           },
           // ... all colors mapped to CSS variables
         },
         borderRadius: {
           lg: "var(--radius)",
           md: "calc(var(--radius) - 2px)",
           sm: "calc(var(--radius) - 4px)",
         },
         fontFamily: {
           sans: ["Figtree", "sans-serif"],
         },
       },
     },
     plugins: [require("tailwindcss-animate")],
   }
   ```

**Key Insight:** Tokens are **framework-agnostic**. CSS variables work in any environment (WXT Shadow DOM, Next.js pages). Tailwind utilities are available wherever the config is extended.

### Component Ownership Model

shadcn uses a **"copy, don't install"** philosophy:
- Components are copied into `src/components/ui/` (not npm packages)
- You own the code → customize freely
- No version conflicts or dependency hell
- Update individual components when needed via `npx shadcn@latest add <component>`

Example:
```bash
npx shadcn@latest add button
# Copies button.tsx to src/components/ui/button.tsx
# You can now edit it directly to add custom variants
```

### Lucide Icons Usage

With `lucide-react` installed, use icons like this:

```tsx
import { Sparkles, Briefcase, Calendar } from "lucide-react"

<Button>
  <Sparkles className="mr-2 h-4 w-4" />
  Generate Match
</Button>
```

**Icon Mapping (Previous 63 Icons → Lucide):**
All 63 custom icons from the abandoned design-tokens approach have direct Lucide equivalents:
- `AlertCircle`, `AlertTriangle`, `BarChart`, `Bell`, `Bookmark`, `Bot`, `Brain`, `Briefcase`, `Building`, `Calendar`, `Check`, `CheckCircle`, `CheckSquare`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `ChevronUp`, `Clock`, `Copy`, `DollarSign`, `Download`, `Edit`, `ExternalLink`, `Eye`, `EyeOff`, `File`, `FileText`, `Filter`, `Folder`, `Github`, `Heart`, `Home`, `Info`, `Link`, `Linkedin`, `Mail`, `MapPin`, `Menu`, `MessageSquare`, `Moon`, `MoreHorizontal`, `MoreVertical`, `Paperclip`, `Plus`, `RefreshCw`, `Rocket`, `Save`, `Scan`, `Search`, `Settings`, `Share`, `Sparkles`, `Star`, `Sun`, `Tag`, `Target`, `Trash`, `Upload`, `User`, `Wand`, `X`, `XCircle`, `Zap`

### Multi-Surface Consumption Pattern

**Extension (WXT with Shadow DOM):**
```tsx
// apps/extension/entrypoints/content/index.tsx
import '@jobswyft/ui/styles'  // Imports globals.css with CSS variables
import { Button } from '@jobswyft/ui'

function Sidebar() {
  return (
    <div className="dark"> {/* Dark mode via class */}
      <Button variant="default">
        <Sparkles className="mr-2 h-4 w-4" />
        Generate Cover Letter
      </Button>
    </div>
  )
}
```

**Dashboard (Next.js App Router):**
```tsx
// apps/web/src/app/layout.tsx
import '@jobswyft/ui/styles'
import type { Metadata } from 'next'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark"> {/* Dark mode via class */}
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

// apps/web/src/app/page.tsx
import { Button } from '@jobswyft/ui'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <Button>
      <Sparkles className="mr-2 h-4 w-4" />
      Get Started
    </Button>
  )
}
```

**Key Points:**
- Same import pattern for both apps
- CSS variables cascade through Shadow DOM (extension) and document (Next.js)
- Theme switching via `dark` class on root element
- Lucide icons imported separately (tree-shakeable)

### Storybook Configuration

**Theme Switcher:**
Storybook's theme decorator should toggle the `dark` class on the story root:

```tsx
// packages/ui/.storybook/preview.tsx
import '@/styles/globals.css'

export const decorators = [
  (Story, context) => {
    const theme = context.globals.theme || 'light'
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-background text-foreground p-4">
          <Story />
        </div>
      </div>
    )
  },
]

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: ['light', 'dark'],
      showName: true,
    },
  },
}
```

**Viewport Presets:**
```tsx
export const parameters = {
  viewport: {
    viewports: {
      mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
      tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
      desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      extensionPopup: { name: 'Extension Popup', styles: { width: '400px', height: '600px' } },
    },
  },
}
```

### Testing the Setup

**Manual Verification Checklist:**
1. Run `pnpm storybook` in `packages/ui/` → Storybook opens on localhost:6006
2. Toggle theme (light/dark) → colors update correctly
3. Test Button story → all variants render (default, destructive, outline, ghost, link)
4. Test Card story → composition works (CardHeader, CardContent, CardFooter)
5. Test Dialog story → modal opens/closes correctly
6. Run `pnpm build` in `packages/ui/` → dist/ folder created with index.js, index.css
7. Import Button in extension → renders with correct styling
8. Import Button in Next.js app → renders with correct styling

**Success Criteria:**
- All components render identically in Storybook, extension, and dashboard
- Dark mode works consistently across all surfaces
- No console errors or styling conflicts
- Build completes without TypeScript errors

### Next Steps After This Story

After completing shadcn setup:
1. **Story 0.2**: Build custom domain-specific components (`JobCard`, `ResumeCard`, etc.) on top of shadcn primitives
2. **Story 0.3**: Implement sidebar state model (4 states) in extension using shadcn components
3. **Epic 1+**: Implement functional requirements using the component library

### Troubleshooting

**Issue:** Font not loading
- **Solution:** Verify `@font-face` declarations in globals.css, check font files in `src/fonts/` (if local) or confirm Google Fonts CDN link

**Issue:** Dark mode not working
- **Solution:** Ensure `darkMode: ["class"]` in tailwind.config.ts, verify `className="dark"` on root element

**Issue:** CSS variables undefined
- **Solution:** Ensure `import '@jobswyft/ui/styles'` is before component imports in consuming apps

**Issue:** Tailwind utilities not applying
- **Solution:** Verify `content` paths in tailwind.config.ts include all source files: `['./src/**/*.{ts,tsx}']`

**Issue:** Storybook styles broken
- **Solution:** Verify `.storybook/preview.tsx` imports globals.css before rendering stories

---

## Summary

This story establishes the **foundation for the entire Jobswyft UI system** by:

1. **Installing shadcn/ui with a custom theme** (Nova/Stone/Amber) in `packages/ui` using Vite
2. **Setting up design tokens** via CSS variables and Tailwind config (framework-agnostic)
3. **Installing core primitives** (Button, Badge, Card, Input, Select, Dialog, Tabs)
4. **Configuring Lucide icons** (1000+ tree-shakeable icons)
5. **Creating Storybook stories** for documentation and testing
6. **Validating consumption** in both WXT extension and Next.js dashboard

**Architectural Alignment:**
- ✅ Matches Architecture document Section: "UI Package Architecture (shadcn UI-Based)"
- ✅ Uses Vite (not Next.js) per architectural decision
- ✅ Implements component ownership model (copy, don't install)
- ✅ Enables multi-surface consumption (extension + dashboard)
- ✅ Provides CSS variable-based theming for dark/light modes

**Outcome:**
A production-ready, accessible, customizable component library that both surfaces (extension and dashboard) can consume identically. All future UI work builds on this foundation.

**Next:** Story 0.2 will build domain-specific components (JobCard, ResumeCard, etc.) on top of these shadcn primitives.

