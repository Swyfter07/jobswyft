---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-01-validate-prerequisites-revised-2026-02-07
  - step-02-design-epics
  - step-02-design-epics-revised-2026-02-07
  - step-03-create-stories
  - step-03-create-stories-revised-2026-02-07
  - step-04-final-validation
  - step-04-final-validation-revised-2026-02-07
workflowStatus: complete
completedAt: '2026-02-06'
lastRevised: '2026-02-07'
revision2Note: 'Surgical update — aligned with updated PRD/Architecture/UX, added Epic API (6 stories), deferred FR20, resolved 3 ambiguities'
previousRun:
  completedAt: '2026-02-05'
  storyApproach: iterative
  note: 'Re-running workflow to create full story breakdown for Epic EXT'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md (existing epic/story structure)
  - _bmad-output/implementation-artifacts/EXT-1-wxt-extension-setup-ui-integration-login.md (EXT-1 learnings)
userPreferences:
  storyOrder: 'Navigation → Resume → Job Scan → AI Studio → Autofill → Job Tracking → Usage/Credits → Feedback → Settings'
  storyStructure: 'Identify existing components → Identify new components → Apply design language → Verify with user (Storybook) → Implement in extension → Backend integration → End-to-end wiring'
  approach: 'Create all stories in one go, iteratively refine together'
  componentFirst: true
  startWithExistingDesigns: true
---

# Jobswyft - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Jobswyft, decomposing the requirements from the PRD and Architecture into implementable stories.

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

**Chat (5):**
- FR31: Users can open chat interface from AI Studio
- FR32: System generates question suggestions based on extracted job posting content
- FR33: Users can ask questions via chat (costs 1 AI credit per message)
- FR34: Chat displays conversation history within current session
- FR35: Users can start new chat session to clear history

**Outreach Messages (5):**
- FR36: Users can generate outreach messages for recruiters/hiring managers
- FR36a: Users can select a tone for outreach message generation
- FR36b: Users can select a length for outreach message generation (e.g., brief, standard)
- FR36c: Users can provide custom instructions for outreach message generation
- FR37: Users can regenerate outreach messages with feedback on what to change

**Coach (Standalone Tab) (6):**
- FR37a: Users can access Coach as a standalone sidebar tab (separate from AI Studio)
- FR37b: Coach provides conversational AI coaching personalized to the user's active resume and current scanned job
- FR37c: Coach can advise on application strategy, interview preparation, and skill gap analysis for the current role
- FR37d: Coach conversations cost 1 AI credit per message
- FR37e: Coach conversation resets when user switches to a different job (new job = new coaching context)
- FR37f: System generates contextual coaching prompts based on match analysis results (e.g., "How do I address the Kubernetes gap?")

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
- FR64: System blocks paid AI generation features (detailed match, cover letter, outreach, chat) when user has no remaining balance
- FR65: System displays "upgrade coming soon" message when user is out of paid credits
- FR66: System blocks auto match analysis when free tier user exceeds daily limit (20/day)

**Extension Sidebar Experience (14):**
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

### NonFunctional Requirements

**Performance - Response Times (7):**
- NFR1: Page scan completes within 2 seconds on standard job boards
- NFR2: AI generation (cover letter, outreach, chat messages) completes within 5 seconds
- NFR3a: Auto match analysis completes within 2 seconds of successful scan
- NFR3b: Detailed match analysis completes within 5 seconds of user request
- NFR4: Autofill executes within 1 second
- NFR5: Sidebar opens within 500ms of user click
- NFR6: Resume parsing completes within 10 seconds of upload
- NFR6a: AI generation endpoints (cover letter, outreach, chat, coach) deliver responses via streaming (Server-Sent Events) with progressive text reveal and a user-accessible cancel option
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

### Additional Requirements

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
- SSE streaming for generative endpoints (cover letter, outreach, chat, coach) with cancel option
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
- 4-state sidebar model (Logged Out, Non-Job Page, Job Detected, Full Power)
- Sidebar tabs: 4 main (Scan | AI Studio | Autofill | Coach) + AI Studio has 4 sub-tabs (Match | Cover Letter | Chat | Outreach)
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

### FR Coverage Map

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
| FR31-FR35 | EXT.8 + API.2 | AI Studio Chat: UI (EXT.8), backend endpoint (API.2) |
| FR36-FR37, FR36a-c | EXT.7 | Outreach: generate, tone, length, instructions, regenerate |
| FR37a-FR37f | EXT.12 + API.4 | Coach: UI (EXT.12), prompt templates (API.4), backend via shared chat endpoint (API.2) |
| FR38-FR41 | EXT.7, EXT.8 | Common AI: edit output, ephemeral, copy, visual feedback |
| FR42-FR47 | EXT.9 | Autofill: preview, fill, undo, resume upload, cover letter |
| FR48-FR49 | EXT.5 | Save job from extension, auto "Applied" status |
| FR50-FR56 | WEB | Job tracking dashboard (Dashboard) |
| FR57-FR60 | EXT.10 | Balance view, tier status, initial credits |
| FR60a-b, FR66 | EXT.10 | Daily auto match limits |
| FR61-FR62 | POST-MVP | Subscription management |
| FR63 | POST-MVP | Referral credits |
| FR64-FR65 | EXT.10 | Credit blocking, upgrade message |
| FR67-FR67b | EXT.3 | Sidebar tabs (4 main + AI Studio sub-tabs) |
| FR68-FR69b | EXT.3 | Sidebar states (Logged Out, Non-Job Page, Job Detected, Full Power), unlock conditions |
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
| CHAT-01 | API.2 | Build `POST /v1/ai/chat` endpoint |
| CHAT-02 | API.2 | Chat AI prompt template |
| COACH-01 | API.4 | Coach AI prompt template (strategic/advisory) |
| COACH-02 | API.4 | Match-analysis-based coaching prompt generation |
| AI-01 | API.5 | Remove `/v1/ai/answer` dead endpoint |

**100% FR coverage. Zero gaps. Backend tech debt mapped to Epic API.**

---

## Component Development Methodology

> **PERSISTENT GUIDANCE — applies to ALL stories in Epic EXT.**
> Every story writer and dev agent MUST follow these rules. Do not deviate without user approval.

### Build Order: Atomic → Composite → Feature

Every story follows this iterative build sequence. Start with the smallest pieces and compose upward:

1. **Audit** — Check `_reference/` for original demos and current `@jobswyft/ui` components
2. **Primitives First** — Ensure shadcn primitives have the right variants (Button sizes, Badge colors, Input states)
3. **Building Blocks** — Build small reusable compositions from primitives (e.g., CreditBar = Progress + Badge + Button)
4. **Feature Components** — Assemble feature-level components from primitives + blocks (e.g., JobCard = Card + Badge + SkillPill + MatchIndicator)
5. **Storybook Verify** — Every component gets stories, tested in dark + light at 360×600
6. **User Verify** — Present to user before proceeding to extension integration
7. **Extension Integrate** — Wire into WXT side panel with Zustand state management
8. **Backend Wire** — Connect to existing API endpoints (build new ones if gaps found)
9. **E2E Verify** — Complete flow works: UI → Extension → API → Database → UI update

### Component Directory Structure

```
packages/ui/src/components/
├── ui/              # shadcn primitives (installed via CLI, minimal customization)
│                    # Button, Card, Badge, Input, Tabs, Dialog, Select, etc.
│
├── blocks/          # Small reusable building blocks — domain-specific but generic
│                    # IconBadge, SkillPill, SelectionChips, CreditBar,
│                    # MatchIndicator, SkillSectionLabel, CreditBalance
│
├── features/        # Feature-level compositions — assembled from ui/ + blocks/
│                    # JobCard, ResumeCard, AiStudio, Coach, Autofill,
│                    # LoggedOutView, FeedbackForm
│
├── layout/          # Shell, navigation, page-level wrappers
│                    # ExtensionSidebar, AppHeader
│
└── _reference/      # Original Storybook demos (READ-ONLY, will be deleted)
                     # Moved here during EXT.2 cleanup — used as visual reference only
```

| Category | Directory | When to Use | Import Pattern |
|----------|-----------|-------------|----------------|
| **Primitives** | `ui/` | Base interactive elements from shadcn | `import { Button } from '@jobswyft/ui'` |
| **Building Blocks** | `blocks/` | Reusable domain pieces, used in 2+ features | `import { SkillPill } from '@jobswyft/ui'` |
| **Features** | `features/` | Complete feature panels, one per sidebar section | `import { JobCard } from '@jobswyft/ui'` |
| **Layout** | `layout/` | Page/shell-level wrappers, sidebar chrome | `import { AppHeader } from '@jobswyft/ui'` |
| **Reference** | `_reference/` | NEVER import. Visual reference only during migration | N/A — delete after migration |

### Design Language Rules (ALL Components)

These are NON-NEGOTIABLE for every component in every story:

