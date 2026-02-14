# Alpha Phase Retrospective — Consolidated

**Date:** 2026-02-14
**Scope:** Epics 0–8, Epic EXT (Stories EXT-1 through EXT-5.5)
**Facilitator:** Bob (Scrum Master)
**Participants:** jobswyft (Project Lead), Mary (Analyst), John (PM), Winston (Architect), Amelia (Dev), Quinn (QA), Bob (SM)

---

## Phase Summary

| Metric | Value |
|--------|-------|
| Total Stories Completed | 20 (+ 4 superseded) |
| Epics Covered | 10 (Epic 0–8 + EXT) |
| Code Reviews Conducted | ~20 (multiple rounds on several) |
| Test Suite | 142 extension tests + ~80 API tests |
| Backend Tech Debt Items | 11 open |
| Backlog Stories Remaining | 3 (2-3, 3-3, 6-3) + EXT-1 in review |
| Duration | 2026-01-31 to 2026-02-14 |

### Epic Completion Status

| Epic | Name | Stories Done | Status |
|------|------|-------------|--------|
| 0 | UI Component Library | 2 done, 4 superseded | Closing |
| 1 | Auth & Account API | 2/2 | Closing |
| 2 | Resume Management API | 2/2 (+1 backlog: 2-3) | Closing |
| 3 | Job Scan & Match API | 2/2 (+1 backlog: 3-3) | Closing |
| 4 | AI Content Generation API | 2/2 | Closing |
| 5 | App & Job Tracking API | 2/2 | Closing |
| 6 | Usage & Subscription API | 2/2 (+1 backlog: 6-3) | Closing |
| 7 | Privacy & Feedback API | 2/2 | Closing |
| 8 | Deployment | 1/1 | Closing |
| EXT | Extension UI Build | 6 done, EXT-1 in review | Closing |

---

## Successes

1. **Consistent API patterns** — Envelope format (`ok()`, `paginated()`), error codes (`ErrorCode` enum), RLS policies, and response helpers established in Story 1.1 carried cleanly through all 15 API stories with zero drift.

2. **AI provider architecture** — Claude primary / GPT fallback pattern was well-designed in Story 2.1 and reused across match analysis, cover letter, answer, outreach, and job extraction endpoints without modification.

3. **shadcn UI pivot** — After the Tailwind v3/v4 failure in Story 0.1 Attempt 1, the clean redo with Tailwind v4 + Vite 7 + Storybook 10 produced a solid, framework-agnostic component library consumed identically by extension and dashboard.

4. **Scan engine hardening (EXT-5.5)** — Exceptionally thorough: fixture-based testing across 5 job boards (LinkedIn, Indeed, Greenhouse, Lever, Workday), content sentinel for dynamic pages, confidence scoring, AI extraction fallback, and frame aggregation.

5. **Story-to-story learning** — Each story's Dev Agent Record and code review findings fed forward into subsequent story creation, reducing repeat mistakes. Pattern references (response helpers, client usage, exception classes) became more precise over time.

6. **Code review rigor** — Multiple review rounds caught critical bugs: singleton Supabase clients (1.1), RLS client misuse (2.2), race conditions in job updates (3.1), frame pollution in content scripts (5.5), and dead code accumulation.

7. **Monorepo architecture** — pnpm workspaces + shared `@jobswyft/ui` package worked well across API, extension, and (placeholder) web app. The `mappers.ts` snake_case-to-camelCase layer kept boundaries clean.

---

## Challenges

1. **Tailwind v3/v4 mismatch (Story 0.1)** — AI agent silently downgraded shadcn's generated v4 output to v3 syntax without flagging the incompatibility. Required nuking the entire `packages/ui/` and rebuilding from scratch. **Root cause:** Agent assumed v3 was correct without verifying against the preset output.

2. **RLS vs admin client confusion** — Appeared in Stories 2.1, 2.2, and 3.1 before the pattern solidified: use `get_supabase_admin_client()` for writes (bypassing RLS with explicit `user_id` filtering), use `get_supabase_client()` for reads (RLS enforced). Took 3 stories to establish as muscle memory.

3. **EXT-1 stuck in review** — The first extension story was never formally closed via code review workflow. Accumulated staleness makes formal review less valuable now.

4. **Live testing gaps** — EXT-5.5 found 3 critical bugs during LinkedIn live testing that 128 automated tests missed:
   - Frame pollution: `allFrames: true` returned ad iframe content
   - Show More timing: sentinel fired before dynamic content loaded
   - Description truncation: line-clamp CSS hid actual content

5. **Backend tech debt accumulation** — 11 items accumulated during extension stories (7 high priority). Extension development revealed API gaps that weren't anticipated during backend epic planning.

