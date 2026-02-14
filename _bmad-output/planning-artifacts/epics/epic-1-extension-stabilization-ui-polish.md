# Epic 1: Extension Stabilization & UI Polish

Fix bugs, inconsistent UI, missing Storybook stories, and component gaps across the existing vibecoded extension codebase. Establish a clean, reliable baseline before building new features.

## Story 1.1: Design System & Theme Foundation Audit

As a developer,
I want a comprehensive audit of all existing components against the design language rules with an issue registry and token-level fixes in globals.css,
So that subsequent fix stories have a clear scope and the foundation (semantic tokens, dark/light parity) is solid before individual component fixes.

**Acceptance Criteria:**

**Given** the existing extension and UI package codebase
**When** a systematic audit is performed against the Design Language Rules
**Then** every official component is checked for: hardcoded colors, missing semantic tokens, dark/light theme parity, spacing consistency, CVA variant completeness, and accessibility basics
**And** an issue registry is produced documenting every finding with severity (critical/major/minor), affected component, and file location

**Given** the issue registry is complete
**When** token-level gaps are identified in `globals.css`
**Then** missing or inconsistent semantic tokens are added/fixed (OKLCH color space)
**And** dark/light theme variables are verified to have matching counterparts
**And** CSS utilities (`.text-micro`, `.scrollbar-hidden`, `.scroll-fade-y`, gradient patterns) are verified present and working

**Given** the audit is complete
**When** the developer reviews the registry
**Then** issues are grouped by story (1.2 through 1.6) for systematic resolution
**And** critical issues that block other stories are flagged for immediate attention

---

## Story 1.2: Shell, Layout & Navigation Fixes

As a user,
I want the extension sidebar layout to have correct spacing, smooth scrolling, and reliable tab navigation,
So that the overall shell feels polished and content is never clipped or misaligned.

**Acceptance Criteria:**

**Given** the `AppHeader` component
**When** rendered in the extension sidebar at 360×600
**Then** the header has correct height, padding, and alignment per UX spec
**And** all header elements (logo, title, action buttons) are properly spaced
**And** dark/light themes render correctly

**Given** the `ExtensionSidebar` shell layout
**When** rendered with content that exceeds viewport height
**Then** the shell layout contract is enforced: header (shrink-0) + tabs (shrink-0) + content (flex-1 with scroll) + footer (shrink-0)
**And** scrolling is smooth with no content overflow outside the scroll area
**And** `.scrollbar-hidden` and `.scroll-fade-y` utilities are applied correctly

**Given** the 3-tab navigation (Scan | AI Studio | Autofill)
**When** the user switches between tabs
**Then** tab state is preserved within each tab (FR72d)
**And** active tab indicator is visually correct in both themes
**And** no layout shift occurs during tab transitions

**Given** all layout components are fixed
**When** Storybook stories are reviewed
**Then** `AppHeader` and `ExtensionSidebar` have complete stories covering: default state, all tab states, dark/light, 360×600 viewport
**And** all audit issues tagged for Story 1.2 are resolved

---

## Story 1.3: Card & Block Component Standardization

As a user,
I want all card-based UI elements (resume cards, job details, sign-in) to have consistent borders, spacing, and padding,
So that the extension looks cohesive and professionally designed.

**Acceptance Criteria:**

**Given** the `ResumeCard` component
**When** rendered in the sidebar
**Then** border color uses `border-card-accent-border` pattern (border-2 to show over shadcn ring-1)
**And** padding and spacing match the UX spec
**And** the active resume indicator is visually distinct
**And** dark/light themes render correctly

**Given** the Job Details Card
**When** rendered after a successful scan
**Then** the top padding cropping issue is fixed — content is not shifted to the top
**And** border color matches the standardized card accent pattern
**And** gradient header pattern (`bg-gradient-to-r from-card-accent-bg to-transparent`) is applied correctly
**And** all fields (title, company, location, salary) have consistent spacing

**Given** the sign-in / Google OAuth elements
**When** rendered in the Logged Out state
**Then** card border and background follow the same accent pattern as other cards
**And** the Google sign-in button has proper sizing and alignment
**And** dark/light themes render correctly

**Given** all block components (`IconBadge`, `CreditBar`, `CopyChip`, `CopyButton`, `CollapsibleSection`)
**When** reviewed against design language rules
**Then** each uses semantic tokens only (zero hardcoded colors)
**And** CVA variants are complete for all supported states
**And** sizing uses `size-X` tokens, not `h-X w-X`

