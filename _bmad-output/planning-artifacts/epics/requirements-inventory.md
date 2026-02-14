# Requirements Inventory

## Functional Requirements

**Authentication & Account Management (6):**
- FR1: Users can sign in using Google OAuth
- FR2: Users can sign out from the extension
- FR3: Users can sign out from the dashboard
- FR4: System maintains authentication state across browser sessions
- FR5: Users can view their account profile information
- FR6: Users can delete their entire account and all associated data

**Resume Management (10):**
- FR7: Users can upload resume files (PDF format)
- FR8: System uses AI to parse uploaded resumes and extract structured data (skills, experience, education, contact information)
- FR9: Users can store up to 5 resumes in their account
- FR10: Users can select one resume as their active resume
- FR11: Users can view their list of uploaded resumes
- FR12: Users can delete individual resumes
- FR13: Users can switch between resumes when applying to jobs
- FR13a: Users can view parsed resume content organized in expandable block sections
- FR13b: Users can expand individual resume blocks to view full content (skills, experience, education, etc.)
- FR13c: Users can copy resume block content to clipboard with single click

**Job Page Scanning (11):**
- FR14: System automatically scans job posting pages when detected via URL pattern matching
- FR14a: System detects job pages using configurable URL patterns for major job boards
- FR14b: Users can manually enter job details when automatic detection fails, including pasting a full job description for AI analysis
- FR15: System extracts job title from job posting pages
- FR16: System extracts company name from job posting pages
- FR17: System extracts full job description from job posting pages
- FR18: System extracts optional fields (location, salary, employment type) when available
- FR19: System extracts application questions ephemerally when present on the page (not persisted to database)
- FR20: Users can manually correct extracted fields using an element picker
- FR21: Users can manually edit any extracted field directly
- FR22: System indicates which required fields are missing after a scan

**Match Analysis (6):**
- FR23: System automatically generates high-level match analysis upon successful job scan
- FR23a: Auto match analysis is free for all users with rate limits: 20 per day for free tier, unlimited for paid tiers
- FR23b: Auto match displays match score (0-100%), skills strengths as green visual indicators, skill gaps as yellow visual indicators
- FR23c: Auto match layout presents strengths and gaps side-by-side within job card
- FR24: Users can trigger detailed match analysis (costs 1 AI credit)
- FR25: Detailed match analysis provides comprehensive strengths, gaps, and recommendations beyond high-level view

**Cover Letter (6):**
- FR26: Users can generate a tailored cover letter
- FR26a: Users can select a length for cover letter generation (e.g., brief, standard, detailed)
- FR27: Users can select a tone for cover letter generation (e.g., confident, friendly, enthusiastic)
- FR28: Users can provide custom instructions for cover letter generation
- FR29: Users can regenerate cover letter with feedback on what to change
- FR30: Users can export generated cover letters as PDF

**Outreach Messages (5):**
- FR36: Users can generate outreach messages for recruiters/hiring managers
- FR36a: Users can select a tone for outreach message generation
- FR36b: Users can select a length for outreach message generation (e.g., brief, standard)
- FR36c: Users can provide custom instructions for outreach message generation
- FR37: Users can regenerate outreach messages with feedback on what to change

**Coach — Conversational AI Chat (AI Studio Sub-Tab) (10):**
- FR37a: Users can access Coach as an AI Studio sub-tab (alongside Match, Cover Letter, and Outreach) — Coach is the primary chat interface for conversational AI interactions
- FR37b: Coach provides conversational AI responses personalized to the user's active resume and current scanned job
- FR37c: Coach can advise on application strategy, interview preparation, and skill gap analysis for the current role
- FR37d: Coach conversations cost 1 AI credit per message
- FR37e: Coach conversation resets when user switches to a different job (new job = new coaching context)
- FR37f: Coach presents selectable skill categories as conversation entry points (e.g., "Interview Prep", "Application Strategy", "Company Insights", "General Advice"); selecting a skill initiates a focused chat session
- FR37f-i: System generates contextual skill suggestions based on match analysis results (e.g., if gaps are detected, "Address Kubernetes Gap" appears as a suggested skill)
- FR37f-ii: Users can also start a free-form chat without selecting a predefined skill category
- FR37g: Coach displays conversation history within the current session
- FR37h: Users can start a new Coach conversation to clear history

