---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
workflowStatus: complete
completedAt: 2026-01-29
lastEdited: 2026-02-03
inputDocuments:
  - PRD.md
  - storybook-demo/docs/PRD.md (developer specification merge source)
workflowType: 'prd'
projectContext:
  productName: Jobswyft
  repositoryPurpose: Master documentation repository - the source of truth for all Jobswyft services, specifications, architecture, feature tracking, and task management
  existingPrdSource: PRD.md
  conversionMode: true
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: Multi-Surface Product (Extension + API + Dashboard)
  domain: Career Tech / Job Application Automation
  complexity: Medium (low regulatory, medium-high technical)
  projectContext: brownfield
editHistory:
  - date: 2026-02-03
    changes: |
      - Fixed implementation leakage (validation findings):
        - FR23b: Changed "pills" to "visual indicators"
        - NFR10: Changed "TLS 1.3" to "industry-standard transport security protocols"
        - NFR12: Changed "blob storage" to "file storage"
        - NFR29: Changed "horizontal scaling" to "scaling to handle increased concurrent user load"
        - NFR32: Changed "Supabase SDK" to "backend service"
        - NFR33: Changed "Stripe integration" to "payment processing system"
        - NFR37: Removed "OpenAPI spec" reference, kept "API contract"
  - date: 2026-02-03
    changes: |
      - Restructured Match Analysis: Split into Auto Match (free, high-level, 20/day for free users) and Detailed Match (1 credit, deep analysis)
      - Removed Answer Generation tool from AI Studio
      - Added Chat capability with pre-generated question suggestions (1 credit per message)
      - Updated credit system: Auto match free with rate limits, paid features unchanged
      - Updated all 4 user journeys to reflect auto match and chat
      - Updated Success Criteria metrics for new tool structure
      - Updated MVP scope to include auto match and chat
      - Renumbered FRs: Match (FR23-FR25), Chat (FR31-FR35), subsequent FRs +3
      - Updated NFRs for auto match and detailed match performance targets
  - date: 2026-02-02
    changes: |
      - Merged requirements from developer specification document
      - Added Sidebar State Model (4 states: Logged Out, Non-Job Page, Job Page, Application Page)
      - Added Shared Component Library subsection (packages/ui)
      - FR14: Changed to auto-scan on job page detection; added FR14a, FR14b for URL patterns and manual fallback
      - FR13a-c: Added Resume Blocks feature (expandable sections, quick copy)
      - FR26a: Added cover letter length selector
      - FR33a-c: Added outreach tone, length, custom instructions
      - FR39a-b, FR41a: Added autofill DOM preview and tick-off state
      - FR64: Expanded to 4-state model; added FR64a-b for AI/Autofill unlock conditions
      - FR65: Fixed subjective adjective (validation finding)
      - FR78-80: Added specificity for feedback types, context, storage (validation finding)
      - User Journeys: Updated all 4 personas to reflect auto-scan behavior
      - Product Scope: Added pricing tier details (generation amounts)
      - Executive Summary: Added auto-detection to differentiator
  - date: 2026-01-31
    changes: |
      - FR19: Clarified application questions are extracted ephemerally (not persisted)
      - FR36: Expanded to include extracted application questions as ephemeral
  - date: 2026-01-31
    changes: |
      - FR8: Made AI-powered resume parsing explicit (Claude/GPT)
      - FR8: Added extracted data fields (skills, experience, education, contact info)
      - MVP Scope: Updated to "AI parsing" for consistency
  - date: 2026-01-30
    changes: |
      - Moved Stripe integration to Post-MVP (Phase 2)
      - MVP now free-tier only (5 generations + referral bonus)
      - FR55: Modified to show Free Tier status
      - FR57, FR58: Marked as Post-MVP (subscription management)
      - FR61: Changed to "upgrade coming soon" message
      - FR70: Removed billing reference for MVP
      - NFR33: Marked as Post-MVP
  - date: 2026-01-30
    changes: |
      - Framework: Plasmo → WXT
      - Deployment: Railway (API) + Vercel (Dashboard)
      - Added tooling: Railway CLI, Vercel CLI, Supabase CLI/MCP
      - Added user feedback to MVP (FR78-FR80)
      - Marked scalability NFRs as Post-MVP
      - Added MVP testing/logging requirements (NFR39-NFR44)
      - Added implementation priority: Backend API + Database first
---

# Product Requirements Document - Jobswyft

**Author:** jobswyft
**Date:** 2026-01-29

---

## Executive Summary

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

## Success Criteria

### User Success

**The Transformation Promise:**
Jobswyft transforms job applications from a soul-crushing grind into a streamlined, confident experience. Users should feel *in control* and *empowered*, not just faster.

**Emotional Success States:**

| Moment | Target Feeling |
|--------|----------------|
| First successful scan | "Wow, it just *got* the job posting" |
| Generated cover letter | "This sounds like me, but better" |
| Autofill completion | "I just saved 15 minutes of copy-paste hell" |
| After 5 applications | "I'm never going back to the old way" |

**Measurable User Outcomes:**

- **Speed**: Users complete job applications **5x faster** than manual process (target: <3 min from landing on page to submitted application)
- **Confidence**: **90%+ of users** report feeling "more confident" in their application quality
- **Stickiness**: After **3 successful applications**, users reach "habit formation" threshold
- **Delight metric**: **4.8+ star rating** in Chrome Web Store within first 6 months
- **Word of mouth**: **40%+ of users** voluntarily recommend Jobswyft to a friend

