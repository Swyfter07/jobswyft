# Epic List

## Epic 8: Deployment & Infrastructure (COMPLETE)

Deploy all Jobswyft surfaces to their production hosting platforms.

**Epic Goal:** All Jobswyft services are deployed and accessible on production URLs.

**Stories:**

- Story 8.1: Railway API Deployment (DONE)
- _(subsequent: Vercel Dashboard deploy, Extension packaging — future)_

---

## Epic EXT: Chrome Extension Sidepanel Build (Full-Stack Vertical Slices)

Build the Chrome Extension surface end-to-end, one sidepanel section at a time. Each story delivers a **complete vertical slice**: UI components (Storybook) → Extension integration (WXT + Zustand) → Backend wiring (API) → E2E verification.

**Epic Goal:** Users can install and use the Jobswyft Chrome Extension with full UI/UX across all 4 sidebar states — login, navigation, resume management, job scanning, AI-powered content generation, form autofill, usage tracking, and feedback — with complete backend API integration.

**FRs covered:** FR1-FR4, FR7-FR49, FR37a-FR37f, FR57-FR60, FR60a-b, FR64-FR72d, FR83-FR84a

**Surfaces:** packages/ui (Storybook), apps/extension (WXT Side Panel), apps/api (FastAPI)

**Story approach:** All stories defined upfront. Each follows the [Component Development Methodology](#component-development-methodology).

**Stories (14 total, 1 done):**

| #           | Story                                        | User Value                                                                           | Status      |
| ----------- | -------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- |
| EXT.1       | WXT Extension Setup & Login                  | Users can install extension and sign in with Google                                  | DONE        |
| EXT.2       | Component Library Reorganization             | Clean foundation: proper categories, reference separation, consistent patterns       | Pending     |
| EXT.3       | Authenticated Navigation & Sidebar Shell     | Users can navigate the 4-tab sidebar with state preservation                         | Pending     |
| EXT.4       | Resume Management                            | Users can upload, view, and manage resumes in the sidebar                            | Pending     |
| **EXT.4.5** | **Component Library Cleanup & UX Alignment** | **Developers build on official UX-compliant components, not prototype references**   | **Pending** |
| EXT.5       | Job Page Scanning & Job Card                 | Users can scan job pages and save jobs                                               | Pending     |
| **EXT.5.5** | **Scan Engine Hardening**                    | **Reliable extraction with confidence scoring, sentinel detection, and AI fallback** | **Pending** |
| EXT.6       | Match Analysis (Auto + Detailed)             | Users can instantly see how they match a job                                         | Pending     |
| EXT.7       | AI Studio — Cover Letter & Outreach          | Users can generate tailored application content (SSE streaming)                      | Pending     |
| EXT.8       | AI Studio — Chat                             | Users can ask questions about a job posting (AI Studio sub-tab)                      | Pending     |
| EXT.9       | Form Autofill                                | Users can auto-fill application forms                                                | Pending     |
| EXT.10      | Usage, Credits & Upgrade Prompts             | Users can see their balance and understand limits                                    | Pending     |
| EXT.11      | Feedback                                     | Users can report issues and share ideas                                              | Pending     |
| EXT.12      | Coach Tab                                    | Users get personalized AI coaching for the current job                               | Pending     |

**Dependencies:**

```
EXT.1 (DONE) → EXT.2 (cleanup) → EXT.3 (navigation, auth store, state preservation)
                                     ↓
                                  EXT.4 (resume) → EXT.4.5 (component cleanup & UX alignment) → EXT.5 (scan + job card)
                                                                                                      ↓
                                                                                               EXT.5.5 (scan hardening) → EXT.6 (match) → EXT.7 (cover letter + outreach, SSE streaming)
                                                                                                                 → EXT.8 (AI Studio chat sub-tab, SSE streaming)
                                                                                                                 → EXT.9 (autofill)
                                                                                                                 → EXT.12 (coach standalone tab, SSE streaming)
                                                                                                   EXT.10 (credits — cross-cutting, retrofits into EXT.6-9, EXT.12)
                                                                                                   EXT.11 (feedback — standalone)
```

---

## Epic API: Backend API Enhancements (Parallel with EXT)

Deliver all backend API changes discovered during Chrome Extension development. Each story addresses a gap identified in Epic EXT stories, enabling frontend stories to proceed with mocked responses while real endpoints are built in parallel.

**Epic Goal:** All API endpoints required by the Chrome Extension are production-ready — SSE streaming infrastructure, new chat/coach endpoints, match parameter additions, rate limiting, and dead endpoint cleanup.

**Surfaces:** apps/api (FastAPI), supabase/migrations (if schema changes needed)

**Relationship to Epic EXT:** Epic API runs **in parallel** with Epic EXT. Frontend stories mock API responses; when an API story ships, the corresponding EXT story wires to the real endpoint. Tech debt items from EXT stories feed directly into API stories.

**Stories (initial — grows as EXT stories discover gaps):**

| #                                        | Story                                   | Source Tech Debt   | Unblocks             | Priority |
| ---------------------------------------- | --------------------------------------- | ------------------ | -------------------- | -------- |
| API.1                                    | SSE Streaming Infrastructure            | NFR6a              | EXT.7, EXT.8, EXT.12 | High     |
| API.2                                    | Chat Endpoint (`POST /v1/ai/chat`)      | CHAT-01, CHAT-02   | EXT.8, EXT.12        | High     |
| API.3                                    | Match Type Param + Daily Rate Limiting  | MATCH-01, MATCH-02 | EXT.6, EXT.10        | High     |
| API.4                                    | Coach Prompt Templates                  | COACH-01, COACH-02 | EXT.12               | High     |
| API.5                                    | Remove `/v1/ai/answer` Endpoint         | AI-01              | EXT.7 (cleanup)      | Medium   |
| API.6                                    | SSE Migration — Cover Letter + Outreach | NFR6a              | EXT.7                | Medium   |
| _More discovered during EXT development_ |                                         |                    |                      |

**Dependencies:**

```
API.1 (SSE infra) → API.2 (chat endpoint, uses SSE)
                   → API.6 (cover-letter + outreach SSE migration)
API.2 → API.4 (coach prompts, extends chat endpoint with context_type)
API.3 (match params) — standalone
API.5 (remove /answer) — standalone
```

**FRs covered:** FR31-FR35 (backend), FR37a-FR37f (backend), NFR6a-NFR6b (streaming)

---

## Epic WEB: Web Dashboard (Future)

Build the Next.js web dashboard for job tracking, account management, and privacy controls.

**Epic Goal:** Users can manage their jobs, resumes, account, and data privacy from a web dashboard.

**FRs covered:** FR3, FR5-6, FR50-56, FR73-77, FR78-82, FR85

---

## Epic POST-MVP: Subscriptions & Growth (Future)

Add paid subscription management and referral credits.

**Epic Goal:** Users can subscribe to paid plans, manage billing, and earn referral credits.

**FRs covered:** FR61-62, FR63, NFR27-29, NFR33

---
