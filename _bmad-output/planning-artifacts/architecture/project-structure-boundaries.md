# Project Structure & Boundaries

## Complete Project Directory Structure

```
jobswyft/
├── README.md
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .gitignore
├── .env.example
│
├── specs/
│   └── openapi.yaml                # API contract (source of truth)
│
├── packages/
│   ├── ui/                         # Shared component library (shadcn/ui + Tailwind v4)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts          # Library build + @tailwindcss/vite plugin
│   │   ├── components.json         # shadcn CLI config (radix-nova, stone/amber)
│   │   ├── .storybook/
│   │   │   ├── main.ts
│   │   │   └── preview.tsx         # Theme switcher, viewport presets
│   │   ├── src/
│   │   │   ├── index.ts            # Public exports (components + cn utility)
│   │   │   ├── styles/
│   │   │   │   └── globals.css     # ALL design tokens (OKLCH), @theme inline, base
│   │   │   ├── lib/
│   │   │   │   ├── utils.ts        # cn() utility (clsx + tailwind-merge)
│   │   │   │   └── utils.test.ts
│   │   │   ├── hooks/              # Shared UI hooks (future)
│   │   │   └── components/
│   │   │       ├── ui/             # shadcn primitives (installed via CLI)
│   │   │       │   ├── button.tsx  # + *.stories.tsx for each
│   │   │       │   ├── badge.tsx
│   │   │       │   ├── card.tsx
│   │   │       │   ├── input.tsx
│   │   │       │   ├── select.tsx
│   │   │       │   ├── dialog.tsx
│   │   │       │   └── tabs.tsx
│   │   │       └── custom/         # Domain-specific compositions
│   │   │           ├── job-card.tsx
│   │   │           ├── resume-card.tsx
│   │   │           ├── app-header.tsx
│   │   │           ├── credit-bar.tsx
│   │   │           ├── logged-out-view.tsx
│   │   │           ├── ai-studio.tsx
│   │   │           ├── autofill.tsx
│   │   │           ├── coach.tsx
│   │   │           ├── animated-match-score.tsx
│   │   │           ├── sequential-autofill.tsx
│   │   │           ├── card-accent-footer.tsx
│   │   │           ├── state-transition.tsx
│   │   │           ├── icon-badge.tsx
│   │   │           ├── skill-pill.tsx
│   │   │           ├── skill-section-label.tsx
│   │   │           ├── match-indicator.tsx
│   │   │           └── extension-sidebar.tsx
│   │   └── dist/                   # Built output (~20KB ESM, deps externalized)
│   │
│   └── types/                      # Shared TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── api.ts              # Generated from OpenAPI
│           ├── models.ts
│           └── errors.ts           # Error code enums
│
├── apps/
│   ├── api/                        # FastAPI Backend
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   ├── .env.example
│   │   ├── .python-version
│   │   ├── README.md
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── deps.py
│   │   │   │   ├── security.py
│   │   │   │   └── exceptions.py
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── resume.py
│   │   │   │   ├── job.py
│   │   │   │   ├── usage.py
│   │   │   │   └── feedback.py
│   │   │   ├── routers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── resumes.py
│   │   │   │   ├── jobs.py
│   │   │   │   ├── ai.py
│   │   │   │   ├── usage.py
│   │   │   │   └── feedback.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth_service.py
│   │   │   │   ├── resume_service.py
│   │   │   │   ├── job_service.py
│   │   │   │   ├── usage_service.py
│   │   │   │   ├── feedback_service.py
│   │   │   │   └── ai/
│   │   │   │       ├── __init__.py
│   │   │   │       ├── provider.py
│   │   │   │       ├── claude.py
│   │   │   │       ├── openai.py
│   │   │   │       └── prompts.py
│   │   │   └── db/
│   │   │       ├── __init__.py
│   │   │       ├── client.py
│   │   │       └── queries.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py
│   │       ├── test_auth.py
│   │       ├── test_resumes.py
│   │       ├── test_jobs.py
│   │       ├── test_ai.py
│   │       └── test_usage.py
│   │
│   ├── web/                        # Next.js Dashboard
│   │   ├── package.json            # Depends on @jobswyft/ui
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── .env.example
│   │   ├── README.md
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx      # Imports @jobswyft/ui/styles
│   │       │   ├── page.tsx
│   │       │   ├── globals.css     # Minimal - app-specific overrides only
│   │       │   ├── (auth)/
│   │       │   │   ├── login/page.tsx
│   │       │   │   └── callback/page.tsx
│   │       │   ├── (dashboard)/
│   │       │   │   ├── layout.tsx  # Uses DashboardLayout from @jobswyft/ui
│   │       │   │   ├── jobs/page.tsx
│   │       │   │   ├── resumes/page.tsx
│   │       │   │   ├── account/page.tsx
│   │       │   │   └── privacy/page.tsx
│   │       │   └── api/
│   │       │       └── auth/
│   │       │           └── callback/route.ts
│   │       ├── components/         # App-specific compositions only
│   │       │   └── pages/          # Page-level component compositions
│   │       │       ├── jobs-page.tsx
│   │       │       ├── resumes-page.tsx
│   │       │       └── account-page.tsx
│   │       ├── lib/
│   │       │   ├── api-client.ts
│   │       │   └── supabase.ts
│   │       └── hooks/
│   │           ├── use-auth.ts
│   │           ├── use-jobs.ts
│   │           └── use-resumes.ts
│   │
│   └── extension/                  # WXT Chrome Extension (Side Panel)
│       ├── package.json            # Depends on @jobswyft/ui
│       ├── tsconfig.json
│       ├── wxt.config.ts
│       ├── .env.example
│       ├── README.md
│       └── src/
│           ├── entrypoints/
│           │   ├── sidepanel/
│           │   │   ├── index.html
│           │   │   ├── main.tsx    # Imports @jobswyft/ui/styles
│           │   │   └── App.tsx     # Uses ExtensionSidebar from @jobswyft/ui
│           │   ├── content/
│           │   │   └── index.ts    # DOM extraction for autofill + job scanning
│           │   └── background/
│           │       └── index.ts    # Side Panel API, Tabs API (URL change detection)
│           ├── features/           # Extension-specific business logic
│           │   ├── scanning/
│           │   │   ├── scanner.ts
│           │   │   └── job-detector.ts
│           │   ├── autofill/
│           │   │   └── autofill.ts
│           │   └── ai-tools/
│           │       └── ai-tool-handlers.ts
│           ├── stores/
│           │   ├── auth-store.ts
│           │   ├── resume-store.ts
│           │   ├── job-store.ts
│           │   └── scan-store.ts
│           ├── lib/
│           │   ├── api-client.ts
│           │   └── supabase.ts
│           └── hooks/
│               ├── use-auth.ts
│               ├── use-scan.ts
│               └── use-ai-generation.ts
│
└── supabase/
    ├── config.toml
    └── migrations/
        ├── 00001_create_profiles.sql
        ├── 00002_create_resumes.sql
        ├── 00003_create_jobs.sql
        ├── 00004_create_usage_events.sql
        ├── 00005_create_global_config.sql
        ├── 00006_create_feedback.sql
        └── 00007_create_rls_policies.sql
```

