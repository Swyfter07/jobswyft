---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-01-30'
lastUpdated: '2026-02-07'
inputDocuments:
  - prd.md
  - ux-design-specification.md (source of truth for 2026-02-07 alignment revision)
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
  - date: '2026-02-07'
    change: 'UX-Architecture alignment: Full rewrite of affected sections to match UX Design Specification (source of truth). Updated: width 400→360px fluid, viewports, streaming AI, offline→no offline, Answer→Chat, Side Panel API, Coach tab, functional area tokens, four-state model, shell layout, button hierarchy, error escalation, accessibility, animation strategy, component inventory, state preservation matrix, credit system (daily free matches).'
  - date: '2026-02-03-r2'
    change: 'Post-implementation cleanup: Rewrote UI Package Architecture to match Story 0.1-NEW reality (Tailwind v4 OKLCH, Storybook 10, Vite 7, unified radix-ui, tw-animate-css). Removed packages/design-tokens/ (tokens live in globals.css). Removed atoms/molecules/organisms directory hierarchy (using components/ui/ + components/custom/ pattern). Removed stale HSL colors, tailwind.config.ts, Storybook 8 addons, and individual @radix-ui/* references. Updated project directory tree and all cross-references.'
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
- **UX Design Specification**: `_bmad-output/planning-artifacts/ux-design-specification.md` - 14-step comprehensive UX spec (source of truth for all UI/UX architectural decisions)

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
| **Extension Surface** | Chrome Side Panel API | Persistent panel alongside job boards; NOT content script Shadow DOM |
| **Sidebar Tabs** | 4: Scan \| AI Studio \| Autofill \| Coach | Coach is standalone — not nested in AI Studio |
| **AI Studio Sub-Tabs** | 4: Match \| Cover Letter \| Chat \| Outreach | Chat replaces Answer tab (conversational AI interface) |
| **Animation Library** | Framer Motion + CSS | Framer for state transitions + match score; CSS for micro-interactions |
| **Streaming AI** | Yes — streaming text reveal | Cover letters, outreach, coach stream progressively with cancel option |
| **Offline Mode** | None — graceful degradation | No offline features; clear "no connection" state instead |
| **Panel Width** | Fluid 360–700px | No fixed-width assumptions; 360px Chrome default, user-draggable |

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
- **AI Operations:** 5 (Match, Cover Letter, Chat, Outreach, Resume Parse)

### Technical Constraints

| Constraint | Architectural Impact |
|------------|---------------------|
| Chrome MV3 | Ephemeral service workers → chrome.storage + Zustand persistence |
| Side Panel API | Persistent panel alongside browsing; no Shadow DOM; `.dark` class on panel root |
| API-first | OpenAPI spec → generated TypeScript clients |
| Supabase | Auth + DB + Storage as unified provider |
| AI Abstraction | Claude primary + GPT fallback → provider interface needed |
| Monorepo | pnpm workspaces (TS) + uv (Python) |

### Cross-Cutting Concerns

1. **Authentication**: Supabase JWT shared across extension ↔ web ↔ API
2. **Four-State Progressive Model**: Logged Out → Non-Job Page → Job Detected → Full Power — side panel auto-adjusts to context
3. **Credit Tracking**: Hybrid model — 20 daily free match analyses + 5 lifetime AI credits (generative content), then subscription-based
4. **Error Handling**: Three-tier escalation — Inline Retry → Section Degraded → Full Re-Auth
5. **No Offline Mode**: Graceful degradation with clear "no connection" state; all AI features require API calls
6. **Subscription Tiers**: Feature gating based on plan (Free/Starter/Pro/Power)
7. **Streaming AI Responses**: Cover letters, outreach, coach chat stream progressively with cancel option
8. **State Preservation**: Detailed rules per event (tab switch, job URL change, manual reset, re-login) — see State Preservation Matrix
9. **Logging**: Comprehensive backend logging viewable on Railway dashboard (NFR42-44)
10. **User Feedback**: In-app feedback capture for product iteration (FR78-80)
11. **Accessibility**: WCAG 2.1 AA compliance, semantic HTML, ARIA patterns, reduced motion support

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
| WebSocket real-time sync | No value add - SSE for streaming AI, background sync for data |
| Offline mode | No offline features; graceful degradation with "no connection" state |
| Content script Shadow DOM sidebar | Using Chrome Side Panel API instead (persistent, no DOM conflicts) |

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
│   ├── ui/               # Shared component library (shadcn/ui + Storybook)
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
- Tailwind CSS 4.x with CSS-first configuration (no `tailwind.config.ts`)
- CSS variables in OKLCH color space defined in `globals.css` (single source of truth)
- `@theme inline` directive maps CSS variables to Tailwind utilities
- shadcn/ui primitives for interactive components (Select, Dialog, Dropdown, Tooltip)
- CSS Modules for complex custom effects (glassmorphism, animations) when needed
- Custom composed components for domain-specific UI (JobCard, ExtensionSidebar)

**Build Tooling:**
- Vite 7.x (packages/ui library build + WXT extension)
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
| ui | ✅ Done (Story 0.1-NEW): shadcn/ui, Tailwind v4, Storybook 10, Vite 7 |
| Extension | + Zustand, + @jobswyft/ui, + Supabase client |
| Web | + @jobswyft/ui, + Supabase auth helpers, + React Query |
| API | + FastAPI routers structure, + Supabase SDK, + AI provider clients |

**Note:** Package initialization order: ui → apps (extension, web).

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

## UI Package Architecture (shadcn/ui + Tailwind v4)

