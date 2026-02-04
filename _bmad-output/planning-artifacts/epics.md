---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
workflowStatus: complete
completedAt: '2026-02-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
revisionHistory:
  - date: 2026-02-03
    epic: Epic 0
    change: "Strategic pivot from custom design system to shadcn UI. Stories 0.1 and 0.2 superseded. See sprint-change-proposal-2026-02-03.md"
  - date: 2026-02-03
    epic: Epic 0
    change: "Fresh pass on Epic 0 stories. Comprehensive UI component extraction from updated PRD (renumbered FRs) and Architecture (Tailwind v4/shadcn/Storybook 10). Scope: 19 shadcn primitives + 13 custom compositions, all with Storybook stories."
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

**UI Component Library Requirements (Epic 0 Fresh Pass):**

**shadcn Primitives (components/ui/) — 19 components:**
- Button (FR26,FR29,FR37,FR42,FR48,FR79), Badge (FR23b,FR55,FR59), Card (FR23c,FR49,FR52)
- Input (FR21,FR28,FR33), Textarea (FR28,FR36c,FR54), Select (FR27,FR26a,FR36a,FR36b)
- Dialog (FR6,FR79,FR80), Tabs (FR69,FR31), Tooltip (Journey 2), Sheet (FR67,FR68)
- Dropdown Menu (FR12,FR51,FR53), Popover (FR22,FR25), Label (FR21,FR42a)
- Separator (layout), ScrollArea (FR34,FR50), Avatar (FR5), Skeleton (NFR5,loading)
- Progress (FR8,NFR6), Sonner/Toast (FR41,FR40)

**Custom Compositions (components/custom/) — 13 components:**
- JobCard (FR15-FR18,FR23b-c,FR49): job details + inline auto-match, states: default/detected/scanning/applied/error
- ResumeCard (FR11,FR10,FR13a-c): resume entry with active indicator, expandable parsed blocks, copy per block
- ResumeTray (FR70,FR13): compact sidebar resume selector
- MatchScoreDisplay (FR23b-c): score % + green/yellow pills side-by-side
- AIToolPanel (FR26-FR30,FR31-FR35,FR36-FR37): shared AI generation layout (options, instructions, output, copy/edit)
- ChatInterface (FR31-FR35): message bubbles, suggestion chips, text input, session controls
- AutofillPreview (FR42a-b,FR44a): field list with fill status, tick-off state
- EmptyState (layout): illustrated placeholder for empty lists
- Navbar (FR72,FR73-FR76): dashboard navigation with user avatar, tier badge
- ExtensionSidebar (FR69,FR69a-b): sidebar shell with 4-state rendering
- FeedbackForm (FR83-FR85): category selector, text area, optional screenshot
- CreditBadge (FR57-FR58,FR64-FR65): compact credit display with warning state
- ScanIndicator (FR14,FR22): scanning progress + missing field indicators

**Application State Props (from Architecture):**
- Loading → Skeleton loaders, spinners (JobCard, ResumeCard, AIToolPanel)
- Error → Destructive variant, error icon, message (all interactive)
- Offline → Muted colors, offline badge (ExtensionSidebar, CreditBadge)
- Low Credits → Warning badge, upgrade CTA (CreditBadge, AIToolPanel)
- Empty → EmptyState composition (job list, resume list)

### FR Coverage Map (Epic 0 — UI Component Library)

**Already existing (from Story 0.1-NEW):** Button, Badge, Card, Input, Dialog, Select, Tabs — all with stories.

