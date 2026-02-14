# Source Tree Analysis

```
jobswyft/
├── apps/
│   ├── api/                    # FastAPI backend (Python, uv)
│   │   ├── app/
│   │   │   ├── core/           # Config, security, exceptions, deps
│   │   │   ├── db/             # Supabase client, queries
│   │   │   ├── models/         # Pydantic schemas
│   │   │   ├── routers/        # API endpoints (auth, resumes, jobs, ai, etc.)
│   │   │   └── services/       # Business logic, AI providers
│   │   ├── tests/              # Pytest tests
│   │   ├── pyproject.toml
│   │   ├── Dockerfile          # Railway deployment
│   │   └── main.py             # Entry (legacy, app in app/main.py)
│   │
│   ├── extension/              # WXT Chrome extension
│   │   ├── src/
│   │   │   ├── entrypoints/    # background, sidepanel, content-sentinel
│   │   │   ├── components/     # React components
│   │   │   ├── features/       # autofill, scanning
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── lib/            # auth, api-client, storage
│   │   ├── wxt.config.ts
│   │   └── package.json
│   │
│   └── web/                    # Next.js placeholder (README only)
│
├── packages/
│   ├── ui/                     # React component library
│   │   ├── src/
│   │   │   ├── components/     # blocks, features, layout, ui
│   │   │   ├── lib/            # utils, mappers, api-types
│   │   │   └── styles/         # globals.css (tokens)
│   │   ├── .storybook/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── types/                   # Shared TypeScript types (if exists)
│
├── specs/
│   └── openapi.yaml            # API contract (source of truth)
│
├── supabase/
│   ├── migrations/              # SQL migrations
│   └── config.toml
│
├── docs/                       # Generated documentation
├── _bmad-output/               # Planning & implementation artifacts
├── PRD Shah.md                 # Product requirements (v1)
├── CLAUDE.md                   # AI agent instructions
├── package.json                # Monorepo root
├── pnpm-workspace.yaml
└── README.md
```

## Critical Folders

| Path | Purpose |
|------|---------|
| `apps/api/app/routers/` | API endpoints |
| `apps/api/app/services/` | Business logic |
