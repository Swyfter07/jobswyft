# Appendix: Verification Changelog

*This PRD was produced via verification mode against the v1 sharded PRD and PRD Shah.md. Below is the change log for traceability.*

## FR Changes (v1 → v2)

| Type | Count | Details |
|------|-------|---------|
| Unchanged | 74 | Verified correct against all decisions |
| Updated | 6 | FR45 (persistent undo), FR64 (chat→coach), FR67b (3 sub-tabs), FR69 (3 states), FR69a (remove chat ref), FR71 (3-state align) |
| Removed | 5 | FR31-35 (Chat merged into Coach FR37a-h) |
| New | 20 | Admin Dashboard (FR86-92), Config System (FR93-95), Model Selection (FR38a-c), Guardrails (FR40a-c), Core Engine (FR14c, FR22a-b), Job Details Card (FR23d), Coach additions (FR37g-h), Token Credits Post-MVP (FR66a-c) |

## NFR Changes (v1 → v2)

| Type | Count | Details |
|------|-------|---------|
| Unchanged | 40 | Verified correct |
| Updated | 4 | NFR2, NFR6a (chat→coach), NFR35, NFR38 (4-surface) |
| New | 8 | Admin auth (NFR45-46), Stability (NFR47-49), Config propagation (NFR50), Model selection (NFR51), Rate limiting UX (NFR52) |

## Coach ↔ Chat Clarification + Coach Location (v2 → v2.1)

*Decision (2026-02-14):* Coach IS the chat feature. The previously removed Chat (FR31-35) is now definitively absorbed into Coach (FR37a-h). Coach starts with a skill selection UI where users pick a category (Interview Prep, Application Strategy, etc.), then engage in free-form chat. Deeper coaching enhancements (mock interviews, career path planning) planned for post-MVP.

*Structural decision:* Coach is an **AI Studio sub-tab** (not a standalone sidebar tab). Sidebar has **3 main tabs** (Scan | AI Studio | Autofill). AI Studio has **4 sub-tabs** (Match | Cover Letter | Outreach | Coach).

| Type | Count | Details |
|------|-------|---------|
| Updated | 7 | FR37a (AI Studio sub-tab, primary chat interface), FR37f (skill categories as entry points), FR67a (3 main tabs), FR67b (4 AI Studio sub-tabs), FR69/69a/71 (Coach inside AI Studio), product-scope, architecture-overview KD#4 and KD#7 |
| New | 2 | FR37f-i (contextual skill suggestions from match analysis), FR37f-ii (free-form chat without skill selection) |

## Key Decisions (10 decisions documented in Architecture Overview → Key Decisions Log)
