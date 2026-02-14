---
stepsCompleted: [1]
inputDocuments:
  - _bmad-output/planning-artifacts/prd/ (sharded, 13 files)
  - _bmad-output/planning-artifacts/architecture/ (sharded, 9 files)
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/epics/ (existing stories, 29 files)
---

# Jobswyft - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Jobswyft, decomposing the requirements from the PRD, Architecture, and UX Design Specification into implementable stories with validated acceptance criteria. This is a rewrite incorporating all Revision 2 architectural decisions, Admin Dashboard coverage, and corrected FR/NFR mappings.

## Requirements Inventory

### Functional Requirements

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

**Job Page Scanning (14):**
- FR14: System automatically scans job posting pages when detected via URL pattern matching
- FR14a: System detects job pages using configurable URL patterns for major job boards
- FR14b: Users can manually enter job details when automatic detection fails, including pasting a full job description for AI analysis
- FR14c: System can extract job data from job boards not in its preconfigured support list using AI-powered fallback analysis
- FR15: System extracts job title from job posting pages
- FR16: System extracts company name from job posting pages
- FR17: System extracts full job description from job posting pages
- FR18: System extracts optional fields (location, salary, employment type) when available
- FR19: System extracts application questions ephemerally when present on the page (not persisted to database)
- FR20: Users can manually correct extracted fields using an element picker
- FR21: Users can manually edit any extracted field directly
- FR22: System indicates which required fields are missing after a scan
- FR22a: System indicates extraction confidence level to the user, distinguishing high-confidence extractions from partial or uncertain results
- FR22b: System adapts extraction and autofill behavior based on detected application tracking system (ATS) platform

**Quick Match Analysis (5):**
- FR23: System automatically generates high-level match analysis upon successful job scan
- FR23a: Auto match analysis is free for all users with rate limits: 20 per day for free tier, unlimited for paid tiers
- FR23b: Auto match displays match score (0-100%), skills strengths as green visual indicators, skill gaps as yellow visual indicators
- FR23c: Auto match layout presents strengths and gaps side-by-side within job card
- FR23d: Job Details Card displays two action buttons: "Deep Analysis" (navigates to Match tool for detailed analysis) and "Ask Coach" (navigates to Coach tab)

**Detailed Match (2):**
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

**Coach — Conversational AI Chat (10):**
- FR37a: Users can access Coach as a sub-tab within AI Studio (alongside Match, Cover Letter, and Outreach) — Coach is the primary chat interface for conversational AI interactions
- FR37b: Coach provides conversational AI responses personalized to the user's active resume and current scanned job
- FR37c: Coach can advise on application strategy, interview preparation, and skill gap analysis for the current role
- FR37d: Coach conversations cost 1 AI credit per message
- FR37e: Coach conversation resets when user switches to a different job (new job = new coaching context)
- FR37f: Coach presents selectable skill categories as conversation entry points (e.g., "Interview Prep", "Application Strategy", "Company Insights", "General Advice"); selecting a skill initiates a focused chat session
- FR37f-i: System generates contextual skill suggestions based on match analysis results (e.g., if gaps are detected, "Address Kubernetes Gap" appears as a suggested skill)
- FR37f-ii: Users can also start a free-form chat without selecting a predefined skill category
- FR37g: Coach displays conversation history within the current session
- FR37h: Users can start a new Coach conversation to clear history

**Model Selection (3):**
- FR38a: Users can select which AI model to use for any paid AI generation request
- FR38b: System displays per-operation cost (based on selected model) before generation execution
- FR38c: System charges credits based on the selected model's pricing multiplier

**Common AI Capabilities (7):**
- FR38: Users can edit any AI-generated output before using it
- FR39: AI outputs and extracted application questions are ephemeral and not stored on the server
- FR40: Users can copy any AI-generated output to clipboard with a single click
- FR40a: System ensures all AI-generated content is grounded in the user's actual resume data — no fabrication of experience, skills, or qualifications
- FR40b: Match analysis transparently surfaces skill gaps rather than hiding or minimizing them
- FR40c: Coach provides honest, grounded advice based on actual resume-job fit analysis
- FR41: System provides visual feedback when AI output is copied

**Form Autofill (9):**
- FR42: Users can autofill application form fields with their profile data
- FR42a: System displays detected form fields in sidebar before autofill execution
- FR42b: Users can review which fields will be filled before triggering autofill
- FR43: System maps user data to appropriate form fields automatically
- FR44: System highlights fields that were autofilled
- FR44a: System shows visual tick-off state in sidebar for successfully filled fields
- FR45: Users can undo the last autofill action; undo persists with no timeout and is removed only on page refresh or DOM field change
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

