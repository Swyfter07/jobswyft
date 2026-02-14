# Epic 7: Usage, Credits & Upgrade Flow

Users track their AI credit balance, see daily auto-match limits, select AI models with per-operation pricing, and receive clear upgrade prompts when credits run out.

## Story 7.1: Usage Store & Credit Display

As a user of AI features,
I want to see my real credit balance and daily auto-match usage in the sidebar,
So that I can track my usage and plan my applications wisely.

**Acceptance Criteria:**

**Given** the user is authenticated and the sidebar opens
**When** the extension loads
**Then** `GET /v1/usage` is called and a Zustand `usage-store` is populated with: `credits_used`, `credits_limit`, `credits_remaining`, `subscription_tier`, `auto_matches_today`, `auto_matches_limit`

**Given** the `CreditBar` component in the sidebar footer
**When** wired to the usage-store
**Then** it displays real credit balance: "N remaining" format (FR57)
**And** color coding: green (>50% remaining), yellow (20-50%), red (<=20%), destructive at 0
**And** for free tier: a secondary indicator shows "X/20 auto-matches today" (FR58)
**And** tier status badge displays: Free, Starter, Pro, or Power (FR59)

**Given** the user taps the CreditBar
**When** the detail view expands (CreditBalance component)
**Then** it shows: tier name, credits used, credits remaining, percentage progress bar
**And** for free tier: "5 lifetime credits" label with "X of 20 auto-matches remaining today"
**And** for paid tier: "Monthly credits" with current period info

**Given** any AI operation completes (success or failure)
**When** the operation callback fires
**Then** `GET /v1/usage` is called to refresh balance from server
**And** CreditBar updates immediately with fresh data
**And** local optimistic updates (decrement on send) are reconciled with server state

**Given** Storybook stories for CreditBar and CreditBalance
**When** reviewed
**Then** stories cover: full credits, low credits (warning), zero credits (destructive), free tier with daily counter, paid tier without daily counter, dark/light, 360x600

---

## Story 7.2: Credit Gating, Model Selection & Upgrade Prompts

As a user running out of credits,
I want clear feedback when I'm blocked, the ability to select AI models, and a path to upgrade,
So that I understand my limits and can make informed choices about credit usage.

**Acceptance Criteria:**

**Given** the cross-cutting credit gating requirement
**When** this story is complete
**Then** a shared `useCreditGating()` hook exists that:
- Reads from the usage-store
- Checks `credits_remaining > 0` for paid operations
- Checks `auto_matches_today < auto_matches_limit` for auto-match
- Returns `{ canProceed, reason, isLocked }` for UI gating
**And** the hook is wired into AI feature components via their existing `isLocked` and credit-related props
**And** NO modifications to Epic 3-6 component internals — credit state flows through props from the shared store

**Given** the user has 0 credits and tries a paid operation (FR64)
**When** the credit gate blocks
**Then** the action button shows the credit lock pattern (blurred preview + unlock button)
**And** an `UpgradePrompt` component displays: "No credits remaining. Upgrade coming soon — paid plans will unlock unlimited AI features." (FR65)
**And** the prompt is styled consistently across all AI tools

**Given** a free-tier user at daily auto-match limit (FR66)
**When** they navigate to a new job
**Then** auto-match is blocked with "Daily limit reached (20/day). Upgrade for unlimited."
**And** paid features (detailed match, cover letter, outreach, coach) are NOT blocked by the daily limit — only by credit balance

**Given** the model selection feature (FR38a-c)
**When** the user initiates any paid AI generation
**Then** a model selector is available (e.g., Claude, GPT) (FR38a)
**And** per-operation cost is displayed based on the selected model (FR38b)
**And** credit deduction uses the selected model's pricing multiplier (FR38c)
**And** model selection persists in the usage-store

**Given** the UpgradePrompt component
**When** rendered in Storybook
**Then** stories cover: credit exhausted state, daily limit state, model selector with pricing, dark/light, 360x600

---
