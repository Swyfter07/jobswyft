# Story 7.1: Privacy & Data Deletion API

Status: done

<!-- Validation completed: 2026-02-01 - Comprehensive context analysis applied -->

## Story

As a **user**,
I want **to understand what data is stored and request complete deletion with email confirmation**,
So that **I can exercise my privacy rights and control my personal information**.

## Acceptance Criteria

### AC1: Data Summary Endpoint (FR73)

**Given** an authenticated user wants to know what data is stored
**When** a request is made to `GET /v1/privacy/data-summary`
**Then** response returns summary of stored data:
```json
{
  "success": true,
  "data": {
    "profile": {
      "stored": true,
      "fields": ["email", "full_name", "subscription_tier", "preferences"],
      "location": "Supabase PostgreSQL (encrypted at rest)"
    },
    "resumes": {
      "count": 3,
      "max_resumes": 5,
      "at_limit": false,
      "storage": "Supabase Storage (encrypted)",
      "includes": ["PDF files", "parsed text data"]
    },
    "jobs": {
      "count": 25,
      "storage": "Supabase PostgreSQL",
      "status_breakdown": {
        "applied": 15,
        "interviewing": 6,
        "offered": 2,
        "rejected": 2
      }
    },
    "usage_history": {
      "count": 47,
      "storage": "Supabase PostgreSQL",
      "includes": ["operation type", "timestamp", "no content stored"],
      "breakdown": {
        "match": 12,
        "cover_letter": 18,
        "answer": 10,
        "outreach": 5,
        "resume_parse": 2
      }
    },
    "ai_generated_content": {
      "stored": false,
      "note": "AI outputs are never saved to our servers"
    },
    "data_retention": "Data retained until you delete your account",
    "export_available": false,
    "export_note": "Data export feature coming in future update (GDPR compliance)"
  }
}
```

### AC2: Delete Request Initiation (FR74)

**Given** an authenticated user wants to delete their account
**When** a request is made to `POST /v1/privacy/delete-request` with optional reason:
```json
{
  "reason": "no_longer_needed"
}
```
**Then** system generates a deletion confirmation token
**And** sends confirmation email to user's email address
**And** response indicates email sent:
```json
{
  "success": true,
  "data": {
    "message": "Confirmation email sent. Please check your inbox.",
    "email_sent_to": "j***@example.com",
    "expires_in": "24 hours",
    "deletion_initiated_at": "2026-02-01T12:00:00Z"
  }
}
```
**And** token expires after 24 hours

### AC3: Delete Confirmation with Token (FR75)

**Given** a user receives the confirmation email
**When** they submit token to `POST /v1/privacy/confirm-delete`:
```json
{
  "token": "abc123..."
}
```
**Then** system deletes ALL user data:
- Profile record
- All resumes (DB records + storage files)
- All jobs
- All usage_events
- All feedback records (explicit GDPR compliance - not relying on SET NULL cascade)
- Supabase auth user
**And** response confirms deletion:
```json
{
  "success": true,
  "data": {
    "message": "Your account and all data have been permanently deleted.",
    "deleted_at": "2026-02-01T12:30:00Z"
  }
}
```
**And** deletion is logged for audit (without PII)

### AC4: Invalid or Expired Token

**Given** an invalid or expired token
**When** attempting to confirm deletion
**Then** response returns `400` with error code `INVALID_TOKEN`
**And** message: "Invalid or expired deletion token. Please request again."

### AC5: Pending Deletion State

**Given** deletion confirmation is pending
**When** user makes other API requests
**Then** account functions normally until deletion is confirmed
**And** user can cancel by simply not confirming within 24 hours
**And** `GET /v1/usage` includes `pending_deletion_expires` field if deletion is pending

### AC6: Cancel Pending Deletion (Enhancement)

**Given** deletion confirmation is pending
**When** user wants to explicitly cancel
**Then** `POST /v1/privacy/cancel-delete` clears pending deletion token
**And** response confirms cancellation

---

## Tasks / Subtasks