| FR | Story | Component |
|----|-------|-----------|
| FR5 | 0.2 | Avatar |
| FR8, NFR6 | 0.2 | Progress |
| FR40, FR41 | 0.2 | Sonner/Toast |
| NFR5, Loading states | 0.2 | Skeleton |
| Layout | 0.2 | Separator |
| FR28, FR36c, FR54 | 0.3 | Textarea |
| FR21, FR42a | 0.3 | Label |
| Journey 2 (tooltips) | 0.3 | Tooltip |
| FR34, FR50 | 0.3 | ScrollArea |
| FR67, FR68 | 0.3 | Sheet |
| FR22, FR25 | 0.3 | Popover |
| FR12, FR51, FR53 | 0.3 | Dropdown Menu |
| FR15-FR18, FR23b-c, FR49 | 0.4 | JobCard |
| FR23b-c | 0.4 | MatchScoreDisplay |
| FR14, FR22 | 0.4 | ScanIndicator |
| Layout | 0.4 | EmptyState |
| FR10, FR11, FR13a-c | 0.5 | ResumeCard |
| FR70, FR13 | 0.5 | ResumeTray |
| FR26-FR30, FR36-FR37 | 0.5 | AIToolPanel |
| FR31-FR35 | 0.5 | ChatInterface |
| FR57-FR58, FR64-FR65 | 0.5 | CreditBadge |
| FR42a-b, FR44a | 0.6 | AutofillPreview |
| FR83-FR85 | 0.6 | FeedbackForm |
| FR72, FR73-FR76 | 0.6 | Navbar |
| FR69, FR69a-b | 0.6 | ExtensionSidebar |

## Epic List

### Epic 0: UI Component Library (shadcn + Storybook)

Developers have a complete, documented component library with Storybook stories covering all UI patterns needed across Extension and Dashboard surfaces. Every component is visually tested in dark/light themes and all viewport presets (Mobile, Tablet, Desktop, Extension Popup).

**Scope:** 12 new shadcn primitives + 13 custom compositions (7 primitives already exist from 0.1-NEW).
**Surfaces:** All (infrastructure) — Extension content scripts, extension popup, dashboard pages.

**Key Architectural Decisions:**
- **Accessibility First:** Radix UI primitives provide battle-tested keyboard navigation, focus management, and ARIA patterns
- **Customization:** Components copied into repo (not npm package), allowing full control while maintaining interaction patterns
- **Theming:** Tailwind v4 CSS-first + OKLCH CSS variables for dark/light theme support
- **Maintenance:** Community-driven updates, lower maintenance burden vs custom components
- **Development Velocity:** Configuration-based setup, shadcn CLI for primitive installation

**Superseded Stories (Rolled Back):**
- ~~Story 0.1: Foundation (Design Tokens + UI Scaffold)~~ — SUPERSEDED by shadcn approach
- ~~Story 0.2: Core Atoms (Button, Badge, Icon, Typography)~~ — SUPERSEDED by shadcn primitives

**Already Existing (from Story 0.1-NEW):** Button, Badge, Card, Input, Dialog, Select, Tabs — all with stories.

**Story Progression:**

| Story | Title | Components | Status |
|-------|-------|------------|--------|
| 0.1-NEW | shadcn UI Setup & Scaffold | Infrastructure (Tailwind v4, Storybook 10, Vite 7) + Button, Badge, Card, Input, Dialog, Select, Tabs | **DONE** |
| 0.2 | Display & Feedback Primitives | Avatar, Separator, Skeleton, Progress, Sonner/Toast (5) | backlog |
| 0.3 | Form & Overlay Primitives | Textarea, Label, Tooltip, ScrollArea, Sheet, Popover, Dropdown Menu (7) | backlog |
| 0.4 | Job & Match Compositions | JobCard, MatchScoreDisplay, ScanIndicator, EmptyState (4) | backlog |
| 0.5 | Resume & AI Studio Compositions | ResumeCard, ResumeTray, AIToolPanel, ChatInterface, CreditBadge (5) | backlog |
| 0.6 | Application & Layout Compositions | AutofillPreview, FeedbackForm, Navbar, ExtensionSidebar (4) | backlog |

**Dependency Flow:**
```
0.1-NEW (DONE) → 0.2 → 0.3 → 0.4 ──→ 0.6
                              └→ 0.5 ──┘
```

---

### Story 0.2: Display & Feedback Primitives

