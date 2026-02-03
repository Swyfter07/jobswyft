# Story 0.1: Foundation (Design Tokens + UI Scaffold)

Status: review

## Story

As a **developer**,
I want **design tokens and UI package infrastructure set up**,
So that **all components share a single source of truth and proper tooling**.

## Acceptance Criteria

### AC1: Design Tokens Package (`packages/design-tokens/`)

**Given** the storybook-demo design tokens exist at `/Users/enigma/Documents/Projects/storybook-demo/packages/design-tokens`
**When** I create the design-tokens package
**Then** the following token files are created:

1. `tokens/colors.json` - Primary (#6366f1), purple (#8b5cf6), blue (#3b82f6), success (#22c55e), warning (#f59e0b), danger (#ef4444), grays, glass, gradients
2. `tokens/typography.json` - Font family (system), sizes (xs 11px → 6xl 48px), weights (400-700), line heights (tight 1.2, normal 1.5, relaxed 1.6)
3. `tokens/spacing.json` - 4px base unit scale (1-10: 4px → 40px)
4. `tokens/shadows.json` - sm (0 2px 8px), md (0 4px 16px), lg (0 10px 40px), xl (0 20px 60px)
5. `tokens/borders.json` - Border radii (sm 6px, md 8px, lg 10px, xl 12px, 2xl 16px, 3xl 20px)
6. `tokens/transitions.json` - fast (0.15s ease), base (0.2s ease), slow (0.3s ease)
7. `tokens/themes/dark.json` - Dark theme (bg #0f1419, secondary #1e3a5f, glass rgba(255,255,255,0.05), text primary rgba(255,255,255,1))
8. `tokens/themes/light.json` - Light theme (bg #f8fafc, secondary #e0e7ff, glass rgba(255,255,255,0.7), text primary #0f172a)

**And** Style Dictionary builds to `dist/tokens.css`, `dist/themes.css`, `dist/tokens.js`
**And** CSS variables match exact values from storybook-demo

### AC2: UI Package Scaffold (`packages/ui/`)

**Given** the design-tokens package exists
**When** I scaffold the UI package
**Then** the following structure exists:

```
packages/ui/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .storybook/main.ts, preview.tsx
├── src/
│   ├── index.ts
│   ├── styles/globals.css
│   ├── utils/cn.ts
│   ├── providers/ThemeProvider.tsx
│   ├── hooks/index.ts
│   └── test/setup.ts
```

**And** `cn()` utility combines clsx + tailwind-merge for hybrid styling
**And** ThemeProvider supports dark/light via `data-theme` attribute
**And** Storybook 8.x runs with theme toggle decorator and viewport presets
**And** Tailwind config extends design-token CSS variables for colors, spacing, radii, fonts
**And** globals.css imports `@jobswyft/design-tokens/dist/tokens.css` and `themes.css`

### AC3: Storybook Verification

**Given** both packages are created
**When** I run Storybook
**Then** Storybook launches at localhost:6006
**And** theme toggle works (dark/light)
**And** viewport presets are available (Extension 400x600, Dashboard responsive)

## Tasks / Subtasks

- [x] Task 1: Create Design Tokens Package (AC: #1)
  - [x] 1.1: Create `packages/design-tokens/` directory with package.json
  - [x] 1.2: Create tsconfig.json for TypeScript compilation
  - [x] 1.3: Create token JSON files (use exact values from Dev Notes below)
  - [x] 1.4: Create theme files (dark.json, light.json)
  - [x] 1.5: Create build scripts (build.ts, generate-theme-css.ts, index.ts)
  - [x] 1.6: Run build and verify output files in dist/

- [x] Task 2: Create UI Package Scaffold (AC: #2)
  - [x] 2.1: Create `packages/ui/` directory with package.json
  - [x] 2.2: Create tsconfig.json
  - [x] 2.3: Create vite.config.ts for library build
  - [x] 2.4: Create vitest.config.ts for testing
  - [x] 2.5: Create tailwind.config.ts extending design tokens
  - [x] 2.6: Create postcss.config.js
  - [x] 2.7: Create src/utils/cn.ts (clsx + tailwind-merge)
  - [x] 2.8: Create src/providers/ThemeProvider.tsx
  - [x] 2.9: Create src/styles/globals.css with glassmorphism utilities
  - [x] 2.10: Create src/index.ts with public exports
  - [x] 2.11: Create src/hooks/index.ts
  - [x] 2.12: Create src/test/setup.ts for Vitest

- [x] Task 3: Configure Storybook 8.x (AC: #3)
  - [x] 3.1: Create .storybook/main.ts
  - [x] 3.2: Create .storybook/preview.tsx with theme switcher and viewports
  - [x] 3.3: Verify Storybook launches successfully
  - [x] 3.4: Test theme toggle functionality
  - [x] 3.5: Test viewport presets

- [x] Task 4: Update pnpm workspace (AC: #1, #2)
  - [x] 4.1: Update root pnpm-workspace.yaml to include packages/*
  - [x] 4.2: Run pnpm install to link workspace packages
  - [x] 4.3: Verify @jobswyft/design-tokens is resolvable from @jobswyft/ui

## Dev Notes

### Hybrid Styling Strategy

**Priority order for styling:**
1. **Design Token CSS Variables** - Foundation (`var(--color-primary-500)`)
2. **Tailwind Utilities** - Layout, spacing, responsive (`flex`, `gap-4`, `md:grid-cols-2`)
3. **CSS Modules** - Complex effects like glassmorphism, animations

The `cn()` utility merges all class sources with conflict resolution via `tailwind-merge`.

### CSS Variable Naming Convention

| Category | Pattern | Example |
|----------|---------|---------|
| Colors | `--color-{name}-{shade}` | `--color-primary-500` |
| Gradients | `--gradient-{name}` | `--gradient-primary` |
| Typography | `--font-{property}-{value}` | `--font-size-md`, `--font-weight-bold` |
| Spacing | `--space-{n}` | `--space-4` (16px) |
| Radius | `--radius-{size}` | `--radius-lg` |
| Shadows | `--shadow-{size}` | `--shadow-md` |
| Transitions | `--transition-{speed}` | `--transition-base` |
| Theme-aware | `--theme-{category}-{name}` | `--theme-text-primary`, `--theme-glass-bg` |

---

## Exact Token Values

### colors.json
```json
{
  "color": {
    "primary": {
      "500": { "value": "#6366f1" },
      "600": { "value": "#4f46e5" },
      "700": { "value": "#4338ca" }
    },
    "purple": {
      "500": { "value": "#8b5cf6" },
      "600": { "value": "#7c3aed" },
      "700": { "value": "#6d28d9" }
    },
    "blue": {
      "400": { "value": "#60a5fa" },
      "500": { "value": "#3b82f6" },
      "600": { "value": "#2563eb" }
    },
    "success": {
      "400": { "value": "#4ade80" },
      "500": { "value": "#22c55e" },
      "600": { "value": "#16a34a" }
    },
    "warning": {
      "400": { "value": "#fbbf24" },
      "500": { "value": "#f59e0b" },
      "600": { "value": "#d97706" }
    },
    "danger": {
      "400": { "value": "#f87171" },
      "500": { "value": "#ef4444" },
      "600": { "value": "#dc2626" }
    },
    "background": {
      "dark": {
        "primary": { "value": "#0f1419" },
        "secondary": { "value": "#1e3a5f" }
      },
      "slate": { "value": "#7e8ba3" }
    },
    "white": { "value": "#ffffff" },
    "text": {
      "primary": { "value": "rgba(255, 255, 255, 1)" },
      "secondary": { "value": "rgba(255, 255, 255, 0.8)" },
      "tertiary": { "value": "rgba(255, 255, 255, 0.6)" },
      "muted": { "value": "rgba(255, 255, 255, 0.5)" }
    },
    "gray": {
      "50": { "value": "rgba(255, 255, 255, 0.95)" },
      "100": { "value": "rgba(255, 255, 255, 0.8)" },
      "200": { "value": "rgba(255, 255, 255, 0.6)" },
      "300": { "value": "rgba(255, 255, 255, 0.5)" },
      "400": { "value": "rgba(255, 255, 255, 0.4)" },
      "500": { "value": "rgba(255, 255, 255, 0.3)" },
      "600": { "value": "rgba(255, 255, 255, 0.2)" },
      "700": { "value": "rgba(255, 255, 255, 0.15)" },
      "800": { "value": "rgba(255, 255, 255, 0.1)" },
      "900": { "value": "rgba(255, 255, 255, 0.05)" }
    },
    "glass": {
      "bg": { "value": "rgba(255, 255, 255, 0.05)" },
      "border": { "value": "rgba(255, 255, 255, 0.1)" },
      "hover": { "value": "rgba(255, 255, 255, 0.08)" }
    }
  },
  "gradient": {
    "primary": { "value": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
    "background": { "value": "linear-gradient(135deg, #1e3a5f 0%, #0f1419 100%)" },
    "purple-blue": { "value": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" },
    "success": { "value": "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)" }
  }
}
```

### typography.json
```json
{
  "font": {
    "family": {
      "base": { "value": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
    },
    "size": {
      "xs": { "value": "11px" },
      "sm": { "value": "12px" },
      "base": { "value": "13px" },
      "md": { "value": "14px" },
      "lg": { "value": "15px" },
      "xl": { "value": "16px" },
      "2xl": { "value": "18px" },
      "3xl": { "value": "20px" },
      "4xl": { "value": "24px" },
      "5xl": { "value": "28px" },
      "6xl": { "value": "48px" }
    },
    "weight": {
      "normal": { "value": "400" },
      "medium": { "value": "500" },
      "semibold": { "value": "600" },
      "bold": { "value": "700" }
    },
    "lineHeight": {
      "tight": { "value": "1.2" },
      "normal": { "value": "1.5" },
      "relaxed": { "value": "1.6" }
    },
    "letterSpacing": {
      "tight": { "value": "-0.02em" },
      "normal": { "value": "0" }
    }
  }
}
```

### spacing.json
```json
{
  "space": {
    "1": { "value": "4px" },
    "2": { "value": "8px" },
    "3": { "value": "12px" },
    "4": { "value": "16px" },
    "5": { "value": "20px" },
    "6": { "value": "24px" },
    "8": { "value": "32px" },
    "10": { "value": "40px" }
  }
}
```

### shadows.json
```json
{
  "shadow": {
    "sm": { "value": "0 2px 8px rgba(0, 0, 0, 0.1)" },
    "md": { "value": "0 4px 16px rgba(99, 102, 241, 0.4)" },
    "lg": { "value": "0 10px 40px rgba(0, 0, 0, 0.5)" },
    "xl": { "value": "0 20px 60px rgba(0, 0, 0, 0.6)" }
  }
}
```

### borders.json
```json
{
  "radius": {
    "sm": { "value": "6px" },
    "md": { "value": "8px" },
    "lg": { "value": "10px" },
    "xl": { "value": "12px" },
    "2xl": { "value": "16px" },
    "3xl": { "value": "20px" }
  }
}
```

### transitions.json
```json
{
  "transition": {
    "fast": { "value": "0.15s ease" },
    "base": { "value": "0.2s ease" },
    "slow": { "value": "0.3s ease" }
  }
}
```

### themes/dark.json
```json
{
  "theme": {
    "dark": {
      "background": {
        "primary": { "value": "#0f1419" },
        "secondary": { "value": "#1e3a5f" },
        "slate": { "value": "#7e8ba3" }
      },
      "text": {
        "primary": { "value": "rgba(255, 255, 255, 1)" },
        "secondary": { "value": "rgba(255, 255, 255, 0.8)" },
        "tertiary": { "value": "rgba(255, 255, 255, 0.6)" },
        "muted": { "value": "rgba(255, 255, 255, 0.5)" }
      },
      "gray": {
        "50": { "value": "rgba(255, 255, 255, 0.95)" },
        "100": { "value": "rgba(255, 255, 255, 0.8)" },
        "200": { "value": "rgba(255, 255, 255, 0.6)" },
        "300": { "value": "rgba(255, 255, 255, 0.5)" },
        "400": { "value": "rgba(255, 255, 255, 0.4)" },
        "500": { "value": "rgba(255, 255, 255, 0.3)" },
        "600": { "value": "rgba(255, 255, 255, 0.2)" },
        "700": { "value": "rgba(255, 255, 255, 0.15)" },
        "800": { "value": "rgba(255, 255, 255, 0.1)" },
        "900": { "value": "rgba(255, 255, 255, 0.05)" }
      },
      "glass": {
        "bg": { "value": "rgba(255, 255, 255, 0.05)" },
        "border": { "value": "rgba(255, 255, 255, 0.1)" },
        "hover": { "value": "rgba(255, 255, 255, 0.08)" }
      },
      "section": {
        "bg": { "value": "rgba(255, 255, 255, 0.05)" },
        "border": { "value": "rgba(255, 255, 255, 0.1)" }
      },
      "gradient": {
        "background": { "value": "linear-gradient(135deg, #1e3a5f 0%, #0f1419 100%)" }
      }
    }
  }
}
```

### themes/light.json
```json
{
  "theme": {
    "light": {
      "background": {
        "primary": { "value": "#f8fafc" },
        "secondary": { "value": "#e0e7ff" },
        "slate": { "value": "#94a3b8" }
      },
      "text": {
        "primary": { "value": "#0f172a" },
        "secondary": { "value": "#1e293b" },
        "tertiary": { "value": "#475569" },
        "muted": { "value": "#64748b" }
      },
      "gray": {
        "50": { "value": "rgba(15, 23, 42, 0.95)" },
        "100": { "value": "rgba(15, 23, 42, 0.8)" },
        "200": { "value": "rgba(15, 23, 42, 0.6)" },
        "300": { "value": "rgba(15, 23, 42, 0.5)" },
        "400": { "value": "rgba(15, 23, 42, 0.4)" },
        "500": { "value": "rgba(15, 23, 42, 0.3)" },
        "600": { "value": "rgba(15, 23, 42, 0.2)" },
        "700": { "value": "rgba(15, 23, 42, 0.15)" },
        "800": { "value": "rgba(15, 23, 42, 0.12)" },
        "900": { "value": "rgba(15, 23, 42, 0.08)" }
      },
      "glass": {
        "bg": { "value": "rgba(255, 255, 255, 0.7)" },
        "border": { "value": "rgba(15, 23, 42, 0.1)" },
        "hover": { "value": "rgba(255, 255, 255, 0.8)" }
      },
      "section": {
        "bg": { "value": "rgba(255, 255, 255, 0.65)" },
        "border": { "value": "rgba(15, 23, 42, 0.08)" }
      },
      "gradient": {
        "background": { "value": "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)" }
      }
    }
  }
}
```

---

## Build Scripts

### generate-theme-css.ts Purpose

This script generates `themes.css` with:
- `:root` - Base tokens (colors, gradients, typography, spacing, radius, shadows, transitions)
- `:root, [data-theme="dark"]` - Dark theme as default
- `[data-theme="light"]` - Light theme overrides

Copy from source: `/Users/enigma/Documents/Projects/storybook-demo/packages/design-tokens/src/generate-theme-css.ts`

### build.ts Purpose

Uses Style Dictionary 3.9.1 to generate:
- `dist/tokens.css` - CSS variables
- `dist/tokens.js` - JavaScript ES6 format
- `dist/tokens.json` - Flat JSON format

Then calls `generate-theme-css.ts` to create `dist/themes.css`.

Copy from source: `/Users/enigma/Documents/Projects/storybook-demo/packages/design-tokens/src/build.ts`

---

## Package Dependencies

### packages/design-tokens/package.json
```json
{
  "name": "@jobswyft/design-tokens",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./tokens.css": "./dist/tokens.css",
    "./themes.css": "./dist/themes.css"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsx src/build.ts && tsc",
    "dev": "tsx watch src/build.ts"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "style-dictionary": "^3.9.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### packages/ui/package.json
```json
{
  "name": "@jobswyft/ui",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@jobswyft/design-tokens": "workspace:*",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
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
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

---

## Key Implementation Patterns

### cn() Utility (clsx + tailwind-merge)
```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### ThemeProvider Pattern
```typescript
// src/providers/ThemeProvider.tsx
// - Uses createContext for theme state
// - Stores in localStorage (key: 'jobswyft-theme')
// - Sets data-theme attribute on document.documentElement
// - Exports useTheme() hook
// Copy from: storybook-demo/packages/ui/src/providers/ThemeProvider.tsx
```

### globals.css with Glassmorphism
```css
/* Import design tokens */
@import '@jobswyft/design-tokens/tokens.css';
@import '@jobswyft/design-tokens/themes.css';

/* Base styles */
:root {
  font-family: var(--font-family-base);
  color: var(--theme-text-primary);
  background: var(--theme-gradient-background);
}

/* Glassmorphism utilities for light theme */
[data-theme="light"] {
  --glass-blur: blur(12px);
  --glass-saturation: saturate(180%);
}

[data-theme="light"] .glass-bg {
  background: var(--theme-glass-bg);
  backdrop-filter: var(--glass-blur) var(--glass-saturation);
  -webkit-backdrop-filter: var(--glass-blur) var(--glass-saturation);
  border: 1px solid var(--theme-glass-border);
}
```

### Vite Config for Library Build
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'JobSwyftUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
});
```

### Storybook 8.x Preview with Theme Toggle
```typescript
// .storybook/preview.tsx
const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        extensionPopup: { name: 'Extension Popup', styles: { width: '400px', height: '600px' } },
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      useEffect(() => {
        document.documentElement.setAttribute('data-theme', context.globals.theme);
      }, [context.globals.theme]);
      return <Story />;
    },
  ],
};
```

---

## Component Pattern Preview (for later stories)

Components follow atomic design with this structure:
```
atoms/Button/
├── index.ts           # Re-exports
├── Button.tsx         # forwardRef component with HTML element props
├── Button.module.css  # CSS Modules using design token variables
└── Button.stories.tsx # Storybook with autodocs
```

Pattern: `forwardRef` + native HTML props + CSS Modules + `cn()` utility.

---

## File List

**Files created:**

Design Tokens Package:
- `packages/design-tokens/package.json` (new)
- `packages/design-tokens/tsconfig.json` (new)
- `packages/design-tokens/src/build.ts` (new)
- `packages/design-tokens/src/generate-theme-css.ts` (new)
- `packages/design-tokens/src/index.ts` (new)
- `packages/design-tokens/src/tokens/colors.json` (new)
- `packages/design-tokens/src/tokens/typography.json` (new)
- `packages/design-tokens/src/tokens/spacing.json` (new)
- `packages/design-tokens/src/tokens/shadows.json` (new)
- `packages/design-tokens/src/tokens/borders.json` (new)
- `packages/design-tokens/src/tokens/transitions.json` (new)
- `packages/design-tokens/src/tokens/themes/dark.json` (new)
- `packages/design-tokens/src/tokens/themes/light.json` (new)

UI Package:
- `packages/ui/package.json` (new)
- `packages/ui/tsconfig.json` (new)
- `packages/ui/vite.config.ts` (new)
- `packages/ui/vitest.config.ts` (new)
- `packages/ui/tailwind.config.ts` (new)
- `packages/ui/postcss.config.js` (new)
- `packages/ui/.storybook/main.ts` (new)
- `packages/ui/.storybook/preview.tsx` (new)
- `packages/ui/src/index.ts` (new)
- `packages/ui/src/styles/globals.css` (new)
- `packages/ui/src/utils/cn.ts` (new)
- `packages/ui/src/utils/cn.test.ts` (new - code review)
- `packages/ui/src/utils/index.ts` (new)
- `packages/ui/src/providers/ThemeProvider.tsx` (new)
- `packages/ui/src/providers/ThemeProvider.test.tsx` (new - code review)
- `packages/ui/src/providers/index.ts` (new)
- `packages/ui/src/hooks/index.ts` (new)
- `packages/ui/src/atoms/index.ts` (new)
- `packages/ui/src/molecules/index.ts` (new)
- `packages/ui/src/organisms/index.ts` (new)
- `packages/ui/src/templates/index.ts` (new)
- `packages/ui/src/test/setup.ts` (new)
- `packages/ui/src/ThemeDemo.stories.tsx` (new - code review)

Root:
- `pnpm-workspace.yaml` (unchanged - already included packages/*)

---

## References

- [Source: _bmad-output/planning-artifacts/architecture.md#UI-Package-Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-0.1]
- [Source: storybook-demo/packages/design-tokens/]
- [Source: storybook-demo/packages/ui/]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Storybook 8.6.15 launched successfully on http://localhost:6006 (HTTP 200)
- Design tokens build: `dist/tokens.css`, `dist/themes.css`, `dist/tokens.js`, `dist/tokens.json`
- UI package build: `dist/index.mjs`, `dist/index.js`, `dist/style.css` (verified: 60.67 kB gzip: 11.18 kB)
- Workspace linking verified: `@jobswyft/design-tokens` resolvable from `@jobswyft/ui`
- Tests: 11 tests passing (5 cn utility + 6 ThemeProvider tests) in 1.12s
- ThemeDemo story created: demonstrates theme toggle, design tokens, glassmorphism, shadows

### Completion Notes List

**Date: 2026-02-02**

**Task 1 - Design Tokens Package:**
- Created `@jobswyft/design-tokens` package with Style Dictionary 3.9.1
- All token JSON files created with exact values from story spec
- Build generates: `tokens.css` (CSS variables), `themes.css` (dark/light theme aware), `tokens.js`, `tokens.json`
- CSS variable naming follows convention: `--color-{name}-{shade}`, `--theme-{category}-{name}`, etc.

**Task 2 - UI Package Scaffold:**
- Created `@jobswyft/ui` package with Vite 5.x, Vitest 1.x, Tailwind 3.4
- `cn()` utility implemented with clsx + tailwind-merge
- ThemeProvider uses `data-theme` attribute and localStorage persistence
- globals.css includes Tailwind directives and glassmorphism utilities
- Package builds successfully with proper ES module + CommonJS outputs

**Task 3 - Storybook 8.x:**
- Configured Storybook 8.6.15 with React-Vite framework
- Theme toggle in toolbar (dark/light)
- Viewport presets: Mobile (375x667), Tablet (768x1024), Desktop (1440x900), Extension Popup (400x600)
- Verified launch at localhost:6006 with HTTP 200

**Task 4 - Workspace Integration:**
- pnpm-workspace.yaml already included `packages/*`
- Workspace linking verified: design-tokens resolvable from UI package

**Code Review Fixes (2026-02-02):**
- Added test coverage: `cn.test.ts` (5 tests) and `ThemeProvider.test.tsx` (6 tests) - all passing
- Created `ThemeDemo.stories.tsx` demonstrating theme system, design tokens, glassmorphism effects
- Verified builds: design-tokens (✓), UI package (✓), tests (✓ 11/11 passing)
- Empty barrel exports already contain helpful TODO comments

## Change Log

- 2026-02-02: Initial implementation of design tokens and UI package scaffold (Story 0.1)
