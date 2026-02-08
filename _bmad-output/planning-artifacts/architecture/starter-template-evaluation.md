# Starter Template Evaluation

## Primary Technology Domain

Multi-Surface Product requiring 3 separate starters:
1. **Chrome Extension** (WXT) - Primary user interface
2. **Web Dashboard** (Next.js) - Job tracking, billing, account management
3. **Backend API** (FastAPI) - Business logic, AI orchestration, data persistence

## Monorepo Structure

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

## Selected Starters

| App | Starter | Initialization Command |
|-----|---------|------------------------|
| Extension | WXT (React template) | `pnpm dlx wxt@latest init apps/extension --template react` |
| Web | create-next-app | `pnpm dlx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` |
| API | uv init + FastAPI | `cd apps/api && uv init --name jobswyft-api` |

## Architectural Decisions from Starters

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

## Post-Initialization Setup Required

| App/Package | Additional Setup |
|-------------|------------------|
| ui | ✅ Done (Story 0.1-NEW): shadcn/ui, Tailwind v4, Storybook 10, Vite 7 |
| Extension | + Zustand, + @jobswyft/ui, + Supabase client |
| Web | + @jobswyft/ui, + Supabase auth helpers, + React Query |
| API | + FastAPI routers structure, + Supabase SDK, + AI provider clients |

**Note:** Package initialization order: ui → apps (extension, web).

## Deployment & Tooling (MVP)

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
