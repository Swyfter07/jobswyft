# Epic 3: Job Match Intelligence

Users instantly see how well they match any scanned job — free quick analysis on every scan, paid deep analysis on demand. Auth E2E flow verified.

## Story 3.1: Auth E2E Verification & Profile Auto-Creation

As a user signing in via the Chrome extension,
I want the full authentication flow to work end-to-end with my profile and free credits automatically created,
So that I can immediately start using the extension after my first Google sign-in.

**Acceptance Criteria:**

**Given** a user clicks "Sign in with Google" in the extension (AUTH-01)
**When** the OAuth flow completes via `signInWithIdToken`
**Then** Supabase issues a valid JWT
**And** the extension stores the token in `chrome.storage.session`
**And** API requests with `Authorization: Bearer <token>` return `200` (not `401`)
**And** the full token exchange is verified: extension `signInWithIdToken` → Supabase session → API JWT validation

**Given** an authenticated user calls `GET /v1/auth/me` (AUTH-02)
**When** the response is received
**Then** the response includes all required profile fields: `id`, `email`, `full_name`, `subscription_tier`, `subscription_status`, `active_resume_id`, `preferred_ai_provider`, `created_at`
**And** sensitive fields (`stripe_customer_id`) are excluded
**And** the extension profile display renders all fields correctly

**Given** a brand new user signs in for the first time (AUTH-04)
**When** the Supabase auth trigger fires
**Then** a `profiles` row is automatically created with:
- `subscription_tier` = `'free'`
- `subscription_status` = `'active'`
**And** 5 lifetime free credits are provisioned (verifiable via `GET /v1/usage`)
**And** the extension immediately shows "5 credits remaining"

**Given** an existing user signs in again
**When** the auth flow completes
**Then** the existing profile is returned (no duplicate creation)
**And** existing credits and usage data are preserved

**Given** any auth verification failure
**When** the issue is identified
**Then** the fix is applied and documented
**And** a reproducible test script exists to verify the E2E flow

---

## Story 3.2: Match Type API Enhancement & Daily Rate Limiting

As a backend developer,
I want the match endpoint to distinguish between free auto-matches and paid detailed matches with daily rate limiting,
So that free users get 20 daily auto-matches while detailed analysis costs 1 credit.

**Acceptance Criteria:**

**Given** the existing `POST /v1/ai/match` endpoint
**When** this story is complete
**Then** the endpoint accepts an additional `match_type` parameter: `"auto"` or `"detailed"`
**And** `match_type` defaults to `"auto"` if not provided (backward compatible)

**Given** `match_type=auto` and a free-tier user
**When** the user requests a match
**Then** no AI credits are deducted
**And** a daily counter increments (tracked per user per UTC day in `usage_events`)
**And** if daily count >= 20 → reject with `{"success": false, "error": {"code": "DAILY_LIMIT_REACHED", "message": "Auto-match limit reached (20/day). Upgrade for unlimited."}}`
**And** paid-tier users have unlimited auto-matches (no daily limit check)

**Given** `match_type=auto`
**When** generating the match response
**Then** the response includes a high-level analysis: `match_score` (0-100), `matched_skills` (array), `missing_skills` (array)
**And** response completes within 2 seconds (NFR3a)

**Given** `match_type=detailed` and user has credits > 0
**When** the user requests a detailed match
**Then** 1 AI credit is deducted via `usage_events`
**And** comprehensive analysis is returned: `match_score`, `strengths` (array with explanations), `gaps` (array with explanations), `recommendations` (array of actionable advice)
**And** response completes within 5 seconds (NFR3b)

**Given** `match_type=detailed` and user has 0 credits
**When** the request is made
**Then** response returns `422` with `CREDIT_EXHAUSTED` error code
**And** no usage event is created

**Given** both AI providers fail
**When** the match request errors
**Then** no credits are deducted and no daily counter is incremented (NFR24)

**Given** `GET /v1/usage` is called
**When** the response is returned
**Then** it includes new fields: `auto_matches_today` (integer) and `auto_matches_limit` (integer, 20 for free, null for paid)

---

## Story 3.3: Auto Match UI — Score, Skills & Job Card Integration

As a job seeker viewing a scanned job,
I want to instantly see a match score with skill strengths and gaps in the job card,
So that I can quickly assess my fit before deciding to apply.

**Acceptance Criteria:**

**Given** a job page has been successfully scanned and an active resume is selected
**When** the scan completes
**Then** auto-match fires automatically: `POST /v1/ai/match` with `match_type=auto`
**And** no user action is required — it's zero-click (FR23)

