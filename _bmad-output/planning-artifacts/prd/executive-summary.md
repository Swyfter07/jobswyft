# Executive Summary

**Product:** Jobswyft - AI-powered job application assistant

**Vision:** Transform job applications from a soul-crushing grind into a streamlined, confident experience.

**Differentiator:** Apply 5x faster without leaving the job posting page. Automatic job detection, scanning, and instant match analysis—no manual steps. Privacy-first AI that never stores your generated content.

**Target Users:** Job seekers across all career stages (students to executives) and industries.

**Surfaces:** Chrome Extension (primary) + Web Dashboard + Backend API

**Tech Stack:**
- **Extension:** WXT (TypeScript) - modern extension framework, cross-browser support
- **Dashboard:** Next.js 14+ (App Router, UI-only) - deployed on Vercel
- **Backend:** FastAPI (Python) - async native, OpenAPI auto-docs - deployed on Railway
- **Database:** PostgreSQL via Supabase (auth + storage + database)
- **AI:** Claude 3.5 Sonnet (primary), GPT-4o-mini (fallback)

**Architecture:** API contract-first monorepo enabling parallel development through generated TypeScript clients from OpenAPI spec.

**MVP Deployment:** Railway (backend API) + Vercel (dashboard) + Local unpacked extension for Chrome.

---
