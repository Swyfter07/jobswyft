# Project Structure & Boundaries

## Complete Project Directory Structure

```
jobswyft/
├── package.json                        # pnpm workspace root
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── CLAUDE.md                           # AI agent instructions
├── README.md
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci-api.yml                  ← NEW (ADR-REV-I4)
│       ├── ci-extension.yml            ← NEW (ADR-REV-I4)
│       ├── ci-ui.yml                   ← NEW (ADR-REV-I4)
│       ├── ci-integration.yml          ← NEW (ADR-REV-I4)
│       └── config-validate.yml         ← NEW (ADR-REV-I1)
├── configs/                            ← NEW (ADR-REV-SE4, PATTERN-SE1)
│   └── sites/
│       ├── _schema.json                ← NEW (Zod source schema for CI validation)
│       ├── greenhouse.io.json          ← NEW (site config)
│       ├── lever.co.json               ← NEW
│       ├── workday.com.json            ← NEW
│       ├── icims.com.json              ← NEW
│       └── ...                         # One file per ATS domain
│
├── apps/
│   ├── api/
│   │   ├── pyproject.toml
│   │   ├── .env / .env.example
│   │   └── app/
│   │       ├── __init__.py
│   │       ├── main.py
│   │       ├── core/
│   │       │   ├── config.py
│   │       │   ├── deps.py
│   │       │   ├── exceptions.py
│   │       │   └── security.py
│   │       ├── db/
│   │       │   ├── client.py
│   │       │   └── queries.py
│   │       ├── models/
│   │       │   ├── ai.py
│   │       │   ├── auth.py
│   │       │   ├── autofill.py
│   │       │   ├── base.py
│   │       │   ├── feedback.py
│   │       │   ├── job.py
│   │       │   ├── privacy.py
│   │       │   ├── resume.py
│   │       │   ├── subscriptions.py
│   │       │   ├── usage.py
│   │       │   ├── telemetry.py         ← NEW (ADR-REV-A1)
│   │       │   └── site_config.py       ← NEW (ADR-REV-A2)
│   │       ├── routers/
│   │       │   ├── ai.py
│   │       │   ├── auth.py
│   │       │   ├── autofill.py
│   │       │   ├── feedback.py
│   │       │   ├── jobs.py
│   │       │   ├── privacy.py
│   │       │   ├── resumes.py
│   │       │   ├── subscriptions.py
│   │       │   ├── usage.py
│   │       │   ├── webhooks.py
│   │       │   ├── telemetry.py         ← NEW (ADR-REV-A1: POST /v1/telemetry/batch)
│   │       │   └── configs.py           ← NEW (ADR-REV-A2: GET /v1/configs/sites)
│   │       └── services/
│   │           ├── ai/
│   │           │   ├── claude.py
│   │           │   ├── factory.py
│   │           │   ├── openai.py
│   │           │   ├── prompts.py
│   │           │   ├── provider.py
│   │           │   └── circuit_breaker.py   ← NEW (ADR-REV-A3)
│   │           ├── answer_service.py
│   │           ├── auth_service.py
│   │           ├── autofill_service.py
│   │           ├── coach_service.py
│   │           ├── cover_letter_service.py
│   │           ├── extract_job_service.py
│   │           ├── feedback_service.py
│   │           ├── job_service.py
│   │           ├── match_service.py
│   │           ├── outreach_service.py
│   │           ├── pdf_parser.py
│   │           ├── pdf_service.py
│   │           ├── privacy_service.py
│   │           ├── resume_service.py
│   │           ├── stripe_service.py
│   │           ├── usage_service.py
│   │           ├── telemetry_service.py     ← NEW (batch processing, health aggregation)
│   │           ├── config_service.py        ← NEW (config serving, delta sync, fast-path)
│   │           └── alert_service.py         ← NEW (ADR-REV-I3: health alerts)
│   │
│   ├── extension/
│   │   ├── package.json
│   │   ├── wxt.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── styles/
│   │       │   └── app.css
│   │       ├── entrypoints/
│   │       │   ├── background/
│   │       │   │   └── index.ts
│   │       │   ├── content-sentinel.content.ts
│   │       │   └── sidepanel/
│   │       │       ├── index.html
│   │       │       └── main.tsx
│   │       ├── components/
│   │       │   ├── sidebar-app.tsx
│   │       │   ├── authenticated-layout.tsx
│   │       │   ├── ai-studio-tab.tsx
│   │       │   ├── autofill-tab.tsx
│   │       │   ├── coach-tab.tsx
│   │       │   ├── error-boundary.tsx
│   │       │   ├── resume-detail-view.tsx
│   │       │   ├── settings-dialog.tsx
│   │       │   ├── toast-context.tsx
│   │       │   └── picker/                  ← NEW (ADR-REV-EX3)
│   │       │       ├── picker-overlay.tsx    ← NEW (highlight injection)
│   │       │       └── picker-panel.tsx      ← NEW (side panel controls)
│   │       ├── features/
│   │       │   ├── autofill/
│   │       │   │   ├── ats-detector.ts
│   │       │   │   ├── autofill-data-service.ts
│   │       │   │   ├── field-detector.ts
│   │       │   │   ├── field-filler.ts
│   │       │   │   ├── field-registry.ts
│   │       │   │   ├── field-types.ts
│   │       │   │   ├── resume-uploader.ts
│   │       │   │   ├── signal-weights.ts
│   │       │   │   └── __tests__/
│   │       │   ├── scanning/
│   │       │   │   ├── job-detector.ts
│   │       │   │   ├── scanner.ts
│   │       │   │   ├── selector-registry.ts
│   │       │   │   ├── extraction-validator.ts
│   │       │   │   ├── frame-aggregator.ts
│   │       │   │   ├── html-cleaner.ts
│   │       │   │   └── *.test.ts
│   │       │   └── engine/                  ← NEW (Smart Engine core)
│   │       │       ├── extraction-pipeline.ts   ← NEW (ADR-REV-SE1)
│   │       │       ├── confidence-scorer.ts     ← NEW (ADR-REV-SE2)
│   │       │       ├── selector-health.ts       ← NEW (ADR-REV-SE3)
│   │       │       ├── heuristic-repair.ts      ← NEW (ADR-REV-SE3)
│   │       │       ├── config-loader.ts         ← NEW (ADR-REV-D1, I2)
│   │       │       ├── config-schema.ts         ← NEW (ADR-REV-D3)
│   │       │       ├── extraction-trace.ts      ← NEW (ADR-REV-D2)
│   │       │       ├── dom-readiness.ts         ← NEW (ADR-REV-EX2)
│   │       │       ├── constants.ts             ← NEW (thresholds)
│   │       │       └── __tests__/               ← NEW
│   │       ├── lib/
│   │       │   ├── api-client.ts
│   │       │   ├── auth.ts
│   │       │   ├── chrome-storage-adapter.ts
│   │       │   ├── constants.ts
│   │       │   ├── storage.ts
│   │       │   └── message-types.ts         ← NEW (PATTERN-SE2)
│   │       ├── stores/
│   │       │   ├── core-store.ts            ← NEW (PATTERN-SE7)
│   │       │   ├── auth-store.ts
│   │       │   ├── autofill-store.ts
│   │       │   ├── scan-store.ts
│   │       │   ├── config-store.ts          ← NEW (PATTERN-SE7)
│   │       │   ├── telemetry-store.ts       ← NEW (PATTERN-SE7)
│   │       │   ├── credits-store.ts
│   │       │   ├── resume-store.ts
│   │       │   ├── settings-store.ts
│   │       │   ├── sidebar-store.ts
│   │       │   ├── theme-store.ts
│   │       │   └── *.test.ts
│   │       └── types/                       ← NEW
│   │           ├── async-state.ts           ← NEW (PATTERN-SE8)
│   │           ├── site-config.ts           ← NEW
│   │           ├── telemetry.ts             ← NEW
│   │           └── extraction.ts            ← NEW
│   │
│   └── web/                                # Scaffolded, not yet initialized
│       └── README.md
│
├── packages/
│   └── ui/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── .storybook/
│       └── src/
│           ├── index.ts
│           ├── styles/
│           │   └── globals.css
│           ├── hooks/
│           │   └── use-clipboard.ts
│           ├── lib/
│           │   ├── api-types.ts
│           │   ├── mappers.ts
│           │   ├── mappers.test.ts
│           │   ├── utils.ts
│           │   └── utils.test.ts
│           └── components/
│               ├── ui/                      # shadcn primitives
│               ├── blocks/                  # reusable domain blocks
│               ├── custom/                  # domain compositions
│               ├── features/                # feature-level components
│               ├── layout/                  # structural
│               └── _reference/              # future feature references
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 00001_create_profiles.sql
│       ├── ...
│       ├── 20260131213733_add_status_check_constraint.sql
│       ├── NNNNN_create_telemetry_events.sql    ← NEW (ADR-REV-A1)
│       ├── NNNNN_create_site_configs.sql         ← NEW (ADR-REV-A2)
│       └── NNNNN_create_selector_health.sql      ← NEW (ADR-REV-I3)
│
├── specs/
│   └── openapi.yaml                        # API contract (source of truth)
│
├── docs/                                   # Generated project documentation
│   ├── index.md
│   └── ... (11 doc files)
│
└── _bmad-output/                           # Planning & implementation artifacts
    ├── planning-artifacts/
    └── implementation-artifacts/
```