## Architectural Boundaries

### API Boundaries

| Endpoint Group | Router File | Service |
|----------------|-------------|---------|
| `/v1/auth/*` | `routers/auth.py` | `auth_service.py` |
| `/v1/resumes/*` | `routers/resumes.py` | `resume_service.py` |
| `/v1/jobs/*` | `routers/jobs.py` | `job_service.py` |
| `/v1/ai/match` | `routers/ai.py` | `ai/provider.py` — JSON response |
| `/v1/ai/cover-letter` | `routers/ai.py` | `ai/provider.py` — SSE streaming |
| `/v1/ai/outreach` | `routers/ai.py` | `ai/provider.py` — SSE streaming |
| `/v1/ai/chat` | `routers/ai.py` | `ai/provider.py` — SSE streaming (conversational, Coach tab) |
| `/v1/ai/resume-parse` | `routers/ai.py` | `ai/provider.py` — JSON response |
| `/v1/usage/*` | `routers/usage.py` | `usage_service.py` |
| `/v1/feedback/*` | `routers/feedback.py` | `feedback_service.py` |

### Component Communication

```
Extension (Side Panel)       API                      Database
┌─────────────┐             ┌─────────────┐          ┌──────────┐
│ Zustand     │──HTTP/JSON──│ FastAPI     │──SQL────▶│ Supabase │
│ Stores      │──SSE───────▶│ Routers     │          │ Postgres │
└─────────────┘             └─────────────┘          └──────────┘
       │                           │
       │                    ┌──────┴──────┐
       │                    │ AI Services │
       │                    └──────┬──────┘
       │                    ┌──────┴──────┐
       │                    │ Claude/GPT  │ ← streaming responses
       │                    └─────────────┘

Dashboard                   API
┌─────────────┐             ┌─────────────┐
│ React Query │──HTTP/JSON──│ FastAPI     │
│ + Hooks     │             │ Routers     │
└─────────────┘             └─────────────┘
```