**As a** developer building Jobswyft surfaces,
**I want** display and feedback primitives (Avatar, Separator, Skeleton, Progress, Toast) installed with comprehensive Storybook stories,
**So that** I can compose user profile displays, visual dividers, loading states, progress indicators, and notification feedback across the Extension and Dashboard.

**Acceptance Criteria:**

**Given** the shadcn CLI is available in `packages/ui`
**When** I run `pnpm dlx shadcn@latest add avatar separator skeleton progress sonner`
**Then** all 5 components are installed to `src/components/ui/`
**And** each component uses the project's OKLCH design tokens and Tailwind v4 styling

**Given** Avatar is installed
**When** I render `<Avatar>` with an image src
**Then** it displays the user's profile image in a circular container
**And** when the image fails to load, it falls back to `<AvatarFallback>` showing initials

_Storybook stories: WithImage, WithFallback, Sizes (sm/md/lg), dark/light_

**Given** Separator is installed
**When** I render `<Separator>`
**Then** it displays a horizontal divider using the `--border` design token
**And** it supports `orientation="vertical"` for vertical dividers

_Storybook stories: Horizontal, Vertical, WithLabel, dark/light_

**Given** Skeleton is installed
**When** I render `<Skeleton className="h-4 w-[200px]">`
**Then** it displays an animated placeholder matching the specified dimensions
**And** it uses the `--muted` design token for the shimmer effect

_Storybook stories: TextLine, CardSkeleton, AvatarSkeleton, ListSkeleton, dark/light_

**Given** Progress is installed
**When** I render `<Progress value={60}>`
**Then** it displays a progress bar filled to 60% using the `--primary` design token
**And** it supports values from 0-100 and an indeterminate state (no value prop)

_Storybook stories: Default (50%), Empty (0%), Complete (100%), Indeterminate, Animated, dark/light_

**Given** Sonner (Toast) is installed
**When** I call `toast("Job saved successfully")` with `<Toaster>` mounted
**Then** a toast notification appears with the message, auto-dismisses after timeout
**And** it supports variants: success, error, info, warning, and action buttons

_Storybook stories: Success, Error, Warning, Info, WithDescription, WithAction, dark/light_

**Given** all 5 components are installed and stories written
**When** I check `src/index.ts`
**Then** Avatar, AvatarImage, AvatarFallback, Separator, Skeleton, Progress, Toaster, and `toast` are exported
**And** `pnpm build` succeeds without errors

**Given** Storybook is running
**When** I view any new component story
**Then** it renders correctly in all 4 viewport presets (Mobile 375x667, Tablet 768x1024, Desktop 1440x900, Extension Popup 400x600)
**And** it renders correctly in both dark and light themes via the toolbar toggle

---

### Story 0.3: Form & Overlay Primitives

**As a** developer building Jobswyft surfaces,
**I want** form primitives (Textarea, Label, Tooltip) and overlay/navigation primitives (ScrollArea, Sheet, Popover, Dropdown Menu) installed with comprehensive Storybook stories,
**So that** I can build interactive forms with validation labels, scrollable content areas, slide-out panels, contextual popovers, and action menus across the Extension and Dashboard.

**Acceptance Criteria:**

**Given** the shadcn CLI is available in `packages/ui`
**When** I run `pnpm dlx shadcn@latest add textarea label tooltip scroll-area sheet popover dropdown-menu`
**Then** all 7 components are installed to `src/components/ui/`
**And** each component uses the project's OKLCH design tokens and Tailwind v4 styling

**Given** Textarea is installed
**When** I render `<Textarea placeholder="Custom instructions...">`
**Then** it displays a multi-line text input styled consistently with the existing Input component
**And** it supports `disabled`, `rows`, and standard HTML textarea attributes

_Storybook stories: Default, WithPlaceholder, Disabled, WithLabel, CharacterCount (composition example), dark/light_

**Given** Label is installed
**When** I render `<Label htmlFor="tone">Tone</Label>` paired with a form control
**Then** it displays a styled label that associates with the form control via `htmlFor`
**And** clicking the label focuses the associated input

_Storybook stories: Default, WithInput, WithSelect, WithTextarea, Required (with asterisk composition), dark/light_