## Architectural Boundaries

**API Boundaries:**
- External: REST endpoints via FastAPI routers (`/v1/auth/*`, `/v1/resumes/*`, `/v1/jobs/*`, `/v1/ai/*`, `/v1/autofill/*`, `/v1/telemetry/*` ← NEW, `/v1/configs/*` ← NEW)
- Auth boundary: `core/security.py` + `core/deps.py` → JWT validation on all protected routes
- Data access: `db/client.py` + `db/queries.py` → all Supabase access through this layer
- AI boundary: `services/ai/` → provider abstraction with circuit breaker; no direct AI calls from routers

**Extension Context Boundaries:**
- **Content Script** (`content-sentinel.content.ts`) — DOM access only. Reads page, injects picker overlay. No direct API calls. Communicates via typed messages (PATTERN-SE2).
- **Background** (`entrypoints/background/`) — Chrome API orchestrator. Handles message routing, config sync, telemetry batching. No DOM access.
- **Side Panel** (`entrypoints/sidepanel/`) — React UI. Reads from Zustand stores. Dispatches typed commands to background. No direct DOM or Chrome API calls (except storage).
- **Stores** bridge all three contexts via `chrome.storage` sync (ADR-REV-EX1)

**Smart Engine Boundaries:**
- `features/engine/` — Pure functional core (hexagonal). No Chrome APIs, no DOM access. Testable in Node/Vitest.
- `features/scanning/` — DOM reader. Uses engine functions for extraction logic.
- `features/autofill/` — DOM writer. Uses engine functions for field mapping/filling.
- `configs/sites/` — Data only. No code. Validated by Zod schema at build time (CI) and runtime (config-loader).

