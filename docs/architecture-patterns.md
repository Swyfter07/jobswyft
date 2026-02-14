# Jobswyft Architecture Patterns

## Overview

Jobswyft is a **monorepo** with three main parts: API (backend), Extension (Chrome), and UI (shared library). The web dashboard is planned but not yet implemented.

---

## API (Backend)

**Pattern:** API-centric service layer

- **Routers** (`app/routers/`) — HTTP endpoints, request/response handling
- **Services** (`app/services/`) — Business logic, AI orchestration, external integrations
- **Models** (`app/models/`) — Pydantic schemas for validation and serialization
- **DB** (`app/db/`) — Supabase client, query helpers
- **Core** (`app/core/`) — Config, security, exceptions, dependencies

**Flow:** Request → Router → Deps (auth, validation) → Service → DB (if needed) → Response

**Data:** Supabase (PostgreSQL) for profiles, resumes, jobs, usage, subscriptions, feedback. Auth via Supabase Auth (Google OAuth).

---

## Extension (Chrome)

**Pattern:** Extension shell + feature modules

- **Entrypoints:** `background/`, `sidepanel/`, `content-sentinel` (content script)
- **Features:** `autofill/`, `scanning/` — domain logic (see [Autofill & Scanning Engine](./autofill-scanning-engine.md))
- **Stores:** Zustand (auth, resume, scan, credits, settings, theme, sidebar)
- **Components:** React + @jobswyft/ui
- **Lib:** `auth.ts`, `api-client.ts`, `storage.ts`, `chrome-storage-adapter.ts`

**Flow:** Sidebar opens → Auth check → Feature tabs (Resume, Scan, AI Studio, Autofill, Coach) → API calls via Supabase client

**State:** Chrome storage for ephemeral state; backend for persistent data.

---

## UI (Component Library)

**Pattern:** Layered component hierarchy

- **blocks/** — Reusable primitives (IconBadge, CopyChip, CollapsibleSection)
- **features/** — Domain components (LoginView, ResumeCard, JobCard)
- **layout/** — Shell components (AppHeader, ExtensionSidebar)
- **ui/** — shadcn/ui primitives (Button, Dialog, Tabs, etc.)

**Design:** Semantic tokens in `globals.css` (OKLCH). `_reference/` holds prototypes; not used in production.

**Build:** Vite library mode → ESM bundle. Storybook for documentation and testing.

---

## Integration Points

| From | To | Type | Details |
|------|-----|------|---------|
| Extension | API | REST | Supabase client + custom endpoints |
| Extension | Supabase | Direct | Auth, Storage (resume files) |
| UI | Extension | Import | `@jobswyft/ui` workspace package |
| Extension | Supabase Auth | OAuth | Google OAuth |

**API Contract:** `specs/openapi.yaml` — source of truth for endpoints and schemas.
