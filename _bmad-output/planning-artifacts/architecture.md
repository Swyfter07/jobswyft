---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-01-30'
lastUpdated: '2026-02-03'
inputDocuments:
  - prd.md
  - job-jet/CLAUDE.md (reference - development preferences)
  - job-jet/v3-api-contracts.md (reference - API design)
  - job-jet/v3-database-schema.md (reference - database design)
  - job-jet/docs/project-context.md (reference - implementation rules)
  - job-jet/v3-master-specification.md (reference - UI/UX spec)
  - storybook-demo/packages (reference - UI component architecture)
workflowType: 'architecture'
project_name: 'jobswyft-docs'
user_name: 'jobswyft'
date: '2026-01-30'
prototypeRepo: '/Users/enigma/Documents/Projects/job-jet/'
uiReferenceRepo: '/Users/enigma/Documents/Projects/storybook-demo/'
revisions:
  - date: '2026-02-03'
    change: 'Architectural refinement: Documented Vite vs Next.js decision for packages/ui build tooling. Vite selected for component library optimization. Added custom shadcn theme specification (Nova/Stone/Amber via ui.shadcn.com preset). Updated installation commands with exact preset URL.'
  - date: '2026-02-02'
    change: 'Added UI Package Architecture - design-tokens, shared ui library with Storybook, hybrid Tailwind + CSS Modules approach'
---

# Architecture Decision Document - Jobswyft

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Reference Materials

### New Implementation (Source of Truth)
- **PRD**: `_bmad-output/planning-artifacts/prd.md` - 884 lines, comprehensive product requirements

### Prototype Reference (For Patterns & Acceleration)
- **CLAUDE.md**: Development preferences, commands, MCP tool usage
- **v3-api-contracts.md**: API endpoint specifications (8 endpoint groups)
- **v3-database-schema.md**: Database schema (7 tables with RLS)
- **project-context.md**: AI agent implementation rules
- **v3-master-specification.md**: Complete UI/UX specification (2300 lines)

---

## Confirmed Decisions (Step 1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **AI Provider (Primary)** | Claude 3.5 Sonnet | Superior writing quality for cover letters |
| **AI Provider (Fallback)** | GPT-4o-mini | Reliability backup, cost-effective |
| **Web Dashboard** | Include in MVP | As specified in PRD - required for job tracking, billing, account management |
| **Supabase Project** | New project for Jobswyft | Fresh start, can reuse schema patterns from job-jet |
| **Development Approach** | Build from scratch iteratively | Use job-jet as reference/baseline, not copy-paste |
| **Extension Framework** | WXT | Confirmed - battle-tested in prototype |

---

## Project Context Analysis

### Requirements Summary

**Scope:** 80 Functional Requirements + 44 Non-Functional Requirements across 3 surfaces

| Surface | Technology | Responsibility |
|---------|------------|----------------|
| Chrome Extension | WXT + React + Zustand | Primary UI - scan, autofill, AI tools |
| Web Dashboard | Next.js 14+ (App Router) | Job tracking, account management, billing |
| Backend API | FastAPI (Python) | Business logic, AI orchestration, data persistence |

**Deployment Targets:**

| Surface | Platform | MVP Approach |
|---------|----------|--------------|
| Extension | Chrome Web Store | Local unpacked for MVP |
| Dashboard | Vercel | Direct deploy via Vercel CLI |
| API | Railway | Direct deploy via Railway CLI |

**Implementation Priority:** Backend API + Database → Dashboard → Extension

### Architectural Drivers (From NFRs)

| Driver | Target | Impact |
|--------|--------|--------|
| **Performance** | Scan <2s, AI <5s, autofill <1s | Optimized extraction, streaming AI responses |
| **Reliability** | 99.9% uptime, graceful degradation | AI fallback (Claude → GPT), error handling |
| **Security** | TLS 1.3, encryption at rest, RLS | Supabase RLS policies, secure token handling |
| **Scalability** | 50K → 150K MAU | Horizontal scaling, efficient queries |
| **Privacy** | GDPR/CCPA, ephemeral AI outputs | No server-side AI content storage |

### Scale & Complexity

- **Complexity Level:** Medium-High
- **Primary Domain:** Multi-Surface Product (Extension + Web + API)
- **Database Tables:** ~7 (with RLS policies)
- **API Endpoint Groups:** ~8
- **AI Operations:** 5 (Match, Cover Letter, Answer, Outreach, Resume Parse)

### Technical Constraints

| Constraint | Architectural Impact |
|------------|---------------------|
| Chrome MV3 | Ephemeral service workers → chrome.storage + Zustand persistence |
| Shadow DOM | Content script isolation → separate styling context |
| API-first | OpenAPI spec → generated TypeScript clients |
| Supabase | Auth + DB + Storage as unified provider |
| AI Abstraction | Claude primary + GPT fallback → provider interface needed |
| Monorepo | pnpm workspaces (TS) + uv (Python) |

### Cross-Cutting Concerns

1. **Authentication**: Supabase JWT shared across extension ↔ web ↔ API
2. **State Sync**: Local-first with background cloud sync (not real-time)
3. **Credit Tracking**: 5 lifetime free generations, then subscription-based
4. **Error Handling**: Consistent error responses with actionable feedback
5. **Offline Mode**: Extension features work without network (cached data)
6. **Subscription Tiers**: Feature gating based on plan (Free/Starter/Pro/Power)
7. **Logging**: Comprehensive backend logging viewable on Railway dashboard (NFR42-44)
8. **User Feedback**: In-app feedback capture for product iteration (FR78-80)

### Deferred Decisions

