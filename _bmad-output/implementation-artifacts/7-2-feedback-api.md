# Story 7.2: Feedback API

Status: done

<!-- Validation completed: 2026-02-01 - Comprehensive context analysis applied, 5 enhancements added -->

## Story

As a **user**,
I want **to submit feedback about the product with optional context**,
So that **the team can improve Jobswyft based on my experience**.

## Acceptance Criteria

### AC1: Feedback Table Migration (FR80)

**Given** the `feedback` table does not exist
**When** migrations are run
**Then** the table is created:
```sql
feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  category   TEXT,
  context    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
**And** RLS allows users to insert their own feedback
**And** RLS prevents users from reading others' feedback
**And** index on `(user_id)` for user lookup
**And** index on `(category, created_at)` for admin filtering (future)

### AC2: Submit Feedback Endpoint (FR78, FR79, FR80)

**Given** an authenticated user wants to submit feedback
**When** a request is made to `POST /v1/feedback`:
```json
{
  "content": "The cover letter generation is amazing! Would love to see more tone options.",
  "category": "feature_request",
  "context": {
    "page_url": "https://linkedin.com/jobs/123",
    "feature_used": "cover_letter",
    "browser": "Chrome 120"
  }
}
```
**Then** feedback is saved to database
**And** response confirms submission:
```json
{
  "success": true,
  "data": {
    "message": "Thank you for your feedback!",
    "feedback_id": "uuid"
  }
}
```

### AC3: Supported Feedback Categories

**Given** valid feedback categories
**When** submitting feedback
**Then** supported categories are: `bug`, `feature_request`, `general`, `praise`, `complaint`
**And** category is optional (defaults to `general`)

### AC4: Flexible Context Capture (FR79)

**Given** feedback submission
**When** context is provided
**Then** context is stored as JSONB for analysis
**And** context fields are optional and flexible
**And** common fields supported: `page_url`, `feature_used`, `browser`, `extension_version`

### AC5: Content Validation

**Given** feedback content is empty or too short
**When** attempting to submit
**Then** response returns `400` with `VALIDATION_ERROR`
**And** message: "Feedback content must be at least 10 characters"

### AC6: Authentication Required

**Given** an unauthenticated user
**When** attempting to submit feedback
**Then** response returns `401` with `AUTH_REQUIRED`
**And** anonymous feedback is not supported (need user context for follow-up)

### AC7: Content Length Limits

**Given** feedback content exceeds maximum length
**When** attempting to submit
**Then** response returns `400` with `VALIDATION_ERROR`
**And** message: "Feedback content must not exceed 5000 characters"

---

## Tasks / Subtasks

### [x] Task 1: Create Feedback Database Migration (AC: #1)

**Done when:** Feedback table exists with proper schema, RLS policies, and indexes

**Create:** `supabase/migrations/00007_create_feedback.sql` (verify next available number)

**Schema:**
```sql
-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraints
ALTER TABLE feedback
ADD CONSTRAINT feedback_content_not_empty CHECK (char_length(content) >= 10),
ADD CONSTRAINT feedback_content_max_length CHECK (char_length(content) <= 5000),
ADD CONSTRAINT feedback_category_valid CHECK (
    category IN ('bug', 'feature_request', 'general', 'praise', 'complaint')
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback (optional - for future "my feedback" feature)
CREATE POLICY "Users can read own feedback"
ON feedback FOR SELECT
USING (auth.uid() = user_id);

-- Service role can read all feedback (for admin analysis)
-- (Service role bypasses RLS by default)

-- Indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_category_created ON feedback(category, created_at DESC);

-- Comments
COMMENT ON TABLE feedback IS 'User feedback for product improvement. User_id SET NULL on account deletion preserves feedback for analysis.';
COMMENT ON COLUMN feedback.category IS 'Feedback type: bug, feature_request, general, praise, complaint';
COMMENT ON COLUMN feedback.context IS 'Flexible JSONB for page_url, feature_used, browser, extension_version, etc.';
```

**Verify:** Check `supabase/migrations/` for the correct next migration number.

### [x] Task 2: Create Feedback Pydantic Models (AC: #2, #3, #4, #5, #7)

**Done when:** All feedback request/response models created with proper validation

**Create:** `app/models/feedback.py`

**Models:**
```python
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, field_validator

class FeedbackCategory(str, Enum):
    """Valid feedback categories."""
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    GENERAL = "general"
    PRAISE = "praise"
    COMPLAINT = "complaint"

class FeedbackRequest(BaseModel):
    """Request to submit feedback."""
    content: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Feedback content (10-5000 characters)"
    )
    category: Optional[FeedbackCategory] = Field(
        default=FeedbackCategory.GENERAL,
        description="Feedback category"
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context (page_url, feature_used, browser, etc.)"
    )

    @field_validator('content')
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Feedback content cannot be empty")
        return v.strip()