**Given** Tooltip is installed
**When** I render a `<Tooltip>` wrapping a trigger element
**Then** hovering the trigger shows a tooltip with the provided content after a short delay
**And** the tooltip positions itself automatically and supports `side` prop (top/right/bottom/left)

_Storybook stories: Default, Sides (top/right/bottom/left), WithIcon, LongContent, dark/light_

**Given** ScrollArea is installed
**When** I render `<ScrollArea className="h-[300px]">` wrapping content taller than 300px
**Then** it displays a custom-styled scrollbar that matches the design system
**And** it supports both vertical and horizontal scrolling via `<ScrollBar orientation="horizontal">`

_Storybook stories: Vertical, Horizontal, Both, LongList, dark/light_

**Given** Sheet is installed
**When** I render `<Sheet>` with a trigger and content
**Then** clicking the trigger slides in a panel from the specified side (default: right)
**And** it supports `side` prop (top/right/bottom/left), displays an overlay backdrop, and closes on backdrop click or Escape key

_Storybook stories: Right (default), Left, Top, Bottom, WithForm, LongContent, dark/light_

**Given** Popover is installed
**When** I render `<Popover>` with a trigger and content
**Then** clicking the trigger displays a floating content panel anchored to the trigger
**And** it supports `side` and `align` props for positioning, closes on outside click or Escape

_Storybook stories: Default, WithForm, Sides (top/bottom/left/right), dark/light_

**Given** Dropdown Menu is installed
**When** I render `<DropdownMenu>` with trigger, items, and sub-items
**Then** clicking the trigger opens a floating menu with selectable items
**And** it supports keyboard navigation (arrow keys, Enter, Escape), separators, labels, checkboxes, radio groups, and sub-menus

_Storybook stories: Default, WithIcons, WithCheckbox, WithRadioGroup, WithSubMenu, WithSeparators, dark/light_

**Given** all 7 components are installed and stories written
**When** I check `src/index.ts`
**Then** all components and their subcomponents are exported (Textarea, Label, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, ScrollArea, ScrollBar, Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose, Popover, PopoverTrigger, PopoverContent, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent)
**And** `pnpm build` succeeds without errors

**Given** Storybook is running
**When** I view any new component story
**Then** it renders correctly in all 4 viewport presets (Mobile, Tablet, Desktop, Extension Popup)
**And** it renders correctly in both dark and light themes via the toolbar toggle

---

### Story 0.4: Job & Match Compositions

**As a** developer building the Extension sidebar and Dashboard,
**I want** job-related custom compositions (JobCard, MatchScoreDisplay, ScanIndicator, EmptyState) with comprehensive Storybook stories,
**So that** I can render job detection results with inline match analysis, scanning feedback, and empty-state placeholders across both surfaces.

**Acceptance Criteria:**

**Given** the `src/components/custom/` directory does not exist
**When** Story 0.4 implementation begins
**Then** `src/components/custom/` is created as the directory for all domain-specific compositions
**And** each component is built using shadcn primitives from `components/ui/` (Card, Badge, Progress, etc.)

**Given** JobCard is implemented
**When** I render `<JobCard>` with job data props (`title`, `company`, `description`, `location`, `salary`, `employmentType`, `sourceUrl`)
**Then** it displays the job details in a Card layout with title and company prominently shown
**And** optional fields (location, salary, employmentType) render only when provided
**And** the description is truncated with an expand/collapse toggle

**Given** JobCard receives a `state` prop
**When** state is `"default"` — renders with standard card styling
**When** state is `"detected"` — renders with a highlighted border and subtle pulse animation
**When** state is `"scanning"` — renders with a skeleton placeholder for job fields and a ScanIndicator
**When** state is `"applied"` — renders with a muted style and "Applied" badge
**When** state is `"error"` — renders with a destructive border and error message

**Given** JobCard receives `matchData` prop (optional)
**When** matchData is provided with `score`, `strengths[]`, and `gaps[]`
**Then** a MatchScoreDisplay renders inline below the job details within the card

