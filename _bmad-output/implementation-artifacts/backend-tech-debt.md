# Backend Tech Debt Registry

> Centralized tracking of API gaps and backend changes discovered during extension UI stories.
> Reviewed before starting each new epic. High-priority items resolved within current epic if possible.

## From Story EXT.1: WXT Extension Setup & Login

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| AUTH-01 | Verify token exchange flow works E2E (extension `signInWithIdToken` → Supabase → API JWT validation) | High | EXT.3 | Open |
| AUTH-02 | `GET /v1/auth/me` — Verify returns complete profile (name, email, tier, active_resume_id) | High | EXT.3 | Open |
| AUTH-03 | `POST /v1/auth/logout` — Verify invalidates server-side session | Medium | EXT.3 | Open |
| AUTH-04 | Profile auto-creation on first login — Verify Supabase trigger creates profile row + 5 free lifetime credits | High | EXT.3, EXT.10 | Open |

## From Story EXT.6: Match Analysis (Planned)

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| MATCH-01 | `POST /v1/ai/match` needs `match_type` parameter: `auto` (free, high-level) vs `detailed` (1 credit, comprehensive) | High | EXT.6 | Open |
| MATCH-02 | Backend daily auto-match rate limiting for free tier: 20/day per user, reset at midnight UTC, configurable via `global_config` | High | EXT.6, EXT.10 | Open |

## From Story EXT.7: AI Studio (Planned)

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| AI-01 | Remove or deprecate `/v1/ai/answer` endpoint — PRD removed Answer Generation tool, replaced with Chat | Medium | EXT.7 | Open |

## From Story EXT.8: AI Chat (Planned)

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| CHAT-01 | Build `POST /v1/ai/chat` endpoint — Does not exist. Spec: accepts `{ job_id, resume_id, message, conversation_history }`, returns `{ message, suggestions }`, costs 1 credit/message | High | EXT.8 | Open |
| CHAT-02 | AI prompt template for job-context chat — System prompt that includes job description + resume data for contextual Q&A | High | EXT.8 | Open |
| CHAT-03 | Question suggestion generation — Can be client-side templates initially, AI-powered in future iteration | Medium | EXT.8 | Open |

## From Story EXT.11: Feedback (Planned)

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| FEEDBACK-01 | Screenshot attachment support (FR84a) — Requires file upload to feedback endpoint + Supabase Storage bucket | Low | EXT.11 | Open |

---

## Summary

| Priority | Count | Items |
|----------|-------|-------|
| **High** | 7 | AUTH-01, AUTH-02, AUTH-04, MATCH-01, MATCH-02, CHAT-01, CHAT-02 |
| **Medium** | 2 | AUTH-03, AI-01 |
| **Low** | 2 | CHAT-03, FEEDBACK-01 |

**Next review:** Before starting Epic WEB (Web Dashboard).