| Topic | Deferred To |
|-------|-------------|
| Scalability (50K→150K MAU) | Post-MVP (NFR27-29 marked Post-MVP) |
| CI/CD Pipeline | Post-MVP - using CLI direct deploy for MVP |
| Comprehensive Testing | Post-MVP - minimal testing acceptable for MVP (NFR39) |
| Chrome Web Store Publishing | Post-MVP - local unpacked for MVP |

### Explicitly NOT Included (vs Prototype)

| Feature | Reason |
|---------|--------|
| BYOK (Bring Your Own Key) | Not in PRD - subscription model only |
| Real-time WebSocket sync | No value add - background sync sufficient |

---

## Starter Template Evaluation

### Primary Technology Domain

Multi-Surface Product requiring 3 separate starters:
1. **Chrome Extension** (WXT) - Primary user interface
2. **Web Dashboard** (Next.js) - Job tracking, billing, account management
3. **Backend API** (FastAPI) - Business logic, AI orchestration, data persistence

### Monorepo Structure

```
jobswyft/
├── apps/
│   ├── extension/        # WXT Chrome extension
│   ├── web/              # Next.js dashboard
│   └── api/              # FastAPI backend
├── packages/
│   ├── design-tokens/    # Style Dictionary → CSS vars, JS, JSON
│   ├── ui/               # Shared component library with Storybook
│   └── types/            # Shared TypeScript types
├── specs/
│   └── openapi.yaml      # API contract (source of truth)
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

### Selected Starters

| App | Starter | Initialization Command |
|-----|---------|------------------------|
| Extension | WXT (React template) | `pnpm dlx wxt@latest init apps/extension --template react` |
| Web | create-next-app | `pnpm dlx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` |
| API | uv init + FastAPI | `cd apps/api && uv init --name jobswyft-api` |

### Architectural Decisions from Starters

**Language & Runtime:**
- TypeScript 5.x (extension + web) - strict mode enabled
- Python 3.11+ (api) - mypy strict mode

**Styling Solution:**
- Design Tokens (Style Dictionary) → single source of truth for all visual decisions
- Tailwind CSS 4.x configured to use design token CSS variables
- CSS Modules for complex component-specific styling (glassmorphism, animations)
- shadcn/ui primitives for interactive components (Select, Dialog, Dropdown, Tooltip)
- Custom components for domain-specific UI (JobCard, ExtensionSidebar)

**Build Tooling:**
- Vite (via WXT for extension)
- Next.js built-in (web)
- uv + uvicorn (api)

**Testing Framework:**
- Vitest + React Testing Library (extension + web)
- pytest + pytest-asyncio (api)

**Code Organization:**
- Feature-based colocation (components + tests together)
- Shared types package for API contracts
- OpenAPI spec drives TypeScript client generation

**Development Experience:**
- Hot reload on all surfaces
- pnpm workspace commands from root
- lint-staged + pre-commit hooks

### Post-Initialization Setup Required

| App/Package | Additional Setup |
|-------------|------------------|
| design-tokens | Style Dictionary config, token JSON files, build scripts |
| ui | Storybook, Tailwind (using design-tokens), shadcn/ui base, CSS Modules |
| Extension | + Zustand, + @jobswyft/ui, + @jobswyft/design-tokens, + Supabase client |
| Web | + @jobswyft/ui, + @jobswyft/design-tokens, + Supabase auth helpers, + React Query |
| API | + FastAPI routers structure, + Supabase SDK, + AI provider clients |

**Note:** Package initialization order: design-tokens → ui → apps (extension, web).

### Deployment & Tooling (MVP)

| Tool | Purpose |
|------|---------|
| **Railway CLI** | Backend API deployment - local build validation → direct push |
| **Vercel CLI** | Dashboard deployment - preview + production deploys |
| **Supabase CLI** | Database migrations, local development, type generation |
| **Supabase MCP** | AI-assisted database operations |

**MVP Deployment Workflow:**
1. Validate build locally
2. Push directly via CLI (no CI/CD pipeline for MVP)
3. Secrets managed in Railway (API) and Vercel (Dashboard) dashboards

**Logging Strategy:**
- Backend: Comprehensive structured logging (ERROR, WARN, INFO)
- Logs viewable on Railway dashboard (no streaming infrastructure for MVP)
- Key operations logged: auth, AI generation, errors

---

## UI Package Architecture (shadcn UI-Based)

**⚠️ ARCHITECTURAL PIVOT (2026-02-03):** This section was rewritten to reflect a strategic pivot from custom design tokens (Style Dictionary) to shadcn UI. Previous approach (Stories 0.1 and 0.2) was superseded. See `sprint-change-proposal-2026-02-03.md` for complete rationale.

### Design Philosophy

**shadcn/ui Foundation:** Component library built on Radix UI primitives with Tailwind CSS styling. Components are copied into the project (not npm packages), allowing full customization while maintaining accessibility and interaction patterns out-of-the-box.

**Styling Approach:**
- **shadcn/ui Components** → Tailwind CSS + CSS variables (theme-aware, accessible)
- **Tailwind Utilities** → Layout, spacing, responsive design
- **CSS Modules** → Complex custom extensions (glassmorphism, animations, gradients)
- **Lucide Icons** → Consistent icon system (shadcn standard)

### Build Tool Decision: Vite (Not Next.js)

**Decision Date:** 2026-02-03

**Context:** When setting up shadcn/ui for the `packages/ui` library, there were two templating options: Vite or Next.js.

**Decision:** Use **Vite** as the build tool and shadcn template.

**Rationale:**

| Factor | Vite | Next.js | Winner |
|--------|------|---------|--------|
| **Primary Use Case** | Component libraries | Full-stack applications | Vite |
| **Build Output** | Clean JS/CSS bundles | Server + client bundles | Vite |
| **Tooling Alignment** | Matches WXT (extension framework) | Different stack | Vite |
| **Storybook Integration** | `@storybook/react-vite` (native) | `@storybook/nextjs` (adapter needed) | Vite |
| **Build Speed** | 10-100x faster (ESM-native) | Webpack-based (slower) | Vite |
| **Framework Overhead** | Minimal (library focus) | App Router, SSR, routes | Vite |
| **shadcn Compatibility** | Library mode supported | App mode (assumes routes) | Vite |
| **Deployment** | No deployment (library) | Requires Vercel/hosting | Vite |

**What This Means:**
- `packages/ui` is built with Vite (`vite.config.ts`, `vite build`)
- shadcn initialization uses `--template vite` flag
- Apps (WXT extension, Next.js dashboard) consume the built library identically
- No Next.js-specific artifacts (routes, layouts, server components) in library code

**Custom Theme Preset:**
The shadcn setup uses a custom theme generated via [ui.shadcn.com](https://ui.shadcn.com):
- **Style**: Nova (modern design patterns)
- **Base Color**: Stone (warm neutral)
- **Theme**: Amber (warm accent)
- **Font**: Figtree (Google Font, screen-optimized)
- **Border Radius**: Medium (0.5rem)
- **Icon Library**: Lucide (1000+ tree-shakeable icons)

**Installation Command:**
```bash
cd packages/ui
pnpm dlx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=amber&iconLibrary=lucide&font=figtree&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false" --template vite
```

This creates a cohesive, production-ready theme with warm neutrals (stone) and warm accents (amber), optimized for readability and modern aesthetics.

### Package: `@jobswyft/ui`

**Purpose:** Shared component library using shadcn/ui primitives, customized for Jobswyft design system, documented in Storybook.

```
packages/ui/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── components.json          # shadcn CLI configuration
├── tailwind.config.ts       # CSS variable theming
├── postcss.config.js
├── .storybook/
│   ├── main.ts
│   └── preview.tsx          # Theme switcher, viewport presets
├── src/
│   ├── index.ts             # Public exports
│   ├── styles/
│   │   └── globals.css      # shadcn base + Tailwind + custom theme CSS
│   ├── lib/
│   │   └── utils.ts         # cn() utility from shadcn
│   ├── hooks/               # Shared UI hooks
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/              # shadcn components (installed via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── popover.tsx
│   │   │   └── sheet.tsx
│   │   └── custom/          # App-specific compositions
│   │       ├── job-card.tsx
│   │       ├── resume-card.tsx
│   │       ├── empty-state.tsx
│   │       ├── navbar.tsx
│   │       └── extension-sidebar.tsx
│   └── test/
│       └── setup.ts         # Vitest setup
└── dist/                    # Built output
    ├── index.js
    ├── index.mjs
    ├── index.d.ts
    └── styles.css
