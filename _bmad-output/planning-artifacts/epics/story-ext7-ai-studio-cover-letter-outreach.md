# Story EXT.7: AI Studio — Cover Letter & Outreach

**As a** job seeker ready to apply,
**I want** to generate a tailored cover letter and outreach messages,
**So that** my applications stand out and I can network with hiring managers.

**FRs addressed:** FR26 (generate cover letter), FR26a (length selector), FR27 (tone selector), FR28 (custom instructions), FR29 (regenerate with feedback), FR30 (PDF export), FR36 (generate outreach), FR36a (outreach tone), FR36b (outreach length), FR36c (outreach custom instructions), FR37 (regenerate outreach), FR38 (edit output), FR39 (ephemeral), FR40 (copy to clipboard), FR41 (copy visual feedback)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `AiStudio` | `features/` | Tabbed card (currently: Match, Cover Letter, Answer, Outreach). Has `onGenerate` callback with params |
| Existing | `SelectionChips` | `blocks/` | Tone/length selectors. Props: `options`, `value`, `onChange` |
| New | `GeneratedOutput` | `blocks/` | Editable textarea with copy button, regenerate button, PDF button |
| Modified | `AiStudio` | `features/` | Replace "Answer" tab with placeholder for Chat (EXT.8). Wire Cover Letter + Outreach tabs |

## Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** the sidebar shows AI Studio
**Then** the `isLocked` state is `false` (unlocked)
**And** sub-tabs show: Match, Cover Letter, Chat, Outreach (FR67b)

**Given** the user selects the Cover Letter tab
**When** the tab renders
**Then** SelectionChips display for tone: Confident, Friendly, Enthusiastic, Professional
**And** SelectionChips display for length: Brief, Standard, Detailed
**And** a custom instructions textarea is available
**And** a "Generate" button is enabled (if credits available)

**Given** the user configures tone/length/instructions and clicks Generate
**When** the generation begins
**Then** `POST /v1/ai/cover-letter` is called with `{ job_id, resume_id, tone, length, custom_instructions }`
**And** SSE streaming begins — text appears progressively with cursor/caret blink at insertion point (NFR6a)
**And** a "Stop generating" cancel button is available throughout streaming
**And** on completion, the full text is displayed in an editable GeneratedOutput component
**And** on failure, error message shows and credit is NOT deducted

**Given** the generated cover letter is displayed
**When** the user interacts with the output
**Then** they can edit the text inline (textarea)
**And** they can click "Copy" → content copied to clipboard → "Copied!" feedback shows
**And** they can click "Regenerate" → optional feedback input → new generation with context
**And** they can click "Export PDF" → `POST /v1/ai/cover-letter/pdf` → PDF file downloads

**Given** the user selects the Outreach tab
**When** the tab renders
**Then** the same pattern applies: tone selector, length selector (Brief, Standard), custom instructions
**And** Generate → `POST /v1/ai/outreach` with `{ job_id, resume_id, tone, length, custom_instructions }`
**And** SSE streaming with progressive text reveal + cancel option (same as cover letter)
**And** output displayed in GeneratedOutput with edit/copy/regenerate flow

**Given** the user has 0 AI credits
**When** they try to generate
**Then** the Generate button is disabled with "No credits" message
**And** "Upgrade coming soon" prompt is shown

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/cover-letter` | POST | Generate cover letter | Exists |
| `/v1/ai/cover-letter/pdf` | POST | Export as PDF | Exists |
| `/v1/ai/outreach` | POST | Generate outreach message | Exists |

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **AI-01** | Remove `/v1/ai/answer` endpoint (PRD removed Answer Generation tool) | Medium |
| **AI-02** | AiStudio component: remove "Answer" tab, restructure to Match / Cover Letter / Outreach | High (done in this story) |

---