**Protocol Note:** AI generation endpoints (`cover-letter`, `outreach`, `chat`) use SSE (`text/event-stream`). All other endpoints use standard JSON request/response.

## Requirements to Structure Mapping

### By PRD Feature Area

| Feature | API | Web | Extension (Side Panel) |
|---------|-----|-----|-----------|
| Auth (FR1-6) | `routers/auth.py` | `(auth)/` pages | `stores/auth-store.ts`, `<LoggedOutView>` |
| Resumes (FR7-13) | `routers/resumes.py` | `resumes/` page | `<ResumeCard>`, resume-store |
| Scanning (FR14-22) | - | - | `features/scanning/`, `<JobCard>`, auto-scan on URL change |
| AI Match (FR23-25) | `routers/ai.py` (JSON) | - | `<AnimatedMatchScore>`, Scan tab |
| AI Cover Letter (FR26-30) | `routers/ai.py` (SSE streaming) | - | `<AIStudio>` → Cover Letter sub-tab |
| AI Chat (FR31-34) | `routers/ai.py` (SSE streaming) | - | `<AIStudio>` → Chat sub-tab |
| AI Outreach (FR35-38) | `routers/ai.py` (SSE streaming) | - | `<AIStudio>` → Outreach sub-tab |
| Coach | `routers/ai.py` (SSE streaming) | - | `<Coach>` tab, conversational AI with job+resume context |
| Autofill (FR39-44) | - | - | `<Autofill>`, `<SequentialAutofill>`, `features/autofill/` |
| Job Tracking (FR45-53) | `routers/jobs.py` | `jobs/` page | `stores/job-store.ts` |
| Usage (FR54-61) | `routers/usage.py` | `account/` page | `<CreditBar>` in sidebar footer |
| Feedback (FR78-80) | `routers/feedback.py` | TBD | TBD |

### Cross-Cutting Concerns

| Concern | Location |
|---------|----------|
| API Response Envelope | `app/models/base.py` |
| Error Codes | `app/core/exceptions.py`, `packages/types/errors.ts` |
| Auth Middleware | `app/core/security.py`, `app/core/deps.py` |
| Supabase Client | `app/db/client.py`, `*/lib/supabase.ts` |
| API Client (TS) | `packages/types/`, `*/lib/api-client.ts` |

## External Service Integration Points

| Service | Integration Point | Config Location |
|---------|-------------------|-----------------|
| Supabase Auth | `app/core/security.py` | `SUPABASE_URL`, `SUPABASE_KEY` |
| Supabase DB | `app/db/client.py` | Same as above |
| Supabase Storage | `resume_service.py` | Same as above |
| Claude API | `services/ai/claude.py` | `ANTHROPIC_API_KEY` |
| OpenAI API | `services/ai/openai.py` | `OPENAI_API_KEY` |
| Stripe | `routers/usage.py` (webhooks) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

---