```

**Component Organization:**

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `components/ui/` | shadcn primitives (copied via CLI) | Button, Badge, Dialog, Select |
| `components/custom/` | App-specific compositions | JobCard, ResumeCard, ExtensionSidebar |
| `styles/` | Global styles, theme CSS variables | globals.css |
| `lib/` | Utility functions | cn() for class merging |

### shadcn Component Installation Pattern

**Installation via CLI:**

```bash
# Initialize shadcn with custom theme preset (one-time setup)
cd packages/ui
pnpm dlx shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=amber&iconLibrary=lucide&font=figtree&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false" --template vite

# Add individual components (after initialization)
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add tabs
```

**Component Ownership:**
- Components are **copied** into `src/components/ui/` (not npm packages)
- Full code ownership allows direct editing for project-specific needs
- No version conflicts or dependency management for UI components

**Example: shadcn Button Component**

```tsx
// src/components/ui/button.tsx (installed via shadcn CLI)
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Customization Approach:**

After installing, edit components directly for project needs:
- Modify variants in `buttonVariants` cva configuration
- Add custom variants (e.g., `gradient`, `glass`)
- Extend with additional props (e.g., `loading`, `leftIcon`)
- Apply CSS Modules for complex effects (gradients, glassmorphism)

---

### Theme Configuration

**CSS Variables (Tailwind + shadcn):**

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn semantic color system */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 244 63% 57%;        /* #6366f1 indigo */
    --primary-foreground: 0 0% 100%;
    --secondary: 262 52% 62%;      /* #8b5cf6 purple */
    --secondary-foreground: 0 0% 100%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 84.2% 60.2%;  /* #ef4444 red */
    --destructive-foreground: 0 0% 100%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 244 63% 57%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 244 63% 67%;        /* Lighter for dark mode */
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 262 52% 72%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 100%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 244 63% 67%;
  }
}