_Storybook stories: Default, Detected, Scanning, Applied, Error, WithMatch, WithoutMatch, MinimalFields, AllFields, dark/light_

**Given** MatchScoreDisplay is implemented
**When** I render `<MatchScoreDisplay score={87} strengths={["Python", "Team Leadership"]} gaps={["Kubernetes"]}>`
**Then** it displays the match score as a percentage (87%) with appropriate color coding (green ≥70%, yellow 40-69%, red <40%)
**And** strengths render as green Badge components in a row
**And** gaps render as yellow/amber Badge components in a row
**And** strengths and gaps are displayed side-by-side in a two-column layout

**Given** MatchScoreDisplay receives varying data
**When** strengths array is empty — the strengths column shows "No strong matches"
**When** gaps array is empty — the gaps column shows "No gaps identified"
**When** arrays have more than 5 items — remaining items are collapsed with a "+N more" indicator

_Storybook stories: HighMatch (90%+), GoodMatch (70-89%), ModerateMatch (40-69%), LowMatch (<40%), ManySkills, NoStrengths, NoGaps, dark/light_

**Given** ScanIndicator is implemented
**When** I render `<ScanIndicator state="scanning">`
**Then** it shows an animated scanning indicator (progress or spinner) with "Scanning page..." text

**When** I render `<ScanIndicator state="success">`
**Then** it shows a success icon with "Scan complete" text that auto-fades after 2 seconds

**When** I render `<ScanIndicator state="error" message="Could not extract job title">`
**Then** it shows a destructive-styled indicator with the error message

**When** I render `<ScanIndicator state="partial" missingFields={["salary", "location"]}>`
**Then** it shows a warning indicator listing the missing optional fields

_Storybook stories: Scanning, Success, Error, PartialWithMissing, dark/light_

**Given** EmptyState is implemented
**When** I render `<EmptyState icon={Briefcase} title="No saved jobs" description="Jobs you save will appear here">`
**Then** it displays a centered layout with the Lucide icon, title text, and description text
**And** it optionally renders an action button via `action` prop (`{ label: string, onClick: () => void }`)

**Given** EmptyState is used in different contexts
**When** used for jobs — shows Briefcase icon with job-related messaging
**When** used for resumes — shows FileText icon with resume-related messaging
**When** used for chat — shows MessageSquare icon with chat-related messaging

_Storybook stories: NoJobs, NoResumes, NoChat, WithAction, CustomIcon, dark/light_

**Given** all 4 custom compositions are implemented and stories written
**When** I check `src/index.ts`
**Then** JobCard, MatchScoreDisplay, ScanIndicator, and EmptyState are exported with their prop type interfaces
**And** `pnpm build` succeeds without errors

**Given** Storybook is running
**When** I view any custom composition story
**Then** it renders correctly in all 4 viewport presets (Mobile, Tablet, Desktop, Extension Popup)
**And** it renders correctly in both dark and light themes
**And** interactive elements (expand/collapse, +N more) function in stories

---

### Story 0.5: Resume & AI Studio Compositions

**As a** developer building the Extension sidebar and Dashboard,
**I want** resume and AI studio custom compositions (ResumeCard, ResumeTray, AIToolPanel, ChatInterface, CreditBadge) with comprehensive Storybook stories,
**So that** I can render resume management UI, AI generation tool interfaces, chat conversations, and credit balance indicators across both surfaces.

**Acceptance Criteria:**

**Given** ResumeCard is implemented
**When** I render `<ResumeCard fileName="Marcus_Resume_2026.pdf" uploadedAt="2026-01-15" isActive={true}>`
**Then** it displays the file name, upload date, and an active indicator (checkmark/highlight) when `isActive` is true
**And** when `isActive` is false, the active indicator is hidden and styling is neutral

**Given** ResumeCard receives `parsedData` prop with sections (skills, experience, education, contact)
**When** the card is rendered
**Then** each section renders as a collapsible block via a clickable header
**And** clicking a section header expands/collapses that section's content
**And** each expanded section shows a copy-to-clipboard button that copies the section text