class FeedbackResponse(BaseModel):
    """Response after submitting feedback."""
    message: str = "Thank you for your feedback!"
    feedback_id: str
```

**Export:** Add to `app/models/__init__.py`

### [x] Task 3: Create Feedback Service (AC: #2)

**Done when:** Feedback service handles submission with proper error handling

**Create:** `app/services/feedback_service.py`

**Implementation:**
```python
"""Feedback service for user feedback collection."""

import logging
from typing import Any, Dict, Optional

from app.db.client import get_supabase_admin_client

logger = logging.getLogger(__name__)


class FeedbackService:
    """Service for feedback operations."""

    def __init__(self):
        """Initialize feedback service with admin client."""
        self.admin_client = get_supabase_admin_client()
        assert self.admin_client is not None, "Failed to initialize Supabase admin client"

    async def submit_feedback(
        self,
        user_id: str,
        content: str,
        category: str = "general",
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Submit user feedback.

        Args:
            user_id: User's UUID.
            content: Feedback content (already validated).
            category: Feedback category (already validated).
            context: Optional context data.

        Returns:
            Dictionary with feedback_id and confirmation message.
        """
        # Prepare feedback data
        feedback_data = {
            "user_id": user_id,
            "content": content,
            "category": category,
        }

        # Add context if provided (sanitize sensitive fields)
        if context:
            # Strip any potentially sensitive data
            safe_context = {
                k: v for k, v in context.items()
                if k in ["page_url", "feature_used", "browser", "extension_version", "screen_size"]
            }
            if safe_context:
                feedback_data["context"] = safe_context

        # Insert feedback
        response = (
            self.admin_client.table("feedback")
            .insert(feedback_data)
            .execute()
        )

        if not response.data:
            logger.error(f"Failed to insert feedback - user: {user_id[:8]}...")
            raise Exception("Failed to save feedback")

        feedback_id = response.data[0]["id"]

        logger.info(
            f"FEEDBACK_SUBMITTED - user: {user_id[:8]}... "
            f"category: {category} "
            f"feedback_id: {feedback_id[:8]}..."
        )

        return {
            "message": "Thank you for your feedback!",
            "feedback_id": feedback_id,
        }
```

### [x] Task 4: Create Feedback Router (AC: #2, #6)

**Done when:** Feedback endpoint implemented with proper auth and error handling

**Create:** `app/routers/feedback.py`

**Implementation:**
```python
"""Feedback router - User feedback submission endpoint."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser
from app.models.base import ok
from app.models.feedback import FeedbackRequest
from app.services.feedback_service import FeedbackService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback")


def get_feedback_service() -> FeedbackService:
    """Dependency to get feedback service instance."""
    return FeedbackService()


@router.post("")
async def submit_feedback(
    request: FeedbackRequest,
    user: CurrentUser,
    feedback_service: FeedbackService = Depends(get_feedback_service),
) -> Dict[str, Any]:
    """Submit user feedback about the product.

    Feedback is stored for product improvement analysis.
    Category defaults to 'general' if not specified.
    Context is optional and can include page_url, feature_used, etc.
    """
    user_id = user["id"]

    result = await feedback_service.submit_feedback(
        user_id=user_id,
        content=request.content,
        category=request.category.value if request.category else "general",
        context=request.context,
    )

    # Verify response contains required fields (security check)
    assert result is not None, "Feedback submission returned None"
    assert "feedback_id" in result, "Response missing feedback_id"

    return ok(result)
```

**Register in `app/main.py`:**
```python
from app.routers import ai, auth, autofill, feedback, jobs, privacy, resumes, subscriptions, usage, webhooks

# Add with other routers:
app.include_router(feedback.router, prefix="/v1", tags=["feedback"])
```

### [x] Task 5: Add Tests (AC: #1-7)

**Done when:** Comprehensive test coverage for feedback endpoint

**Create:** `apps/api/tests/test_feedback.py`

**Test Coverage:**
1. **Submit Feedback Tests:**
   - Submit feedback with all fields → 200 + feedback_id returned
   - Submit feedback with only content → 200 (category defaults to general)
   - Submit feedback with category → 200 + correct category saved
   - Submit feedback with context → 200 + context saved
   - Unauthenticated request → 401 AUTH_REQUIRED

2. **Validation Tests:**
   - Empty content → 400 VALIDATION_ERROR
   - Content too short (< 10 chars) → 400 VALIDATION_ERROR
   - Content too long (> 5000 chars) → 400 VALIDATION_ERROR
   - Invalid category → 400 VALIDATION_ERROR

3. **Context Sanitization Tests:**
   - Valid context fields preserved
   - Unknown context fields stripped
   - Empty context → null in DB

4. **Unicode & Special Character Tests:**
   - Unicode content (e.g., "Great feature! 🎉👍") → 200 + saved correctly
   - Non-ASCII characters (e.g., "Très bien! 很好!") → 200 + saved correctly
   - Mixed content with emojis and special chars → preserved in DB

5. **Service Unit Tests:**
   - `submit_feedback()` returns correct structure
   - Logging at INFO level for submissions

### [x] Task 6: Update OpenAPI Spec (AC: #2, #3)

**Done when:** OpenAPI spec includes feedback endpoint and schemas

**Modify:** `specs/openapi.yaml`

**Add Endpoint:**
```yaml
/v1/feedback:
  post:
    summary: Submit user feedback
    description: Submit feedback about the product. Category defaults to 'general'.
    operationId: submitFeedback
    tags:
      - feedback
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/FeedbackRequest'
    responses:
      '200':
        description: Feedback submitted successfully
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/SuccessResponse'
                - type: object
                  properties:
                    data:
                      $ref: '#/components/schemas/FeedbackSubmitResponse'
      '400':
        $ref: '#/components/responses/ValidationError'
      '401':
        $ref: '#/components/responses/AuthRequired'
```

**Add Schemas:**
```yaml
FeedbackCategory:
  type: string
  enum:
    - bug
    - feature_request
    - general
    - praise
    - complaint
  description: Feedback category type

FeedbackRequest:
  type: object
  required:
    - content
  properties:
    content:
      type: string
      minLength: 10
      maxLength: 5000
      description: Feedback content (10-5000 characters)
    category:
      $ref: '#/components/schemas/FeedbackCategory'
      default: general
    context:
      type: object
      additionalProperties: true
      description: Optional context (page_url, feature_used, browser, extension_version)
      example:
        page_url: "https://linkedin.com/jobs/123"
        feature_used: "cover_letter"
        browser: "Chrome 120"

FeedbackSubmitResponse:
  type: object
  required:
    - message
    - feedback_id
  properties:
    message:
      type: string
      example: "Thank you for your feedback!"
    feedback_id:
      type: string
      format: uuid
      description: Unique identifier for the submitted feedback
```

---

## Dev Notes

### 🔴 Critical Implementation Scope

**Simple CRUD endpoint:** Feedback API is straightforward - single POST endpoint to collect user feedback. No complex business logic.

**Design Decision - ON DELETE SET NULL:**
- `user_id` uses SET NULL (not CASCADE) per architecture spec
- Preserves feedback for analysis even if user deletes account
- GDPR compliant - feedback is anonymous after deletion

**Context Sanitization:**
- Only allow known safe fields in context JSONB
- Prevents storage of sensitive data (tokens, passwords)
- Whitelist: `page_url`, `feature_used`, `browser`, `extension_version`, `screen_size`
- **Unknown fields are silently stripped** (no error returned)
- Empty context after sanitization → stored as `null` (not empty object)

### 🎯 Quick Reference

**Response Envelope Pattern:**
```python
return ok({
    "message": "Thank you for your feedback!",
    "feedback_id": "uuid",
})
```

**Error Code Mapping:**
| Error | Code | HTTP |
|-------|------|------|
| Empty content | `VALIDATION_ERROR` | 400 |
| Content too short | `VALIDATION_ERROR` | 400 |
| Content too long | `VALIDATION_ERROR` | 400 |
| Invalid category | `VALIDATION_ERROR` | 400 |
| Auth required | `AUTH_REQUIRED` | 401 |

### 📋 Database Requirements Checklist

**New Table:**
- `feedback` with id, user_id (FK SET NULL), content, category, context (JSONB), created_at

**Constraints:**
- content: NOT NULL, min 10 chars, max 5000 chars
- category: enum check constraint

**RLS Policies:**
- INSERT: Users can insert own feedback
- SELECT: Users can read own feedback (future feature)
- Service role bypasses RLS for admin access

**Indexes:**
- `idx_feedback_user_id` - For user lookup
- `idx_feedback_category_created` - For admin filtering

### 📝 Files Overview

**Create:**
- `supabase/migrations/00007_create_feedback.sql` - Database table + RLS + indexes
- `app/models/feedback.py` - Request/response models
- `app/services/feedback_service.py` - Business logic
- `app/routers/feedback.py` - API endpoint
- `tests/test_feedback.py` - Test coverage

**Modify:**
- `app/models/__init__.py` - Export feedback models
- `app/main.py` - Register feedback router
- `specs/openapi.yaml` - Add endpoint + schemas

### 🎯 Patterns from Story 7.1

- Use `get_supabase_admin_client()` from `app.db.client`
- Factory function in router for dependency injection
- Return envelope format with `ok()` helper
- Type hints: `Dict[str, Any]` for returns
- Security assertions before `return ok(result)`
- Logging at INFO level for submissions (not WARNING - not security-sensitive)
- Tests mock service layer, not database directly

### 🧪 Testing Notes

**Manual Testing Flow:**
1. Get auth token using Supabase admin API (see CLAUDE.md)
2. `POST /v1/feedback` with token and feedback payload
3. Verify response contains feedback_id
4. Check Supabase dashboard for feedback record

**Edge Cases:**
- Empty string content
- Whitespace-only content
- Exactly 10 characters (minimum)
- Exactly 5000 characters (maximum)
- Invalid category value
- Malformed JSON context
- Unicode/emoji content (common in user feedback)
- Multi-byte characters (UTF-8 edge cases)

### 📊 FR Coverage

| FR | Implementation |
|----|----------------|
| FR78 | `POST /v1/feedback` - Submit feedback endpoint |
| FR79 | Context JSONB field - page_url, feature_used, browser captured |
| FR80 | Database table with all feedback stored for analysis |

### 📚 References

- Epic: `_bmad-output/planning-artifacts/epics.md` (Lines 1529-1603)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (DB schema lines 335-344, feedback table spec)
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR78-FR80)
- Previous Story: `7-1-privacy-data-deletion-api.md` (import patterns, service patterns, FK handling)
- Database Migrations: `supabase/migrations/` (next available: 00007)

### 💡 Implementation Simplicity

This is one of the simpler stories in the project:
- Single POST endpoint
- Straightforward CRUD (create only)
- No complex business logic
- No state management
- No external service integration

### 🔮 Post-MVP Considerations

**Rate Limiting (Post-MVP):**
- Consider implementing: 10 feedback submissions per hour per user
- Prevents spam/abuse without blocking legitimate users
- Similar pattern to Story 7.1's rate limiting note for delete requests

**Admin Endpoints (Post-MVP):**
- `GET /v1/admin/feedback` - List all feedback with filtering (category, date range)
- `GET /v1/admin/feedback/{id}` - Get single feedback detail
- `GET /v1/admin/feedback/stats` - Aggregate stats (counts by category, trends)
- For MVP: Access feedback via Supabase dashboard (service role bypasses RLS)
- TODO placeholder in `app/routers/feedback.py`:
  ```python
  # TODO (Post-MVP): Add admin endpoints for feedback management
  # - GET /admin/feedback - List with filters
  # - GET /admin/feedback/stats - Aggregate statistics
  ```

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - straightforward implementation with no issues.

### Completion Notes List

- **Task 1:** Created `supabase/migrations/00007_create_feedback.sql` with feedback table schema, RLS policies (INSERT/SELECT for own feedback), CHECK constraints for content length and category validation, and indexes for user lookup and admin filtering.
- **Task 2:** Created `app/models/feedback.py` with `FeedbackCategory` enum, `FeedbackRequest` model with Pydantic validation (10-5000 chars, whitespace stripping), and `FeedbackResponse` model. Exported in `__init__.py`.
- **Task 3:** Created `app/services/feedback_service.py` with context sanitization (whitelist: page_url, feature_used, browser, extension_version, screen_size), database insertion via admin client, and INFO-level logging.
- **Task 4:** Created `app/routers/feedback.py` with POST endpoint, CurrentUser auth dependency, service injection via factory function, and response envelope pattern. Registered in `main.py`.
- **Task 5:** Created `tests/test_feedback.py` with 28 tests covering authentication, validation (empty, too short, too long, invalid category, whitespace-only), context sanitization, Unicode/emoji support, service unit tests, and all category types.
- **Task 6:** Updated `specs/openapi.yaml` with `/v1/feedback` endpoint and `FeedbackCategory`, `FeedbackRequest`, `FeedbackSubmitData`, `FeedbackSubmitResponse` schemas.

### File List

**Created:**
- `supabase/migrations/00007_create_feedback.sql`
- `supabase/migrations/00008_add_feedback_created_at_index.sql` (Code review fix)
- `apps/api/app/models/feedback.py`
- `apps/api/app/services/feedback_service.py`
- `apps/api/app/routers/feedback.py`
- `apps/api/tests/test_feedback.py`

**Modified:**
- `apps/api/app/models/__init__.py` - Added feedback model exports
- `apps/api/app/main.py` - Registered feedback router
- `specs/openapi.yaml` - Added feedback endpoint and schemas (renamed FeedbackSubmitData to FeedbackSubmitResponse per code review)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status
- `_bmad-output/planning-artifacts/epics.md` - Updated epic progress tracking

### Change Log

- 2026-02-01: Implemented Story 7.2 - Feedback API
  - Created feedback table with RLS policies and indexes
  - Implemented POST /v1/feedback endpoint with content validation (10-5000 chars)
  - Added context sanitization for security (whitelist approach)
  - Comprehensive test coverage (28 tests, all passing)
  - Updated OpenAPI spec with endpoint and schemas
  - All 272 project tests pass with no regressions

- 2026-02-01: Code Review Fixes Applied
  - **CRITICAL:** Applied migrations 00007 and 00008 to remote database (feedback table now exists on production)
  - Improved exception handling: Changed generic `Exception` to `RuntimeError` in FeedbackService
  - Enhanced context sanitization: Now filters empty strings, arrays, and objects (not just None)
  - Added 3 new tests for context sanitization edge cases (empty strings, arrays, objects)
  - Added router-level test for database failure error envelope
  - Fixed OpenAPI schema name: Renamed `FeedbackSubmitData` to `FeedbackSubmitResponse` for consistency
  - Created migration 00008 for standalone `created_at` index (optimizes time-range queries)
  - Added structured TODO comments for Post-MVP rate limiting
  - Updated file list to include all modified files (epics.md, migration 00008)