/* Custom extensions for glassmorphism, gradients */
@layer utilities {
  .glass-bg {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dark .glass-bg {
    background: rgba(255, 255, 255, 0.05);
  }

  .light .glass-bg {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
```

**Tailwind Configuration:**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

---

### Lucide Icons (shadcn Standard)

**Installation:**

```bash
pnpm add lucide-react
```

**Usage:**

```tsx
import { Sparkles, Heart, Search, Bell } from "lucide-react"

// In components
<Button>
  <Sparkles className="mr-2 h-4 w-4" />
  Generate Match
</Button>
```

**Icon Mapping from Previous Custom Icons:**

| Previous Custom Icon | Lucide Equivalent |
|---------------------|-------------------|
| Sparkles | `Sparkles` |
| Brain | `Brain` |
| Target | `Target` |
| Briefcase | `Briefcase` |
| Calendar | `Calendar` |
| Check | `Check` |
| X | `X` |
| AlertCircle | `AlertCircle` |
| ... | (63+ icons available) |

**Advantages:**
- ✅ 1000+ icons available
- ✅ Consistent stroke width (2px)
- ✅ Tree-shakeable (only bundled icons used)
- ✅ shadcn standard (documented examples)

### Custom Styling Extensions

While shadcn components provide the base styling, custom CSS modules can extend them for app-specific visual effects:

```css
/* src/components/custom/JobCard.module.css */
.glassmorphism {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pulseDetected {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

**Usage:**

```tsx
import { Card } from "@/components/ui/card"
import styles from "./JobCard.module.css"
import { cn } from "@/lib/utils"

export function JobCard({ detected }: { detected: boolean }) {
  return (
    <Card className={cn(
      styles.glassmorphism,
      detected && styles.pulseDetected
    )}>
      {/* Card content */}
    </Card>
  )
}
```

### Storybook Configuration

**Viewport Presets:**

| Viewport | Dimensions | Use Case |
|----------|------------|----------|
| Mobile | 375×667 | Mobile web |
| Tablet | 768×1024 | Tablet web |
| Desktop | 1440×900 | Desktop web |
| Extension Popup | 400×600 | Chrome popup |
| Extension Sidebar | 400×800 | Content script sidebar |

**Global Decorators:**
- Theme switcher (dark/light via `data-theme`)
- Viewport selector
- Padding wrapper

**Storybook Addons:**
- `@storybook/addon-essentials` - Controls, docs, actions
- `@storybook/addon-a11y` - Accessibility checks
- `@storybook/addon-interactions` - Component testing
- `@chromatic-com/storybook` - Visual regression (optional)

### Application State-Aware Components

Components can respond to application state via props or context:

```tsx
// JobCard with state-aware styling
interface JobCardProps {
  // ... other props
  state?: 'default' | 'detected' | 'applied' | 'error';
}

// ExtensionSidebar with context awareness
interface ExtensionSidebarProps {
  hasResumeLoaded: boolean;
  hasJobDetected: boolean;
  isOffline: boolean;
  creditBalance: number;
}
```

**State-Driven UI Patterns:**

| State | Visual Treatment |
|-------|------------------|
| Job Detected | Highlight border, pulse animation |
| Resume Loaded | Active indicator, checkmark |
| Loading | Skeleton loaders, spinners |
| Error | Red border, error icon, message |
| Offline | Muted colors, offline badge |
| Low Credits | Warning badge, upgrade CTA |
| Empty | EmptyState component with illustration |

### Package Dependencies

```json
// packages/ui/package.json
{
  "name": "@jobswyft/ui",
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/addon-links": "^8.0.0",
    "@storybook/blocks": "^8.0.0",
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "jsdom": "^23.0.1",
    "postcss": "^8.4.32",
    "storybook": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vite-plugin-dts": "^3.7.0",
    "vitest": "^1.1.0"
  }
}
```

**Note:** Radix UI dependencies are added automatically by shadcn CLI when components are installed (e.g., `@radix-ui/react-dialog` when adding Dialog component).

### Consumer Integration (Extension/Web)

**Extension Content Script:**

```tsx
// apps/extension/src/entrypoints/content/index.tsx
import '@jobswyft/ui/styles'
import { ExtensionSidebar } from '@jobswyft/ui'

function App() {
  return (
    <div className="jobswyft-extension" data-theme="dark">
      <ExtensionSidebar
        hasResumeLoaded={true}
        hasJobDetected={true}
        creditBalance={50}
        // ...
      />
    </div>
  )
}
```

**Web Application:**

```tsx
// apps/web/src/app/layout.tsx
import '@jobswyft/ui/styles'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jobswyft Dashboard',
  description: 'AI-powered job application assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

**Using UI Components:**

```tsx
// apps/web/src/app/dashboard/page.tsx
import { Button } from '@jobswyft/ui'
import { Sparkles } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <Button>
        <Sparkles className="mr-2 h-4 w-4" />
        Generate Match
      </Button>
    </div>
  )
}
```

---

## Core Architectural Decisions

### Database Schema

#### Tables Overview

| Table | Purpose | PRD Source |
|-------|---------|------------|
| `profiles` | User data, preferences, subscription | FR1-6, FR54-55 |
| `resumes` | Resume files + parsed content | FR7-13 |
| `jobs` | Saved job postings + tracking | FR45-53 |
| `usage_events` | Track each AI operation | FR54, FR56, FR60 |
| `global_config` | Tier limits, defaults, feature flags | Flexibility requirement |
| `feedback` | User feedback capture | FR78-80 |

**Note:** AI outputs are **ephemeral** (FR36, FR77) - no storage table.

#### Schema Definitions

**profiles** (1:1 with auth.users)
```sql
profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id),
  email                 TEXT NOT NULL,
  full_name             TEXT,
  subscription_tier     TEXT DEFAULT 'free',  -- free, starter, pro, power
  subscription_status   TEXT DEFAULT 'active', -- active, canceled, past_due
  active_resume_id      UUID REFERENCES resumes(id),
  preferred_ai_provider TEXT DEFAULT 'claude', -- claude, gpt
  stripe_customer_id    TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
)
```

**resumes**
```sql
resumes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,  -- Supabase storage path
  parsed_data JSONB,          -- Structured resume content
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
)
-- Max 5 resumes enforced at API level
```

**jobs**
```sql
jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  salary_range    TEXT,
  employment_type TEXT,
  source_url      TEXT,
  status          TEXT DEFAULT 'applied',  -- applied, interviewing, offered, rejected, accepted
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