### [x] Task 1: Create Privacy Pydantic Models

**Done when:** All privacy-related request/response models created with proper validation

**Key Implementation Points:**
- `DataStorageInfo` - Flexible schema supporting various data types
- `DataSummaryResponse` - Enhanced with resume limits, job breakdown, usage breakdown
- `DeleteRequestResponse` - Include deletion timestamp
- `ConfirmDeleteRequest` - Token validation (min 32 chars)
- `ConfirmDeleteResponse` - Include deletion timestamp
- `DeleteReasonRequest` - Optional reason enum for product feedback
- `CancelDeleteRequest` - Empty request for cancellation

Export all models in `app/models/__init__.py`

### [x] Task 2: Add Privacy Exceptions

**Done when:** Privacy-specific exceptions added with proper error codes

**Required Exceptions:**
- `PrivacyError` - Base exception for privacy domain
- `InvalidDeletionTokenError` - Invalid or missing token (400, INVALID_TOKEN)
- `DeletionTokenExpiredError` - Token expired (400, INVALID_TOKEN)
- `PendingDeletionNotFoundError` - No pending deletion (404, NOT_FOUND)

Add to `app/core/exceptions.py`

### [x] Task 3: Create Database Migration for Deletion Token Fields

**Done when:** Profiles table has deletion_token_hash and deletion_token_expires columns with optimized index

**Migration File:** Check `supabase/migrations/` for next available number (likely `0000X_add_deletion_token_fields.sql`)

**Schema Changes:**
```sql
-- Add deletion token fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deletion_token_hash TEXT,
ADD COLUMN IF NOT EXISTS deletion_token_expires TIMESTAMPTZ;

-- Partial index for active tokens only (performance optimization)
-- Reduces index size by excluding profiles without pending deletions
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_token
ON profiles(deletion_token_hash)
WHERE deletion_token_hash IS NOT NULL
  AND deletion_token_expires > NOW();

-- Documentation
COMMENT ON COLUMN profiles.deletion_token_hash IS 'SHA-256 hash of deletion confirmation token (48-byte token = 384 bits entropy)';
COMMENT ON COLUMN profiles.deletion_token_expires IS 'Expiry timestamp for deletion token (24 hours from request). Expired tokens remain until new request or account deletion.';
```

**RLS Policy Note:** Service role bypasses RLS. No policy changes needed for admin_client access.

**Storage Verification:** Ensure Supabase Storage bucket `resumes` has service role delete permissions (configured in migration 00002).

### [x] Task 4: Create Privacy Service

**Done when:** Privacy service handles data summary, token generation, email sending, and complete account deletion with proper FK constraint handling

**Create:** `app/services/privacy_service.py`

**Critical Implementation Requirements:**

**Imports:**
```python
from app.db.client import get_supabase_admin_client  # Correct pattern - verified in codebase
```

**Core Methods:**
- `get_data_summary(user_id, email)` → Enhanced summary with breakdowns
- `initiate_deletion(user_id, email, reason=None)` → Token generation, email mock, reason capture
- `confirm_deletion(token)` → Validation and full deletion
- `cancel_deletion(user_id)` → Clear pending token
- `_delete_all_user_data(user_id)` → Orchestrate complete deletion
- `_generate_deletion_token()` → `secrets.token_urlsafe(48)` = 64 chars, 384 bits entropy
- `_hash_token(token)` → SHA-256 (collision negligible with 384-bit source)
- `_mask_email(email)` → Handle edge cases (empty, multiple @, no @)

**Data Summary Enhancements:**
- Resume count + max (5) + at_limit boolean
- Job count + status breakdown (query group by status)
- Usage count + operation type breakdown (query group by operation_type)
- Export availability clarification

**Token Security:**
- Generate: `secrets.token_urlsafe(48)` → 64-char base64 string
- Store: SHA-256 hash only (never plaintext)
- Log: First 16 chars only `{token[:16]}...` for MVP testing
- Expiry: 24 hours, enforced at validation
- Cleanup: Expired tokens remain until new request or deletion (acceptable for MVP)