**User Success Milestones:**

1. **First Win**: Complete first AI-assisted application within 5 minutes of install
2. **Power User**: Use 3+ AI Studio tools on a single application
3. **Loyal User**: Return to use Jobswyft for 10+ applications
4. **Advocate**: Refer at least 1 friend

### Business Success

**North Star Metric:** Monthly Active Appliers (MAA) - users who complete at least 1 AI-assisted application per month

**MVP Success Gate:** Working end-to-end flow deployed - user can install extension, authenticate, scan a job, generate content, and apply.

**3-Month Targets (Post-MVP):**

| Metric | Target | Rationale |
|--------|--------|-----------|
| Total installs | 50,000 | Aggressive launch with Product Hunt, communities |
| Weekly Active Users | 15,000 | 30% WAU/install ratio |
| Free→Paid conversion | 8% | Strong value demonstration |
| Monthly Recurring Revenue | $20,000 | Foundation for growth |
| Churn rate | <5%/month | Proves stickiness |

**12-Month Targets (Post-MVP Scale Phase):**

| Metric | Target | Rationale |
|--------|--------|-----------|
| Total installs | 500,000 | 10x growth through virality + marketing |
| Monthly Active Users | 150,000 | 30% MAU/install |
| Paid subscribers | 25,000 | Mix across tiers |
| Monthly Recurring Revenue | $200,000+ | Sustainable business |
| Annual Recurring Revenue | $2.4M+ | Series A ready |

**Viral Growth Engine:**

- **Referral rate**: 1 in 4 users refers a friend (25%)
- **Viral coefficient**: 0.4+ (each user brings 0.4 new users)
- **Organic install share**: 60%+ from word-of-mouth and organic search

**Revenue Mix Target:**

| Tier | Price | % of Paid Users | Contribution |
|------|-------|-----------------|--------------|
| Starter | $4.99 | 50% | Base volume |
| Pro | $9.99 | 35% | Core revenue |
| Power | $19.99 | 15% | High-value users |

**Average Revenue Per Paid User (ARPPU):** $8.50/month

### Technical Success

**Scan Engine Performance:**

| Metric | Target | Notes |
|--------|--------|-------|
| Successful auto-scan rate | **95%+** on top 50 job boards | LinkedIn, Indeed, Greenhouse, Lever, Workday, etc. |
| Fallback scan success | **85%+** on unknown sites | AI extraction handles edge cases |
| Required fields extraction | **99%+** accuracy | Title, company, description |
| Scan speed | **<2 seconds** | Feel instant |
| Auto match generation | **<2 seconds** post-scan | High-level analysis (score, skills, gaps) |
| Auto match accuracy | **90%+** relevance | Match insights align with user perception |

**AI Studio Performance:**

| Metric | Target | Notes |
|--------|--------|-------|
| Auto match latency | **<2 seconds** | High-level analysis on scan |
| Detailed match latency | **<5 seconds** | Deep analysis on demand |
| Generation latency | **<5 seconds** | Cover letter, outreach, chat |
| Chat response time | **<5 seconds** | Per message |
| Output quality rating | **4.5+/5** user satisfaction | "Sounds like me" test |
| AI failure rate | **<1%** | Graceful degradation |
| Token efficiency | **<$0.02/generation** average | Sustainable unit economics |

**Autofill Accuracy:**

| Metric | Target | Notes |
|--------|--------|-------|
| Field mapping accuracy | **90%+** on standard forms | Personal info, resume upload |
| Complex form handling | **75%+** | Multi-page, conditional fields |
| Undo reliability | **100%** | Never lose user data |

**System Reliability:**

| Metric | Target | Notes |
|--------|--------|-------|
| Backend uptime | **99.9%** | <8.7 hours downtime/year |
| Extension crash rate | **<0.1%** | Stable across Chrome versions |
| Auth success rate | **99.5%+** | OAuth flow reliability |
| Data sync reliability | **99.9%** | Local ↔ backend consistency |

**Security & Privacy:**

| Metric | Target | Notes |
|--------|--------|-------|
| Zero data breaches | **0** | Non-negotiable |
| AI output storage | **0 bytes server-side** | Privacy promise kept |
| SOC 2 readiness | **12 months** | Enterprise expansion prep |

### Measurable Outcomes

**The "Jobswyft Effect" - Quantified:**

| Outcome | Baseline (Manual) | With Jobswyft | Improvement |
|---------|-------------------|---------------|-------------|
| Time per application | 15-30 min | 3-5 min | **5-6x faster** |
| Applications per session | 2-3 | 8-12 | **4x more volume** |
| Cover letter quality | Generic/skipped | Personalized | **∞ improvement** |
| Application completion rate | 60% start→submit | 90%+ | **50% lift** |
| User confidence score | 3/5 | 4.5/5 | **50% lift** |

**Leading Indicators (Weekly Dashboard):**

1. New installs (growth)
2. Scans per user (engagement)
3. AI generations per user (value delivery)
4. Conversion rate (monetization)
5. NPS score (satisfaction)

## Product Scope

### MVP - Minimum Viable Product

**Core Extension (Must Ship):**

- [ ] Google OAuth authentication
- [ ] Resume upload + AI parsing (up to 5 resumes)
- [ ] Active resume selection
- [ ] Scan Page functionality (hybrid: rules + AI fallback)
- [ ] Auto match analysis (instant, high-level, rate-limited for free users)
- [ ] All 4 AI Studio tools: Match (detailed analysis), Cover Letter, Outreach, Chat
- [ ] Autofill with single-step undo
- [ ] Usage balance display
- [ ] Free tier (5 generations + 20 auto matches/day) + paid tier integration

