# Story 8.1: Railway API Deployment

Status: done

## Story

As a **developer deploying Jobswyft**,
I want **to deploy the FastAPI backend to Railway with proper configuration, environment variables, and health monitoring**,
so that **the API is accessible on a production URL for the Chrome extension and web dashboard to connect to**.

## Acceptance Criteria

1. **Railway project is created and linked** to the `apps/api/` directory via Railway CLI
2. **Deployment configuration files** exist (`Procfile` or `railway.toml`) that Railway uses to build and start the API
3. **All required environment variables** are configured in Railway dashboard (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, ENVIRONMENT=production, ALLOWED_ORIGINS)
4. **`railway up` succeeds** and the API is live on a Railway-provided URL
5. **Health check passes** — `GET /health` returns `{"status": "ok", "version": "1.0.0"}` on the production URL
6. **CORS is correctly configured** — production origins (Vercel dashboard URL, Chrome extension) are allowed
7. **API endpoints are functional** — at minimum, `GET /health` and `GET /v1/auth/me` (401 without token) respond correctly on production
8. **Logging is visible** on Railway dashboard — startup logs, request logs at INFO level for production
9. **Python 3.11 + uv** build succeeds on Railway's Nixpacks builder (or custom Dockerfile if Nixpacks doesn't support uv)
10. **Production config differs from dev** — `ENVIRONMENT=production`, `debug=False`, appropriate log level (WARNING for production, not INFO)

## Tasks / Subtasks

