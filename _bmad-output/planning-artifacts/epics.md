---
stepsCompleted: []
inputDocuments:
  - _bmad-output/planning-artifacts/prd/index.md
  - _bmad-output/planning-artifacts/architecture/index.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# jobswyft-docs - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for jobswyft-docs, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & Account Management:**
- FR1: Users can sign in using Google OAuth
- FR2: Users can sign out from the extension
- FR3: Users can sign out from the dashboard
- FR4: System maintains authentication state across browser sessions
- FR5: Users can view their account profile information
- FR6: Users can delete their entire account and all associated data

**Resume Management:**
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

**Job Page Scanning:**
- FR14: System automatically scans job posting pages when detected via URL pattern matching
- FR14a: System detects job pages using configurable URL patterns for major job boards
- FR14b: Users can manually enter job details when automatic detection fails, including pasting a full job description for AI analysis
- FR15: System extracts job title from job posting pages
- FR16: System extracts company name from job posting pages
- FR17: System extracts full job description from job posting pages
- FR18: System extracts optional fields (location, salary, employment type) when available
- FR19: System extracts application questions ephemerally when present on the page (not persisted to database)
- FR20: Users can manually correct extracted fields using an element picker (DEFERRED POST-MVP)
- FR21: Users can manually edit any extracted field directly
- FR22: System indicates which required fields are missing after a scan

**AI Generation Tools:**

*Match Analysis:*
- FR23: System automatically generates high-level match analysis upon successful job scan
- FR23a: Auto match analysis is free for all users with rate limits: 20 per day for free tier, unlimited for paid tiers
- FR23b: Auto match displays match score (0-100%), skills strengths as green visual indicators, skill gaps as yellow visual indicators
- FR23c: Auto match layout presents strengths and gaps side-by-side within job card
- FR24: Users can trigger detailed match analysis (costs 1 AI credit)
- FR25: Detailed match analysis provides comprehensive strengths, gaps, and recommendations beyond high-level view

*Cover Letter:*
- FR26: Users can generate a tailored cover letter
- FR26a: Users can select a length for cover letter generation (e.g., brief, standard, detailed)
- FR27: Users can select a tone for cover letter generation (e.g., confident, friendly, enthusiastic)
- FR28: Users can provide custom instructions for cover letter generation
- FR29: Users can regenerate cover letter with feedback on what to change
- FR30: Users can export generated cover letters as PDF

*Chat:*
- FR31: Users can open chat interface from AI Studio
- FR32: System generates question suggestions based on extracted job posting content
- FR33: Users can ask questions via chat (costs 1 AI credit per message)
- FR34: Chat displays conversation history within current session
- FR35: Users can start new chat session to clear history

*Outreach Messages:*
- FR36: Users can generate outreach messages for recruiters/hiring managers
- FR36a: Users can select a tone for outreach message generation
- FR36b: Users can select a length for outreach message generation (e.g., brief, standard)
- FR36c: Users can provide custom instructions for outreach message generation
- FR37: Users can regenerate outreach messages with feedback on what to change

*Coach (Standalone Tab):*
- FR37a: Users can access Coach as a standalone sidebar tab (separate from AI Studio)
- FR37b: Coach provides conversational AI coaching personalized to the user's active resume and current scanned job
- FR37c: Coach can advise on application strategy, interview preparation, and skill gap analysis for the current role
- FR37d: Coach conversations cost 1 AI credit per message
- FR37e: Coach conversation resets when user switches to a different job (new job = new coaching context)
- FR37f: System generates contextual coaching prompts based on match analysis results (e.g., "How do I address the Kubernetes gap?")

*Common AI Capabilities:*
- FR38: Users can edit any AI-generated output before using it
- FR39: AI outputs and extracted application questions are ephemeral and not stored on the server
- FR40: Users can copy any AI-generated output to clipboard with a single click
- FR41: System provides visual feedback when AI output is copied

**Form Autofill:**
- FR42: Users can autofill application form fields with their profile data
- FR42a: System displays detected form fields in sidebar before autofill execution
- FR42b: Users can review which fields will be filled before triggering autofill
- FR43: System maps user data to appropriate form fields automatically
- FR44: System highlights fields that were autofilled
- FR44a: System shows visual tick-off state in sidebar for successfully filled fields
- FR45: Users can undo the last autofill action
- FR46: Autofill includes resume upload when a file upload field is detected
- FR47: Autofill includes generated cover letter when available

