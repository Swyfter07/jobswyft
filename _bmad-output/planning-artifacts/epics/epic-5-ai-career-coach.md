# Epic 5: AI Career Coach

Users get two distinct AI conversation experiences: (1) Career Coach as a dedicated main-level tab with structured coaching, skill-based entry points, and strategic advice; (2) Chat as an AI Studio sub-tab for quick job-context Q&A. Both share a backend chat endpoint with different prompt templates.

## Story 5.1: Chat Endpoint & Prompt Templates

As a backend developer,
I want a new chat endpoint with SSE streaming and prompt templates for both Coach and Chat context types,
So that both conversation features have dedicated APIs with appropriate tone and behavior.

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
**And** `context_type` selects the prompt template:
  - `context_type=coach` — strategic, advisory coaching tone with skill category context, structured recommendations
  - `context_type=chat` — conversational, direct Q&A tone focused on answering specific questions about the current job

**Given** the coaching prompt template (COACH-01)
**When** a coach message is generated (`context_type=coach`)
**Then** the system prompt includes: user's resume parsed data, current job description, match analysis results (if available), and skill category context
**And** the tone is strategic and advisory (not generic chatbot)
**And** responses are grounded in actual resume data — no fabricated skills or experience (FR40a, FR40c)
**And** the prompt encourages honest, actionable advice about gaps (FR40b)

**Given** the chat prompt template (CHAT-02)
**When** a chat message is generated (`context_type=chat`)
**Then** the system prompt includes: user's resume parsed data and current job description
**And** the tone is helpful and direct (general AI assistant, not structured coaching)
**And** responses are grounded in actual resume + job data (FR40a)
**And** no skill category context is injected (unlike coach)

**Given** match analysis data is available (COACH-02)
**When** the coaching prompt is constructed (`context_type=coach`)
**Then** match strengths and gaps are included in the system context
**And** the AI can reference specific skill matches/gaps in its coaching advice (FR37f-i)

**Given** conversation history is provided
**When** the chat request includes previous messages
**Then** the full conversation history is sent to the AI for context continuity
**And** the system prompt is prepended (not repeated in history)

**Given** the chat endpoint costs 1 credit per message (FR37d, FR37k)
**When** the message is processed
**Then** 1 credit is deducted on successful completion
**And** if credits = 0 → reject with `CREDIT_EXHAUSTED`
**And** if client disconnects mid-stream → no credit deducted

**Given** question suggestion generation (CHAT-03)
**When** a response completes (either context_type)
**Then** the `done` SSE event includes an optional `suggestions` array of 2-3 follow-up questions
**And** suggestions are contextual to the conversation and job

**Given** unit and integration tests
**When** run
**Then** tests cover: basic chat flow (both context types), conversation history, coach prompt construction, chat prompt construction, credit deduction, credit exhaustion, client disconnect, suggestion generation

---

## Story 5.2: Coach UI — Main Tab, Skills & Streaming

As a job seeker who wants career guidance,
I want a dedicated Coach tab with skill-based entry points and streaming AI responses,
So that I can get personalized, structured coaching about the current job.

**Acceptance Criteria:**

**Given** the user selects the Coach main tab (FR37a)
**When** the tab renders with a detected job and available credits
**Then** the `CoachPanel` component renders with coach-accent color identity as a full main-tab view (not nested within AI Studio)
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
**And** the message is sent to `POST /v1/ai/chat` with `context_type=coach`
**And** user message appears as a right-aligned bubble with coach-accent styling
**And** AI response streams progressively via SSE with cursor blink
**And** "Stop generating" cancel button is available during streaming
**And** AI response appears as left-aligned bubble with muted background and copy button
**And** on completion, follow-up suggestions appear below the response

**Given** the user has 0 credits
**When** they attempt to send a message
**Then** the input is disabled with "No credits remaining" message
**And** upgrade prompt is shown

**Given** the CoachPanel component (COACH-03)
**When** built
**Then** it shares a `ChatPanelBase` component with the Chat sub-tab that can be styled with different accent colors
**And** coach-specific styling: `--coach-accent` color, rounded bubble corners, skill category chips header
**And** Storybook stories cover: empty (with skills), conversation in progress, streaming, error, credit-locked, dark/light, 360x600

---

## Story 5.3: Chat UI — AI Studio Sub-Tab & Streaming

As a job seeker reviewing a posting,
I want a quick AI chat within AI Studio to ask questions about the current job,
So that I can get instant answers without leaving the analysis context.

**Acceptance Criteria:**

