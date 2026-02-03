---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# Jobswyft - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Jobswyft, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication & Account Management (FR1-FR6)**
- FR1: Users can sign in using Google OAuth
- FR2: Users can sign out from the extension
- FR3: Users can sign out from the dashboard
- FR4: System maintains authentication state across browser sessions
- FR5: Users can view their account profile information
- FR6: Users can delete their entire account and all associated data

**Resume Management (FR7-FR13)**
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

**Job Page Scanning (FR14-FR22)**
- FR14: System automatically scans job posting pages when detected via URL pattern matching
- FR14a: System detects job pages using configurable URL patterns for major job boards
- FR14b: Users can manually trigger scan if automatic detection fails
- FR15: System extracts job title from job posting pages
- FR16: System extracts company name from job posting pages
- FR17: System extracts full job description from job posting pages
- FR18: System extracts optional fields (location, salary, employment type) when available
- FR19: System extracts application questions ephemerally when present on the page (not persisted to database)
- FR20: Users can manually correct extracted fields using an element picker
- FR21: Users can manually edit any extracted field directly
- FR22: System indicates which required fields are missing after a scan

**AI Generation Tools - Match Analysis (FR23-FR25)**
- FR23: Users can generate a resume-to-job match analysis
- FR24: Match analysis displays user's strengths relative to the job
- FR25: Match analysis displays skill gaps relative to the job

**AI Generation Tools - Cover Letter (FR26-FR30)**
- FR26: Users can generate a tailored cover letter
- FR26a: Users can select a length for cover letter generation (e.g., brief, standard, detailed)
- FR27: Users can select a tone for cover letter generation (e.g., confident, friendly, enthusiastic)
- FR28: Users can provide custom instructions for cover letter generation
- FR29: Users can regenerate cover letter with feedback on what to change
- FR30: Users can export generated cover letters as PDF

**AI Generation Tools - Answer Generation (FR31-FR32)**
- FR31: Users can generate answers to application questions
- FR32: Users can regenerate answers with feedback on what to change

**AI Generation Tools - Outreach Messages (FR33-FR34)**
- FR33: Users can generate outreach messages for recruiters/hiring managers
- FR33a: Users can select a tone for outreach message generation
- FR33b: Users can select a length for outreach message generation (e.g., brief, standard)
- FR33c: Users can provide custom instructions for outreach message generation
- FR34: Users can regenerate outreach messages with feedback on what to change

**AI Generation Tools - Common Capabilities (FR35-FR38)**
- FR35: Users can edit any AI-generated output before using it
- FR36: AI outputs and extracted application questions are ephemeral and not stored on the server
- FR37: Users can copy any AI-generated output to clipboard with a single click
- FR38: System provides visual feedback when AI output is copied

**Form Autofill (FR39-FR44)**
- FR39: Users can autofill application form fields with their profile data
- FR39a: System displays detected form fields in sidebar before autofill execution
- FR39b: Users can review which fields will be filled before triggering autofill
- FR40: System maps user data to appropriate form fields automatically
- FR41: System highlights fields that were autofilled
- FR41a: System shows visual tick-off state in sidebar for successfully filled fields
- FR42: Users can undo the last autofill action
- FR43: Autofill includes resume upload when a file upload field is detected
- FR44: Autofill includes generated cover letter when available

**Job Tracking (FR45-FR53)**
- FR45: Users can save a job from the extension via a dedicated "Save Job" button
- FR46: System automatically sets job status to "Applied" when saving from extension
- FR47: Users can view their list of saved/tracked jobs in the dashboard
- FR48: Users can update the status of a tracked job (applied, interviewed, offer, rejected)
- FR49: Users can view details of a saved job
- FR50: Users can delete a job from their tracked list
- FR51: Users can add notes to a saved job
- FR52: Users can edit notes on a saved job
- FR53: Users can view notes when reviewing a saved job

**Usage & Subscription Management (FR54-FR61)**
- FR54: Users can view their current AI generation balance
- FR55: Users can view their account tier status (Free Tier in MVP)
- FR56: Users receive 5 free AI generations on signup (lifetime)
- FR57: Users can upgrade to a paid subscription tier (Post-MVP)
- FR58: Users can manage their subscription (upgrade, downgrade, cancel) (Post-MVP)
- FR59: Users earn additional free generations through referrals
- FR60: System blocks AI generation when user has no remaining balance
- FR61: System displays "upgrade coming soon" message when user is out of credits

**Extension Sidebar Experience (FR62-FR67)**
- FR62: Users can open the extension sidebar from any webpage
- FR63: Users can close the extension sidebar
- FR64: Sidebar displays one of four states: Logged Out (sign-in only), Non-Job Page (resume tray enabled, AI disabled), Job Page (auto-scan, AI locked), Application Page (full features)
- FR64a: AI Studio tools unlock only when user is on a job application page
- FR64b: Autofill functionality enables only when user is on a job application page
- FR65: Sidebar displays resume tray for resume access when user is authenticated
- FR66: AI Studio tools are locked until user navigates to application page with valid scan data
- FR67: Users can navigate to the web dashboard from the sidebar