**Given** ResumeCard receives action callbacks
**When** `onSetActive` is provided — a "Set Active" action is available (hidden when already active)
**When** `onDelete` is provided — a "Delete" action is available via the DropdownMenu
**Then** clicking the action triggers the corresponding callback

_Storybook stories: Active, Inactive, WithParsedData, ExpandedBlocks, NoParsedData, WithActions, dark/light_

**Given** ResumeTray is implemented
**When** I render `<ResumeTray activeResume={{ fileName, id }} resumes={[...]} onSwitch={fn}>`
**Then** it displays a compact bar showing the active resume name (truncated if long)
**And** clicking the tray opens a dropdown/popover listing all resumes with the active one indicated
**And** selecting a different resume calls `onSwitch(resumeId)`

**Given** ResumeTray receives an empty `resumes` array
**When** rendered
**Then** it shows a compact "Upload Resume" prompt instead of a resume name

_Storybook stories: WithActiveResume, MultipleResumes, SingleResume, NoResumes, LongFileName, dark/light_

**Given** AIToolPanel is implemented
**When** I render `<AIToolPanel tool="cover_letter" onGenerate={fn}>`
**Then** it displays a panel layout with:
1. **Options section** — tone selector (`<Select>`) and length selector (`<Select>`) appropriate to the tool
2. **Custom instructions** — a `<Textarea>` for user input (FR28, FR36c)
3. **Generate button** — a `<Button>` with the tool-specific label (e.g., "Generate Cover Letter")
4. **Credit cost** — displays "1 credit" indicator next to the generate button

**Given** AIToolPanel is in `loading` state
**When** `isGenerating={true}` is passed
**Then** the generate button shows a loading spinner and is disabled
**And** the options and textarea are disabled

**Given** AIToolPanel receives `output` prop with generated text
**When** rendered
**Then** the output area displays the generated text in an editable `<Textarea>`
**And** a "Copy" button triggers copy-to-clipboard with toast confirmation (FR40, FR41)
**And** a "Regenerate" button is shown allowing regeneration with feedback (FR29, FR37)

**Given** AIToolPanel is used for different tools
**When** `tool="cover_letter"` — shows tone + length selectors, label "Generate Cover Letter"
**When** `tool="outreach"` — shows tone + length selectors, label "Generate Outreach"
**When** `tool="detailed_match"` — shows no tone/length selectors, label "Run Detailed Analysis"

_Storybook stories: CoverLetterEmpty, CoverLetterLoading, CoverLetterWithOutput, OutreachEmpty, DetailedMatchEmpty, WithCustomInstructions, CreditExhausted, dark/light_

**Given** ChatInterface is implemented
**When** I render `<ChatInterface messages={[]} suggestions={["What skills match?", "What gaps exist?"]} onSend={fn}>`
**Then** it displays:
1. **Message area** — a `<ScrollArea>` for conversation history
2. **Suggestion chips** — clickable Badge-style chips for pre-generated questions (FR32)
3. **Input area** — text input with send button

**Given** ChatInterface receives `messages` array
**When** messages contain `{ role: "user", content: "..." }` entries
**Then** user messages render right-aligned with primary background
**When** messages contain `{ role: "assistant", content: "..." }` entries
**Then** AI messages render left-aligned with muted background
**And** each AI message has a copy-to-clipboard button

**Given** ChatInterface receives `isLoading={true}`
**When** the AI is generating a response
**Then** a typing indicator (animated dots) appears in the message area
**And** the send button is disabled

**Given** the user clicks a suggestion chip
**When** `onSend` is called with the suggestion text
**Then** the suggestion chips section hides after first message is sent

**Given** ChatInterface receives `onNewSession` callback
**When** rendered
**Then** a "New Chat" button appears in the header
**And** clicking it calls `onNewSession` (FR35)

_Storybook stories: Empty, WithSuggestions, ConversationHistory, Loading, LongConversation, dark/light_