**Job Tracking:**
- FR48: Users can save a job from the extension via a dedicated "Save Job" button
- FR49: System automatically sets job status to "Applied" when saving from extension
- FR50: Users can view their list of saved/tracked jobs in the dashboard
- FR51: Users can update the status of a tracked job (applied, interviewed, offer, rejected)
- FR52: Users can view details of a saved job
- FR53: Users can delete a job from their tracked list
- FR54: Users can add notes to a saved job
- FR55: Users can edit notes on a saved job
- FR56: Users can view notes when reviewing a saved job

**Usage & Subscription Management:**
- FR57: Users can view their current AI generation balance
- FR58: Users can view their remaining auto match analyses for the day (free tier only)
- FR59: Users can view their account tier status (Free Tier in MVP)
- FR60: Users receive 5 free AI generations on signup (lifetime)
- FR60a: Free tier users receive 20 auto match analyses per day (resets at midnight UTC, backend configurable)
- FR60b: Paid tier users receive unlimited auto match analyses
- FR61: Users can upgrade to a paid subscription tier (Post-MVP)
- FR62: Users can manage their subscription (upgrade, downgrade, cancel) (Post-MVP)
- FR63: Users earn additional free generations through referrals
- FR64: System blocks paid AI generation features (detailed match, cover letter, outreach, chat) when user has no remaining balance
- FR65: System displays "upgrade coming soon" message when user is out of paid credits
- FR66: System blocks auto match analysis when free tier user exceeds daily limit (20/day)

**Extension Sidebar Experience:**
- FR67: Users can open the extension sidebar (Chrome Side Panel) from any webpage
- FR67a: Sidebar navigation uses a 4-tab structure: Scan | AI Studio | Autofill | Coach
- FR67b: AI Studio contains 4 sub-tabs: Match | Cover Letter | Chat | Outreach
- FR68: Users can close the extension sidebar
- FR69: Sidebar displays one of four states: Logged Out (feature showcase + sign-in CTA), Non-Job Page (resume management + waiting state), Job Detected (auto-scanned job details + match analysis), Full Power (all tabs: Scan, AI Studio, Autofill, Coach)
- FR69a: AI Studio tools (detailed match, cover letter, outreach, chat) and Coach tab unlock when a job is detected AND user has available credits
- FR69b: Autofill functionality enables only when user is on a page with form fields (application page)
- FR70: Sidebar displays resume tray for resume access when user is authenticated
- FR71: AI Studio tools are locked until a job is scanned and user has available credits; Coach tab follows the same unlock condition
- FR72: Users can navigate to the web dashboard from the sidebar
- FR72a: When user navigates to a new job page, sidebar resets job data, match data, and chat history while preserving resume selection, auth session, and credits
- FR72b: When user navigates to a non-job page, sidebar preserves the last job context (user can continue working with previous job data)
- FR72c: Users can manually reset job context via a reset button in the sidebar header (clears job, match, AI Studio outputs, chat; preserves resume, auth, credits)
- FR72d: Sidebar tab switching preserves state within each tab (switching Scan → Coach → Scan does not re-trigger scan)

**Web Dashboard:**
- FR73: Users can access a dedicated jobs management page
- FR74: Users can access a dedicated resume management page
- FR75: Users can access an account management page
- FR76: Users can access a data and privacy controls page
- FR77: Dashboard displays user's current usage and subscription status

**Data Privacy & Controls:**
- FR78: Users can view explanation of what data is stored and where
- FR79: Users can initiate complete data deletion with confirmation
- FR80: Data deletion requires email confirmation for security
- FR81: System clears local extension data on logout
- FR82: AI-generated outputs are never persisted to backend storage

**User Feedback:**
- FR83: Users can submit feedback about the product via in-app feedback form (accessible from sidebar and dashboard)
- FR83a: Feedback form supports categorization: bug report, feature request, general feedback
- FR84: System captures feedback with context: current page URL, sidebar state, last action performed, browser version
- FR84a: Users can optionally attach a screenshot with their feedback
- FR85: Backend stores user feedback with timestamp, user ID, category, context, and optional screenshot reference

### NonFunctional Requirements

