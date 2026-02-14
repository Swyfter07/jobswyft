# Story EXT.3: Authenticated Navigation & Sidebar Shell

**As a** logged-in user,
**I want** to see a navigation bar and tabbed sidebar after signing in,
**So that** I can access all extension features and navigate between sections.

**FRs addressed:** FR2 (sign out), FR4 (session persistence), FR67 (open sidebar), FR67a (3-tab structure: Scan | AI Studio | Autofill), FR67b (4 AI Studio sub-tabs: Match | Cover Letter | Outreach | Coach), FR68 (close sidebar), FR69 (3-state sidebar: Logged Out, Non-Job Page, Job Detected = Full Power), FR69a (AI Studio tools including Coach unlock on job detection + credits), FR69b (Autofill on form page), FR70 (resume tray slot), FR71 (all AI Studio tools locked until scan + credits), FR72 (dashboard link), FR72a (job URL change reset), FR72b (non-job page preserves context), FR72c (manual reset button), FR72d (tab state preservation)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `AppHeader` | `layout/` | Has theme toggle, settings dropdown, sign out. Wire real callbacks |
| Existing | `ExtensionSidebar` | `layout/` | Has tabs (scan/studio/autofill), AI Studio has sub-tabs (match/cover-letter/outreach/coach), isLocked, creditBar. Wire real state |
| New | `AuthenticatedLayout` | Extension `components/` | Wraps AppHeader + ExtensionSidebar for logged-in state |
| New | Zustand `auth-store` | Extension `stores/` | Session state, user profile, persist to chrome.storage |
| New | Reset button | In `AppHeader` | Ghost button, refresh icon `size-4`, triggers FR72c manual reset |
| New | State preservation logic | Extension `hooks/` | `useStatePreservation` — handles FR72a-d (job switch, non-job page, manual reset, tab persistence) |
| Modified | `sidebar-app.tsx` | Extension `components/` | Route between LoggedOutView ↔ AuthenticatedLayout |

## Acceptance Criteria

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
**And** AI Studio (including Coach sub-tab) and Autofill tabs show locked state (`isLocked=true`) — all require job detection + credits
**And** Resume tray is accessible for resume management

**Given** the user navigates to a new job page (different URL)
**When** auto-scan detects the new job
**Then** sidebar resets: job data, match data, AI Studio outputs (including Coach chat history) are cleared
**And** resume selection, auth session, and credits are preserved (FR72a)

**Given** the user navigates from a job page to a non-job page (Gmail, Google Docs, etc.)
**When** the page context changes
**Then** sidebar preserves the last job context — user can continue working with previous job data (FR72b)

**Given** the user clicks the reset button in the AppHeader
**When** the reset action triggers
**Then** job data, match data, AI Studio outputs (including Coach chat) are cleared
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

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/auth/me` | GET | Validate session, get user profile | Exists |
| `/v1/auth/logout` | POST | Invalidate server session | Exists |

---