**Data Boundaries:**
- Supabase PostgreSQL — all tables accessed via `db/` layer
- Chrome storage — extension-local state (stores, config cache, health data)
- In-memory — extraction traces during active session
- Config boundary: static configs (shipped + synced) vs runtime health (local-only)

## Requirements to Structure Mapping

**Scanning Engine** (FR: job detection, field extraction)
→ `features/scanning/` + `features/engine/` + `stores/scan-store.ts`

**Autofill Engine** (FR: form filling, resume upload)
→ `features/autofill/` + `features/engine/` + `stores/autofill-store.ts`

**Config-Driven Site Support** (ADR-REV-SE4)
→ `configs/sites/` + `features/engine/config-loader.ts` + `stores/config-store.ts` + `api/routers/configs.py`

**Selector Health & Self-Healing** (ADR-REV-SE3, I3)
→ `features/engine/selector-health.ts` + `features/engine/heuristic-repair.ts` + `api/services/telemetry_service.py` + `api/services/alert_service.py`

**Correction Feedback Loop** (ADR-REV-EX4)
→ `components/picker/` + `features/engine/extraction-trace.ts` + `stores/telemetry-store.ts` + `api/routers/telemetry.py`

**Telemetry Pipeline** (ADR-REV-A1)
→ `stores/telemetry-store.ts` (buffer) → `lib/api-client.ts` (batch POST) → `api/routers/telemetry.py` → `api/services/telemetry_service.py` → Supabase

**Auth Flow** (cross-cutting)
→ `lib/auth.ts` + `stores/auth-store.ts` (extension) | `api/core/security.py` + `api/services/auth_service.py` (API)

**Resume Management** (FR: upload, parse, edit)
→ `api/services/resume_service.py` + `api/services/pdf_parser.py` + `packages/ui/components/features/resume/`

**AI Services** (FR: matching, autofill data, coaching)
→ `api/services/ai/` (provider abstraction + circuit breaker) + `api/services/match_service.py` + `api/services/coach_service.py`

## Integration Points

**Internal Communication:**
- Extension ↔ API: REST via `lib/api-client.ts` (authenticated with Supabase JWT)
- Content Script ↔ Background: Typed messages via `chrome.runtime` (PATTERN-SE2)
- Background ↔ Side Panel: Zustand stores synced via `chrome.storage` (ADR-REV-EX1)
- Config sync: `config-store.ts` → `api-client.ts` → `api/routers/configs.py` (pull + Supabase Realtime push)

**External Integrations:**
- Supabase Auth (login, session management)
- Supabase Realtime (config push notifications)
- Anthropic API (primary AI provider)
- OpenAI API (secondary AI provider / fallback)
- Stripe (subscription management)
- Chrome Web Store (extension distribution)

**Data Flow:**
1. **Detection:** Content Sentinel (DOM) → `dom-readiness.ts` → `job-detector.ts` → `scan-store.ts` → Side Panel UI
2. **Extraction:** `scanner.ts` → `extraction-pipeline.ts` → `confidence-scorer.ts` → `extraction-trace.ts` → `scan-store.ts`
3. **Autofill:** Side Panel trigger → `autofill-store.ts` → `field-detector.ts` → `field-filler.ts` → DOM writes
4. **Telemetry:** `extraction-trace.ts` → `telemetry-store.ts` (buffer) → batch POST → API → Supabase
5. **Config Sync:** API push notification → `config-store.ts` → delta pull → `config-loader.ts` → Zod validate → chrome.storage
6. **Self-Healing:** Low health score → `heuristic-repair.ts` → repair attempt → success? → propose new selector → telemetry → API → config pipeline
