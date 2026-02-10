# UI Package Architecture (shadcn/ui + Tailwind v4)

**Implemented:** Story 0.1-NEW (2026-02-03). This section reflects the actual production setup. Previous references to Style Dictionary, `packages/design-tokens/`, HSL color format, `tailwind.config.ts`, and Storybook 8.x are superseded.

## Design Philosophy

**shadcn/ui Foundation:** Component library built on Radix UI primitives with Tailwind CSS styling. Components are copied into the project (not npm packages), allowing full customization while maintaining accessibility and interaction patterns out-of-the-box.

**Styling Approach:**
- **Tailwind v4 CSS-first** — No `tailwind.config.ts`; all theming via `@theme inline` in `globals.css`
- **OKLCH color space** — Perceptually uniform, modern CSS color format
- **CSS Variables** — Framework-agnostic tokens in `globals.css` (works in WXT Side Panel, Next.js, Storybook)
- **Dark mode** — `@custom-variant dark (&:is(.dark *))` + `.dark` class on root element
- **Lucide Icons** — 1000+ tree-shakeable icons (shadcn standard)
- **CSS Modules** — Only for complex custom effects (glassmorphism, animations) when Tailwind utilities aren't sufficient

## Verified Technology Stack

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

## Build Tool Decision: Vite (Not Next.js)

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

## Package: `@jobswyft/ui`

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

## Component Organization

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