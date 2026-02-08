# Multi-Surface Product Requirements

## Project-Type Overview

Jobswyft is a **Multi-Surface Product** consisting of three independently deployable applications sharing a common API contract:

| Surface | Technology | Deployment | Purpose |
|---------|------------|------------|---------|
| **Extension** | WXT (TypeScript) | Local unpacked (MVP) | Primary user interface - sidebar on job pages |
| **Web Dashboard** | Next.js (TypeScript) | Vercel | Job tracking, account management, billing |
| **Backend API** | FastAPI (Python) | Railway | Business logic, AI orchestration, data persistence |

**Development Model:** Solo developer with LLM-assisted development. Architecture optimized for parallel task execution and modular boundaries.

**Implementation Priority:** Backend API + Database first, then Dashboard, then Extension.

## Technical Architecture

**Monorepo Structure:**

```
jobswyft/
├── apps/
│   ├── api/                    # FastAPI backend (Python)
│   ├── web/                    # Next.js dashboard (TypeScript)
│   └── extension/              # WXT extension (TypeScript)
├── packages/
│   ├── api-client/             # Generated TypeScript client from OpenAPI
│   └── ui/                     # Shared component library (Extension + Dashboard)
├── specs/
│   └── openapi.yaml            # API contract (source of truth)
└── pnpm-workspace.yaml
```

**Technology Stack:**

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Extension Framework** | WXT | Modern extension framework, cross-browser support, excellent DX |
| **Dashboard Framework** | Next.js 14+ (App Router) | SSR for SEO, TypeScript, Vercel deployment |
| **Backend Framework** | FastAPI | Python ecosystem for AI/ML, async native, auto OpenAPI docs |
| **Database** | PostgreSQL (Supabase) | Relational model fits data structure, managed service |
| **Auth** | Supabase Auth | Google OAuth built-in, Python SDK available |
| **File Storage** | Supabase Storage | Resume PDFs, integrated with auth |
| **AI Provider** | Claude 3.5 Sonnet (primary) | Superior writing quality for cover letters |
| **AI Fallback** | GPT-4o-mini | Reliability backup, cost-effective |
| **Package Manager** | pnpm workspaces | Monorepo support, fast installs |

**Development & Deployment Tooling:**

| Tool | Purpose |
|------|---------|
| **Railway CLI** | Backend API deployment; local build validation → direct push |
| **Vercel CLI** | Dashboard deployment; secrets management |
| **Supabase CLI** | Database migrations, local development |
| **Supabase MCP** | AI-assisted database operations |

**Secrets Management:** Environment variables stored in Railway (API) and Vercel (Dashboard).

## Shared Component Library

**Purpose:** Centralized UI component library ensuring visual consistency between extension sidebar and web dashboard.

**Package Location:** `packages/ui/`

**Shared Components:**
- Buttons (primary, secondary, ghost, destructive)
- Form inputs (text, textarea, select, file upload)
- Cards and containers
- Modals and dialogs
- Typography system
- Icons (consistent icon set)
- Loading states and skeletons
- Toast notifications

**Architecture Principles:**
- Framework-agnostic core with React wrappers
- Tailwind CSS for styling (shared config)
- Independently versioned within monorepo
- Changes propagate to both surfaces without code duplication
- Storybook for component documentation and testing

## API Contract Design

**Contract-First Development:**

- OpenAPI specification in `specs/openapi.yaml` serves as source of truth
- TypeScript client auto-generated for extension and dashboard
- Enables parallel development across surfaces
- API versioning with `/v1/` prefix from start

**Code Generation Pipeline:**

```bash