**Performance:**
- NFR1: Page scan completes within 2 seconds on standard job boards
- NFR2: AI generation (cover letter, outreach, chat messages) completes within 5 seconds
- NFR3a: Auto match analysis completes within 2 seconds of successful scan
- NFR3b: Detailed match analysis completes within 5 seconds of user request
- NFR4: Autofill executes within 1 second
- NFR5: Sidebar opens within 500ms of user click
- NFR6: Resume parsing completes within 10 seconds of upload
- NFR6a: AI generation endpoints (cover letter, outreach, chat, coach) deliver responses via streaming (Server-Sent Events) with progressive text reveal and a user-accessible cancel option
- NFR6b: Match analysis and resume parsing return complete JSON responses (non-streaming)
- NFR7: Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- NFR8: Fallback AI scan succeeds on 85%+ of unknown job sites
- NFR9: Autofill correctly maps 90%+ of standard form fields

**Security:**
- NFR10: All data transmitted between extension and API is encrypted using industry-standard transport security protocols
- NFR11: All data stored in database is encrypted at rest
- NFR12: Resume files are stored in encrypted file storage
- NFR13: OAuth tokens are stored securely (not in plaintext)
- NFR14: AI-generated outputs are never persisted to backend storage
- NFR15: Users can only access their own data (row-level security)
- NFR16: API endpoints require valid authentication
- NFR17: Session tokens expire after reasonable inactivity period
- NFR18: System supports GDPR right-to-deletion requests
- NFR19: System supports CCPA data access requests
- NFR20: User consent is obtained before data collection

**Reliability:**
- NFR21: Backend API maintains 99.9% uptime (excluding planned maintenance)
- NFR22: No offline mode; extension displays clear "no connection" state when network is unavailable. All AI and data features require an active network connection.
- NFR23: AI provider failures are handled gracefully with user notification
- NFR24: AI generation failures do not decrement user's usage balance
- NFR25: Scan failures display partial results with clear error indication
- NFR26: Network errors provide clear, actionable user feedback

**Scalability (Post-MVP):**
- NFR27: System supports 50,000 monthly active users at 3 months post-launch (Post-MVP)
- NFR28: System supports 150,000 monthly active users at 12 months post-launch (Post-MVP)
- NFR29: Architecture supports scaling to handle increased concurrent user load without code changes (Post-MVP)

**Integration:**
- NFR30: System maintains compatibility with Chrome Manifest V3 requirements
- NFR31: AI provider abstraction allows switching between Claude and GPT
- NFR32: Backend service handles auth, database, and storage operations
- NFR33: Payment processing system handles subscription lifecycle events (Post-MVP)
- NFR34: Extension functions on Chrome version 88+ (Manifest V3 baseline)
- NFR35: Dashboard supports modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

**Maintainability:**
- NFR36: Codebase supports LLM-assisted development with clear module boundaries
- NFR37: API contract enables independent frontend/backend development
- NFR38: Each app (api, web, extension) is independently deployable
- NFR39: Minimal automated testing acceptable for MVP
- NFR40: Production code must be thorough with comprehensive error handling
- NFR41: Backend API must handle all edge cases and failure scenarios
- NFR42: Backend API includes comprehensive application logging
- NFR43: Logs viewable directly on Railway dashboard (no streaming required for MVP)
- NFR44: Log levels: ERROR, WARN, INFO for key operations

**Accessibility:**
- NFR44a: Extension and dashboard target WCAG 2.1 AA compliance for color contrast (4.5:1 normal text, 3:1 large text/UI components), keyboard navigation, and screen reader support
- NFR44b: All interactive elements are reachable via keyboard (Tab, Arrow keys, Enter, Escape)
- NFR44c: All icon-only buttons include descriptive ARIA labels for screen readers
- NFR44d: Color is never the sole indicator of information — always paired with text, icons, or numeric values
- NFR44e: All animations respect the `prefers-reduced-motion` system preference; users who enable reduced motion see instant state changes instead of animated transitions

### Additional Requirements

**Architecture Requirements:**

*Monorepo & Starter Templates:*
- Monorepo structure using pnpm workspaces with three apps: extension (WXT + React), web (Next.js), api (FastAPI)
- Shared packages: ui (shadcn/ui + Tailwind v4 + Storybook), types (TypeScript types)
- Starter template initialization: WXT React template for extension, create-next-app for web, uv init for API
- TypeScript 5.x strict mode for frontend, Python 3.11+ with mypy strict mode for backend