**usage_events** (Flexible usage tracking)
```sql
usage_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,  -- match, cover_letter, answer, outreach, resume_parse
  ai_provider    TEXT NOT NULL,  -- claude, gpt
  credits_used   INTEGER DEFAULT 1,
  period_type    TEXT NOT NULL,  -- lifetime, daily, monthly
  period_key     TEXT NOT NULL,  -- "lifetime", "2026-01-30", "2026-01"
  created_at     TIMESTAMPTZ DEFAULT now()
)
-- Index on (user_id, period_type, period_key) for fast balance queries
```

**Usage Check Query:**
```sql
SELECT COALESCE(SUM(credits_used), 0) as used
FROM usage_events
WHERE user_id = $1
  AND period_type = $2
  AND period_key = $3
```

**global_config** (Backend-configurable settings)
```sql
global_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
)
```

Example config entries:

| Key | Value | Description |
|-----|-------|-------------|
| `tier_limits` | `{"free": {"type": "lifetime", "amount": 5}, "starter": {"type": "monthly", "amount": 100}, "pro": {"type": "monthly", "amount": 500}, "power": {"type": "monthly", "amount": 2000}}` | Credits per tier |
| `default_ai_provider` | `"claude"` | System default provider |
| `ai_fallback_enabled` | `true` | Enable fallback on failure |
| `referral_bonus_credits` | `5` | Credits awarded per referral |

**feedback**
```sql
feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  context    JSONB,  -- { "page_url": "...", "feature": "cover_letter" }
  created_at TIMESTAMPTZ DEFAULT now()
)
```

#### Entity States

| Entity | States | Notes |
|--------|--------|-------|
| Resume | Active/Inactive | Via `profiles.active_resume_id` |
| Job | applied, interviewing, offered, rejected, accepted | Status progression |
| Subscription Tier | free, starter, pro, power | Tier levels |
| Subscription Status | active, canceled, past_due | From Stripe webhooks |
| AI Provider | claude, gpt | User preference + system default |

---

### API Response Format

#### Envelope Pattern

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "CREDIT_EXHAUSTED",
    "message": "You've used all your free credits. Upgrade to continue.",
    "details": { ... }
  }
}
```

#### HTTP Status Code Mapping

| Status | When Used | Example Error Code |
|--------|-----------|-------------------|
| 200 | Success (GET, PUT, DELETE) | - |
| 201 | Created (POST) | - |
| 400 | Validation error | `VALIDATION_ERROR` |
| 401 | Not authenticated | `AUTH_REQUIRED` |
| 403 | Not authorized | `FORBIDDEN` |
| 404 | Resource not found | `RESUME_NOT_FOUND`, `JOB_NOT_FOUND` |
| 409 | Conflict | `DUPLICATE_ENTRY` |
| 422 | Business logic error | `CREDIT_EXHAUSTED`, `RESUME_LIMIT_REACHED` |
| 429 | Rate limited | `RATE_LIMITED` |
| 500 | Server error | `INTERNAL_ERROR` |
| 503 | Service unavailable | `AI_PROVIDER_UNAVAILABLE` |

#### Standardized Error Codes

| Code | HTTP | Message (example) |
|------|------|-------------------|
| `AUTH_REQUIRED` | 401 | "Authentication required" |
| `INVALID_TOKEN` | 401 | "Invalid or expired token" |
| `CREDIT_EXHAUSTED` | 422 | "You've used all your credits. Upgrade to continue." |
| `RESUME_LIMIT_REACHED` | 422 | "Maximum 5 resumes allowed. Delete one to upload more." |
| `RESUME_NOT_FOUND` | 404 | "Resume not found" |
| `JOB_NOT_FOUND` | 404 | "Job not found" |
| `SCAN_FAILED` | 422 | "Could not extract job details from this page" |
| `AI_GENERATION_FAILED` | 500 | "AI generation failed. Please try again." |
| `AI_PROVIDER_UNAVAILABLE` | 503 | "AI service temporarily unavailable" |
| `VALIDATION_ERROR` | 400 | Dynamic based on field |
| `RATE_LIMITED` | 429 | "Too many requests. Please wait." |

---

### AI Provider Architecture

| Setting | Value |
|---------|-------|
| Default Provider | Claude (configurable in `global_config`) |
| User Preference | Stored in `profiles.preferred_ai_provider` |
| User Toggle | Yes - users can switch between Claude/GPT |
| Fallback Trigger | 500 errors, timeouts |
| Fallback Enabled | Configurable in `global_config` |
| Streaming | No (MVP) |

**Resolution Order:**
1. User's `preferred_ai_provider` (if set)
2. `global_config.default_ai_provider`
3. Fallback to other provider on failure (if enabled)

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

| Layer | Convention | Example |
|-------|------------|---------|
| Database | snake_case | `user_id`, `created_at`, `subscription_tier` |
| API Endpoints | kebab-case, plural | `/v1/resumes`, `/v1/jobs/{id}` |
| API JSON | snake_case | `{ "user_id": "...", "created_at": "..." }` |
| TypeScript | camelCase | `userId`, `createdAt` |
| React Components | PascalCase | `ResumeCard`, `JobList` |
| Files (TS) | kebab-case | `resume-card.tsx`, `use-auth.ts` |
| Files (Python) | snake_case | `resume_service.py`, `ai_provider.py` |

**Cross-boundary:** API returns snake_case → TypeScript client transforms to camelCase.

### Structure Patterns

```
apps/
├── api/
│   ├── app/
│   │   ├── routers/        # FastAPI routers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Pydantic models
│   │   └── core/           # Config, deps, utils
│   └── tests/              # pytest (mirrors app/)
├── web/
│   └── src/
│       ├── app/            # Next.js App Router
│       ├── components/     # UI components
│       ├── lib/            # Utilities, API client
│       └── hooks/          # Custom hooks
└── extension/
    └── src/
        ├── entrypoints/    # WXT entry points
        ├── components/     # UI components
        ├── stores/         # Zustand stores
        ├── lib/            # Utilities, API client
        └── hooks/          # Custom hooks
