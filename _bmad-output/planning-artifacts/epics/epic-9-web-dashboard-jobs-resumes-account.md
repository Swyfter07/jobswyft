# Epic 9: Web Dashboard — Jobs, Resumes & Account

Users manage their tracked jobs, resumes, account settings, and privacy controls from a full web dashboard with usage visibility.

## Story 9.1: Dashboard Shell & Authentication

As a user visiting the Jobswyft web dashboard,
I want to sign in with Google and navigate a clean layout,
So that I can access my job tracking and account management from any browser.

**Acceptance Criteria:**

**Given** the Next.js app in `apps/web/` is scaffolded but not initialized
**When** this story is complete
**Then** the app is fully initialized with:
- Next.js 14+ App Router
- `@jobswyft/ui` package integrated (shared components, `globals.css`, ThemeProvider)
- Supabase Auth (Google OAuth) configured
- Dark/light theme toggle working
- Responsive layout (mobile, tablet, desktop per NFR35)

**Given** an unauthenticated user visits the dashboard
**When** they land on any protected route
**Then** they are redirected to a sign-in page
**And** "Sign in with Google" button initiates Supabase OAuth flow
**And** on successful auth, they are redirected to the jobs page (default)

**Given** an authenticated user
**When** the dashboard shell renders
**Then** a Navbar displays: logo, nav links (Jobs, Resumes, Account, Privacy), CreditBadge, user avatar with dropdown
**And** the avatar dropdown includes: Profile, Settings, Sign Out (FR3)
**And** clicking "Sign Out" calls `POST /v1/auth/logout` and clears the session
**And** mobile: Navbar collapses to hamburger menu using Sheet component

**Given** the dashboard uses `@jobswyft/ui` components
**When** components render
**Then** all shared components (Button, Card, Badge, etc.) use the same semantic tokens as the extension
**And** the dashboard looks visually consistent with the extension

**Given** route structure
**When** the app is built
**Then** routes exist: `/` (redirect to /jobs), `/jobs`, `/resumes`, `/account`, `/privacy`
**And** all routes are protected by auth middleware
**And** admin routes are in a separate route group `/(admin)/` per ADR-REV-EX6

---

## Story 9.2: Jobs Management Page

As a user tracking their job applications,
I want to view, filter, update, and manage my saved jobs from the dashboard,
So that I can stay organized during my job search.

**Acceptance Criteria:**

**Given** an authenticated user navigates to `/jobs` (FR73)
**When** the page loads
**Then** `GET /v1/jobs` is called with default params (page=1, page_size=20, sort=updated_at desc)
**And** a jobs list renders with cards showing: title, company, status badge, notes preview, date
**And** the list supports pagination (page navigation at bottom)

**Given** the jobs list
**When** the user wants to filter
**Then** status filter tabs/chips are available: All, Applied, Interviewing, Offered, Rejected
**And** selecting a filter calls `GET /v1/jobs?status=<filter>`
**And** the active filter is visually indicated

**Given** a job card in the list (FR52)
**When** the user clicks it
**Then** a job detail view opens (page or side panel) showing all fields: title, company, description, location, salary, status, source URL, notes
**And** the user can update the status via a dropdown (FR51): saved, applied, interviewing, offered, rejected, accepted

**Given** the job detail view (FR54, FR55, FR56)
**When** the user edits notes
**Then** notes are saved via `PUT /v1/jobs/{id}/notes`
**And** auto-save or explicit "Save" button with success confirmation

**Given** a job the user wants to remove (FR53)
**When** they click "Delete"
**Then** a confirmation dialog appears
**And** on confirm: `DELETE /v1/jobs/{id}`, job removed from list
**And** toast confirmation: "Job deleted"

**Given** the jobs page on mobile
**When** rendered at mobile viewport
**Then** the layout adapts: cards stack vertically, filter chips scroll horizontally

---

## Story 9.3: Resume Management Page

As a user managing their resumes,
I want to upload, view, and manage my resumes from the dashboard,
So that I can keep my resumes organized and select which one to use.

**Acceptance Criteria:**

**Given** an authenticated user navigates to `/resumes` (FR74)
**When** the page loads
**Then** `GET /v1/resumes` is called and resume cards render showing: file name, active indicator, upload date