1. **Zero hardcoded colors** — No `bg-gray-*`, `text-slate-*`, `text-blue-*`. ALL colors from `globals.css` semantic tokens
2. **Dark + Light mode** — Every component tested in both themes. Use semantic tokens that auto-switch
3. **Size tokens** — Use `size-X` not `h-X w-X` (e.g., `size-8` not `h-8 w-8`)
4. **Text micro** — Use `.text-micro` CSS utility for 10px text, never `text-[10px]`
5. **Accent card pattern** — `border-2 border-card-accent-border` (border-2 required to show over shadcn ring-1)
6. **Gradient header pattern** — `bg-gradient-to-r from-card-accent-bg to-transparent`
7. **Scrollbar pattern** — `.scrollbar-hidden` + `.scroll-fade-y` CSS utilities for scroll areas
8. **Icon sizing** — Lucide icons via `size` prop or consistent `size-X` className
9. **Font** — Figtree Variable (loaded via globals.css, never override)
10. **Color space** — OKLCH (configured in globals.css `:root` and `.dark` blocks)

### Variant Pattern (CVA)

Every component with visual variants uses class-variance-authority:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const myComponentVariants = cva("base-classes-here", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
})

interface MyComponentProps extends VariantProps<typeof myComponentVariants> {
  // additional props
}
```

### Storybook Pattern

Every component MUST have stories following this structure:

- **Default** — All variants displayed in a grid/row
- **Sizes** — All size variants if applicable
- **States** — Loading, error, empty, disabled where applicable
- **Extension Viewport** — Rendered at 360×600 viewport
- **Dark Mode** — Only if visual differences go beyond automatic token swap

### Extension Integration Pattern

When integrating a component into the extension:

1. Import from `@jobswyft/ui` — NEVER recreate components locally
2. Create Zustand store for the feature domain if state management needed
3. Use `chrome.storage.local` for persistence across sessions
4. Wire API calls through a shared `api-client.ts` helper
5. Handle loading/error/offline states at the integration point
6. Test in Chrome Side Panel with real data

### Backend Integration Rules

1. **Check existing endpoints first** — 36 API endpoints already exist (10 routers)
2. **If endpoint exists** — Wire directly, document any response shape mismatches
3. **If endpoint missing** — Build it following architecture patterns (envelope, error codes, Pydantic models)
4. **API gaps** — Document in story's "Tech Debt" section for tracking
5. **Snake → camelCase** — Use existing mappers from `@jobswyft/ui` (`mapResumeResponse`, `mapJobResponse`, etc.)

### Cross-Story Learning Protocol

> **MANDATORY for every story.** Dev agents MUST follow this protocol at the end of each story.

**1. Pattern Extraction → globals.css**

After completing any story, the dev agent must audit the components built and:
- Extract any repeated color, spacing, animation, or typography pattern into a CSS utility in `globals.css`
- If a Tailwind utility is used 3+ times in a specific combination, create a CSS class for it
- Document the new utility in the story's dev notes AND update the [Design Language Rules](#design-language-rules-all-components) list above
- Example: if `flex items-center gap-1.5 text-micro text-muted-foreground` appears in multiple components, extract to `.meta-label` in globals.css

**2. Story Learnings → Architecture File**

Each completed story MUST append learnings to `_bmad-output/planning-artifacts/architecture.md` in a dedicated section:

```markdown
## Implementation Learnings (Appended Per Story)

### EXT.X: [Story Title]
- **Pattern discovered:** [description]
- **Architecture impact:** [what changed or should change]
- **Reusable for:** [which future stories benefit]
```

Types of learnings to capture:
- Chrome extension API gotchas (permissions, messaging, storage limits)
- Component composition patterns that worked well
- API response shape mismatches requiring mapper updates
- Performance observations (bundle size, load time)
- State management patterns (Zustand store structure, persistence strategy)
- Content script ↔ Side Panel communication patterns

**3. User Preference Tracking**

When the user provides feedback on component design (colors, spacing, layout, behavior), the dev agent must:
- Implement the preference immediately
- Document it in the story's dev notes
- If it's a generalizable preference, add it to [Design Language Rules](#design-language-rules-all-components) above
- Update `MEMORY.md` user preferences section

### Backend Tech Debt Registry

> Tech debt discovered during extension stories is tracked in a centralized file that feeds into future epic creation.

**Location:** `_bmad-output/implementation-artifacts/backend-tech-debt.md`

**Format:**
```markdown
# Backend Tech Debt Registry

## From Story EXT.X: [Title]

| ID | Description | Priority | Affects Stories | Status |
|----|-------------|----------|-----------------|--------|
| AREA-NN | What needs to change | High/Med/Low | EXT.Y, WEB.Z | Open/Done |
```

**Rules:**
1. Every story that identifies a backend gap MUST add it to this file
2. Items are prefixed by area: AUTH-, RESUME-, JOB-, AI-, MATCH-, CHAT-, AUTOFILL-, USAGE-, FEEDBACK-
3. Priority reflects impact on user experience (High = blocks E2E flow, Med = degraded experience, Low = nice-to-have)
4. When starting a new epic (e.g., Epic WEB), the tech debt registry is reviewed first
5. High-priority items should be resolved within the current epic if possible
6. The registry is the **single source of truth** for API gaps — do not duplicate in story files

**Current known debt (from EXT.1 + story planning):**

| ID | Description | Priority | Affects | Status |
|----|-------------|----------|---------|--------|
| AUTH-01 | Verify token exchange flow works E2E (extension → API) | High | EXT.3 | Open |
| AUTH-04 | Profile auto-creation on first login — verify 5 free credits | High | EXT.3 | Open |
| MATCH-01 | `/v1/ai/match` needs `match_type` param (auto vs detailed) | High | EXT.6 | Open |
| MATCH-02 | Daily auto-match rate limiting for free tier (20/day) | High | EXT.6, EXT.10 | Open |
| AI-01 | Remove `/v1/ai/answer` endpoint (PRD removed Answer tool) | Medium | EXT.7 | Open |
| CHAT-01 | Build `POST /v1/ai/chat` endpoint (does not exist) | High | EXT.8 | Open |
| CHAT-02 | AI prompt template for job-context chat | High | EXT.8 | Open |
| FEEDBACK-01 | Screenshot attachment support (FR84a) | Low | EXT.11 | Open |
| COACH-01 | AI prompt template for coaching context (strategic/advisory tone, different from chat) | High | EXT.12 | Open |
| COACH-02 | Match-analysis-based coaching prompt generation (FR37f) | Medium | EXT.12 | Open |
| COACH-03 | Shared ChatPanel base component — Coach + AI Studio Chat share UI with different styling | Medium | EXT.8, EXT.12 | Open |

---

### Known API State (as of EXT.1 completion)

| Router | Endpoints | Status |
|--------|-----------|--------|
| Auth | 5 (login, callback, logout, me, account delete) | Implemented |
| Resumes | 5 (upload, list, get, set active, delete) | Implemented |
| Jobs | 8 (scan, create, list, get, update, status, delete, notes) | Implemented |
| AI | 5 (match, cover-letter, cover-letter/pdf, answer, outreach) | Implemented (needs: chat endpoint with SSE streaming, remove answer, auto-match vs detailed-match param, SSE streaming for cover-letter/outreach) |
| Autofill | 1 (data) | Implemented |
| Feedback | 1 (submit) | Implemented |
| Usage | 2 (balance, history) | Implemented |
| Subscriptions | 3 (checkout, portal, mock-cancel) | Implemented |
| Privacy | 4 (data-summary, delete-request, confirm-delete, cancel-delete) | Implemented |
| Webhooks | 1 (stripe) | Stub |

**Known gaps → tracked in Epic API:**
- `POST /v1/ai/chat` → **API.2** — Missing. Needs SSE streaming + `context_type` param (chat vs coach)
- Auto-match vs Detailed match → **API.3** — `/v1/ai/match` needs `match_type` param + daily rate limiting
- `/v1/ai/answer` → **API.5** — Remove dead endpoint (PRD removed Answer tool)
- SSE streaming → **API.1** (infrastructure) + **API.6** (cover-letter + outreach migration)
- Coach prompt templates → **API.4** — Strategic/advisory tone, match-analysis-based prompts

---

## Epic List

### Epic 8: Deployment & Infrastructure (COMPLETE)

Deploy all Jobswyft surfaces to their production hosting platforms.

**Epic Goal:** All Jobswyft services are deployed and accessible on production URLs.

**Stories:**
- Story 8.1: Railway API Deployment (DONE)
- _(subsequent: Vercel Dashboard deploy, Extension packaging — future)_

---

### Epic EXT: Chrome Extension Sidepanel Build (Full-Stack Vertical Slices)

Build the Chrome Extension surface end-to-end, one sidepanel section at a time. Each story delivers a **complete vertical slice**: UI components (Storybook) → Extension integration (WXT + Zustand) → Backend wiring (API) → E2E verification.

**Epic Goal:** Users can install and use the Jobswyft Chrome Extension with full UI/UX across all 4 sidebar states — login, navigation, resume management, job scanning, AI-powered content generation, form autofill, usage tracking, and feedback — with complete backend API integration.

**FRs covered:** FR1-FR4, FR7-FR49, FR37a-FR37f, FR57-FR60, FR60a-b, FR64-FR72d, FR83-FR84a

**Surfaces:** packages/ui (Storybook), apps/extension (WXT Side Panel), apps/api (FastAPI)

**Story approach:** All stories defined upfront. Each follows the [Component Development Methodology](#component-development-methodology).

**Stories (12 total, 1 done):**

| # | Story | User Value | Status |
|---|-------|------------|--------|
| EXT.1 | WXT Extension Setup & Login | Users can install extension and sign in with Google | DONE |
| EXT.2 | Component Library Reorganization | Clean foundation: proper categories, reference separation, consistent patterns | Pending |
| EXT.3 | Authenticated Navigation & Sidebar Shell | Users can navigate the 4-tab sidebar with state preservation | Pending |
| EXT.4 | Resume Management | Users can upload, view, and manage resumes in the sidebar | Pending |
| EXT.5 | Job Page Scanning & Job Card | Users can scan job pages and save jobs | Pending |
| EXT.6 | Match Analysis (Auto + Detailed) | Users can instantly see how they match a job | Pending |
| EXT.7 | AI Studio — Cover Letter & Outreach | Users can generate tailored application content (SSE streaming) | Pending |
| EXT.8 | AI Studio — Chat | Users can ask questions about a job posting (AI Studio sub-tab) | Pending |
| EXT.9 | Form Autofill | Users can auto-fill application forms | Pending |
| EXT.10 | Usage, Credits & Upgrade Prompts | Users can see their balance and understand limits | Pending |
| EXT.11 | Feedback | Users can report issues and share ideas | Pending |
| EXT.12 | Coach Tab | Users get personalized AI coaching for the current job | Pending |

**Dependencies:**
```
EXT.1 (DONE) → EXT.2 (cleanup) → EXT.3 (navigation, auth store, state preservation)
                                     ↓
                                  EXT.4 (resume) → EXT.5 (scan + job card)
                                                      ↓
                                                   EXT.6 (match) → EXT.7 (cover letter + outreach, SSE streaming)
                                                                 → EXT.8 (AI Studio chat sub-tab, SSE streaming)
                                                                 → EXT.9 (autofill)
                                                                 → EXT.12 (coach standalone tab, SSE streaming)
                                                   EXT.10 (credits — cross-cutting, retrofits into EXT.6-9, EXT.12)
                                                   EXT.11 (feedback — standalone)
