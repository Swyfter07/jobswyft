---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-13'
inputDocuments:
  - _bmad-output/planning-artifacts/prd/index.md
  - _bmad-output/planning-artifacts/prd/executive-summary.md
  - _bmad-output/planning-artifacts/prd/product-scope.md
  - _bmad-output/planning-artifacts/prd/user-journeys.md
  - _bmad-output/planning-artifacts/prd/multi-surface-product-requirements.md
  - _bmad-output/planning-artifacts/prd/functional-requirements.md
  - _bmad-output/planning-artifacts/prd/non-functional-requirements.md
  - _bmad-output/planning-artifacts/prd/success-criteria.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/research/technical-smart-engine-detection-autofill-research-2026-02-13.md
  - _bmad-output/planning-artifacts/project-context.md
  - _bmad-output/planning-artifacts/architecture/index.md
  - _bmad-output/planning-artifacts/architecture/architecture-completion-summary.md
  - _bmad-output/planning-artifacts/architecture/architecture-validation-results.md
  - _bmad-output/planning-artifacts/architecture/core-engine-architecture.md
  - _bmad-output/planning-artifacts/architecture/scan-engine-architecture.md
  - _bmad-output/planning-artifacts/architecture/ui-package-architecture-shadcnui-tailwind-v4.md
  - _bmad-output/planning-artifacts/smart-engine-architecture.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture-patterns.md
  - docs/technology-stack.md
  - docs/source-tree-analysis.md
  - docs/component-inventory-ui.md
  - docs/development-guide.md
  - docs/deployment-guide.md
  - docs/api-contracts-api.md
  - docs/data-models-api.md
  - docs/integration-architecture.md
  - docs/autofill-scanning-engine.md
workflowType: 'architecture'
workflowMode: 'revision'
project_name: 'jobswyft-docs'
user_name: 'jobswyft'
date: '2026-02-13'
existingArchitecture: '_bmad-output/planning-artifacts/architecture/'
---

# Architecture Decision Document — Revision

_This document builds collaboratively through step-by-step discovery. This is a **revision** of the existing architecture completed on 2026-01-30, incorporating new inputs (Smart Engine vision, technical research, implementation learnings)._

## Revision Context

**Original Architecture:** Completed 2026-01-30 (8 steps, all validated)
**New Inputs Since Original:**
- Smart Engine Architecture Vision (2026-02-13)
- Technical Research: Detection & Autofill Patterns (2026-02-13)
- Core Engine Architecture addendum (2026-02-08)
- Scan Engine Architecture addendum (2026-02-08)
- Implementation experience from EXT-5, EXT-5.5 stories
- UX Design Specification (2026-02-07)

**Revision Goal:** Update architectural decisions to reflect implementation learnings, incorporate Smart Engine vision, and align with the latest research findings.

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
85 FRs spanning three surfaces:
- **Extension (primary):** Job detection on 20+ ATS platforms, field extraction with confidence scoring, sequential autofill with field-by-field visualization, resume selection, match scoring display, application tracking, four-state progressive UI
- **Web Dashboard:** Resume management (upload/parse/edit, max 5), application history with analytics, job match review, account settings
- **API Backend:** AI-powered resume parsing & matching, autofill data generation, application state persistence, usage tracking, Supabase auth integration

**Non-Functional Requirements:**
44 NFRs driving architectural decisions:
- **Performance:** Detection < 500ms, autofill < 2s, extension bundle < 5MB, side panel render < 200ms
- **Security:** JWT auth (Supabase), encrypted storage, GDPR-compliant data handling, content script isolation
- **Reliability:** Graceful degradation (offline mode, no-AI fallback), extraction retry with escalation
- **Accessibility:** WCAG 2.1 AA across all surfaces
- **Maintainability:** Config-driven site support, selector health tracking, extraction audit trail

**Scale & Complexity:**

- Primary domain: Full-stack with Chrome extension specialization
- Complexity level: HIGH
- Estimated architectural components: 15-20 major modules (detection engine, extraction pipeline, autofill engine, selector registry, config sync, content sentinel, side panel UI, web dashboard, API services, auth layer, telemetry, storage adapters, AI integration, resume parser, match engine)

### Technical Constraints & Dependencies

- **Chrome MV3:** Service worker lifecycle, content script sandboxing, message passing APIs, storage quotas
- **400px Side Panel:** All extension UI must fit within constrained viewport
- **Supabase:** Auth provider, PostgreSQL database, Edge Functions, real-time subscriptions
- **ATS Platform Diversity:** No standardized DOM structure; each platform requires distinct selectors/strategies
- **Bundle Size:** Extension must remain performant; heavy AI libraries must be API-side
- **Content Security Policy:** Extension CSP restricts inline scripts, eval, and external resource loading

### Cross-Cutting Concerns Identified

1. **Authentication & Session Management** — Supabase JWT flows across extension (background ↔ content script ↔ side panel), web (Next.js middleware), and API (FastAPI dependency injection)
2. **State Synchronization** — Extension local state (Zustand) ↔ API persistence ↔ Web dashboard views; conflict resolution for offline-to-online transitions
3. **Error Handling & Degradation** — Layered fallback strategy: cached configs → local extraction → degraded UI states; error boundaries per surface
4. **Telemetry & Observability** — Extraction success/failure rates, selector health metrics, autofill completion tracking, API latency monitoring
5. **Config Management** — Site selector configs (JSON), feature flags, remote sync with delta updates, versioned config schema
6. **Security Boundaries** — Content script isolation, CSP compliance, credential handling, PII minimization in telemetry

### Revision Delta (New Since 2026-01-30)

| Input | Architectural Impact |
|-------|---------------------|
| Smart Engine Vision | Unifies scan + autofill into shared core engine; introduces capability layers L0-L4 |
| Technical Research | Validates hexagonal architecture; adds self-healing selectors, Similo-inspired confidence scoring |
| Core Engine Addendum | Defines selector registry, extraction trace, element picker, correction feedback loop |
| Scan Engine Addendum | Refines 5-layer extraction pipeline, content sentinel, delayed verification |
| UX Design Spec | Constrains UI architecture: 400px panel, four-state unlock, functional area colors |
| EXT-5/5.5 Learnings | Real implementation feedback on detection timing, DOM readiness, state management |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack monorepo with Chrome extension specialization — established and actively developed.

### Starter Options Considered

This is a **brownfield revision**. All primary starters were selected during original architecture (2026-01-30) and remain current. No starter changes recommended.

### Selected Stack (Confirmed)

**Rationale:** All frameworks are actively maintained with recent releases. Version audit shows no critical gaps. The existing starter choices align well with Smart Engine requirements.

| Surface | Framework | Version | Notes |
|---------|-----------|---------|-------|
| Extension | WXT + React 19 + Zustand 5 | ^0.20.13 | MV3 abstractions, HMR |
| UI Library | Vite 7 + shadcn/ui 3 + Tailwind 4 + Storybook 10 | Current | Shared component system |
| API | FastAPI + uv + Supabase | >=0.128.0 | Python 3.11+, dual AI providers |
| Web | Next.js (scaffolded, not yet initialized) | TBD | Dashboard surface pending |
| Monorepo | pnpm workspaces | — | Cross-package linking |

