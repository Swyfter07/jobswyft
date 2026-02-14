# Epic List

## Parallel Execution Plan

```
Phase 0 (Foundation — Parallel):
  Epic 1: Extension Stabilization & UI Polish  ─────────┐
  Epic 2: Engine Package                        ─────────┤
                                                         ▼
Phase 1 (4 Parallel Lanes):                       ┌──────────────┐
  Lane 1: Epic 3 (Match) + IC-1                   │   Engine +   │
  Lane 2: Epic 6 (Autofill) + IC-2                │   Clean UI   │
  Lane 3: Epic 8 (Feedback)                        │  Foundation  │
  Lane 4: Epic 9 (Web Dashboard)                   └──────────────┘

Phase 2 (Parallel):
  Lane 1: Epic 4 (Content Studio)
  Lane 3: Epic 7 (Usage/Credits)
  Lane 4: Epic 10 (Admin Dashboard)

Phase 3:
  Lane 1: Epic 5 (Coach) + IC-3
  Lane 4: IC-4

Post-MVP:
  Epic 11: Subscriptions & Growth
```

## Integration Checkpoints

| Checkpoint | After | Validates | Scope |
|------------|-------|-----------|-------|
| **IC-1** | Epic 2 + Epic 3 | Engine extraction → Match analysis E2E | Scan a job → engine extracts → API match → score displayed in sidebar |
| **IC-2** | Epic 6 | Engine autofill → Form fill E2E | Detect fields → engine maps → native fill → undo works across ATS platforms |
| **IC-3** | Epic 4 + Epic 5 | Full AI Studio + Coach E2E | Cover letter + outreach + coach streaming, credit deduction, model selection |
| **IC-4** | Epic 9 | Cross-surface integration | Same data visible in extension AND dashboard, auth shared, state consistent |

---

## Epic 1: Extension Stabilization & UI Polish

Fix bugs, inconsistent UI, missing Storybook stories, and component gaps across the existing vibecoded extension codebase. Establish a clean, reliable baseline before building new features.

**Epic Goal:** All existing extension components are bug-free, visually consistent across dark/light themes, have complete Storybook story coverage, and follow the established design language (semantic tokens, CVA variants, accessibility).

**Scope:**
- Bug fixes across existing extension components
- UI consistency audit — enforce semantic tokens, eliminate hardcoded colors
- Missing Storybook stories — ensure all official components have complete coverage (dark/light, 360×600 viewport)
- Component gaps — build any missing blocks/features referenced but not implemented
- Design language compliance (CVA variants, `.text-micro`, accent card patterns, scrollbar utilities)
- Dark/light theme parity
- Extension state management cleanup (Zustand store hygiene)
- Test coverage for critical user flows

**FRs covered:** No new FRs — quality improvement for existing FR implementations (FR1-FR4, FR7-FR22b, FR48-FR56, FR67-FR72d)
**NFRs addressed:** NFR44a-e (accessibility), NFR47 (crash rate), NFR5 (sidebar open speed)
**Surfaces:** `packages/ui/`, `apps/extension/`
**Phase:** 0 (Foundation) — parallel with Epic 2
**Dependencies:** None — fixes what exists

---

## Epic 2: Engine Package — Detection, Extraction & Autofill Core

Extract the core detection, extraction, and autofill logic into `packages/engine/` (`@jobswyft/engine`). Zero Chrome API dependencies. Testable with JSDOM/happy-dom. Extension becomes a thin Chrome adapter layer.

**Epic Goal:** A standalone, thoroughly tested engine package that powers both job scanning and form autofill across any surface, with a middleware extraction pipeline, confidence scoring, self-healing selectors, and config-driven site support.

**Scope:**
- Extract existing scan engine from extension into `packages/engine/`
- Middleware extraction pipeline (BoardDetector → JsonLd → Gate(0.85) → CssSelector → Gate(0.75) → OgMeta → Heuristic → Gate(0.70) → AiFallback → PostProcess)
- Smart engine patterns: confidence scoring (SE2), self-healing selectors (SE3), config-driven site support (SE4)
- Autofill core: field detection, native property descriptor setter (SE6), shadow DOM traversal (SE7), opid addressing (SE8)
- Site config system (`configs/sites/{domain}.json`)
- Extension adapter layer (thin Chrome wrapper importing from engine)
- Comprehensive JSDOM/happy-dom test suite with job board fixtures