```

---

### Epic API: Backend API Enhancements (Parallel with EXT)

Deliver all backend API changes discovered during Chrome Extension development. Each story addresses a gap identified in Epic EXT stories, enabling frontend stories to proceed with mocked responses while real endpoints are built in parallel.

**Epic Goal:** All API endpoints required by the Chrome Extension are production-ready — SSE streaming infrastructure, new chat/coach endpoints, match parameter additions, rate limiting, and dead endpoint cleanup.

**Surfaces:** apps/api (FastAPI), supabase/migrations (if schema changes needed)

**Relationship to Epic EXT:** Epic API runs **in parallel** with Epic EXT. Frontend stories mock API responses; when an API story ships, the corresponding EXT story wires to the real endpoint. Tech debt items from EXT stories feed directly into API stories.

**Stories (initial — grows as EXT stories discover gaps):**

| # | Story | Source Tech Debt | Unblocks | Priority |
|---|-------|-----------------|----------|----------|
| API.1 | SSE Streaming Infrastructure | NFR6a | EXT.7, EXT.8, EXT.12 | High |
| API.2 | Chat Endpoint (`POST /v1/ai/chat`) | CHAT-01, CHAT-02 | EXT.8, EXT.12 | High |
| API.3 | Match Type Param + Daily Rate Limiting | MATCH-01, MATCH-02 | EXT.6, EXT.10 | High |
| API.4 | Coach Prompt Templates | COACH-01, COACH-02 | EXT.12 | High |
| API.5 | Remove `/v1/ai/answer` Endpoint | AI-01 | EXT.7 (cleanup) | Medium |
| API.6 | SSE Migration — Cover Letter + Outreach | NFR6a | EXT.7 | Medium |
| *More discovered during EXT development* | | | |

**Dependencies:**
```
API.1 (SSE infra) → API.2 (chat endpoint, uses SSE)
                   → API.6 (cover-letter + outreach SSE migration)
