# Story EXT.5: Job Page Scanning & Job Card

**As a** job seeker browsing job postings,
**I want** the extension to detect and scan job pages automatically,
**So that** I can see job details and save jobs without copy-pasting.

**FRs addressed:** FR14 (auto-scan), FR14a (URL patterns), FR14b (manual entry with paste-job-description fallback), FR15-FR18 (field extraction), FR19 (ephemeral questions), FR21 (manual edit), FR22 (missing field indicators), FR48 (save job), FR49 (auto "Applied" status)

**Deferred:** FR20 (element picker for field correction) — deferred to post-MVP. Manual inline editing (FR21) covers 90% of the use case.

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `JobCard` | `features/` | Job data display, edit mode, metadata badges, action buttons |
| New | Content script `job-detector.ts` | Extension `features/scanning/` | URL pattern matching for job boards |
| New | Content script `scanner.ts` | Extension `features/scanning/` | DOM extraction (rules + AI fallback) |
| New | Zustand `scan-store` | Extension `stores/` | Scan state, extracted job data |
| New | `ScanEmptyState` | `blocks/` or inline | Placeholder when no job detected |
| Modified | `ExtensionSidebar` | `layout/` | Wire `scanContent` slot with JobCard / empty state |

## Acceptance Criteria

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

## Content Script Architecture

```
Content Script (injected per page)
  ├── job-detector.ts — URL patterns: linkedin.com/jobs, indeed.com/viewjob, greenhouse.io, etc.
  ├── scanner.ts — DOM extraction rules per board + AI fallback
  └── Communicates via chrome.runtime.sendMessage → Background → Side Panel
```

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/jobs/scan` | POST | Save scanned job data | Exists |

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **SCAN-01** | Element picker for manual field correction (FR20) — **DEFERRED to post-MVP**. Manual inline editing (FR21) covers primary use case | Low (Post-MVP) |
| **SCAN-02** | Application question extraction (FR19) — ephemeral, needs content script intelligence | Low |

---
