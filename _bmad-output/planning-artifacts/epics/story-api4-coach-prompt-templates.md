# Story API.4: Coach Prompt Templates

**As a** user receiving AI coaching,
**I want** the coaching AI to respond with strategic career advice (not just facts),
**So that** I get differentiated value compared to the standard Chat feature.

**Source:** COACH-01, COACH-02 — unblocks EXT.12

## Acceptance Criteria

**Given** `POST /v1/ai/chat` supports `context_type=coach` (from API.2)
**When** this story is complete
**Then** the coach prompt template is tuned for:
- Strategic application advice ("Here's how to position yourself...")
- Interview preparation ("For this role, expect questions about...")
- Skill gap mitigation ("To address the [skill] gap, consider...")
- Encouraging, advisory tone (not dry/factual like chat)

**Given** match analysis data is available for the job
**When** `context_type=coach` is used
**Then** the prompt includes match strengths and gaps as coaching context
**And** the AI references specific matched/missing skills in its advice

**Given** the user has no match analysis data yet
**When** `context_type=coach` is used
**Then** the coach still functions with job description + resume only
**And** coaching quality is reduced but not broken

**Given** coaching prompt templates need iteration
**When** templates are stored
**Then** prompt templates are in a configurable location (`app/prompts/` or `global_config` table)
**And** they can be updated without code deployment (configurable via DB preferred)

## Dependencies

- API.2 (chat endpoint with `context_type` param) must be complete

---