API.2 → API.4 (coach prompts, extends chat endpoint with context_type)
API.3 (match params) — standalone
API.5 (remove /answer) — standalone
```

**FRs covered:** FR31-FR35 (backend), FR37a-FR37f (backend), NFR6a-NFR6b (streaming)

---

### Epic WEB: Web Dashboard (Future)

Build the Next.js web dashboard for job tracking, account management, and privacy controls.

**Epic Goal:** Users can manage their jobs, resumes, account, and data privacy from a web dashboard.

**FRs covered:** FR3, FR5-6, FR50-56, FR73-77, FR78-82, FR85

---

### Epic POST-MVP: Subscriptions & Growth (Future)

Add paid subscription management and referral credits.

**Epic Goal:** Users can subscribe to paid plans, manage billing, and earn referral credits.

**FRs covered:** FR61-62, FR63, NFR27-29, NFR33

---

## Story EXT.1: WXT Extension Setup & Login (COMPLETE)

**Status:** DONE (reviewed, verified end-to-end)

**Implementation artifact:** `_bmad-output/implementation-artifacts/EXT-1-wxt-extension-setup-ui-integration-login.md`

**FRs addressed:** FR1, FR67, FR68, FR69 (Logged Out state)

**Key learnings (inform all future stories):**
- Chrome Side Panel API, not Shadow DOM content script
- Web Application OAuth client type (not Chrome Extension type)
- Tailwind v4 `@source` directive in `app.css` to scan `@jobswyft/ui/src`
- Lazy Supabase client initialization (avoid module-level crash)
- `action` key required in manifest for `onClicked`
- `panelClassName` override for ExtensionSidebar in Side Panel context

**Tech debt identified:**
- AUTH-01: `POST /v1/auth/google` (exchange token) — API has `/v1/auth/login` + `/callback`
- AUTH-02: `GET /v1/auth/me` (verify auth) — API has this
- AUTH-03: `POST /v1/auth/logout` (invalidate session) — API has this
- AUTH-04: Profile auto-creation on first login — Needs verification

---

## Story EXT.2: Component Library Reorganization

**As a** developer working on Jobswyft,
**I want** a properly organized component library with clear categories and reference separation,
**So that** every future story follows consistent patterns and builds on a clean foundation.

**FRs addressed:** None (infrastructure/DX story — enables all subsequent stories)

### Component Inventory

**Current state:** 14 custom components in flat `components/custom/` directory.

**Target state:**

| Category | Directory | Components to Move |
|----------|-----------|--------------------|
| **Blocks** | `components/blocks/` | IconBadge, SkillPill, SelectionChips, CreditBar, CreditBalance, MatchIndicator, SkillSectionLabel |
| **Features** | `components/features/` | JobCard, ResumeCard, AiStudio, Coach, Autofill, LoggedOutView |
| **Layout** | `components/layout/` | ExtensionSidebar, AppHeader |
| **Reference** | `components/_reference/` | Copy of ALL originals before reorganization (read-only) |

### Acceptance Criteria

**Given** 14 custom components exist in `components/custom/`
**When** the developer runs the reorganization
**Then** all original component files are copied to `components/_reference/` as read-only reference
**And** the `_reference/` directory has a README noting these are original demos, not to be imported

**Given** components are being reorganized
**When** the developer moves components to their new directories
**Then** `components/blocks/` contains: IconBadge, SkillPill, SelectionChips, CreditBar, CreditBalance, MatchIndicator, SkillSectionLabel
**And** `components/features/` contains: JobCard, ResumeCard, AiStudio, Coach, Autofill, LoggedOutView
**And** `components/layout/` contains: ExtensionSidebar, AppHeader
**And** the old `components/custom/` directory is removed

**Given** components have been reorganized
**When** `packages/ui/src/index.ts` is updated
**Then** all exports resolve correctly from the new paths
**And** `import { Button, JobCard, AppHeader, SkillPill } from '@jobswyft/ui'` still works

**Given** the reorganization is complete
**When** `pnpm storybook` is run
**Then** all 21 story files render correctly (story imports updated to new paths)
**And** stories are organized under groups matching the directory structure

**Given** the reorganization is complete
**When** `pnpm build` is run from `packages/ui/`
**Then** the library builds successfully
**And** the extension at `apps/extension/` builds without errors
**And** all component imports in the extension still resolve

### Developer Notes

- Story files (`*.stories.tsx`) move WITH their components to the new directories
- NO component logic changes in this story — only file moves and import path updates
- The `_reference/` components are a safety net during migration; each future story may consult them for original behavior/design intent
- After all EXT stories complete, `_reference/` will be deleted in a final cleanup

---

## Story EXT.3: Authenticated Navigation & Sidebar Shell

**As a** logged-in user,
**I want** to see a navigation bar and tabbed sidebar after signing in,
**So that** I can access all extension features and navigate between sections.

**FRs addressed:** FR2 (sign out), FR4 (session persistence), FR67 (open sidebar), FR67a (4-tab structure), FR67b (AI Studio sub-tabs), FR68 (close sidebar), FR69 (4-state sidebar: Logged Out, Non-Job Page, Job Detected, Full Power), FR69a (AI Studio + Coach unlock on job detection + credits), FR69b (Autofill on form page), FR70 (resume tray slot), FR71 (AI locked until scan + credits), FR72 (dashboard link), FR72a (job URL change reset), FR72b (non-job page preserves context), FR72c (manual reset button), FR72d (tab state preservation)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `AppHeader` | `layout/` | Has theme toggle, settings dropdown, sign out. Wire real callbacks |
| Existing | `ExtensionSidebar` | `layout/` | Has tabs (scan/studio/autofill/coach), isLocked, creditBar. Wire real state |
| New | `AuthenticatedLayout` | Extension `components/` | Wraps AppHeader + ExtensionSidebar for logged-in state |
| New | Zustand `auth-store` | Extension `stores/` | Session state, user profile, persist to chrome.storage |
| New | Reset button | In `AppHeader` | Ghost button, refresh icon `size-4`, triggers FR72c manual reset |
| New | State preservation logic | Extension `hooks/` | `useStatePreservation` — handles FR72a-d (job switch, non-job page, manual reset, tab persistence) |
| Modified | `sidebar-app.tsx` | Extension `components/` | Route between LoggedOutView ↔ AuthenticatedLayout |

### Acceptance Criteria

**Given** the user has completed Google OAuth sign-in (EXT.1)
**When** the sidebar re-renders after successful auth
**Then** the `AuthenticatedLayout` renders with AppHeader at top and ExtensionSidebar below
**And** the AppHeader shows the app name, theme toggle, and settings dropdown
**And** the ExtensionSidebar shows tabs: Scan, AI Studio, Autofill, Coach

**Given** the user closes and re-opens the sidebar (or restarts Chrome)
**When** the sidebar initializes
**Then** auth state is restored from `chrome.storage.local`
**And** `GET /v1/auth/me` validates the stored session
**And** valid session → authenticated layout renders immediately
**And** invalid/expired session → LoggedOutView renders (tokens cleared)

**Given** the user clicks "Sign Out" in the AppHeader settings dropdown
**When** sign out is triggered
**Then** `POST /v1/auth/logout` is called
**And** Zustand auth store is cleared
**And** `chrome.storage.local` session data is removed
**And** sidebar returns to LoggedOutView

**Given** the user is authenticated but NOT on a job page
**When** the sidebar renders
**Then** the sidebar is in "Non-Job Page" state
**And** Scan tab shows empty/placeholder state ("Navigate to a job posting" + "Or paste a job description" link)
**And** AI Studio, Autofill, and Coach tabs show locked state (`isLocked=true`) — all require job detection + credits
**And** Resume tray is accessible for resume management

**Given** the user navigates to a new job page (different URL)
**When** auto-scan detects the new job
**Then** sidebar resets: job data, match data, AI Studio outputs, and chat history are cleared
**And** resume selection, auth session, and credits are preserved (FR72a)

**Given** the user navigates from a job page to a non-job page (Gmail, Google Docs, etc.)
**When** the page context changes
**Then** sidebar preserves the last job context — user can continue working with previous job data (FR72b)

**Given** the user clicks the reset button in the AppHeader
**When** the reset action triggers
**Then** job data, match data, AI Studio outputs, and chat are cleared
**And** resume, auth, credits, and settings are preserved (FR72c)
**And** sidebar returns to "Non-Job Page" / waiting state
**And** no confirmation dialog (low-stakes, easily re-scanned)

**Given** the user switches between sidebar tabs (Scan → Coach → Scan)
**When** tab content re-renders
**Then** each tab preserves its state within the session (FR72d)
**And** switching back to Scan does not re-trigger scan
**And** switching back to Coach preserves conversation

**Given** the user clicks the theme toggle in AppHeader
**When** theme switches between dark and light
**Then** `.dark` class is toggled on `<html>` element
**And** preference is persisted to `chrome.storage.local`
**And** all components re-render with correct theme tokens

**Given** the user clicks "Dashboard" in the settings dropdown
**When** the link is activated
**Then** a new tab opens to the web dashboard URL

**Given** the CreditBar is rendered at the bottom of ExtensionSidebar
**When** the sidebar loads
**Then** the CreditBar displays with placeholder data (credits: 5, maxCredits: 5)
**And** real credit data will be wired in EXT.10

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/auth/me` | GET | Validate session, get user profile | Exists |
| `/v1/auth/logout` | POST | Invalidate server session | Exists |

---

## Story EXT.4: Resume Management

**As a** job seeker,
**I want** to upload, view, and manage my resumes in the sidebar,
**So that** I can quickly select the right resume for each application.

**FRs addressed:** FR7 (upload PDF), FR8 (AI parse), FR9 (max 5), FR10 (active resume), FR11 (view list), FR12 (delete), FR13 (switch resumes), FR13a (expandable blocks), FR13b (expand full content), FR13c (copy to clipboard)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `ResumeCard` | `features/` | Dropdown selector, expandable blocks, copy, upload/delete buttons. Very complete |
| New | Zustand `resume-store` | Extension `stores/` | Resume list, active resume ID, parsed data, persist to chrome.storage |
| New | Upload progress UI | Within ResumeCard | Progress indicator during upload + parse |
| Modified | `ExtensionSidebar` | `layout/` | Wire `contextContent` slot with ResumeCard |

### Acceptance Criteria

**Given** the user is authenticated and the sidebar is open
**When** the sidebar loads
**Then** `GET /v1/resumes` is called to fetch the user's resume list
**And** the ResumeCard renders in the context section (above tabs) with the resume dropdown
**And** the active resume is pre-selected in the dropdown

**Given** the user has no resumes uploaded
**When** the ResumeCard renders
**Then** an empty state is shown with an upload prompt
**And** the upload button is prominently displayed

**Given** the user clicks "Upload Resume"
**When** the file picker opens and they select a PDF (≤10MB)
**Then** the file is uploaded via `POST /v1/resumes` (multipart/form-data)
**And** a progress indicator shows during upload and AI parsing
**And** on success, the resume appears in the dropdown and parsed data loads
**And** on failure (invalid format, too large, limit reached), an error message displays

**Given** the user has resumes in their list
**When** they select a different resume from the dropdown
**Then** `PUT /v1/resumes/:id/active` is called
**And** the active resume indicator updates
**And** parsed data for the newly selected resume loads (from `GET /v1/resumes/:id`)

**Given** a resume is selected with parsed data
**When** the user views the ResumeCard
**Then** expandable sections show: Personal Info, Skills, Experience, Education, Certifications, Projects
**And** sections are collapsed by default (`isCompact=true`)
**And** clicking a section header expands it to show full content

**Given** the user clicks the copy button on a resume block section
**When** the copy action executes
**Then** the section content is copied to clipboard
**And** visual "Copied!" feedback appears momentarily

**Given** the user clicks "Delete" on a resume
**When** the confirmation dialog appears and user confirms
**Then** `DELETE /v1/resumes/:id` is called
**And** the resume is removed from the list
**And** if the deleted resume was active, the first remaining resume becomes active
**And** if no resumes remain, the empty state renders