### Architectural Decisions Provided by Starters

**Language & Runtime:** TypeScript 5.7 (extension/UI/web), Python 3.11+ (API)
**Styling:** Tailwind v4 + OKLCH design tokens via globals.css, shadcn/ui primitives
**Build Tooling:** Vite 7 (UI lib), WXT/Vite (extension), uv (API)
**Testing:** Vitest 3 (TypeScript surfaces), Pytest 8 (API)
**State Management:** Zustand 5 (extension), server state via Supabase
**Code Organization:** Monorepo with `apps/` (surfaces) + `packages/` (shared libraries)

### Gaps for Smart Engine Evolution

1. **Web Dashboard initialization** — `apps/web/` needs Next.js scaffold when dashboard stories begin
2. **Extension E2E testing** — Consider Playwright with Chrome extension support for integration testing
3. **Config schema validation** — Zod/Ajv for runtime validation of selector registry and site configs
4. **Real-time config push** — Lightweight SSE/WebSocket client if server-driven config sync adopted

**Note:** These gaps are non-blocking for current development and can be addressed incrementally as Smart Engine stories progress.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Selector Registry Storage (Hybrid: shipped defaults + API delta sync)
- Extraction Pipeline Escalation (Config hints + confidence threshold)
- Config-Driven Site Support (Config with escape hatches)
- Content Script Communication (Zustand state + typed messages for commands)
- Extension Update vs Config Update Separation (Bundled defaults + runtime overlay)

**Important Decisions (Shape Architecture):**
- Confidence Scoring (Weighted multi-signal, Similo-inspired)
- Self-Healing Selectors (Fallback chain + heuristic repair)
- DOM Readiness Detection (Multi-signal with config hints)
- Correction Feedback Loop (Local + telemetry + auto-propose)
- AI Fallback Orchestration (Provider abstraction + circuit breaker)
- Config Sync API (Pull with push notification)
- Telemetry Ingestion (Fire-and-forget batch endpoint)

**Deferred Decisions (Post-MVP):**
- ML-based confidence scoring (collect data first via weighted multi-signal)
- Task-based AI provider routing (collect usage data first via circuit breaker)
- Admin dashboard for config authoring (git-managed with fast-path sufficient for MVP)

### Data Architecture

**ADR-REV-D1: Selector Registry Storage — Hybrid**
- Decision: Ship base selectors with extension, sync health updates and new selectors from API via delta sync
- Rationale: Offline resilience with cross-user learning; aligns with Honey's server-driven config pattern
- Affects: Extension storage layer, API config endpoints, config pipeline

**ADR-REV-D2: Extraction Trace Storage — Local + Telemetry**
- Decision: Persist recent traces in local storage (rotation policy) for user-facing correction UI; ship anonymized traces to API for aggregate selector health analysis
- Rationale: Enables both immediate user feedback workflows and data-driven selector improvements
- Affects: Extension storage, telemetry pipeline, API ingestion, privacy policy

**ADR-REV-D3: Site Config Schema — Versioned JSON with Zod**
- Decision: Versioned JSON configs with Zod runtime validation and migration functions between versions
- Rationale: Type-safe configs that survive remote sync; version field enables graceful migration when schema evolves
- Affects: Config authoring, extension config loader, API config endpoints

### Smart Engine Architecture

**ADR-REV-SE1: Extraction Pipeline Escalation — Hybrid Config + Confidence**
- Decision: Site configs hint the optimal starting layer; confidence-threshold escalation determines when to stop or escalate further
- Rationale: Config hints optimize known sites; confidence thresholds handle unknown sites and config staleness gracefully
- Affects: Extraction pipeline, site configs schema, confidence scoring module

**ADR-REV-SE2: Confidence Scoring — Weighted Multi-Signal**
- Decision: Multiple signals per extraction (selector match count, text pattern matching, structural position, cross-field consistency) with weighted combination producing final score
- Rationale: Effective without ML infrastructure; extraction trace data collected can eventually train ML model
- Affects: Extraction pipeline, extraction trace schema, per-field scoring

**ADR-REV-SE3: Self-Healing Selectors — Fallback Chain + Heuristic Repair**
- Decision: Ordered selector alternatives per field with auto-deprecation of low-health selectors; heuristic repair as last resort before AI escalation; repair successes feed back into selector health
- Rationale: Maximizes resilience while generating data for system improvement; aligns with password manager self-healing patterns from research
- Affects: Selector registry, extraction pipeline, telemetry, config pipeline

**ADR-REV-SE4: Site Support Model — Config with Escape Hatches**
- Decision: Pure JSON config by default; optional `customExtractor` field references built-in strategy functions for edge cases; new strategies ship in extension updates, selector configs update independently
- Rationale: 90%+ of sites covered by pure config; clean extension point for unusual platforms without sacrificing config-driven updatability
- Affects: Site config schema, extraction pipeline, extension build process

### Extension Architecture

**ADR-REV-EX1: Communication — Zustand State + Typed Commands**
- Decision: State synchronization via Zustand stores backed by chrome.storage (job data, UI state, configs); explicit typed messages (TypeScript discriminated unions) only for imperative commands (trigger scan, start autofill, open picker)
- Rationale: Plays to existing Zustand investment; clean separation of state (reactive) vs. actions (imperative); reduces message passing complexity
- Affects: All extension contexts (content script, background, side panel), message type registry

**ADR-REV-EX2: DOM Readiness — Multi-Signal with Config Hints**
- Decision: MutationObserver idle detection + content heuristic markers + site config readiness signals (e.g., wait for element, URL pattern + idle threshold)
- Rationale: Config-driven tuning for problematic SPA platforms; heuristic baseline for unknown sites; addresses EXT-5/5.5 timing issues
- Affects: Content Sentinel module, site config schema, detection pipeline

**ADR-REV-EX3: Element Picker — Side Panel Guided**
- Decision: Minimal page injection (highlight overlay only); picker controls, instructions, and selector preview live in side panel
- Rationale: Minimal CSP conflicts; leverages existing 400px panel for rich UI; consistent with side-panel-first UX philosophy
- Affects: Content script injection, side panel UI, correction workflow

**ADR-REV-EX4: Correction Feedback — Local + Telemetry + Auto-Propose**
- Decision: Corrections applied locally immediately; anonymized correction data sent to API; accumulated corrections auto-propose new selectors to config pipeline for human review
- Rationale: Closes the full feedback loop (user correction → selector improvement → config sync); complements self-healing strategy (ADR-REV-SE3)
- Affects: Correction UI, telemetry pipeline, config pipeline, selector registry

### API & Communication Patterns

**ADR-REV-A1: Telemetry Ingestion — Batch Endpoint**
- Decision: Single `POST /v1/telemetry/batch` endpoint; extension buffers events locally, ships in batches (every 30s or on idle); API returns 202 Accepted, processes asynchronously
- Rationale: Write-only, high-volume data shouldn't block extension or core API; keeps telemetry in FastAPI surface for consistent API contract
- Affects: API routes, extension telemetry buffer, async processing workers

