# Epic 6: Smart Form Autofill

Users auto-fill application forms with one click — field preview, intelligent mapping, visual confirmation, undo, resume upload, and cover letter injection. Uses the engine autofill core from Epic 2.

## Story 6.1: Autofill UI — Field Preview & Fill Execution

As a job seeker on an application form,
I want to preview detected form fields and auto-fill them with one click,
So that I can submit applications faster without manual data entry.

**Acceptance Criteria:**

**Given** the user navigates to a job application form page
**When** the engine's field detection runs (via content script adapter from Epic 2)
**Then** detected form fields are sent to the sidebar via Chrome messaging
**And** the Autofill tab unlocks (FR69b — form fields detected)
**And** the Autofill tab shows a badge or indicator that fields were found

**Given** the user opens the Autofill tab
**When** detected fields render
**Then** fields are grouped by category: Personal (name, email, phone, LinkedIn), Resume (file upload), Cover Letter, Questions (custom fields) (FR42a)
**And** each field shows status: "ready" (data available to fill), "missing" (no user data for this field), or "prefilled" (already has a value)
**And** the user can review which fields will be filled before triggering (FR42b)

**Given** the user clicks "Fill Application"
**When** autofill executes via the engine core
**Then** personal data is sourced from `GET /v1/autofill/data`
**And** the engine's native property descriptor setter fills each mapped field
**And** `isFilling=true` shows sequential fill progress in the sidebar (600ms stagger per field per UX spec)
**And** successfully filled fields update to "filled" status with checkmark tick-off (FR44a)
**And** filled fields are visually highlighted on the page (FR44)
**And** unmapped/skipped fields show "skipped" with reason

**Given** autofill completes
**When** the sidebar updates
**Then** a summary shows: N fields filled, M skipped
**And** fill execution completes within 1 second for standard forms (NFR4)

**Given** no active resume is selected
**When** the Autofill tab renders
**Then** a prompt appears: "Select a resume to enable autofill"
**And** the fill button is disabled

**Given** Storybook stories for Autofill view
**When** reviewed
**Then** stories cover: detecting (scanning for fields), fields preview (with all statuses), filling (progress animation), complete (all filled), partial (some skipped), no resume, dark/light, 360x600

---

## Story 6.2: Autofill Undo, Resume Upload & Cover Letter Injection

As a job seeker who just autofilled a form,
I want to undo the fill, have my resume uploaded to file fields, and cover letter pasted when available,
So that I have full control and all application materials are included.

**Acceptance Criteria:**

**Given** autofill has completed successfully
**When** the undo prompt banner appears
**Then** an "Undo" button is visible in the sidebar
**And** undo persists with no timeout — it is removed only on page refresh or DOM field change (FR45)
**And** clicking "Undo" restores ALL fields to their pre-fill values
**And** the undo snapshot is stored in the Zustand `autofill-store`

**Given** the user clicks "Undo"
**When** the restore executes
**Then** all filled fields revert to their original values
**And** the sidebar field statuses reset to "ready"
**And** the undo prompt disappears
**And** the user can re-fill after making changes

**Given** a file upload field (`<input type="file">`) is detected
**When** autofill executes and an active resume is available (FR46)
**Then** the resume PDF is programmatically attached to the file input
**And** the field shows "filled" status with the filename
**And** if no active resume → field shows "skipped — no resume selected"

**Given** a cover letter text field/textarea is detected
**When** autofill executes and a generated cover letter exists from AI Studio (FR47)
**Then** the cover letter text is pasted into the detected field
**And** the field shows "filled" with "Cover letter applied" label
**And** if no cover letter generated → field shows "skipped — generate a cover letter first"

**Given** the page is refreshed or a DOM change occurs on a filled field
**When** the undo snapshot is evaluated
**Then** the undo capability is invalidated for changed fields
**And** the undo button is hidden if all fields have been externally modified

---

## Story 6.3: IC-2 — Scan → Engine → Autofill E2E Validation

As a quality assurance stakeholder,
I want the full autofill pipeline verified end-to-end on real application forms,
So that we have confidence autofill works reliably across major ATS platforms.

**Acceptance Criteria:**

**Given** a Greenhouse application form
**When** the user navigates to the page
**Then** fields are detected by the engine, displayed in sidebar preview
**And** "Fill Application" fills all standard fields (name, email, phone, LinkedIn, resume upload)
**And** undo restores all values
**And** fill completes within 1 second (NFR4)

**Given** a Lever application form
**When** the same flow is tested
**Then** fields are correctly detected and filled
**And** any Lever-specific form patterns (multi-step, custom questions) are handled gracefully

**Given** a Workday application form
**When** the same flow is tested
**Then** React controlled form fields are filled correctly via the native setter pattern (ADR-REV-SE6)
**And** shadow DOM fields (if present) are traversed and filled

**Given** edge cases are tested
**When** the following scenarios are verified:
**Then** all pass:
- Form with no resume upload field → personal fields still fill, resume skipped
- Form with cover letter textarea + generated cover letter → cover letter injected
- Form with no matching fields → "No fillable fields found" message
- Autofill → Undo → Re-fill cycle works without errors
- Page refresh after fill → undo invalidated, fields retain filled values

**Given** autofill accuracy is measured
**When** tested across the 3 ATS platforms
**Then** mapping accuracy meets NFR9 (90%+ of standard form fields correctly filled)
**And** IC-2 report documents: platforms tested, fields filled vs skipped, accuracy metrics, issues found

---
