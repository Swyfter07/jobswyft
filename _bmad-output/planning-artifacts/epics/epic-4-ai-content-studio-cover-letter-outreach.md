# Epic 4: AI Content Studio — Cover Letter & Outreach

Users generate tailored cover letters and outreach messages with real-time SSE streaming, editing, regeneration, and PDF export.

## Story 4.1: SSE Streaming Infrastructure

As a developer building AI-powered features,
I want a shared SSE streaming foundation in the FastAPI backend,
So that all generative AI endpoints stream responses consistently without duplicating infrastructure code.

**Acceptance Criteria:**

**Given** the FastAPI backend needs SSE streaming support (NFR6a)
**When** this story is complete
**Then** a shared `sse_response()` helper exists in `app/lib/streaming.py`
**And** it wraps any async generator into a `StreamingResponse` with `content-type: text/event-stream`
**And** it emits standardized events:
- `event: chunk` → `{"text": "partial content..."}`
- `event: done` → `{"credits_remaining": N, "tokens_used": M}`
- `event: error` → `{"code": "ERROR_CODE", "message": "..."}`
**And** it includes `Cache-Control: no-cache` and `Connection: keep-alive` headers

**Given** a client disconnects mid-stream (user clicks cancel)
**When** the server detects the disconnect
**Then** AI generation stops immediately (via `asyncio.CancelledError`)
**And** credits are NOT deducted (NFR24)
**And** no partial usage event is recorded

**Given** the AI provider abstraction layer
**When** a streaming generation is requested
**Then** the provider returns an async iterator yielding text chunks
**And** the `sse_response()` helper formats each chunk as an SSE event
**And** both Claude and GPT providers support the streaming interface

**Given** the SSE infrastructure is built
**When** a developer creates a new streaming endpoint
**Then** they can use `return sse_response(my_generator())` as a one-liner
**And** error handling, event formatting, and disconnect detection are automatic

**Given** unit tests for SSE infrastructure
**When** tests are run
**Then** tests verify: chunk streaming, done event with credit info, error event formatting, client disconnect handling, credit non-deduction on cancel
**And** at least 8 tests cover the streaming helper

---

## Story 4.2: Cover Letter & Outreach SSE Migration + Endpoint Cleanup

As a backend developer,
I want the cover letter and outreach endpoints migrated to SSE streaming and the deprecated answer endpoint removed,
So that AI content generation delivers progressive responses and the API surface is clean.

**Acceptance Criteria:**

**Given** `POST /v1/ai/cover-letter` currently returns JSON
**When** this story is complete
**Then** the endpoint returns an SSE stream using the `sse_response()` helper from Story 4.1
**And** the request body is unchanged: `{ job_id, resume_id, tone, length, custom_instructions, feedback?, previous_content? }`
**And** streaming begins within 500ms of request receipt
**And** the `done` event includes `credits_remaining` and `tokens_used`
**And** total generation completes within 5 seconds (NFR2)

**Given** `POST /v1/ai/outreach` currently returns JSON
**When** this story is complete
**Then** the endpoint returns an SSE stream using the same `sse_response()` helper
**And** the request body accepts: `{ job_id, resume_id, tone, length, custom_instructions, feedback?, previous_content? }`
**And** streaming behavior matches cover letter (progressive chunks, done event, error handling)

**Given** `POST /v1/ai/cover-letter/pdf` (PDF export)
**When** this story is complete
**Then** the PDF endpoint remains non-streaming (returns file download)
**And** PDF generation does NOT cost credits

**Given** the deprecated `/v1/ai/answer` endpoint (AI-01)
**When** this story is complete
**Then** the endpoint is removed from the router
**And** the corresponding service code, prompt templates, and tests are deleted
**And** the OpenAPI spec is updated to remove the endpoint

**Given** both streaming endpoints
**When** client disconnects mid-generation
**Then** credits are not deducted
**And** the `done` event is never sent (stream is terminated)

