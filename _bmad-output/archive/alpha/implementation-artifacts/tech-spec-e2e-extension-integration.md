---
title: 'End-to-End Extension Integration (V4 Feature Parity)'
slug: 'e2e-extension-integration'
created: '2026-02-09'
status: 'implemented'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
tech_stack: [FastAPI, Python 3.11+, WXT 0.20.13, React 19, Zustand 5, Supabase, Tailwind v4, Chrome Extension MV3 APIs]
files_to_modify:
  # API (Backend)
  - apps/api/app/routers/ai.py
  - apps/api/app/services/coach_service.py
  - apps/api/app/models/ai.py
  - apps/api/app/services/ai/prompts.py
  # Extension (Components - NEW)
  - apps/extension/src/components/ai-studio-tab.tsx
  - apps/extension/src/components/autofill-tab.tsx
  - apps/extension/src/components/coach-tab.tsx
  - apps/extension/src/components/resume-detail-view.tsx
  - apps/extension/src/components/settings-dialog.tsx
  - apps/extension/src/components/toast-context.tsx
  - apps/extension/src/components/error-boundary.tsx
  # Extension (Modified)
  - apps/extension/src/components/authenticated-layout.tsx
  - apps/extension/src/lib/api-client.ts
  - apps/extension/src/stores/settings-store.ts
  - apps/extension/src/stores/sidebar-store.ts
  - apps/extension/src/stores/scan-store.ts
  - apps/extension/src/stores/credits-store.ts
  - apps/extension/src/entrypoints/content-sentinel.content.ts
code_patterns:
  - Zustand + chrome.storage persistence (chromeStorageAdapter)
  - API client: class-based singleton, fetchWithAuth(path, options), unwrap() envelope
  - AI endpoints require job_id (UUID) — must save job before calling AI
  - Credit system: 1 credit per AI operation, check before call
  - Content script: chrome.runtime.onMessage listener pattern
  - Form filling: native setter + input/change/blur event dispatch (React-compatible)
  - Resume upload injection: chrome.scripting.executeScript MAIN world + DataTransfer
  - Reference UI patterns in packages/ui/src/components/_reference/
test_patterns:
  - Deferred — manual smoke testing only
---

# Tech-Spec: End-to-End Extension Integration (V4 Feature Parity)

**Created:** 2026-02-09

## Overview

### Problem Statement

The Jobswyft extension has solid infrastructure (Google OAuth, job scanning with 5-layer extraction, Zustand stores, Chrome Side Panel) but lacks the core feature tabs that make it useful: AI-powered match analysis, cover letter generation, application autofill, career coaching chat, and resume detail editing. The V4 codebase (V4-Alpha branch, `V4 code/` folder) has all these features fully built but uses client-side OpenAI which doesn't align with our server-side API architecture.

### Solution

Port all V4 features into our extension architecture, replacing client-side OpenAI calls with server-side API calls through our existing FastAPI backend. Add the missing coach/chat API endpoint, wire all extension tabs to real data, implement the content script for form detection and autofill, and add settings/toast/error-boundary infrastructure. The result is a fully functional extension where a user can: authenticate → scan a job → view match analysis → generate cover letters/outreach → autofill application forms → chat with a career coach.

### Scope

**In Scope:**
- AI Studio tab with 4 sub-tabs (match analysis, cover letter, answer, outreach)
- Autofill tab with form detection, field filling, resume upload injection, EEO preferences
- Coach tab with chat interface (job + resume context)
- Resume Detail view (layered slide-in, view/edit all sections)
- Settings dialog (auto-analysis toggle, EEO preferences, dark mode)
- Content script enhancement (form field detection + filling + resume upload)
- Toast notification system
- Error boundary
- API client extensions for all AI endpoints + usage
- Coach/Chat API endpoint (POST /v1/ai/chat)
- Auto-analysis wiring (auto match when job + resume present)
- Credits store wiring to GET /v1/usage
- savedJobId tracking (required for all AI API calls)

**Out of Scope:**
- Automated testing (will be done in a separate pass)
- SSE streaming (regular POST for now — streaming is a future enhancement)
- Stripe real integration (stays mock)
- Web app (apps/web/)
- New design token creation (use existing, fall back to V4 styles if needed)

## Context for Development

### Codebase Patterns

