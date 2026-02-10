# From Story EXT.X: [Title]

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| AREA-NN | What needs to change | High/Med/Low | EXT.Y, WEB.Z | Open/Done |
```

**Rules:**
1. Every story that identifies a backend gap MUST add it to this file
2. Items are prefixed by area: AUTH-, RESUME-, JOB-, AI-, MATCH-, CHAT-, AUTOFILL-, USAGE-, FEEDBACK-
3. Priority reflects impact on user experience (High = blocks E2E flow, Med = degraded experience, Low = nice-to-have)
4. When starting a new epic (e.g., Epic WEB), the tech debt registry is reviewed first
5. High-priority items should be resolved within the current epic if possible
6. The registry is the **single source of truth** for API gaps — do not duplicate in story files

**Current known debt (from EXT.1 + story planning):**

| ID | Description | Priority | Affects | Status |
|----|-------------|----------|---------|--------|
| AUTH-01 | Verify token exchange flow works E2E (extension → API) | High | EXT.3 | Open |
| AUTH-04 | Profile auto-creation on first login — verify 5 free credits | High | EXT.3 | Open |
| MATCH-01 | `/v1/ai/match` needs `match_type` param (auto vs detailed) | High | EXT.6 | Open |
| MATCH-02 | Daily auto-match rate limiting for free tier (20/day) | High | EXT.6, EXT.10 | Open |
| AI-01 | Remove `/v1/ai/answer` endpoint (PRD removed Answer tool) | Medium | EXT.7 | Open |
| CHAT-01 | Build `POST /v1/ai/chat` endpoint (does not exist) | High | EXT.8 | Open |
| CHAT-02 | AI prompt template for job-context chat | High | EXT.8 | Open |
| FEEDBACK-01 | Screenshot attachment support (FR84a) | Low | EXT.11 | Open |
| COACH-01 | AI prompt template for coaching context (strategic/advisory tone, different from chat) | High | EXT.12 | Open |
| COACH-02 | Match-analysis-based coaching prompt generation (FR37f) | Medium | EXT.12 | Open |
| COACH-03 | Shared ChatPanel base component — Coach + AI Studio Chat share UI with different styling | Medium | EXT.8, EXT.12 | Open |

---

## Known API State (as of EXT.1 completion)

| Router | Endpoints | Status |
|--------|-----------|--------|
| Auth | 5 (login, callback, logout, me, account delete) | Implemented |
| Resumes | 5 (upload, list, get, set active, delete) | Implemented |
| Jobs | 8 (scan, create, list, get, update, status, delete, notes) | Implemented |
| AI | 5 (match, cover-letter, cover-letter/pdf, answer, outreach) | Implemented (needs: chat endpoint with SSE streaming, remove answer, auto-match vs detailed-match param, SSE streaming for cover-letter/outreach) |
| Autofill | 1 (data) | Implemented |
| Feedback | 1 (submit) | Implemented |
| Usage | 2 (balance, history) | Implemented |
| Subscriptions | 3 (checkout, portal, mock-cancel) | Implemented |
| Privacy | 4 (data-summary, delete-request, confirm-delete, cancel-delete) | Implemented |
| Webhooks | 1 (stripe) | Stub |

**Known gaps → tracked in Epic API:**
- `POST /v1/ai/chat` → **API.2** — Missing. Needs SSE streaming + `context_type` param (chat vs coach)
- Auto-match vs Detailed match → **API.3** — `/v1/ai/match` needs `match_type` param + daily rate limiting
- `/v1/ai/answer` → **API.5** — Remove dead endpoint (PRD removed Answer tool)
- SSE streaming → **API.1** (infrastructure) + **API.6** (cover-letter + outreach migration)
- Coach prompt templates → **API.4** — Strategic/advisory tone, match-analysis-based prompts

---