```

**Tests:** Python in `tests/` folder; TypeScript co-located `*.test.ts`

### Data Format Patterns

| Pattern | Rule |
|---------|------|
| Dates | ISO 8601: `"2026-01-30T12:00:00Z"` |
| IDs | UUIDs as strings |
| Null fields | Omit from response |
| Empty arrays | Return `[]`, not `null` |
| Pagination | `{ items, total, page, page_size }` |

### State Management (Extension)

- One Zustand store per domain: `auth-store`, `resume-store`, `job-store`
- State + actions in same store
- Persist to `chrome.storage.local`

### Error Handling Patterns

| Layer | Pattern |
|-------|---------|
| API | Catch → return envelope with error code |
| Frontend | Try/catch → set error state → show message |
| Extension | Same + handle offline gracefully |

### Loading State Patterns

- Boolean flag per operation: `isLoadingResumes`, `isGeneratingCoverLetter`
- UI: Skeleton loaders for lists, spinners for actions

### AI-Assisted Development Tooling

**MCP Tools to Leverage:**

| MCP | Purpose | When to Use |
|-----|---------|-------------|
| Sequential Thinking | Break down complex problems | Planning multi-step implementations |
| Serena | Code analysis, symbol navigation, refactoring | Understanding codebase, safe edits |
| Tavily | Web search for current information | Researching solutions, debugging |
| Context7 | Latest library documentation | Getting up-to-date API docs |
| Supabase MCP | Database operations | Schema changes, queries, migrations |

**CLI Tools:**

| CLI | Purpose | When to Use |
|-----|---------|-------------|
| Supabase CLI | Migrations, local dev, type generation | Database schema changes, `supabase gen types` |
| Railway CLI | API deployment | `railway up` for backend deploys |
| Vercel CLI | Dashboard deployment | `vercel` for frontend deploys |

**Developer Instructions:**

1. Before coding: Use Serena to understand existing code structure
2. For complex logic: Use Sequential Thinking to plan approach
3. For library usage: Use Context7 to get latest docs (not outdated training data)
4. For database work: Use Supabase MCP + CLI for migrations
5. For research: Use Tavily for current solutions/debugging help
6. For deployment: Use respective CLIs (Railway, Vercel, Supabase)

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
jobswyft/
├── README.md
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .gitignore
├── .env.example
│
├── specs/
│   └── openapi.yaml                # API contract (source of truth)
│
├── packages/
│   ├── design-tokens/              # Central design system
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── build.ts            # Style Dictionary build
│   │   │   ├── generate-theme-css.ts
│   │   │   ├── index.ts
│   │   │   └── tokens/
│   │   │       ├── colors.json
│   │   │       ├── typography.json
│   │   │       ├── spacing.json
│   │   │       ├── borders.json
│   │   │       ├── shadows.json
│   │   │       ├── transitions.json
│   │   │       └── themes/
│   │   │           ├── dark.json
│   │   │           └── light.json
│   │   └── dist/
│   │       ├── tokens.css
│   │       ├── themes.css
│   │       ├── tokens.js
│   │       └── tokens.json
│   │
│   ├── ui/                         # Shared component library
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── .storybook/
│   │   │   ├── main.ts
│   │   │   └── preview.tsx
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   ├── utils/
│   │   │   │   └── cn.ts           # clsx wrapper for class merging
│   │   │   ├── hooks/
│   │   │   │   └── index.ts        # Shared UI hooks (useMediaQuery, etc.)
│   │   │   ├── providers/
│   │   │   │   └── ThemeProvider.tsx
│   │   │   ├── test/
│   │   │   │   └── setup.ts        # Vitest/RTL test setup
│   │   │   ├── atoms/
│   │   │   │   ├── Button/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Icon/
│   │   │   │   ├── Input/
│   │   │   │   ├── Select/
│   │   │   │   ├── Textarea/
│   │   │   │   ├── Typography/
│   │   │   │   ├── ProgressBar/
│   │   │   │   └── Logo/
│   │   │   ├── molecules/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Dropdown/
│   │   │   │   ├── Tooltip/
│   │   │   │   └── FormField/
│   │   │   ├── organisms/
│   │   │   │   ├── JobCard/
│   │   │   │   ├── ResumeCard/
│   │   │   │   ├── EmptyState/
│   │   │   │   ├── Navbar/
│   │   │   │   └── Tabs/
│   │   │   └── compositions/
│   │   │       ├── extension/
│   │   │       │   ├── ExtensionSidebar/
│   │   │       │   ├── ExtensionPopup/
│   │   │       │   └── FloatingActionButton/
│   │   │       └── dashboard/
│   │   │           └── DashboardLayout/
│   │   └── dist/
│   │
│   └── types/                      # Shared TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── api.ts              # Generated from OpenAPI
│           ├── models.ts
│           └── errors.ts           # Error code enums
│
├── apps/
│   ├── api/                        # FastAPI Backend
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   ├── .env.example
│   │   ├── .python-version
│   │   ├── README.md
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── deps.py
│   │   │   │   ├── security.py
│   │   │   │   └── exceptions.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── resume.py
│   │   │   │   ├── job.py
│   │   │   │   ├── usage.py
│   │   │   │   └── feedback.py
│   │   │   ├── routers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── resumes.py
│   │   │   │   ├── jobs.py
│   │   │   │   ├── ai.py
│   │   │   │   ├── usage.py
│   │   │   │   └── feedback.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth_service.py
│   │   │   │   ├── resume_service.py
│   │   │   │   ├── job_service.py
│   │   │   │   ├── usage_service.py
│   │   │   │   ├── feedback_service.py
│   │   │   │   └── ai/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── provider.py
│   │   │   │       ├── claude.py
│   │   │   │       ├── openai.py
│   │   │   │       └── prompts.py
│   │   │   └── db/
│   │   │       ├── __init__.py
│   │   │       ├── client.py
│   │   │       └── queries.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py
│   │       ├── test_auth.py
│   │       ├── test_resumes.py
│   │       ├── test_jobs.py
│   │       ├── test_ai.py
│   │       └── test_usage.py
│   │
│   ├── web/                        # Next.js Dashboard
│   │   ├── package.json            # Depends on @jobswyft/ui, @jobswyft/design-tokens
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js      # Extends from @jobswyft/ui/tailwind
│   │   ├── postcss.config.js
│   │   ├── .env.example
│   │   ├── README.md
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx      # Imports @jobswyft/ui styles + ThemeProvider
│   │       │   ├── page.tsx
│   │       │   ├── globals.css     # Minimal - imports from @jobswyft/design-tokens
│   │       │   ├── (auth)/
│   │       │   │   ├── login/page.tsx
│   │       │   │   └── callback/page.tsx
│   │       │   ├── (dashboard)/
│   │       │   │   ├── layout.tsx  # Uses DashboardLayout from @jobswyft/ui
│   │       │   │   ├── jobs/page.tsx
│   │       │   │   ├── resumes/page.tsx
│   │       │   │   ├── account/page.tsx
│   │       │   │   └── privacy/page.tsx
│   │       │   └── api/
│   │       │       └── auth/
│   │       │           └── callback/route.ts
│   │       ├── components/         # App-specific compositions only
│   │       │   └── pages/          # Page-level component compositions
│   │       │       ├── jobs-page.tsx
│   │       │       ├── resumes-page.tsx
│   │       │       └── account-page.tsx
│   │       ├── lib/
│   │       │   ├── api-client.ts
│   │       │   └── supabase.ts
│   │       └── hooks/
│   │           ├── use-auth.ts
│   │           ├── use-jobs.ts
│   │           └── use-resumes.ts
│   │
│   └── extension/                  # WXT Chrome Extension
│       ├── package.json            # Depends on @jobswyft/ui, @jobswyft/design-tokens
│       ├── tsconfig.json
│       ├── wxt.config.ts
│       ├── tailwind.config.js      # Extends from @jobswyft/ui/tailwind
│       ├── postcss.config.js
│       ├── .env.example
│       ├── README.md
│       └── src/
│           ├── entrypoints/
│           │   ├── popup/
│           │   │   ├── index.html
│           │   │   ├── main.tsx    # Imports @jobswyft/ui styles + ThemeProvider
│           │   │   └── App.tsx     # Uses ExtensionPopup from @jobswyft/ui
│           │   ├── content/
│           │   │   └── index.tsx   # Uses ExtensionSidebar from @jobswyft/ui
│           │   └── background/
│           │       └── index.ts
│           ├── features/           # Extension-specific business logic
│           │   ├── scanning/
│           │   │   ├── scanner.ts
│           │   │   └── job-detector.ts
│           │   ├── autofill/
│           │   │   └── autofill.ts
│           │   └── ai-tools/
│           │       └── ai-tool-handlers.ts
│           ├── stores/
│           │   ├── auth-store.ts
│           │   ├── resume-store.ts
│           │   ├── job-store.ts
│           │   └── scan-store.ts
│           ├── lib/
│           │   ├── api-client.ts
│           │   └── supabase.ts
│           └── hooks/
│               ├── use-auth.ts
│               ├── use-scan.ts
│               └── use-ai-generation.ts
│
└── supabase/
    ├── config.toml
    └── migrations/
        ├── 00001_create_profiles.sql
        ├── 00002_create_resumes.sql
        ├── 00003_create_jobs.sql
        ├── 00004_create_usage_events.sql
        ├── 00005_create_global_config.sql
        ├── 00006_create_feedback.sql
        └── 00007_create_rls_policies.sql
```