**Web Dashboard (FR68-FR72)**
- FR68: Users can access a dedicated jobs management page
- FR69: Users can access a dedicated resume management page
- FR70: Users can access an account management page
- FR71: Users can access a data and privacy controls page
- FR72: Dashboard displays user's current usage and subscription status

**Data Privacy & Controls (FR73-FR77)**
- FR73: Users can view explanation of what data is stored and where
- FR74: Users can initiate complete data deletion with confirmation
- FR75: Data deletion requires email confirmation for security
- FR76: System clears local extension data on logout
- FR77: AI-generated outputs are never persisted to backend storage

**User Feedback (FR78-FR80)**
- FR78: Users can submit feedback about the product via in-app feedback form (accessible from sidebar and dashboard)
- FR78a: Feedback form supports categorization: bug report, feature request, general feedback
- FR79: System captures feedback with context: current page URL, sidebar state, last action performed, browser version
- FR79a: Users can optionally attach a screenshot with their feedback
- FR80: Backend stores user feedback with timestamp, user ID, category, context, and optional screenshot reference

### NonFunctional Requirements

**Performance - Response Time (NFR1-NFR6)**
- NFR1: Page scan completes within 2 seconds on standard job boards
- NFR2: AI generation (cover letter, answers, outreach) completes within 5 seconds
- NFR3: Match analysis completes within 3 seconds
- NFR4: Autofill executes within 1 second
- NFR5: Sidebar opens within 500ms of user click
- NFR6: Resume parsing completes within 10 seconds of upload

**Performance - Accuracy (NFR7-NFR9)**
- NFR7: Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- NFR8: Fallback AI scan succeeds on 85%+ of unknown job sites
- NFR9: Autofill correctly maps 90%+ of standard form fields

**Security - Data Protection (NFR10-NFR14)**
- NFR10: All data transmitted between extension and API is encrypted (TLS 1.3)
- NFR11: All data stored in database is encrypted at rest
- NFR12: Resume files are stored in encrypted blob storage
- NFR13: OAuth tokens are stored securely (not in plaintext)
- NFR14: AI-generated outputs are never persisted to backend storage

**Security - Access Control (NFR15-NFR17)**
- NFR15: Users can only access their own data (row-level security)
- NFR16: API endpoints require valid authentication
- NFR17: Session tokens expire after reasonable inactivity period

**Security - Privacy Compliance (NFR18-NFR20)**
- NFR18: System supports GDPR right-to-deletion requests
- NFR19: System supports CCPA data access requests
- NFR20: User consent is obtained before data collection

**Reliability - Availability (NFR21-NFR23)**
- NFR21: Backend API maintains 99.9% uptime (excluding planned maintenance)
- NFR22: Extension functions offline for cached data (resume selection, local state)
- NFR23: AI provider failures are handled gracefully with user notification

**Reliability - Error Handling (NFR24-NFR26)**
- NFR24: AI generation failures do not decrement user's usage balance
- NFR25: Scan failures display partial results with clear error indication
- NFR26: Network errors provide clear, actionable user feedback

**Scalability (NFR27-NFR29) - Post-MVP**
- NFR27: System supports 50,000 monthly active users at 3 months post-launch (Post-MVP)
- NFR28: System supports 150,000 monthly active users at 12 months post-launch (Post-MVP)
- NFR29: Architecture supports horizontal scaling without code changes (Post-MVP)

**Integration (NFR30-NFR35)**
- NFR30: System maintains compatibility with Chrome Manifest V3 requirements
- NFR31: AI provider abstraction allows switching between Claude and GPT
- NFR32: Supabase SDK handles auth, database, and storage operations
- NFR33: Stripe integration handles subscription lifecycle events (Post-MVP)
- NFR34: Extension functions on Chrome version 88+ (Manifest V3 baseline)
- NFR35: Dashboard supports modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

**Maintainability - Code Quality (NFR36-NFR38)**
- NFR36: Codebase supports LLM-assisted development with clear module boundaries
- NFR37: API contract (OpenAPI spec) enables independent frontend/backend development
- NFR38: Each app (api, web, extension) is independently deployable

**Maintainability - Testing (NFR39-NFR41)**
- NFR39: Minimal automated testing acceptable for MVP
- NFR40: Production code must be thorough with comprehensive error handling
- NFR41: Backend API must handle all edge cases and failure scenarios

**Maintainability - Logging & Observability (NFR42-NFR44)**
- NFR42: Backend API includes comprehensive application logging
- NFR43: Logs viewable directly on Railway dashboard (no streaming required for MVP)
- NFR44: Log levels: ERROR, WARN, INFO for key operations

### Additional Requirements