- [x] **Task 1: Install Railway CLI & Create Project** (AC: #1)
  - [x] 1.1 Install Railway CLI (`npm i -g @railway/cli` or `brew install railway`)
  - [x] 1.2 Authenticate via `railway login`
  - [x] 1.3 Create new Railway project: `railway init` (name: "jobswyft")
  - [x] 1.4 Link project to `apps/api/` directory (via Railway MCP `link-environment`)

- [x] **Task 2: Create Deployment Configuration** (AC: #2, #9)
  - [x] 2.1 Determine build strategy: Dockerfile (Nixpacks deprecated, WeasyPrint needs system deps)
  - [x] 2.3 Created multi-stage `Dockerfile` in `apps/api/` — Python 3.11 + uv + WeasyPrint sys deps
  - [x] 2.5 `$PORT` handled via Dockerfile CMD: `sh -c "uvicorn ... --port ${PORT:-8080}"`

- [x] **Task 3: Configure Environment Variables** (AC: #3, #6, #10)
  - [x] 3.1 Set all env vars via Railway MCP `set-variables`
  - [x] 3.2 Set `ENVIRONMENT=production`
  - [x] 3.3 Railway auto-sets `PORT` — app reads via Dockerfile CMD
  - [x] 3.4 Set `ALLOWED_ORIGINS=https://jobswyft.vercel.app,chrome-extension://*`
  - [x] 3.5 Set Supabase keys (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  - [x] 3.6 Set AI provider keys (ANTHROPIC_API_KEY, OPENAI_API_KEY)
  - [x] 3.7 Set `STRIPE_MOCK_MODE=true` (MVP)

- [x] **Task 4: Adjust Production Config** (AC: #8, #10)
  - [x] 4.1 Updated `config.py`: `debug` defaults to `False`, `allowed_origins` changed to `str` type with `get_allowed_origins()` method
  - [x] 4.2 `main.py` logging already correct: WARNING for production, INFO for development
  - [x] 4.3 `.env` excluded via `.dockerignore`
  - [x] 4.4 Created `.dockerignore` excluding `.env`, `.venv`, `__pycache__`, tests

- [x] **Task 5: Deploy & Verify** (AC: #4, #5, #7)
  - [x] 5.1 Deployed via Railway MCP `deploy` tool
  - [x] 5.2 Monitored build logs — build succeeded in 32s
  - [x] 5.3 Health check verified: `{"status": "ok", "version": "1.0.0"}`
  - [x] 5.4 Auth endpoint verified: `GET /v1/auth/me` → 401
  - [x] 5.5 CORS verified: `access-control-allow-origin: https://jobswyft.vercel.app`
  - [x] 5.6 Deploy logs visible on Railway dashboard

- [x] **Task 6: Document Production URL & Access** (AC: #1)
  - [x] 6.1 Production URL: `https://jobswyft-production.up.railway.app`
  - [x] 6.2 Updated `.env.example` with production deployment notes
  - [x] 6.3 Deployment instructions documented in this story file (README deferred — no existing README to update)

## Dev Notes

### Architecture Compliance

- **Deployment target**: Railway CLI (`railway up`) — direct push, no CI/CD for MVP [Source: architecture.md#Deployment]
- **Logging**: Structured logging at ERROR, WARN, INFO levels, viewable on Railway dashboard [Source: architecture.md#Logging Strategy]
- **Secrets management**: All secrets stored in Railway dashboard, never in code [Source: architecture.md#Deployment Workflow]
- **Entry point**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` [Source: apps/api/README.md]

### Critical: Railway PORT Handling

Railway dynamically assigns a `PORT` environment variable. The current `config.py` defaults `port: int = 3001`. The `Procfile` or start command MUST use `$PORT` (Railway's dynamic port), not hardcoded 3001.

**Two approaches:**
1. **Procfile approach**: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT` — overrides config
2. **Config approach**: Railway sets `PORT` env var → pydantic-settings auto-reads it → `settings.port` returns Railway's port

Either works. The Procfile approach is simpler and more explicit.

### Critical: uv Package Manager on Railway

Railway uses Nixpacks for auto-detection. Nixpacks supports Python but may not auto-detect `uv`. Options:
1. **Nixpacks with uv**: Add `nixpacks.toml` specifying uv as the package installer
2. **Dockerfile**: Custom Dockerfile with `uv` installed explicitly
3. **requirements.txt fallback**: Export `uv pip compile pyproject.toml -o requirements.txt` for Nixpacks compatibility

Research the latest Nixpacks uv support before choosing.

### Critical: WeasyPrint System Dependencies

The API uses `weasyprint>=62.3` for PDF generation. WeasyPrint requires system-level dependencies:
- `pango`, `cairo`, `gdk-pixbuf`, `libffi` (C libraries)
- These must be available in the Railway build environment
- Nixpacks may not include them by default — may require `nixpacks.toml` apt packages or a Dockerfile with explicit installs

**This is the most likely deployment blocker.** Test this early.

### Existing API Structure (DO NOT MODIFY)

```
apps/api/
├── app/
│   ├── main.py           # FastAPI app with /health endpoint
│   ├── core/
│   │   ├── config.py     # pydantic-settings (reads .env / env vars)
│   │   ├── deps.py       # Dependency injection
│   │   ├── security.py   # Auth middleware, exception handlers
│   │   └── exceptions.py # Custom exceptions
│   ├── routers/          # 10 routers (auth, resumes, jobs, ai, autofill, feedback, usage, subscriptions, privacy, webhooks)
│   ├── models/           # Pydantic models
│   ├── services/         # Business logic + AI providers
│   └── db/               # Supabase client + queries
├── pyproject.toml        # uv dependencies
├── .python-version       # 3.11.8
├── .env                  # Local dev secrets (DO NOT DEPLOY)
└── .env.example          # Template for required env vars
```

### Environment Variables Reference

| Variable | Required | Production Value |
|----------|----------|-----------------|
| `ENVIRONMENT` | Yes | `production` |
| `PORT` | Auto | Set by Railway |
| `SUPABASE_URL` | Yes | `https://qhzsfsaexnlvzmossffs.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | From Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | From Supabase dashboard |
| `ANTHROPIC_API_KEY` | Yes | From Anthropic dashboard |
| `OPENAI_API_KEY` | Yes | From OpenAI dashboard |
| `ALLOWED_ORIGINS` | Yes | `["https://<vercel-domain>","chrome-extension://<ext-id>"]` |
| `STRIPE_MOCK_MODE` | Yes | `true` (MVP) |
| `STRIPE_SECRET_KEY` | No | Not needed for MVP |

### NFR Compliance

- **NFR21**: Backend API maintains 99.9% uptime — Railway provides this SLA [Source: prd.md#NFR21]
- **NFR38**: Each app independently deployable — Railway deployment is API-only [Source: prd.md#NFR38]
- **NFR42-44**: Comprehensive application logging, viewable on Railway dashboard [Source: prd.md#NFR42-44]

### Project Structure Notes

- Railway deployment config files live in `apps/api/` (monorepo root is NOT the deploy root)
- `railway.json` or `railway.toml` (if needed) goes in `apps/api/`
- The Railway CLI must be run from `apps/api/` directory (or configured with root directory setting)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Deployment & Tooling]
- [Source: _bmad-output/planning-artifacts/prd.md#Tech Stack]
- [Source: docs/project-context.md#Development Workflow]
- [Source: apps/api/app/main.py - FastAPI entrypoint with /health endpoint]
- [Source: apps/api/app/core/config.py - pydantic-settings configuration]
- [Source: apps/api/pyproject.toml - Python dependencies including weasyprint]
- [Source: apps/api/.env.example - Required environment variables]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- **Build fail #1**: `libgobject-2.0-0` package doesn't exist on Debian bookworm — removed from Dockerfile (gobject is provided by `libglib2.0-0`)
- **Deploy crash #1**: pydantic-settings v2 `EnvSettingsSource` tries to JSON-parse `List[str]` env vars before field validators run. When Railway MCP set `ALLOWED_ORIGINS` with brackets but stripped inner quotes, parsing failed. Fix: changed `allowed_origins` from `List[str]` to `str` type with `get_allowed_origins()` method that handles both JSON arrays and comma-separated strings.
- **Nixpacks deprecated**: Research showed Nixpacks is in maintenance mode, replaced by Railpack (beta). Chose Dockerfile for deterministic WeasyPrint system dependency control.

### Completion Notes List

- **Task 1**: Railway project "jobswyft" created (ID: 402c1d32-a494-4750-9490-9aca59914b11) and linked to `apps/api/` via Railway MCP. Service "jobswyft" auto-created on first deploy.
- **Task 2**: Multi-stage Dockerfile created — builder stage uses `ghcr.io/astral-sh/uv:latest` for dependency install, runtime stage uses `python:3.11-slim-bookworm` with WeasyPrint system deps (pango, cairo, harfbuzz, gdk-pixbuf, fontconfig, fonts-liberation). `.dockerignore` excludes `.env`, `.venv`, tests, IDE files.
- **Task 3**: All 8 env vars configured via Railway MCP `set-variables`. `ALLOWED_ORIGINS` uses comma-separated format (robust for cloud env vars).
- **Task 4**: `config.py` updated — `debug` defaults to `False`, `allowed_origins` changed from `List[str]` to `str` with `get_allowed_origins()` method. `main.py` updated to use `settings.get_allowed_origins()`. 139/140 existing tests pass (1 pre-existing failure in test_feedback.py unrelated to this story).
- **Task 5**: Deployment succeeded (build: 32s). All ACs verified: health check OK, auth 401, CORS headers correct, logs visible on Railway dashboard.
- **Task 6**: Production URL documented. Custom domain `api.jobswyft.com` configured via CNAME to `jobswyft-production.up.railway.app`.
- **Post-deploy**: Custom domain `api.jobswyft.com` set up (GoDaddy CNAME → Railway). ALLOWED_ORIGINS updated to include `jobswyft.com`, `www.jobswyft.com`, Vercel, and chrome extension origins.

### Production URLs

| URL | Purpose |
|-----|---------|
| `https://api.jobswyft.com` | Custom domain (primary) |
| `https://jobswyft-production.up.railway.app` | Railway default (fallback) |

### Change Log

- 2026-02-06: Deployed FastAPI API to Railway. Created Dockerfile, .dockerignore. Updated config.py (debug default, CORS parsing). Updated main.py (CORS origins). Updated .env.example with production notes.
- 2026-02-06: Custom domain `api.jobswyft.com` configured via GoDaddy CNAME. ALLOWED_ORIGINS expanded to include jobswyft.com origins.

### File List

**New files:**
- `apps/api/Dockerfile` — Multi-stage Docker build (Python 3.11 + uv + WeasyPrint system deps)
- `apps/api/.dockerignore` — Excludes .env, .venv, __pycache__, tests, IDE files

**Modified files:**
- `apps/api/app/core/config.py` — `debug` defaults to `False`; `allowed_origins` changed from `List[str]` to `str` with `get_allowed_origins()` method
- `apps/api/app/main.py` — Uses `settings.get_allowed_origins()` for CORS middleware and logging
- `apps/api/.env.example` — CORS format updated to comma-separated; production deployment notes added
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story 8-1 status: ready-for-dev → done