**Common AI Capabilities (4):**
- FR38: Users can edit any AI-generated output before using it
- FR39: AI outputs and extracted application questions are ephemeral and not stored on the server
- FR40: Users can copy any AI-generated output to clipboard with a single click
- FR41: System provides visual feedback when AI output is copied

**Form Autofill (9):**
- FR42: Users can autofill application form fields with their profile data
- FR42a: System displays detected form fields in sidebar before autofill execution
- FR42b: Users can review which fields will be filled before triggering autofill
- FR43: System maps user data to appropriate form fields automatically
- FR44: System highlights fields that were autofilled
- FR44a: System shows visual tick-off state in sidebar for successfully filled fields
- FR45: Users can undo the last autofill action
- FR46: Autofill includes resume upload when a file upload field is detected
- FR47: Autofill includes generated cover letter when available

**Job Tracking (9):**
- FR48: Users can save a job from the extension via a dedicated "Save Job" button
- FR49: System automatically sets job status to "Applied" when saving from extension
- FR50: Users can view their list of saved/tracked jobs in the dashboard
- FR51: Users can update the status of a tracked job (applied, interviewed, offer, rejected)
- FR52: Users can view details of a saved job
- FR53: Users can delete a job from their tracked list
- FR54: Users can add notes to a saved job
- FR55: Users can edit notes on a saved job
- FR56: Users can view notes when reviewing a saved job

**Usage & Subscription Management (12):**
- FR57: Users can view their current AI generation balance
- FR58: Users can view their remaining auto match analyses for the day (free tier only)
- FR59: Users can view their account tier status (Free Tier in MVP)
- FR60: Users receive 5 free AI generations on signup (lifetime)
- FR60a: Free tier users receive 20 auto match analyses per day (resets at midnight UTC, backend configurable)
- FR60b: Paid tier users receive unlimited auto match analyses
- FR61: Users can upgrade to a paid subscription tier (Post-MVP)
- FR62: Users can manage their subscription (upgrade, downgrade, cancel) (Post-MVP)
- FR63: Users earn additional free generations through referrals
- FR64: System blocks paid AI generation features (detailed match, cover letter, outreach, coach) when user has no remaining balance
- FR65: System displays "upgrade coming soon" message when user is out of paid credits
- FR66: System blocks auto match analysis when free tier user exceeds daily limit (20/day)