**Core Dashboard (Must Ship):**

- [ ] Jobs list with status tracking
- [ ] Resume management (view/upload/delete)
- [ ] Account management (profile, free tier status)
- [ ] Data & privacy controls with delete flow
- [ ] User feedback capture (UI placement TBD)

**MVP Monetization:** Free tier only (5 generations + referral bonus). Paid subscriptions deferred to post-MVP.

**Planned Pricing Tiers (Post-MVP):**

| Tier | Price | Generations/Month | Notes |
|------|-------|-------------------|-------|
| Free | $0 | 5 lifetime | +5 per referral signup |
| Starter | $4.99/mo | 300 | Entry-level paid |
| Pro | $9.99/mo | 1,000 | Core revenue tier |
| Power | $19.99/mo | 3,000 | High-volume users |

Unused generations roll over to next billing period.

**MVP Success Gate:** A user can install, authenticate, scan a job with instant match analysis, use chat for questions, generate a cover letter, autofill an application, track the job, and provide feedback - end to end.

### Growth Features (Post-MVP)

**Phase 2 - Power Features (Months 2-4):**

- [ ] Subscription & billing (Stripe integration)
- [ ] Browser support expansion (Firefox, Edge)
- [ ] Bulk application mode (queue multiple jobs)
- [ ] Application templates (save/reuse customizations)
- [ ] Enhanced job board integrations (LinkedIn Easy Apply, Indeed)
- [ ] Chrome extension keyboard shortcuts

**Phase 3 - Intelligence Layer (Months 4-6):**

- [ ] Smart job recommendations based on resume
- [ ] Application success tracking (got interview? got offer?)
- [ ] AI-powered resume suggestions
- [ ] Company research integration
- [ ] Salary insights

**Phase 4 - Network Effects (Months 6-9):**

- [ ] Team/enterprise accounts
- [ ] Recruiter/coach mode
- [ ] Public API for integrations
- [ ] White-label partnerships

### Vision (Future)

**The Ultimate Career Companion (12+ Months):**

**Full Application Automation:**
- One-click apply across 100+ job boards
- Smart application scheduling (optimal times)
- Auto-follow-up sequences

**AI Career Coach:**
- Interview preparation with AI mock interviews
- Salary negotiation coaching
- Career path recommendations
- Skill gap analysis with learning recommendations

**Career Network Intelligence:**
- Insider referral matching
- Hiring manager outreach optimization
- Company culture fit scoring
- "Hidden job market" access

**Career Analytics Dashboard:**
- Application funnel analytics
- Market demand for your skills
- Salary benchmarking
- Career trajectory modeling

**Vision Statement:** Jobswyft becomes the AI-powered career platform that doesn't just help you apply - it helps you land your dream job and grow your career.

## User Journeys

### Journey 1: The Active Job Hunter

**Persona: Marcus Chen**
- **Age**: 34
- **Situation**: Senior software engineer, just laid off in a tech downturn. Has 3 months of runway. Needs to send 10+ quality applications daily.
- **Goal**: Land interviews fast without burning out on repetitive application tasks
- **Obstacle**: Every application feels like starting from scratch. Copy-paste fatigue. Cover letters are a time sink.

**Opening Scene:**

It's 9 PM. Marcus has been job hunting for two weeks. His browser has 47 tabs open—LinkedIn, Indeed, company career pages. His eyes are glazed. He just spent 22 minutes on a single application for a role he's not even excited about. His cover letter was generic. He knows it. The company knows it. Another application into the void.

He thinks: *"There has to be a better way."*

A Reddit thread mentions Jobswyft. He installs it. Skeptical, but desperate.

**Rising Action:**

Marcus lands on a job posting at a Series B startup. He clicks the Jobswyft icon. A sidebar slides in—clean, unobtrusive. He signs in with Google. Uploads his resume.

The sidebar instantly recognizes the job page—no button click needed. Two seconds later, the job details appear: title, company, full description, even the salary range buried in paragraph six. *"How did it find that?"*

Below the job card, an instant match analysis appears: **87% match**. Green pills show his strengths: "Distributed Systems", "Team Leadership". Yellow pills flag gaps: "Kubernetes". Side-by-side layout. *"It already knows where I'm strong,"* he thinks.

He clicks **Cover Letter**. Selects "Confident" tone. Adds a custom note: "Mention my open-source contributions." Five seconds later, a cover letter appears. It sounds like him—but sharper. It highlights his system design work and connects it to the startup's scaling challenges.

He tweaks one sentence. Hits **Autofill**. The application form populates. Name, email, LinkedIn, resume uploaded, cover letter pasted. Fields highlight green.

**Climax:**

Marcus submits the application. He checks the time: 4 minutes. Not 22. *Four minutes.*

He grins. Opens the next tab. Auto-scan detects the job. Generates. Autofills. Submits. Tab after tab.

By 10:30 PM, he's submitted 12 high-quality applications. Each with a tailored cover letter. Each in under 5 minutes.

**Resolution:**

Three days later, Marcus has two interview requests—including the Series B startup. His applications stand out because they're personalized, not templated garbage.

He tells his laid-off coworker about Jobswyft. *"Dude, this thing paid for itself in the first hour."*

Marcus upgrades to Pro.

