# Jobswyft Project Overview

**Product:** AI-powered job application assistant  
**Platforms:** Chrome Extension (primary), Web Dashboard (planned), API backend

## Architecture

| Part | Type | Tech |
|------|------|------|
| API | Backend | FastAPI, Python 3.11, Supabase |
| Extension | Chrome Extension | WXT, React, Zustand |
| UI | Library | React, Vite, shadcn/ui |

**Repository:** Monorepo (pnpm workspaces). `apps/api` managed by uv.

## Key Features (per PRD Shah.md)

- **Resume management:** Upload, parse, max 5, active selection
- **Auto Scan Job Page:** Hybrid rules + AI extraction
- **AI Studio:** Match, Cover Letter, Answer, Outreach
- **Autofill:** Form autofill with undo
- **Usage & billing:** Freemium + paid tiers, credit tracking

## Documentation Index

- [Architecture Patterns](./architecture-patterns.md)
- [Technology Stack](./technology-stack.md)
- [API Contracts](./api-contracts-api.md)
- [Data Models](./data-models-api.md)
- [Component Inventory](./component-inventory-ui.md)
- [Source Tree](./source-tree-analysis.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [Integration Architecture](./integration-architecture.md)
- [Autofill & Scanning Engine](./autofill-scanning-engine.md)

## References

- **PRD:** `PRD Shah.md` (root)
- **API spec:** `specs/openapi.yaml`
- **Planning:** `_bmad-output/planning-artifacts/`