**Given** the resume list
**When** the user clicks "Upload Resume"
**Then** a file picker opens accepting PDF files only
**And** `POST /v1/resumes` uploads the file with progress indicator
**And** on success: new resume card appears with parsed data preview
**And** on limit reached (5): error message "Maximum 5 resumes. Delete one to upload more." (FR9)

**Given** a resume card
**When** the user clicks it
**Then** parsed resume data displays in expandable sections: Contact, Summary, Experience, Education, Skills (FR13a, FR13b)
**And** each section has a copy button (FR13c)
**And** a "Download PDF" link opens the signed URL

**Given** resume management actions
**When** the user interacts with a resume
**Then** "Set as Active" marks it as the active resume via `PUT /v1/resumes/{id}/active` (FR10)
**And** "Delete" removes it via `DELETE /v1/resumes/{id}` with confirmation (FR12)
**And** active indicator updates immediately

**Given** superseded story 2-3 (resume extensions)
**When** parsed data is displayed
**Then** if additional fields exist (highlights, certifications, projects, website), they display in their own sections
**And** missing fields are handled gracefully (section hidden, not errored)

---

## Story 9.4: Account & Privacy Page

As a user managing their account,
I want to view my profile, usage stats, and privacy controls in one place,
So that I can manage my personal data and exercise my privacy rights.

**Acceptance Criteria:**

**Given** an authenticated user navigates to `/account` (FR75)
**When** the page loads
**Then** profile information displays: name, email, subscription tier, member since (from `GET /v1/auth/me`)
**And** usage summary displays: credits remaining, credits used, tier status, daily auto-match count (from `GET /v1/usage`) (FR77)
**And** subscription status displays: current tier, "Upgrade coming soon" for free users

**Given** an authenticated user navigates to `/privacy` (FR76)
**When** the page loads
**Then** a data summary displays what is stored and where (FR78):
- Profile: stored fields, encryption info
- Resumes: count, storage type
- Jobs: count, storage type
- Usage history: count, what's tracked
- AI-generated content: "Never stored on our servers"
**And** data is fetched from `GET /v1/privacy/data-summary`

**Given** the user wants to delete their account (FR79)
**When** they click "Delete My Account"
**Then** a confirmation dialog explains: all data will be permanently deleted
**And** on confirm: `POST /v1/privacy/delete-request` sends a confirmation email (FR80)
**And** message displays: "Confirmation email sent. Check your inbox. Link expires in 24 hours."

**Given** the user clicks the email confirmation link
**When** they arrive at `/privacy/confirm-delete?token=...`
**Then** `POST /v1/privacy/confirm-delete` is called with the token
**And** on success: "Your account and all data have been permanently deleted." + redirect to sign-in
**And** on expired/invalid token: "Invalid or expired link. Please request again."

---

## Story 9.5: IC-4 — Cross-Surface Integration Validation

As a quality assurance stakeholder,
I want the web dashboard and Chrome extension verified for data consistency and shared auth,
So that users see the same information regardless of which surface they use.

**Acceptance Criteria:**

**Given** a user is signed into both the extension and the dashboard
**When** they save a job from the extension
**Then** the job appears in the dashboard jobs list within 5 seconds of page refresh
**And** all fields match: title, company, status, notes

**Given** a user uploads a resume from the dashboard
**When** they open the extension sidebar
**Then** the new resume appears in the resume tray
**And** setting it as active in the dashboard reflects in the extension

**Given** a user uses AI credits in the extension
**When** they check usage on the dashboard
**Then** the credit balance matches (after page refresh)

**Given** a user signs out from the dashboard (FR3)
**When** they attempt to use the extension
**Then** the extension detects the expired session and shows the Logged Out state
**And** local extension data is cleared (FR81)

**Given** cross-browser compatibility (NFR35)
**When** the dashboard is tested on Chrome, Firefox, Safari, and Edge (latest 2 versions)
**Then** all pages render correctly and all functionality works

**Given** all integration tests pass
**When** results are documented
**Then** IC-4 report confirms: data consistency verified, auth shared correctly, cross-browser tested, mobile responsive verified

---