**From Architecture - Starter Templates:**
- Architecture specifies starter templates for Epic 1 Story 1:
  - Extension: `pnpm dlx wxt@latest init apps/extension --template react`
  - Web: `pnpm dlx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - API: `cd apps/api && uv init --name jobswyft-api`

**From Architecture - Monorepo Structure:**
- pnpm workspaces for TypeScript packages
- uv for Python (API)
- Package initialization order: design-tokens → ui → apps (extension, web)

**From Architecture - Shared Packages:**
- `packages/design-tokens`: Style Dictionary → CSS vars, JS, JSON (central design system)
- `packages/ui`: Shared component library with Storybook, Tailwind + CSS Modules hybrid
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

**From Architecture - Implementation Priority:**
- Backend API + Database first
- Then Dashboard
- Then Extension

**From Architecture - Deployment:**
- Railway CLI for API deployment
- Vercel CLI for Dashboard deployment
- Supabase CLI for database migrations
- Local unpacked extension for MVP

**From Architecture - MCP Tooling:**
- Serena: Code exploration, symbol navigation, refactoring
- Supabase MCP: Database operations
- Tavily: Web search for research
- Context7: Latest library documentation

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR6 | Epic 1 | Authentication & Account Management |
| FR7-FR13 (incl. FR13a-c) | Epic 2 | Resume Management |
| FR14-FR22 (incl. FR14a-b) | Epic 3 | Job Page Scanning |
| FR23-FR25 | Epic 4 | AI Match Analysis |
| FR26-FR30 (incl. FR26a) | Epic 4 | AI Cover Letter Generation |
| FR31-FR32 | Epic 4 | AI Answer Generation |
| FR33-FR34 (incl. FR33a-c) | Epic 4 | AI Outreach Messages |
| FR35-FR38 | Epic 4 | AI Common Capabilities |
| FR39-FR44 (incl. FR39a-b, FR41a) | Epic 5 | Form Autofill |
| FR45-FR53 | Epic 6 | Job Tracking |
| FR54-FR56, FR60-FR61 | Epic 1 | Usage & Subscription (MVP) |
| FR57-FR58 | Post-MVP | Subscription Management |
| FR59 | Epic 1 | Referral Bonus |
| FR62-FR67 (incl. FR64a-b) | Epic 3 | Extension Sidebar Experience |
| FR68-FR72 | Epic 6 | Web Dashboard |
| FR73-FR77 | Epic 7 | Data Privacy & Controls |
| FR78-FR80 (incl. FR78a, FR79a) | Epic 6 | User Feedback |

## Epic List

### Epic 0: Platform Foundation
Establish the technical foundation that enables all user experiences - monorepo structure, database schema, API skeleton, and shared packages (design-tokens, ui, types).

**Covers:** Architecture requirements (monorepo, DB schema, API skeleton, shared packages)
**Surfaces:** All (infrastructure)

---

### Epic 1: User Authentication & Account
Users can securely sign in with Google, manage their account profile, view their usage balance, and delete their account if needed.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR54, FR55, FR56, FR59, FR60, FR61
**Surfaces:** API + Dashboard + Extension

---

### Epic 2: Resume Management
Users can upload PDF resumes, have them parsed by AI to extract structured data, view parsed content in expandable blocks, and manage up to 5 resumes with one active selection.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR13a, FR13b, FR13c
**Surfaces:** API + Dashboard + Extension

---

### Epic 3: Job Scanning & Extension Sidebar
Users can open the extension sidebar on any job page, have job details automatically detected and extracted, manually correct fields if needed, and navigate between sidebar states.

**FRs covered:** FR14, FR14a, FR14b, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR62, FR63, FR64, FR64a, FR64b, FR65, FR66, FR67
**Surfaces:** Extension (primary) + API (for AI fallback scan)

---

### Epic 4: AI Content Generation
Users can generate personalized match analyses, cover letters, application answers, and outreach messages - with tone/length selection, custom instructions, and clipboard support.

**FRs covered:** FR23, FR24, FR25, FR26, FR26a, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR33a, FR33b, FR33c, FR34, FR35, FR36, FR37, FR38
**Surfaces:** API + Extension

---

### Epic 5: Application Autofill
Users can preview detected form fields, auto-fill applications with their profile data, see highlighted filled fields, undo autofill, and include resume/cover letter uploads.

**FRs covered:** FR39, FR39a, FR39b, FR40, FR41, FR41a, FR42, FR43, FR44
**Surfaces:** Extension

---

### Epic 6: Job Tracking & Dashboard
Users can save jobs from the extension, track application status, add notes, view all jobs in the dashboard, manage resumes and account settings, and submit product feedback.

**FRs covered:** FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53, FR68, FR69, FR70, FR71, FR72, FR78, FR78a, FR79, FR79a, FR80
**Surfaces:** API + Dashboard + Extension (save button)

---

### Epic 7: Privacy & Data Controls
Users can view what data is stored, initiate secure account deletion with email confirmation, and trust that AI outputs are never persisted.

**FRs covered:** FR73, FR74, FR75, FR76, FR77
**Surfaces:** API + Dashboard + Extension

---

### Epic 8: Railway Backend Deployment
Deploy the FastAPI backend to Railway so it's accessible for frontend development and testing.

**Covers:** Deployment requirements - Railway CLI setup, project linking, environment configuration, first deployment
**Surfaces:** API + Infrastructure
**Note:** Can be worked on independently while UI development continues.
