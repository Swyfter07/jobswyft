# Project Scoping & Phased Development

## MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — ship the thing that solves the core problem first, then build supporting infrastructure.

**#1 MVP Priority: Core Engine (Scan + Autofill)**

The scan engine and autofill engine are the foundation upon which the entire product is built. These must be the most robust, well-tested, and reliable components in the MVP. Everything else — AI tools, dashboards, config system — builds on top of a solid core engine.

**Core Engine Requirements:**
- 5-layer extraction pipeline (JSON-LD → CSS → OpenGraph → Heuristic → AI fallback) must be battle-tested across top 50 job boards
- Config-driven selector registry for rapid site support additions without code deploys
- Content Sentinel for reliable content-readiness detection
- Autofill with native setter patterns to bypass React/framework synthetic events
- Field detection with confidence scoring and stable IDs
- ATS detection for platform-specific form handling
- Persistent undo until page refresh/DOM change
- Comprehensive error handling and graceful degradation at every layer
- Extraction validation to ensure data quality before surfacing to user

## MVP Feature Set (Phase 1 — Launch)

Full MVP feature breakdown is in **Product Scope → MVP** above. Summary by surface:

- **Core Engine:** Scan (5-layer extraction + selector registry + content sentinel) + Autofill (field detection, ATS-aware, persistent undo) + Element picker
- **Extension:** Full feature set — auth, resumes, scan, quick match, Job Details Card, AI Studio (Match, Cover Letter, Outreach), Coach, autofill, model selection, usage display
- **Backend API:** All endpoints, AI provider abstraction (Claude + GPT, circuit breaker), config system, basic rate limiting, feedback capture
- **User Dashboard (Minimal):** Jobs list, account management, data/privacy controls

**Core User Journeys Supported:**
- Marcus (Active Hunter): Scan → match → generate → autofill → bulk apply
- Aisha (First-Time): Install → onboard → scan → quick match → generate → autofill
- Jenna (New Grad): Scan → Ask Coach → build confidence → generate → apply
- David (Returning): Re-auth → data persisted → resume ready → apply

## Phase 1.5 — Operational Tooling (Weeks 2-4 Post-Launch)

- Admin Dashboard (full): tier config UI, user management, feedback review, analytics
- Enhanced config propagation (real-time to all surfaces)
- User Dashboard: resume management page, billing placeholder
- Priya (Admin) journey fully supported

## Post-MVP Features

See **Product Scope → Growth Features** for full Phase 2-4 breakdown. Key additions per phase:

- **Phase 2 (Months 2-4):** Stripe + paid tiers, token-based credit system, browser expansion, bulk apply
- **Phase 3 (Months 4-6):** Smart recommendations, success tracking, resume suggestions, salary insights
- **Phase 4 (Months 6-9):** Team/enterprise, recruiter mode, public API, white-label

## Risk Mitigation Strategy

**Technical Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Core engine fails on major job board | Critical | Config-driven site support; 5-layer fallback pipeline; element picker manual override; telemetry for failure detection |
| AI provider outage | Medium | Dual-provider (Claude + GPT) with circuit breaker pattern |
| Chrome extension rejected by Web Store | High | Strict Manifest V3 compliance, Limited Use policy, published privacy policy |
| LinkedIn blocks extension | Medium | LinkedIn opt-in scanning; graceful degradation; prefer JSON-LD extraction |

**Market Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Simplify Jobs dominates market | High | Differentiate on intelligence (Coach, Match) not just autofill |
| Low free-to-paid conversion | Medium | Config-driven limits allow rapid experimentation; generous free tier proves value |
| Users don't trust AI-generated content | Medium | AI guardrails (no fabrication); editable outputs; "sounds like me" quality bar |

**Resource Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Team can't ship all surfaces simultaneously | High | Phase Admin Dashboard to 1.5; minimal User Dashboard; focus on extension + core engine |
| Backend complexity grows | Medium | Config-driven approach reduces code changes; Supabase handles auth/storage/RLS |
