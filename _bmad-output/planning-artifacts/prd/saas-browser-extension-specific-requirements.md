# SaaS + Browser Extension Specific Requirements

## Tenant Model

- B2C multi-user with per-user data isolation via Supabase RLS
- No multi-tenant (team/org) for MVP — deferred to Phase 4
- Single shared database, user-scoped queries
- Admin access via separate role mechanism (simple `is_admin` flag on profiles for MVP)

## RBAC Matrix

| Permission | Anonymous | User (Free) | User (Paid) | Admin |
|------------|-----------|-------------|-------------|-------|
| Install extension | Yes | - | - | - |
| Google OAuth login | Yes | - | - | - |
| Upload resumes (max 5) | - | Yes | Yes | - |
| Scan pages | - | Yes | Yes | - |
| Quick match | - | Yes (daily limit) | Yes (tier limit) | - |
| AI generation | - | Yes (lifetime limit) | Yes (tier limit) | - |
| Model selection | - | Default only | Yes (differential pricing) | - |
| Autofill | - | Yes | Yes | - |
| User Dashboard | - | Yes | Yes | - |
| Manage own data | - | Yes | Yes | - |
| Admin Dashboard | - | - | - | Yes |
| Tier config management | - | - | - | Yes |
| User management | - | - | - | Yes |
| Feedback review | - | - | - | Yes |
| Usage analytics | - | - | - | Yes |

## Subscription & Credit System

**MVP:** Simple generation-based credits. 1 generation = 1 credit. Config-driven limits per tier.

**Post-MVP Enhancement — Token-Based Credit System:**
- Credits become token-denominated: 1 credit = configurable amount of tokens (e.g., 1 credit = 1,000 tokens)
- Different models consume credits at different rates (e.g., GPT-4.0 = 1x, Claude Opus = 3x, GPT-4.5 = 2x)
- Context-driven pricing: longer Coach chats consume more credits based on actual token usage
- Credit cost per operation varies by:
  - Model selected (multiplier per model)
  - Operation type (quick match vs. detailed match vs. cover letter vs. coach message)
  - Context length (chat history depth for Coach)
- Credit balance displayed in real-time, with per-operation cost preview before execution
- All multipliers and token-to-credit ratios configurable in backend

## Integration Architecture

| Integration | Type | MVP? | Details |
|------------|------|------|---------|
| Supabase Auth | OAuth | Yes | Google OAuth for all users |
| Supabase DB | PostgreSQL | Yes | All persistent data |
| Supabase Storage | File storage | Yes | Resume files |
| Claude API | AI Provider | Yes | Primary for generation, fallback for quick match |
| GPT-4.0 API | AI Provider | Yes | Primary for quick match |
| Chrome APIs | Browser | Yes | Storage, scripting, sidePanel, tabs |
| Stripe | Payments | Post-MVP | Subscription billing (Phase 2) |
| Job Board APIs | Data | Future | Greenhouse Job Board API, Ashby API |

**API Contract:** `specs/openapi.yaml` — source of truth (54 endpoints documented).

## Implementation Considerations

- Extension must handle offline/degraded gracefully (no offline mode, clear error states)
- API must be independently deployable from extension
- User Dashboard and Admin Dashboard share `@jobswyft/ui` component library
- Admin Dashboard must never be accessible to regular users (separate auth gate)
- Config changes propagate within minutes without extension or API restarts
- All surfaces read tier/credit config from backend at startup and on config-change events