**Usage & Subscription Management (15):**
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
- FR66a: System supports configurable token-to-credit conversion ratios for flexible pricing (Post-MVP)
- FR66b: System applies per-model credit multipliers so different AI models consume credits at different rates (Post-MVP)
- FR66c: System calculates credit cost for Coach conversations based on actual token consumption (Post-MVP)

**Extension Sidebar Experience (14):**
- FR67: Users can open the extension sidebar (Chrome Side Panel) from any webpage
- FR67a: Sidebar navigation uses a 3-tab structure: Scan | AI Studio | Autofill
- FR67b: AI Studio contains 4 sub-tabs: Match | Cover Letter | Outreach | Coach
- FR68: Users can close the extension sidebar
- FR69: Sidebar displays one of three states: Logged Out (sign-in only), Non-Job Page (resume tray + dashboard link), Job Detected = Full Power (all features unlocked)
- FR69a: AI Studio tools (detailed match, cover letter, outreach, coach) unlock when a job is detected AND user has available credits
- FR69b: Autofill functionality enables only when user is on a page with form fields (application page)
- FR70: Sidebar displays resume tray for resume access when user is authenticated
- FR71: All AI Studio tools (including Coach) are available when a job is detected and user has available credits
- FR72: Users can navigate to the web dashboard from the sidebar
- FR72a: When user navigates to a new job page, sidebar resets job data, match data, and chat history while preserving resume selection, auth session, and credits
- FR72b: When user navigates to a non-job page, sidebar preserves the last job context
- FR72c: Users can manually reset job context via a reset button in the sidebar header
- FR72d: Sidebar tab switching preserves state within each tab

**Web Dashboard — User-Facing (5):**
- FR73: Users can access a dedicated jobs management page
- FR74: Users can access a dedicated resume management page
- FR75: Users can access an account management page
- FR76: Users can access a data and privacy controls page
- FR77: Dashboard displays user's current usage and subscription status

**Admin Dashboard (7):**
- FR86: Admin users can access the admin dashboard via a separate auth gate (Supabase admin role required)
- FR87: Admin users can view and search user accounts with engagement metrics
- FR88: Admin users can configure tier definitions (names, generation limits, auto match limits, pricing, feature flags)
- FR89: Admin users can view platform usage analytics (installs, scans, generations, conversion funnel)
- FR90: Admin users can review, categorize, and tag user feedback submissions
- FR91: Admin users can manage system-wide configuration settings (rate limits, model pricing, global parameters)
- FR92: Admin users can assign or revoke admin roles for other users

**Backend Configuration System (3):**
- FR93: System stores all tier definitions, rate limits, and model pricing as configurable records in the backend database
- FR94: Configuration changes made via admin dashboard propagate to all surfaces (extension, API, dashboards) without code deploys
- FR95: All surfaces read tier and credit configuration from backend on startup and respond to configuration updates

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

**Totals: 140 FRs across 19 capability areas.**

### NonFunctional Requirements

**Performance — Response Times (9):**
- NFR1: Page scan completes within 2 seconds on standard job boards
- NFR2: AI generation (cover letter, outreach, coach messages) completes within 5 seconds
- NFR3a: Auto match analysis completes within 2 seconds of successful scan
- NFR3b: Detailed match analysis completes within 5 seconds of user request
- NFR4: Autofill executes within 1 second
- NFR5: Sidebar opens within 500ms of user click
- NFR6: Resume parsing completes within 10 seconds of upload
- NFR6a: AI generation endpoints (cover letter, outreach, coach) deliver responses via streaming (Server-Sent Events) with progressive text reveal and a user-accessible cancel option
- NFR6b: Match analysis and resume parsing return complete JSON responses (non-streaming)

**Performance — Accuracy (3):**
- NFR7: Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- NFR8: Fallback AI scan succeeds on 85%+ of unknown job sites
- NFR9: Autofill correctly maps 90%+ of standard form fields

**Performance — Rate Limiting UX (1):**
- NFR52: API rate limiting returns clear error responses with rate limit status and retry timing information

**Security — Data Protection (5):**
- NFR10: All data transmitted between extension and API is encrypted using industry-standard transport security protocols
- NFR11: All data stored in database is encrypted at rest
- NFR12: Resume files are stored in encrypted file storage
- NFR13: OAuth tokens are stored securely (not in plaintext)
- NFR14: AI-generated outputs are never persisted to backend storage

**Security — Access Control (5):**
- NFR15: Users can only access their own data (row-level security)
- NFR16: API endpoints require valid authentication
- NFR17: Session tokens expire after reasonable inactivity period
- NFR45: Admin Dashboard requires Supabase admin role for access — separate auth gate from User Dashboard
- NFR46: Admin actions (tier config changes, role assignments) are logged with timestamp and admin user ID