**Given** the user already has 5 resumes
**When** they try to upload another
**Then** the upload is blocked with message "Maximum 5 resumes. Delete one to upload more."

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/resumes` | POST | Upload + parse resume | Exists |
| `/v1/resumes` | GET | List user's resumes | Exists |
| `/v1/resumes/:id` | GET | Get resume detail + parsed data | Exists |
| `/v1/resumes/:id/active` | PUT | Set active resume | Exists |
| `/v1/resumes/:id` | DELETE | Delete resume | Exists |

### Data Mapping

Use existing mapper: `mapResumeResponse()` from `@jobswyft/ui` for snake_case → camelCase transformation.

---

## Story EXT.5: Job Page Scanning & Job Card

**As a** job seeker browsing job postings,
**I want** the extension to detect and scan job pages automatically,
**So that** I can see job details and save jobs without copy-pasting.

**FRs addressed:** FR14 (auto-scan), FR14a (URL patterns), FR14b (manual entry with paste-job-description fallback), FR15-FR18 (field extraction), FR19 (ephemeral questions), FR21 (manual edit), FR22 (missing field indicators), FR48 (save job), FR49 (auto "Applied" status)

**Deferred:** FR20 (element picker for field correction) — deferred to post-MVP. Manual inline editing (FR21) covers 90% of the use case.

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `JobCard` | `features/` | Job data display, edit mode, metadata badges, action buttons |
| New | Content script `job-detector.ts` | Extension `features/scanning/` | URL pattern matching for job boards |
| New | Content script `scanner.ts` | Extension `features/scanning/` | DOM extraction (rules + AI fallback) |
| New | Zustand `scan-store` | Extension `stores/` | Scan state, extracted job data |
| New | `ScanEmptyState` | `blocks/` or inline | Placeholder when no job detected |
| Modified | `ExtensionSidebar` | `layout/` | Wire `scanContent` slot with JobCard / empty state |

### Acceptance Criteria

**Given** the extension is loaded and user is authenticated
**When** the user navigates to a job posting page (LinkedIn, Indeed, Greenhouse, Lever, Workday, etc.)
**Then** the content script detects the page via URL pattern matching
**And** the sidebar state transitions from "Non-Job Page" to "Job Detected"
**And** auto-scan begins: job title, company, description, location, salary, type extracted from DOM

**Given** auto-scan completes successfully
**When** the scan data is sent to the Side Panel via `chrome.runtime.sendMessage`
**Then** the JobCard renders in the Scan tab with extracted data
**And** metadata badges show location, salary, employment type (when available)
**And** missing required fields (title, company, description) are indicated with warning icons

**Given** auto-detection fails on an unknown job site
**When** the user sees the scan empty state
**Then** a "Scan This Page" manual trigger button is displayed
**And** an "Or paste a job description" link is shown for manual entry fallback (FR14b)
**And** clicking manual trigger attempts AI-powered DOM extraction as fallback
**And** clicking paste link opens edit mode with textarea for full job description paste

**Given** the JobCard is displaying scanned data
**When** the user clicks an editable field (or enters edit mode)
**Then** the field becomes editable inline
**And** the user can correct extracted data directly
**And** changes are reflected in the scan store (ephemeral, not persisted until saved)

**Given** a successful scan with complete data
**When** the user clicks "Save Job"
**Then** `POST /v1/jobs/scan` is called with the extracted job data
**And** the job is saved with status "Applied"
**And** visual confirmation shown (checkmark or toast)

**Given** a scan is in progress
**When** the content script is extracting data
**Then** a loading skeleton/spinner shows in the Scan tab
**And** scan errors show a retry option with error message

**Given** the content script needs to communicate with the Side Panel
**When** messages are sent via `chrome.runtime`
**Then** the Side Panel receives scan data and updates the scan-store
**And** the background service worker relays messages between content script and side panel

### Content Script Architecture

```
Content Script (injected per page)
  ├── job-detector.ts — URL patterns: linkedin.com/jobs, indeed.com/viewjob, greenhouse.io, etc.
  ├── scanner.ts — DOM extraction rules per board + AI fallback
  └── Communicates via chrome.runtime.sendMessage → Background → Side Panel
```

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/jobs/scan` | POST | Save scanned job data | Exists |

### Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **SCAN-01** | Element picker for manual field correction (FR20) — **DEFERRED to post-MVP**. Manual inline editing (FR21) covers primary use case | Low (Post-MVP) |
| **SCAN-02** | Application question extraction (FR19) — ephemeral, needs content script intelligence | Low |

---

## Story EXT.6: Match Analysis (Auto + Detailed)

**As a** job seeker viewing a scanned job,
**I want** to instantly see how well I match and optionally get deeper analysis,
**So that** I can decide whether to apply and know what to highlight.

**FRs addressed:** FR23 (auto match on scan), FR23a (free with rate limits), FR23b (score + skill indicators), FR23c (side-by-side layout), FR24 (detailed match — 1 credit), FR25 (comprehensive analysis)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `MatchIndicator` | `blocks/` | Score ring (green/yellow/red). Props: `score`, `showLabel` |
| Existing | `SkillPill` | `blocks/` | Matched (green), missing (dashed), neutral. Props: `name`, `variant` |
| Existing | `SkillSectionLabel` | `blocks/` | Section header with dot. Props: `label`, `variant` (success/warning) |
| Existing | `JobCard` | `features/` | Has match area. Props: `match: { score, matchedSkills, missingSkills }` |
| New | `DetailedMatchView` | `features/` or inline in JobCard | Expanded analysis: strengths, gaps, recommendations |
| Modified | `JobCard` | `features/` | Ensure match area renders auto-match data; add "Detailed Analysis" button |

### Acceptance Criteria

**Given** a job page has been successfully scanned (EXT.5)
**When** the scan completes and an active resume is selected
**Then** auto-match fires automatically: `POST /v1/ai/match` with `match_type=auto`
**And** the match result renders within the JobCard: MatchIndicator (score), SkillPills (green matched, yellow missing), side-by-side via SkillSectionLabels

**Given** auto-match is loading
**When** the API call is in progress
**Then** a subtle loading indicator appears in the match area of JobCard
**And** the rest of the JobCard (title, company, description) is already visible

**Given** auto-match results are displayed
**When** the user wants deeper analysis
**Then** a "Detailed Analysis" button is visible (with "1 credit" label)
**And** clicking it calls `POST /v1/ai/match` with `match_type=detailed`
**And** the detailed view expands below with comprehensive strengths, gaps, and actionable recommendations

**Given** the user is on free tier
**When** they have used 20 auto-matches today
**Then** auto-match is blocked with message "Daily limit reached (20/day). Upgrade for unlimited."
**And** the match area shows the blocked state

**Given** the user has 0 AI credits
**When** they click "Detailed Analysis"
**Then** the action is blocked with "No credits remaining" message
**And** the "Upgrade coming soon" prompt is shown

**Given** the match API call fails
**When** an error occurs
**Then** the match area shows an error state with "Retry" button
**And** user's credits are NOT deducted (NFR24)

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/match` | POST | Generate match analysis | Exists — needs `match_type` param (auto/detailed) |

### Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **MATCH-01** | Update `POST /v1/ai/match` to accept `match_type` parameter (auto = free, detailed = 1 credit) | High |
| **MATCH-02** | Backend daily auto-match rate limiting for free tier (20/day per user) | High |

---

## Story EXT.7: AI Studio — Cover Letter & Outreach

**As a** job seeker ready to apply,
**I want** to generate a tailored cover letter and outreach messages,
**So that** my applications stand out and I can network with hiring managers.

**FRs addressed:** FR26 (generate cover letter), FR26a (length selector), FR27 (tone selector), FR28 (custom instructions), FR29 (regenerate with feedback), FR30 (PDF export), FR36 (generate outreach), FR36a (outreach tone), FR36b (outreach length), FR36c (outreach custom instructions), FR37 (regenerate outreach), FR38 (edit output), FR39 (ephemeral), FR40 (copy to clipboard), FR41 (copy visual feedback)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `AiStudio` | `features/` | Tabbed card (currently: Match, Cover Letter, Answer, Outreach). Has `onGenerate` callback with params |
| Existing | `SelectionChips` | `blocks/` | Tone/length selectors. Props: `options`, `value`, `onChange` |
| New | `GeneratedOutput` | `blocks/` | Editable textarea with copy button, regenerate button, PDF button |
| Modified | `AiStudio` | `features/` | Replace "Answer" tab with placeholder for Chat (EXT.8). Wire Cover Letter + Outreach tabs |

### Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** the sidebar shows AI Studio
**Then** the `isLocked` state is `false` (unlocked)
**And** sub-tabs show: Match, Cover Letter, Chat, Outreach (FR67b)

**Given** the user selects the Cover Letter tab
**When** the tab renders
**Then** SelectionChips display for tone: Confident, Friendly, Enthusiastic, Professional
**And** SelectionChips display for length: Brief, Standard, Detailed
**And** a custom instructions textarea is available
**And** a "Generate" button is enabled (if credits available)

**Given** the user configures tone/length/instructions and clicks Generate
**When** the generation begins
**Then** `POST /v1/ai/cover-letter` is called with `{ job_id, resume_id, tone, length, custom_instructions }`
**And** SSE streaming begins — text appears progressively with cursor/caret blink at insertion point (NFR6a)
**And** a "Stop generating" cancel button is available throughout streaming
**And** on completion, the full text is displayed in an editable GeneratedOutput component
**And** on failure, error message shows and credit is NOT deducted

**Given** the generated cover letter is displayed
**When** the user interacts with the output
**Then** they can edit the text inline (textarea)
**And** they can click "Copy" → content copied to clipboard → "Copied!" feedback shows
**And** they can click "Regenerate" → optional feedback input → new generation with context
**And** they can click "Export PDF" → `POST /v1/ai/cover-letter/pdf` → PDF file downloads

**Given** the user selects the Outreach tab
**When** the tab renders
**Then** the same pattern applies: tone selector, length selector (Brief, Standard), custom instructions
**And** Generate → `POST /v1/ai/outreach` with `{ job_id, resume_id, tone, length, custom_instructions }`
**And** SSE streaming with progressive text reveal + cancel option (same as cover letter)
**And** output displayed in GeneratedOutput with edit/copy/regenerate flow

**Given** the user has 0 AI credits
**When** they try to generate
**Then** the Generate button is disabled with "No credits" message
**And** "Upgrade coming soon" prompt is shown

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/cover-letter` | POST | Generate cover letter | Exists |
| `/v1/ai/cover-letter/pdf` | POST | Export as PDF | Exists |
| `/v1/ai/outreach` | POST | Generate outreach message | Exists |

### Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **AI-01** | Remove `/v1/ai/answer` endpoint (PRD removed Answer Generation tool) | Medium |
| **AI-02** | AiStudio component: remove "Answer" tab, restructure to Match / Cover Letter / Outreach | High (done in this story) |

---

## Story EXT.8: AI Studio — Chat

**As a** job seeker with questions about a posting,
**I want** to chat with AI about the job within AI Studio,
**So that** I can get quick answers about the role, requirements, and application strategy.

**FRs addressed:** FR31 (open chat from AI Studio), FR32 (question suggestions), FR33 (ask questions — 1 credit/message), FR34 (conversation history), FR35 (new session)

**Note:** This is the **Chat sub-tab within AI Studio** (FR67b). The standalone **Coach tab** is covered in EXT.12.

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| New | `ChatPanel` | `features/` | Chat UI with message bubbles, input form, streaming response display. Reusable by both AI Studio Chat and Coach (EXT.12) |
| New | `QuestionSuggestions` | `blocks/` | Clickable suggestion chips generated from job data |
| New | Zustand `chat-store` | Extension `stores/` | Messages, session management, credit tracking (separate sessions for Chat vs Coach) |
| Modified | `AiStudio` | `features/` | Add Chat as 3rd sub-tab (Match | Cover Letter | Chat | Outreach) |
| New | Backend `POST /v1/ai/chat` | API `routers/ai.py` | **NEW endpoint — does not exist yet** |

### Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** they open AI Studio and select the Chat sub-tab
**Then** the ChatPanel component renders with an empty message area
**And** question suggestions are displayed based on the current job posting (e.g., "What skills should I highlight?", "Is this role a good fit for my experience?", "What questions should I prepare for the interview?")

**Given** question suggestions are displayed
**When** the user clicks a suggestion chip
**Then** the suggestion text is populated into the message input
**And** the user can edit before sending

**Given** the user types or selects a question and clicks send
**When** the message is submitted
**Then** credit check passes (1 credit available) → `POST /v1/ai/chat` called
**And** user message appears as a bubble in the chat area (`bg-muted`)
**And** AI response streams in progressively via SSE (NFR6a) with cursor/caret blink
**And** "Stop generating" cancel button available during streaming
**And** completed AI response appears as assistant bubble
**And** if credit check fails → "No credits" message shown, message not sent

**Given** a conversation is in progress
**When** the user sends multiple messages
**Then** conversation history is maintained in the chat-store
**And** previous messages provide context to the AI (conversation_history sent with each request)

**Given** the user clicks "New Session"
**When** the action triggers
**Then** conversation history is cleared from the chat-store
**And** the chat area resets to empty with fresh question suggestions

**Given** the user navigates to a different job page
**When** auto-scan detects the new job
**Then** chat history is cleared (FR72a — new job = new conversation context)
**And** new question suggestions generate based on the new job

**Given** an AI response fails
**When** the API returns an error (or SSE `event: error`)
**Then** an error message shows inline ("Failed to get response. Try again.")
**And** the user's credit is NOT deducted (NFR24)

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/chat` | POST | Send message, get streaming AI response | **NEW — must be built** |

**New endpoint spec:**
```
POST /v1/ai/chat
Body: { job_id, resume_id, message, conversation_history: [{role, content}] }
Response: text/event-stream (SSE)
  event: chunk → {"text": "..."}
  event: done → {"credits_remaining": N, "suggestions": [...]}
  event: error → {"code": "...", "message": "..."}
Credits: 1 per message
```

### Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **CHAT-01** | Build `POST /v1/ai/chat` endpoint with SSE streaming + conversation context | High |
| **CHAT-02** | AI prompt template for job-context chat | High |
| **CHAT-03** | Question suggestion generation (can be client-side templates initially, AI-powered later) | Medium |

---

## Story EXT.9: Form Autofill

**As a** job seeker on an application form,
**I want** to auto-fill form fields with my information,
**So that** I can submit applications faster without manual data entry.

**FRs addressed:** FR42 (autofill fields), FR42a (display detected fields), FR42b (review before fill), FR43 (auto-map fields), FR44 (highlight filled), FR44a (tick-off state in sidebar), FR45 (undo), FR46 (resume upload), FR47 (cover letter paste)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `Autofill` | `features/` | Field pills with status, fill/undo buttons. Props: `fields[]`, `isFilling`, `showUndoPrompt`, callbacks |
| New | Content script `autofill.ts` | Extension `features/autofill/` | DOM field detection, mapping, fill execution |
| New | Zustand `autofill-store` | Extension `stores/` | Detected fields, fill state, undo snapshot |
| Modified | `ExtensionSidebar` | `layout/` | Wire `autofillContent` slot |

### Acceptance Criteria

**Given** the user navigates to a job application form page
**When** the content script analyzes the page DOM
**Then** form fields are detected (inputs, textareas, selects, file uploads)
**And** fields are categorized: Personal (name, email, phone, LinkedIn), Resume (file upload), Questions (custom fields)
**And** the sidebar state transitions to "Full Power" (Autofill tab unlocks since form fields are available)

**Given** detected fields are sent to the Side Panel
**When** the Autofill tab renders
**Then** the Autofill component shows detected fields grouped by category
**And** each field shows status: "ready" (data available), "missing" (no data), or "filled" (already has value)
**And** the "Fill Application" button is enabled

**Given** the user reviews fields and clicks "Fill Application"
**When** autofill executes
**Then** personal data is sourced from `GET /v1/autofill/data`
**And** content script fills each mapped field in the page DOM
**And** `isFilling=true` shows progress state in the sidebar
**And** successfully filled fields update to "filled" status with checkmark (tick-off state)
**And** fields are visually highlighted on the page

**Given** autofill has completed
**When** the undo prompt banner appears (`showUndoPrompt=true`)
**Then** the user can click "Undo" to restore all fields to pre-fill values
**And** clicking "Dismiss" hides the undo banner
**And** undo snapshot is stored in the autofill-store

**Given** a file upload field is detected
**When** autofill executes and active resume is available
**Then** the resume PDF is uploaded to the file input field programmatically

**Given** a cover letter field/textarea is detected
**When** autofill executes and a generated cover letter is available (from EXT.7)
**Then** the cover letter text is pasted into the field

### Content Script Architecture

```
Content Script (autofill.ts)
  ├── detectFields() — Scans DOM for form inputs, textareas, selects, file uploads
  ├── mapFields(fields, userData) — Maps detected fields to user data
  ├── fillFields(mappings) — Executes DOM manipulation to fill values
  ├── undoFill(snapshot) — Restores pre-fill values
  └── Communicates via chrome.runtime messaging ↔ Side Panel
```

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/autofill/data` | GET | Get personal data + resume for autofill | Exists |

---

## Story EXT.10: Usage, Credits & Upgrade Prompts

**As a** job seeker using AI features,
**I want** to see my remaining credits and understand my limits,
**So that** I can use my credits wisely and know when to upgrade.

**FRs addressed:** FR57 (view balance), FR58 (daily auto-match remaining), FR59 (tier status), FR60 (5 free credits), FR60a (20 auto-matches/day free), FR60b (unlimited paid), FR64 (block when no balance), FR65 (upgrade message), FR66 (block auto-match at daily limit)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `CreditBar` | `blocks/` | Compact bar with credit count, color-coded. Props: `credits`, `maxCredits`, `onBuyMore` |
| Existing | `CreditBalance` | `blocks/` | Detail card with progress bar. Props: `total`, `used`, `onBuyMore` |
| New | Zustand `usage-store` | Extension `stores/` | Balance, tier, daily counts, refresh logic |
| New | `UpgradePrompt` | `blocks/` | Modal/dialog for "Upgrade coming soon" message |
| New | Credit check interceptor | Extension `lib/` | Shared function that gates AI operations |
| Modified | `CreditBar` | `blocks/` | Wire to real GET /v1/usage data |
| Modified | `CreditBalance` | `blocks/` | Wire to real data, show tier info |

