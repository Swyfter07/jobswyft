# Sprint Change Proposal — 2026-02-14

**Trigger:** Re-introduce Chat as AI Studio sub-tab, restore Coach as main-level tab
**Scope Classification:** Minor — Direct implementation by dev team
**Status:** Approved
**Date:** 2026-02-14

---

## Section 1: Issue Summary

### Problem Statement

During Story 1.2 (Shell, Layout & Navigation Fixes), the extension sidebar was consolidated from 4 main tabs to 3 main tabs per the UX spec decision in commit `90a608d` ("consolidate Coach as AI Studio sub-tab, absorb Chat"). This merged Coach and Chat into a single AI Studio sub-tab.

The project owner has determined that Coach and Chat should be **separate features** with distinct UX:

- **Coach** (main-level tab) — Structured career coaching with skill-based entry points, interview prep, strategic advice
- **Chat** (AI Studio sub-tab) — General-purpose AI Q&A about the current scanned job

### Discovery Context

- Story 1.2 completed 2026-02-14, consolidating 4 tabs → 3 tabs
- Alpha retro identified CHAT-01/02/03 as high-priority tech debt for Chat endpoint
- PRD already had Chat as a planned feature (absorbed into Coach during UX spec design)
- This change reverses the Coach/Chat consolidation decision

### Evidence

- Alpha retro tech debt: CHAT-01 (build `/v1/ai/chat`), CHAT-02 (prompt template), CHAT-03 (suggestions)
- Commit `90a608d`: "absorb Chat" decision being reversed
- User confirmation: Coach = structured coaching (main tab), Chat = quick Q&A (AI Studio sub-tab)

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact Level | Details |
|------|-------------|---------|
| **Epic 1** (Extension Stabilization) | Moderate | Story 1.2 partial revert (4 tabs), Story 1.4 AC change (Chat instead of Coach in AI Studio), Story 1.6 AC change (state management scope) |
| **Epic 5** (AI Career Coach) | Major | Restructured from 4 → 5 stories. Coach UI moved to main tab, Chat UI added as new story, session management covers both |
| **Epic 3** (Job Match Intelligence) | None | Match tab unaffected |
| **Epic 4** (AI Content Studio) | None | Cover Letter + Outreach unaffected |
| **Epic 6** (Smart Form Autofill) | None | Autofill tab unaffected |
| **Epic 7** (Usage & Credits) | Minor | Credit gating covers both Coach and Chat |
| **Epics 8-11** | None | No tab structure dependency |

### Story Impact

| Story | Status | Change Required |
|-------|--------|----------------|
| 1.2 (done) | Partial revert | 3-tab → 4-tab code changes bundled into Story 1.3 |
| 1.3 (backlog) | New Task 0 prepended | Restore Coach tab, `coachContent` prop, `MainTab` type |
| 1.4 (backlog) | AC modified | Coach sub-tab → Chat sub-tab in AI Studio |
| 1.6 (backlog) | AC modified | State management covers coach-store + chat-store |
| 5.1 (backlog) | AC modified | Add `context_type=chat` prompt template |
| 5.2 (backlog) | Restructured | Coach UI renders as main tab, not AI Studio sub-tab |
| 5.3 (new) | New story | Chat UI — AI Studio sub-tab & streaming |
| 5.4 (renumbered from 5.3) | Expanded | Session management for both Coach + Chat |
| 5.5 (renumbered from 5.4) | Expanded | IC-3 validates Coach + Chat + AI Studio |

### Artifact Conflicts

| Artifact | Sections Requiring Update |
|----------|--------------------------|
| **PRD** (requirements-inventory.md) | FR67a, FR67b, FR37a, FR69a, FR71 + new FR37i-FR37n |
| **UX Spec** (ux-design-specification.md) | Architecture Decisions table, Navigation Patterns, Rejected Patterns, Custom Components, Context Reset, Manual Reset |
| **Epic 1** (epic-1-extension-stabilization-ui-polish.md) | Story 1.2 AC#3, Story 1.3 new Task 0, Story 1.4 AC#1, Story 1.6 AC#1 |
| **Epic 5** (epic-5-ai-career-coach.md) | Epic description, all 4 stories restructured to 5 stories |
| **Epic List** (epic-list.md) | Epic 5 summary and FR coverage |
| **Sprint Status** (sprint-status.yaml) | Epic 5 story entries (4 → 5 stories, renamed) |
| **Index** (index.md) | Epic 5 ToC entries |

