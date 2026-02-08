# Story EXT.4: Resume Management

**As a** job seeker,
**I want** to upload, view, and manage my resumes in the sidebar,
**So that** I can quickly select the right resume for each application.

**FRs addressed:** FR7 (upload PDF), FR8 (AI parse), FR9 (max 5), FR10 (active resume), FR11 (view list), FR12 (delete), FR13 (switch resumes), FR13a (expandable blocks), FR13b (expand full content), FR13c (copy to clipboard)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `ResumeCard` | `features/` | Dropdown selector, expandable blocks, copy, upload/delete buttons. Very complete |
| New | Zustand `resume-store` | Extension `stores/` | Resume list, active resume ID, parsed data, persist to chrome.storage |
| New | Upload progress UI | Within ResumeCard | Progress indicator during upload + parse |
| Modified | `ExtensionSidebar` | `layout/` | Wire `contextContent` slot with ResumeCard |

## Acceptance Criteria

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

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/resumes` | POST | Upload + parse resume | Exists |
| `/v1/resumes` | GET | List user's resumes | Exists |
| `/v1/resumes/:id` | GET | Get resume detail + parsed data | Exists |
| `/v1/resumes/:id/active` | PUT | Set active resume | Exists |
| `/v1/resumes/:id` | DELETE | Delete resume | Exists |

## Data Mapping

Use existing mapper: `mapResumeResponse()` from `@jobswyft/ui` for snake_case → camelCase transformation.

---