**Requirements Revealed:**
- Automatic job page detection and scanning (< 2 sec)
- Auto match analysis (instant, high-level) showing score, strengths, gaps as pills
- Cover letter generation with tone + custom instructions
- Autofill that handles standard fields reliably
- Speed optimized for high-volume appliers
- Clear value demonstration within first use

---

### Journey 2: The First-Time User

**Persona: Aisha Patel**
- **Age**: 28
- **Situation**: Marketing manager exploring new opportunities. Not desperate, but curious. Skeptical of "AI tools."
- **Goal**: See if this thing actually works before committing
- **Obstacle**: Trust. She's installed browser extensions before that were spammy, invasive, or useless.

**Opening Scene:**

Aisha sees a Jobswyft ad on LinkedIn. The promise sounds too good: *"Apply 5x faster."* She rolls her eyes. But she's been procrastinating on updating her applications, so she clicks.

Chrome Web Store. 4.8 stars. 50K users. *"Okay, not a scam."* She installs.

She's on a marketing manager posting at a DTC brand she likes. She clicks the extension icon. A sidebar appears.

**Rising Action:**

First thing she sees: **Sign in with Google**. No email/password. No friction. She clicks. Authenticated in 2 seconds.

Next: **Upload Resume**. She drags her PDF. A progress bar. *"Parsing..."* Done. Her resume appears in the tray at the top.

The sidebar instantly detects the job page and begins scanning automatically. A subtle progress indicator appears.

Within two seconds, the job details populate. Title: Marketing Manager. Company: GlowUp Beauty. Salary: $95K-$115K. Full job description. *"It just... knew?"*

Below the job card, an instant match analysis appears: **82% match**. Green pills: "Brand Campaigns", "DTC Experience". Yellow pills: "TikTok Marketing". Side-by-side layout. Clear, visual, instant feedback.

*"Okay... that's kind of impressive. And I do have TikTok experience—I should update my resume."*

She clicks **Cover Letter**. Chooses "Friendly" tone. The output is... actually good? It mentions GlowUp's recent product launch (pulled from the job description) and connects it to her DTC experience.

**Climax:**

Aisha realizes: *"This isn't replacing me. It's giving me a better first draft than I'd write at 11 PM."*

She edits two sentences to add her voice. Hits **Autofill**. The form fills. She scans the fields—all correct. She submits.

Total time: 6 minutes. Her first application in weeks.

**Resolution:**

Aisha doesn't upgrade yet—she's only used 1 of her 5 free generations. But she bookmarks three more jobs to apply to this weekend.

A week later, she's used all 5 free generations. She gets an interview at GlowUp. She upgrades to Starter.

*"Okay, I'm a believer."*

**Requirements Revealed:**
- Frictionless onboarding (Google OAuth, no forms)
- Clear UI with helpful tooltips for new users
- Immediate value demonstration on first scan (auto match included)
- Auto match analysis that surfaces actionable insights instantly
- Trust-building through transparency (no hidden actions)
- Free tier that's generous enough to prove value (20 auto matches/day)
- Upgrade path feels natural, not pushy

---

### Journey 3: The Returning User

**Persona: David Okonkwo**
- **Age**: 41
- **Situation**: Engineering director who used Jobswyft 6 months ago, landed a job, cancelled subscription. Now exploring again (new company is struggling).
- **Goal**: Pick up where he left off without re-learning everything
- **Obstacle**: Expects his data to be gone. Dreads re-uploading resumes and re-learning the UI.

**Opening Scene:**

David's company just announced a hiring freeze. Reading the room, he dusts off his job search. He remembers Jobswyft helped last time.

He clicks the extension icon. It's still installed. He's logged out.

He signs in with Google. Holds his breath.

**Rising Action:**

His dashboard loads. His 3 resumes are still there—including the executive resume he spent hours formatting. His active resume is still selected: *"David Okonkwo - Engineering Director 2025.pdf"*.

He exhales. *"Thank god."*

He navigates to the Jobs tab. His old saved jobs are there—marked as "Applied" or "Interviewed." A time capsule of his last search. He smiles seeing the job he landed (status: "Offer Accepted").

He opens a new job posting—VP of Engineering at a growth-stage startup. The sidebar auto-detects the page and scans instantly. Familiar. The UI hasn't changed much—maybe cleaner, but the muscle memory is there.

The instant match analysis appears: **92% match**. Green pills: "Team Scaling (20→100)", "M&A Integration", "Engineering Leadership". No yellow pills—he's a strong fit. The AI confidence is reassuring.

He clicks **Cover Letter**. Same flow. Tone: "Executive." Custom instruction: "Emphasize my M&A integration experience." The output is polished—boardroom-ready.

**Climax:**

David realizes: *"I'm not starting over. I'm continuing."*

He applies to 3 VP roles in 20 minutes. Each application is tailored. His confidence is back.

**Resolution:**

David resubscribes to Pro. He sets a goal: 5 strategic applications per week. Quality over quantity at his level.

Two weeks later, he's in final rounds at two companies.

He thinks: *"This is the only tool I actually keep coming back to."*

**Requirements Revealed:**
- Persistent data across sessions (resumes, saved jobs)
- Graceful re-authentication (no data loss on logout)
- Subscription pause/resume without data deletion
- Historical job tracking for returning users
- UI consistency across versions (muscle memory preserved)
- Premium tiers that serve senior/executive users

---

### Journey 4: The New Grad

**Persona: Jenna Morales**
- **Age**: 22
- **Situation**: Recent computer science graduate. First real job hunt. Has a decent resume but zero confidence in her cover letters.
- **Goal**: Land her first software engineering job without sounding like every other new grad
- **Obstacle**: Imposter syndrome. Doesn't know "how to sell herself." Cover letters feel fake and forced.