**ADR-REV-A2: Config Sync — Pull with Push Notification**
- Decision: Pull-based delta sync (`GET /v1/configs/sites?since_version=X`) as foundation; Supabase Realtime push channel notifies extension "new configs available" triggering a pull
- Rationale: Reliable pull for bulk sync; push notifications for time-sensitive updates (ATS DOM changes); leverages existing Supabase Realtime infrastructure
- Affects: API config endpoints, Supabase Realtime setup, extension config sync module

**ADR-REV-A3: AI Fallback — Provider Abstraction + Circuit Breaker**
- Decision: Provider interface with primary (Anthropic) and secondary (OpenAI) providers; circuit breaker opens after N failures in M minutes, routing all requests to secondary until primary recovers
- Rationale: Adds resilience to existing dual-provider setup without task-routing complexity; task-based routing can be layered on later with usage data
- Affects: AI service layer, provider adapters, health monitoring

### Infrastructure & Deployment

**ADR-REV-I1: Config Pipeline — Git-Managed with Fast-Path Override**
- Decision: Site configs in repo as JSON (source of truth), CI validates schema on PR, merge refreshes API cache; emergency override API endpoint bypasses PR cycle for urgent selector fixes; overrides merged back to repo
- Rationale: Version control reliability with fast response to selector breakage; fast-path is essentially a "hotfix" mechanism for configs
- Affects: Repo structure, CI pipeline, API config management, override reconciliation

**ADR-REV-I2: Extension/Config Update Separation — Bundled Defaults + Runtime Overlay**
- Decision: Ship baseline config snapshot with extension; on startup, fetch delta updates from API; runtime configs overlay bundled defaults
- Rationale: Extension works offline with bundled configs, gets fresh configs when online; natural implementation of hybrid selector storage (ADR-REV-D1)
- Affects: Extension build process, config loader, startup sequence

**ADR-REV-I3: Monitoring — Selector Health Dashboard + Alerts**
- Decision: Dedicated views showing per-site/per-field extraction success rates, selector health scores, and trends; automated alerts when success rate drops below threshold, triggering config pipeline fast-path
- Rationale: Alert pipeline makes self-healing system operational; without alerts, selector breakage goes unnoticed
- Affects: Web dashboard, telemetry aggregation, alerting infrastructure, config pipeline integration

**ADR-REV-I4: CI/CD — Per-Surface + Integration Pipeline**
- Decision: Per-surface CI workflows triggered by path filters; shared package changes trigger all downstream pipelines; separate integration pipeline for cross-surface tests on merges to main
- Rationale: Per-surface speed for daily development; integration confidence for cross-surface concerns (config sync, telemetry)
- Affects: CI configuration, test organization, merge policies

### Decision Impact Analysis

**Implementation Sequence:**
1. Config schema + Zod validation (ADR-REV-D3) — foundation for all config-driven decisions
2. Selector registry storage + bundled defaults (ADR-REV-D1, I2) — enables extraction pipeline
3. Extraction pipeline escalation + confidence scoring (ADR-REV-SE1, SE2) — core Smart Engine
4. Communication refactor (ADR-REV-EX1) — Zustand state + typed commands
5. DOM readiness + Content Sentinel revision (ADR-REV-EX2) — improved detection
6. Self-healing selectors + fallback chains (ADR-REV-SE3) — resilience layer
7. Telemetry batch endpoint + extraction traces (ADR-REV-A1, D2) — observability
8. Config sync API + push notifications (ADR-REV-A2) — remote config delivery
9. Correction feedback loop + element picker (ADR-REV-EX3, EX4) — user feedback
10. AI circuit breaker (ADR-REV-A3) — AI resilience
11. Config pipeline + fast-path (ADR-REV-I1) — operational config management
12. Monitoring dashboard + alerts (ADR-REV-I3) — operational observability
13. CI/CD per-surface + integration (ADR-REV-I4) — deployment infrastructure

**Cross-Component Dependencies:**
- ADR-REV-D3 (Zod configs) → ADR-REV-D1, SE1, SE4, EX2, I1, I2 (all config consumers)
- ADR-REV-SE3 (self-healing) ↔ ADR-REV-EX4 (correction feedback) — bidirectional data flow
- ADR-REV-A1 (telemetry) → ADR-REV-I3 (monitoring) → ADR-REV-I1 (config fast-path) — alert-driven config updates
- ADR-REV-EX1 (communication) → ADR-REV-EX2, EX3, EX4 (all extension features depend on communication layer)
- ADR-REV-D1 (hybrid storage) ↔ ADR-REV-A2 (config sync) ↔ ADR-REV-I2 (bundled + overlay) — config delivery chain

### Database Schema (Confirmed from Original Architecture)

**Tables Overview**

| Table | Purpose | PRD Source |
|-------|---------|------------|
| `profiles` | User data, preferences, subscription | FR1-6, FR54-55 |
| `resumes` | Resume files + parsed content | FR7-13 |
| `jobs` | Saved job postings + tracking | FR45-53 |
| `usage_events` | Track each AI operation | FR54, FR56, FR60 |
| `global_config` | Tier limits, defaults, feature flags | Flexibility requirement |
| `feedback` | User feedback capture | FR78-80 |

**Note:** AI outputs are **ephemeral** (FR36, FR77) - no storage table.

**Schema Definitions**

```sql
-- profiles (1:1 with auth.users)
profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id),
  email                 TEXT NOT NULL,
  full_name             TEXT,
  subscription_tier     TEXT DEFAULT 'free',  -- free, starter, pro, power
  subscription_status   TEXT DEFAULT 'active', -- active, canceled, past_due
  active_resume_id      UUID REFERENCES resumes(id),
  preferred_ai_provider TEXT DEFAULT 'claude', -- claude, gpt
  stripe_customer_id    TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
)

-- resumes
resumes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,  -- Supabase storage path
  parsed_data JSONB,          -- Structured resume content
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
)
-- Max 5 resumes enforced at API level

-- jobs
jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  salary_range    TEXT,
  employment_type TEXT,
  source_url      TEXT,
  status          TEXT DEFAULT 'applied',  -- applied, interviewing, offered, rejected, accepted
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)

-- usage_events (Flexible usage tracking)
usage_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,  -- match, cover_letter, chat, outreach, resume_parse
  ai_provider    TEXT NOT NULL,  -- claude, gpt
  credits_used   INTEGER DEFAULT 1,
  period_type    TEXT NOT NULL,  -- lifetime, daily, monthly
  period_key     TEXT NOT NULL,  -- "lifetime", "2026-01-30", "2026-01"
  created_at     TIMESTAMPTZ DEFAULT now()
)
-- Index on (user_id, period_type, period_key) for fast balance queries

-- global_config (Backend-configurable settings)
global_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
)

-- feedback
feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  context    JSONB,  -- { "page_url": "...", "feature": "cover_letter" }
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Credit System (Hybrid Model):**

| Resource | Type | Free Tier | Paid Tiers |
|----------|------|-----------|-----------|
| **Match analysis** | Daily allocation (resets daily) | 20/day | Scales with tier |
| **AI generation** (cover letters, outreach, chat) | Lifetime (free) / Monthly (paid) | 5 lifetime | 100-2000/month |

Match analyses are tracked separately from AI credits. The `usage_events.operation_type` distinguishes between `match` (daily allocation) and generative operations (`cover_letter`, `outreach`, `chat`) which consume AI credits.

**Entity States**

| Entity | States | Notes |
|--------|--------|-------|
| Resume | Active/Inactive | Via `profiles.active_resume_id` |
| Job | applied, interviewing, offered, rejected, accepted | Status progression |
| Subscription Tier | free, starter, pro, power | Tier levels |
| Subscription Status | active, canceled, past_due | From Stripe webhooks |
| AI Provider | claude, gpt | User preference + system default |

### API Response Format (Confirmed)

**Envelope Pattern**

```json
// Success
{ "success": true, "data": { ... } }

