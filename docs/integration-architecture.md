# Integration Architecture

Jobswyft has three main parts that communicate as follows.

---

## Extension ↔ API

| From | To | Protocol | Details |
|------|-----|----------|---------|
| Extension | API | REST (HTTPS) | Supabase client + custom API base URL |
| Extension | Supabase Auth | OAuth 2.0 | Google OAuth, JWT tokens |
| Extension | Supabase Storage | REST | Resume file upload/download |

**Flow:**
1. User signs in via Google OAuth (Supabase Auth)
2. Extension gets JWT access token
3. API calls use `Authorization: Bearer <token>`
4. API validates JWT via Supabase
5. Resume files stored in Supabase Storage; metadata in API/DB

**API base URL:** Configured via env (e.g. `https://jobswyft-production.up.railway.app`)

---

## Extension ↔ UI Package

| From | To | Type | Details |
|------|-----|------|---------|
| Extension | @jobswyft/ui | Import | `workspace:*` dependency |
| Extension | globals.css | Import | `@jobswyft/ui/styles` for tokens |

**Flow:** Extension imports components (LoginView, ResumeCard, AppHeader, etc.) and styles. No runtime API—compile-time dependency.

---

## Web Dashboard (Planned)

- **apps/web** is a placeholder (Next.js planned)
- Will use same API and Supabase Auth as extension
- Job tracking, resume management, billing, privacy on web

---

## Data Flow Summary

```
[Chrome Extension] ──JWT──► [API] ──service role──► [Supabase: DB + Storage + Auth]
       │
       └── OAuth ──► [Supabase Auth]
       └── Import ──► [@jobswyft/ui]
```