**Deletion Order (CRITICAL - FK Constraints):**

**CASCADE Configuration Context:**
```python
# Foreign Key Cascade Behavior (from migrations):
# - resumes.user_id → profiles.id ON DELETE CASCADE
# - jobs.user_id → profiles.id ON DELETE CASCADE
# - usage_events.user_id → profiles.id ON DELETE CASCADE
# - feedback.user_id → profiles.id ON DELETE SET NULL (we explicitly delete for GDPR)
# - profiles.id → auth.users(id) (FK prevents auth deletion before profile)

# Deletion sequence:
# 1. Resume files (Supabase Storage) - no FK, delete first
# 2. Feedback records - explicit delete (SET NULL not acceptable for GDPR)
# 3. Usage events, jobs, resumes - explicit delete (CASCADE would work but be explicit for safety)
# 4. Profile record - explicit delete
# 5. Auth user - LAST (would violate FK if deleted first)

# Why explicit deletes despite CASCADE:
# - Safety: Explicit is clearer than relying on CASCADE behavior
# - Logging: Track each deletion step for audit
# - GDPR: Explicit deletion ensures compliance requirements are met
```

**Implementation Pattern:**
```python
async def _delete_all_user_data(self, user_id: str) -> None:
    """Delete all user data from database and storage.

    Order matters: Storage first, then DB in FK-safe order, auth last.
    """
    # 1. Delete resume files from storage (batch optimization)
    resumes = self.admin_client.table("resumes").select("file_path").eq("user_id", user_id).execute()
    file_paths = [r["file_path"] for r in resumes.data or [] if r.get("file_path")]
    if file_paths:
        try:
            self.admin_client.storage.from_("resumes").remove(file_paths)  # Batch delete
            logger.info(f"Deleted {len(file_paths)} resume files - user: {user_id[:8]}...")
        except Exception as e:
            logger.error(f"Failed to delete resume files - user: {user_id[:8]}...: {e}")
            # Continue - DB records will be deleted anyway

    # 2. Explicit DB deletions (despite CASCADE, for clarity and audit)
    self.admin_client.table("feedback").delete().eq("user_id", user_id).execute()
    self.admin_client.table("usage_events").delete().eq("user_id", user_id).execute()
    self.admin_client.table("jobs").delete().eq("user_id", user_id).execute()
    self.admin_client.table("resumes").delete().eq("user_id", user_id).execute()
    self.admin_client.table("profiles").delete().eq("id", user_id).execute()

    # 3. Delete auth user LAST (FK to profiles requires profile deletion first)
    try:
        self.admin_client.auth.admin.delete_user(user_id)
        logger.info(f"Deleted auth user - user: {user_id[:8]}...")
    except Exception as e:
        # Retry once (transient network failure)
        try:
            await asyncio.sleep(2)
            self.admin_client.auth.admin.delete_user(user_id)
            logger.info(f"Deleted auth user (retry) - user: {user_id[:8]}...")
        except Exception as retry_e:
            logger.error(f"Failed to delete auth user after retry - user: {user_id[:8]}...: {retry_e}")

    # Audit log (PII-free)
    logger.warning(
        f"ACCOUNT_DELETED - user_hash: {hashlib.sha256(user_id.encode()).hexdigest()[:16]}... "
        f"timestamp: {datetime.now(timezone.utc).isoformat()} "
        f"audit_retention: 30_days_railway_logs"
    )
```

**Email Template Specification (Post-MVP):**
- Subject: "Confirm Account Deletion - Jobswyft"
- Body: Token link, 24-hour expiry, security warning about permanence, contact support option
- From: noreply@jobswyft.com
- Link format: `https://app.jobswyft.com/privacy/confirm?token={token}`

**Timezone Handling:**
```python
# Supabase returns timestamps with 'Z' suffix (UTC)
# Python's fromisoformat requires '+00:00' format (not 'Z')
expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
```