### Technical Impact

| Area | Impact |
|------|--------|
| `ExtensionSidebar` component | Revert to 4 tab triggers, restore `coachContent` prop |
| `sidebar-store.ts` | Restore `"coach"` to `MainTab` union type |
| `authenticated-layout.tsx` | Restore `coachContent` prop passing |
| `sidebar-store.test.ts` | Restore `"coach"` in tab preservation test |
| Storybook stories | Update for 4-tab structure |
| `/v1/ai/chat` endpoint (future) | Support `context_type: "coach" \| "chat"` with different prompt templates |
| New `chat-store` (future) | Separate Zustand store for Chat conversation state within AI Studio |

---

## Section 3: Recommended Approach

### Selected Path: Direct Adjustment

**Rationale:**
1. The 4-tab structure **already existed** in code before Story 1.2 — reverting the tab portion is trivial (~30 min)
2. All other Story 1.2 work (shell layout contract, semantic HTML, accessibility, Storybook) is fully preserved
3. Epic 5 restructuring is a planning-level change on backlog stories — no code impact yet
4. Chat as a distinct feature was always planned (CHAT-01/02/03) — this gives it its own UI surface
5. The `/v1/ai/chat` endpoint (not yet built) naturally supports both via `context_type` parameter

**Effort Estimate:** Low
- Code changes: ~30 min (Story 1.3 Task 0 — mechanical tab revert)
- Planning artifacts: ~1 hour (document updates — this proposal)
- No new infrastructure, no API changes, no database changes

**Risk Assessment:** Low
- Tab structure code existed before and was working
- No new dependencies introduced
- All backlog stories updated before development begins

**Timeline Impact:** None
- The tab revert is prepended to Story 1.3 (next story in queue)
- Epic 5 is Phase 3 — restructuring happens well before implementation

### Alternatives Considered

| Option | Verdict | Reason |
|--------|---------|--------|
| Full Story 1.2 rollback | Rejected | Would lose layout contract, accessibility, Storybook improvements |
| MVP scope reduction | Not needed | Same feature count, just reorganized across UI surfaces |
| Keep Coach in AI Studio + add Chat too | Rejected | Would create 5 sub-tabs in AI Studio (too crowded at 360px width) |

---

## Section 4: Detailed Change Proposals

### 4.1 PRD Changes (requirements-inventory.md)

| FR | Old | New |
|----|-----|-----|
| FR67a | "3-tab structure: Scan \| AI Studio \| Autofill" | "4-tab structure: Scan \| AI Studio \| Autofill \| Coach" |
| FR67b | "AI Studio contains 4 sub-tabs: Match \| Cover Letter \| Outreach \| Coach" | "...Match \| Cover Letter \| Outreach \| Chat" |
| FR37a | "Coach as a sub-tab within AI Studio...primary chat interface" | "Coach as a dedicated main-level tab...structured career coaching with skill-based entry points" |
| FR69a | "AI Studio tools (detailed match, cover letter, outreach, coach)" | "AI Studio tools (detailed match, cover letter, outreach, chat)" |
| FR71 | "All AI Studio tools (including Coach)" | "All AI Studio tools (including Chat) and the Coach tab" |

**New FRs (add after FR37h):**
- FR37i: Chat as AI Studio sub-tab for quick job-context Q&A
- FR37j: Chat grounded in resume + job context
- FR37k: Chat costs 1 credit per message
- FR37l: Chat resets on job switch
- FR37m: Chat displays conversation history
- FR37n: Users can start new Chat conversation

**FR Coverage Map update:**
- Coach (FR37a-FR37h, FR37f-i, FR37f-ii): Epic 5 — main tab
- Chat (FR37i-FR37n): Epic 5 — AI Studio sub-tab

### 4.2 UX Spec Changes (ux-design-specification.md)