**Given** the user opens AI Studio and selects the Chat sub-tab (FR37i)
**When** the tab renders with a detected job and available credits
**Then** the `ChatPanel` component renders with studio-accent color identity (shares AI Studio's violet theme)
**And** a text input with placeholder "Ask about this job..." is displayed
**And** no skill category chips are shown (simpler than Coach)
**And** optional follow-up suggestions may appear based on job context

**Given** the user sends a message
**When** the message is submitted
**Then** credit check passes (1 credit, FR37k)
**And** the message is sent to `POST /v1/ai/chat` with `context_type=chat`
**And** user message appears as a right-aligned bubble with studio-accent styling
**And** AI response streams progressively via SSE with cursor blink
**And** "Stop generating" cancel button is available during streaming
**And** AI response appears as left-aligned bubble with muted background and copy button
**And** on completion, follow-up suggestions appear below the response

**Given** the user has 0 credits
**When** they attempt to send a message
**Then** the input is disabled with "No credits remaining" message
**And** upgrade prompt is shown

**Given** the ChatPanel component
**When** built
**Then** it shares a `ChatPanelBase` component with the Coach tab (COACH-03)
**And** chat-specific styling: `--studio-accent` color (violet), no skill chips header
**And** Storybook stories cover: empty, conversation in progress, streaming, error, credit-locked, dark/light, 360x600

---

## Story 5.4: Coach & Chat Session Management & Context Reset

As a user switching between jobs,
I want both my coaching and chat conversations to reset when I navigate to a different job while preserving my sessions on the current job,
So that conversation context is always relevant to the job I'm looking at.

**Acceptance Criteria:**

**Given** a coaching conversation is in progress in the Coach tab
**When** the user sends multiple messages
**Then** conversation history is maintained in the Zustand `coach-store` (FR37g)
**And** previous messages scroll in the `CoachPanel` with proper scroll behavior
**And** conversation context persists when switching to other main tabs and back (FR72d)

**Given** a chat conversation is in progress in the AI Studio Chat sub-tab
**When** the user sends multiple messages
**Then** conversation history is maintained in the Zustand `chat-store` (FR37m)
**And** previous messages scroll in the `ChatPanel` with proper scroll behavior
**And** conversation context persists when switching to other AI Studio sub-tabs and back (FR72d)

**Given** the user clicks "New Conversation" in Coach (FR37h)
**When** the action triggers
**Then** coach conversation history is cleared from the coach-store
**And** the Coach tab resets to empty with skill categories and contextual suggestions refreshed
**And** a brief confirmation appears ("Conversation cleared")

**Given** the user clicks "New Conversation" in Chat (FR37n)
**When** the action triggers
**Then** chat conversation history is cleared from the chat-store
**And** the Chat sub-tab resets to empty state
**And** a brief confirmation appears ("Conversation cleared")

**Given** the user navigates to a different job page (FR37e, FR37l)
**When** the URL change is detected
**Then** coach conversation history is cleared automatically
**And** chat conversation history is cleared automatically
**And** skill categories and contextual suggestions refresh based on the new job's match analysis
**And** the user sees clean Coach tab and Chat sub-tab for the new job context

**Given** the user navigates to a non-job page
**When** the sidebar updates
**Then** the last job context is preserved (FR72b)
**And** both coach and chat conversation histories remain available
**And** navigating back to the same job page retains both conversations

**Given** the store persistence
**When** the sidebar is closed and reopened
**Then** both coach-store and chat-store conversations are preserved via `chrome.storage.session`
**And** both conversations are cleared on logout (FR81)

---

## Story 5.5: IC-3 — Full AI Studio + Coach + Chat E2E Validation

As a quality assurance stakeholder,
I want all 4 AI Studio sub-tabs and the Coach main tab verified end-to-end with streaming, credit management, and model selection,
So that the complete AI feature set works reliably across all surfaces.

**Acceptance Criteria:**

**Given** a fresh extension build with Epics 3-5 features
**When** tested on a real LinkedIn job posting
**Then** all 4 AI Studio sub-tabs are accessible: Match | Cover Letter | Outreach | Chat
**And** the Coach main tab is accessible
**And** each tab/sub-tab renders correctly with proper accent colors and styling

**Given** the Match tab (AI Studio)
**When** tested E2E
**Then** auto-match fires on scan, score displays, "Deep Analysis" works, credit deducted

**Given** the Cover Letter tab (AI Studio)
**When** tested E2E
**Then** tone/length selection works, generation streams via SSE, edit/copy/regenerate/PDF export all function, credit deducted

**Given** the Outreach tab (AI Studio)
**When** tested E2E
**Then** same streaming/edit/copy/regenerate flow as cover letter, credit deducted

**Given** the Chat sub-tab (AI Studio)
**When** tested E2E
**Then** text input works, messages stream via SSE with `context_type=chat`, conversation history displays, "New Conversation" clears, 1 credit per message

**Given** the Coach tab (main level)
**When** tested E2E
**Then** skill categories render, contextual suggestions appear from match data, chat messages stream with `context_type=coach`, conversation history works, "New Conversation" clears, 1 credit per message

**Given** cross-cutting credit management
**When** credits are tracked across all 5 tools
**Then** each operation correctly deducts credits (auto-match: 0, detailed: 1, cover letter: 1, outreach: 1, chat message: 1, coach message: 1)
**And** `GET /v1/usage` reflects accurate totals after operations
**And** credit exhaustion blocks all paid features simultaneously
**And** SSE cancel does NOT deduct credits for any tool

**Given** job switch behavior
**When** the user navigates to a new job page
**Then** match data resets, chat history clears, coach history clears, cover letter/outreach output clears
**And** resume selection and credits are preserved

**Given** all tests pass
**When** results are documented
**Then** IC-3 report confirms: all 5 tools tested (4 AI Studio + Coach), streaming verified, credits accurate, job switch tested, error handling confirmed

---