**Opening Scene:**

Jenna stares at a blank Google Doc. The cursor blinks. She's supposed to write a cover letter for a junior developer role at a fintech startup. She's written "Dear Hiring Manager" five times and deleted it five times.

Her resume lists her CS degree, two internships, and a capstone project. But she doesn't know how to *talk* about herself. Every sentence feels cringey or braggy or boring.

Her roommate—also job hunting—mentions Jobswyft. *"It writes cover letters that don't suck."*

Jenna installs it.

**Rising Action:**

She opens the job posting. Clicks the Jobswyft icon. Signs in. Uploads her resume (nervous—is it good enough?).

The sidebar recognizes the job page and scans automatically. The job details appear. Below, the instant match analysis loads: **78% match**.

Green pills: "Python", "Payment Systems Project", "Banking Internship". Yellow pills: "Production Kubernetes".

Jenna exhales. *"Okay, I actually do have relevant stuff."* The auto match saw things in her resume she'd undervalued. The visual layout makes it clear—she's closer than she thought.

She clicks **Cover Letter**. Pauses at tone selection. Chooses "Enthusiastic." Adds custom instruction: *"I'm a new grad—make it sound genuine, not desperate."*

The cover letter generates. She reads it:

> *"My capstone project—a peer-to-peer payment simulator—taught me that fintech isn't just about moving money; it's about building trust at scale. I'm excited to bring that perspective to [Company], where infrastructure reliability isn't a feature—it's the product."*

Jenna's jaw drops. *"I would never have written that. But it's... me?"*

**Climax:**

She edits one line to mention her professor's feedback on the capstone. Hits **Autofill**. Submits.

For the first time in her job search, she feels *confident* about an application.

**Resolution:**

Jenna applies to 8 more jobs that week. Each cover letter is different—tailored to the company, grounded in her experience. She stops dreading cover letters.

She gets 3 interview requests. More than most of her classmates.

At her first interview, the hiring manager says: *"Your cover letter stood out—it felt genuine."*

Jenna upgrades to Starter before her free generations run out. She tells her study group about Jobswyft.

*"It's like having a career coach that doesn't make you feel dumb."*

**Requirements Revealed:**
- Auto match analysis that builds confidence instantly (surface hidden strengths)
- Match score and visual pills (green/yellow) make feedback clear and encouraging
- Cover letter generation that sounds authentic, not corporate
- Tone options that serve different experience levels
- Custom instructions for personal touch
- UI that doesn't intimidate first-time job hunters
- Positive emotional reinforcement throughout experience
- Referral program to capture word-of-mouth from students

---

### Journey Requirements Summary

| Journey | Primary Requirements Revealed |
|---------|-------------------------------|
| **Active Job Hunter (Marcus)** | Speed, bulk efficiency, high-quality AI output, instant value |
| **First-Time User (Aisha)** | Trust-building, tooltips, frictionless onboarding, generous free tier |
| **Returning User (David)** | Data persistence, subscription flexibility, familiar UX, premium features |
| **New Grad (Jenna)** | Confidence-building, authentic tone options, custom instructions, positive UX |

**Cross-Journey Patterns:**

| Pattern | Requirement |
|---------|-------------|
| All users scan and see instant match | Scan + auto match must be fast, reliable, immediate value |
| All users edit AI output | Outputs must be editable, not locked |
| All users value personalization | Custom instructions, tone selection matter |
| Trust is earned in first 5 minutes | Onboarding must prove value immediately (auto match helps) |
| Return users expect continuity | Data must persist across sessions/subscriptions |

## Multi-Surface Product Requirements

### Project-Type Overview

Jobswyft is a **Multi-Surface Product** consisting of three independently deployable applications sharing a common API contract:

| Surface | Technology | Deployment | Purpose |
|---------|------------|------------|---------|
| **Extension** | WXT (TypeScript) | Local unpacked (MVP) | Primary user interface - sidebar on job pages |
| **Web Dashboard** | Next.js (TypeScript) | Vercel | Job tracking, account management, billing |
| **Backend API** | FastAPI (Python) | Railway | Business logic, AI orchestration, data persistence |

**Development Model:** Solo developer with LLM-assisted development. Architecture optimized for parallel task execution and modular boundaries.

**Implementation Priority:** Backend API + Database first, then Dashboard, then Extension.

### Technical Architecture

**Monorepo Structure:**

```
jobswyft/
├── apps/
│   ├── api/                    # FastAPI backend (Python)
│   ├── web/                    # Next.js dashboard (TypeScript)
│   └── extension/              # WXT extension (TypeScript)
├── packages/
│   ├── api-client/             # Generated TypeScript client from OpenAPI
│   └── ui/                     # Shared component library (Extension + Dashboard)
├── specs/
│   └── openapi.yaml            # API contract (source of truth)
└── pnpm-workspace.yaml
```

**Technology Stack:**

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Extension Framework** | WXT | Modern extension framework, cross-browser support, excellent DX |
| **Dashboard Framework** | Next.js 14+ (App Router) | SSR for SEO, TypeScript, Vercel deployment |
| **Backend Framework** | FastAPI | Python ecosystem for AI/ML, async native, auto OpenAPI docs |
| **Database** | PostgreSQL (Supabase) | Relational model fits data structure, managed service |
| **Auth** | Supabase Auth | Google OAuth built-in, Python SDK available |
| **File Storage** | Supabase Storage | Resume PDFs, integrated with auth |
| **AI Provider** | Claude 3.5 Sonnet (primary) | Superior writing quality for cover letters |
| **AI Fallback** | GPT-4o-mini | Reliability backup, cost-effective |
| **Package Manager** | pnpm workspaces | Monorepo support, fast installs |

