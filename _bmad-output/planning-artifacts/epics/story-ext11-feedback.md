# Story EXT.11: Feedback

**As a** user who has ideas or found issues,
**I want** to submit feedback directly from the extension,
**So that** the Jobswyft team can improve the product.

**FRs addressed:** FR83 (submit feedback), FR83a (categorization), FR84 (context capture), FR84a (optional screenshot)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| New | `FeedbackForm` | `features/` | Dialog with category selector, textarea, context auto-capture |
| Modified | `AppHeader` | `layout/` | Add "Send Feedback" option to settings dropdown |

## Acceptance Criteria

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

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/feedback` | POST | Submit user feedback | Exists |

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **FEEDBACK-01** | Screenshot attachment (FR84a) — requires additional UI for capture/upload. Defer to iteration. | Low |

---
