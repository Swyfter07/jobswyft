# Executive Summary

**Product:** Jobswyft — AI-powered job application assistant

**Vision:** Transform job applications from a soul-crushing grind into a streamlined, confident experience. Users should feel in control and empowered, not just faster.

**Differentiator:** An intelligence layer on top of the job application process. Automatic job detection → instant match analysis → contextual coaching → tailored content generation → one-click autofill. Privacy-first AI that never stores generated content. Config-driven operations that scale without deploys.

**Target Users:** Job seekers across all career stages (new grads to executives) and industries.

**4-Surface Architecture:**

| Surface | Stack | Hosting |
|---------|-------|---------|
| Chrome Extension (primary) | WXT, React, Zustand | Chrome Web Store |
| User Dashboard | Next.js, TypeScript | Vercel |
| Admin Dashboard | Next.js, TypeScript | Vercel |
| Backend API | FastAPI, Python 3.11+, Supabase | Railway |

**Shared Infrastructure:** `@jobswyft/ui` component library, Supabase (Auth, PostgreSQL, Storage), config-driven tier system.

**AI Providers:** Claude (primary generation, quick match fallback), GPT-4.0 (primary quick match). User-selectable model per request with differential pricing.

**MVP Strategy:** Free tier only. Core Engine (scan + autofill) is #1 priority. Admin Dashboard phased to 1.5 (weeks 2-4 post-launch). Paid tiers activated post-MVP via backend config.