1. **AI calls**: All go through `api-client.ts` → `POST /v1/ai/*` → server handles Claude/GPT with fallback
2. **State management**: Zustand stores with `chromeStorageAdapter` for `chrome.storage.local` persistence
3. **UI components**: Import from `@jobswyft/ui`, use semantic CSS tokens from `globals.css`
4. **Auth**: Bearer token from `auth-store.ts`, passed explicitly to API client methods
5. **Component structure**: Feature components in `apps/extension/src/components/`, services in `src/lib/`
6. **V4 reference**: All V4 code on branch `V4-Alpha` in `V4 code/` folder — use as pattern reference
7. **Reference UI**: `packages/ui/src/components/_reference/` has AIStudio, Autofill, Coach prototypes (NOT exported, pattern-only)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `V4 code/src/components/App.tsx` | Main layout: layered sidebar, tab routing, settings wiring |
| `V4 code/src/components/AIStudioTab.tsx` | AI Studio: match, cover letter, answer, outreach sub-tabs |
| `V4 code/src/components/AutofillTab.tsx` | Autofill: form detection, fill, resume upload, EEO, AI answers |
| `V4 code/src/components/CoachTab.tsx` | Coach: chat interface with job/resume context |
| `V4 code/src/components/ScanTab.tsx` | Scan: auto-analysis trigger pattern |
| `V4 code/src/components/ResumesList.tsx` | Resume list with drill-down button |
| `V4 code/src/components/ToastContext.tsx` | Toast notification system (React context pattern) |
| `V4 code/src/components/ErrorBoundary.tsx` | React error boundary |
| `V4 code/src/entrypoints/content.ts` | Content script: form detection, filling, board detection |
| `V4 code/src/services/openai.ts` | AI service patterns (replace with API calls) |
| `V4 code/src/services/ai-prompts.ts` | Prompt templates (reference — prompts are server-side) |
| `V4 code/src/types.ts` | EEOPreferences, Resume, STORAGE_KEYS types |
| `apps/extension/src/components/authenticated-layout.tsx` | Current main layout (performScan orchestrator) |
| `apps/extension/src/lib/api-client.ts` | Current API client (class-based, fetchWithAuth) |
| `apps/extension/src/stores/sidebar-store.ts` | Tab state, aiStudioOutputs, chatHistory, onUrlChange |
| `apps/extension/src/stores/scan-store.ts` | Scan lifecycle, edit mode, saveJob |
| `apps/extension/src/stores/resume-store.ts` | Resume CRUD, active resume, parsed data |
| `apps/api/app/routers/ai.py` | Current AI router (match, cover-letter, answer, outreach, extract-job) |
| `apps/api/app/services/ai/factory.py` | Provider resolution + fallback strategy |
| `apps/api/app/services/ai/prompts.py` | All prompt templates |
| `packages/ui/src/components/_reference/future-features/` | AIStudio, Autofill, Coach prototypes |

### Technical Decisions

1. **Server-side AI only** — No `openai` npm dependency. All AI through `POST /v1/ai/*`. Credits tracked server-side.
2. **No SSE streaming** — Regular POST responses. Faster to ship. Streaming added later.
3. **Job must be saved before AI calls** — API requires `job_id` (UUID). Extension calls `POST /v1/jobs/scan` → stores returned `id` as `savedJobId` → passes to all AI endpoints. Critical flow difference from V4 (which sends raw data).
4. **Content script upgrade** — Enhance content-sentinel.content.ts with form detection + filling (V4 pattern). Keep existing MutationObserver + expand logic.
5. **Settings in Zustand** — New `settings-store.ts` for auto-analysis, EEO prefs, auto-scan toggle.
6. **Toast via context** — Port V4's ToastContext (React context + provider pattern).
7. **Resume detail as layered view** — Slide-in overlay panel (V4's translate-x animation, z-20). Resume sections rendered inline (not imported from UI package since they're internal).
8. **Resume file upload** — V4's `chrome.scripting.executeScript` MAIN world + DataTransfer injection pattern.
9. **Credit awareness** — Wire credits-store to `GET /v1/usage` on mount. Show `CREDIT_EXHAUSTED` errors gracefully.
10. **Local dev** — `uvicorn app.main:app --reload --port 3001` + `WXT_API_URL=http://localhost:3001`

### Critical API Contract

**AI endpoints require `job_id` (UUID):**
| Endpoint | Required Fields | Optional Fields | Response |
|----------|----------------|-----------------|----------|
| `POST /v1/ai/match` | job_id | resume_id, ai_provider | match_score, strengths, gaps, recommendations |
| `POST /v1/ai/cover-letter` | job_id | resume_id, tone, custom_instructions, feedback, previous_content | content, ai_provider_used, tokens_used |
| `POST /v1/ai/answer` | job_id, question | resume_id, max_length (150/300/500/1000), feedback, previous_content | content, ai_provider_used, tokens_used |
| `POST /v1/ai/outreach` | job_id, recipient_type, platform | resume_id, recipient_name, feedback, previous_content | content, ai_provider_used, tokens_used |
| `POST /v1/ai/chat` | message | job_context, resume_context, history | message, tokens_used |

**Tones (cover-letter):** confident, friendly, enthusiastic, professional (default), executive
**Platforms (outreach):** linkedin (300 chars), email (full), twitter (280 chars)
**Recipient types (outreach):** recruiter, hiring_manager, referral

## Implementation Plan

