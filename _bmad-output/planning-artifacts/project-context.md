---
project_name: 'jobswyft'
user_name: 'Enigma'
date: '2026-01-30'
status: 'complete'
optimized_for_llm: true
architecture_doc: '_bmad-output/planning-artifacts/architecture.md'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in Jobswyft. Focus on unobvious details that agents might otherwise miss._

---

## Project Overview

**Jobswyft** is an AI-powered job application assistant with three components:

- **Extension** (`apps/extension/`) - WXT + React + Tailwind + Zustand
- **Dashboard** (`apps/web/`) - Next.js 14+ App Router + Tailwind + shadcn/ui
- **Backend** (`apps/api/`) - Python + FastAPI + Pydantic + Supabase

**Monorepo:** pnpm workspaces (TypeScript packages) + uv (Python backend)

**Implementation Priority:** Backend API + Database first, then Dashboard, then Extension.

---

## Technology Stack & Versions

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| **Extension** | WXT + React + TypeScript + Tailwind + Zustand | WXT latest, React 19, Tailwind 4.x | State: Zustand with chrome.storage persistence |
| **Dashboard** | Next.js + React + TypeScript + Tailwind | Next.js 14+, App Router | UI-only, no API routes (except auth callback) |
| **Backend** | Python + FastAPI + Pydantic | Python 3.11+, FastAPI latest | Dep Mgmt: `uv` |
| **Database** | Supabase (PostgreSQL + Auth + Storage) | Latest | RLS enabled, cloud-first |
| **AI Primary** | Claude 3.5 Sonnet | API latest | Via Anthropic SDK |
| **AI Fallback** | GPT-4o-mini | API latest | Auto-fallback on Claude failure |
| **Repo** | pnpm workspaces | 9.x | Backend excluded from workspace |

---

## Critical Implementation Rules

### Language-Specific Rules

**TypeScript (Extension & Dashboard):**

- **Strict Mode**: Enforced. Always check for undefined on array access.
- **Imports**:
  - **Within-Package**: Use alias `@/` (e.g., `import { Button } from '@/components/ui/button'`).
  - **Cross-Package**: Use `@jobswyft/types` for shared types.
- **Async Chains**: User gestures are lost after `await`. Perform sync checks before calling APIs requiring gestures.

**Python (Backend):**

- **Typing**: `mypy` strict mode enforced. Function type hints required.
- **Imports**: Use absolute imports (`from app.services import...`) over relative.
- **Async Safety**: NEVER call blocking sync code in `async def`. Use async libraries.
- **JSON Serialization**: API returns snake_case. TypeScript client transforms to camelCase.

### Framework-Specific Rules

**WXT (Chrome Extension):**

- **State Persistence**: Service workers are ephemeral. NEVER store critical state in global variables. Use `chrome.storage.local` with Zustand persistence.
- **Shadow DOM**: Content script UIs must use shadow-root to prevent style bleeding.
- **Messaging**: Background script listeners must return `true` for async processing.

**React (UI Components):**

- **Zustand**: Use selector pattern `useStore(s => s.value)` to prevent unnecessary re-renders.
- **Tailwind**: No inline styles. Use `cn()` helper for conditional classes.
- **shadcn/ui**: Use for all standard components (Button, Card, Input, etc.).

**Next.js (Dashboard):**

- **App Router**: Use Server Components by default, Client Components only when needed.
- **No API Routes**: All data fetching goes to FastAPI backend. Exception: `/api/auth/callback` for Supabase OAuth.

**FastAPI (Backend):**

- **Routers**: All routes must use `APIRouter` with `/v1` prefix and proper `tags`.
- **Env**: Settings initialized ONCE in `app/core/config.py` using `pydantic-settings`.
- **Dependencies**: Use `Depends()` for auth, database connections.

### Testing Rules

**TypeScript (Vitest + React Testing Library):**

- **Co-location**: Tests live next to components (`user-card.test.tsx` next to `user-card.tsx`).
- **Mocking**: NEVER call real Chrome APIs in tests. Use `vi.mock`.
- **Async**: Use `waitFor` or `findBy` queries, never arbitrary `sleep`.

**Python (Pytest):**

- **Structure**: Tests in `tests/` directory mirroring app structure.
- **Fixtures**: Use `conftest.py` for shared state (`db_session`, `auth_headers`, `test_client`).
- **Mocking**: External services (Claude, OpenAI, Stripe) must be mocked.

**MVP Testing**: Minimal automated testing acceptable. Focus on comprehensive error handling in production code.

### Code Quality Rules

**Linting & Formatting:**

- **TypeScript**: Prettier + ESLint. Follow existing config.
- **Python**: `ruff` for linting and formatting.
- **Pre-commit**: `lint-staged` runs checks on commit.

**Code Organization:**

- **Colocation**: Keep related files together (feature components, hooks, tests in same folder).
- **Small Functions**: Extract complex logic from React components into custom hooks.
- **Self-Documenting**: Variable names should explain intent.