6. **Superseded stories** — Epic 0 had 5 stories (0.1 through 0.6) superseded by the shadcn pivot. Planning effort was wasted, though the pivot itself was correct.

7. **Multiple code review rounds** — Story 1.1 required 3 review rounds before approval. While thorough, this suggests stories could benefit from clearer implementation guidance upfront to reduce review churn.

---

## Key Learnings

| # | Learning | Evidence | Apply To |
|---|----------|----------|----------|
| 1 | **Verify tool/library versions before coding** | Story 0.1 Tailwind v3/v4 disaster | All future stories |
| 2 | **Admin client for writes, RLS client for reads** | Stories 2.1, 2.2, 3.1 confusion | Document in CLAUDE.md |
| 3 | **Fixture-based testing for DOM parsing** | EXT-5.5's 28 integration tests caught real bugs | All extension parsing work |
| 4 | **Chrome extension API quirks** | `*.content.ts` naming, `allFrames` pollution, session storage cooldowns | Extension stories |
| 5 | **Live testing catches what unit tests miss** | 3 critical bugs found only in LinkedIn live testing | Mandate live testing for extension stories |
| 6 | **Code review catches real bugs, not just style** | Race conditions, security issues, data leaks found | Keep rigorous review process |
| 7 | **Story-to-story learning compounds** | Later stories had fewer review findings | Continue Dev Agent Record pattern |
| 8 | **Bundle size discipline for content scripts** | Sentinel exceeded 3KB target due to WXT runtime | Set budgets, measure early |
| 9 | **Plan for API gaps during frontend work** | 11 backend tech debt items from EXT stories | Create backend enhancement epic alongside frontend epic |
| 10 | **Don't over-plan components before architecture decisions** | 5 superseded Epic 0 stories | Make foundational decisions first, then plan stories |

---

## Technical Debt Carried Forward

### High Priority (7 items)

| ID | Description | Affects |
|----|-------------|---------|
| AUTH-01 | E2E token exchange verification (extension signInWithIdToken → Supabase → API JWT) | Auth flow |
| AUTH-02 | GET /v1/auth/me — verify returns complete profile | Profile display |
| AUTH-04 | Profile auto-creation + 5 free credits on first login | Onboarding |
| MATCH-01 | POST /v1/ai/match needs `match_type` param: `auto` (free) vs `detailed` (1 credit) | Match analysis |
| MATCH-02 | Daily auto-match rate limiting for free tier (20/day) | Usage system |
| CHAT-01 | Build POST /v1/ai/chat endpoint (does not exist) | AI Chat feature |
| CHAT-02 | AI prompt template for job-context chat | AI Chat feature |

### Medium Priority (3 items)

| ID | Description | Affects |
|----|-------------|---------|
| AUTH-03 | POST /v1/auth/logout server-side invalidation verification | Security |
| AI-01 | Deprecate /v1/ai/answer endpoint (replaced by Chat per PRD) | API cleanup |
| CHAT-03 | Question suggestion generation | UX enhancement |

### Low Priority (1 item)

| ID | Description | Affects |
|----|-------------|---------|
| FEEDBACK-01 | Screenshot attachment support for feedback endpoint | Feedback feature |

### Backlog Stories (Carried Forward for Redefinition)

| Story | Description | Rationale for Carry-Forward |
|-------|-------------|-----------------------------|
| 2-3 | Resume parsed data extensions (highlights, certs, projects, website) | Nice-to-have, not blocking |
| 3-3 | Job data schema enhancements (posted_at, logo, employment_type surface) | Nice-to-have, not blocking |
| 6-3 | Credit system API/UI alignment (unified credit endpoint shape) | Needed for EXT-10 |
| EXT-1 | WXT extension setup (in review) | Close out, work is done |

---

## Action Items

1. **Archive all alpha phase implementation artifacts** — Move to `_bmad-output/archive/alpha/`
2. **Close all current epics** in sprint-status.yaml — Mark as `done`
3. **Close EXT-1** — Mark as done (review is stale, work is complete)
4. **Supersede backlog stories** (2-3, 3-3, 6-3) — Redefine in new epics
5. **Create new epics** incorporating:
   - Backend tech debt (11 items)
   - Remaining extension stories (EXT-6 through EXT-12)
   - Carried-forward backlog items
6. **Update CLAUDE.md** with solidified patterns (admin vs RLS client, etc.)

---

## Next Steps

1. Archive alpha artifacts
2. `/bmad-bmm-edit-prd` — if scope has changed
3. `/bmad-bmm-create-epics-and-stories` — new epic numbering
4. `/bmad-bmm-check-implementation-readiness` — sanity check
5. `/bmad-bmm-sprint-planning` — fresh sprint plan
6. Resume implementation cycle
