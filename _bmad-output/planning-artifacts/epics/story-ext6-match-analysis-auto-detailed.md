# Story EXT.6: Match Analysis (Auto + Detailed)

**As a** job seeker viewing a scanned job,
**I want** to instantly see how well I match and optionally get deeper analysis,
**So that** I can decide whether to apply and know what to highlight.

**FRs addressed:** FR23 (auto match on scan), FR23a (free with rate limits), FR23b (score + skill indicators), FR23c (side-by-side layout), FR24 (detailed match — 1 credit), FR25 (comprehensive analysis)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `MatchIndicator` | `blocks/` | Score ring (green/yellow/red). Props: `score`, `showLabel` |
| Existing | `SkillPill` | `blocks/` | Matched (green), missing (dashed), neutral. Props: `name`, `variant` |
| Existing | `SkillSectionLabel` | `blocks/` | Section header with dot. Props: `label`, `variant` (success/warning) |
| Existing | `JobCard` | `features/` | Has match area. Props: `match: { score, matchedSkills, missingSkills }` |
| New | `DetailedMatchView` | `features/` or inline in JobCard | Expanded analysis: strengths, gaps, recommendations |
| Modified | `JobCard` | `features/` | Ensure match area renders auto-match data; add "Detailed Analysis" button |

## Acceptance Criteria

**Given** a job page has been successfully scanned (EXT.5)
**When** the scan completes and an active resume is selected
**Then** auto-match fires automatically: `POST /v1/ai/match` with `match_type=auto`
**And** the match result renders within the JobCard: MatchIndicator (score), SkillPills (green matched, yellow missing), side-by-side via SkillSectionLabels

**Given** auto-match is loading
**When** the API call is in progress
**Then** a subtle loading indicator appears in the match area of JobCard
**And** the rest of the JobCard (title, company, description) is already visible

**Given** auto-match results are displayed
**When** the user wants deeper analysis
**Then** a "Detailed Analysis" button is visible (with "1 credit" label)
**And** clicking it calls `POST /v1/ai/match` with `match_type=detailed`
**And** the detailed view expands below with comprehensive strengths, gaps, and actionable recommendations

**Given** the user is on free tier
**When** they have used 20 auto-matches today
**Then** auto-match is blocked with message "Daily limit reached (20/day). Upgrade for unlimited."
**And** the match area shows the blocked state

**Given** the user has 0 AI credits
**When** they click "Detailed Analysis"
**Then** the action is blocked with "No credits remaining" message
**And** the "Upgrade coming soon" prompt is shown

**Given** the match API call fails
**When** an error occurs
**Then** the match area shows an error state with "Retry" button
**And** user's credits are NOT deducted (NFR24)

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/ai/match` | POST | Generate match analysis | Exists — needs `match_type` param (auto/detailed) |

## Tech Debt

| Item | Description | Priority |
|------|-------------|----------|
| **MATCH-01** | Update `POST /v1/ai/match` to accept `match_type` parameter (auto = free, detailed = 1 credit) | High |
| **MATCH-02** | Backend daily auto-match rate limiting for free tier (20/day per user) | High |

---
