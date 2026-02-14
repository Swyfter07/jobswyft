# Epic 8: User Feedback

Users report bugs, suggest features, and share ideas with contextual metadata and optional screenshot attachment from the sidebar.

## Story 8.1: Feedback Form & Context Capture

As a user who found an issue or has an idea,
I want to submit feedback directly from the extension with automatic context capture,
So that the Jobswyft team gets actionable reports with all the information they need.

**Acceptance Criteria:**

**Given** the user clicks "Send Feedback" in the AppHeader settings dropdown
**When** the feedback dialog opens
**Then** a `FeedbackForm` component renders with:
- Category selector: Bug Report, Feature Request, General Feedback (FR83a)
- Content textarea with placeholder text
- Submit button (disabled until content >= 10 characters)
**And** the dialog is properly styled with semantic tokens, dark/light support

**Given** the user fills in feedback and clicks Submit
**When** the submission triggers
**Then** context is automatically captured (FR84):
- Current page URL
- Active sidebar tab and sub-tab
- Last user action performed (e.g., "Generated cover letter", "Ran auto-match")
- Browser version and extension version
**And** `POST /v1/feedback` is called with `{ content, category, context }`
**And** on success: "Thanks for your feedback!" confirmation, form closes
**And** on failure: error message with "Retry" option, form stays open

**Given** the feedback form validates input
**When** the user has not entered sufficient content
**Then** the submit button is disabled
**And** a character count or minimum length hint is shown

**Given** the user cancels the feedback form
**When** they click outside or press Escape
**Then** the dialog closes without submitting
**And** any entered content is lost (no draft persistence needed)

**Given** Storybook stories for FeedbackForm
**When** reviewed
**Then** stories cover: empty form, filled form, category selected, submitting (loading), success confirmation, error state, dark/light, 360x600

---

## Story 8.2: Screenshot Attachment Support

As a user reporting a bug,
I want to optionally attach a screenshot with my feedback,
So that the team can see exactly what I'm seeing.

**Acceptance Criteria:**

**Given** the FeedbackForm is open (FEEDBACK-01)
**When** the user toggles "Attach Screenshot"
**Then** a screenshot of the current page is captured via `chrome.tabs.captureVisibleTab()`
**And** a preview thumbnail of the screenshot is displayed in the form
**And** the user can remove the screenshot before submitting

**Given** the user submits feedback with a screenshot attached
**When** the submission triggers
**Then** the screenshot is uploaded to Supabase Storage (`feedback-screenshots/{user_id}/{uuid}.png`)
**And** the storage path is included in the feedback context: `{ ..., screenshot_path: "feedback-screenshots/..." }`
**And** `POST /v1/feedback` is called with the updated context including the screenshot reference (FR84a, FR85)

**Given** screenshot capture fails (permission denied or API error)
**When** the capture attempt errors
**Then** the toggle reverts to off with a brief error message: "Could not capture screenshot"
**And** the user can still submit feedback without the screenshot

**Given** backend support for screenshot references
**When** the feedback is stored
**Then** the `context` JSONB field includes `screenshot_path`
**And** no changes to the feedback table schema are needed (JSONB is flexible)

**Given** Storybook stories for screenshot attachment
**When** reviewed
**Then** stories cover: no screenshot, screenshot captured (with preview), screenshot removed, capture error, dark/light

---