| Section | Change |
|---------|--------|
| Architecture Decisions — Sidebar tabs | 3 tabs → 4 tabs (Coach is dedicated main-level tab) |
| Architecture Decisions — AI Studio sub-tabs | Coach → Chat (general job-context AI Q&A) |
| Navigation Patterns | "3-tab sidebar" → "4-tab sidebar" |
| Rejected Patterns | Update Answer tab entry — Chat is own sub-tab, Coach is own main tab |
| Custom Components | Add ChatPanel to list |
| Context reset on job switch | AI Studio includes Chat history; Coach listed separately |
| Manual reset | Clears AI Studio (including Chat) + Coach conversation separately |

### 4.3 Epic 1 Changes (epic-1-extension-stabilization-ui-polish.md)

| Story | Section | Change |
|-------|---------|--------|
| 1.2 | AC #3 | "3-tab navigation" → "4-tab navigation (Scan \| AI Studio \| Autofill \| Coach)" |
| 1.3 | Tasks | Prepend Task 0: Revert 3→4 tab navigation (restore coachContent prop, Coach tab trigger, MainTab type, authenticated-layout, store test, Storybook stories, isLocked behavior) |
| 1.4 | AC #1 | "4 sub-tabs (Match \| Cover Letter \| Outreach \| Coach)" → "...Outreach \| Chat)" |
| 1.6 | AC #1 | Add coach-store and chat-store to audit scope |

### 4.4 Epic 5 Changes (epic-5-ai-career-coach.md)

**Epic restructured from 4 → 5 stories:**

| # | Old Title | New Title | Key Change |
|---|-----------|-----------|------------|
| 5.1 | Chat Endpoint & Coach Prompt Templates | Chat Endpoint & Prompt Templates | Add `context_type=chat` prompt template alongside coach |
| 5.2 | Coach UI — Chat Interface, Skills & Streaming | Coach UI — Main Tab, Skills & Streaming | Coach renders as main-level tab, not AI Studio sub-tab |
| 5.3 | Coach Session Management & Context Reset | **NEW:** Chat UI — AI Studio Sub-Tab & Streaming | Simple Q&A interface with studio-accent styling |
| 5.4 | *(renumbered from 5.3)* | Coach & Chat Session Management & Context Reset | Covers both Coach + Chat session lifecycle |
| 5.5 | *(renumbered from 5.4)* | IC-3 — Full AI Studio + Coach + Chat E2E Validation | Validates both Chat sub-tab and Coach main tab |

### 4.5 Supporting File Changes

| File | Change |
|------|--------|
| epic-list.md | Epic 5 description + goal + FR coverage updated |
| sprint-status.yaml | Epic 5 story entries: 4 → 5, renamed keys |
| index.md | Epic 5 ToC: 4 → 5 story links, updated titles |

---

## Section 5: Implementation Handoff

### Scope Classification: Minor

This change can be implemented directly by the development team without backlog reorganization or architectural review.

### Handoff Plan

| Step | Owner | Action | When |
|------|-------|--------|------|
| 1 | Dev team (current agent) | Apply all artifact edits from this proposal | Immediately |
| 2 | Dev team | Execute Story 1.3 Task 0 (4-tab revert) | Next sprint task |
| 3 | SM (create-story workflow) | Create Story 1.3 implementation file with Task 0 prepended | Before Story 1.3 starts |
| 4 | SM (create-story workflow) | Create Epic 5 stories when Phase 3 begins | Phase 3 planning |

### Success Criteria

- [ ] All planning artifacts updated per this proposal
- [ ] Story 1.3 includes Task 0 (4-tab revert) when created
- [ ] ExtensionSidebar renders 4 main tabs after Story 1.3 Task 0
- [ ] AI Studio shows Chat sub-tab (not Coach) after Story 1.4
- [ ] Epic 5 stories reflect Coach (main tab) + Chat (sub-tab) split
- [ ] Sprint status reflects 5 stories for Epic 5

### Deliverables Produced

- [x] Sprint Change Proposal document (this file)
- [x] Specific edit proposals with before/after for all affected artifacts
- [x] Implementation handoff plan with task sequencing

---

*Generated by Correct Course workflow — 2026-02-14*