**Privacy Compliance (3):**
- NFR18: System supports GDPR right-to-deletion requests
- NFR19: System supports CCPA data access requests
- NFR20: User consent is obtained before data collection

**Reliability — Availability (3):**
- NFR21: Backend API maintains 99.9% uptime (excluding planned maintenance)
- NFR22: No offline mode; extension displays clear "no connection" state when network is unavailable
- NFR23: AI provider failures are handled gracefully with user notification

**Reliability — Error Handling (3):**
- NFR24: AI generation failures do not decrement user's usage balance
- NFR25: Scan failures display partial results with clear error indication
- NFR26: Network errors provide clear, actionable user feedback

**Reliability — Stability & Sync (3):**
- NFR47: Extension crash rate below 0.1% across supported Chrome versions
- NFR48: OAuth authentication success rate of 99.5%+
- NFR49: Local extension state and backend data maintain 99.9% synchronization reliability

**Scalability — Post-MVP (3):**
- NFR27: System supports 50,000 monthly active users at 3 months post-launch
- NFR28: System supports 150,000 monthly active users at 12 months post-launch
- NFR29: Architecture supports scaling without code changes

**Integration — External Services (4):**
- NFR30: System maintains compatibility with Chrome Manifest V3 requirements
- NFR31: AI provider abstraction allows switching between Claude and GPT
- NFR32: Backend service handles auth, database, and storage operations
- NFR33: Payment processing system handles subscription lifecycle events (Post-MVP)

**Integration — Browser Compatibility (2):**
- NFR34: Extension functions on Chrome version 88+ (Manifest V3 baseline)
- NFR35: User Dashboard and Admin Dashboard support modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)

**Integration — Configuration Propagation (2):**
- NFR50: Configuration changes made via Admin Dashboard propagate to all surfaces within 5 minutes without code deploys or restarts
- NFR51: AI provider abstraction supports user-selectable model per request; model switching adds no latency beyond model-specific inference time

**Maintainability (3):**
- NFR36: Codebase supports LLM-assisted development with clear module boundaries
- NFR37: API contract enables independent frontend/backend development
- NFR38: Each surface (API, User Dashboard, Admin Dashboard, Extension) is independently deployable

**Testing — MVP (3):**
- NFR39: Minimal automated testing acceptable for MVP
- NFR40: Production code must be thorough with comprehensive error handling
- NFR41: Backend API must handle all edge cases and failure scenarios

**Accessibility (5):**
- NFR44a: Extension and dashboards target WCAG 2.1 AA compliance for color contrast (4.5:1 normal text, 3:1 large text/UI components), keyboard navigation, and screen reader support
- NFR44b: All interactive elements are reachable via keyboard (Tab, Arrow keys, Enter, Escape)
- NFR44c: All icon-only buttons include descriptive ARIA labels for screen readers
- NFR44d: Color is never the sole indicator of information — always paired with text, icons, or numeric values
- NFR44e: All animations respect the `prefers-reduced-motion` system preference

**Logging & Observability (3):**
- NFR42: Backend API includes comprehensive application logging
- NFR43: Logs viewable directly on Railway dashboard (no streaming required for MVP)
- NFR44: Log levels: ERROR, WARN, INFO for key operations

**Totals: 59 NFRs across 15 quality areas.**

### Additional Requirements

**From Architecture — Starter Stack (Confirmed, Brownfield):**
- Extension: WXT + React 19 + Zustand 5 (MV3, ^0.20.13)
- UI Library: Vite 7 + shadcn/ui 3 + Tailwind 4 + Storybook 10
- API: FastAPI + uv + Supabase (Python 3.11+)
- Web: Next.js (scaffolded, not yet initialized)
- Monorepo: pnpm workspaces

**From Architecture — Engine Package Extraction (ADR-REV-D4):**
- Extract core detection/autofill logic to `packages/engine/` as `@jobswyft/engine`
- Zero Chrome API dependencies enforced at package level
- Hexagonal boundary: pure functional core testable with JSDOM/happy-dom
- Extension becomes thin Chrome adapter layer importing from engine package

**From Architecture — Middleware Extraction Pipeline (ADR-REV-SE5):**
- Koa-style middleware pipeline with shared `DetectionContext`
- Pipeline: BoardDetector → JsonLd → Gate(0.85) → CssSelector → Gate(0.75) → OgMeta → Heuristic → Gate(0.70) → AiFallback → PostProcess
- Inline confidence gates act as circuit breakers
- Site configs can customize layer ordering via `pipelineHints`