// Error
{
  "success": false,
  "error": {
    "code": "CREDIT_EXHAUSTED",
    "message": "You've used all your free credits. Upgrade to continue.",
    "details": { ... }
  }
}
```

**HTTP Status Code Mapping**

| Status | When Used | Example Error Code |
|--------|-----------|-------------------|
| 200 | Success (GET, PUT, DELETE) | - |
| 201 | Created (POST) | - |
| 400 | Validation error | `VALIDATION_ERROR` |
| 401 | Not authenticated | `AUTH_REQUIRED` |
| 403 | Not authorized | `FORBIDDEN` |
| 404 | Resource not found | `RESUME_NOT_FOUND`, `JOB_NOT_FOUND` |
| 409 | Conflict | `DUPLICATE_ENTRY` |
| 422 | Business logic error | `CREDIT_EXHAUSTED`, `RESUME_LIMIT_REACHED` |
| 429 | Rate limited | `RATE_LIMITED` |
| 500 | Server error | `INTERNAL_ERROR` |
| 503 | Service unavailable | `AI_PROVIDER_UNAVAILABLE` |

**Standardized Error Codes**

| Code | HTTP | Message (example) |
|------|------|-------------------|
| `AUTH_REQUIRED` | 401 | "Authentication required" |
| `INVALID_TOKEN` | 401 | "Invalid or expired token" |
| `CREDIT_EXHAUSTED` | 422 | "You've used all your credits. Upgrade to continue." |
| `RESUME_LIMIT_REACHED` | 422 | "Maximum 5 resumes allowed. Delete one to upload more." |
| `RESUME_NOT_FOUND` | 404 | "Resume not found" |
| `JOB_NOT_FOUND` | 404 | "Job not found" |
| `SCAN_FAILED` | 422 | "Could not extract job details from this page" |
| `AI_GENERATION_FAILED` | 500 | "AI generation failed. Please try again." |
| `AI_PROVIDER_UNAVAILABLE` | 503 | "AI service temporarily unavailable" |
| `VALIDATION_ERROR` | 400 | Dynamic based on field |
| `RATE_LIMITED` | 429 | "Too many requests. Please wait." |

### AI Provider Architecture (Confirmed)

| Setting | Value |
|---------|-------|
| Default Provider | Claude (configurable in `global_config`) |
| User Preference | Stored in `profiles.preferred_ai_provider` |
| User Toggle | Yes - users can switch between Claude/GPT |
| Fallback Trigger | 500 errors, timeouts |
| Fallback Enabled | Configurable in `global_config` |
| Streaming | Yes — SSE for generative endpoints |

**Resolution Order:**
1. User's `preferred_ai_provider` (if set)
2. `global_config.default_ai_provider`
3. Fallback to other provider on failure (if enabled)
4. Circuit breaker (ADR-REV-A3) opens after N failures in M minutes

**Streaming Architecture:**

| Endpoint | Streaming | Response Type |
|----------|-----------|---------------|
| `/v1/ai/match` | No — returns complete JSON | `application/json` |
| `/v1/ai/cover-letter` | Yes — streams text chunks | `text/event-stream` |
| `/v1/ai/outreach` | Yes — streams text chunks | `text/event-stream` |
| `/v1/ai/chat` | Yes — streams text chunks | `text/event-stream` |
| `/v1/ai/resume-parse` | No — returns complete JSON | `application/json` |

**SSE Protocol:**
```
event: chunk
data: {"text": "Dear Hiring Manager,\n\n"}

event: chunk
data: {"text": "I am writing to express..."}

event: done
data: {"credits_remaining": 4}