**Given** auto-match is loading
**When** the API call is in progress
**Then** a subtle loading skeleton appears in the match area of JobCard
**And** the rest of the JobCard (title, company, description) is already visible and interactive
**And** the loading state uses the appropriate duration pattern (500ms-2s → skeleton)

**Given** auto-match results are received
**When** rendered in the JobCard
**Then** `MatchIndicator` displays the score (0-100%) with color coding: green >=70%, yellow 40-69%, red <40% (FR23b)
**And** `SkillPill` components render: green for matched skills, yellow/dashed for missing skills
**And** strengths and gaps display side-by-side via `SkillSectionLabel` headers (FR23c)
**And** if more than 5 skills, a "+N more" collapse is shown

**Given** the match area in JobCard
**When** both action buttons are rendered
**Then** "Deep Analysis" button is visible (navigates to Match tool in AI Studio) (FR23d)
**And** "Ask Coach" button is visible (navigates to Coach tab) (FR23d)
**And** both buttons are properly styled per the functional area gradient patterns

**Given** auto-match fails
**When** the API returns an error
**Then** the match area shows an inline error with "Retry" button
**And** the rest of the JobCard remains functional
**And** no credits are shown as deducted

**Given** the user switches to a different active resume
**When** the resume selection changes
**Then** auto-match re-fires with the new resume
**And** previous match results are cleared during loading

---

## Story 3.4: Detailed Match Analysis & Credit Gating

As a job seeker who wants deeper insight,
I want to trigger a comprehensive match analysis and see clear feedback when I'm out of credits or daily limits,
So that I get actionable recommendations and understand my usage limits.

**Acceptance Criteria:**

**Given** auto-match results are displayed in the JobCard
**When** the user clicks "Deep Analysis" (or navigates to Match tab in AI Studio)
**Then** a "Detailed Analysis" button is visible with "1 credit" cost label (FR24)
**And** the button shows the credit cost based on the selected AI model (FR38b)

**Given** the user clicks "Detailed Analysis" with credits available
**When** the API call `POST /v1/ai/match` with `match_type=detailed` is made
**Then** a loading state shows (animated progress per 2s-5s duration pattern)
**And** the detailed view renders below the auto-match with: comprehensive strengths (with explanations), gaps (with explanations), and actionable recommendations (FR25)
**And** the user can copy any section to clipboard (FR40)
**And** 1 credit is deducted and the credit display updates immediately

**Given** the user has 0 AI credits
**When** they attempt "Detailed Analysis"
**Then** the button is disabled or shows credit lock pattern (blurred preview + unlock)
**And** message displays "No credits remaining" with "Upgrade coming soon" prompt (FR65)
**And** no API call is made

**Given** a free-tier user has used 20 auto-matches today
**When** they navigate to a new job page
**Then** auto-match is blocked with message "Daily limit reached (20/day). Upgrade for unlimited." (FR66)
**And** the match area shows the rate-limited state clearly
**And** "Deep Analysis" (paid) still works if the user has credits

**Given** the detailed match API call fails
**When** an error occurs
**Then** the error is displayed inline with "Retry" button
**And** credits are NOT deducted (NFR24)
**And** the auto-match results remain visible

---

## Story 3.5: IC-1 — Scan → Engine → Match E2E Validation

As a quality assurance stakeholder,
I want a verified end-to-end flow from job page scan through engine extraction to match analysis display,
So that we have confidence the full vertical slice works correctly across all layers.

**Acceptance Criteria:**

**Given** a fresh extension build with Epic 2 engine + Epic 3 match features
**When** the user navigates to a LinkedIn job posting
**Then** the engine detects the job board, extracts job data via the middleware pipeline
**And** extracted data displays in the JobCard with confidence indicators
**And** auto-match fires and score + skills render within 4 seconds total (scan + match)

**Given** the LinkedIn E2E flow passes
**When** tested on Indeed and Greenhouse
**Then** the same flow works on all 3 boards: detect → extract → display → auto-match
**And** extraction accuracy meets expectations (correct title, company, description at minimum)

**Given** the match flow works
**When** the user clicks "Deep Analysis" on any of the 3 test boards
**Then** detailed analysis returns and renders correctly
**And** 1 credit is deducted
**And** `GET /v1/usage` reflects the updated balance

**Given** edge cases are tested
**When** the following scenarios are verified:
**Then** all pass:
- New user first login → 5 credits → auto-match works → detailed match costs 1 credit → 4 credits remaining
- Free user at daily limit (20) → auto-match blocked → detailed still works
- User with 0 credits → detailed blocked with upgrade prompt
- API failure → no credit deduction, retry works
- Resume switch → auto-match re-fires with new resume

**Given** all integration tests pass
**When** results are documented
**Then** a brief IC-1 report confirms: boards tested, flows verified, edge cases covered, any issues found and resolved

---
