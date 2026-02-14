# Epic 5: AI Career Coach

Users get personalized career coaching — conversational AI grounded in resume and job context, with skill-based entry points and session management.

## Story 5.1: Chat Endpoint & Coach Prompt Templates

As a backend developer,
I want a new chat endpoint with SSE streaming and coach-specific prompt templates,
So that the Coach feature has a dedicated API with strategic, advisory-tone responses grounded in resume and job data.

**Acceptance Criteria:**

**Given** `POST /v1/ai/chat` does not exist (CHAT-01)
**When** this story is complete
**Then** the endpoint exists and accepts:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "message": "How should I address the Kubernetes gap?",
  "conversation_history": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}],
  "context_type": "coach",
  "skill_category": "Interview Prep"
}
```
**And** the response is SSE-streamed using the `sse_response()` helper from Epic 4
**And** `context_type=coach` selects the coaching prompt template

**Given** the coaching prompt template (COACH-01)
**When** a coach message is generated
**Then** the system prompt includes: user's resume parsed data, current job description, match analysis results (if available), and skill category context
**And** the tone is strategic and advisory (not generic chatbot)
**And** responses are grounded in actual resume data — no fabricated skills or experience (FR40a, FR40c)
**And** the prompt encourages honest, actionable advice about gaps (FR40b)

**Given** match analysis data is available (COACH-02)
**When** the coaching prompt is constructed
**Then** match strengths and gaps are included in the system context
**And** the AI can reference specific skill matches/gaps in its coaching advice (FR37f-i)

**Given** conversation history is provided
**When** the chat request includes previous messages
**Then** the full conversation history is sent to the AI for context continuity
**And** the system prompt is prepended (not repeated in history)

**Given** the chat endpoint costs 1 credit per message (FR37d)
**When** the message is processed
**Then** 1 credit is deducted on successful completion
**And** if credits = 0 → reject with `CREDIT_EXHAUSTED`
**And** if client disconnects mid-stream → no credit deducted

**Given** question suggestion generation (CHAT-03)
**When** a coach response completes
**Then** the `done` SSE event includes an optional `suggestions` array of 2-3 follow-up questions
**And** suggestions are contextual to the conversation and job

**Given** unit and integration tests
**When** run
**Then** tests cover: basic chat flow, conversation history, coach prompt construction, credit deduction, credit exhaustion, client disconnect, suggestion generation

---

## Story 5.2: Coach UI — Chat Interface, Skills & Streaming

As a job seeker who wants career guidance,
I want a chat interface with skill-based entry points and streaming AI responses in the Coach tab,
So that I can get personalized coaching about the current job.

**Acceptance Criteria:**

**Given** the user opens AI Studio and selects the Coach sub-tab (FR37a)
**When** the tab renders with a detected job and available credits
**Then** the `ChatPanel` component renders with coach-accent color identity
**And** skill category chips display: "Interview Prep", "Application Strategy", "Company Insights", "General Advice" (FR37f)
**And** contextual skill suggestions appear based on match analysis results (FR37f-i)
**And** a free-form text input is available (FR37f-ii)

**Given** match analysis shows specific gaps (e.g., Kubernetes)
**When** contextual suggestions render
**Then** suggestions reference the specific gaps: e.g., "How do I address the Kubernetes gap in my application?"
**And** clicking a suggestion populates it into the input field for editing before sending

**Given** the user clicks a skill category chip (FR37f)
**When** the chip is selected
**Then** a focused chat session initiates with that skill context
**And** the AI's first response is tailored to the selected skill + resume + job context

**Given** the user sends a message (text or skill selection)
**When** the message is submitted
**Then** credit check passes (1 credit, FR37d)
**And** user message appears as a right-aligned bubble with coach-accent styling
**And** AI response streams progressively via SSE with cursor blink
**And** "Stop generating" cancel button is available during streaming
**And** AI response appears as left-aligned bubble with muted background and copy button
**And** on completion, follow-up suggestions appear below the response

**Given** the user has 0 credits
**When** they attempt to send a message
**Then** the input is disabled with "No credits remaining" message
**And** upgrade prompt is shown

**Given** the ChatPanel component (COACH-03)
**When** built
**Then** it uses a shared base that can be styled with different accent colors
**And** coach-specific styling: `--coach-accent` color, rounded bubble corners
**And** Storybook stories cover: empty (with skills), conversation in progress, streaming, error, credit-locked, dark/light, 360x600

---

## Story 5.3: Coach Session Management & Context Reset

As a user switching between jobs,
I want my coaching conversation to reset when I navigate to a different job while preserving my session on the current job,
So that coaching context is always relevant to the job I'm looking at.

**Acceptance Criteria:**

**Given** a coaching conversation is in progress
**When** the user sends multiple messages
**Then** conversation history is maintained in the Zustand `coach-store` (FR37g)
**And** previous messages scroll in the `ChatPanel` with proper scroll behavior
**And** conversation context persists when switching to other AI Studio tabs and back (FR72d)

**Given** the user clicks "New Conversation" (FR37h)
**When** the action triggers
**Then** conversation history is cleared from the coach-store
**And** the chat area resets to empty with skill categories and contextual suggestions refreshed
**And** a brief confirmation appears ("Conversation cleared")

**Given** the user navigates to a different job page (FR37e)
**When** the URL change is detected
**Then** coach conversation history is cleared automatically
**And** skill categories and contextual suggestions refresh based on the new job's match analysis
**And** the user sees a clean Coach tab for the new job context

**Given** the user navigates to a non-job page
**When** the sidebar updates
**Then** the last job context is preserved (FR72b)
**And** coach conversation history remains available
**And** navigating back to the same job page retains the conversation

**Given** the coach-store persistence
**When** the sidebar is closed and reopened
**Then** the current conversation is preserved via `chrome.storage.session`
**And** conversation is cleared on logout (FR81)

---

## Story 5.4: IC-3 — Full AI Studio + Coach E2E Validation

As a quality assurance stakeholder,
I want all 4 AI Studio sub-tabs verified end-to-end with streaming, credit management, and model selection,
So that the complete AI feature set works reliably across all surfaces.

**Acceptance Criteria:**

**Given** a fresh extension build with Epics 3-5 features
**When** tested on a real LinkedIn job posting
**Then** all 4 AI Studio sub-tabs are accessible: Match | Cover Letter | Outreach | Coach
**And** each tab renders correctly with proper accent colors and styling

**Given** the Match tab
**When** tested E2E
**Then** auto-match fires on scan, score displays, "Deep Analysis" works, credit deducted

**Given** the Cover Letter tab
**When** tested E2E
**Then** tone/length selection works, generation streams via SSE, edit/copy/regenerate/PDF export all function, credit deducted

**Given** the Outreach tab
**When** tested E2E
**Then** same streaming/edit/copy/regenerate flow as cover letter, credit deducted

**Given** the Coach tab
**When** tested E2E
**Then** skill categories render, contextual suggestions appear from match data, chat messages stream, conversation history works, "New Conversation" clears, 1 credit per message

**Given** cross-cutting credit management
**When** credits are tracked across all 4 tools
**Then** each operation correctly deducts credits (auto-match: 0, detailed: 1, cover letter: 1, outreach: 1, coach message: 1)
**And** `GET /v1/usage` reflects accurate totals after operations
**And** credit exhaustion blocks all paid features simultaneously
**And** SSE cancel does NOT deduct credits for any tool

**Given** job switch behavior
**When** the user navigates to a new job page
**Then** match data resets, coach history clears, cover letter/outreach output clears
**And** resume selection and credits are preserved

**Given** all tests pass
**When** results are documented
**Then** IC-3 report confirms: all 4 tools tested, streaming verified, credits accurate, job switch tested, error handling confirmed

---
