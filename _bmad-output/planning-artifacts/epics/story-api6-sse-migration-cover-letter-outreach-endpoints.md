# Story API.6: SSE Migration — Cover Letter + Outreach Endpoints

**As a** user generating cover letters and outreach messages,
**I want** the AI response to stream progressively,
**So that** I see text appearing in real-time instead of waiting for the full response.

**Source:** NFR6a — unblocks EXT.7

## Acceptance Criteria

**Given** `POST /v1/ai/cover-letter` currently returns JSON
**When** this story is complete
**Then** it returns `text/event-stream` (SSE) using API.1 infrastructure
**And** events follow the standard format: `chunk` → `{"text": "..."}`, `done` → `{"credits_remaining": N}`, `error`
**And** client disconnect cancels generation and does not deduct credits

**Given** `POST /v1/ai/outreach` currently returns JSON
**When** this story is complete
**Then** it also returns `text/event-stream` (SSE) using the same pattern

**Given** `POST /v1/ai/cover-letter/pdf` exists
**When** PDF export is requested
**Then** it continues to return a PDF file (binary response, NOT streaming) — no change needed

**Given** existing tests cover these endpoints
**When** tests are updated
**Then** tests verify SSE streaming behavior (chunk events, done event, error handling, cancel)

## Dependencies

- API.1 (SSE infrastructure) must be complete