event: error
data: {"code": "AI_GENERATION_FAILED", "message": "..."}
```

**Frontend Integration:**
- `EventSource` or `fetch` with `ReadableStream` for SSE consumption
- Cursor/caret blink at insertion point while streaming
- "Stop generating" cancel button available throughout
- On `prefers-reduced-motion`: show final text immediately (no progressive reveal)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 8 new pattern areas for Smart Engine, plus confirmation of all existing conventions.

### Existing Patterns (Confirmed)

These patterns were established in the original architecture and remain unchanged:

| Domain | Convention | Example |
|--------|-----------|---------|
| DB tables/columns | `snake_case` | `selector_health`, `fail_count` |
| API JSON fields | `snake_case` | `health_score`, `last_verified` |
| TypeScript vars/props | `camelCase` | `healthScore`, `lastVerified` |
| Python files | `snake_case.py` | `config_sync.py`, `telemetry_worker.py` |
| TS files | `kebab-case.tsx` | `scan-store.ts`, `site-config.tsx` |
| API response | Envelope pattern | `{success: true, data: {...}}` |
| Error format | Code + message | `{code: "SELECTOR_NOT_FOUND", message: "..."}` |
| Components | ui/ + custom/ | `components/ui/button.tsx`, `components/custom/match-score.tsx` |
| Styling | Tokens → Tailwind | Semantic CSS tokens first, utility classes second |

### New Patterns for Smart Engine

**PATTERN-SE1: Site Config File Naming**
- Convention: Domain-based flat naming
- Location: `configs/sites/`
- Format: `{domain}.json` (e.g., `greenhouse.io.json`, `lever.co.json`)
- Rationale: Domain name is the natural lookup key matching URL-based detection; flat structure keeps discovery simple

**PATTERN-SE2: Extension Message Types**
- Convention: Dot-namespaced strings
- Format: `{domain}.{action}` (e.g., `scan.trigger`, `autofill.start`, `picker.open`, `config.sync`)
- Namespaces: `scan.*`, `autofill.*`, `picker.*`, `config.*`, `auth.*`, `telemetry.*`
- Implementation: TypeScript discriminated union with `type` field
- Rationale: Natural grouping, readable, common event system pattern

**PATTERN-SE3: Selector Registry Structure — Layered**
- Static config (shipped/synced from API):
  ```json
  {
    "selector": "h1.job-title",
    "priority": 1,
    "type": "css",
    "fallbacks": ["[data-job-title]", ".posting-headline h1"]
  }
  ```
- Runtime health (computed locally, stored in chrome.storage):
  ```json
  {
    "selectorId": "greenhouse.io:jobTitle:0",
    "healthScore": 0.95,
    "lastVerified": "2026-02-13T...",
    "failCount": 2,
    "totalAttempts": 40
  }
  ```
- Rationale: Separates synced data from local computation; keeps config payloads small; aligns with ADR-REV-D1

**PATTERN-SE4: Telemetry Event Envelope**
- Standard envelope for all telemetry events:
  ```json
  {
    "type": "extraction.field.success",
    "version": 1,
    "timestamp": "2026-02-13T12:00:00Z",
    "sessionId": "uuid",
    "payload": { "site": "greenhouse.io", "field": "jobTitle", "layer": "css", "confidence": 0.92, "duration_ms": 45 }
  }
  ```
- Event types: `extraction.field.success`, `extraction.field.failure`, `extraction.page.complete`, `correction.submitted`, `correction.accepted`, `config.sync.completed`, `selector.health.degraded`
- Rationale: Uniform batch processing; namespaced types easy to filter/aggregate; version field enables payload evolution

**PATTERN-SE5: Confidence Score Representation**
- Internal: 0-1 float (e.g., `0.92`)
- Display: 0-100 percentage (e.g., `92%`)
- Thresholds: Defined as floats (e.g., `CONFIDENCE_ACCEPT = 0.7`, `CONFIDENCE_ESCALATE = 0.4`)
- Conversion: Presentation layer only (`Math.round(score * 100)`)
- Rationale: Floats for computation/comparison; percentages for human readability; single conversion point prevents inconsistency

**PATTERN-SE6: Config Version Format**
- Format: Monotonic integer (e.g., `1`, `2`, `42`)
- Delta sync: `GET /v1/configs/sites?since_version=42`
- Increment: API increments on every config publish
- Storage: Extension stores `lastSyncedVersion: number` in chrome.storage
- Rationale: Simplest for delta sync ordering; unambiguous comparison; no parsing needed

**PATTERN-SE7: Extension Store Organization**
- Domain-sliced stores with shared core:
  - `useCoreStore` — cross-cutting: current page state, connection status, user auth, preferences
  - `useScanStore` — detection results, extraction data, confidence scores
  - `useAutofillStore` — autofill state, field mapping, progress
  - `useConfigStore` — site configs, sync status, config version
  - `useTelemetryStore` — event buffer, batch queue, flush status
- File location: `stores/{store-name}.ts`
- Naming: `use{Domain}Store` (camelCase, prefixed with `use`)
- Rationale: Domain boundaries prevent state coupling; core store eliminates duplication; each store independently testable

**PATTERN-SE8: Async State Type**
- Standard discriminated union for all async operations:
  ```typescript
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: AppError }
  ```
- Usage: All store fields representing async operations use `AsyncState<T>`
- AppError type:
  ```typescript
  type AppError = {
    code: string       // e.g., "EXTRACTION_FAILED"
    message: string    // human-readable
    details?: unknown  // optional debug context
  }
  ```
- Rationale: Exhaustive TypeScript matching catches missing states; composable across all stores; consistent error shape

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions from the table above — no exceptions for "temporary" code
2. Use `AsyncState<T>` for any new async operation in extension stores
3. Use the telemetry event envelope (PATTERN-SE4) for any new telemetry event type
4. Place site configs in `configs/sites/{domain}.json` format
5. Use dot-namespaced strings for any new extension message types
6. Keep selector static config separate from runtime health data
7. Represent confidence as 0-1 float internally, convert to percentage only at display

**Pattern Enforcement:**
- TypeScript compiler catches `AsyncState` exhaustiveness violations
- Zod schema validation catches config format violations at runtime
- CI linting for file naming conventions
- PR review checklist for new telemetry events and message types

### Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| `isLoading: boolean` + `error: string \| null` | `AsyncState<T>` discriminated union |
| `chrome.runtime.sendMessage({action: "scan"})` | Typed command: `{type: "scan.trigger", payload: {...}}` |
| Inline confidence thresholds (`if (score > 0.7)`) | Named constants: `if (score > CONFIDENCE_ACCEPT)` |
| Selector health fields in site config JSON | Separate runtime health store (PATTERN-SE3) |
| `config_v2.json` filename for versioning | Monotonic integer in config payload, domain-based filename |
| Single massive Zustand store | Domain-sliced stores (PATTERN-SE7) |

### Error Handling Patterns

**Three-Tier Error Escalation:**

| Tier | Scope | Trigger | UX Response |
|------|-------|---------|-------------|
| **Tier 1: Inline Retry** | Single action | API timeout, network blip | Inline error message + "Retry" button adjacent to error |
| **Tier 2: Section Degraded** | Dependent features | Match analysis fails → AI Studio can't unlock | Affected section shows "Analysis unavailable — retry match first" with link back to Scan tab |
| **Tier 3: Full Re-Auth** | Session-wide | Token expired, auth revoked | Slide transition to LoggedOutView with "Session expired — sign in again" |

**Error Format:** `<p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{message}</p>`

| Layer | Pattern |
|-------|---------|
| API | Catch → return envelope with error code (+ SSE `event: error` for streaming) |
| Frontend | Try/catch → set error state → inline message with retry action. **Never modal.** |
| Extension | Same + "Check your connection and try again" for network errors |

**Rules:**
- Never auto-retry — always require explicit user action
- Errors are inline, actionable, and honest — never dead ends
- Every error state has a next action ("Could not scan" → "Paste description")

### Loading State Patterns

**Never use generic spinners.** All loading states have purposeful visual feedback:

| Duration | Pattern | Example |
|----------|---------|---------|
| < 500ms | No indicator (perceived instant) | Tab switch, section expand |
| 500ms–2s | Skeleton shimmer (shadcn `<Skeleton>` composition) | Job scan, initial data load |
| 2s–10s | Animated progress (SVG ring fill, sequential autofill) | Match analysis, autofill run |
| > 10s | Streaming text reveal (word-by-word) + "Stop generating" cancel | Cover letter, outreach, coach |

**Skeleton Rules:**
- Use shadcn `<Skeleton>` via composition: `<Skeleton className="h-4 w-3/4 rounded" />`
- Compose skeletons to match loaded component layout shape — do NOT create separate `*Skeleton` components
- Apply `animate-pulse` (respects `prefers-reduced-motion` → static gray, no animation)
- Never show skeleton + real content simultaneously — hard cut transition

**Button Loading State:** `<Loader2 className="mr-2 size-4 animate-spin" />` replaces icon, text changes to gerund ("Signing in...", "Analyzing...")

### Button Hierarchy

**Three-Tier System:**

| Tier | shadcn Variant | When | Visual |
|------|---------------|------|--------|
| **Primary** | `default` | One per view — the #1 next action | Solid `bg-primary`, white text, `shadow-md` |
| **Secondary** | `outline` | Supporting actions (Edit, Reset, Cancel) | Border only, foreground text |
| **Ghost** | `ghost` | Tertiary / inline actions (settings gear, close X) | No border/bg, hover reveals bg |

**Functional Area CTA Buttons:**

| Action | Class | When |
|--------|-------|------|
| Dive Deeper / AI actions | `bg-ai-accent text-ai-accent-foreground` | AI Studio, generative actions |
| Autofill | `btn-gradient-depth-autofill` | Start autofill, apply fields |
| Coach send | `btn-gradient-depth-coach` | Send to coach, open coaching |
| Destructive | `variant="destructive"` | Delete resume, clear all |

**Button Pair Ordering:**
- **Constructive pairs:** Primary left, Secondary right (e.g., "Analyze Job" | "Cancel")
- **Destructive pairs:** Cancel left, Destructive right (e.g., "Keep" | "Delete Resume")

**Rules:**
- Maximum 1 primary button per visible section
- Full-width (`w-full`) for CTAs inside cards
- Icon + label: icon `size-4` with `mr-2`, always left of text
- Disabled state: `opacity-50 cursor-not-allowed` (shadcn default)

### Extension Shell Layout Contract

The sidebar shell layout is defined once in `<ExtensionSidebar>` and never reinvented:

```
<aside className="flex flex-col h-full">       /* sidebar shell */
  <header><AppHeader className="shrink-0" /></header>  /* fixed top */
  <nav><TabBar className="shrink-0" /></nav>           /* fixed below header */
  <main className="flex-1 overflow-y-auto              /* scrollable content */
    scrollbar-hidden scroll-fade-y">
    {children}
  </main>
  <footer><CreditBar className="shrink-0" /></footer>  /* fixed bottom */
