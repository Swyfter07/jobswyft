# Confirmed Decisions (Step 1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **AI Provider (Primary)** | Claude 3.5 Sonnet | Superior writing quality for cover letters |
| **AI Provider (Fallback)** | GPT-4o-mini | Reliability backup, cost-effective |
| **Web Dashboard** | Include in MVP | As specified in PRD - required for job tracking, billing, account management |
| **Supabase Project** | New project for Jobswyft | Fresh start, can reuse schema patterns from job-jet |
| **Development Approach** | Build from scratch iteratively | Use job-jet as reference/baseline, not copy-paste |
| **Extension Framework** | WXT | Confirmed - battle-tested in prototype |
| **Extension Surface** | Chrome Side Panel API | Persistent panel alongside job boards; NOT content script Shadow DOM |
| **Sidebar Tabs** | 4: Scan \| AI Studio \| Autofill \| Coach | Coach is standalone — not nested in AI Studio |
| **AI Studio Sub-Tabs** | 4: Match \| Cover Letter \| Chat \| Outreach | Chat replaces Answer tab (conversational AI interface) |
| **Animation Library** | Framer Motion + CSS | Framer for state transitions + match score; CSS for micro-interactions |
| **Streaming AI** | Yes — streaming text reveal | Cover letters, outreach, coach stream progressively with cancel option |
| **Offline Mode** | None — graceful degradation | No offline features; clear "no connection" state instead |
| **Panel Width** | Fluid 360–700px | No fixed-width assumptions; 360px Chrome default, user-draggable |

---
