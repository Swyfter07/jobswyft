# Jobswyft

AI-powered job application assistant with Chrome extension, web dashboard, and API backend.

## Project Structure

```
jobswyft/
├── apps/
│   ├── api/          # FastAPI backend (Python, uv)
│   ├── web/          # Next.js dashboard (TypeScript)
│   └── extension/    # WXT Chrome extension (TypeScript)
├── packages/
│   └── types/        # Shared TypeScript types
├── specs/
│   └── openapi.yaml  # API contract
└── supabase/
    └── migrations/   # Database migrations
```

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- Python >= 3.11
- uv (Python package manager)
- Supabase CLI

## Setup

### Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies
cd apps/api
uv sync
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

### Database Setup

```bash
# Apply migrations
supabase db reset
```

## Development

### API Server

```bash
cd apps/api
uv run uvicorn app.main:app --reload --port 3001
```

### Web Dashboard

```bash
pnpm dev:web
```

### Chrome Extension

```bash
pnpm dev:extension
```

## API Documentation

- OpenAPI Spec: `specs/openapi.yaml`
- Health Check: `GET /health`
- Auth Endpoints: `POST /v1/auth/login`, `POST /v1/auth/callback`, `POST /v1/auth/logout`

## License

Private - All rights reserved