### Architectural Boundaries

#### API Boundaries

| Endpoint Group | Router File | Service |
|----------------|-------------|---------|
| `/v1/auth/*` | `routers/auth.py` | `auth_service.py` |
| `/v1/resumes/*` | `routers/resumes.py` | `resume_service.py` |
| `/v1/jobs/*` | `routers/jobs.py` | `job_service.py` |
| `/v1/ai/*` | `routers/ai.py` | `ai/provider.py` |
| `/v1/usage/*` | `routers/usage.py` | `usage_service.py` |
| `/v1/feedback/*` | `routers/feedback.py` | `feedback_service.py` |

#### Component Communication

```
Extension                    API                      Database
┌─────────────┐             ┌─────────────┐          ┌──────────┐
│ Zustand     │──HTTP/JSON──│ FastAPI     │──SQL────▶│ Supabase │
│ Stores      │             │ Routers     │          │ Postgres │
└─────────────┘             └─────────────┘          └──────────┘
       │                           │
       │                    ┌──────┴──────┐
       │                    │ AI Services │
       │                    └──────┬──────┘
       │                           │
       │                    ┌──────┴──────┐
       │                    │ Claude/GPT  │
       │                    └─────────────┘

Dashboard                   API
┌─────────────┐             ┌─────────────┐
│ React Query │──HTTP/JSON──│ FastAPI     │
│ + Hooks     │             │ Routers     │
└─────────────┘             └─────────────┘
```

### Requirements to Structure Mapping