### Development Workflow Rules

**Git:**

- **Branches**: `type/description` (e.g., `feat/auth-flow`, `fix/login-bug`).
- **Commits**: Conventional Commits format.

**Deployment (MVP):**

- **Backend**: Railway CLI (`railway up`).
- **Dashboard**: Vercel CLI (`vercel`).
- **Extension**: Local unpacked for MVP.
- **Database**: Supabase CLI for migrations.

**No CI/CD for MVP**: Direct CLI deploys. Validate builds locally first.

---

## Anti-Patterns (AVOID)

**Service Worker State:**
- NEVER rely on global variables in `background.ts`. They reset unpredictably.

**Race Conditions:**
- Avoid `await chrome.storage.local.get` immediately followed by `.set` without functional update pattern.

**Sensitive Data:**
- NEVER hardcode API keys/secrets in client code. Use environment variables.

**Any Type:**
- `any` is strictly banned in new code. Use `unknown` or proper types.

**AI Output Storage:**
- NEVER persist AI-generated content to backend storage. It must remain ephemeral (FR36, FR77).

**Blocking Async:**
- NEVER call synchronous blocking code in Python async functions.

---

## Naming Conventions

### Database (PostgreSQL)

| Element | Convention | Example |
|---------|------------|---------|
| Tables | `snake_case`, plural | `usage_events` |
| Columns | `snake_case` | `user_id`, `created_at` |
| Primary keys | `id` (UUID) | `id uuid primary key` |
| Foreign keys | `{table}_id` | `user_id`, `resume_id` |

### API Routes (FastAPI)

| Element | Convention | Example |
|---------|------------|---------|
| Base path | `/v1` prefix | `/v1/resumes` |
| Resources | plural, kebab-case | `/v1/usage-events` |
| Params | `{param}` | `/v1/jobs/{job_id}` |
| Query | `snake_case` | `?page_size=20` |

### Python Code

| Element | Convention | Example |
|---------|------------|---------|
| Files/modules | `snake_case` | `ai_service.py` |
| Classes | `PascalCase` | `ResumeService` |
| Functions | `snake_case` | `get_user_by_id` |
| Variables | `snake_case` | `user_id` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Pydantic models | `PascalCase` | `ResumeCreate` |

### TypeScript Code

| Element | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase` | `ResumeCard` |
| Files | `kebab-case` | `resume-card.tsx` |
| Functions | `camelCase` | `getUserById` |
| Variables | `camelCase` | `userId` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Types | `PascalCase` | `User`, `Job` |
| Hooks | `use` prefix | `useAuth` |
| Stores | `use...Store` | `useAuthStore` |

---

## API Response Format

**ALL API responses use the envelope pattern:**

```python
# Success
{"success": True, "data": {...}}

# Error
{"success": False, "error": {"code": "CREDIT_EXHAUSTED", "message": "..."}}

# Paginated List
{"success": True, "data": {"items": [...], "total": 42, "page": 1, "page_size": 20}}
```

**Response helpers (backend):**

```python
# app/models/base.py
def ok(data):
    return {"success": True, "data": data}

def error(code: str, message: str, details: dict | None = None):
    return {"success": False, "error": {"code": code, "message": message, "details": details}}

def paginated(items: list, total: int, page: int, page_size: int):
    return {"success": True, "data": {"items": items, "total": total, "page": page, "page_size": page_size}}
```

**Null fields:** Omit from response (don't include `null` values).

**Empty arrays:** Return `[]`, not `null`.

**Dates:** ISO 8601 format: `"2026-01-30T12:00:00Z"`

---

## Error Codes

| Code | HTTP | Message Example |
|------|------|-----------------|
| `AUTH_REQUIRED` | 401 | "Authentication required" |
| `INVALID_TOKEN` | 401 | "Invalid or expired token" |
| `CREDIT_EXHAUSTED` | 422 | "You've used all your credits. Upgrade to continue." |
| `RESUME_LIMIT_REACHED` | 422 | "Maximum 5 resumes allowed." |
| `RESUME_NOT_FOUND` | 404 | "Resume not found" |
| `JOB_NOT_FOUND` | 404 | "Job not found" |
| `SCAN_FAILED` | 422 | "Could not extract job details" |
| `AI_GENERATION_FAILED` | 500 | "AI generation failed. Please try again." |
| `AI_PROVIDER_UNAVAILABLE` | 503 | "AI service temporarily unavailable" |
| `VALIDATION_ERROR` | 400 | Dynamic based on field |
| `RATE_LIMITED` | 429 | "Too many requests" |

---

## State Management (Zustand)

### Store Domains

| Store | Persistence | Purpose |
|-------|-------------|---------|
| `auth-store` | `chrome.storage.local` | Session, user profile |
| `resume-store` | `chrome.storage.local` | Resume list, active resume |
| `job-store` | `chrome.storage.local` | Current scanned job |
| `scan-store` | Memory only | Scan state, extracted data |

### Persisted Store Pattern

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      signIn: async () => { /* ... */ },
      signOut: async () => { /* ... */ },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
```