**From Architecture — Smart Engine Patterns:**
- ADR-REV-SE1: Hybrid config + confidence escalation for extraction
- ADR-REV-SE2: Weighted multi-signal confidence scoring (Similo-inspired)
- ADR-REV-SE3: Self-healing selectors with fallback chain + heuristic repair
- ADR-REV-SE4: Config-driven site support with JSON configs + custom extractor escape hatches
- ADR-REV-SE6: React controlled form bypass — native property descriptor setter + synthetic events (mandatory)
- ADR-REV-SE7: Shadow DOM traversal — TreeWalker + browser-specific shadow root access
- ADR-REV-SE8: Operation ID (opid) field addressing via `data-jf-opid` attribute

**From Architecture — Extension Patterns:**
- ADR-REV-EX1: Zustand state sync via chrome.storage + typed message commands
- ADR-REV-EX2: DOM readiness via MutationObserver + config hints + idle detection
- ADR-REV-EX3: Element picker — side panel guided, minimal page injection
- ADR-REV-EX4: Correction feedback — local apply + telemetry + auto-propose selectors
- ADR-REV-EX5: Service worker lifecycle — `chrome.alarms` for all periodic tasks, no setTimeout/setInterval
- ADR-REV-EX6: Admin Dashboard — role-based routing in apps/web/ with Next.js route groups

**From Architecture — API & Communication:**
- ADR-REV-A1: Telemetry batch endpoint (`POST /v1/telemetry/batch`, fire-and-forget)
- ADR-REV-A2: Config sync — pull with Supabase Realtime push notification
- ADR-REV-A3: AI fallback — provider abstraction + circuit breaker (N failures in M minutes)
- SSE streaming for generative endpoints (cover letter, outreach, coach) with cancel
- Match analysis and resume parsing return complete JSON (non-streaming)

**From Architecture — Infrastructure:**
- ADR-REV-I1: Config pipeline — git-managed JSON with fast-path override for emergencies
- ADR-REV-I2: Bundled defaults + runtime overlay for extension configs
- ADR-REV-I3: Selector health dashboard + automated alerts
- ADR-REV-I4: Per-surface CI/CD + integration pipeline

**From Architecture — Database Schema:**
- 6 core tables: profiles, resumes, jobs, usage_events, global_config, feedback
- New tables: scan_telemetry (ADR-REV-A1), site_configs (ADR-REV-A2), selector_health (ADR-REV-I3)
- Row-Level Security (RLS) policies required
- Hybrid credit system: daily match allocation + lifetime/monthly AI credits

**From Architecture — Implementation Patterns (PATTERN-SE1 through SE10):**
- Site config naming: `{domain}.json` in `configs/sites/`
- Extension messages: dot-namespaced discriminated unions (`scan.trigger`, `autofill.start`)
- Selector registry: static config (synced) + runtime health (local)
- Telemetry event envelope: type + version + timestamp + sessionId + payload
- Confidence: 0-1 float internally, 0-100% display only
- Config version: monotonic integer for delta sync
- Extension stores: domain-sliced (`useCoreStore`, `useScanStore`, etc.)
- AsyncState<T>: discriminated union for all async operations
- Native setter pattern: mandatory for all form field writes
- opid addressing: mandatory for all field detection/fill

**From UX Design — Visual Design:**
- OKLCH semantic token system with functional area colors (scan/studio/autofill/coach)
- Gradient depth buttons per functional area (`.btn-gradient-depth-{area}`)
- Two-tone card pattern with accent-tinted sections
- Animated SVG match score + count-up (framer-motion, dynamic import)
- Sequential autofill animation (600ms stagger per field)
- Dashed border empty states for incomplete/missing items
- Credit lock pattern with blurred preview + unlock button
- Shell layout contract: header (shrink-0) + tabs (shrink-0) + content (flex-1 scroll) + footer (shrink-0)

**From UX Design — Interaction Patterns:**
- 3-state progressive unlock: Logged Out → Non-Job Page → Job Detected = Full Power
- Auto-scan on URL change (zero clicks)
- Three-tier error escalation: inline retry → section degraded → full re-auth
- Loading states by duration: <500ms none, 500ms-2s skeleton, 2s-10s animated progress, >10s streaming
- Tab state preservation within session
- Job switch resets: job + match + AI Studio + Coach chat; preserves resume + auth + credits

**From UX Design — Accessibility:**
- WCAG 2.1 AA target
- Semantic HTML structure (aside > header + nav + main + footer)
- ARIA patterns per component (live regions, role="img" for scores, role="alert" for errors)
- Reduced motion: CSS custom property + Framer Motion useReducedMotion()
- Minimum 32px touch targets for icon buttons, 40px for primary buttons
- axe-core via @storybook/addon-a11y in CI

### FR Coverage Map

{{requirements_coverage_map}}

## Epic List

{{epics_list}}