**FRs covered (infrastructure for):** FR14-FR22b (scanning), FR42-FR47 (autofill)
**Architecture:** ADR-REV-D4, ADR-REV-SE1-SE8, ADR-REV-SE5, PATTERN-SE1-SE10
**NFRs addressed:** NFR1 (<2s scan), NFR4 (<1s autofill), NFR7 (95% extraction), NFR8 (85% AI fallback), NFR9 (90% autofill mapping)
**Surfaces:** `packages/engine/`, `apps/extension/` (adapter)
**Phase:** 0 (Foundation) — parallel with Epic 1
**Dependencies:** None — extracts from existing alpha code

---

## Epic 3: Job Match Intelligence

Users instantly see how well they match any scanned job — free quick analysis on every scan, paid deep analysis on demand.

**Epic Goal:** After scanning a job, users see a match score with strengths/gaps in the job card. They can request detailed analysis for deeper recommendations. Auth E2E flow is verified.

**FRs covered:** FR23-FR25, FR23a-FR23d
**Tech debt resolved:** AUTH-01, AUTH-02, AUTH-04, MATCH-01, MATCH-02
**Existing stories:** EXT.6 + API.3 + IC-1 integration story
**NFRs addressed:** NFR3a (<2s auto match), NFR3b (<5s detailed), NFR24 (no credit decrement on failure)
**Surfaces:** `apps/extension/`, `apps/api/`, `packages/ui/`
**Phase:** 1, Lane 1 (AI Features)
**Dependencies:** Epic 2 (engine extraction output)

---

## Epic 4: AI Content Studio — Cover Letter & Outreach

Users generate tailored cover letters (with tone, length, custom instructions, PDF export) and recruiter outreach messages, delivered via real-time SSE streaming.

**Epic Goal:** Users can generate, edit, regenerate, copy, and export AI-powered cover letters and outreach messages with streaming delivery and cancel support.

**FRs covered:** FR26-FR30, FR26a, FR36-FR37, FR36a-c, FR38-FR41
**Tech debt resolved:** AI-01 (remove /v1/ai/answer), SSE infrastructure
**Existing stories:** EXT.7 + API.1 + API.5 + API.6
**NFRs addressed:** NFR2 (<5s generation), NFR6a (SSE streaming), NFR24 (no credit decrement on failure)
**Surfaces:** `apps/extension/`, `apps/api/`, `packages/ui/`
**Phase:** 2, Lane 1 (AI Features)
**Dependencies:** Epic 3 (match data context), API.1 SSE infrastructure built here

---

## Epic 5: AI Career Coach

Users get personalized career coaching — conversational AI grounded in resume and job context, with skill-based entry points, session management, and streaming responses.

**Epic Goal:** Users can start coached conversations about interview prep, application strategy, and skill gaps for the current job, with full session management and credit tracking.

**FRs covered:** FR37a-FR37h, FR37f-i, FR37f-ii
**Tech debt resolved:** CHAT-01, CHAT-02, CHAT-03, COACH-01, COACH-02, COACH-03
**Existing stories:** EXT.12 + API.2 + API.4 + IC-3 integration story
**NFRs addressed:** NFR2 (<5s generation), NFR6a (SSE streaming)
**Surfaces:** `apps/extension/`, `apps/api/`, `packages/ui/`
**Phase:** 3, Lane 1 (AI Features)
**Dependencies:** Epic 4 (SSE infrastructure from API.1)

---

## Epic 6: Smart Form Autofill

Users auto-fill application forms with one click — field preview before execution, intelligent mapping, visual confirmation, undo, resume upload, and cover letter injection.

**Epic Goal:** Users can preview detected form fields, execute autofill with visual feedback, undo any fill, and include resume/cover letter uploads — across major ATS platforms.

