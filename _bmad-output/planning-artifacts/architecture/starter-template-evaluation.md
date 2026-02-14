## Starter Template Evaluation

### Primary Technology Domain

Full-stack monorepo with Chrome extension specialization — established and actively developed.

### Starter Options Considered

This is a **brownfield revision**. All primary starters were selected during original architecture (2026-01-30) and remain current. No starter changes recommended.

### Selected Stack (Confirmed)

**Rationale:** All frameworks are actively maintained with recent releases. Version audit shows no critical gaps. The existing starter choices align well with Smart Engine requirements.

| Surface | Framework | Version | Notes |
|---------|-----------|---------|-------|
| Extension | WXT + React 19 + Zustand 5 | ^0.20.13 | MV3 abstractions, HMR |
| UI Library | Vite 7 + shadcn/ui 3 + Tailwind 4 + Storybook 10 | Current | Shared component system |
| API | FastAPI + uv + Supabase | >=0.128.0 | Python 3.11+, dual AI providers |
| Web | Next.js (scaffolded, not yet initialized) | TBD | Dashboard surface pending |
| Monorepo | pnpm workspaces | — | Cross-package linking |

### Architectural Decisions Provided by Starters

**Language & Runtime:** TypeScript 5.7 (extension/UI/web), Python 3.11+ (API)
**Styling:** Tailwind v4 + OKLCH design tokens via globals.css, shadcn/ui primitives
**Build Tooling:** Vite 7 (UI lib), WXT/Vite (extension), uv (API)
**Testing:** Vitest 3 (TypeScript surfaces), Pytest 8 (API)
**State Management:** Zustand 5 (extension), server state via Supabase
**Code Organization:** Monorepo with `apps/` (surfaces) + `packages/` (shared libraries)

### Gaps for Smart Engine Evolution

1. **Web Dashboard initialization** — `apps/web/` needs Next.js scaffold when dashboard stories begin
2. **Extension E2E testing** — Consider Playwright with Chrome extension support for integration testing
3. **Config schema validation** — Zod/Ajv for runtime validation of selector registry and site configs
4. **Real-time config push** — Lightweight SSE/WebSocket client if server-driven config sync adopted

**Note:** These gaps are non-blocking for current development and can be addressed incrementally as Smart Engine stories progress.

