# Epic 10: Admin Dashboard

Admins configure tier definitions, manage users, review analytics and feedback, and manage system-wide configuration — all changes propagate to all surfaces without code deploys.

## Story 10.1: Admin Auth Gate & Dashboard Shell

As an admin user,
I want a separate admin area with role-based access control,
So that only authorized admins can access platform management tools.

**Acceptance Criteria:**

**Given** the Next.js app from Epic 9
**When** this story is complete
**Then** an admin route group `/(admin)/` exists per ADR-REV-EX6
**And** routes include: `/admin`, `/admin/users`, `/admin/tiers`, `/admin/analytics`, `/admin/feedback`, `/admin/config`, `/admin/roles`

**Given** a user navigates to any `/admin/*` route (FR86)
**When** the auth check runs
**Then** the system verifies the user has the Supabase admin role (NFR45)
**And** if admin → admin dashboard shell renders with sidebar navigation
**And** if NOT admin → redirect to user dashboard with "Access denied" message
**And** the admin auth gate is separate from the user dashboard auth

**Given** the admin dashboard shell
**When** rendered
**Then** a sidebar navigation displays: Users, Tier Config, Analytics, Feedback, System Config, Roles
**And** the layout is distinct from the user dashboard (admin badge, different accent color)
**And** responsive: sidebar collapses on mobile

**Given** admin actions throughout the dashboard
**When** any admin action is performed (tier change, role assignment, config update)
**Then** the action is logged with timestamp, admin user ID, action type, and details (NFR46)
**And** audit logs are stored in a new `admin_audit_log` table

---

## Story 10.2: User Management & Feedback Review

As an admin,
I want to view user accounts and review feedback submissions,
So that I can understand user engagement and respond to product feedback.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin/users` (FR87)
**When** the page loads
**Then** a searchable user list renders with columns: email, name, tier, signup date, last active, jobs count, resumes count, credits used
**And** search works by email or name (partial match)
**And** the list supports pagination and sorting by any column

**Given** a user row in the list
**When** the admin clicks to expand
**Then** detailed engagement metrics display: total scans, AI generations by type, last login, subscription history

**Given** the admin navigates to `/admin/feedback` (FR90)
**When** the page loads
**Then** feedback submissions render in a list with: date, user email, category, content preview, tags
**And** the admin can filter by category (Bug, Feature Request, General)
**And** the admin can sort by date (newest first default)

**Given** a feedback item
**When** the admin clicks to view details
**Then** full content displays with context metadata (page URL, browser, sidebar state)
**And** screenshot preview if attached (from Story 8.2)
**And** the admin can add tags (e.g., "needs-follow-up", "duplicate", "planned", "resolved")
**And** the admin can update the category if miscategorized

---

## Story 10.3: Tier Configuration & System Settings

As an admin,
I want to configure tier definitions, rate limits, and model pricing without code deploys,
So that I can adjust the product offering dynamically.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin/tiers` (FR88)
**When** the page loads
**Then** all tier definitions display in an editable form: tier name, generation limit, auto-match limit, pricing, feature flags
**And** current values are loaded from `global_config` table (FR93)

**Given** the admin edits a tier definition
**When** they save changes
**Then** the `global_config` record is updated via API
**And** changes propagate to all surfaces within 5 minutes (FR94, NFR50)
**And** the admin sees a success confirmation with the previous and new values
**And** the change is audit-logged (NFR46)

**Given** the admin navigates to `/admin/config` (FR91)
**When** the page loads
**Then** system-wide settings display: rate limits (daily auto-match), model pricing (per-model credit multipliers), global parameters (referral bonus credits)
**And** each setting is editable with save/revert controls

**Given** configuration propagation (FR95)
**When** a config change is saved
**Then** the extension picks up the new config on next `GET /v1/usage` or config sync
**And** the API reads updated config from the database on next request
**And** no code deploys or restarts are required

---

## Story 10.4: Platform Analytics & Role Management

As an admin,
I want to view platform usage analytics and manage admin roles,
So that I can understand product health and delegate admin access.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin/analytics` (FR89)
**When** the page loads
**Then** key metrics display: total users, active users (7d/30d), total scans, total AI generations, credit utilization rate
**And** a conversion funnel shows: installs → signups → first scan → first AI generation → paid conversion
**And** metrics are computed from database aggregations (not real-time)
**And** a date range filter allows viewing different time periods

**Given** the analytics dashboard
**When** generation metrics are displayed
**Then** breakdowns show: by operation type (match, cover letter, outreach, coach), by AI provider (Claude, GPT), by tier (free, starter, pro, power)

**Given** the admin navigates to `/admin/roles` (FR92)
**When** the page loads
**Then** a list of current admin users displays with: email, name, role assigned date, assigned by
**And** the admin can search for a user by email to assign admin role
**And** the admin can revoke admin role from existing admins

**Given** a role change is made
**When** the admin assigns or revokes a role
**Then** the Supabase user metadata is updated with the admin role
**And** the change is audit-logged with: who made the change, who was affected, action type
**And** a confirmation dialog requires explicit acknowledgment before role changes

---
