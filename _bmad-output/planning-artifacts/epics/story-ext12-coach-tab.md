# Story EXT.12: Coach — AI Studio Sub-Tab

**As a** job seeker who wants personalized career guidance and quick answers about a posting,
**I want** to chat with an AI coach that knows my resume and the current job,
**So that** I can get strategic advice on application approach, interview preparation, skill gaps, and job-specific questions.

**FRs addressed:** FR37a (Coach as AI Studio sub-tab), FR37b (coaching personalized to resume + job), FR37c (advise on strategy, interview prep, skill gaps), FR37d (1 credit per message), FR37e (conversation resets on job switch), FR37f (skill categories as entry points), FR37f-i (contextual skill suggestions from match analysis), FR37f-ii (free-form chat without skill selection), FR37g (conversation history), FR37h (new conversation to clear history)

**Note:** This story consolidates the previously separate Chat (EXT.8/FR31-35) and Coach (EXT.12/FR37a-f) stories. Coach IS the conversational AI chat interface, accessible as the 4th AI Studio sub-tab (Match | Cover Letter | Outreach | Coach). Users start by selecting a skill category or typing a free-form question.

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| New | `ChatPanel` | `features/` | Chat UI with message bubbles, input form, streaming response display. Includes skill category chips and free-form input. |
| New | `SkillCategories` | `blocks/` | Selectable skill category chips (e.g., "Interview Prep", "Application Strategy", "Company Insights", "General Advice"). Shown as conversation entry points. |
| New | `ContextualSkillSuggestions` | `blocks/` | Dynamic skill suggestions generated from match analysis results (FR37f-i). E.g., if Kubernetes gap detected → "Address Kubernetes Gap" chip. |
| New | Zustand `coach-store` | Extension `stores/` | Messages, session management, credit tracking, selected skill category |
| Modified | `AiStudio` | `features/` | Add Coach as 4th sub-tab (Match | Cover Letter | Outreach | Coach) |
| New | Backend `POST /v1/ai/chat` | API `routers/ai.py` | **NEW endpoint — does not exist yet** |

## Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** they open AI Studio and select the Coach sub-tab
**Then** the ChatPanel component renders with coach-accent color identity (`--coach-accent`)
**And** skill category chips are displayed: "Interview Prep", "Application Strategy", "Company Insights", "General Advice"
**And** contextual skill suggestions are displayed based on match analysis results (FR37f-i)
**And** a free-form text input is available for direct questions (FR37f-ii)

**Given** skill categories and contextual suggestions are displayed
**When** the user clicks a skill category chip
**Then** a focused chat session initiates with that skill context
**And** the AI's first response is tailored to the selected skill and the user's resume + job context

**Given** contextual skill suggestions are displayed (from match analysis)
**When** the user clicks a suggestion (e.g., "Address Kubernetes Gap")
**Then** the suggestion text is populated into the message input
**And** the user can edit before sending

**Given** the user types a free-form question without selecting a skill category
**When** the message is submitted
**Then** the system processes it as a general coaching query with full resume + job context

**Given** the user sends a coaching message
**When** the message is submitted
**Then** credit check passes (1 credit available, FR37d) → `POST /v1/ai/chat` called with `context_type=coach`
**And** user message appears as coach-styled bubble (`bg-coach-accent text-coach-accent-foreground rounded-tr-sm`)
**And** AI coaching response streams in progressively via SSE (NFR6a) with cursor/caret blink
**And** "Stop generating" cancel button available during streaming
**And** AI response appears as assistant bubble (`bg-muted`)
**And** coaching responses are personalized to the user's active resume AND current scanned job (FR37b)
**And** if credit check fails → "No credits" message shown, message not sent

**Given** the user has match analysis data available
**When** the Coach sub-tab renders
**Then** contextual skill suggestions reference specific match results (FR37f-i)
**And** e.g., if match shows "Kubernetes" as a gap → suggestion: "How do I address the Kubernetes gap in my application?"
**And** if match shows "Team Leadership" as a strength → suggestion: "How should I highlight my leadership experience?"

**Given** a coaching conversation is in progress
**When** the user sends multiple messages
**Then** conversation history is maintained in the coach-store (FR37g)
**And** previous messages provide context to the AI (conversation_history sent with each request)

**Given** the user clicks "New Conversation" (FR37h)
**When** the action triggers
**Then** conversation history is cleared from the coach-store
**And** the chat area resets to empty with skill categories and contextual suggestions refreshed

**Given** the user navigates to a different job page
**When** auto-scan detects the new job
**Then** coaching conversation resets completely (FR37e — new job = new coaching context)
**And** new contextual skill suggestions generate based on the new job's match analysis
**And** previous coaching messages are not recoverable (ephemeral)

**Given** the Coach sub-tab is rendering
**When** no job has been detected yet
**Then** the Coach sub-tab shows locked state with message "Scan a job to start coaching"
**And** a link to the Scan tab is provided

**Given** the user switches AI Studio sub-tabs (Coach → Match → Coach)
**When** they return to the Coach sub-tab
**Then** the conversation is preserved within the session (FR72d)
**And** skill categories and contextual suggestions remain available below the conversation

**Given** a coaching response fails
**When** the API returns an error (or SSE `event: error`)
**Then** an error message shows inline ("Coaching unavailable. Try again.")
**And** the user's credit is NOT deducted (NFR24)

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/chat` | POST | Send coaching/chat message, get streaming AI response | **NEW — must be built** |

**New endpoint spec:**
```
POST /v1/ai/chat
Body: {
  job_id, resume_id, message, conversation_history: [{role, content}],
  context_type: "coach",
  skill_category?: "interview_prep" | "application_strategy" | "company_insights" | "general"
}
Response: text/event-stream (SSE)
  event: chunk → {"text": "..."}
  event: done → {"credits_remaining": N, "suggestions": [...]}
  event: error → {"code": "...", "message": "..."}
Credits: 1 per message
```

The `context_type=coach` parameter triggers the coaching AI prompt template. The optional `skill_category` provides additional context for focused coaching responses.

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **CHAT-01** | Build `POST /v1/ai/chat` endpoint with SSE streaming + conversation context (serves Coach) | High |
| **COACH-01** | AI prompt template for coaching context (strategic, advisory tone with skill-based focus) | High |
| **COACH-02** | Match-analysis-based skill suggestion generation (FR37f-i) — needs match data → suggestion mapping logic | Medium |
| **COACH-03** | Skill category UI — predefined categories + dynamic contextual suggestions | Medium |

---
