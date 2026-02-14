# Architecture Overview

## 4-Surface Architecture

| Surface | Type | Stack | Hosting |
|---------|------|-------|---------|
| API | Backend | FastAPI, Python 3.11+, Supabase | Railway |
| Extension | Chrome Extension | WXT, React, Zustand | Chrome Web Store |
| User Dashboard | Web App | Next.js, TypeScript | Vercel |
| Admin Dashboard | Web App | Next.js, TypeScript | Vercel |

**Shared:** `@jobswyft/ui` component library, Supabase Auth (Google OAuth), config-driven tier system.

**Admin Access:** Separate admin roles in Supabase with role-based access control. Admin dashboard has its own auth gate.

## Key Decisions Log

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| 1 | Tier system | Config-driven in DB, all users "free" for MVP | User decision |
| 2 | Auto match | Two-level: quick analysis on scan (GPT-4.0→Claude) + deep analysis on demand | User decision |
| 3 | Job Details Card | Quick analysis + two buttons: Deep Analysis → Match, Ask Coach → Coach | User decision |
| 4 | AI Studio tools | AI Studio: 4 sub-tabs (Match, Cover Letter, Outreach, Coach). Coach is the conversational AI chat with skills UI + free-form chat. "Answer" API kept, not in v1 UI | User decision |
| 5 | Model selection | User can select AI model per request, differential pricing | User decision |
| 6 | Undo | Persistent, no timeout. Removed only on page refresh/DOM change | User decision |
| 7 | Sidebar states | 3 states: Logged Out, Non-Job, Job Detected=Full Power. 3 main tabs (Scan, AI Studio, Autofill). Coach inside AI Studio as 4th sub-tab | User decision |
| 8 | Feedback | MVP basic types. Enhanced later | User decision |
| 9 | Dashboards | Two: User + Admin, both Vercel/Next.js | User decision |
| 10 | Admin dashboard | NEW surface with role management, tier config, analytics | User decision |