**Development & Deployment Tooling:**

| Tool | Purpose |
|------|---------|
| **Railway CLI** | Backend API deployment; local build validation → direct push |
| **Vercel CLI** | Dashboard deployment; secrets management |
| **Supabase CLI** | Database migrations, local development |
| **Supabase MCP** | AI-assisted database operations |

**Secrets Management:** Environment variables stored in Railway (API) and Vercel (Dashboard).

### Shared Component Library

**Purpose:** Centralized UI component library ensuring visual consistency between extension sidebar and web dashboard.

**Package Location:** `packages/ui/`

**Shared Components:**
- Buttons (primary, secondary, ghost, destructive)
- Form inputs (text, textarea, select, file upload)
- Cards and containers
- Modals and dialogs
- Typography system
- Icons (consistent icon set)
- Loading states and skeletons
- Toast notifications

**Architecture Principles:**
- Framework-agnostic core with React wrappers
- Tailwind CSS for styling (shared config)
- Independently versioned within monorepo
- Changes propagate to both surfaces without code duplication
- Storybook for component documentation and testing

### API Contract Design

**Contract-First Development:**

- OpenAPI specification in `specs/openapi.yaml` serves as source of truth
- TypeScript client auto-generated for extension and dashboard
- Enables parallel development across surfaces
- API versioning with `/v1/` prefix from start

**Code Generation Pipeline:**

```bash
# Generate TypeScript client from OpenAPI spec
npx openapi-typescript-codegen \
  --input specs/openapi.yaml \
  --output packages/api-client/src \
  --client fetch
```

### Local Development Model

| Component | How It Runs | Dependencies |
|-----------|-------------|--------------|
| **Extension** | Chrome (load unpacked from local build) | API running |
| **Web** | `pnpm dev` (localhost:3000) | API running |
| **API** | `uvicorn` locally or Railway dev | Supabase (cloud) |

**Deployment Workflow (MVP):**
1. Validate build locally
2. Push directly to Railway (API) / Vercel (Dashboard) via CLI
3. No CI/CD pipeline required for MVP

### Extension-Specific Requirements

**WXT Configuration:**

- Content scripts for sidebar injection
- Shadow DOM for style isolation from host pages
- Background service worker for OAuth and API communication
- Chrome Storage for local state (active resume, scan cache)
- Local unpacked extension loading for MVP development/testing

**Chrome Permissions Required:**

- `activeTab` - Access current tab for scanning
- `scripting` - Inject content scripts
- `storage` - Local state persistence
- `tabs` - Tab detection for job pages
- `identity` - Google OAuth flow
- `host_permissions: <all_urls>` - Work on any job board

**Sidebar State Model:**

The extension sidebar operates in four distinct states based on authentication and page context:

| State | Condition | Available Features |
|-------|-----------|-------------------|
| **Logged Out** | User not authenticated | Google Sign-In button only |
| **Non-Job Page** | Authenticated, page is not a job posting | Resume tray, Dashboard link; AI Studio and Autofill disabled |
| **Job Page** | Authenticated, job posting detected | Resume tray, auto-scan displays job card; AI Studio locked until application page |
| **Application Page** | Authenticated, job application form detected | Full features: Resume tray, AI Studio unlocked, Autofill enabled |

**State Transitions:**
- Sidebar opens → Check auth → Logged Out or check page type
- Page navigation → Re-evaluate page type → Update available features
- Logout → Clear tokens → Return to Logged Out state

### Dashboard-Specific Requirements

**Next.js Configuration:**

- App Router for modern React patterns
- UI-only (no API routes) - all data from FastAPI backend
- Tailwind CSS for styling
- shadcn/ui for accessible components

**Pages:**

- `/` - Landing/marketing (SSR for SEO)
- `/jobs` - Job tracking table
- `/resumes` - Resume management
- `/account` - Subscription and billing
- `/privacy` - Data controls and deletion

### Backend-Specific Requirements

**FastAPI Configuration:**

- Async endpoints for AI operations
- Pydantic models for request/response validation
- Auto-generated OpenAPI documentation
- Supabase Python SDK for database and auth

**Key Endpoints (to be detailed in API spec):**

- `/v1/auth/*` - OAuth flow
- `/v1/resumes/*` - Resume CRUD and parsing
- `/v1/jobs/*` - Job saving and tracking
- `/v1/ai/*` - AI generation (match, cover letter, answer, outreach)
- `/v1/usage/*` - Usage tracking and subscription status

### Deferred Decisions

| Topic | Deferred To |
|-------|-------------|
| Complete API contract (endpoints, schemas) | Architecture workflow |
| Error handling patterns | Architecture review |
| Testing strategy (unit, integration, E2E) | Implementation phase |
| CI/CD pipeline configuration | Implementation phase |
| Database migration strategy | Implementation phase |

## Functional Requirements

### Authentication & Account Management

- **FR1:** Users can sign in using Google OAuth
- **FR2:** Users can sign out from the extension
- **FR3:** Users can sign out from the dashboard
- **FR4:** System maintains authentication state across browser sessions
- **FR5:** Users can view their account profile information
- **FR6:** Users can delete their entire account and all associated data

### Resume Management