**Rate Limiting Note:** Consider implementing: 3 delete requests per hour per user (prevents spam/abuse). Add in Post-MVP.

**Security Note:** MVP uses email-only confirmation. Post-MVP: Consider requiring password before sending email for enhanced security (defense against stolen email access).

### [x] Task 5: Create Privacy Router

**Done when:** All privacy endpoints implemented with proper error handling, logging, and authentication

**Create:** `app/routers/privacy.py`

**Endpoints:**
- `GET /privacy/data-summary` - Auth required
- `POST /privacy/delete-request` - Auth required, optional reason parameter
- `POST /privacy/confirm-delete` - NO auth (token is proof of identity)
- `POST /privacy/cancel-delete` - Auth required

**Pattern:** Follow Story 6.2 patterns (factory for service, assertions before ok(), logging)

Register router in `app/main.py`:
```python
from app.routers import ai, auth, autofill, jobs, privacy, resumes, subscriptions, usage, webhooks
app.include_router(privacy.router, prefix="/v1", tags=["privacy"])
```

### [x] Task 6: Enhance Usage Endpoint with Pending Deletion Indicator

**Done when:** GET /v1/usage includes pending_deletion_expires if user has pending deletion

**Modify:** `app/services/usage_service.py` - `calculate_balance()` method

Add to return dict:
```python
# Check for pending deletion
profile_data = self.admin_client.table("profiles").select("deletion_token_expires").eq("id", user_id).single().execute()
deletion_expires = profile_data.data.get("deletion_token_expires") if profile_data.data else None

# Include in response if pending
if deletion_expires:
    result["pending_deletion_expires"] = deletion_expires
```

**Modify:** `app/models/usage.py` - `UsageResponse` schema

Add field:
```python
pending_deletion_expires: str | None = None  # ISO datetime if deletion pending
```

### [x] Task 7: Add Tests

**Done when:** Comprehensive test coverage for all privacy endpoints and service methods

**Create:** `apps/api/tests/test_privacy.py`

**Test Coverage:**
1. **Data Summary Tests:**
   - Returns enhanced summary with breakdowns
   - Resume limit indicators
   - Job status breakdown
   - Usage operation breakdown
   - Unauthenticated returns 401

2. **Delete Request Tests:**
   - Initiates deletion and returns masked email
   - Optional reason capture
   - Token logged to console (MVP)
   - Unauthenticated returns 401

3. **Confirm Delete Tests:**
   - Valid token confirms deletion
   - Invalid token returns 400 (INVALID_TOKEN)
   - Expired token returns 400 (INVALID_TOKEN)
   - Token too short rejected (Pydantic validation)

4. **Cancel Delete Tests:**
   - Clears pending deletion token
   - Returns 404 if no pending deletion

5. **Privacy Service Tests:**
   - Data summary counts records correctly
   - Email masking handles edge cases: `""`, `"@domain.com"`, `"user@@domain.com"`, `"user@"`, `"john@example.com"`, `"a@test.com"`, `"test"`
   - Delete all user data follows correct order
   - Storage batch deletion called
   - Auth user retry logic tested
   - Token hash collision negligible (SHA-256 with 384-bit source)

6. **Usage Endpoint Enhancement Tests:**
   - Returns pending_deletion_expires when present
   - Omits field when no pending deletion

### [x] Task 8: Update OpenAPI Spec

**Done when:** OpenAPI spec includes all privacy endpoints and enhanced schemas

**Modify:** `specs/openapi.yaml`

**Add Endpoints:** (Follow patterns from subscriptions/usage)
- `/v1/privacy/data-summary` - GET
- `/v1/privacy/delete-request` - POST
- `/v1/privacy/confirm-delete` - POST
- `/v1/privacy/cancel-delete` - POST

**Add Schemas:** (Follow existing schema patterns)
- `DataStorageInfo` - Enhanced with max_resumes, at_limit, breakdowns
- `DataSummaryResponse` - Complete summary
- `DeleteRequestRequest` - Optional reason field
- `DeleteRequestResponse` - Include deletion_initiated_at
- `ConfirmDeleteRequest` - Token validation
- `ConfirmDeleteResponse` - Include deleted_at
- `CancelDeleteRequest` - Empty object