**Given** CreditBadge is implemented
**When** I render `<CreditBadge remaining={3} total={5} tier="free">`
**Then** it displays "3/5 credits" in a compact badge format

**When** `remaining` is 1 or less
**Then** the badge switches to a warning style (amber/yellow color)

**When** `remaining` is 0
**Then** the badge shows destructive styling with text "No credits"
**And** if `tier="free"`, displays "Upgrade coming soon" tooltip on hover (FR65)

**Given** CreditBadge receives `dailyAutoMatch` prop
**When** `tier="free"` and `dailyAutoMatch={{ remaining: 12, total: 20 }}` is provided
**Then** it displays a secondary indicator "12/20 auto matches today" (FR58)

_Storybook stories: FullCredits, LowCredits, NoCredits, FreeTierWithAutoMatch, PaidTier, dark/light_

**Given** all 5 custom compositions are implemented and stories written
**When** I check `src/index.ts`
**Then** ResumeCard, ResumeTray, AIToolPanel, ChatInterface, and CreditBadge are exported with their prop type interfaces
**And** `pnpm build` succeeds without errors

**Given** Storybook is running
**When** I view any Story 0.5 composition
**Then** it renders correctly in all 4 viewport presets (Mobile, Tablet, Desktop, Extension Popup)
**And** it renders correctly in both dark and light themes
**And** interactive elements (expand/collapse, dropdowns, copy, send) function in stories

---

### Story 0.6: Application & Layout Compositions

**As a** developer building the Extension sidebar and Dashboard,
**I want** application and layout compositions (AutofillPreview, FeedbackForm, Navbar, ExtensionSidebar) with comprehensive Storybook stories,
**So that** I can render autofill field previews, feedback capture forms, dashboard navigation, and the full extension sidebar shell across both surfaces.

**Acceptance Criteria:**

**Given** AutofillPreview is implemented
**When** I render `<AutofillPreview fields={[{ label: "Name", value: "Marcus Chen", status: "pending" }, ...]}>`
**Then** it displays a list of detected form fields with their labels and values to be filled
**And** each field shows a status indicator: `"pending"` (unfilled), `"filled"` (green checkmark tick-off), `"skipped"` (grey dash)

**Given** AutofillPreview receives `onExecute` and `onUndo` callbacks
**When** status is all `"pending"` — "Autofill" button is enabled, "Undo" is hidden
**When** some or all fields are `"filled"` — "Autofill" is disabled, "Undo" button appears
**Then** clicking the respective button calls the callback

_Storybook stories: AllPending, AllFilled, PartialFill, WithSkipped, EmptyFields, dark/light_

**Given** FeedbackForm is implemented
**When** I render `<FeedbackForm onSubmit={fn}>`
**Then** it displays:
1. **Category selector** — radio group or segmented control for "Bug Report", "Feature Request", "General Feedback" (FR83a)
2. **Content textarea** — for the feedback message
3. **Screenshot toggle** — optional attachment indicator (FR84a)
4. **Submit button** — calls `onSubmit({ category, content, hasScreenshot })`

**Given** FeedbackForm validation
**When** category is not selected or content is empty
**Then** the submit button is disabled

**Given** FeedbackForm receives `isSubmitting={true}`
**When** rendered
**Then** the submit button shows a loading state and all inputs are disabled

_Storybook stories: Empty, BugReport, FeatureRequest, GeneralFeedback, Submitting, dark/light_

**Given** Navbar is implemented
**When** I render `<Navbar user={{ name, email, avatarUrl }} tier="free" activePage="jobs">`
**Then** it displays:
1. **Logo/brand** — Jobswyft branding on the left
2. **Navigation links** — Jobs, Resumes, Account, Privacy (FR73-FR76) with active state highlighting
3. **Right section** — CreditBadge + Avatar with dropdown (profile, sign out)

**Given** Navbar receives `onNavigate` callback
**When** a navigation link is clicked
**Then** `onNavigate(pageName)` is called with the page identifier