**Extension Sidebar Experience (14):**
- FR67: Users can open the extension sidebar (Chrome Side Panel) from any webpage
- FR67a: Sidebar navigation uses a 3-tab structure: Scan | AI Studio | Autofill
- FR67b: AI Studio contains 4 sub-tabs: Match | Cover Letter | Outreach | Coach
- FR68: Users can close the extension sidebar
- FR69: Sidebar displays one of three states: Logged Out (sign-in only), Non-Job Page (resume tray + dashboard link), Job Detected = Full Power (all features unlocked: scan results, quick match, AI Studio with Coach, autofill)
- FR69a: AI Studio tools (detailed match, cover letter, outreach, coach) unlock when a job is detected AND user has available credits
- FR69b: Autofill functionality enables only when user is on a page with form fields (application page)
- FR70: Sidebar displays resume tray for resume access when user is authenticated
- FR71: All AI Studio tools (including Coach) are locked until a job is scanned and user has available credits
- FR72: Users can navigate to the web dashboard from the sidebar
- FR72a: When user navigates to a new job page, sidebar resets job data, match data, and Coach chat history while preserving resume selection, auth session, and credits
- FR72b: When user navigates to a non-job page, sidebar preserves the last job context (user can continue working with previous job data)
- FR72c: Users can manually reset job context via a reset button in the sidebar header (clears job, match, AI Studio outputs including Coach chat; preserves resume, auth, credits)
- FR72d: Sidebar tab switching preserves state within each tab (switching Scan → AI Studio → Scan does not re-trigger scan; switching between AI Studio sub-tabs preserves each sub-tab's state)

**Web Dashboard (5):**
- FR73: Users can access a dedicated jobs management page
- FR74: Users can access a dedicated resume management page
- FR75: Users can access an account management page
- FR76: Users can access a data and privacy controls page
- FR77: Dashboard displays user's current usage and subscription status

**Data Privacy & Controls (5):**
- FR78: Users can view explanation of what data is stored and where
- FR79: Users can initiate complete data deletion with confirmation
- FR80: Data deletion requires email confirmation for security
- FR81: System clears local extension data on logout
- FR82: AI-generated outputs are never persisted to backend storage

**User Feedback (5):**
- FR83: Users can submit feedback about the product via in-app feedback form (accessible from sidebar and dashboard)
- FR83a: Feedback form supports categorization: bug report, feature request, general feedback
- FR84: System captures feedback with context: current page URL, sidebar state, last action performed, browser version
- FR84a: Users can optionally attach a screenshot with their feedback
- FR85: Backend stores user feedback with timestamp, user ID, category, context, and optional screenshot reference

## NonFunctional Requirements

**Performance - Response Times (7):**
- NFR1: Page scan completes within 2 seconds on standard job boards
- NFR2: AI generation (cover letter, outreach, coach messages) completes within 5 seconds
- NFR3a: Auto match analysis completes within 2 seconds of successful scan
- NFR3b: Detailed match analysis completes within 5 seconds of user request
- NFR4: Autofill executes within 1 second
- NFR5: Sidebar opens within 500ms of user click
- NFR6: Resume parsing completes within 10 seconds of upload
- NFR6a: AI generation endpoints (cover letter, outreach, coach) deliver responses via streaming (Server-Sent Events) with progressive text reveal and a user-accessible cancel option
- NFR6b: Match analysis and resume parsing return complete JSON responses (non-streaming)

**Performance - Accuracy (3):**
- NFR7: Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- NFR8: Fallback AI scan succeeds on 85%+ of unknown job sites
- NFR9: Autofill correctly maps 90%+ of standard form fields

**Security - Data Protection (5):**
- NFR10: All data transmitted between extension and API is encrypted using industry-standard transport security protocols
- NFR11: All data stored in database is encrypted at rest
- NFR12: Resume files are stored in encrypted file storage
- NFR13: OAuth tokens are stored securely (not in plaintext)
- NFR14: AI-generated outputs are never persisted to backend storage

**Security - Access Control (3):**
- NFR15: Users can only access their own data (row-level security)
- NFR16: API endpoints require valid authentication
- NFR17: Session tokens expire after reasonable inactivity period

**Privacy Compliance (3):**
- NFR18: System supports GDPR right-to-deletion requests
- NFR19: System supports CCPA data access requests
- NFR20: User consent is obtained before data collection

**Reliability (6):**
- NFR21: Backend API maintains 99.9% uptime (excluding planned maintenance)
- NFR22: No offline mode; extension displays clear "no connection" state when network is unavailable. All AI and data features require an active network connection.
- NFR23: AI provider failures are handled gracefully with user notification
- NFR24: AI generation failures do not decrement user's usage balance
- NFR25: Scan failures display partial results with clear error indication
- NFR26: Network errors provide clear, actionable user feedback

**Scalability - Post-MVP (3):**
- NFR27: System supports 50,000 monthly active users at 3 months post-launch (Post-MVP)
- NFR28: System supports 150,000 monthly active users at 12 months post-launch (Post-MVP)
- NFR29: Architecture supports scaling to handle increased concurrent user load without code changes (Post-MVP)

**Integration (4):**
- NFR30: System maintains compatibility with Chrome Manifest V3 requirements
- NFR31: AI provider abstraction allows switching between Claude and GPT
- NFR32: Backend service handles auth, database, and storage operations
- NFR33: Payment processing system handles subscription lifecycle events (Post-MVP)

**Browser Compatibility (2):**
- NFR34: Extension functions on Chrome version 88+ (Manifest V3 baseline)
- NFR35: Dashboard supports modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

**Maintainability (3):**
- NFR36: Codebase supports LLM-assisted development with clear module boundaries
- NFR37: API contract enables independent frontend/backend development
- NFR38: Each app (api, web, extension) is independently deployable

**Testing - MVP (3):**
- NFR39: Minimal automated testing acceptable for MVP
- NFR40: Production code must be thorough with comprehensive error handling
- NFR41: Backend API must handle all edge cases and failure scenarios

**Accessibility (5):**
- NFR44a: Extension and dashboard target WCAG 2.1 AA compliance for color contrast (4.5:1 normal text, 3:1 large text/UI components), keyboard navigation, and screen reader support
- NFR44b: All interactive elements are reachable via keyboard (Tab, Arrow keys, Enter, Escape)
- NFR44c: All icon-only buttons include descriptive ARIA labels for screen readers
- NFR44d: Color is never the sole indicator of information — always paired with text, icons, or numeric values
- NFR44e: All animations respect the `prefers-reduced-motion` system preference; users who enable reduced motion see instant state changes instead of animated transitions

**Logging & Observability (3):**
- NFR42: Backend API includes comprehensive application logging
- NFR43: Logs viewable directly on Railway dashboard (no streaming required for MVP)
- NFR44: Log levels: ERROR, WARN, INFO for key operations

## Additional Requirements

**From Architecture - Starter Templates:**
- Architecture specifies starter templates for project initialization:
  - Extension: `pnpm dlx wxt@latest init apps/extension --template react`
  - Web: `pnpm dlx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - API: `cd apps/api && uv init --name jobswyft-api`

**From Architecture - Monorepo Structure:**
- pnpm workspaces for TypeScript packages
- uv for Python (API)
- Package initialization order: ui → apps (extension, web)

**From Architecture - Shared Packages:**
- `packages/ui`: Shared component library with Storybook, Tailwind v4, design tokens in globals.css
- `packages/types`: Shared TypeScript types, generated from OpenAPI

**From Architecture - Database Schema:**
- 6 tables: profiles, resumes, jobs, usage_events, global_config, feedback
- Row-Level Security (RLS) policies required
- Supabase migrations in `supabase/migrations/`

**From Architecture - API Design:**
- OpenAPI spec at `specs/openapi.yaml` (source of truth)
- API versioning with `/v1/` prefix
- Response envelope pattern: `{ success: true, data: {...} }` or `{ success: false, error: {...} }`
- 11 standardized error codes
- snake_case JSON → camelCase TypeScript transformation at client boundary

**From Architecture - AI Provider:**
- Claude 3.5 Sonnet as primary, GPT-4o-mini as fallback
- Provider interface for abstraction/switching
- User preference stored in profiles.preferred_ai_provider
- Fallback configurable via global_config
- SSE streaming for generative endpoints (cover letter, outreach, coach) with cancel option
- Match analysis and resume parsing return complete JSON (non-streaming)

**From Architecture - UI Package:**
- @jobswyft/ui shared component library (shadcn/ui + Tailwind v4 + Storybook 10)
- OKLCH color space for design tokens in globals.css (single source of truth)
- Dark mode via .dark class on root element
- Vite 7.x for library build
- Consumer pattern: import '@jobswyft/ui/styles' + component imports

**From Architecture - Extension:**
- Chrome Manifest V3 (service workers, chrome.storage)
- Chrome Side Panel API for persistent sidebar alongside job boards (NOT content script Shadow DOM)
- Zustand stores per domain (auth, resume, job, scan)
- Chrome permissions: sidePanel, activeTab, scripting, storage, tabs, identity, host_permissions
- 3-state sidebar model (Logged Out, Non-Job Page, Job Detected = Full Power)
- Sidebar tabs: 3 main (Scan | AI Studio | Autofill) + AI Studio has 4 sub-tabs (Match | Cover Letter | Outreach | Coach)
- State preservation rules per event (tab switch, job URL change, manual reset, re-login)

**From Architecture - Deployment:**
- Railway CLI for API deployment
- Vercel CLI for Dashboard deployment
- Supabase CLI for database migrations
- Local unpacked extension for MVP
- No CI/CD pipeline for MVP (CLI direct deploy)

**From Architecture - Implementation Priority:**
- Backend API + Database first
- Dashboard second
- Extension third

**From Architecture - MCP Tooling:**
- Serena: Code exploration, symbol navigation, refactoring
- Supabase MCP: Database operations
- Tavily: Web search for research
- Context7: Latest library documentation

## FR Coverage Map

| FR | Story | Description |
|----|-------|-------------|
| FR1 | EXT.1 (DONE) | Google OAuth sign-in |
| FR2 | EXT.3 | Sign out from extension |
| FR3 | WEB | Sign out from dashboard |
| FR4 | EXT.3 | Session persistence across browser sessions |
| FR5 | WEB | View account profile (Dashboard) |
| FR6 | WEB | Account deletion (Dashboard + API) |
| FR7-FR13c | EXT.4 | Resume upload, parse, view, select, blocks, copy |
| FR14-FR19, FR21-FR22 | EXT.5 | Auto-scan, extraction, manual entry fallback, missing fields |
| FR20 | POST-MVP | Element picker for manual field correction (deferred) |
| FR23-FR25 | EXT.6 | Auto match, detailed match analysis |
| FR26-FR30 | EXT.7 | Cover letter: generate, tone, length, instructions, regenerate, PDF |
| FR36-FR37, FR36a-c | EXT.7 | Outreach: generate, tone, length, instructions, regenerate |
| FR37a-FR37h, FR37f-i, FR37f-ii | EXT.12 + API.2 + API.4 | Coach (AI Studio sub-tab): UI (EXT.12), chat endpoint (API.2), prompt templates (API.4) |
| FR38-FR41 | EXT.7, EXT.12 | Common AI: edit output, ephemeral, copy, visual feedback |
| FR42-FR47 | EXT.9 | Autofill: preview, fill, undo, resume upload, cover letter |
| FR48-FR49 | EXT.5 | Save job from extension, auto "Applied" status |
| FR50-FR56 | WEB | Job tracking dashboard (Dashboard) |
| FR57-FR60 | EXT.10 | Balance view, tier status, initial credits |
| FR60a-b, FR66 | EXT.10 | Daily auto match limits |
| FR61-FR62 | POST-MVP | Subscription management |
| FR63 | POST-MVP | Referral credits |
| FR64-FR65 | EXT.10 | Credit blocking, upgrade message |
| FR67-FR67b | EXT.3 | Sidebar tabs (3 main + 4 AI Studio sub-tabs including Coach) |
| FR68-FR69b | EXT.3 | Sidebar states (Logged Out, Non-Job Page, Job Detected = Full Power), unlock conditions |
| FR70-FR72 | EXT.3 | Resume tray slot, AI locked state, dashboard link |
| FR72a-FR72d | EXT.3 | State preservation: job switch reset, non-job page persistence, manual reset, tab state |
| FR73-FR77 | WEB | Dashboard pages |
| FR78-FR82 | WEB | Privacy, data controls |
| FR83-FR84a | EXT.11 | Feedback form in sidebar |
| FR85 | WEB | Backend feedback storage (API exists) |
| NFR6a | API.1, API.6 | SSE streaming infrastructure + endpoint migration |
| NFR6b | API.3 | Match/resume parsing stay JSON (non-streaming) |
| MATCH-01 | API.3 | Match type param (auto vs detailed) |
| MATCH-02 | API.3 | Daily auto-match rate limiting (20/day free tier) |
| CHAT-01 | API.2 | Build `POST /v1/ai/chat` endpoint (serves Coach) |
| CHAT-02 | API.2 | Coach/chat AI prompt template |
| COACH-01 | API.4 | Coach AI prompt template (strategic/advisory, skill-based) |
| COACH-02 | API.4 | Match-analysis-based coaching prompt generation |
| AI-01 | API.5 | Remove `/v1/ai/answer` dead endpoint |

**FR coverage updated for Coach ↔ Chat merge (v2.1). FR31-35 removed (absorbed into Coach FR37a-h). Backend tech debt mapped to Epic API.**

---