**Implemented:** Story 0.1-NEW (2026-02-03). This section reflects the actual production setup. Previous references to Style Dictionary, `packages/design-tokens/`, HSL color format, `tailwind.config.ts`, and Storybook 8.x are superseded.

### Design Philosophy

**shadcn/ui Foundation:** Component library built on Radix UI primitives with Tailwind CSS styling. Components are copied into the project (not npm packages), allowing full customization while maintaining accessibility and interaction patterns out-of-the-box.

**Styling Approach:**
- **Tailwind v4 CSS-first** — No `tailwind.config.ts`; all theming via `@theme inline` in `globals.css`
- **OKLCH color space** — Perceptually uniform, modern CSS color format
- **CSS Variables** — Framework-agnostic tokens in `globals.css` (works in WXT Side Panel, Next.js, Storybook)
- **Dark mode** — `@custom-variant dark (&:is(.dark *))` + `.dark` class on root element
- **Lucide Icons** — 1000+ tree-shakeable icons (shadcn standard)
- **CSS Modules** — Only for complex custom effects (glassmorphism, animations) when Tailwind utilities aren't sufficient

### Verified Technology Stack

| Package | Version | Notes |
|---------|---------|-------|
| `tailwindcss` | 4.1.18 | CSS-first config, OKLCH, `@tailwindcss/vite` plugin |
| `vite` | 7.3.1 | Library build mode, ESM output |
| `storybook` | 10.x | Addons consolidated into core, ESM-only |
| `@storybook/react-vite` | 10.x | Native Vite integration |
| `shadcn` | 3.8.2 | CLI tool, generates v4-compatible output |
| `radix-ui` | 1.4.3 | Unified package (not individual `@radix-ui/*`) |
| `lucide-react` | 0.562.0 | Icon library |
| `class-variance-authority` | latest | Component variant management (CVA) |
| `tw-animate-css` | latest | Animation utilities (replaces `tailwindcss-animate`) |
| `@fontsource-variable/figtree` | latest | Self-hosted variable font |
| React | ^18 \|\| ^19 | Peer dependency |

### Build Tool Decision: Vite (Not Next.js)

**Decision:** Use **Vite 7.x** as the build tool for `packages/ui`.

**Rationale:** `packages/ui` is a component library, not an application. Vite produces clean JS/CSS bundles, matches WXT's tooling, integrates natively with Storybook via `@storybook/react-vite`, and avoids Next.js overhead (App Router, SSR, server components) that is irrelevant for a library package. shadcn's Vite template is purpose-built for this use case.