### Immutable Updates

```typescript
// Correct
useJobStore.setState((state) => ({
  jobs: [...state.jobs, newJob],
}));

// Wrong - mutation
state.jobs.push(newJob);
```

---

## AI Provider Pattern

### Provider Interface

```python
# app/services/ai/provider.py
from abc import ABC, abstractmethod

class AIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        pass

class ClaudeProvider(AIProvider):
    async def generate(self, prompt: str, **kwargs) -> str:
        # Implementation
        pass

class OpenAIProvider(AIProvider):
    async def generate(self, prompt: str, **kwargs) -> str:
        # Implementation
        pass
```

### Fallback Logic

```python
async def generate_with_fallback(prompt: str, user_preference: str | None) -> str:
    provider = get_provider(user_preference)  # Claude or GPT based on preference

    try:
        return await provider.generate(prompt)
    except (TimeoutError, ServiceUnavailableError):
        if config.ai_fallback_enabled:
            fallback = get_fallback_provider(provider)
            return await fallback.generate(prompt)
        raise
```

---

## Usage Tracking

### Credit Check Query

```sql
SELECT COALESCE(SUM(credits_used), 0) as used
FROM usage_events
WHERE user_id = $1
  AND period_type = $2
  AND period_key = $3
```

### Recording Usage

```python
async def record_usage(
    user_id: str,
    operation_type: str,  # match, cover_letter, answer, outreach
    ai_provider: str,     # claude, gpt
    credits_used: int = 1
):
    tier = await get_user_tier(user_id)
    limits = await get_tier_limits(tier)
    period_type = limits["type"]  # lifetime, daily, monthly
    period_key = get_period_key(period_type)  # "lifetime", "2026-01-30", "2026-01"

    await db.insert("usage_events", {
        "user_id": user_id,
        "operation_type": operation_type,
        "ai_provider": ai_provider,
        "credits_used": credits_used,
        "period_type": period_type,
        "period_key": period_key,
    })
```

---

## MCP & CLI Tools

### When to Use MCPs

| MCP | When to Use |
|-----|-------------|
| **Sequential Thinking** | Planning multi-step implementations |
| **Serena** | Understanding codebase, safe symbol-based edits |
| **Tavily** | Researching solutions, debugging |
| **Context7** | Getting up-to-date library docs |
| **Supabase MCP** | Database operations, schema changes |

### CLI Commands

```bash
# Backend (from apps/api)
cd apps/api
uv sync                     # Install dependencies
uv run uvicorn app.main:app --reload --port 8000
uv run pytest               # Run tests
uv run ruff check .         # Lint

# Dashboard (from apps/web)
cd apps/web
pnpm dev                    # Dev server on :3000
pnpm build                  # Production build
pnpm test                   # Run tests

# Extension (from apps/extension)
cd apps/extension
pnpm dev                    # Dev mode with hot reload
pnpm build                  # Build for production

# Deployment
railway up                  # Deploy backend to Railway
vercel                      # Deploy dashboard to Vercel
supabase db push            # Apply migrations
supabase gen types          # Generate TypeScript types
```

---

## File Structure Reference

```
jobswyft/
├── apps/
│   ├── api/                        # FastAPI Backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── core/               # Config, deps, security
│   │   │   ├── models/             # Pydantic models
│   │   │   ├── routers/            # API routes
│   │   │   ├── services/           # Business logic
│   │   │   │   └── ai/             # AI provider implementations
│   │   │   └── db/                 # Supabase client
│   │   └── tests/
│   │
│   ├── web/                        # Next.js Dashboard
│   │   └── src/
│   │       ├── app/                # App Router pages
│   │       ├── components/         # UI components
│   │       ├── lib/                # Utilities
│   │       └── hooks/              # Custom hooks
│   │
│   └── extension/                  # WXT Extension
│       └── src/
│           ├── entrypoints/        # popup, content, background
│           ├── components/         # UI components
│           ├── stores/             # Zustand stores
│           ├── lib/                # scanner, autofill, api
│           └── hooks/              # Custom hooks
│
├── packages/
│   └── types/                      # Shared TypeScript types
│
├── specs/
│   └── openapi.yaml                # API contract
│
└── supabase/
    └── migrations/                 # SQL migrations
```

---

## Usage Guidelines

**For AI Agents:**

- Read this file AND `architecture.md` before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Check `global_config` table for runtime configuration values

**First Implementation Steps:**

1. Initialize monorepo with pnpm workspaces
2. Set up Supabase project and run migrations
3. Build FastAPI skeleton with all routers
4. Deploy to Railway to validate setup

---

Last Updated: 2026-01-30