- **FR7:** Users can upload resume files (PDF format)
- **FR8:** System uses AI to parse uploaded resumes and extract structured data (skills, experience, education, contact information)
- **FR9:** Users can store up to 5 resumes in their account
- **FR10:** Users can select one resume as their active resume
- **FR11:** Users can view their list of uploaded resumes
- **FR12:** Users can delete individual resumes
- **FR13:** Users can switch between resumes when applying to jobs
- **FR13a:** Users can view parsed resume content organized in expandable block sections
- **FR13b:** Users can expand individual resume blocks to view full content (skills, experience, education, etc.)
- **FR13c:** Users can copy resume block content to clipboard with single click

### Job Page Scanning

- **FR14:** System automatically scans job posting pages when detected via URL pattern matching
- **FR14a:** System detects job pages using configurable URL patterns for major job boards
- **FR14b:** Users can manually trigger scan if automatic detection fails
- **FR15:** System extracts job title from job posting pages
- **FR16:** System extracts company name from job posting pages
- **FR17:** System extracts full job description from job posting pages
- **FR18:** System extracts optional fields (location, salary, employment type) when available
- **FR19:** System extracts application questions ephemerally when present on the page (not persisted to database)
- **FR20:** Users can manually correct extracted fields using an element picker
- **FR21:** Users can manually edit any extracted field directly
- **FR22:** System indicates which required fields are missing after a scan

### AI Generation Tools

**Match Analysis:**

- **FR23:** System automatically generates high-level match analysis upon successful job scan
- **FR23a:** Auto match analysis is free for all users with rate limits: 20 per day for free tier, unlimited for paid tiers
- **FR23b:** Auto match displays match score (0-100%), skills strengths as green visual indicators, skill gaps as yellow visual indicators
- **FR23c:** Auto match layout presents strengths and gaps side-by-side within job card
- **FR24:** Users can trigger detailed match analysis (costs 1 AI credit)
- **FR25:** Detailed match analysis provides comprehensive strengths, gaps, and recommendations beyond high-level view

**Cover Letter:**

- **FR26:** Users can generate a tailored cover letter
- **FR26a:** Users can select a length for cover letter generation (e.g., brief, standard, detailed)
- **FR27:** Users can select a tone for cover letter generation (e.g., confident, friendly, enthusiastic)
- **FR28:** Users can provide custom instructions for cover letter generation
- **FR29:** Users can regenerate cover letter with feedback on what to change
- **FR30:** Users can export generated cover letters as PDF

**Chat:**

- **FR31:** Users can open chat interface from AI Studio
- **FR32:** System generates question suggestions based on extracted job posting content
- **FR33:** Users can ask questions via chat (costs 1 AI credit per message)
- **FR34:** Chat displays conversation history within current session
- **FR35:** Users can start new chat session to clear history

**Outreach Messages:**

- **FR36:** Users can generate outreach messages for recruiters/hiring managers
- **FR36a:** Users can select a tone for outreach message generation
- **FR36b:** Users can select a length for outreach message generation (e.g., brief, standard)
- **FR36c:** Users can provide custom instructions for outreach message generation
- **FR37:** Users can regenerate outreach messages with feedback on what to change

**Common AI Capabilities:**

- **FR38:** Users can edit any AI-generated output before using it
- **FR39:** AI outputs and extracted application questions are ephemeral and not stored on the server
- **FR40:** Users can copy any AI-generated output to clipboard with a single click
- **FR41:** System provides visual feedback when AI output is copied

### Form Autofill

- **FR42:** Users can autofill application form fields with their profile data
- **FR42a:** System displays detected form fields in sidebar before autofill execution
- **FR42b:** Users can review which fields will be filled before triggering autofill
- **FR43:** System maps user data to appropriate form fields automatically
- **FR44:** System highlights fields that were autofilled
- **FR44a:** System shows visual tick-off state in sidebar for successfully filled fields
- **FR45:** Users can undo the last autofill action
- **FR46:** Autofill includes resume upload when a file upload field is detected
- **FR47:** Autofill includes generated cover letter when available

### Job Tracking

- **FR48:** Users can save a job from the extension via a dedicated "Save Job" button
- **FR49:** System automatically sets job status to "Applied" when saving from extension
- **FR50:** Users can view their list of saved/tracked jobs in the dashboard
- **FR51:** Users can update the status of a tracked job (applied, interviewed, offer, rejected)
- **FR52:** Users can view details of a saved job
- **FR53:** Users can delete a job from their tracked list
- **FR54:** Users can add notes to a saved job
- **FR55:** Users can edit notes on a saved job
- **FR56:** Users can view notes when reviewing a saved job

### Usage & Subscription Management

- **FR57:** Users can view their current AI generation balance
- **FR58:** Users can view their remaining auto match analyses for the day (free tier only)
- **FR59:** Users can view their account tier status (Free Tier in MVP)
- **FR60:** Users receive 5 free AI generations on signup (lifetime)
- **FR60a:** Free tier users receive 20 auto match analyses per day (resets at midnight UTC, backend configurable)
- **FR60b:** Paid tier users receive unlimited auto match analyses
- **FR61:** Users can upgrade to a paid subscription tier (Post-MVP)
- **FR62:** Users can manage their subscription (upgrade, downgrade, cancel) (Post-MVP)
- **FR63:** Users earn additional free generations through referrals
- **FR64:** System blocks paid AI generation features (detailed match, cover letter, outreach, chat) when user has no remaining balance
- **FR65:** System displays "upgrade coming soon" message when user is out of paid credits
- **FR66:** System blocks auto match analysis when free tier user exceeds daily limit (20/day)

