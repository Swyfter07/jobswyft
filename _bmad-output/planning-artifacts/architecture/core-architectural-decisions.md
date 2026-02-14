# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Engine Package Extraction to `packages/engine/` (ADR-REV-D4) ← NEW
- Middleware Extraction Pipeline with confidence gates (ADR-REV-SE5) ← NEW
- Selector Registry Storage (Hybrid: shipped defaults + API delta sync)
- Config-Driven Site Support (Config with escape hatches)
- Content Script Communication (Zustand state + typed messages for commands)
- Extension Update vs Config Update Separation (Bundled defaults + runtime overlay)

**Important Decisions (Shape Architecture):**
- React Controlled Form Bypass — native setter pattern (ADR-REV-SE6) ← NEW
- Shadow DOM Traversal (ADR-REV-SE7) ← NEW
- Operation ID (opid) Field Addressing (ADR-REV-SE8) ← NEW
- Service Worker Lifecycle Management (ADR-REV-EX5) ← NEW
- Admin Dashboard — Role-Based in apps/web/ (ADR-REV-EX6) ← NEW
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
- Admin config authoring dashboard (git-managed with fast-path sufficient for MVP)
- Cross-ATS API integration (Greenhouse/Lever/SmartRecruiters public APIs complement DOM extraction)
- Web Push API for critical config updates (Supabase Realtime sufficient for MVP)

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

## Engine & Autofill Architecture (Revision 2)

**ADR-REV-D4: Engine Package Extraction — `packages/engine/`**
- Decision: Extract core detection/autofill logic from `apps/extension/src/features/engine/` to `packages/engine/` as `@jobswyft/engine`. Zero Chrome API dependencies — enforced at package level.
- Rationale: Hexagonal boundary enforced by package dependencies (not just convention). Testable with JSDOM/happy-dom without browser. CI isolation. Future reuse potential (web dashboard preview, API config validation).
- Affects: Extension imports change to `@jobswyft/engine`; `apps/extension/src/features/` becomes thin Chrome adapter layer; monorepo gains new package; CI gets dedicated engine pipeline.
- Migration: Existing `features/engine/` pure functions move to package. DOM-touching code stays in extension as adapters.

**ADR-REV-SE5: Middleware Extraction Pipeline — Confidence-Gated**
- Decision: Replace sequential 5-layer pipeline with Koa-style middleware pipeline featuring `DetectionContext`, inline confidence gates, and dynamic layer insertion via site config.
- Pipeline: BoardDetector → JsonLd → ConfidenceGate(0.85) → CssSelector → ConfidenceGate(0.75) → OgMeta → Heuristic → ConfidenceGate(0.70) → AiFallback → PostProcess
- Rationale: Research validates as dominant pattern (Express.js, Scrapy, uBlock Origin). Confidence gates act as circuit breakers — skip expensive layers when accumulated confidence is sufficient. Each middleware independently testable. Site configs can customize layer ordering. Onion model enables timing/tracing in same middleware.
- Affects: `packages/engine/src/pipeline/` new directory; each extraction layer becomes standalone middleware; site config schema gains optional `pipelineHints`; replaces current sequential extraction code.

**ADR-REV-SE6: React Controlled Form Bypass — Native Setter (PATTERN-SE9)**
- Decision: All autofill field writes MUST use native property descriptor setter followed by synthetic event dispatch (`input` → `change` → `blur`). Mandatory pattern, not optional.
- Rationale: React, Vue, Angular all ignore `element.value = x`. Native setter bypasses framework synthetic event systems. Confirmed by React issue #10135, Bitwarden fill scripts. Required for 80%+ of modern ATS platforms (Greenhouse, Workday, Lever). PRD "Project Scoping" explicitly requires native setter patterns.
- Affects: `packages/engine/src/autofill/fill-script-builder.ts` generates fill instructions using this pattern; content script adapter executes them.

**ADR-REV-SE7: Shadow DOM Traversal — TreeWalker + Browser APIs**
- Decision: Engine adapter layer handles open and closed Shadow DOM using TreeWalker for deep traversal with browser-specific shadow root access (`chrome.dom.openOrClosedShadowRoot` for Chrome, `element.openOrClosedShadowRoot` for Firefox, `element.shadowRoot` for Safari open-only).
- Rationale: SmartRecruiters uses multi-layered nested Shadow DOM with `<slot>` elements. Shadow DOM adoption growing across ATS platforms. Bitwarden's TreeWalker approach is the proven pattern. 200-field limit with priority filtering prevents performance issues.
- Affects: `apps/extension/src/features/scanning/dom-collector.ts` (new file); field detection receives flattened field list; content sentinel's MutationObserver observes Shadow DOM subtrees.

**ADR-REV-SE8: Operation ID (opid) Field Addressing — Fill Resilience**
- Decision: Assign unique operation ID (`opid`) to every detected form field at collection time via `data-jf-opid` attribute. Fill scripts reference fields by `opid`, not live DOM references. Use `WeakRef<Element>` for in-memory references.
- Rationale: DOM can change between field detection (sidebar review) and fill execution (user clicks autofill) — React re-renders, SPA transitions, lazy-loaded fields. Bitwarden's proven `opid` pattern decouples detection from execution. Fill script becomes declarative `{ opid, value }` instructions.
- Affects: Field detection pipeline assigns opids; autofill store references fields by opid; fill execution uses `document.querySelector('[data-jf-opid="..."]')` lookup; undo manager snapshots by opid.

