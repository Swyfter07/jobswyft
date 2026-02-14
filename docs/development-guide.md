# Development Guide

## Prerequisites

- **Node.js** ≥ 24
- **pnpm** ≥ 9
- **Python** ≥ 3.11
- **uv** (Python package manager)
- **Supabase CLI** (for local DB)

## Setup

### 1. Install dependencies

```bash
# Node.js (monorepo)
pnpm install

# Python (API)
cd apps/api
uv sync
uv sync --all-groups  # Include dev deps for tests
```

### 2. Environment variables

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# Edit .env files with Supabase and AI provider credentials
```

### 3. Database (local)

```bash
supabase db reset   # Apply migrations
```

### 4. Generate types (optional)

```bash
supabase gen types typescript --local > packages/types/src/database.ts
```

## Running

### API

```bash
cd apps/api
uv run uvicorn app.main:app --reload --port 3001
```

### Extension

```bash
pnpm dev:extension
# Load apps/extension/_output/chrome-mv3 in Chrome
```

### Web (placeholder)

```bash
pnpm dev:web   # When Next.js app exists
```

### UI package (Storybook)

```bash
cd packages/ui
pnpm storybook   # → http://localhost:6006
```

## Testing

```bash
# API
cd apps/api && uv run pytest

# Extension
cd apps/extension && pnpm test

# UI
cd packages/ui && pnpm test

# All
pnpm test
```

## Build

```bash
pnpm build:extension
pnpm build:ui
# API: Dockerfile for deployment
```

## Key Files

- `.env` / `apps/api/.env` — env vars
- `specs/openapi.yaml` — API contract
- `CLAUDE.md` — AI agent instructions