**Given** all card and block components are fixed
**When** Storybook stories are reviewed
**Then** each component has stories for: default, all variants, all states (loading/error/empty/active), dark/light, 360×600 viewport
**And** all audit issues tagged for Story 1.3 are resolved

---

## Story 1.4: AI Studio & Feature View Fixes

As a user,
I want the AI Studio tabs, login view, and non-job-page view to display correctly without visual glitches or broken states,
So that every screen in the extension is visually polished and functional.

**Acceptance Criteria:**

**Given** the AI Studio container
**When** rendered with 4 sub-tabs (Match | Cover Letter | Outreach | Coach)
**Then** sub-tab navigation renders correctly with proper active indicators
**And** sub-tab content areas have consistent padding and spacing
**And** no visual glitches occur during tab switching
**And** the container respects the shell scroll contract (content area scrolls, tabs stay fixed)

**Given** the `LoginView` feature component
**When** rendered in the Logged Out sidebar state
**Then** the view displays correctly with proper centering, spacing, and call-to-action
**And** dark/light themes render correctly
**And** loading state during OAuth flow shows appropriate feedback

**Given** the `NonJobPageView` feature component
**When** rendered on a non-job page
**Then** the resume tray displays correctly with the active resume
**And** the "waiting for job page" state is visually clear with proper empty state styling (dashed border pattern)
**And** the dashboard link is properly styled and accessible

**Given** any reference components in `_reference/` used as prototypes during vibecoding
**When** reviewing extension integration code
**Then** no direct imports from `_reference/` exist in production extension code
**And** any prototype patterns that leaked into production are replaced with proper implementations

**Given** all feature views are fixed
**When** Storybook stories are reviewed
**Then** `LoginView`, `NonJobPageView`, and AI Studio container have complete stories
**And** all audit issues tagged for Story 1.4 are resolved

---

## Story 1.5: Storybook Completion & Variant Coverage

As a developer,
I want every official component in `@jobswyft/ui` to have complete Storybook story coverage,
So that all components are visually verified, documented, and regression-testable.

**Acceptance Criteria:**

**Given** the current ~20% Storybook coverage
**When** a systematic story creation pass is completed
**Then** every official component in `blocks/`, `features/`, `layout/`, and `ui/` has at least one Storybook story file

**Given** each component's Storybook file
**When** stories are reviewed
**Then** the following stories exist per component:
- **Default** — all variants displayed
- **Sizes** — all size variants (if applicable)
- **States** — loading, error, empty, disabled, active (where applicable)
- **Dark Mode** — explicit dark theme story (if visual differences exist beyond token swap)
- **Extension Viewport** — rendered at 360×600
**And** coverage target reaches 95%+ of official components

**Given** components that use CVA variants
**When** Storybook stories are created
**Then** every declared variant combination has visual coverage
**And** missing variants identified during the audit (Story 1.1) are implemented

**Given** the completed Storybook
**When** a developer browses the story navigation
**Then** components are organized by directory: UI Primitives, Blocks, Features, Layout
**And** `_reference/` components remain hidden from main Storybook navigation

---

## Story 1.6: State Management Audit & Integration Validation

As a user,
I want the extension to maintain correct state across tab switches, page navigations, and session resumption,
So that the extension works reliably without stale data, lost state, or unexpected behavior.

**Acceptance Criteria:**

**Given** the existing Zustand stores (`useCoreStore`, `useScanStore`, and any others)
**When** an audit is performed
**Then** each store is documented: purpose, persisted keys, chrome.storage usage, typed message commands
**And** any stale state patterns (data not clearing on logout, zombie listeners) are identified and fixed
**And** store slicing follows the domain-sliced pattern (ADR-REV-EX1)

**Given** a user logs in via Google OAuth
**When** the auth flow completes
**Then** the sidebar transitions from Logged Out → authenticated state without visual flicker
**And** profile data, resume list, and credit balance load correctly
**And** chrome.storage persistence works across sidebar close/reopen

**Given** a user navigates from a job page to a non-job page
**When** the URL change is detected
**Then** sidebar correctly transitions states per FR72a-FR72d
**And** resume selection and auth session are preserved
**And** no console errors or state corruption occurs

**Given** a user navigates to a new job page
**When** the URL change is detected
**Then** job data, match data, and chat history reset (FR72a)
**And** resume selection, auth session, and credits are preserved

**Given** all visual fixes from Stories 1.2-1.5 are applied
**When** a full regression pass is performed
**Then** all 3 sidebar states (Logged Out, Non-Job Page, Job Detected) render correctly
**And** tab switching, resume management, and job scanning flows work end-to-end
**And** no regressions from the stabilization work are present

---