*Database & Backend:*
- Database schema with 6 tables: profiles, resumes, jobs, usage_events, global_config, feedback
- API response envelope pattern for all endpoints (success/error wrapper)
- Standardized error codes (AUTH_REQUIRED, CREDIT_EXHAUSTED, RESUME_LIMIT_REACHED, etc.)
- Hybrid credit system: daily match allocation (20/day free tier) + lifetime/monthly AI generation credits
- Row-level security (RLS) for user data isolation
- Supabase storage for resume files with encrypted at-rest storage

*AI Provider & Streaming:*
- AI provider abstraction supporting Claude and GPT with user preference selection
- Server-Sent Events (SSE) streaming for generative endpoints: cover_letter, outreach, chat, coach
- Non-streaming JSON responses for match analysis and resume parsing
- SSE protocol with chunk, done, and error events
- Frontend cancel button and cursor/caret blink during streaming
- Fallback to other provider on 500 errors/timeouts (configurable)

*Deployment & Tooling:*
- Railway CLI for backend API deployment (direct push, no CI/CD for MVP)
- Vercel CLI for web dashboard deployment
- Supabase CLI for database migrations, local development, type generation
- Supabase MCP for AI-assisted database operations
- Comprehensive structured logging (ERROR, WARN, INFO) viewable on Railway dashboard

**UX Requirements:**

*Chrome Side Panel Constraints:*
- Chrome Side Panel API (not content script shadow DOM)
- User-resizable panel width: 360px minimum (Chrome-enforced) to ~50% window maximum
- Default width ~360px (resets every session — Chrome does not persist)
- Design target: fluid layouts from 360px to 700px (no fixed-width assumptions)
- Always online (no offline mode) with clear "no connection" state

*Four-State Progressive Model:*
- Logged Out: feature showcase + Google sign-in CTA
- Non-Job Page: resume management + waiting state
- Job Detected: auto-scanned job details + match analysis
- Full Power: all tabs unlocked (Scan, AI Studio with 4 sub-tabs, Autofill, Coach)

*Functional Color System:*
- OKLCH semantic CSS variables per functional area (Scan/blue, AI Studio/violet, Autofill/emerald, Coach/orange)
- Independent semantic tokens for each feature area (--scan-*, --ai-studio-*, --autofill-*, --coach-*)
- Dark mode parity for all components and states using semantic tokens
- Zero hardcoded Tailwind color classes (all colors via CSS variables)

*Animation & Motion:*
- Framer Motion for state transitions (AnimatePresence with slide animations)
- Animated SVG match score: radial fill + count-up animation
- Sequential autofill animation: staggered field-by-field completion (600ms per field)
- Gradient depth buttons: bg-gradient-to-br + border-t border-white/20 + colored shadow glow on hover (primary CTAs only)
- All animations respect prefers-reduced-motion preference (instant state changes for reduced motion)

*Design Patterns:*
- Credit lock pattern: show locked AI Studio content with visual preview + "Unlock for 1 Credit" button
- Two-tone card pattern: main body + accent-tinted section (bg-primary/5 + border-t) for visual hierarchy
- Dashed border empty states: border-2 border-dashed for incomplete/missing items + pulsing icons
- Context reset on job switch: job/match/AI Studio cleared, resume/credits/auth persist
- Manual reset button: clears job context while preserving resume/auth/credits

*Accessibility:*
- WCAG 2.1 AA compliance: 4.5:1 contrast for text, 3:1 for UI components
- Full keyboard navigation: Tab, Arrow keys, Enter, Escape for all interactive elements
- ARIA labels for icon-only buttons
- Color never sole indicator (always paired with text/icons/numeric values)
- Reduced motion support for all animations

*Responsive & Viewport:*
- Storybook viewports: Side Panel (360×600 default), Side Panel Wide (500×600), Mobile (375×667), Tablet (768×1024)
- Fluid sizing (not exact pixels) for all components

### FR Coverage Map

{{requirements_coverage_map}}

## Epic List

{{epics_list}}

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story {{N}}.{{M}}: {{story_title_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}

<!-- End story repeat -->