**Update Schema:**
- `UsageResponse` - Add `pending_deletion_expires` field

---

## Code Review Follow-ups (Post-MVP)

### [ ] CR-1: Add Integration Test for Actual Deletion Flow
**Severity:** HIGH - No real DB test coverage
**Description:** Add integration test that creates real test user in test DB, initiates deletion, confirms with token, and verifies all data deleted including storage files and auth user. Current tests only mock the service layer.
**File:** `tests/test_privacy_integration.py` (new file)

### [ ] CR-2: Update Epic AC3 to Include Feedback Deletion
**Severity:** MEDIUM - Epic/Story consistency
**Description:** Epic 7.1 AC3 (line 1494-1499 in epics.md) doesn't list "All feedback records" in deletion list, but story AC3 and implementation do delete it. Update epic for consistency.
**File:** `_bmad-output/planning-artifacts/epics.md`

### [ ] CR-3: Implement Rate Limiting on Delete Request
**Severity:** MEDIUM - Abuse prevention
**Description:** Implement 3 delete requests per hour per user to prevent email spam. Currently unlimited deletion requests allowed.
**Implementation:** Add simple in-memory rate limit check in `initiate_deletion()`

---

## Dev Notes

### 🔴 Critical Implementation Scope

**Full Implementation with Mocked Email:** Complete privacy deletion flow with email confirmation. For MVP, confirmation email is logged to console rather than sent via email service.

**Token Security (384-bit Entropy):**
- Generation: `secrets.token_urlsafe(48)` → 64 chars, 384 bits entropy
- Storage: SHA-256 hash only (collision negligible)
- Expiry: 24 hours enforced
- Cleanup: Expired tokens remain until new request (acceptable for MVP)
- Logging: First 16 chars only for testing

**Email Template (Post-MVP):** Subject: "Confirm Account Deletion", Body: Token link, 24hr expiry, security warning, contact support option.

**Security Enhancement (Post-MVP):** Require password before sending email (defense against stolen email access).

**Rate Limiting (Post-MVP):** 3 delete requests per hour per user (prevents spam/abuse).

### 🎯 Quick Reference

**Response Envelope Pattern:**
```python
return ok({
    "message": "...",
    "email_sent_to": "j***@example.com",
    "deletion_initiated_at": "2026-02-01T12:00:00Z",
})
```

**Error Code Mapping:**
| Error | Code | HTTP |
|-------|------|------|
| Invalid token | `INVALID_TOKEN` | 400 |
| Expired token | `INVALID_TOKEN` | 400 |
| No pending deletion | `NOT_FOUND` | 404 |
| Auth required | `AUTH_REQUIRED` | 401 |

### 📋 Database Requirements Checklist

**New Columns on profiles:**
- `deletion_token_hash TEXT` - SHA-256 hash (48-byte token = 384 bits entropy)
- `deletion_token_expires TIMESTAMPTZ` - 24-hour expiry from request

**Index:** Partial index on active tokens only (performance optimization)

**Migration:** Check `supabase/migrations/` for next available number

**RLS:** Service role bypasses RLS. No policy changes needed.

**Storage:** Verify `resumes` bucket has service role delete permissions.

### 🔄 Deletion Order (FK Constraint Safety)

**CASCADE Configuration:**
- `resumes.user_id` → CASCADE
- `jobs.user_id` → CASCADE
- `usage_events.user_id` → CASCADE
- `feedback.user_id` → SET NULL (we explicitly delete for GDPR)
- `profiles.id` → referenced by auth.users (delete auth LAST)

**Execution Order:**
1. Resume files (Supabase Storage) - batch delete for performance
2. Feedback records - explicit delete (GDPR compliance)
3. Usage events, jobs, resumes - explicit delete (safety + audit)
4. Profile record - explicit delete
5. Auth user - LAST (FK constraint requires profile deletion first)

