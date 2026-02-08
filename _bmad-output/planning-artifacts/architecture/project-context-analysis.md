# Project Context Analysis

## Requirements Summary

**Scope:** 80 Functional Requirements + 44 Non-Functional Requirements across 3 surfaces

| Surface | Technology | Responsibility |
|---------|------------|----------------|
| Chrome Extension | WXT + React + Zustand | Primary UI - scan, autofill, AI tools |
| Web Dashboard | Next.js 14+ (App Router) | Job tracking, account management, billing |
| Backend API | FastAPI (Python) | Business logic, AI orchestration, data persistence |

**Deployment Targets:**

| Surface | Platform | MVP Approach |
|---------|----------|--------------|
| Extension | Chrome Web Store | Local unpacked for MVP |
| Dashboard | Vercel | Direct deploy via Vercel CLI |
| API | Railway | Direct deploy via Railway CLI |

**Implementation Priority:** Backend API + Database → Dashboard → Extension

## Architectural Drivers (From NFRs)

| Driver | Target | Impact |
|--------|--------|--------|
| **Performance** | Scan <2s, AI <5s, autofill <1s | Optimized extraction, streaming AI responses |
| **Reliability** | 99.9% uptime, graceful degradation | AI fallback (Claude → GPT), error handling |
| **Security** | TLS 1.3, encryption at rest, RLS | Supabase RLS policies, secure token handling |
| **Scalability** | 50K → 150K MAU | Horizontal scaling, efficient queries |
| **Privacy** | GDPR/CCPA, ephemeral AI outputs | No server-side AI content storage |

## Scale & Complexity

- **Complexity Level:** Medium-High
- **Primary Domain:** Multi-Surface Product (Extension + Web + API)
- **Database Tables:** ~7 (with RLS policies)
- **API Endpoint Groups:** ~8
- **AI Operations:** 5 (Match, Cover Letter, Chat, Outreach, Resume Parse)

## Technical Constraints

| Constraint | Architectural Impact |
|------------|---------------------|
| Chrome MV3 | Ephemeral service workers → chrome.storage + Zustand persistence |
| Side Panel API | Persistent panel alongside browsing; no Shadow DOM; `.dark` class on panel root |
| API-first | OpenAPI spec → generated TypeScript clients |
| Supabase | Auth + DB + Storage as unified provider |
| AI Abstraction | Claude primary + GPT fallback → provider interface needed |
| Monorepo | pnpm workspaces (TS) + uv (Python) |

## Cross-Cutting Concerns

1. **Authentication**: Supabase JWT shared across extension ↔ web ↔ API
2. **Four-State Progressive Model**: Logged Out → Non-Job Page → Job Detected → Full Power — side panel auto-adjusts to context
3. **Credit Tracking**: Hybrid model — 20 daily free match analyses + 5 lifetime AI credits (generative content), then subscription-based
4. **Error Handling**: Three-tier escalation — Inline Retry → Section Degraded → Full Re-Auth
5. **No Offline Mode**: Graceful degradation with clear "no connection" state; all AI features require API calls
6. **Subscription Tiers**: Feature gating based on plan (Free/Starter/Pro/Power)
7. **Streaming AI Responses**: Cover letters, outreach, coach chat stream progressively with cancel option
8. **State Preservation**: Detailed rules per event (tab switch, job URL change, manual reset, re-login) — see State Preservation Matrix
9. **Logging**: Comprehensive backend logging viewable on Railway dashboard (NFR42-44)
10. **User Feedback**: In-app feedback capture for product iteration (FR78-80)
11. **Accessibility**: WCAG 2.1 AA compliance, semantic HTML, ARIA patterns, reduced motion support

## Deferred Decisions

| Topic | Deferred To |
|-------|-------------|
| Scalability (50K→150K MAU) | Post-MVP (NFR27-29 marked Post-MVP) |
| CI/CD Pipeline | Post-MVP - using CLI direct deploy for MVP |
| Comprehensive Testing | Post-MVP - minimal testing acceptable for MVP (NFR39) |
| Chrome Web Store Publishing | Post-MVP - local unpacked for MVP |

## Explicitly NOT Included (vs Prototype)

| Feature | Reason |
|---------|--------|
| BYOK (Bring Your Own Key) | Not in PRD - subscription model only |
| WebSocket real-time sync | No value add - SSE for streaming AI, background sync for data |
| Offline mode | No offline features; graceful degradation with "no connection" state |
| Content script Shadow DOM sidebar | Using Chrome Side Panel API instead (persistent, no DOM conflicts) |

---