#### By PRD Feature Area

| Feature | API | Web | Extension |
|---------|-----|-----|-----------|
| Auth (FR1-6) | `routers/auth.py` | `(auth)/` pages | `stores/auth-store.ts` |
| Resumes (FR7-13) | `routers/resumes.py` | `resumes/` page | `components/sidebar/resume-tray.tsx` |
| Scanning (FR14-22) | - | - | `lib/scanner.ts`, `stores/scan-store.ts` |
| AI Tools (FR23-38) | `routers/ai.py`, `services/ai/` | - | `components/ai-tools/` |
| Autofill (FR39-44) | - | - | `lib/autofill.ts` |
| Job Tracking (FR45-53) | `routers/jobs.py` | `jobs/` page | `stores/job-store.ts` |
| Usage (FR54-61) | `routers/usage.py` | `account/` page | Display in sidebar |
| Feedback (FR78-80) | `routers/feedback.py` | TBD | TBD |

#### Cross-Cutting Concerns

| Concern | Location |
|---------|----------|
| API Response Envelope | `app/models/base.py` |
| Error Codes | `app/core/exceptions.py`, `packages/types/errors.ts` |
| Auth Middleware | `app/core/security.py`, `app/core/deps.py` |
| Supabase Client | `app/db/client.py`, `*/lib/supabase.ts` |
| API Client (TS) | `packages/types/`, `*/lib/api-client.ts` |

### External Service Integration Points

| Service | Integration Point | Config Location |
|---------|-------------------|-----------------|
| Supabase Auth | `app/core/security.py` | `SUPABASE_URL`, `SUPABASE_KEY` |
| Supabase DB | `app/db/client.py` | Same as above |
| Supabase Storage | `resume_service.py` | Same as above |
| Claude API | `services/ai/claude.py` | `ANTHROPIC_API_KEY` |
| OpenAI API | `services/ai/openai.py` | `OPENAI_API_KEY` |
| Stripe | `routers/usage.py` (webhooks) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- All technology choices work together without conflicts
- WXT + React + Zustand: Standard combo, well-documented
- Next.js 14+ App Router: Current stable, Vercel-native
- FastAPI + Supabase: Python SDK available
- OpenAPI → TypeScript: Standard code generation
- Claude + GPT fallback: Provider interface supports both

**Pattern Consistency:**
- Naming conventions clearly defined (snake_case API ↔ camelCase TS)
- Response format standardized (envelope pattern + error codes)
- State management consistent (Zustand stores per domain)

**No contradictions found.**

### Requirements Coverage Validation ✅

**Functional Requirements (80 FRs):**

| FR Group | Status | Location |
|----------|--------|----------|
| Auth (FR1-6) | ✅ | `routers/auth.py`, Supabase Auth |
| Resumes (FR7-13) | ✅ | `routers/resumes.py`, Supabase Storage |
| Scanning (FR14-22) | ✅ | `extension/lib/scanner.ts` |
| AI Tools (FR23-38) | ✅ | `routers/ai.py`, `services/ai/` |
| Autofill (FR39-44) | ✅ | `extension/lib/autofill.ts` |
| Job Tracking (FR45-53) | ✅ | `routers/jobs.py`, `jobs` table |
| Usage (FR54-61) | ✅ | `routers/usage.py`, `usage_events` table |
| Sidebar (FR62-67) | ✅ | `extension/entrypoints/content/` |
| Dashboard (FR68-72) | ✅ | `web/src/app/(dashboard)/` |
| Privacy (FR73-77) | ✅ | `privacy/` page, account deletion |
| Feedback (FR78-80) | ✅ | `routers/feedback.py`, `feedback` table |

**Non-Functional Requirements (44 NFRs):**

| NFR Group | Status | Notes |
|-----------|--------|-------|
| Performance (NFR1-9) | ✅ | Architecture supports; perf is implementation |
| Security (NFR10-20) | ✅ | Supabase RLS, TLS, auth middleware |
| Reliability (NFR21-26) | ✅ | AI fallback, error handling patterns |
| Scalability (NFR27-29) | ⏸️ | Deferred to Post-MVP |
| Integration (NFR30-35) | ✅ | Chrome MV3, AI abstraction, Stripe |
| Maintainability (NFR36-44) | ✅ | Clear boundaries, logging |

### Implementation Readiness Validation ✅

| Check | Status |
|-------|--------|
| All decisions have versions | ✅ |
| Patterns comprehensive | ✅ |
| Project structure complete | ✅ |
| Integration points defined | ✅ |
| Error codes standardized | ✅ |
| MCP/CLI tooling documented | ✅ |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Clear separation of concerns (3 apps with defined boundaries)
- Flexible usage tracking via `global_config`
- AI provider abstraction for fallback
- Comprehensive naming/pattern conventions
- MCP and CLI tooling documented

**First Implementation Priority:**
1. Initialize monorepo with pnpm workspaces
2. Set up Supabase project + run migrations
3. Build FastAPI skeleton with routers
4. Deploy to Railway to validate setup

---

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-30
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document:**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation:**
- 6 database tables designed
- 11 standardized error codes
- 6 API endpoint groups
- 80 functional requirements supported
- 44 non-functional requirements addressed

**AI Agent Implementation Guide:**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards
- MCP and CLI tooling instructions

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing Jobswyft. Follow all decisions, patterns, and structures exactly as documented.

**Development Sequence:**
1. Initialize monorepo using pnpm workspaces
2. Set up Supabase project and run migrations
3. Build FastAPI skeleton with all routers
4. Deploy to Railway to validate setup
5. Build Next.js dashboard structure
6. Build WXT extension structure
7. Implement features following established patterns

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

