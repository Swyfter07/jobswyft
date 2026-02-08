# Story EXT.10: Usage, Credits & Upgrade Prompts

**As a** job seeker using AI features,
**I want** to see my remaining credits and understand my limits,
**So that** I can use my credits wisely and know when to upgrade.

**FRs addressed:** FR57 (view balance), FR58 (daily auto-match remaining), FR59 (tier status), FR60 (5 free credits), FR60a (20 auto-matches/day free), FR60b (unlimited paid), FR64 (block when no balance), FR65 (upgrade message), FR66 (block auto-match at daily limit)

## Component Inventory

| Status | Component | Directory | Notes |
|--------|-----------|-----------|-------|
| Existing | `CreditBar` | `blocks/` | Compact bar with credit count, color-coded. Props: `credits`, `maxCredits`, `onBuyMore` |
| Existing | `CreditBalance` | `blocks/` | Detail card with progress bar. Props: `total`, `used`, `onBuyMore` |
| New | Zustand `usage-store` | Extension `stores/` | Balance, tier, daily counts, refresh logic |
| New | `UpgradePrompt` | `blocks/` | Modal/dialog for "Upgrade coming soon" message |
| New | Credit check interceptor | Extension `lib/` | Shared function that gates AI operations |
| Modified | `CreditBar` | `blocks/` | Wire to real GET /v1/usage data |
| Modified | `CreditBalance` | `blocks/` | Wire to real data, show tier info |

## Acceptance Criteria

**Given** the user is authenticated and sidebar is open
**When** `GET /v1/usage` is called on load
**Then** the CreditBar at the bottom of ExtensionSidebar shows real credit balance
**And** color coding: green (>50%), yellow (20-50%), red (≤20%)

**Given** the user taps the CreditBar
**When** the detail view expands
**Then** CreditBalance shows: tier name (Free/Starter/Pro/Power), credits used, credits remaining, percentage bar
**And** for free tier: "5 lifetime credits" label
**And** for free tier: "X of 20 auto-matches remaining today" counter

**Given** the user tries to use an AI feature (detailed match, cover letter, outreach, chat)
**When** the credit check interceptor runs
**Then** if credits > 0 → allow operation, decrement locally, refresh from API after
**And** if credits = 0 → block with disabled button + "No credits remaining" message
**And** show UpgradePrompt: "Upgrade coming soon — paid plans will unlock unlimited AI features"

**Given** the user is on free tier and tries auto-match
**When** they have used 20 auto-matches today
**Then** auto-match is blocked with "Daily limit reached (20/day)" message
**And** "Upgrade for unlimited auto-matches" prompt shown

**Given** an AI operation completes (success or failure)
**When** the operation callback fires
**Then** `GET /v1/usage` is called to refresh the balance from the server
**And** CreditBar updates with fresh data

**Given** this story retrofits credit checks into previous stories
**When** EXT.6 (match), EXT.7 (cover letter/outreach), EXT.8 (chat), EXT.12 (coach) are already implemented
**Then** a shared `useCreditGating()` hook is called before each AI operation
**And** the hook reads from usage-store and blocks if insufficient
**And** retrofit scope is LIMITED TO: shared Zustand stores + credit components (CreditBar, UpgradePrompt, useCreditGating hook)
**And** NO modifications to EXT.6-9/EXT.12 component files — those components already accept `isLocked` and credit-related props; EXT.10 wires the props to real data via the shared store

## Backend Integration

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/v1/usage` | GET | Get current balance and limits | Exists |

## Data Mapping

Use existing mapper: `mapUsageResponse()` from `@jobswyft/ui`.

---
