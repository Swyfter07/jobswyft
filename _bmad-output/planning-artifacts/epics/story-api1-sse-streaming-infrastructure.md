# Story API.1: SSE Streaming Infrastructure

**As a** developer building AI-powered features,
**I want** a shared SSE streaming foundation in the FastAPI backend,
**So that** all generative AI endpoints can stream responses consistently without duplicating infrastructure code.

**Source:** NFR6a, tech debt items across EXT.7, EXT.8, EXT.12

## Acceptance Criteria

**Given** the FastAPI backend needs to support SSE streaming
**When** this story is complete
**Then** a shared `sse_response()` helper exists in `app/lib/streaming.py` (or similar)
**And** it wraps any async generator into a `StreamingResponse` with `content-type: text/event-stream`
**And** it emits standardized events: `event: chunk` → `{"text": "..."}`, `event: done` → `{"credits_remaining": N}`, `event: error` → `{"code": "...", "message": "..."}`
**And** it handles client disconnect (cancel) gracefully — stops generation, does NOT deduct credits
**And** it includes `Cache-Control: no-cache` and `Connection: keep-alive` headers

**Given** the SSE helper is built
**When** a developer creates a new streaming endpoint
**Then** they can use `return sse_response(my_generator())` as a one-liner
**And** error handling, event formatting, and disconnect detection are automatic

**Given** the SSE infrastructure needs testing
**When** unit tests run
**Then** tests verify: chunk streaming, done event, error event, client disconnect handling, credit non-deduction on cancel

## Technical Notes

- FastAPI `StreamingResponse` with `media_type="text/event-stream"`
- Async generator pattern: `yield` chunks from AI provider, format as SSE events
- AI provider abstraction layer should return an async iterator for streaming
- Consider `asyncio.CancelledError` for disconnect detection

---
