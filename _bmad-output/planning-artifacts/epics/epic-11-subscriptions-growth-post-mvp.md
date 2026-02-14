# Epic 11: Subscriptions & Growth (Post-MVP)

Users subscribe to paid plans, manage billing, and earn referral credits.

## Story 11.1: Stripe Integration & Subscription Management

As a user who wants more AI credits,
I want to subscribe to a paid plan and manage my billing,
So that I can unlock unlimited AI features.

**Acceptance Criteria:**

**Given** the mocked Stripe service from alpha (Story 6.2)
**When** this story is complete
**Then** `MockStripeService` is replaced with `RealStripeService` implementing the same interface
**And** `STRIPE_MOCK_MODE=false` activates real Stripe API calls

**Given** a user clicks "Upgrade" (FR61)
**When** `POST /v1/subscriptions/checkout` is called with `{ tier, success_url, cancel_url }`
**Then** a real Stripe Checkout session is created with the correct price ID
**And** the user is redirected to Stripe's hosted checkout page
**And** supported tiers: Starter ($4.99/mo), Pro ($9.99/mo), Power ($19.99/mo)

**Given** a successful Stripe payment
**When** Stripe sends a webhook to `POST /v1/webhooks/stripe`
**Then** webhook signature is verified (security)
**And** `checkout.session.completed` event updates user's `subscription_tier` and `subscription_status`
**And** `credits_limit` is updated based on the new tier (from `global_config`)

**Given** a paid user wants to manage their subscription (FR62)
**When** `POST /v1/subscriptions/portal` is called
**Then** a real Stripe Customer Portal URL is returned
**And** the user can upgrade, downgrade, or cancel from the portal

**Given** a subscription is cancelled
**When** the `customer.subscription.deleted` webhook fires
**Then** `subscription_tier` reverts to "free"
**And** `subscription_status` is set to "cancelled"
**And** remaining credits for the current period are still usable until period end

---

## Story 11.2: Referral System & Advanced Credit Pricing

As a user who loves Jobswyft,
I want to earn free credits by referring friends and have transparent per-model pricing,
So that I can extend my usage and choose the best AI model for my budget.

**Acceptance Criteria:**

**Given** the referral system (FR63)
**When** this story is complete
**Then** each user has a unique referral code (generated on signup)
**And** a "Refer a Friend" section in the dashboard shows the referral link
**And** when a referred user signs up, the referrer receives bonus credits (from `global_config.referral_bonus_credits`)
**And** a usage_event with negative `credits_used` records the credit addition

**Given** configurable token-to-credit conversion (FR66a)
**When** an AI operation runs
**Then** actual token consumption is tracked
**And** credit cost = tokens_used * conversion_ratio (from `global_config`)
**And** the conversion ratio is admin-configurable (Epic 10)

**Given** per-model credit multipliers (FR66b)
**When** a user selects a more expensive model
**Then** the credit cost is multiplied by the model's pricing multiplier
**And** e.g., GPT-4o = 1x, Claude 3.5 Sonnet = 1.2x (configurable)
**And** the UI displays the adjusted cost before generation (FR38b)

**Given** Coach token-based pricing (FR66c)
**When** a Coach conversation message is processed
**Then** credit cost is calculated based on actual token consumption (not flat 1 credit)
**And** longer conversations cost more, proportional to context length
**And** the user sees estimated cost before sending
