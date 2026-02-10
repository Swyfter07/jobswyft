# Story EXT.9: Form Autofill

**As a** job seeker on an application form,
**I want** to auto-fill form fields with my information,
**So that** I can submit applications faster without manual data entry.

**FRs addressed:** FR42 (autofill fields), FR42a (display detected fields), FR42b (review before fill), FR43 (auto-map fields), FR44 (highlight filled), FR44a (tick-off state in sidebar), FR45 (undo), FR46 (resume upload), FR47 (cover letter paste)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `Autofill` | `features/` | Field pills with status, fill/undo buttons. Props: `fields[]`, `isFilling`, `showUndoPrompt`, callbacks |
| New | Content script `autofill.ts` | Extension `features/autofill/` | DOM field detection, mapping, fill execution |
| New | Zustand `autofill-store` | Extension `stores/` | Detected fields, fill state, undo snapshot |
| Modified | `ExtensionSidebar` | `layout/` | Wire `autofillContent` slot |

## Acceptance Criteria

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

## Content Script Architecture

```
Content Script (autofill.ts)
  ├── detectFields() — Scans DOM for form inputs, textareas, selects, file uploads
  ├── mapFields(fields, userData) — Maps detected fields to user data
  ├── fillFields(mappings) — Executes DOM manipulation to fill values
  ├── undoFill(snapshot) — Restores pre-fill values
  └── Communicates via chrome.runtime messaging ↔ Side Panel
```

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/autofill/data` | GET | Get personal data + resume for autofill | Exists |

---