</aside>
```

- All composed views (`StateLoggedOut`, `StateJobDetected`, etc.) render inside the `flex-1` scroll region
- Header, tab bar, and credit bar NEVER scroll — they are `shrink-0` fixed regions
- Semantic HTML: `aside > header + nav + main + footer`
- Tab content: preserves state within a session (switching Scan → Coach → Scan doesn't re-scan)

**Tab Structure:**

| Level | Tabs | Component |
|-------|------|-----------|
| Main sidebar | Scan \| AI Studio \| Autofill \| Coach | shadcn `<Tabs>` |
| AI Studio sub-tabs | Match \| Cover Letter \| Chat \| Outreach | Nested shadcn `<Tabs>` |

Active tab indicator uses functional area accent color. Tab switch animation: `animate-tab-content` (slideInFromRight 200ms ease-out).

### Animation Strategy

**Dependency:** `framer-motion` (~30 kB gzip) — **dynamic import** via `<AnimatedMatchScore>` since it only renders in job-detected state.

**Boundary Rules:**

| Technology | Use For | Never For |
|-----------|---------|-----------|
| **Framer Motion** | State transitions (AnimatePresence), match score animation (motion.circle), count-up numbers, orchestrated multi-element sequences | Hover/focus states |
| **CSS animations** | Hover/focus states, tab content transitions, button glow effects, loading skeletons, single-element micro-interactions | N/A — CSS can be used for anything simple |

**Reduced Motion Support:**

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration: 0s;
    --motion-enabled: 0;
  }
  .animate-tab-content { animation: none; }
}
```

- `tw-animate-css` handles its own animations automatically
- Custom keyframes need explicit `animation: none`
- Framer Motion components read `--motion-enabled` or `useReducedMotion()` hook to skip orchestrated transitions
- Streaming text: shows full text immediately instead of word-by-word reveal

### Accessibility (WCAG 2.1 AA)

**Color & Contrast:**
- All text: 4.5:1 contrast ratio against background (OKLCH tokens tuned)
- UI components: 3:1 contrast ratio (borders, icons as sole indicators)
- Color never the sole indicator — always paired with text, icons, or numeric values
- Dark mode tokens independently verified

**Keyboard Navigation:**
- All interactive elements reachable via Tab key
- Tab bar: Arrow keys for tab switching (Radix Tabs built-in)
- Escape: close edit mode, dismiss overlays, cancel generation
- Enter: submit forms, activate buttons
- Focus ring: `outline-ring/50` (globals.css base layer)

**Screen Reader Support:**
- Semantic HTML: `<aside>`, `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`
- ARIA labels on icon-only buttons: `aria-label="Reset job data"`, `aria-label="Settings"`
- Live regions: `aria-live="polite"` on match score updates, error messages, autofill progress
- Match score: `role="img" aria-label="Match score: {n} percent"`
- Error messages: `role="alert"` (auto-announced)
- Loading states: `aria-busy="true"` on container

**ARIA Patterns by Component:**

| Component | ARIA Pattern |
|-----------|-------------|
| Tab bar | Radix handles `tablist/tab/tabpanel` automatically |
| Match score | `role="img" aria-label="Match score: {n} percent"` |
| Edit toggle | `aria-label="Edit job details"` / `aria-label="Cancel editing"` |
| Reset button | `aria-label="Reset job data"` |
| Credit bar | `aria-label="AI credits: {used} of {total} used"` |
| Error messages | `role="alert"` |

**Development Rules:**
1. Every icon-only button gets `aria-label` — no exceptions
2. Every dynamic content update gets `aria-live="polite"` or `role="alert"`
3. Never use `div`/`span` for interactive elements — use `button`, `a`, or Radix primitives
4. Never suppress focus outlines without visible alternative
5. Test with keyboard before marking any component story as complete

## Core Engine Implementation Detail

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE ENGINE                                      │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Selector    │  │   Content    │  │  Extraction  │  │  Telemetry │  │
│  │   Registry    │  │   Sentinel   │  │    Trace     │  │   Client   │  │
│  │              │  │              │  │              │  │            │  │
│  │  Board defs  │  │  DOM ready   │  │  Per-field   │  │  Events →  │  │
│  │  Selectors   │  │  Show More   │  │  journey     │  │  Backend   │  │
│  │  Priority    │  │  Observer    │  │  recording   │  │            │  │
│  │  Health      │  │              │  │              │  │            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                │          │
│  ┌──────┴─────────────────┴─────────────────┴────────────────┴──────┐   │
│  │                      SHARED CORE LAYER                            │   │
│  │  - Selector execution (querySelector + trace)                     │   │
│  │  - Board detection (URL pattern matching)                         │   │
│  │  - Frame aggregation (multi-frame merge)                          │   │
│  │  - Confidence scoring (source → score mapping)                    │   │
│  │  - Correction recording (user edit → feedback event)              │   │
│  └──────┬──────────────────────────────────┬────────────────────────┘   │
│         │                                  │                            │
│  ┌──────┴──────────┐              ┌────────┴────────────┐               │
│  │  SCAN ENGINE    │              │  AUTOFILL ENGINE    │               │
│  │  (reads DOM)    │              │  (writes DOM)       │               │
│  │                 │              │                     │               │
│  │  Extract job    │              │  Detect form fields │               │
│  │  data from page │              │  Map to user data   │               │
│  │                 │              │  Fill + undo        │               │
│  │  → JobCard UI   │              │  Resume upload      │               │
│  └─────────────────┘              └─────────────────────┘               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ELEMENT PICKER (user-initiated, shared by scan + autofill)      │   │
│  │  - SVG overlay on active tab                                     │   │
│  │  - User clicks element → selector generated                      │   │
│  │  - Selector stored as correction → feeds learning                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Extraction Pipeline

Per-field, layers execute top-to-bottom. Stop on first accepted match per field.

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: JSON-LD                                  conf 0.95    │
│  Parse <script type="application/ld+json"> blocks               │
│  Recursive search for @type: "JobPosting" (handles @graph)      │
│  ~40% of job pages have JSON-LD (Indeed, Greenhouse usually)    │
└────────────────────────┬────────────────────────────────────────┘
                         │ fields still empty?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 2: CSS Selectors                       conf 0.85/0.60   │