**Given** Navbar is viewed on mobile viewport
**When** screen width is below tablet breakpoint
**Then** navigation links collapse into a hamburger menu (Sheet-based)

_Storybook stories: Desktop, Tablet, Mobile, FreeTier, PaidTier, AllPages (jobs/resumes/account/privacy active), dark/light_

**Given** ExtensionSidebar is implemented
**When** I render `<ExtensionSidebar state="logged_out">`
**Then** it displays only a Google Sign-In button centered in the sidebar (FR69)

**When** I render `<ExtensionSidebar state="non_job_page" user={...} resumes={[...]}>`
**Then** it displays ResumeTray at the top, a message "Navigate to a job posting to get started", and a dashboard link (FR72)
**And** AI Studio tools and Autofill are not rendered

**When** I render `<ExtensionSidebar state="job_page" user={...} resumes={[...]} jobData={...} matchData={...}>`
**Then** it displays ResumeTray, JobCard with inline MatchScoreDisplay, and a message "Go to the application page to unlock AI tools"
**And** AI Studio tabs are visible but disabled/locked (FR69a, FR71)

**When** I render `<ExtensionSidebar state="application_page" user={...} resumes={[...]} jobData={...} matchData={...}>`
**Then** it displays the full sidebar: ResumeTray, JobCard with match, AI Studio Tabs (Match/Cover Letter/Outreach/Chat), AutofillPreview, and CreditBadge
**And** all tools are fully interactive (FR69a, FR69b)

**Given** ExtensionSidebar receives `isOffline={true}`
**When** rendered in any state
**Then** an offline banner appears at the top with muted styling

_Storybook stories: LoggedOut, NonJobPage, JobPage, ApplicationPage, Offline, WithLowCredits, dark/light_

**Given** all 4 custom compositions are implemented and stories written
**When** I check `src/index.ts`
**Then** AutofillPreview, FeedbackForm, Navbar, and ExtensionSidebar are exported with their prop type interfaces
**And** `pnpm build` succeeds without errors

**Given** Storybook is running
**When** I view any Story 0.6 composition
**Then** it renders correctly in all 4 viewport presets (Mobile, Tablet, Desktop, Extension Popup)
**And** it renders correctly in both dark and light themes
**And** interactive elements function in stories

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

#### Story 8.1: Railway Dev Environment Setup & First Deployment

**As a** developer,
**I want** to deploy the FastAPI backend to a Railway development environment,
**So that** the API is accessible for frontend development and testing without affecting future production.

**Acceptance Criteria:**

**Given** Railway CLI is not installed
**When** I run the installation command
**Then** Railway CLI is installed and `railway --version` returns a valid version

**Given** I am not authenticated with Railway
**When** I run `railway login`
**Then** browser opens for OAuth authentication and CLI confirms successful login

**Given** I am in the `apps/api` directory
**When** I run `railway init`
**Then** a new Railway project is created and linked to this directory

**Given** the Railway project is created
**When** I configure the environment
**Then** it is explicitly named/tagged as `dev` or `development` environment

**Given** the Railway dev environment exists
**When** I set environment variables using `railway variables set`
**Then** the following variables are configured for dev:
- `SUPABASE_URL` (dev Supabase project)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `ENVIRONMENT=development`

**Given** environment variables are configured
**When** I run `railway up`
**Then** the FastAPI application builds and deploys to the dev environment

**Given** the deployment is complete
**When** I access the Railway-provided dev URL with `/health` endpoint
**Then** the API returns a 200 status with a health check response

**Given** the deployment is complete
**When** I access the Railway-provided dev URL with `/docs` endpoint
**Then** the FastAPI Swagger documentation is accessible

**Technical Notes:**
- Railway CLI: `npm install -g @railway/cli`
- Use Railway's environment feature to create `dev` environment
- Railway provides automatic HTTPS URL for dev (e.g., `jobswyft-api-dev.up.railway.app`)
- Production environment with custom domain deferred to later story

**Out of Scope (Future Story):**
- Production environment setup
- Custom domain integration
- SSL certificate configuration
- Production-specific env vars