### Acceptance Criteria

**Given** the user is authenticated and sidebar is open
**When** `GET /v1/usage` is called on load
**Then** the CreditBar at the bottom of ExtensionSidebar shows real credit balance
**And** color coding: green (>50%), yellow (20-50%), red (≤20%)

**Given** the user taps the CreditBar
**When** the detail view expands
**Then** CreditBalance shows: tier name (Free/Starter/Pro/Power), credits used, credits remaining, percentage bar
**And** for free tier: "5 lifetime credits" label
**And** for free tier: "X of 20 auto-matches remaining today" counter

**Given** the user tries to use an AI feature (detailed match, cover letter, outreach, chat)
**When** the credit check interceptor runs
**Then** if credits > 0 → allow operation, decrement locally, refresh from API after
**And** if credits = 0 → block with disabled button + "No credits remaining" message
**And** show UpgradePrompt: "Upgrade coming soon — paid plans will unlock unlimited AI features"

**Given** the user is on free tier and tries auto-match
**When** they have used 20 auto-matches today
**Then** auto-match is blocked with "Daily limit reached (20/day)" message
**And** "Upgrade for unlimited auto-matches" prompt shown

**Given** an AI operation completes (success or failure)
**When** the operation callback fires
**Then** `GET /v1/usage` is called to refresh the balance from the server
**And** CreditBar updates with fresh data

**Given** this story retrofits credit checks into previous stories
**When** EXT.6 (match), EXT.7 (cover letter/outreach), EXT.8 (chat), EXT.12 (coach) are already implemented
**Then** a shared `useCreditGating()` hook is called before each AI operation
**And** the hook reads from usage-store and blocks if insufficient
**And** retrofit scope is LIMITED TO: shared Zustand stores + credit components (CreditBar, UpgradePrompt, useCreditGating hook)
**And** NO modifications to EXT.6-9/EXT.12 component files — those components already accept `isLocked` and credit-related props; EXT.10 wires the props to real data via the shared store

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/usage` | GET | Get current balance and limits | Exists |

### Data Mapping

Use existing mapper: `mapUsageResponse()` from `@jobswyft/ui`.

---

## Story EXT.11: Feedback

**As a** user who has ideas or found issues,
**I want** to submit feedback directly from the extension,
**So that** the Jobswyft team can improve the product.

**FRs addressed:** FR83 (submit feedback), FR83a (categorization), FR84 (context capture), FR84a (optional screenshot)

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| New | `FeedbackForm` | `features/` | Dialog with category selector, textarea, context auto-capture |
| Modified | `AppHeader` | `layout/` | Add "Send Feedback" option to settings dropdown |

### Acceptance Criteria

**Given** the user clicks "Send Feedback" in the AppHeader settings dropdown
**When** the feedback dialog opens
**Then** a category selector shows: Bug Report, Feature Request, General Feedback
**And** a textarea is available for feedback content
**And** a submit button is present

**Given** the user fills in feedback and clicks Submit
**When** the submission triggers
**Then** context is auto-captured: current page URL, active sidebar tab, last action performed, browser version
**And** `POST /v1/feedback` is called with `{ content, category, context }`
**And** on success: confirmation message shown ("Thanks for your feedback!"), form closes
**And** on failure: error message shown, form stays open for retry

**Given** the feedback form is open
**When** the user has not filled in content
**Then** the submit button is disabled
**And** minimum content length is enforced (e.g., 10 characters)

**Given** the FeedbackForm component is built
**When** it renders in Storybook
**Then** it displays correctly at 360×600 in both dark and light themes
**And** category selection, textarea, and submit button are all functional

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/feedback` | POST | Submit user feedback | Exists |

### Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **FEEDBACK-01** | Screenshot attachment (FR84a) — requires additional UI for capture/upload. Defer to iteration. | Low |

---

## Story EXT.12: Coach Tab

**As a** job seeker who wants personalized career guidance,
**I want** to have a conversational AI coaching session tailored to my resume and the current job,
**So that** I can get strategic advice on application approach, interview preparation, and addressing skill gaps.

**FRs addressed:** FR37a (Coach as standalone sidebar tab), FR37b (coaching personalized to resume + job), FR37c (advise on strategy, interview prep, skill gaps), FR37d (1 credit per message), FR37e (conversation resets on job switch), FR37f (contextual coaching prompts from match analysis)

**Note:** Coach is a **standalone sidebar tab** (4th main tab), separate from AI Studio Chat (EXT.8). Coach provides deeper career coaching context; Chat provides quick Q&A about the job posting.

### Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `Coach` | `features/` | Existing chat UI component — refactor to use shared `ChatPanel` from EXT.8 with coach-specific styling |
| Reuse | `ChatPanel` | `features/` | Shared chat component built in EXT.8 — reuse with `variant="coach"` for coach-accent colors |
| New | `CoachPrompts` | `blocks/` | Contextual coaching prompt chips generated from match analysis results (FR37f) |
| New | Zustand `coach-store` | Extension `stores/` | Coach messages (separate from AI Studio chat-store), session per job |
| Modified | `ExtensionSidebar` | `layout/` | Wire Coach tab content — 4th main tab with `coach-accent` active indicator |

### Acceptance Criteria

**Given** the user is on a page where a job has been detected and has available credits
**When** they select the Coach tab in the sidebar
**Then** the Coach component renders with coach-accent color identity (`--coach-accent`)
**And** contextual coaching prompts are displayed based on match analysis results (FR37f)
**And** example prompts: "How do I address the [missing skill] gap?", "What should I emphasize from my [matched skill] experience?", "Help me prepare for a [job title] interview"

**Given** coaching prompts are displayed
**When** the user clicks a prompt chip
**Then** the prompt text is populated into the message input
**And** the user can edit before sending

**Given** the user sends a coaching message
**When** the message is submitted
**Then** credit check passes (1 credit available, FR37d) → `POST /v1/ai/chat` called with `context_type=coach`
**And** user message appears as coach-styled bubble (`bg-coach-accent text-coach-accent-foreground rounded-tr-sm`)
**And** AI coaching response streams in progressively via SSE (NFR6a)
**And** "Stop generating" cancel button available during streaming
**And** AI response appears as assistant bubble (`bg-muted`)
**And** coaching responses are personalized to the user's active resume AND current scanned job (FR37b)
**And** if credit check fails → "No credits" message shown, message not sent

**Given** the user has match analysis data available
**When** the Coach tab renders
**Then** coaching prompts reference specific match results (FR37f)
**And** e.g., if match shows "Kubernetes" as a gap → prompt: "How do I address the Kubernetes gap in my application?"
**And** if match shows "Team Leadership" as a strength → prompt: "How should I highlight my leadership experience?"

**Given** a coaching conversation is in progress
**When** the user navigates to a different job page
**Then** the coaching conversation resets completely (FR37e — new job = new coaching context)
**And** new contextual prompts generate based on the new job's match analysis
**And** previous coaching messages are not recoverable (ephemeral)

**Given** the Coach tab is rendering
**When** no job has been detected yet
**Then** the Coach tab shows locked state with message "Scan a job to start coaching"
**And** a link to the Scan tab is provided

**Given** the user switches tabs (Coach → Scan → Coach)
**When** they return to the Coach tab
**Then** the conversation is preserved within the session (FR72d)
**And** coaching prompts remain available below the conversation

**Given** a coaching response fails
**When** the API returns an error (or SSE `event: error`)
**Then** an error message shows inline ("Coaching unavailable. Try again.")
**And** the user's credit is NOT deducted (NFR24)

### Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/chat` | POST | Send coaching message, get streaming AI response | Built in EXT.8 — add `context_type=coach` parameter |

**Endpoint extension for Coach:**
```
POST /v1/ai/chat
Body: {
  job_id, resume_id, message, conversation_history: [{role, content}],
  context_type: "coach"  // distinguishes from AI Studio chat
}
Response: text/event-stream (SSE) — same protocol as AI Studio chat
Credits: 1 per message
```

The `context_type=coach` parameter triggers a different AI prompt template that emphasizes career coaching, interview preparation, and strategic advice (vs. the factual Q&A focus of AI Studio Chat).

### Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **COACH-01** | AI prompt template for coaching context (different from chat — more strategic, advisory tone) | High |
| **COACH-02** | Match-analysis-based prompt generation (FR37f) — needs match data → prompt mapping logic | Medium |
| **COACH-03** | Shared `ChatPanel` base component — Coach and AI Studio Chat should share the chat UI but with different styling/prompts | Medium |

---

## Epic API: Backend API Enhancements — Story Details

> **Living backlog.** Stories are added here as Epic EXT development discovers backend gaps.
> Each story references the originating EXT story and tech debt ID.
> Stories can be implemented in parallel with EXT — frontend mocks the API, backend builds the real endpoint, integration verified when both sides ship.

