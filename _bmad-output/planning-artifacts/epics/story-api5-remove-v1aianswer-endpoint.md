# Story API.5: Remove `/v1/ai/answer` Endpoint

**As a** developer maintaining the API,
**I want** the deprecated Answer endpoint removed,
**So that** the codebase stays clean and doesn't confuse future development.

**Source:** AI-01 — PRD removed "Answer Generation" tool; replaced by Chat (FR31-35)

## Acceptance Criteria

**Given** `/v1/ai/answer` exists in the API
**When** this story is complete
**Then** the endpoint is removed from `app/routers/ai.py`
**And** the Pydantic models for answer request/response are removed
**And** `specs/openapi.yaml` is updated to remove the `/v1/ai/answer` path
**And** any tests referencing `/v1/ai/answer` are removed or updated
**And** the UI mapper `mapAnswerResponse` (if it exists) is removed from `@jobswyft/ui`

**Given** the endpoint is removed
**When** a client calls `POST /v1/ai/answer`
**Then** it returns 404

## Technical Notes

- Check for any frontend references before removal (should be none — Answer tab was already removed from AI Studio)
- Low risk, standalone change

---