### Extension Sidebar Experience

- **FR67:** Users can open the extension sidebar from any webpage
- **FR68:** Users can close the extension sidebar
- **FR69:** Sidebar displays one of four states: Logged Out (sign-in only), Non-Job Page (resume tray enabled, AI disabled), Job Page (auto-scan with instant match, AI locked), Application Page (full features)
- **FR69a:** AI Studio tools (detailed match, cover letter, outreach, chat) unlock only when user is on a job application page
- **FR69b:** Autofill functionality enables only when user is on a job application page
- **FR70:** Sidebar displays resume tray for resume access when user is authenticated
- **FR71:** AI Studio tools are locked until user navigates to application page with valid scan data
- **FR72:** Users can navigate to the web dashboard from the sidebar

### Web Dashboard

- **FR73:** Users can access a dedicated jobs management page
- **FR74:** Users can access a dedicated resume management page
- **FR75:** Users can access an account management page
- **FR76:** Users can access a data and privacy controls page
- **FR77:** Dashboard displays user's current usage and subscription status

### Data Privacy & Controls

- **FR78:** Users can view explanation of what data is stored and where
- **FR79:** Users can initiate complete data deletion with confirmation
- **FR80:** Data deletion requires email confirmation for security
- **FR81:** System clears local extension data on logout
- **FR82:** AI-generated outputs are never persisted to backend storage

### User Feedback

- **FR83:** Users can submit feedback about the product via in-app feedback form (accessible from sidebar and dashboard)
- **FR83a:** Feedback form supports categorization: bug report, feature request, general feedback
- **FR84:** System captures feedback with context: current page URL, sidebar state, last action performed, browser version
- **FR84a:** Users can optionally attach a screenshot with their feedback
- **FR85:** Backend stores user feedback with timestamp, user ID, category, context, and optional screenshot reference

## Non-Functional Requirements

### Performance

**Response Time Requirements:**

- **NFR1:** Page scan completes within 2 seconds on standard job boards
- **NFR2:** AI generation (cover letter, outreach, chat messages) completes within 5 seconds
- **NFR3a:** Auto match analysis completes within 2 seconds of successful scan
- **NFR3b:** Detailed match analysis completes within 5 seconds of user request
- **NFR4:** Autofill executes within 1 second
- **NFR5:** Sidebar opens within 500ms of user click
- **NFR6:** Resume parsing completes within 10 seconds of upload

**Accuracy Requirements:**

- **NFR7:** Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- **NFR8:** Fallback AI scan succeeds on 85%+ of unknown job sites
- **NFR9:** Autofill correctly maps 90%+ of standard form fields

### Security

**Data Protection:**

- **NFR10:** All data transmitted between extension and API is encrypted using industry-standard transport security protocols
- **NFR11:** All data stored in database is encrypted at rest
- **NFR12:** Resume files are stored in encrypted file storage
- **NFR13:** OAuth tokens are stored securely (not in plaintext)
- **NFR14:** AI-generated outputs are never persisted to backend storage

**Access Control:**

- **NFR15:** Users can only access their own data (row-level security)
- **NFR16:** API endpoints require valid authentication
- **NFR17:** Session tokens expire after reasonable inactivity period

**Privacy Compliance:**

- **NFR18:** System supports GDPR right-to-deletion requests
- **NFR19:** System supports CCPA data access requests
- **NFR20:** User consent is obtained before data collection

### Reliability

**Availability:**

- **NFR21:** Backend API maintains 99.9% uptime (excluding planned maintenance)
- **NFR22:** Extension functions offline for cached data (resume selection, local state)
- **NFR23:** AI provider failures are handled gracefully with user notification

**Error Handling:**

- **NFR24:** AI generation failures do not decrement user's usage balance
- **NFR25:** Scan failures display partial results with clear error indication
- **NFR26:** Network errors provide clear, actionable user feedback

### Scalability (Post-MVP)

**Capacity Planning (Post-MVP Targets):**

- **NFR27:** System supports 50,000 monthly active users at 3 months post-launch (Post-MVP)
- **NFR28:** System supports 150,000 monthly active users at 12 months post-launch (Post-MVP)
- **NFR29:** Architecture supports scaling to handle increased concurrent user load without code changes (Post-MVP)

### Integration

**External Services:**

- **NFR30:** System maintains compatibility with Chrome Manifest V3 requirements
- **NFR31:** AI provider abstraction allows switching between Claude and GPT
- **NFR32:** Backend service handles auth, database, and storage operations
- **NFR33:** Payment processing system handles subscription lifecycle events (Post-MVP)

**Browser Compatibility:**

- **NFR34:** Extension functions on Chrome version 88+ (Manifest V3 baseline)
- **NFR35:** Dashboard supports modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

### Maintainability

**Code Quality:**

- **NFR36:** Codebase supports LLM-assisted development with clear module boundaries
- **NFR37:** API contract enables independent frontend/backend development
- **NFR38:** Each app (api, web, extension) is independently deployable

**Testing (MVP):**

- **NFR39:** Minimal automated testing acceptable for MVP
- **NFR40:** Production code must be thorough with comprehensive error handling
- **NFR41:** Backend API must handle all edge cases and failure scenarios

**Logging & Observability (MVP):**

- **NFR42:** Backend API includes comprehensive application logging
- **NFR43:** Logs viewable directly on Railway dashboard (no streaming required for MVP)
- **NFR44:** Log levels: ERROR, WARN, INFO for key operations