│  Board-specific selectors first, then generic fallback          │
│  Registry-driven (ADR-REV-D1): only board-relevant selectors    │
│  Title: 17 selectors, Company: 10, Description: 27, etc.       │
└────────────────────────┬────────────────────────────────────────┘
                         │ fields still empty?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 3: OpenGraph Meta                           conf 0.40   │
│  <meta property="og:title"> for title only                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ fields still empty?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 4: Heuristic                                conf 0.30   │
│  Expand <details>, read CSS-hidden content, extended selectors  │
│  Only runs if title OR company OR description missing/short     │
└────────────────────────┬────────────────────────────────────────┘
                         │ completeness < 0.7?
┌────────────────────────▼────────────────────────────────────────┐
│  Layer 5: AI Backend (POST /v1/ai/extract-job)     conf 0.90   │
│  Cleaned HTML (8KB max) → fast model (Haiku)                    │
│  One AI call per scan maximum. 50/user/day rate limit.          │
│  No credit cost (infrastructure, not user-facing AI feature)    │
└─────────────────────────────────────────────────────────────────┘

Post-extraction: Delayed verification if completeness < 0.8 (re-scan after 5s, rule-based only)
```

**Completeness Scoring Weights:**
- `title` (0.25), `company` (0.25), `description` (0.35), `location` (0.10), `salary` (0.05)

**Success Validation:** `title && company` required. Missing description triggers warning, not block.

### Key TypeScript Interfaces

**Selector Registry Entry (ADR-REV-D1, PATTERN-SE3):**

```typescript
interface SelectorEntry {
  id: string;                // e.g., "li-title-unified-v3"
  board: string;             // "linkedin" | "indeed" | ... | "generic"
  field: string;             // "title" | "company" | "description" | "location" | "salary" | "employmentType"
  selectors: string[];       // CSS selectors, tried in order
  priority: number;          // Lower = tried first (within same board+field)
  mode: "read" | "write" | "both";  // scan reads, autofill writes
  added: string;             // ISO date
  lastVerified?: string;
  status: "active" | "degraded" | "deprecated";
  notes?: string;
}
```

**Extraction Trace (ADR-REV-D2):**

```typescript
interface TraceAttempt {
  layer: "json-ld" | "css" | "og-meta" | "generic-fallback" | "heuristic";
  attempted: true;
  matched: boolean;
  selectorId?: string;       // From registry
  selector?: string;         // Actual CSS selector
  rawValue?: string;
  cleanedValue?: string;
  accepted: boolean;
  rejectionReason?: string;  // e.g., "failed_isValidJobTitle", "empty"
}

interface FieldTrace {
  field: string;
  finalValue: string;
  finalSource: string;
  finalSelectorId?: string;
  attempts: TraceAttempt[];
  attemptCount: number;
  matchCount: number;
  timeMs?: number;
}

interface ExtractionTrace {
  fields: FieldTrace[];
  board: string | null;
  url: string;
  timestamp: number;
  totalTimeMs: number;
  registryVersion?: string;
  frameCount: number;
  winningFrameId: number;
  aiTriggered: boolean;
  aiTimeMs?: number;
  completeness: number;
  confidence: Record<string, number>;
}
```

**Element Picker Result (ADR-REV-EX3):**

```typescript
interface ElementPickResult {
  value: string;
  rawValue: string;
  clickedSelector: string;
  clickedTag: string;
  stableSelector: string;       // Highest-stability ancestor
  stableScore: number;
  candidates: SelectorCandidate[];
  board: string | null;
  url: string;
  field: string;
  timestamp: number;
}

// Stability scoring: data-testid (+50), semantic class names (+30),
// IDs (+40), semantic tags (+15), ARIA attrs (+20),
// hash/generated classes (-20)
```

**Correction Event (ADR-REV-EX4):**

```typescript
interface CorrectionEvent {
  field: string;
  originalValue: string;
  originalSource: ExtractionSource;
  originalSelectorId?: string;
  correctedValue: string;
  correctionMethod: "inline-edit" | "element-picker";
  pickerResult?: ElementPickResult;
  board: string | null;
  url: string;
  domain: string;
  timestamp: number;
  traceId?: string;
}
```

### Backend Telemetry Schema

```sql
-- Telemetry events table (append-only)
CREATE TABLE scan_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,      -- "scan_complete", "field_correction", "autofill_complete"
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_telemetry_event_type ON scan_telemetry (event_type, created_at);
CREATE INDEX idx_telemetry_board ON scan_telemetry ((payload->>'board'), created_at);
```

**Telemetry Event Types:**
- `scan_complete` — board, domain, url_hash (SHA256), completeness, ai_triggered, field_sources, field_selector_ids
- `field_correction` — board, domain, field, original_source, original_selector_id, correction_method, stable_selector (NO field values — privacy)
- `autofill_complete` — domain, fields_detected, fields_mapped, fields_filled, fields_undone, fill_time_ms

**Aggregation Queries:**
```sql
-- Selector health: correction rate per selector
SELECT payload->>'original_selector_id' AS selector_id,
       payload->>'board' AS board, payload->>'field' AS field,
       COUNT(*) AS correction_count
FROM scan_telemetry
WHERE event_type = 'field_correction' AND created_at > now() - interval '7 days'
GROUP BY 1, 2, 3 ORDER BY correction_count DESC;

-- Board quality: avg completeness + AI fallback rate
SELECT payload->>'board' AS board,
       AVG((payload->>'completeness')::float) AS avg_completeness,
       AVG(CASE WHEN (payload->>'ai_triggered')::boolean THEN 1 ELSE 0 END) AS ai_fallback_rate
FROM scan_telemetry
WHERE event_type = 'scan_complete' AND created_at > now() - interval '7 days'
GROUP BY 1;
```

### Shared Core: Scan + Autofill

| Capability | Scan Engine | Autofill Engine |
|-----------|-------------|-----------------|
| **Direction** | Reads DOM → extracts data | Writes data → fills DOM |
| **Content Sentinel** | Detects when job content is ready | Detects when form fields are ready |
| **Board Detection** | `getJobBoard(url)` for selector filtering | Same — ATS forms have board-specific layouts |
| **Selector Registry** | CSS selectors for reading values | CSS selectors for finding inputs to fill |
| **Element Picker** | "That's the salary" (read mode) | "Put name here" (write mode) |
| **Confidence Scoring** | How sure about extracted value? | How sure this is the name field? |
| **Correction Feedback** | User edits wrong extraction | User unmaps a wrong mapping |
| **Telemetry** | Scan events | Autofill events |

**Shared Module Structure:**
```
features/engine/          ← Pure functional core (hexagonal, no Chrome APIs)
├── extraction-pipeline.ts
├── confidence-scorer.ts
├── selector-health.ts
├── heuristic-repair.ts
├── config-loader.ts
├── config-schema.ts
├── extraction-trace.ts
├── dom-readiness.ts
├── constants.ts
└── __tests__/

features/scanning/        ← DOM reader (uses engine functions)
├── scanner.ts
├── frame-aggregator.ts
├── extraction-validator.ts
├── html-cleaner.ts
└── job-detector.ts

