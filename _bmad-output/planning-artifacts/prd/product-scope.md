# Product Scope

## MVP — Minimum Viable Product

**Core Extension (Must Ship):**

- Google OAuth authentication
- Resume upload + AI parsing (up to 5 resumes)
- Active resume selection
- Scan Page (hybrid: rules + AI fallback)
- **Job Details Card** with quick match analysis (GPT-4.0 → Claude fallback, <2s)
  - Two action buttons: **Deep Analysis** → Match sub-tab, **Ask Coach** → Coach sub-tab
- 4 AI Studio sub-tabs: **Match** (detailed analysis), **Cover Letter**, **Outreach**, **Coach** (skills UI + free-form chat)
- Model selection per request (user chooses AI model, differential pricing)
- Autofill with **persistent undo** (no timeout; removed only on page refresh or DOM field change)
- Usage balance display (config-driven from backend)
- Free tier with backend-configurable limits

**Sidebar State Model (Simplified, 3 states):**

1. **Logged Out** — Sign-in only
2. **Non-Job Page** — Resume tray, dashboard link
3. **Job Detected = Full Power** — All features unlocked (scan, quick match, AI Studio with Coach, autofill)

**Sidebar Tab Structure:** 3 main tabs (Scan | AI Studio | Autofill). Coach is inside AI Studio as the 4th sub-tab.

**Core User Dashboard (Must Ship — Vercel, Next.js):**

- Jobs list with status tracking
- Resume management (view/upload/delete)
- Account management (profile, tier status)
- Data & privacy controls with delete flow
- Feedback capture

**Core Admin Dashboard (Must Ship — Vercel, Next.js):**

- Admin role management via Supabase
- Tier configuration management (names, limits, pricing, features)
- User management / overview
- Usage analytics
- System configuration controls
- Feedback review

**Backend Configuration System:**

- Tier definitions stored in database (name, generation limits, auto match limits, pricing, features)
- Changes propagate to extension + API + all dashboards
- All tier logic reads from config (no hardcoded tier values)
- Model pricing configuration (per-model cost multipliers)
- Global configuration table for system-wide settings

**Feedback System (MVP — Basic):**

- Page support requests
- Page/extraction/autofill not working reports
- AI output satisfaction (good/bad)
- Feature-specific feedback opportunities

**MVP Monetization:** Free tier only. All users = "free." Paid tier infrastructure ready but not activated.

**Planned Pricing Tiers (Post-MVP, Config-Driven):**

Tier names, limits, and pricing stored in database. Example configuration:

| Tier | Price | Generations/Month | Notes |
|------|-------|-------------------|-------|
| Free | $0 | Configurable (default: 5) | +bonus per referral |
| Tier 2 | TBD | TBD | Names finalized later |
| Tier 3 | TBD | TBD | Names finalized later |
| Tier 4 | TBD | TBD | Names finalized later |

Auto matches counted separately from AI generations. Both limits configurable per tier.

## Growth Features (Post-MVP)

**Phase 2 — Power Features (Months 2-4):**

- Subscription & billing activation (Stripe integration)
- Paid tier configuration and launch
- Browser support expansion (Firefox, Edge)
- Bulk application mode (queue multiple jobs)
- Application templates (save/reuse customizations)
- Enhanced job board integrations (LinkedIn Easy Apply, Indeed)
- Chrome extension keyboard shortcuts

**Phase 3 — Intelligence Layer (Months 4-6):**

- Smart job recommendations based on resume
- Application success tracking (got interview? got offer?)
- AI-powered resume suggestions
- Company research integration
- Salary insights

**Phase 4 — Network Effects (Months 6-9):**

- Team/enterprise accounts
- Recruiter/coach mode
- Public API for integrations
- White-label partnerships

## Vision (Future)

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

**Vision Statement:** Jobswyft becomes the AI-powered career platform that doesn't just help you apply — it helps you land your dream job and grow your career.
