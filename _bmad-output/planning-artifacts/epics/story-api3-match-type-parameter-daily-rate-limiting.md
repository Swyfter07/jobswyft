# Story API.3: Match Type Parameter + Daily Rate Limiting

**As a** user getting match analysis,
**I want** the backend to distinguish between free auto-matches and paid detailed matches,
**So that** free users get 20 daily auto-matches while detailed analysis costs 1 credit.

**Source:** MATCH-01, MATCH-02 — unblocks EXT.6, EXT.10

## Acceptance Criteria

**Given** `POST /v1/ai/match` exists
**When** this story is complete
**Then** the endpoint accepts an additional `match_type` parameter: `"auto"` or `"detailed"`

**Given** `match_type=auto`
**When** a free-tier user requests a match
**Then** no AI credits are deducted
**And** daily counter increments (tracked per user per UTC day)
**And** if daily count >= 20 → reject with `{"code": "DAILY_LIMIT_REACHED", "message": "Auto-match limit reached (20/day). Upgrade for unlimited."}`
**And** paid-tier users have unlimited auto-matches (no daily limit)

**Given** `match_type=detailed`
**When** a user requests a detailed match
**Then** 1 AI credit is deducted
**And** comprehensive analysis is returned (strengths, gaps, recommendations)
**And** if credits = 0 → reject with `{"code": "CREDIT_EXHAUSTED", "message": "..."}`

**Given** rate limiting needs persistence
**When** daily counts are tracked
**Then** counts are stored in `usage_events` table (or similar) with UTC date key
**And** counts reset at midnight UTC automatically
**And** `GET /v1/usage` response includes `auto_matches_today` and `auto_matches_limit` fields

## Technical Notes

- Add `match_type` enum to the Pydantic request model
- Daily counter can use existing `usage_events` table with `event_type='auto_match'`
- Consider Redis for high-frequency rate limiting post-MVP; DB-based is fine for MVP

---
