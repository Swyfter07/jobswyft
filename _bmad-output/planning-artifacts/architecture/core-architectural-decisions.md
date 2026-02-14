# Core Architectural Decisions

## Decision Priority Analysis

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

## Data Architecture

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

## Smart Engine Architecture

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

## Extension Architecture

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

## API & Communication Patterns

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

## Infrastructure & Deployment

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

## Decision Impact Analysis

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

## Database Schema (Confirmed from Original Architecture)

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

## API Response Format (Confirmed)

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

## AI Provider Architecture (Confirmed)

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
