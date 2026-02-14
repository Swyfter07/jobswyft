# Project Context Analysis

## Requirements Overview

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

## Technical Constraints & Dependencies

- **Chrome MV3:** Service worker lifecycle, content script sandboxing, message passing APIs, storage quotas
- **400px Side Panel:** All extension UI must fit within constrained viewport
- **Supabase:** Auth provider, PostgreSQL database, Edge Functions, real-time subscriptions
- **ATS Platform Diversity:** No standardized DOM structure; each platform requires distinct selectors/strategies
- **Bundle Size:** Extension must remain performant; heavy AI libraries must be API-side
- **Content Security Policy:** Extension CSP restricts inline scripts, eval, and external resource loading

## Cross-Cutting Concerns Identified

1. **Authentication & Session Management** — Supabase JWT flows across extension (background ↔ content script ↔ side panel), web (Next.js middleware), and API (FastAPI dependency injection)
2. **State Synchronization** — Extension local state (Zustand) ↔ API persistence ↔ Web dashboard views; conflict resolution for offline-to-online transitions
3. **Error Handling & Degradation** — Layered fallback strategy: cached configs → local extraction → degraded UI states; error boundaries per surface
4. **Telemetry & Observability** — Extraction success/failure rates, selector health metrics, autofill completion tracking, API latency monitoring
5. **Config Management** — Site selector configs (JSON), feature flags, remote sync with delta updates, versioned config schema
6. **Security Boundaries** — Content script isolation, CSP compliance, credential handling, PII minimization in telemetry

## Revision Delta (New Since 2026-01-30)

| Input | Architectural Impact |
|-------|---------------------|
| Smart Engine Vision | Unifies scan + autofill into shared core engine; introduces capability layers L0-L4 |
| Technical Research | Validates hexagonal architecture; adds self-healing selectors, Similo-inspired confidence scoring |
| Core Engine Addendum | Defines selector registry, extraction trace, element picker, correction feedback loop |
| Scan Engine Addendum | Refines 5-layer extraction pipeline, content sentinel, delayed verification |
| UX Design Spec | Constrains UI architecture: 400px panel, four-state unlock, functional area colors |
| EXT-5/5.5 Learnings | Real implementation feedback on detection timing, DOM readiness, state management |