**Why Explicit Despite CASCADE:** Safety, logging, GDPR compliance clarity.

**Error Handling:** Storage/auth failures logged but don't block DB deletions. Auth delete retries once (transient failure handling).

**Audit Logging:** PII-free logs retained 30 days in Railway logs.

### 📝 Files Overview

**Create:**
- `models/privacy.py` - Enhanced models with timestamps, reason capture
- `services/privacy_service.py` - Complete privacy operations with FK-safe deletion
- `routers/privacy.py` - 4 endpoints (summary, request, confirm, cancel)
- `tests/test_privacy.py` - Comprehensive test coverage
- `supabase/migrations/0000X_add_deletion_token_fields.sql` - Schema changes with optimized index

**Modify:**
- `core/exceptions.py` - Add PrivacyError base + 3 specific exceptions
- `models/__init__.py` - Export privacy models
- `models/usage.py` - Add pending_deletion_expires field
- `services/usage_service.py` - Check for pending deletion in calculate_balance()
- `main.py` - Register privacy router
- `specs/openapi.yaml` - Add 4 endpoints + enhanced schemas

### 🎯 Patterns from Story 6.2

- Use `get_admin_client()` from `app.db.supabase` (NOT app.db.client)
- Factory function in router for dependency injection
- Return envelope format with `ok()` helper
- Type hints: `Dict[str, Any]` for returns
- Security assertions before `return ok(result)`
- Logging at WARNING level for audit events
- Tests mock service layer, not database directly
- Enhanced responses with timestamps for audit trail

### 🧪 Testing Notes (MVP)

**Email Testing:**
1. Call `POST /v1/privacy/delete-request`
2. Check console logs for token: `Token: <first_16_chars>... (full token in secure logs)`
3. Use full token in `POST /v1/privacy/confirm-delete`

**Edge Cases to Test:**
- Email masking: empty string, no @, multiple @, @ only
- Token validation: too short, invalid, expired
- Deletion order: FK constraints don't fail
- Partial failures: storage/auth errors don't block DB cleanup

### 📊 FR Coverage

| FR | Implementation |
|----|----------------|
| FR73 | `GET /v1/privacy/data-summary` - Enhanced with breakdowns and limits |
| FR74 | `POST /v1/privacy/delete-request` - With reason capture |
| FR75 | `POST /v1/privacy/confirm-delete` - Email confirmation |

### 📚 References

- Epic: `_bmad-output/planning-artifacts/epics.md` (Lines 1422-1527)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (DB schema lines 244-343, CASCADE configuration)
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR73-FR77, NFR18-19)
- Previous Story: `6-2-subscription-billing-api-mocked.md` (import patterns, service patterns)
- Database Migrations: `supabase/migrations/` (check for next available number, verify CASCADE config in 00007)

### 💡 Performance Optimizations

- Partial index on active tokens only (reduces index size)
- Batch delete resume files (single API call vs loop)
- Count queries optimized (select count only, not full records)
- Data summary could be cached 5 minutes (expected usage: once before deletion)

### 🔒 Security & Compliance

- Token: 384 bits entropy (sufficient for 24-hour expiry)
- Storage: SHA-256 hash only (collision negligible)
- Audit: PII-free logs, 30-day retention (Railway)
- GDPR: Explicit feedback deletion (not SET NULL)
- Post-MVP: Password + email confirmation for enhanced security

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Unit Tests (Mocked):**
- All 28 privacy tests pass
- All 20 usage tests pass (48 total tests in combined suite)
- No regressions introduced

**Local API Integration Tests:**
- ✅ 10/10 functional tests passed (100%)
- ✅ Test user: test@jobswyft.local
- ✅ All endpoints validated with real API calls
- ✅ Code review fixes verified in live environment
- ✅ Migration applied successfully via Supabase CLI
- See test summary in change log below

### Completion Notes List