**Custom Theme Preset:**
The shadcn setup uses a custom theme generated via [ui.shadcn.com](https://ui.shadcn.com):
- **Style**: Nova (modern design patterns)
- **Base Color**: Stone (warm neutral)
- **Theme**: Amber (warm accent)
- **Font**: Figtree (Google Font, screen-optimized, variable weight)
- **Border Radius**: Medium (0.625rem)
- **Icon Library**: Lucide

**Initialization Command (already executed):**
```bash
cd packages/ui
pnpm dlx shadcn@latest init "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=amber&iconLibrary=lucide&font=figtree&menuAccent=bold&menuColor=default&radius=medium&template=vite&rtl=false" --template vite --force --yes
```

### Package: `@jobswyft/ui`

**Purpose:** Shared component library using shadcn/ui primitives, customized for Jobswyft, documented in Storybook.

```
packages/ui/
├── package.json
├── tsconfig.json
├── vite.config.ts              # Library build, @tailwindcss/vite plugin
├── components.json             # shadcn CLI configuration (radix-nova style)
├── .storybook/
│   ├── main.ts
│   └── preview.tsx             # Theme switcher, viewport presets
├── src/
│   ├── index.ts                # Public exports (all components + cn utility)
│   ├── styles/
│   │   └── globals.css         # ALL design tokens (OKLCH), @theme inline, base styles
│   ├── lib/
│   │   ├── utils.ts            # cn() utility (clsx + tailwind-merge)
│   │   └── utils.test.ts       # Unit tests
│   ├── hooks/                  # Shared UI hooks (future)
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (installed via CLI)
│   │   │   ├── button.tsx      # + button.stories.tsx
│   │   │   ├── badge.tsx       # + badge.stories.tsx
│   │   │   ├── card.tsx        # + card.stories.tsx
│   │   │   ├── input.tsx       # + input.stories.tsx
│   │   │   ├── select.tsx      # + select.stories.tsx
│   │   │   ├── dialog.tsx      # + dialog.stories.tsx
│   │   │   └── tabs.tsx        # + tabs.stories.tsx
│   │   └── custom/             # Domain-specific compositions (built on ui/)
│   │       ├── job-card.tsx
│   │       ├── resume-card.tsx
│   │       ├── app-header.tsx
│   │       ├── credit-bar.tsx
│   │       ├── logged-out-view.tsx
│   │       ├── ai-studio.tsx
│   │       ├── autofill.tsx
│   │       ├── coach.tsx
│   │       ├── animated-match-score.tsx  # dynamic import (framer-motion)
│   │       ├── sequential-autofill.tsx
│   │       ├── card-accent-footer.tsx
│   │       ├── state-transition.tsx
│   │       ├── icon-badge.tsx
│   │       ├── skill-pill.tsx
│   │       ├── skill-section-label.tsx
│   │       ├── match-indicator.tsx
│   │       └── extension-sidebar.tsx     # shell layout + state views
└── dist/                       # Built output (ESM, ~20KB, deps externalized)
    ├── index.js
    ├── index.d.ts
    └── components/ui/*.d.ts
```

**No separate `tailwind.config.ts` file** — Tailwind v4 reads all config from `globals.css`.

### Component Organization

| Directory | Purpose | Source | Examples |
|-----------|---------|--------|----------|
| `components/ui/` | shadcn primitives (never modify) | Installed via `shadcn add` CLI | Button, Badge, Card, Input, Textarea, Tabs, Dialog, Select, Separator, ScrollArea, Progress, Accordion, DropdownMenu, Avatar, Tooltip, Collapsible |
| `components/custom/` | Domain compositions + shared primitives | Hand-built using `ui/` primitives | See Component Inventory below |
| `styles/` | Design tokens + base styles | `globals.css` is the single source of truth | OKLCH tokens, `@theme inline`, font config, `.btn-gradient-depth-*` utilities |
| `lib/` | Utility functions | `cn()` from shadcn | Class merging (clsx + tailwind-merge) |

**Adding shadcn components:**
```bash
cd packages/ui
pnpm dlx shadcn@latest add <component-name>
# Example: pnpm dlx shadcn@latest add tooltip dropdown-menu popover sheet collapsible
```

Components are **copied** into `src/components/ui/` — you own the code and can customize freely.

### Component Inventory

**Composition Components (structural patterns):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `<CardAccentFooter>` | `className?` | Two-tone card accent zone: `bg-primary/5 border-t px-4 py-3` |
| `<AnimatedMatchScore>` | `score: number`, `size?: 'sm' \| 'md'` | SVG radial ring + framer-motion count-up. **Dynamic import** (framer-motion ~30 kB gzip). |
| `<SequentialAutofill>` | `fields: Field[]`, `onComplete?` | Staggered field animation wrapper (600ms/field) |
| `<StateTransition>` | `state: SidebarState`, `children` | AnimatePresence wrapper with slide animation (`x: 20 → 0`, opacity fade, 200ms ease-out) |

**Feature Components:**

| Component | States | Key Props |
|-----------|--------|-----------|
| **JobCard** | default, editing, scanning (skeleton) | `job: JobData`, `match?: MatchData`, `isEditing?`, `onAnalyze?` |
| **AIStudio** | locked, unlocked, generating, generated | `match: MatchData`, `credits: number`, `activeTab?` |
| **Autofill** | idle, running, completed, error | `fields: Field[]`, `onFill?`, `onReset?` |
| **Coach** | empty, active, generating | `messages: Message[]`, `onSend?`, `jobContext?: JobData` |
| **CreditBar** | normal, warning (≤1), exhausted (0) | `used: number`, `total: number`, `renewsIn?: string` |
| **LoggedOutView** | default, loading, error | `onSignIn?`, `isLoading?`, `error?: string` |
| **ResumeCard** | collapsed, expanded | `resume: ResumeData`, `isActive?`, `onSelect?` |
| **AppHeader** | authenticated, with-reset | `user?: User`, `onReset?`, `onSettings?` |

**Shared Primitives (existing, keep):**

| Component | Variants | Purpose |
|-----------|----------|---------|
| `<IconBadge>` | 6 variants × 3 sizes | Consistent icon presentation |
| `<SkillPill>` | matched, missing | Skill badge with semantic colors |
| `<SkillSectionLabel>` | success, warning | Section label with dot indicator |
| `<MatchIndicator>` | score-based coloring | Static score display (non-animated fallback) |

**Composed State Views:**

| Component | Contains | Purpose |
|-----------|----------|---------|
| `<ExtensionSidebar>` | AppHeader + Tabs + CreditBar | Full sidebar shell with shell layout contract |
| `<StateLoggedOut>` | LoggedOutView | Feature showcase + Google sign-in CTA |
| `<StateAuthenticated>` | ResumeCard + empty state | Authenticated, no job detected |
| `<StateJobDetected>` | JobCard + locked AIStudio preview | Job scanned, AI locked |
| `<StateFullPower>` | JobCard + AIStudio + Autofill + Coach | Full feature access |

### Theme Configuration (globals.css)

Design tokens are defined entirely in CSS using Tailwind v4's CSS-first configuration. **`globals.css` is the single source of truth for all visual design decisions.** No separate design-tokens package exists.

**Architecture:**

```
globals.css
├── @import "tailwindcss"                  # Tailwind v4 base
├── @import "tw-animate-css"               # Animation utilities
├── @import "shadcn/tailwind.css"          # shadcn base styles
├── @import "@fontsource-variable/figtree" # Self-hosted font
├── @custom-variant dark (...)             # Dark mode strategy
├── :root { ... }                          # Light theme tokens (OKLCH)
├── .dark { ... }                          # Dark theme tokens (OKLCH)
├── @theme inline { ... }                  # Maps CSS vars → Tailwind utilities
└── @layer base { ... }                    # Global base styles
```

**Token Categories (CSS Variables):**

| Category | Variables | Example |
|----------|-----------|---------|
| **Core colors** | `--background`, `--foreground`, `--primary`, `--secondary` | `oklch(0.67 0.16 58)` (amber) |
| **UI colors** | `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring` | Semantic purpose |
| **Surface colors** | `--card`, `--popover`, `--sidebar` | Each with `-foreground` pair |
| **Chart colors** | `--chart-1` through `--chart-5` | Amber scale |
| **Radius** | `--radius` (base: 0.625rem) | Calculated: sm, md, lg, xl, 2xl, 3xl, 4xl |
| **Font** | `--font-sans` | `'Figtree Variable', sans-serif` |

**Functional Area Tokens (to be added per UX Design Specification):**

Each of the 4 sidebar feature areas has its own color identity via semantic CSS variables (3 tokens per area × 2 modes = 24 CSS vars):

```css
/* ─── Functional Area: Scan (blue ~245) ─── */
--scan-accent: oklch(...);
--scan-accent-foreground: oklch(...);
--scan-accent-muted: oklch(...);

/* ─── Functional Area: Studio (aliases --ai-accent) ─── */
--studio-accent: var(--ai-accent);
--studio-accent-foreground: var(--ai-accent-foreground);
--studio-accent-muted: oklch(...);  /* violet ~293 */

/* ─── Functional Area: Autofill (green ~155) ─── */
--autofill-accent: oklch(...);
--autofill-accent-foreground: oklch(...);
--autofill-accent-muted: oklch(...);

/* ─── Functional Area: Coach (aliases --primary) ─── */
--coach-accent: var(--primary);
--coach-accent-foreground: var(--primary-foreground);
--coach-accent-muted: oklch(...);  /* orange ~58 */
```

**`@theme inline` additions** (grouped with comment blocks):
```css
@theme inline {
  /* ─── Functional Areas ─── */
  --color-scan-accent: var(--scan-accent);
  --color-scan-accent-foreground: var(--scan-accent-foreground);
  --color-scan-accent-muted: var(--scan-accent-muted);
  --color-studio-accent: var(--studio-accent);
  --color-studio-accent-foreground: var(--studio-accent-foreground);
  --color-studio-accent-muted: var(--studio-accent-muted);
  --color-autofill-accent: var(--autofill-accent);
  --color-autofill-accent-foreground: var(--autofill-accent-foreground);
  --color-autofill-accent-muted: var(--autofill-accent-muted);
  --color-coach-accent: var(--coach-accent);
  --color-coach-accent-foreground: var(--coach-accent-foreground);
  --color-coach-accent-muted: var(--coach-accent-muted);
}
```

Use `var()` references for aliased tokens (studio → ai-accent, coach → primary) — single source of truth. If `--ai-accent` changes, `--studio-accent` follows automatically.

**CSS Utility Classes (globals.css):**

| Class | Purpose |
|-------|---------|
| `.btn-gradient-depth-scan` | Blue gradient CTA + glass edge (`border-t border-white/20`) + blue shadow glow on hover |
| `.btn-gradient-depth-studio` | Violet gradient CTA + glass edge + violet shadow glow |
| `.btn-gradient-depth-autofill` | Green gradient CTA + glass edge + green shadow glow |
| `.btn-gradient-depth-coach` | Orange gradient CTA + glass edge + orange shadow glow |
| `.text-micro` | 10px text (exists) |
| `.scrollbar-hidden` | Hide scrollbar (exists) |
| `.scroll-fade-y` | Scroll edge shadows (exists) |
| `.animate-tab-content` | Tab slide-in (exists) |

**Key Insight:** Tokens are **framework-agnostic**. CSS variables work in any environment — WXT Side Panel, Next.js pages, Storybook. The `@theme inline` block maps these variables to Tailwind's utility class system without needing a JS config file.

**Dark Mode:** Applied via `.dark` class on root element. Each CSS variable has a corresponding dark override. Components automatically adapt through Tailwind's `dark:` variant (compiled from `@custom-variant dark`).

### Application State Architecture

#### Four-State Progressive Model

The side panel operates in one of four states, determined by authentication and page context:

| State | Trigger | What's Visible | What's Available |
|-------|---------|---------------|-----------------|
| **Logged Out** | No auth session | `<LoggedOutView>` — feature showcase + Google CTA | Nothing — sign-in required |
| **Non-Job Page** | Authenticated, non-job URL | Resume management + "Waiting for Job Detection" empty state | Resume upload/switch, settings |
| **Job Detected** | Authenticated, job URL auto-scanned | JobCard + match score + locked AI Studio preview | Scan results, free match analysis |
| **Full Power** | Job detected + credits available | All tabs: Scan, AI Studio, Autofill, Coach | All features including AI generation |

State transitions use `<StateTransition>` (AnimatePresence wrapper) with slide animation (`x: 20 → 0`, opacity fade, 200ms ease-out).

#### Component State via Props

Components handle application-level states through **props**, not a shared state architecture. shadcn + Radix manages component-level states (hover, focus, disabled, open/closed) and theme states (dark/light) automatically.

| Application State | Visual Treatment | Handled By |
|-------------------|------------------|------------|
| Job Detected | Job card slides in (AnimatePresence), match score animates | `JobCard` + `AnimatedMatchScore` props |
| Resume Loaded | Active indicator, checkmark | `ResumeCard` prop |
| Loading | Skeleton shimmer (never generic spinners) | Skeleton composition or purposeful animation |
| Error | Inline error with retry action (never modal) | Component prop, three-tier escalation |
| No Connection | Clear "no connection" state | Inline error |
| Low Credits | Warning color in CreditBar | `CreditBar` prop |
| Credits Exhausted | Upgrade CTA, free features still work | `CreditBar` + `AIStudio` lock state |
| Empty | Dashed border + pulsing icon + descriptive text | Conditional rendering |

Both WXT and Next.js consume these identically — `import { JobCard } from '@jobswyft/ui'`. The consuming app determines the state and passes it as props.

#### State Preservation Matrix

| State Category | Tab Switch | Job URL Change | Manual Reset | Re-Login |
|---------------|------------|---------------|-------------|----------|
| Job data | persist | **reset** | **reset** | persist |
| Match data | persist | **reset** | **reset** | persist |
| AI Studio outputs | persist | persist* | **reset** | **reset** |
| Chat messages | persist | **reset** | **reset** | **reset** |
| Resume selection | persist | persist | persist | persist |
| Auth session | persist | persist | persist | **reset** |
| Credits balance | persist | persist | persist | persist |
| Settings | persist | persist | persist | persist |

*AI Studio retains outputs on job URL change until user clicks "Dive Deeper" on the new job (explicit re-generation)

**Reset Patterns:**
- Small reset button in AppHeader (ghost button, refresh icon `size-4`)
- Resets: job data, match data, AI Studio outputs, chat messages
- Preserves: resume, auth, credits, settings
- No confirmation dialog for reset (low-stakes, easily re-scanned)

### Lucide Icons

```bash
# Already installed: lucide-react@0.562.0
```

```tsx
import { Sparkles, Briefcase, Calendar } from "lucide-react"

<Button>
  <Sparkles className="mr-2 h-4 w-4" />
  Generate Match
</Button>
```

All 63 icons from the original design have direct Lucide equivalents. Icons are tree-shakeable — only used icons are bundled.

### Storybook Configuration (v10)

Storybook 10 consolidates addons into core — no separate `@storybook/addon-essentials` needed.

**Theme Switching:** Toolbar toggle applies `.dark` class on story root container.

**Viewport Presets:**

| Viewport | Dimensions | Use Case |
|----------|------------|----------|
| Extension Default | 360×600 | Chrome side panel default width — primary design target |
| Extension Wide | 500×600 | Users who drag the panel wider |
| Mobile | 375×667 | Future web app reference |
| Tablet | 768×1024 | Future web app reference |

**Autodocs:** Enabled via `tags: ['autodocs']` in preview config.

### Consumer Integration (Extension/Web)

Both apps use the same import pattern:

```tsx
// 1. Import styles (once, in root layout/entry)
import '@jobswyft/ui/styles'

// 2. Import components
import { Button, Card, Badge } from '@jobswyft/ui'

// 3. Import icons separately (tree-shakeable)
import { Sparkles } from 'lucide-react'

// 4. Dark mode via class on root element
<html className="dark">        {/* Next.js */}
<div className="dark">          {/* WXT Side Panel */}
```

**Package exports:**
```json
{
  ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
  "./styles": "./src/styles/globals.css"
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
  operation_type TEXT NOT NULL,  -- match, cover_letter, chat, outreach, resume_parse
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
| `tier_limits` | `{"free": {"type": "lifetime", "amount": 5}, "starter": {"type": "monthly", "amount": 100}, "pro": {"type": "monthly", "amount": 500}, "power": {"type": "monthly", "amount": 2000}}` | AI generation credits per tier |
| `daily_match_limit` | `{"free": 20, "starter": 100, "pro": 500, "power": 2000}` | Free daily match analyses per tier (not deducted from AI credits) |
| `default_ai_provider` | `"claude"` | System default provider |
| `ai_fallback_enabled` | `true` | Enable fallback on failure |
| `referral_bonus_credits` | `5` | Credits awarded per referral |

**Credit System (Hybrid Model):**

| Resource | Type | Free Tier | Paid Tiers |
|----------|------|-----------|-----------|
| **Match analysis** | Daily allocation (resets daily) | 20/day | Scales with tier |
| **AI generation** (cover letters, outreach, chat) | Lifetime (free) / Monthly (paid) | 5 lifetime | 100-2000/month |

Match analyses are tracked separately from AI credits. The `usage_events.operation_type` distinguishes between `match` (daily allocation) and generative operations (`cover_letter`, `outreach`, `chat`) which consume AI credits.

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
| Streaming | Yes — SSE for generative endpoints |

**Resolution Order:**
1. User's `preferred_ai_provider` (if set)
2. `global_config.default_ai_provider`
3. Fallback to other provider on failure (if enabled)

**Streaming Architecture:**

AI generation endpoints (`cover_letter`, `outreach`, `chat`) use Server-Sent Events (SSE) to stream responses progressively:

| Endpoint | Streaming | Response Type |
|----------|-----------|---------------|
| `/v1/ai/match` | No — returns complete JSON | `application/json` |
| `/v1/ai/cover-letter` | Yes — streams text chunks | `text/event-stream` |
| `/v1/ai/outreach` | Yes — streams text chunks | `text/event-stream` |
| `/v1/ai/chat` | Yes — streams text chunks | `text/event-stream` |
| `/v1/ai/resume-parse` | No — returns complete JSON | `application/json` |

**SSE Protocol:**
```
event: chunk
data: {"text": "Dear Hiring Manager,\n\n"}

event: chunk
data: {"text": "I am writing to express..."}

event: done
data: {"credits_remaining": 4}

event: error
data: {"code": "AI_GENERATION_FAILED", "message": "..."}
```

**Frontend Integration:**
- `EventSource` or `fetch` with `ReadableStream` for SSE consumption
- Cursor/caret blink at insertion point while streaming
- "Stop generating" cancel button available throughout
- On `prefers-reduced-motion`: show final text immediately (no progressive reveal)

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

**Three-Tier Error Escalation:**

| Tier | Scope | Trigger | UX Response |
|------|-------|---------|-------------|
| **Tier 1: Inline Retry** | Single action | API timeout, network blip | Inline error message + "Retry" button adjacent to error |
| **Tier 2: Section Degraded** | Dependent features | Match analysis fails → AI Studio can't unlock | Affected section shows "Analysis unavailable — retry match first" with link back to Scan tab |
| **Tier 3: Full Re-Auth** | Session-wide | Token expired, auth revoked | Slide transition to LoggedOutView with "Session expired — sign in again" |

**Error Format:** `<p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{message}</p>`

| Layer | Pattern |
|-------|---------|
| API | Catch → return envelope with error code (+ SSE `event: error` for streaming) |
| Frontend | Try/catch → set error state → inline message with retry action. **Never modal.** |
| Extension | Same + "Check your connection and try again" for network errors |

**Rules:**
- Never auto-retry — always require explicit user action
- Errors are inline, actionable, and honest — never dead ends
- Every error state has a next action ("Could not scan" → "Paste description")

### Loading State Patterns

**Never use generic spinners.** All loading states have purposeful visual feedback:

| Duration | Pattern | Example |
|----------|---------|---------|
| < 500ms | No indicator (perceived instant) | Tab switch, section expand |
| 500ms–2s | Skeleton shimmer (shadcn `<Skeleton>` composition) | Job scan, initial data load |
| 2s–10s | Animated progress (SVG ring fill, sequential autofill) | Match analysis, autofill run |
| > 10s | Streaming text reveal (word-by-word) + "Stop generating" cancel | Cover letter, outreach, coach |

**Skeleton Rules:**
- Use shadcn `<Skeleton>` via composition: `<Skeleton className="h-4 w-3/4 rounded" />`
- Compose skeletons to match loaded component layout shape — do NOT create separate `*Skeleton` components
- Apply `animate-pulse` (respects `prefers-reduced-motion` → static gray, no animation)
- Never show skeleton + real content simultaneously — hard cut transition

**Button Loading State:** `<Loader2 className="mr-2 size-4 animate-spin" />` replaces icon, text changes to gerund ("Signing in...", "Analyzing...")

### Button Hierarchy

**Three-Tier System:**

| Tier | shadcn Variant | When | Visual |
|------|---------------|------|--------|
| **Primary** | `default` | One per view — the #1 next action | Solid `bg-primary`, white text, `shadow-md` |
| **Secondary** | `outline` | Supporting actions (Edit, Reset, Cancel) | Border only, foreground text |
| **Ghost** | `ghost` | Tertiary / inline actions (settings gear, close X) | No border/bg, hover reveals bg |

**Functional Area CTA Buttons:**

| Action | Class | When |
|--------|-------|------|
| Dive Deeper / AI actions | `bg-ai-accent text-ai-accent-foreground` | AI Studio, generative actions |
| Autofill | `btn-gradient-depth-autofill` | Start autofill, apply fields |
| Coach send | `btn-gradient-depth-coach` | Send to coach, open coaching |
| Destructive | `variant="destructive"` | Delete resume, clear all |

**Button Pair Ordering:**
- **Constructive pairs:** Primary left, Secondary right (e.g., "Analyze Job" | "Cancel")
- **Destructive pairs:** Cancel left, Destructive right (e.g., "Keep" | "Delete Resume")

**Rules:**
- Maximum 1 primary button per visible section
- Full-width (`w-full`) for CTAs inside cards
- Icon + label: icon `size-4` with `mr-2`, always left of text
- Disabled state: `opacity-50 cursor-not-allowed` (shadcn default)

### Extension Shell Layout Contract

The sidebar shell layout is defined once in `<ExtensionSidebar>` and never reinvented:

```
<aside className="flex flex-col h-full">       /* sidebar shell */
  <header><AppHeader className="shrink-0" /></header>  /* fixed top */
  <nav><TabBar className="shrink-0" /></nav>           /* fixed below header */
  <main className="flex-1 overflow-y-auto              /* scrollable content */
    scrollbar-hidden scroll-fade-y">
    {children}
  </main>
  <footer><CreditBar className="shrink-0" /></footer>  /* fixed bottom */
</aside>
```

- All composed views (`StateLoggedOut`, `StateJobDetected`, etc.) render inside the `flex-1` scroll region
- Header, tab bar, and credit bar NEVER scroll — they are `shrink-0` fixed regions
- Semantic HTML: `aside > header + nav + main + footer`
- Tab content: preserves state within a session (switching Scan → Coach → Scan doesn't re-scan)

**Tab Structure:**

| Level | Tabs | Component |
|-------|------|-----------|
| Main sidebar | Scan \| AI Studio \| Autofill \| Coach | shadcn `<Tabs>` |
| AI Studio sub-tabs | Match \| Cover Letter \| Chat \| Outreach | Nested shadcn `<Tabs>` |

Active tab indicator uses functional area accent color. Tab switch animation: `animate-tab-content` (slideInFromRight 200ms ease-out).

### Animation Strategy

**Dependency:** `framer-motion` (~30 kB gzip) — **dynamic import** via `<AnimatedMatchScore>` since it only renders in job-detected state.

**Boundary Rules:**

| Technology | Use For | Never For |
|-----------|---------|-----------|
| **Framer Motion** | State transitions (AnimatePresence), match score animation (motion.circle), count-up numbers, orchestrated multi-element sequences | Hover/focus states |
| **CSS animations** | Hover/focus states, tab content transitions, button glow effects, loading skeletons, single-element micro-interactions | N/A — CSS can be used for anything simple |

**Reduced Motion Support:**

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration: 0s;
    --motion-enabled: 0;
  }
  .animate-tab-content { animation: none; }
}
```

- `tw-animate-css` handles its own animations automatically
- Custom keyframes need explicit `animation: none`
- Framer Motion components read `--motion-enabled` or `useReducedMotion()` hook to skip orchestrated transitions
- Streaming text: shows full text immediately instead of word-by-word reveal

### Accessibility (WCAG 2.1 AA)

**Color & Contrast:**
- All text: 4.5:1 contrast ratio against background (OKLCH tokens tuned)
- UI components: 3:1 contrast ratio (borders, icons as sole indicators)
- Color never the sole indicator — always paired with text, icons, or numeric values
- Dark mode tokens independently verified

**Keyboard Navigation:**
- All interactive elements reachable via Tab key
- Tab bar: Arrow keys for tab switching (Radix Tabs built-in)
- Escape: close edit mode, dismiss overlays, cancel generation
- Enter: submit forms, activate buttons
- Focus ring: `outline-ring/50` (globals.css base layer)

**Screen Reader Support:**
- Semantic HTML: `<aside>`, `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`
- ARIA labels on icon-only buttons: `aria-label="Reset job data"`, `aria-label="Settings"`
- Live regions: `aria-live="polite"` on match score updates, error messages, autofill progress
- Match score: `role="img" aria-label="Match score: {n} percent"`
- Error messages: `role="alert"` (auto-announced)
- Loading states: `aria-busy="true"` on container

**ARIA Patterns by Component:**

| Component | ARIA Pattern |
|-----------|-------------|
| Tab bar | Radix handles `tablist/tab/tabpanel` automatically |
| Match score | `role="img" aria-label="Match score: {n} percent"` |
| Edit toggle | `aria-label="Edit job details"` / `aria-label="Cancel editing"` |
| Reset button | `aria-label="Reset job data"` |
| Credit bar | `aria-label="AI credits: {used} of {total} used"` |
| Error messages | `role="alert"` |

**Development Rules:**
1. Every icon-only button gets `aria-label` — no exceptions
2. Every dynamic content update gets `aria-live="polite"` or `role="alert"`
3. Never use `div`/`span` for interactive elements — use `button`, `a`, or Radix primitives
4. Never suppress focus outlines without visible alternative
5. Test with keyboard before marking any component story as complete

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
│   ├── ui/                         # Shared component library (shadcn/ui + Tailwind v4)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts          # Library build + @tailwindcss/vite plugin
│   │   ├── components.json         # shadcn CLI config (radix-nova, stone/amber)
│   │   ├── .storybook/
│   │   │   ├── main.ts
│   │   │   └── preview.tsx         # Theme switcher, viewport presets
│   │   ├── src/
│   │   │   ├── index.ts            # Public exports (components + cn utility)
│   │   │   ├── styles/
│   │   │   │   └── globals.css     # ALL design tokens (OKLCH), @theme inline, base
│   │   │   ├── lib/
│   │   │   │   ├── utils.ts        # cn() utility (clsx + tailwind-merge)
│   │   │   │   └── utils.test.ts
│   │   │   ├── hooks/              # Shared UI hooks (future)
│   │   │   └── components/
│   │   │       ├── ui/             # shadcn primitives (installed via CLI)
│   │   │       │   ├── button.tsx  # + *.stories.tsx for each
│   │   │       │   ├── badge.tsx
│   │   │       │   ├── card.tsx
│   │   │       │   ├── input.tsx
│   │   │       │   ├── select.tsx
│   │   │       │   ├── dialog.tsx
│   │   │       │   └── tabs.tsx
│   │   │       └── custom/         # Domain-specific compositions
│   │   │           ├── job-card.tsx
│   │   │           ├── resume-card.tsx
│   │   │           ├── app-header.tsx
│   │   │           ├── credit-bar.tsx
│   │   │           ├── logged-out-view.tsx
│   │   │           ├── ai-studio.tsx
│   │   │           ├── autofill.tsx
│   │   │           ├── coach.tsx
│   │   │           ├── animated-match-score.tsx
│   │   │           ├── sequential-autofill.tsx
│   │   │           ├── card-accent-footer.tsx
│   │   │           ├── state-transition.tsx
│   │   │           ├── icon-badge.tsx
│   │   │           ├── skill-pill.tsx
│   │   │           ├── skill-section-label.tsx
│   │   │           ├── match-indicator.tsx
│   │   │           └── extension-sidebar.tsx
│   │   └── dist/                   # Built output (~20KB ESM, deps externalized)
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
│   │   ├── package.json            # Depends on @jobswyft/ui
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── .env.example
│   │   ├── README.md
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx      # Imports @jobswyft/ui/styles
│   │       │   ├── page.tsx
│   │       │   ├── globals.css     # Minimal - app-specific overrides only
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
│   └── extension/                  # WXT Chrome Extension (Side Panel)
│       ├── package.json            # Depends on @jobswyft/ui
│       ├── tsconfig.json
│       ├── wxt.config.ts
│       ├── .env.example
│       ├── README.md
│       └── src/
│           ├── entrypoints/
│           │   ├── sidepanel/
│           │   │   ├── index.html
│           │   │   ├── main.tsx    # Imports @jobswyft/ui/styles
│           │   │   └── App.tsx     # Uses ExtensionSidebar from @jobswyft/ui
│           │   ├── content/
│           │   │   └── index.ts    # DOM extraction for autofill + job scanning
│           │   └── background/
│           │       └── index.ts    # Side Panel API, Tabs API (URL change detection)
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
| `/v1/ai/match` | `routers/ai.py` | `ai/provider.py` — JSON response |
| `/v1/ai/cover-letter` | `routers/ai.py` | `ai/provider.py` — SSE streaming |
| `/v1/ai/outreach` | `routers/ai.py` | `ai/provider.py` — SSE streaming |
| `/v1/ai/chat` | `routers/ai.py` | `ai/provider.py` — SSE streaming (conversational, Coach tab) |
| `/v1/ai/resume-parse` | `routers/ai.py` | `ai/provider.py` — JSON response |
| `/v1/usage/*` | `routers/usage.py` | `usage_service.py` |
| `/v1/feedback/*` | `routers/feedback.py` | `feedback_service.py` |

#### Component Communication

```
Extension (Side Panel)       API                      Database
┌─────────────┐             ┌─────────────┐          ┌──────────┐
│ Zustand     │──HTTP/JSON──│ FastAPI     │──SQL────▶│ Supabase │
│ Stores      │──SSE───────▶│ Routers     │          │ Postgres │
└─────────────┘             └─────────────┘          └──────────┘
       │                           │
       │                    ┌──────┴──────┐
       │                    │ AI Services │
       │                    └──────┬──────┘
       │                    ┌──────┴──────┐
       │                    │ Claude/GPT  │ ← streaming responses
       │                    └─────────────┘

Dashboard                   API
┌─────────────┐             ┌─────────────┐
│ React Query │──HTTP/JSON──│ FastAPI     │
│ + Hooks     │             │ Routers     │
└─────────────┘             └─────────────┘
```

**Protocol Note:** AI generation endpoints (`cover-letter`, `outreach`, `chat`) use SSE (`text/event-stream`). All other endpoints use standard JSON request/response.

### Requirements to Structure Mapping

#### By PRD Feature Area

| Feature | API | Web | Extension (Side Panel) |
|---------|-----|-----|-----------|
| Auth (FR1-6) | `routers/auth.py` | `(auth)/` pages | `stores/auth-store.ts`, `<LoggedOutView>` |
| Resumes (FR7-13) | `routers/resumes.py` | `resumes/` page | `<ResumeCard>`, resume-store |
| Scanning (FR14-22) | - | - | `features/scanning/`, `<JobCard>`, auto-scan on URL change |
| AI Match (FR23-25) | `routers/ai.py` (JSON) | - | `<AnimatedMatchScore>`, Scan tab |
| AI Cover Letter (FR26-30) | `routers/ai.py` (SSE streaming) | - | `<AIStudio>` → Cover Letter sub-tab |
| AI Chat (FR31-34) | `routers/ai.py` (SSE streaming) | - | `<AIStudio>` → Chat sub-tab |
| AI Outreach (FR35-38) | `routers/ai.py` (SSE streaming) | - | `<AIStudio>` → Outreach sub-tab |
| Coach | `routers/ai.py` (SSE streaming) | - | `<Coach>` tab, conversational AI with job+resume context |
| Autofill (FR39-44) | - | - | `<Autofill>`, `<SequentialAutofill>`, `features/autofill/` |
| Job Tracking (FR45-53) | `routers/jobs.py` | `jobs/` page | `stores/job-store.ts` |
| Usage (FR54-61) | `routers/usage.py` | `account/` page | `<CreditBar>` in sidebar footer |
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
- Response format standardized (envelope pattern + error codes + SSE for streaming)
- State management consistent (Zustand stores per domain)
- Button hierarchy and error escalation patterns defined
- Four-state progressive model aligns with component inventory

**UX Design Specification alignment verified (2026-02-07).**

### Requirements Coverage Validation ✅

**Functional Requirements (80 FRs):**

| FR Group | Status | Location |
|----------|--------|----------|
| Auth (FR1-6) | ✅ | `routers/auth.py`, Supabase Auth |
| Resumes (FR7-13) | ✅ | `routers/resumes.py`, Supabase Storage |
| Scanning (FR14-22) | ✅ | `extension/lib/scanner.ts` |
| AI Match (FR23-25) | ✅ | `routers/ai.py` (JSON), `<AnimatedMatchScore>` |
| AI Cover Letter (FR26-30) | ✅ | `routers/ai.py` (SSE), `<AIStudio>` Cover Letter sub-tab |
| AI Chat (FR31-34) | ✅ | `routers/ai.py` (SSE), `<AIStudio>` Chat sub-tab |
| AI Outreach (FR35-38) | ✅ | `routers/ai.py` (SSE), `<AIStudio>` Outreach sub-tab |
| Coach | ✅ | `routers/ai.py` (SSE), `<Coach>` tab |
| Autofill (FR39-44) | ✅ | `extension/features/autofill/`, `<SequentialAutofill>` |
| Job Tracking (FR45-53) | ✅ | `routers/jobs.py`, `jobs` table |
| Usage (FR54-61) | ✅ | `routers/usage.py`, `usage_events` table, `<CreditBar>` |
| Sidebar (FR62-67) | ✅ | `extension/entrypoints/sidepanel/`, Side Panel API |
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
| UX Design Specification aligned | ✅ |
| Four-state model documented | ✅ |
| Streaming architecture defined | ✅ |
| Accessibility patterns specified | ✅ |
| Component inventory complete | ✅ |
| Shell layout contract defined | ✅ |

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
- [x] Communication patterns specified (JSON + SSE streaming)
- [x] Process patterns documented
- [x] Button hierarchy and error escalation defined
- [x] Animation strategy documented (Framer Motion + CSS boundary)
- [x] Accessibility patterns specified (WCAG 2.1 AA)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped (including SSE streaming endpoints)
- [x] Requirements to structure mapping complete
- [x] Extension shell layout contract defined
- [x] Four-state progressive model documented
- [x] State preservation matrix defined
- [x] Full component inventory (compositions, features, shared primitives, state views)

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