---

## Story API.1: SSE Streaming Infrastructure

**As a** developer building AI-powered features,
**I want** a shared SSE streaming foundation in the FastAPI backend,
**So that** all generative AI endpoints can stream responses consistently without duplicating infrastructure code.

**Source:** NFR6a, tech debt items across EXT.7, EXT.8, EXT.12

### Acceptance Criteria

**Given** the FastAPI backend needs to support SSE streaming
**When** this story is complete
**Then** a shared `sse_response()` helper exists in `app/lib/streaming.py` (or similar)
**And** it wraps any async generator into a `StreamingResponse` with `content-type: text/event-stream`
**And** it emits standardized events: `event: chunk` → `{"text": "..."}`, `event: done` → `{"credits_remaining": N}`, `event: error` → `{"code": "...", "message": "..."}`
**And** it handles client disconnect (cancel) gracefully — stops generation, does NOT deduct credits
**And** it includes `Cache-Control: no-cache` and `Connection: keep-alive` headers

**Given** the SSE helper is built
**When** a developer creates a new streaming endpoint
**Then** they can use `return sse_response(my_generator())` as a one-liner
**And** error handling, event formatting, and disconnect detection are automatic

**Given** the SSE infrastructure needs testing
**When** unit tests run
**Then** tests verify: chunk streaming, done event, error event, client disconnect handling, credit non-deduction on cancel

### Technical Notes

- FastAPI `StreamingResponse` with `media_type="text/event-stream"`
- Async generator pattern: `yield` chunks from AI provider, format as SSE events
- AI provider abstraction layer should return an async iterator for streaming
- Consider `asyncio.CancelledError` for disconnect detection

---

## Story API.2: Chat Endpoint (`POST /v1/ai/chat`)

**As a** job seeker using AI Studio Chat or Coach,
**I want** a backend endpoint that accepts my message and streams an AI response,
**So that** I can have conversational interactions about job postings and career strategy.

**Source:** CHAT-01, CHAT-02 — unblocks EXT.8 (Chat) and EXT.12 (Coach)

### Acceptance Criteria

**Given** the chat endpoint does not exist yet
**When** this story is complete
**Then** `POST /v1/ai/chat` exists and accepts:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "message": "string",
  "conversation_history": [{"role": "user|assistant", "content": "..."}],
  "context_type": "chat | coach"
}
```
**And** response is `text/event-stream` (SSE) using API.1 infrastructure
**And** SSE events follow the standard format: `chunk`, `done` (with `credits_remaining` and optional `suggestions`), `error`

**Given** `context_type=chat`
**When** the endpoint processes the request
**Then** the AI prompt template focuses on factual Q&A about the job posting
**And** the prompt includes: job description, user's resume summary, conversation history
**And** the tone is informative and direct

**Given** `context_type=coach`
**When** the endpoint processes the request
**Then** the AI prompt template focuses on strategic career coaching
**And** the prompt includes: job description, user's resume summary, match analysis results (if available), conversation history
**And** the tone is advisory, encouraging, and strategically focused
**And** the AI is instructed to provide actionable advice on: application strategy, interview preparation, skill gap mitigation

**Given** the user sends a message
**When** credit check runs
**Then** 1 AI credit is deducted on successful completion
**And** credits are NOT deducted if generation fails or is cancelled (NFR24)
**And** `credits_remaining` is included in the `done` event

**Given** the endpoint receives invalid input
**When** validation fails
**Then** standard error envelope is returned: `{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "..."}}`

### Dependencies

- API.1 (SSE infrastructure) must be complete

---

## Story API.3: Match Type Parameter + Daily Rate Limiting

**As a** user getting match analysis,
**I want** the backend to distinguish between free auto-matches and paid detailed matches,
**So that** free users get 20 daily auto-matches while detailed analysis costs 1 credit.

**Source:** MATCH-01, MATCH-02 — unblocks EXT.6, EXT.10

### Acceptance Criteria

**Given** `POST /v1/ai/match` exists
**When** this story is complete
**Then** the endpoint accepts an additional `match_type` parameter: `"auto"` or `"detailed"`

**Given** `match_type=auto`
**When** a free-tier user requests a match
**Then** no AI credits are deducted
**And** daily counter increments (tracked per user per UTC day)
**And** if daily count >= 20 → reject with `{"code": "DAILY_LIMIT_REACHED", "message": "Auto-match limit reached (20/day). Upgrade for unlimited."}`
**And** paid-tier users have unlimited auto-matches (no daily limit)

**Given** `match_type=detailed`
**When** a user requests a detailed match
**Then** 1 AI credit is deducted
**And** comprehensive analysis is returned (strengths, gaps, recommendations)
**And** if credits = 0 → reject with `{"code": "CREDIT_EXHAUSTED", "message": "..."}`

**Given** rate limiting needs persistence
**When** daily counts are tracked
**Then** counts are stored in `usage_events` table (or similar) with UTC date key
**And** counts reset at midnight UTC automatically
**And** `GET /v1/usage` response includes `auto_matches_today` and `auto_matches_limit` fields

### Technical Notes

- Add `match_type` enum to the Pydantic request model
- Daily counter can use existing `usage_events` table with `event_type='auto_match'`
- Consider Redis for high-frequency rate limiting post-MVP; DB-based is fine for MVP

---

## Story API.4: Coach Prompt Templates

**As a** user receiving AI coaching,
**I want** the coaching AI to respond with strategic career advice (not just facts),
**So that** I get differentiated value compared to the standard Chat feature.

**Source:** COACH-01, COACH-02 — unblocks EXT.12

### Acceptance Criteria

**Given** `POST /v1/ai/chat` supports `context_type=coach` (from API.2)
**When** this story is complete
**Then** the coach prompt template is tuned for:
- Strategic application advice ("Here's how to position yourself...")
- Interview preparation ("For this role, expect questions about...")
- Skill gap mitigation ("To address the [skill] gap, consider...")
- Encouraging, advisory tone (not dry/factual like chat)

**Given** match analysis data is available for the job
**When** `context_type=coach` is used
**Then** the prompt includes match strengths and gaps as coaching context
**And** the AI references specific matched/missing skills in its advice

**Given** the user has no match analysis data yet
**When** `context_type=coach` is used
**Then** the coach still functions with job description + resume only
**And** coaching quality is reduced but not broken

**Given** coaching prompt templates need iteration
**When** templates are stored
**Then** prompt templates are in a configurable location (`app/prompts/` or `global_config` table)
**And** they can be updated without code deployment (configurable via DB preferred)

### Dependencies

- API.2 (chat endpoint with `context_type` param) must be complete

---

## Story API.5: Remove `/v1/ai/answer` Endpoint

**As a** developer maintaining the API,
**I want** the deprecated Answer endpoint removed,
**So that** the codebase stays clean and doesn't confuse future development.

**Source:** AI-01 — PRD removed "Answer Generation" tool; replaced by Chat (FR31-35)

### Acceptance Criteria

**Given** `/v1/ai/answer` exists in the API
**When** this story is complete
**Then** the endpoint is removed from `app/routers/ai.py`
**And** the Pydantic models for answer request/response are removed
**And** `specs/openapi.yaml` is updated to remove the `/v1/ai/answer` path
**And** any tests referencing `/v1/ai/answer` are removed or updated
**And** the UI mapper `mapAnswerResponse` (if it exists) is removed from `@jobswyft/ui`

**Given** the endpoint is removed
**When** a client calls `POST /v1/ai/answer`
**Then** it returns 404

### Technical Notes

- Check for any frontend references before removal (should be none — Answer tab was already removed from AI Studio)
- Low risk, standalone change

---

## Story API.6: SSE Migration — Cover Letter + Outreach Endpoints

**As a** user generating cover letters and outreach messages,
**I want** the AI response to stream progressively,
**So that** I see text appearing in real-time instead of waiting for the full response.

**Source:** NFR6a — unblocks EXT.7

### Acceptance Criteria

**Given** `POST /v1/ai/cover-letter` currently returns JSON
**When** this story is complete
**Then** it returns `text/event-stream` (SSE) using API.1 infrastructure
**And** events follow the standard format: `chunk` → `{"text": "..."}`, `done` → `{"credits_remaining": N}`, `error`
**And** client disconnect cancels generation and does not deduct credits

**Given** `POST /v1/ai/outreach` currently returns JSON
**When** this story is complete
**Then** it also returns `text/event-stream` (SSE) using the same pattern

**Given** `POST /v1/ai/cover-letter/pdf` exists
**When** PDF export is requested
**Then** it continues to return a PDF file (binary response, NOT streaming) — no change needed

**Given** existing tests cover these endpoints
**When** tests are updated
**Then** tests verify SSE streaming behavior (chunk events, done event, error handling, cancel)

### Dependencies

- API.1 (SSE infrastructure) must be complete