1. **Task 1:** Created `app/models/privacy.py` with all privacy-related Pydantic models including DataSummary, DeleteRequest, ConfirmDelete, CancelDelete models with proper validation. Added `pending_deletion_expires` field to `UsageResponse` model.

2. **Task 2:** Added privacy exceptions to `app/core/exceptions.py`: `PrivacyError` (base), `InvalidDeletionTokenError`, `DeletionTokenExpiredError`, `PendingDeletionNotFoundError`.

3. **Task 3:** Created migration `00006_add_deletion_token_fields.sql` adding `deletion_token_hash` and `deletion_token_expires` columns to profiles table with partial index optimization.

4. **Task 4:** Created `app/services/privacy_service.py` with complete implementation including: data summary with breakdowns, secure token generation (384-bit entropy), SHA-256 hashing, email masking, deletion confirmation flow, and FK-safe complete data deletion (storage files, DB records, auth user).

5. **Task 5:** Created `app/routers/privacy.py` with 4 endpoints: GET /data-summary, POST /delete-request, POST /confirm-delete (no auth required), POST /cancel-delete. Registered router in `app/main.py`.

6. **Task 6:** Enhanced `UsageService.calculate_balance()` to include `pending_deletion_expires` field when user has active pending deletion. Added defensive handling for mock test scenarios.

7. **Task 7:** Created comprehensive test suite `tests/test_privacy.py` with 28 tests covering authentication, data summary, delete request, confirm delete, cancel delete, service unit tests (email masking, token generation, data summary), and usage endpoint enhancement.

8. **Task 8:** Updated `specs/openapi.yaml` with 4 privacy endpoints and 15 new schemas including DataSummaryResponse, DeleteRequestResponse, ConfirmDeleteRequest/Response, CancelDeleteResponse, and supporting schemas.

### File List

**Created:**
- apps/api/app/models/privacy.py
- apps/api/app/services/privacy_service.py
- apps/api/app/routers/privacy.py
- apps/api/tests/test_privacy.py
- supabase/migrations/00006_add_deletion_token_fields.sql

**Modified:**
- apps/api/app/models/__init__.py (added privacy model exports)
- apps/api/app/models/usage.py (added pending_deletion_expires field)
- apps/api/app/core/exceptions.py (added privacy exceptions)
- apps/api/app/services/usage_service.py (added pending_deletion_expires check)
- apps/api/app/main.py (registered privacy router)
- specs/openapi.yaml (added privacy endpoints and schemas)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-01 | Story implementation completed - all 8 tasks done, 28 tests passing | Claude Opus 4.5 |
| 2026-02-01 | **Code Review Fixes Applied** - Fixed 10 HIGH + 5 MEDIUM issues | Claude Sonnet 4.5 |
|  | - Security: Token logging now environment-aware (dev only) |  |
|  | - Error Handling: Deletion failures now raise DatabaseError |  |
|  | - Validation: Token length assertion added (64 chars) |  |
|  | - Validation: Admin client initialization check added |  |
|  | - Race Condition: Check for existing pending deletion |  |
|  | - Performance: Parallelized data summary queries (asyncio.gather) |  |
|  | - Logging: All audit events now use WARNING level |  |
|  | - Code Quality: Simplified email masking logic |  |
|  | - Documentation: Import path corrected, AC3 feedback clarified |  |
|  | - Note Added: Rate limiting TODO for post-MVP |  |
| 2026-02-01 | **Migration Applied + Local API Testing** | Claude Sonnet 4.5 |
|  | - Fixed migration: Removed NOW() from partial index (not immutable) |  |
|  | - Applied via Supabase CLI: `supabase link + db push --include-all` |  |
|  | - Comprehensive testing: 10/10 tests passed (100%) |  |
|  | - Validated: Data summary, delete request, cancel, duplicate detection |  |
|  | - Validated: Token validation, auth requirements, pending_deletion_expires |  |
|  | - All code review fixes verified in live environment |  |
|  | - Test user: test@jobswyft.local (not deleted for reusability) |  |