**FRs covered:** FR42-FR47, FR42a-FR42b, FR44a
**Existing stories:** EXT.9 + IC-2 integration story
**NFRs addressed:** NFR4 (<1s autofill), NFR9 (90% mapping accuracy)
**Surfaces:** `apps/extension/`, `packages/ui/`, `packages/engine/`
**Phase:** 1, Lane 2 (Autofill) — parallel with Lane 1
**Dependencies:** Epic 2 (engine autofill core)

---

## Epic 7: Usage, Credits & Upgrade Flow

Users track their AI credit balance, see daily auto-match limits, select AI models with per-operation pricing, and receive clear upgrade prompts when credits run out.

**Epic Goal:** Users understand their usage at a glance, get blocked gracefully when out of credits, and see clear paths to upgrade. Credit gates retrofitted across all AI features.

**FRs covered:** FR38a-FR38c, FR57-FR66c (excluding FR61-FR63 Post-MVP)
**Superseded story resolved:** 6-3 (credit alignment)
**Existing stories:** EXT.10
**NFRs addressed:** NFR24 (no decrement on failure), NFR52 (rate limiting UX)
**Surfaces:** `apps/extension/`, `apps/api/`, `packages/ui/`
**Phase:** 2, Lane 3 (Cross-cutting)
**Dependencies:** At least one credit-consuming feature live (Epic 3 or 4)
**Note:** Cross-cutting — retrofits credit gates into Epics 3-6

---

## Epic 8: User Feedback

Users report bugs, suggest features, and share ideas with contextual metadata and optional screenshot attachment from the sidebar.

**Epic Goal:** Users can submit categorized feedback with automatic context capture and optional screenshots, accessible from the extension sidebar.

**FRs covered:** FR83-FR85, FR83a, FR84, FR84a
**Tech debt resolved:** FEEDBACK-01 (screenshot attachment)
**Existing stories:** EXT.11
**Surfaces:** `apps/extension/`, `apps/api/`, `packages/ui/`
**Phase:** 1, Lane 3 (Cross-cutting)
**Dependencies:** None beyond alpha auth — standalone feature

---

## Epic 9: Web Dashboard — Jobs, Resumes & Account

Users manage their tracked jobs, resumes, account settings, and privacy controls from a full web dashboard with usage visibility.

**Epic Goal:** Users can access a web dashboard to view/manage jobs, resumes, account settings, data privacy, and usage — sharing the same backend as the extension.

**FRs covered:** FR3, FR5-FR6, FR50-FR56, FR73-FR77, FR78-FR82
**Superseded stories resolved:** 2-3 (resume extensions), 3-3 (job schema enhancements)
**Existing stories:** None (greenfield Next.js) + IC-4 integration story
**NFRs addressed:** NFR35 (browser compatibility), NFR38 (independent deployment)
**Surfaces:** `apps/web/`, `packages/ui/`
**Phase:** 1-2, Lane 4 (Web)
**Dependencies:** None — uses existing backend APIs from alpha

---

## Epic 10: Admin Dashboard

Admins configure tier definitions, manage users, review analytics and feedback, and manage system-wide configuration — all changes propagate to all surfaces without code deploys.

**Epic Goal:** Admin users can manage the entire platform: users, tiers, pricing, rate limits, analytics, and feedback — with configuration propagation to all surfaces.

**FRs covered:** FR86-FR95
**NFRs addressed:** NFR45-NFR46 (admin access control + audit logging), NFR50 (config propagation <5min)
**Surfaces:** `apps/web/` (route groups per ADR-REV-EX6), `apps/api/`
**Phase:** 2, Lane 4 (Web)
**Dependencies:** Epic 9 (shared Next.js app shell)

---

## Epic 11: Subscriptions & Growth (Post-MVP)

Users subscribe to paid plans, manage billing, and earn referral credits.

**Epic Goal:** Replace mocked Stripe integration with real subscription management, billing portal, and referral credit system.

**FRs covered:** FR61-FR63, FR66a-FR66c
**NFRs addressed:** NFR27-NFR29 (scalability), NFR33 (payment processing)
**Surfaces:** `apps/web/`, `apps/api/`, `apps/extension/`
**Phase:** Post-MVP
**Dependencies:** Epic 7 (credit system), Epic 9 (web dashboard)

---
