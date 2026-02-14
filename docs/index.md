# Jobswyft Project Documentation Index

**Generated:** 2026-02-13  
**Scan:** Exhaustive (initial)

---

## Project Overview

- **Type:** Monorepo with 3 parts
- **Primary language:** TypeScript (extension, ui) + Python (api)
- **Architecture:** API-centric backend + extension shell + shared UI library

### Quick Reference

| Part | Type | Tech Stack | Root |
|------|------|------------|------|
| api | Backend | FastAPI, Supabase | apps/api |
| extension | Chrome Extension | WXT, React, Zustand | apps/extension |
| ui | Library | Vite, React, shadcn/ui | packages/ui |

---

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture Patterns](./architecture-patterns.md)
- [Technology Stack](./technology-stack.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory-ui.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [API Contracts](./api-contracts-api.md)
- [Data Models](./data-models-api.md)
- [Integration Architecture](./integration-architecture.md)
- [Autofill & Scanning Engine](./autofill-scanning-engine.md)

---

## Existing Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | README.md | Root project setup |
| PRD Shah | PRD Shah.md | Product requirements v1 |
| API Spec | specs/openapi.yaml | OpenAPI 3.0 contract |
| CLAUDE | CLAUDE.md | AI agent instructions |
| Planning | _bmad-output/planning-artifacts/ | Architecture, PRD, epics |
| Implementation | _bmad-output/implementation-artifacts/ | Story notes, deployment |

---

## Getting Started

1. **Setup:** See [Development Guide](./development-guide.md)
2. **API:** `cd apps/api && uv run uvicorn app.main:app --reload --port 3001`
3. **Extension:** `pnpm dev:extension` → load in Chrome
4. **Brownfield PRD:** Use this index as input when planning new features