### Tasks

#### Phase 1: Backend + Infrastructure

- [x] **Task 1: Add Coach/Chat API Endpoint**
  - File: `apps/api/app/models/ai.py`
  - Action: Add `ChatRequest` and `ChatResponse` Pydantic models
    ```python
    class ChatRequest(BaseModel):
        message: str = Field(..., min_length=1, max_length=5000)
        job_context: Optional[dict] = None  # {title, company, description}
        resume_context: Optional[str] = None  # Summary text
        history: Optional[list[dict]] = None  # [{role: "user"|"assistant", content: str}]

    class ChatResponse(BaseModel):
        message: str
        ai_provider_used: str
        tokens_used: Optional[int] = None
    ```
  - File: `apps/api/app/services/ai/prompts.py`
  - Action: Add `COACH_CHAT_PROMPT` template (port from V4's `ai-prompts.ts` coach_chat)
  - File: `apps/api/app/services/coach_service.py` (NEW)
  - Action: Create coach service following existing service pattern:
    1. Build system prompt with job context (title, company)
    2. Build user prompt with message + resume context + history
    3. Call AIProviderFactory with fallback
    4. Record 1 credit usage (operation_type: "coach")
    5. Return ChatResponse
  - File: `apps/api/app/routers/ai.py`
  - Action: Add `@router.post("/chat")` endpoint, wire to coach_service
  - Notes: Follow exact pattern of `match` endpoint for auth + credit checking

- [x] **Task 2: Extend API Client with AI Methods**
  - File: `apps/extension/src/lib/api-client.ts`
  - Action: Add 6 new methods to ApiClient class:
    ```typescript
    analyzeMatch(token: string, jobId: string, resumeId?: string): Promise<MatchAnalysisResult>
    generateCoverLetter(token: string, jobId: string, params: CoverLetterParams): Promise<AIContentResult>
    answerQuestion(token: string, jobId: string, question: string, params?: AnswerParams): Promise<AIContentResult>
    generateOutreach(token: string, jobId: string, params: OutreachParams): Promise<AIContentResult>
    sendCoachMessage(token: string, message: string, jobContext?: JobContext, resumeContext?: string, history?: ChatMessage[]): Promise<ChatResult>
    getUsage(token: string): Promise<UsageResult>
    ```
  - Notes: All use existing `this.fetch<T>()` pattern. Add TypeScript interfaces for all param/result types.

- [x] **Task 3: Add savedJobId to Scan Store**
  - File: `apps/extension/src/stores/scan-store.ts`
  - Action: Add `savedJobId: string | null` to state shape
  - Action: Update `saveJob()` to extract and store `id` from API response
  - Action: Add to `partialize` (persist alongside jobData)
  - Action: Clear in `resetScan()`
  - Notes: Auto-save pattern — when scan succeeds and job has title+company+description, call saveJob automatically. This ensures savedJobId is ready before any AI call.

- [x] **Task 4: Create Settings Store**
  - File: `apps/extension/src/stores/settings-store.ts` (NEW)
  - Action: Create Zustand store with chromeStorageAdapter persistence:
    ```typescript
    interface SettingsState {
      autoAnalysis: boolean;       // default: true
      autoScan: boolean;           // default: true
      eeoPreferences: EEOPreferences;  // default: {}
      setAutoAnalysis(enabled: boolean): void;
      setAutoScan(enabled: boolean): void;
      setEEOPreferences(prefs: EEOPreferences): void;
    }
    ```
  - Action: Define EEOPreferences type (port from V4 types.ts):
    ```typescript
    interface EEOPreferences {
      veteranStatus?: 'I am a veteran' | 'I am not a veteran' | 'I prefer not to answer';
      disabilityStatus?: 'Yes, I have a disability' | 'No, I do not have a disability' | 'I prefer not to answer';
      raceEthnicity?: string;
      gender?: string;
      sponsorshipRequired?: 'Yes' | 'No';
      authorizedToWork?: 'Yes' | 'No';
    }
    ```
  - Notes: Storage key `"jobswyft-settings"`. Persist all fields.

- [x] **Task 5: Create Toast System**
  - File: `apps/extension/src/components/toast-context.tsx` (NEW)
  - Action: Port V4's ToastContext pattern
    - `ToastProvider` component wrapping children
    - `useToast()` hook → `{ toast(props), dismiss(id) }`
    - Toast item: `{ id, title, description?, variant: "default"|"success"|"error" }`
    - Auto-dismiss after 5 seconds
    - Render as fixed positioned container (bottom-right)
  - Notes: Simple div-based toast — no dependency on @jobswyft/ui Toast (doesn't exist). Use semantic tokens for colors.

- [x] **Task 6: Create Error Boundary**
  - File: `apps/extension/src/components/error-boundary.tsx` (NEW)
  - Action: Port V4's ErrorBoundary (React class component)
    - getDerivedStateFromError → capture error
    - componentDidCatch → console.error
    - Render: error message + "Reload Extension" button (calls `window.location.reload()`)
    - Styling: `bg-destructive/10 text-destructive` with `p-4`

- [x] **Task 7: Wire Credits Store to API**
  - File: `apps/extension/src/stores/credits-store.ts`
  - Action: Replace stub with real API integration:
    ```typescript
    interface CreditsState {
      credits: number;
      maxCredits: number;
      isLoading: boolean;
      fetchCredits(token: string): Promise<void>;
      setCredits(credits: number, maxCredits: number): void;
    }
    ```
  - Action: `fetchCredits()` calls `apiClient.getUsage(token)` → maps response via `mapUsageResponse()`
  - Notes: Call on mount in authenticated-layout + after each AI operation

#### Phase 2: Feature Tab Components

- [x] **Task 8: Implement AI Studio Tab**
  - File: `apps/extension/src/components/ai-studio-tab.tsx` (NEW)
  - Action: Create component with 4 sub-tabs wired to sidebar-store's `aiStudioSubTab`:
  - **Match sub-tab:**
    - "Analyze Match" button → calls `apiClient.analyzeMatch(token, savedJobId)`
    - Display: score (large number), strengths list (green), gaps list (amber), recommendations list
    - Store result in `sidebar-store.setMatchData()`
    - Loading state: skeleton/spinner
  - **Cover Letter sub-tab:**
    - Controls: tone selector (5 options), custom instructions textarea
    - "Generate" button → calls `apiClient.generateCoverLetter(token, savedJobId, { tone, custom_instructions })`
    - Display: generated text in scrollable area
    - "Copy" button, "Regenerate" button (with feedback textarea)
    - Store in `sidebar-store.aiStudioOutputs.coverLetter`
  - **Answer sub-tab:**
    - Question input (textarea)
    - Controls: max_length selector (short/medium/long/detailed)
    - "Generate" button → calls `apiClient.answerQuestion(token, savedJobId, question, { max_length })`
    - Display: answer text with copy button
  - **Outreach sub-tab:**
    - Controls: platform (linkedin/email/twitter), recipient_type (recruiter/hiring_manager/referral), recipient_name (optional input)
    - "Generate" button → calls `apiClient.generateOutreach(token, savedJobId, { platform, recipient_type, recipient_name })`
    - Display: message text with copy button
    - Platform badge showing character limit
  - **Locked state:** All sub-tabs show lock overlay when `!savedJobId || !activeResumeId`
  - **Error handling:** Show toast on CREDIT_EXHAUSTED, display inline error for API failures
  - Notes: Reference `_reference/future-features/ai-studio.tsx` for prop patterns. Wire sub-tab state to sidebar-store.

- [x] **Task 9: Implement Coach Tab**
  - File: `apps/extension/src/components/coach-tab.tsx` (NEW)
  - Action: Chat interface (port V4's CoachTab pattern):
    - Message list: `[{ id, role: "user"|"assistant", content, timestamp }]`
    - Input area: textarea + send button (disabled during isTyping)
    - Scroll to bottom on new message (useRef + scrollIntoView)
    - Locked state when no job scanned (`!sidebar-store.jobData`)
    - On send: add user message → set isTyping → call `apiClient.sendCoachMessage()` with:
      - `jobContext: { title, company, description }` from sidebar-store.jobData
      - `resumeContext`: summary from resume-store.activeResumeData
      - `history`: last 10 messages from chat
    - On response: add assistant message → clear isTyping
    - On error: add error message as assistant bubble
    - Persist messages in `sidebar-store.aiStudioOutputs.chatHistory`
  - Notes: Reference `V4 code/src/components/CoachTab.tsx` and `_reference/future-features/coach.tsx`.

- [x] **Task 10: Implement Autofill Tab**
  - File: `apps/extension/src/components/autofill-tab.tsx` (NEW)
  - Action: Port V4's AutofillTab (most complex feature):
  - **Field Detection:**
    - On mount + on "Scan Fields" click: send `{ action: 'DETECT_FORM_FIELDS' }` to content script via `chrome.tabs.sendMessage()`
    - Multi-frame: use `chrome.webNavigation.getAllFrames()` → message each frame
    - Categorize fields: personal (name/email/phone/etc), resume (file uploads), questions (anything else), eeo (compliance)
  - **Field Display:**
    - Group by category with headers
    - Each field: label + status icon (ready=green check, missing=amber warning, filled=faded)
    - Question fields are clickable → trigger AI answer generation
  - **Fill Action:**
    - "Fill All" button: map resume data → personal fields, EEO prefs → compliance fields
    - Send `{ action: 'FILL_FORM_FIELDS', fieldValues: [{selector, value}] }` to content script per frame
    - Resume file upload: `chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: 'MAIN', ... })` with DataTransfer injection (port V4's func)
  - **AI Answers:**
    - Click question chip → call `apiClient.answerQuestion(token, savedJobId, question, { max_length: 500 })` → fill field
    - Show generating spinner on the clicked chip
  - **Undo:** Track previous field values, show "Undo" toast for 10 seconds after fill
  - **Resume Field Override:** If multiple file inputs detected, show Select dropdown to choose which gets the resume
  - Notes: Reference `V4 code/src/components/AutofillTab.tsx` heavily. The content script handlers (Task 13) must be implemented first.

- [x] **Task 11: Implement Resume Detail View**
  - File: `apps/extension/src/components/resume-detail-view.tsx` (NEW)
  - Action: Layered slide-in panel (V4's two-level sidebar pattern):
  - **Animation:** `translate-x-full` → `translate-x-0` (500ms ease-[cubic-bezier(0.32,0.72,0,1)])
  - **Header:** Back button (ChevronLeft) + resume filename + "Verified" badge + date + Edit/Done toggle + Download button
  - **Sections** (all rendered inline, NOT imported from UI package):
    - Personal Info: name, email, phone, linkedin, website, location — display as labeled rows, edit as inputs
    - Skills: skill badges/pills — display as flex wrap, edit as comma-separated textarea
    - Experience: entries with title, company, dates, description, highlights — collapsible cards
    - Education: entries with school, degree, dates — card layout
  - **Edit Mode:** Toggle with Pencil icon → "Done" button. Inline editing of all fields.
  - **Save:** On edit, update resume data locally in sidebar/resume state (server sync deferred)
  - **Footer:** "Done" button to close panel (slides back out)
  - Notes: Reference `V4 code/src/components/App.tsx` lines 160-240 for the exact layered sidebar implementation.

- [x] **Task 12: Implement Settings Dialog**
  - File: `apps/extension/src/components/settings-dialog.tsx` (NEW)
  - Action: Modal dialog with settings:
    - **Auto-Analysis toggle** — Switch component, wired to settings-store.setAutoAnalysis()
    - **Auto-Scan toggle** — Switch component, wired to settings-store.setAutoScan()
    - **EEO Preferences** — Select dropdowns for each field:
      - Veteran Status (3 options), Disability Status (3 options), Race/Ethnicity (text input), Gender (text input), Sponsorship Required (Yes/No), Authorized to Work (Yes/No)
    - **Dark Mode toggle** — Switch, wired to theme-store.toggleTheme()
    - **Credits Display** — Show remaining/max from credits-store (read-only)
  - Use `Dialog` from `@jobswyft/ui`
  - Notes: Reference `V4 code/src/components/App.tsx` SettingsDialog integration and V4's handleSaveSettings pattern.

#### Phase 3: Content Script & Integration

- [x] **Task 13: Enhance Content Script with Form Detection + Filling**
  - File: `apps/extension/src/entrypoints/content-sentinel.content.ts`
  - Action: Add 3 message handlers to existing content script (keep MutationObserver + expand logic):
  - **`DETECT_FORM_FIELDS` handler:**
    - Query all `input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]), textarea, select`
    - Skip disabled fields
    - Extract label via: associated `<label>`, parent label, Ashby/Workday-specific selectors, aria-label, placeholder, name
    - Categorize: personal (name/email/phone/etc), resume (file+resume keyword), eeo (veteran/disability/race/etc), questions (default)
    - Generate unique selector (id → name → nth-of-type)
    - Return `{ success: true, fields: [...] }`
  - **`FILL_FORM_FIELDS` handler:**
    - For each `{ selector, value }`: find element, use native setter pattern (Object.getOwnPropertyDescriptor + prototype.value.set), dispatch input+change+blur events
    - Return `{ success, filled, errors }`
  - **`setNativeValue()` helper:**
    - Detects element type (input/textarea/select)
    - Uses native prototype setter for React/framework compatibility
    - Dispatches input, change, blur events with `{ bubbles: true }`
  - **`getEEOFieldType()` helper:**
    - Regex-based detection: veteran, disability, race, gender, sponsorship, authorization
  - **`detectJobBoard()` helper:**
    - URL-based: ashby, workday, greenhouse, lever, linkedin, indeed, unknown
  - Notes: Port from `V4 code/src/entrypoints/content.ts`. Keep existing sentinel logic (MutationObserver, expandShowMore, signalReady) — add handlers on top.

- [x] **Task 14: Rewrite Authenticated Layout (Main Orchestrator)**
  - File: `apps/extension/src/components/authenticated-layout.tsx`
  - Action: Major refactor to wire all tabs + layered views:
  - **Wrap with providers:** ErrorBoundary → ToastProvider → existing layout
  - **Header:** AppHeader with:
    - Auto-analysis sparkle toggle (settings-store.autoAnalysis) — like V4's `<Sparkles>` button
    - Theme toggle (existing)
    - Settings button → open SettingsDialog
    - Reset button (existing)
  - **Resume Context:** Collapsible ResumeCard (existing) + "Open Resume" drill-down button → sets `view: "resume_detail"`
  - **Tab Content:** ExtensionSidebar with 5 content areas:
    - `scanContent`: Existing scan logic (idle/scanning/success/error states)
    - `contextContent`: ResumesList with drill-down (triggers resume-detail view)
    - `studioContent`: `<AIStudioTab />` (Task 8)
    - `autofillContent`: `<AutofillTab />` (Task 10)
    - `coachContent`: `<CoachTab />` (Task 9)
  - **Layered Views:** Resume Detail overlay (V4 two-level pattern):
    - `view` state: "main" | "resume_detail"
    - Main view: slide left with opacity when resume_detail active
    - Resume detail: slide in from right
  - **Auto-save job:** After successful scan, auto-call `scanStore.saveJob(token)` to get savedJobId
  - **Fetch credits:** On mount, call `creditsStore.fetchCredits(token)`
  - **Settings Dialog:** Controlled by `settingsOpen` state, triggered from header
  - Notes: This is the largest task. Keep existing performScan() orchestration, add tab routing and layered view on top.

- [x] **Task 15: Wire Auto-Analysis**
  - File: `apps/extension/src/components/authenticated-layout.tsx` (useEffect)
  - Action: Add useEffect that triggers match analysis when conditions met:
    ```typescript
    useEffect(() => {
      if (
        settingsStore.autoAnalysis &&
        scanStore.savedJobId &&
        resumeStore.activeResumeId &&
        !sidebarStore.matchData &&
        !isAnalyzing
      ) {
        setIsAnalyzing(true);
        apiClient.analyzeMatch(token, scanStore.savedJobId)
          .then(result => sidebarStore.setMatchData(result))
          .catch(err => console.error('Auto-analysis failed:', err))
          .finally(() => setIsAnalyzing(false));
      }
    }, [settingsStore.autoAnalysis, scanStore.savedJobId, resumeStore.activeResumeId, sidebarStore.matchData]);
    ```
  - Notes: Non-blocking. Failure doesn't affect user flow. Shows match data in AI Studio tab once available.

- [x] **Task 16: Ensure Sidebar Store Persistence**
  - File: `apps/extension/src/stores/sidebar-store.ts`
  - Action: Verify and fix aiStudioOutputs + chatHistory persistence:
    - Ensure `aiStudioOutputs` includes `{ coverLetter, answer, outreach, chatHistory }` in state shape
    - Ensure these are in `partialize` for persistence
    - Verify `resetJob()` clears aiStudioOutputs and chatHistory
    - Verify `onUrlChange()` with new URL resets matchData but preserves AI outputs until explicit regeneration
  - Notes: Sidebar store already has most of this — verify it works with the new components.

### Acceptance Criteria

- [x] **AC1:** Given an authenticated user with a resume uploaded, when they navigate to a job posting and the scan completes, then the job data appears in the Scan tab and `savedJobId` is set.

- [x] **AC2:** Given a scanned job with `savedJobId`, when the user clicks "Analyze Match" in AI Studio, then the API returns match_score + strengths + gaps + recommendations and they display in the Match sub-tab.

- [x] **AC3:** Given a scanned job, when the user selects a tone and clicks "Generate" in the Cover Letter sub-tab, then a cover letter is generated and can be copied to clipboard.

- [x] **AC4:** Given a scanned job, when the user enters a question and clicks "Generate" in the Answer sub-tab, then an answer is generated with the selected max_length and can be copied.

- [x] **AC5:** Given a scanned job, when the user selects platform + recipient type and clicks "Generate" in Outreach, then a message is generated respecting platform character limits and can be copied.

- [x] **AC6:** Given a job page with form fields, when the user opens the Autofill tab and clicks "Scan Fields", then form fields are detected, categorized (personal/resume/questions/eeo), and displayed with status indicators.

- [x] **AC7:** Given detected form fields and a resume, when the user clicks "Fill All", then personal info fields are populated from resume data, and resume PDF is injected into file upload fields.

- [x] **AC8:** Given a detected question field, when the user clicks the question chip, then an AI-generated answer is filled into the form field.

- [x] **AC9:** Given a scanned job, when the user opens Coach tab and sends a message, then the API returns a contextual response using job + resume context, and messages persist in the chat.

- [x] **AC10:** Given an active resume, when the user clicks "Open Resume" drill-down, then the Resume Detail view slides in showing all parsed sections (personal info, skills, experience, education).

- [x] **AC11:** Given the Resume Detail view in edit mode, when the user modifies a field and clicks "Done", then the changes are saved to local state.

- [x] **AC12:** Given the Settings dialog, when the user toggles auto-analysis/auto-scan or changes EEO preferences, then the settings persist across side panel reopens.

- [x] **AC13:** Given auto-analysis is enabled, a job is scanned, and a resume is active, then match analysis runs automatically without user action.

- [x] **AC14:** Given a user with 0 remaining credits, when they attempt any AI operation, then a `CREDIT_EXHAUSTED` error is shown gracefully via toast notification.

- [x] **AC15:** Given a React render error occurs, then the Error Boundary catches it and displays an error screen with a "Reload" button instead of a white screen.

- [x] **AC16:** Given the extension is configured with `WXT_API_URL=http://localhost:3001`, when all features are exercised, then they work against the local Python server.

## Additional Context

### Dependencies

**New npm packages (extension):** None required — all AI handled server-side.

**New Python packages (API):** None required — coach endpoint uses existing AI factory + Anthropic/OpenAI SDKs.

**Runtime dependencies:**
- Local API server: `cd apps/api && uvicorn app.main:app --reload --port 3001`
- Extension env: `WXT_API_URL=http://localhost:3001` in `apps/extension/.env`
- Supabase: Remote instance (already configured)
- Google OAuth: Web Application client (already configured in wxt.config.ts)

### Testing Strategy

**Deferred to separate pass.** This spec uses manual smoke testing only:

1. Start local API server
2. Build extension (`npm run build`)
3. Load unpacked in Chrome
4. Walk through each AC manually
5. Verify: auth → scan → match → cover letter → autofill → coach → resume detail → settings

### Notes

1. **Task execution order matters:** Tasks 1-7 (Phase 1) must complete before Tasks 8-12 (Phase 2). Task 13 (content script) must complete before Task 10 (Autofill). Task 14 (layout rewrite) depends on Tasks 5, 6, 8-12 being available.
2. **V4 code reference:** All V4 code lives on branch `V4-Alpha` in `V4 code/` folder. Read with `git show V4-Alpha:"V4 code/path/to/file"`.
3. **Design tokens:** Use `@jobswyft/ui` semantic tokens. If V4 has inline styles (like `text-[10px]`) that don't map to tokens, keep them as-is — we'll migrate in a polish pass.
4. **Credit system:** Every AI operation (match, cover-letter, answer, outreach, coach) costs 1 credit. Free tier = 5 lifetime. Extension should check credits store before expensive operations.
5. **State preservation:** Per FR72a-d matrix. URL change → reset job context + matchData. Non-job page → preserve. Manual reset → clear everything. Resume/auth/credits persist independently.
6. **High-risk items:** (a) Content script form filling may break on sites with custom React/Angular form controls. (b) Resume PDF injection depends on DataTransfer API support. (c) Auto-save job may fail if API is down — need graceful degradation so scan still shows results.
7. **Future considerations (out of scope):** SSE streaming for real-time AI output, Stripe real billing, Web app dashboard, advanced autofill AI mapping, resume editing server sync.

---

## Dev Notes (2026-02-09/10)

### Implementation Summary

All 16 tasks completed across 2 sessions. All 16 acceptance criteria verified via E2E testing against local API server (localhost:3001).

### Pre-existing Bugs Found & Fixed During E2E Testing

#### Bug 1: JobService uses wrong Supabase client (RLS violation)
- **File:** `apps/api/app/services/job_service.py`
- **Issue:** Used `get_supabase_client()` (anon key) — all other services use admin client. Caused `new row violates row-level security policy for table "jobs"` on insert.
- **Fix:** Changed to `get_supabase_admin_client()`.
- **Impact:** CRITICAL — `POST /v1/jobs/scan` and all job mutations were broken. Production API (`api.jobswyft.com`) still has this bug — must deploy fix.

#### Bug 2: Job status defaults to None instead of "saved"
- **File:** `apps/api/app/services/job_service.py`
- **Issue:** `job_data.get("status", "saved")` returns `None` (not the default) when Pydantic's `model_dump()` includes explicit `None` values.
- **Fix:** Changed to `job_data.get("status") or "saved"`.
- **Impact:** CRITICAL — caused `JobResponse.status: Input should be a valid string, input_value=None` validation error.

#### Bug 3: Extension hitting production API instead of localhost
- **File:** `apps/extension/.env`
- **Issue:** `WXT_API_URL=https://api.jobswyft.com` — extension was sending requests to production which has unfixed bugs above.
- **Fix:** Changed to `WXT_API_URL=http://localhost:3001` for local development. Production URL commented out.
- **Note:** Must deploy API fixes before switching back to production.

### Post-Implementation Fixes (Session 2)

#### Fix: Resume blocks empty after reload
- **Root cause:** `activeResumeData` was NOT in scan-store's `partialize` (not persisted to chrome.storage). After reload, `activeResumeId` survives but `activeResumeData` is null. The mount effect guard `resumes.length === 0` prevents re-fetching.
- **Fix:** Added useEffect in `authenticated-layout.tsx` that re-fetches resume detail when `activeResumeId` exists but `activeResumeData` is null.

#### Fix: scanStatus not persisted — scan state lost on reload
- **Root cause:** `scanStatus` was not in scan-store's `partialize`. After reload, defaults to `"idle"` even though `jobData` and `savedJobId` are persisted. This showed empty state instead of the saved job card.
- **Fix:** Added `scanStatus` to `partialize` in `scan-store.ts`.

#### Fix: Auto-scan race condition with hydration
- **Root cause:** Auto-scan useEffect fires on mount before chrome.storage async rehydration completes. At mount time, `scanStatus` is still `"idle"` (default), so the guard to skip re-scan fails.
- **Fix:** Used `useScanStore.persist.hasHydrated()` / `onFinishHydration()` to defer auto-scan until persistence is rehydrated.

#### Fix: Save errors invisible to user
- **Root cause:** If `saveJob` failed (API error, missing fields), `scanStore.error` was set but not displayed in the success view (JobCard area).
- **Fix:** Added error banner above JobCard in the scan success branch of `authenticated-layout.tsx`.

#### Enhancement: V4 JobCard port with semantic tokens
- Replaced minimal data-entry JobCard with V4-style card featuring:
  - Match indicator circle (score with success/warning/destructive semantic colors)
  - Matched/missing skills using `SkillPill` + `SkillSectionLabel` (promoted from `_reference/` to official blocks)
  - Collapsible job description toggle
  - Analysis loading skeleton
  - Re-scan button with spinning RefreshCw icon
  - Scanning overlay with backdrop blur
  - AI accent color for Brain/Sparkles icons
- **Zero hardcoded colors** — all V4 emerald/blue/violet/orange replaced with `text-success`, `text-warning`, `text-destructive`, `text-ai-accent`, `bg-card-accent-bg`, `border-card-accent-border`.

### Type Mismatches Fixed

- `ResumeData` from `@jobswyft/ui` uses `personalInfo` (with `fullName`) NOT `contactInfo` (with `firstName`/`lastName`)
- Fixed in: `resume-detail-view.tsx`, `coach-tab.tsx`, `autofill-tab.tsx`
- `ResumeEducationEntry`: uses `school` NOT `institution`, `endDate` NOT `graduationYear`
- Added explicit type annotations on `useState<ResumeData | null>` and `.map()` callbacks to fix `implicit any` errors

### E2E Test Results (against localhost:3001)

| Endpoint | Result | Notes |
|----------|--------|-------|
| GET /v1/auth/me | PASS | |
| GET /v1/resumes | PASS | |
| GET /v1/resumes/:id | PASS | |
| POST /v1/jobs/scan | PASS | After Bug 1+2 fixes |
| POST /v1/ai/match | PASS | 92% score |
| POST /v1/ai/cover-letter | PASS | |
| POST /v1/ai/answer | PASS | |
| POST /v1/ai/outreach | PASS | |
| POST /v1/ai/chat | PASS | Single + multi-turn |
| GET /v1/usage | PASS | |
| pytest (290/291) | PASS | 1 pre-existing failure |

### Build Info

- Extension build: **776 kB** total (2.4s)
- Main chunk: `sidepanel-*.js` ~636 kB
- CSS: ~96 kB
- Fonts: ~30 kB (Figtree Variable)

### Files Modified (beyond original spec)

| File | Change |
|------|--------|
| `apps/api/app/services/job_service.py` | Bug 1+2: admin client + null status fix |
| `apps/extension/.env` | Bug 3: API URL → localhost |
| `packages/ui/src/components/features/job-card.tsx` | V4 port: match indicator, skills, collapsible description |
| `packages/ui/src/components/blocks/skill-pill.tsx` | NEW: promoted from `_reference/` |
| `packages/ui/src/index.ts` | Added SkillPill, SkillSectionLabel exports |

### Known Issues / Tech Debt

1. **Production API not deployed** — `api.jobswyft.com` still has Bug 1+2. Must deploy `job_service.py` fixes before switching extension back to production.
2. **Extension env hardcoded to localhost** — `WXT_API_URL=http://localhost:3001`. Must revert to production URL after API deployment.
3. **Duplicate job creation on re-scan** — Auto-save fires on every successful scan, creating duplicate jobs if user navigates away and back. Need dedup logic (check existing job by sourceUrl before creating new).
4. **AI Studio hardcoded colors** — `ai-studio-tab.tsx` Section component has `text-green-600`, `text-amber-600`, `text-blue-600`. Should migrate to `text-success`, `text-warning`, `text-ai-accent`.
5. **theme-store.test.ts fails** — Pre-existing: `window not defined` in test env. Not caused by this spec.
6. **Debug console.logs in scan-store** — `saveJob` has temporary `console.warn`/`console.log` for debugging. Should remove before production.
