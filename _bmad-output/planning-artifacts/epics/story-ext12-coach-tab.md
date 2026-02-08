# Story EXT.12: Coach Tab

**As a** job seeker who wants personalized career guidance,
**I want** to have a conversational AI coaching session tailored to my resume and the current job,
**So that** I can get strategic advice on application approach, interview preparation, and addressing skill gaps.

**FRs addressed:** FR37a (Coach as standalone sidebar tab), FR37b (coaching personalized to resume + job), FR37c (advise on strategy, interview prep, skill gaps), FR37d (1 credit per message), FR37e (conversation resets on job switch), FR37f (contextual coaching prompts from match analysis)

**Note:** Coach is a **standalone sidebar tab** (4th main tab), separate from AI Studio Chat (EXT.8). Coach provides deeper career coaching context; Chat provides quick Q&A about the job posting.

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `Coach` | `features/` | Existing chat UI component — refactor to use shared `ChatPanel` from EXT.8 with coach-specific styling |
| Reuse | `ChatPanel` | `features/` | Shared chat component built in EXT.8 — reuse with `variant="coach"` for coach-accent colors |
| New | `CoachPrompts` | `blocks/` | Contextual coaching prompt chips generated from match analysis results (FR37f) |
| New | Zustand `coach-store` | Extension `stores/` | Coach messages (separate from AI Studio chat-store), session per job |
| Modified | `ExtensionSidebar` | `layout/` | Wire Coach tab content — 4th main tab with `coach-accent` active indicator |

## Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** they select the Coach tab in the sidebar
**Then** the Coach component renders with coach-accent color identity (`--coach-accent`)
**And** contextual coaching prompts are displayed based on match analysis results (FR37f)
**And** example prompts: "How do I address the [missing skill] gap?", "What should I emphasize from my [matched skill] experience?", "Help me prepare for a [job title] interview"

**Given** coaching prompts are displayed
**When** the user clicks a prompt chip
**Then** the prompt text is populated into the message input
**And** the user can edit before sending

**Given** the user sends a coaching message
**When** the message is submitted
**Then** credit check passes (1 credit available, FR37d) → `POST /v1/ai/chat` called with `context_type=coach`
**And** user message appears as coach-styled bubble (`bg-coach-accent text-coach-accent-foreground rounded-tr-sm`)
**And** AI coaching response streams in progressively via SSE (NFR6a)
**And** "Stop generating" cancel button available during streaming
**And** AI response appears as assistant bubble (`bg-muted`)
**And** coaching responses are personalized to the user's active resume AND current scanned job (FR37b)
**And** if credit check fails → "No credits" message shown, message not sent

**Given** the user has match analysis data available
**When** the Coach tab renders
**Then** coaching prompts reference specific match results (FR37f)
**And** e.g., if match shows "Kubernetes" as a gap → prompt: "How do I address the Kubernetes gap in my application?"
**And** if match shows "Team Leadership" as a strength → prompt: "How should I highlight my leadership experience?"

**Given** a coaching conversation is in progress
**When** the user navigates to a different job page
**Then** the coaching conversation resets completely (FR37e — new job = new coaching context)
**And** new contextual prompts generate based on the new job's match analysis
**And** previous coaching messages are not recoverable (ephemeral)

**Given** the Coach tab is rendering
**When** no job has been detected yet
**Then** the Coach tab shows locked state with message "Scan a job to start coaching"
**And** a link to the Scan tab is provided

**Given** the user switches tabs (Coach → Scan → Coach)
**When** they return to the Coach tab
**Then** the conversation is preserved within the session (FR72d)
**And** coaching prompts remain available below the conversation

**Given** a coaching response fails
**When** the API returns an error (or SSE `event: error`)
**Then** an error message shows inline ("Coaching unavailable. Try again.")
**And** the user's credit is NOT deducted (NFR24)

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/chat` | POST | Send coaching message, get streaming AI response | Built in EXT.8 — add `context_type=coach` parameter |

**Endpoint extension for Coach:**
```
POST /v1/ai/chat
Body: {
  job_id, resume_id, message, conversation_history: [{role, content}],
  context_type: "coach"  // distinguishes from AI Studio chat
}
Response: text/event-stream (SSE) — same protocol as AI Studio chat
Credits: 1 per message
```

The `context_type=coach` parameter triggers a different AI prompt template that emphasizes career coaching, interview preparation, and strategic advice (vs. the factual Q&A focus of AI Studio Chat).

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **COACH-01** | AI prompt template for coaching context (different from chat — more strategic, advisory tone) | High |
| **COACH-02** | Match-analysis-based prompt generation (FR37f) — needs match data → prompt mapping logic | Medium |
| **COACH-03** | Shared `ChatPanel` base component — Coach and AI Studio Chat should share the chat UI but with different styling/prompts | Medium |

---
