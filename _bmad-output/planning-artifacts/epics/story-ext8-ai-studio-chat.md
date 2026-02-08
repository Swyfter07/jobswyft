# Story EXT.8: AI Studio — Chat

**As a** job seeker with questions about a posting,
**I want** to chat with AI about the job within AI Studio,
**So that** I can get quick answers about the role, requirements, and application strategy.

**FRs addressed:** FR31 (open chat from AI Studio), FR32 (question suggestions), FR33 (ask questions — 1 credit/message), FR34 (conversation history), FR35 (new session)

**Note:** This is the **Chat sub-tab within AI Studio** (FR67b). The standalone **Coach tab** is covered in EXT.12.

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| New | `ChatPanel` | `features/` | Chat UI with message bubbles, input form, streaming response display. Reusable by both AI Studio Chat and Coach (EXT.12) |
| New | `QuestionSuggestions` | `blocks/` | Clickable suggestion chips generated from job data |
| New | Zustand `chat-store` | Extension `stores/` | Messages, session management, credit tracking (separate sessions for Chat vs Coach) |
| Modified | `AiStudio` | `features/` | Add Chat as 3rd sub-tab (Match | Cover Letter | Chat | Outreach) |
| New | Backend `POST /v1/ai/chat` | API `routers/ai.py` | **NEW endpoint — does not exist yet** |

## Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** they open AI Studio and select the Chat sub-tab
**Then** the ChatPanel component renders with an empty message area
**And** question suggestions are displayed based on the current job posting (e.g., "What skills should I highlight?", "Is this role a good fit for my experience?", "What questions should I prepare for the interview?")

**Given** question suggestions are displayed
**When** the user clicks a suggestion chip
**Then** the suggestion text is populated into the message input
**And** the user can edit before sending

**Given** the user types or selects a question and clicks send
**When** the message is submitted
**Then** credit check passes (1 credit available) → `POST /v1/ai/chat` called
**And** user message appears as a bubble in the chat area (`bg-muted`)
**And** AI response streams in progressively via SSE (NFR6a) with cursor/caret blink
**And** "Stop generating" cancel button available during streaming
**And** completed AI response appears as assistant bubble
**And** if credit check fails → "No credits" message shown, message not sent

**Given** a conversation is in progress
**When** the user sends multiple messages
**Then** conversation history is maintained in the chat-store
**And** previous messages provide context to the AI (conversation_history sent with each request)

**Given** the user clicks "New Session"
**When** the action triggers
**Then** conversation history is cleared from the chat-store
**And** the chat area resets to empty with fresh question suggestions

**Given** the user navigates to a different job page
**When** auto-scan detects the new job
**Then** chat history is cleared (FR72a — new job = new conversation context)
**And** new question suggestions generate based on the new job

**Given** an AI response fails
**When** the API returns an error (or SSE `event: error`)
**Then** an error message shows inline ("Failed to get response. Try again.")
**And** the user's credit is NOT deducted (NFR24)

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/chat` | POST | Send message, get streaming AI response | **NEW — must be built** |

**New endpoint spec:**
```
POST /v1/ai/chat
Body: { job_id, resume_id, message, conversation_history: [{role, content}] }
Response: text/event-stream (SSE)
  event: chunk → {"text": "..."}
  event: done → {"credits_remaining": N, "suggestions": [...]}
  event: error → {"code": "...", "message": "..."}
Credits: 1 per message
```

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **CHAT-01** | Build `POST /v1/ai/chat` endpoint with SSE streaming + conversation context | High |
| **CHAT-02** | AI prompt template for job-context chat | High |
| **CHAT-03** | Question suggestion generation (can be client-side templates initially, AI-powered later) | Medium |

---
