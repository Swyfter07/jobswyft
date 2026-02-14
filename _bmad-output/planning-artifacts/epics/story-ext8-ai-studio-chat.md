# Story EXT.8: AI Studio — Chat (ABSORBED INTO EXT.12)

> **Status: ABSORBED** — This story has been merged into **EXT.12 (Coach)** per the Coach ↔ Chat consolidation decision (2026-02-14).
>
> Coach IS the conversational AI chat interface. It lives as an AI Studio sub-tab (4th sub-tab: Match | Cover Letter | Outreach | Coach). The previously separate Chat sub-tab (FR31-35) has been removed. All chat functionality is delivered through Coach with skill-based entry points.
>
> **See:** [Story EXT.12: Coach — AI Studio Sub-Tab](./story-ext12-coach-tab.md) for the consolidated scope.

## Original FRs (FR31-35) — Disposition

| Original FR | Disposition | Absorbed Into |
|-------------|-------------|---------------|
| FR31: Open chat from AI Studio | Absorbed | FR37a (Coach as AI Studio sub-tab) |
| FR32: Question suggestions | Absorbed | FR37f (skill categories as entry points) + FR37f-i (contextual skill suggestions) |
| FR33: Ask questions (1 credit/msg) | Absorbed | FR37d (Coach conversations cost 1 credit/message) |
| FR34: Conversation history | Absorbed | FR37g (Coach displays conversation history) |
| FR35: New session to clear history | Absorbed | FR37h (Start new Coach conversation) |

## Original Tech Debt — Disposition

| Item | Disposition | New Owner |
|------|-------------|-----------|
| CHAT-01: Build `POST /v1/ai/chat` | Still needed — serves Coach | API.2 |
| CHAT-02: AI prompt template | Merged with COACH-01 | API.4 |
| CHAT-03: Question suggestion generation | Absorbed into skill category UI | EXT.12 |

---