**Given** integration tests
**When** run against the migrated endpoints
**Then** tests verify: SSE event format, progressive streaming, done event credits, error handling, disconnect/cancel, and backward-incompatible JSON clients receive appropriate error guidance

---

## Story 4.3: Cover Letter UI — Generation, Editing & Export

As a job seeker ready to apply,
I want to generate a tailored cover letter with my preferred tone and length, see it stream in real-time, edit it, and export as PDF,
So that I can quickly create personalized cover letters that sound like me.

**Acceptance Criteria:**

**Given** the user is on AI Studio with a detected job and available credits
**When** they select the Cover Letter tab
**Then** `SelectionChips` display for tone: Confident, Friendly, Enthusiastic, Professional (FR27)
**And** `SelectionChips` display for length: Brief, Standard, Detailed (FR26a)
**And** a custom instructions textarea is available (FR28)
**And** a "Generate" button is enabled showing credit cost (FR38b)

**Given** the user configures options and clicks Generate
**When** the SSE stream begins
**Then** text appears progressively with a cursor/caret blink at the insertion point
**And** a "Stop generating" cancel button is visible throughout streaming
**And** clicking cancel stops the stream and shows partial content (no credit deducted)
**And** on completion, the full text displays in an editable `GeneratedOutput` component

**Given** the generated cover letter is displayed
**When** the user interacts with the output
**Then** they can edit the text inline in the textarea (FR38)
**And** they can click "Copy" → content copied to clipboard → "Copied!" toast feedback (FR40, FR41)
**And** they can click "Regenerate" → optional feedback input → new generation incorporating feedback (FR29)
**And** they can click "Export PDF" → `POST /v1/ai/cover-letter/pdf` → PDF file downloads (FR30)

**Given** the user has 0 AI credits
**When** they view the Cover Letter tab
**Then** the Generate button shows credit lock pattern (blurred preview + unlock)
**And** "No credits remaining" message with "Upgrade coming soon" prompt (FR65)

**Given** the SSE stream fails
**When** an error event is received
**Then** the error displays inline with "Retry" button
**And** the previous output (if any) is preserved
**And** credits are NOT deducted (NFR24)

**Given** Storybook stories for `GeneratedOutput` and Cover Letter view
**When** reviewed
**Then** stories cover: empty state, generating (streaming), complete, editing, error, credit-locked, dark/light, 360x600

---

## Story 4.4: Outreach Message UI — Generation & Copy

As a job seeker wanting to network,
I want to generate outreach messages for recruiters and hiring managers with customizable tone and length,
So that I can reach out professionally and efficiently.

**Acceptance Criteria:**

**Given** the user selects the Outreach tab in AI Studio
**When** the tab renders
**Then** `SelectionChips` display for tone: Confident, Friendly, Professional (FR36a)
**And** `SelectionChips` display for length: Brief, Standard (FR36b)
**And** a custom instructions textarea is available (FR36c)
**And** a "Generate" button is enabled showing credit cost

**Given** the user configures options and clicks Generate
**When** the SSE stream begins
**Then** text appears progressively (same streaming UX as cover letter)
**And** "Stop generating" cancel button is available
**And** on completion, text displays in the shared `GeneratedOutput` component

**Given** the generated outreach message is displayed
**When** the user interacts with the output
**Then** they can edit the text inline (FR38)
**And** they can click "Copy" → clipboard + visual feedback (FR40, FR41)
**And** they can click "Regenerate" → optional feedback → new generation (FR37)
**And** no PDF export is offered for outreach (not in FRs)

**Given** AI-generated content
**When** the content is reviewed
**Then** all content is grounded in the user's actual resume data (FR40a)
**And** no fabricated experience, skills, or qualifications appear
**And** content is ephemeral — not stored on the server (FR39)

**Given** the user has 0 credits or generation fails
**When** the respective state occurs
**Then** the same credit lock and error patterns from Story 4.3 apply
**And** credits are NOT deducted on failure

**Given** Storybook stories for Outreach view
**When** reviewed
**Then** stories cover: empty, generating, complete, editing, error, credit-locked, dark/light, 360x600

---
