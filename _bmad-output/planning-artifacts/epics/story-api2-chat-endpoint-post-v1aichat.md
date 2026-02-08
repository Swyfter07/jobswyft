# Story API.2: Chat Endpoint (`POST /v1/ai/chat`)

**As a** job seeker using AI Studio Chat or Coach,
**I want** a backend endpoint that accepts my message and streams an AI response,
**So that** I can have conversational interactions about job postings and career strategy.

**Source:** CHAT-01, CHAT-02 — unblocks EXT.8 (Chat) and EXT.12 (Coach)

## Acceptance Criteria

**Given** the chat endpoint does not exist yet
**When** this story is complete
**Then** `POST /v1/ai/chat` exists and accepts:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "message": "string",
  "conversation_history": [{"role": "user|assistant", "content": "..."}],
  "context_type": "chat | coach"
}
```
**And** response is `text/event-stream` (SSE) using API.1 infrastructure
**And** SSE events follow the standard format: `chunk`, `done` (with `credits_remaining` and optional `suggestions`), `error`

**Given** `context_type=chat`
**When** the endpoint processes the request
**Then** the AI prompt template focuses on factual Q&A about the job posting
**And** the prompt includes: job description, user's resume summary, conversation history
**And** the tone is informative and direct

**Given** `context_type=coach`
**When** the endpoint processes the request
**Then** the AI prompt template focuses on strategic career coaching
**And** the prompt includes: job description, user's resume summary, match analysis results (if available), conversation history
**And** the tone is advisory, encouraging, and strategically focused
**And** the AI is instructed to provide actionable advice on: application strategy, interview preparation, skill gap mitigation

**Given** the user sends a message
**When** credit check runs
**Then** 1 AI credit is deducted on successful completion
**And** credits are NOT deducted if generation fails or is cancelled (NFR24)
**And** `credits_remaining` is included in the `done` event

**Given** the endpoint receives invalid input
**When** validation fails
**Then** standard error envelope is returned: `{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "..."}}`

## Dependencies

- API.1 (SSE infrastructure) must be complete

---