features/autofill/        ← DOM writer (uses engine functions)
├── field-detector.ts
├── field-filler.ts
├── field-registry.ts
├── field-types.ts
├── resume-uploader.ts
├── signal-weights.ts
└── ats-detector.ts
```

### Autofill Engine Pipeline

```
1. DETECTION (field-detector.ts)
   Scan DOM for <input>, <textarea>, <select>, [contenteditable]
   Record: elementRef, fieldType, currentValue, confidence, label

2. MAPPING (field-mapper.ts)
   Map detected fields to user data using registry (mode: "write")
   Confidence: exact match (0.95), autocomplete (0.90),
   placeholder (0.75), label (0.70), aria-label (0.65), heuristic (0.40)

3. REVIEW (Autofill UI in Side Panel)
   Detected fields grouped by category, low-confidence flagged
   Option to use element picker for unmapped fields

4. FILL (field-filler.ts via content script, sequential 600ms stagger)
   Snapshot current value → set value → dispatch input/change/blur events
   → green border flash → report status
   File uploads: DataTransfer API on file input
   Cover letter: paste into textarea/contenteditable

5. UNDO (undo-manager.ts, 10s window)
   Restore all fields from snapshot, remove highlights, record telemetry
```

### Performance Strategy

| Metric | Target | Strategy |
|--------|--------|----------|
| Scan → JobCard (rule-based) | < 1.5s | Sentinel signals readiness, registry filters by board |
| Scan → JobCard (with AI) | < 4s | AI only when completeness < 0.7, fast model |
| Element picker activation | < 200ms | Lightweight overlay, no React |
| Autofill detection | < 500ms | Sentinel detects forms alongside job content |
| Autofill fill execution | < 4s | 600ms stagger × ~6 fields |
| Telemetry send | 0ms (async) | Batched, background, best-effort |

**AI Call Minimization Target:**
- JSON-LD covers ~40% of pages
- Board-specific CSS covers ~35%
- Generic CSS + heuristics cover ~10%
- AI fallback handles remaining ~15%
- User corrections feed back → improve CSS layer → fewer AI calls over time

## Project Structure & Boundaries

### Complete Project Directory Structure

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

### Architectural Boundaries

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

### Requirements to Structure Mapping

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

### Integration Points

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

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All 16 ADR-REV decisions validated for mutual compatibility. No contradictions found. Config delivery chain (D1 ↔ A2 ↔ I2) and self-healing loop (SE3 ↔ EX4 ↔ A1 ↔ I3) form coherent feedback systems. All technology versions verified as compatible.

**Pattern Consistency:** All 8 PATTERN-SE patterns align with both existing conventions and new decisions. Naming boundary (snake_case API ↔ camelCase TS) handled by Zod transforms at config loading. Domain store pattern (SE7) extends existing store convention.

**Structure Alignment:** Project structure maps every ADR to specific files/directories. Hexagonal boundary for features/engine/ enforced by convention (no Chrome API imports). New API files follow existing router/service patterns.

### Requirements Coverage Validation ✅

**Functional Requirements:** 85 FRs across Extension, Web Dashboard, and API surfaces — all architecturally supported. Web Dashboard FRs partially covered (scaffolded, initialization deferred).

**Non-Functional Requirements:** 44 NFRs addressed:
- Performance: Config hints + confidence thresholds minimize extraction latency
- Security: Content script isolation, JWT auth, anonymized telemetry
- Reliability: Bundled configs, fallback chains, circuit breaker, graceful degradation
- Accessibility: WCAG 2.1 AA via UI package patterns
- Maintainability: Config-driven sites, Zod schemas, domain stores, typed messages

### Implementation Readiness Validation ✅

**Decision Completeness:** 16 ADRs with Decision/Rationale/Affects + 8 implementation patterns with code examples + anti-patterns table + enforcement guidelines.

**Structure Completeness:** Full directory tree grounded in actual codebase. Every new file linked to its ADR. Clear boundaries per extension context.

**Pattern Completeness:** AsyncState<T>, typed messages, telemetry envelope, config schema — all async operations, communication, events, and configs have standardized patterns.

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps:**
1. Web Dashboard (`apps/web/`) — not initialized. Required for dashboard stories. Non-blocking for Smart Engine.
2. Database schemas for telemetry_events, site_configs, selector_health tables — placeholders only. Design when implementing API endpoints.
3. OpenAPI spec update needed for new `/v1/telemetry/*` and `/v1/configs/*` endpoints.

**Nice-to-Have Gaps:**
1. Extension E2E testing (Playwright) — unit-testable via hexagonal architecture
2. Selector health alert thresholds — tune based on telemetry data
3. Config authoring admin dashboard — deferred to post-MVP

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (85 FRs, 44 NFRs)
- [x] Scale and complexity assessed (HIGH)
- [x] Technical constraints identified (MV3, 400px panel, ATS diversity)
- [x] Cross-cutting concerns mapped (6 concerns)

**✅ Architectural Decisions**
- [x] 16 ADR-REV decisions documented with rationale
- [x] Technology stack fully specified and version-verified
- [x] Integration patterns defined (REST, typed messages, config sync)
- [x] Performance considerations addressed (pipeline escalation, batch telemetry)

**✅ Implementation Patterns**
- [x] Naming conventions confirmed + 8 new patterns defined
- [x] Structure patterns defined (domain stores, layered selectors)
- [x] Communication patterns specified (typed messages, telemetry envelope)
- [x] Process patterns documented (AsyncState<T>, anti-patterns table)

**✅ Project Structure**
- [x] Complete directory structure with actual codebase grounding
- [x] Component boundaries established (content/background/panel/engine)
- [x] Integration points mapped (6 data flows)
- [x] Requirements to structure mapping complete (9 feature mappings)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — brownfield revision grounded in existing working codebase with implementation experience

**Key Strengths:**
- Config-driven architecture enables rapid ATS platform support without code changes
- Hexagonal engine core is fully unit-testable without Chrome APIs
- Self-healing feedback loop (correction → telemetry → health → config → sync) is architecturally complete
- Layered extraction with confidence scoring provides graceful degradation at every level
- Existing codebase patterns extended rather than replaced — lower migration risk

**Areas for Future Enhancement:**
- ML-based confidence scoring (after collecting weighted multi-signal data)
- Task-based AI provider routing (after collecting usage patterns)
- Admin dashboard for config authoring (after MVP validation)
- Extension E2E testing with Playwright

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all 16 ADR-REV decisions exactly as documented
- Use all 8 PATTERN-SE patterns consistently
- Respect hexagonal boundary: `features/engine/` has NO Chrome API imports
- New async operations MUST use `AsyncState<T>`
- New messages MUST use dot-namespaced typed commands
- New telemetry MUST use standard event envelope
- New site configs go in `configs/sites/{domain}.json`

**First Implementation Priority:**
1. ADR-REV-D3: Config schema (Zod) — foundation for all config consumers
2. ADR-REV-D1 + I2: Selector registry + bundled defaults — enables extraction pipeline
3. ADR-REV-SE1 + SE2: Extraction pipeline + confidence scoring — core Smart Engine