## Extension Architecture (Revision 2)

**ADR-REV-EX5: Service Worker Lifecycle Management**
- Decision: Use `chrome.alarms` for ALL periodic tasks (config sync every 5min, telemetry flush every 2min, health check every 30min). No `setTimeout`/`setInterval` for recurring work. All fetch calls use `AbortSignal.timeout(10000)`. Content scripts implement port reconnection with exponential backoff.
- Rationale: MV3 service worker terminates after 30s idle. `setTimeout`/`setInterval` die with it. Only `chrome.alarms` survives across restarts. Fetch >30s triggers SW termination. Research confirms `chrome.alarms` is the only reliable periodic mechanism.
- Affects: Background script alarm registration on install/startup; API client fetch wrapper enforces 10s timeout; content script port reconnection; telemetry store dual flush strategy (alarm + threshold).

**ADR-REV-EX6: Admin Dashboard — Role-Based Routing in apps/web/**
- Decision: Admin dashboard is part of `apps/web/` using Next.js route groups and middleware-based auth gate. `/admin/*` routes check `profiles.is_admin` flag via Supabase. NOT a separate app.
- Route structure: `(user)/` group for user dashboard, `(admin)/` group for admin pages (dashboard, users, tiers, feedback, analytics, config).
- Rationale: Avoids monorepo complexity of separate app. Next.js route groups provide clean separation. Shared `@jobswyft/ui` library. Single Vercel deployment. Admin auth is a middleware concern.
- Affects: `apps/web/` directory structure with route groups; Next.js middleware for admin gate; API gains `/v1/admin/*` endpoints; `profiles` table gains `is_admin` boolean.

## Autofill Architecture Fix (Revision 2)

**ADR-REV-AUTOFILL-FIX: Undo Duration — Persistent**
- Decision: Undo is **persistent** with no timeout. Undo state removed only on: (a) page refresh/navigation, (b) external DOM mutation changing a previously-filled field's value, (c) user explicitly clicks "Undo." Snapshots stored in `chrome.storage.session`.
- Previous: 10-second undo window (incorrect — contradicted PRD FR45).
- Rationale: PRD FR45 is authoritative: "undo persists with no timeout and is removed only on page refresh or DOM field change." Persistent undo removes time pressure from user reviewing autofill results.
- Affects: Undo manager snapshot persistence; MutationObserver on filled fields for external change detection; sidebar undo button visibility; `chrome.storage.session` for snapshot storage (auto-clears on extension disable).

## Decision Impact Analysis

**Implementation Sequence (Updated):**
1. Engine package extraction (ADR-REV-D4) — structural foundation for all engine work
2. Config schema + Zod validation (ADR-REV-D3) — foundation for all config-driven decisions
3. Middleware pipeline infrastructure (ADR-REV-SE5) — core engine backbone
4. Selector registry storage + bundled defaults (ADR-REV-D1, I2) — enables extraction middleware
5. Extraction middleware layers + confidence scoring (ADR-REV-SE1, SE2) — Smart Engine layers
6. Native setter + opid addressing (ADR-REV-SE6, SE8) — autofill reliability foundation
7. Shadow DOM traversal (ADR-REV-SE7) — ATS compatibility
8. Communication refactor (ADR-REV-EX1) — Zustand state + typed commands
9. Service worker lifecycle (ADR-REV-EX5) — operational reliability
10. DOM readiness + Content Sentinel revision (ADR-REV-EX2) — improved detection
11. Self-healing selectors + fallback chains (ADR-REV-SE3) — resilience layer
12. Telemetry batch endpoint + extraction traces (ADR-REV-A1, D2) — observability
13. Config sync API + push notifications (ADR-REV-A2) — remote config delivery
14. Correction feedback loop + element picker (ADR-REV-EX3, EX4) — user feedback
15. AI circuit breaker (ADR-REV-A3) — AI resilience
16. Admin dashboard routing (ADR-REV-EX6) — web surface
17. Config pipeline + fast-path (ADR-REV-I1) — operational config management
18. Monitoring dashboard + alerts (ADR-REV-I3) — operational observability
19. CI/CD per-surface + integration (ADR-REV-I4) — deployment infrastructure

**Cross-Component Dependencies:**
- ADR-REV-D4 (engine package) → ADR-REV-SE5, SE6, SE7, SE8 (all engine internals depend on package structure)
- ADR-REV-SE5 (middleware pipeline) → ADR-REV-SE1, SE2, SE3 (extraction layers plug into pipeline)
- ADR-REV-SE8 (opid) → ADR-REV-SE6 (fill execution uses opid lookup) → Undo manager (snapshots by opid)
- ADR-REV-EX5 (SW lifecycle) → ADR-REV-A1 (telemetry flush), ADR-REV-A2 (config sync) — both use alarms
- ADR-REV-D3 (Zod configs) → ADR-REV-D1, SE1, SE4, EX2, I1, I2 (all config consumers)
- ADR-REV-SE3 (self-healing) ↔ ADR-REV-EX4 (correction feedback) — bidirectional data flow
- ADR-REV-A1 (telemetry) → ADR-REV-I3 (monitoring) → ADR-REV-I1 (config fast-path) — alert-driven config updates
- ADR-REV-EX1 (communication) → ADR-REV-EX2, EX3, EX4, EX5 (all extension features depend on communication layer)
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
