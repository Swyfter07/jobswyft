# Jobswyft Technology Stack

## Part: API (Backend)

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Runtime | Python | 3.11+ | pyproject.toml requires-python |
| Framework | FastAPI | 0.128+ | REST API, async support |
| Server | Uvicorn | 0.40+ | ASGI server |
| Database | Supabase (PostgreSQL) | 2.27+ | Auth, storage, realtime via supabase-py |
| AI Providers | Anthropic (Claude) | 0.40+ | Primary AI for cover letters, match, etc. |
| AI Providers | OpenAI | 1.50+ | Fallback / alternative models |
| PDF | pdfplumber | 0.10+ | Resume parsing |
| PDF | WeasyPrint | 62.3+ | PDF generation (cover letters) |
| Config | pydantic-settings | 2.12+ | Environment-based config |
| Auth | Supabase Auth | 2.27+ | OAuth, JWT validation |
| Billing | Stripe | (mock) | Subscription management (mock mode) |
| Testing | pytest | 8.0+ | Unit/integration tests |

**Architecture Pattern:** API-centric service layer — routers → services → models → db client. Middleware for CORS, exception handling.

---

## Part: Extension (Chrome Extension)

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Framework | WXT | 0.20+ | Chrome extension framework (MV3) |
| UI | React | 19.0 | Component rendering |
| Styling | Tailwind CSS | 4.1+ | Utility-first CSS |
| State | Zustand | 5.0+ | Client-side state management |
| Icons | Lucide React | 0.562+ | Icon library |
| Auth | Supabase Auth | 2.49+ | OAuth, session management |
| API Client | @supabase/supabase-js | 2.49+ | Backend communication |
| Components | @jobswyft/ui | workspace: | Shared UI package |
| Testing | Vitest | 3.0+ | Unit tests |
| Build | Vite (via WXT) | — | Bundling |

**Architecture Pattern:** Extension shell (background, popup, content scripts) + React sidebar. Feature-based modules (autofill, scanning, etc.). Zustand stores per domain.

---

## Part: UI (Component Library)

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Runtime | Node.js | 24+ | Monorepo root engines |
| Build | Vite | 7.3+ | Library bundling |
| UI | React | 19.0 | Component framework |
| Primitives | Radix UI | 1.4+ | Accessible components |
| Styling | Tailwind CSS | 4.1+ | Utility-first CSS |
| Components | shadcn/ui | — | Design system base |
| Icons | Lucide React | 0.562+ | Icon library |
| Utils | class-variance-authority | 0.7+ | Variant handling |
| Utils | clsx, tailwind-merge | — | Class merging |
| Docs | Storybook | 10.1+ | Component documentation |
| Testing | Vitest | 3.0+ | Unit tests |

**Architecture Pattern:** Layered component library — blocks → features → layout. Semantic design tokens (OKLCH) in globals.css. Peer deps for React 18/19.

---

## Monorepo Summary

| Tool | Version | Purpose |
|------|---------|---------|
| pnpm | 9.15+ | Package manager, workspaces |
| Node.js | 24+ | JavaScript runtime |
| uv | — | Python package manager (api only) |

**Workspace structure:** `apps/*` (api, extension, web), `packages/*` (ui, types). `apps/api` excluded from pnpm (managed by uv).
