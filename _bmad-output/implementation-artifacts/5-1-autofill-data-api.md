# Story 5.1: Autofill Data API

Status: done

## Story

As a **user**,
I want **my profile and resume data available for autofilling application forms**,
So that **I can quickly populate forms without manual data entry**.

## Acceptance Criteria

### AC1: Retrieve Autofill Data with Active Resume

**Given** an authenticated user with an active resume
**When** a request is made to `GET /v1/autofill/data`
**Then** response returns all data needed for form autofill within 1 second (NFR4):
```json
{
  "success": true,
  "data": {
    "personal": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "portfolio_url": "https://johndoe.dev"
    },
    "resume": {
      "id": "uuid",
      "file_name": "john_doe_resume.pdf",
      "download_url": "https://supabase.../signed-url",
      "parsed_summary": "Senior software engineer with 8 years..."
    },
    "work_authorization": null,
    "salary_expectation": null
  }
}
```
**And** `personal` data is extracted from `resume.parsed_data`
**And** `full_name` is computed from `first_name` + `last_name`
**And** `download_url` is a signed URL for resume file upload (FR43)

### AC2: Data Extraction from Parsed Resume

**Given** an authenticated user with active resume containing `parsed_data`
**When** autofill data is requested
**Then** extract and map the following fields from `parsed_data.contact`:
- `first_name` from `parsed_data.contact.first_name`
- `last_name` from `parsed_data.contact.last_name`
- `email` from `parsed_data.contact.email` OR `profiles.email` (fallback)
- `phone` from `parsed_data.contact.phone`
- `location` from `parsed_data.contact.location`
- `linkedin_url` from `parsed_data.contact.linkedin_url`
- `portfolio_url` from `parsed_data.contact.portfolio_url` (if exists)
**And** compute `full_name` as `"{first_name} {last_name}"` (or empty string if both missing)
**And** handle missing fields gracefully (null if not present)

### AC3: Resume File Download URL Generation (FR43)

**Given** an authenticated user with active resume
**When** autofill data is requested
**Then** generate a signed URL for the resume PDF file
**And** signed URL expires in 1 hour
**And** URL is accessible without additional authentication
**And** extension can use this URL to autofill resume upload fields

### AC4: Retrieve Autofill Data without Active Resume

**Given** an authenticated user with NO active resume
**When** a request is made to `GET /v1/autofill/data`
**Then** response returns profile data with `resume: null`:
```json
{
  "success": true,
  "data": {
    "personal": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "resume": null,
    "work_authorization": null,
    "salary_expectation": null
  }
}
```
**And** extension can still autofill basic fields from profile

### AC5: Personal Data Fallback to Profile

**Given** an authenticated user with active resume missing some parsed fields
**When** autofill data is requested
**Then** use `profiles.email` as fallback for email
**And** use `profiles.full_name` as fallback for name fields (split into first/last)
**And** prioritize parsed resume data over profile data when both exist
**And** handle gracefully when neither source has data (return null)

### AC6: Performance Requirement (NFR4)

**Given** any autofill data request
**When** processing the request
**Then** response completes within 1 second
**And** minimize database queries (single join query preferred)
**And** cache parsed data extraction logic

### AC7: Unauthenticated Access

**Given** an unauthenticated request
**When** attempting to retrieve autofill data
**Then** response returns `401` with error code `AUTH_REQUIRED`

### AC8: Extension Client-Side Responsibilities (FR40-FR42, FR44)

**Given** the extension receives autofill data
**When** user triggers autofill
**Then** extension handles (client-side only, NOT API responsibility):
- Field mapping to form inputs (FR40)
- Highlighting filled fields (FR41)
- Undo capability (FR42)
- Resume file upload using download_url (FR43)
- Cover letter paste if available (FR44)

---

## Tasks / Subtasks

### Task 1: Create Autofill Service (AC: #1-#6) - INDEPENDENT

**Done when:** AutofillService retrieves and structures user data for form filling

- [x] Create `apps/api/app/services/autofill_service.py`
- [x] Import existing services: `ResumeService`, Supabase client
- [x] Add `_split_full_name(full_name: str) -> Tuple[str, str]` helper function:
  - Split on first space: "John Doe" → ("John", "Doe")
  - Handle edge cases: single word → ("Name", ""), empty → ("", "")
- [x] Add `get_autofill_data(user_id: UUID) -> dict` method:
  1. **Query profile + active resume in single join** (use Supabase join syntax)
  2. **Extract personal data from `parsed_data.contact` nested object:**
     - If resume exists: extract from `parsed_data.contact.{field}` (first_name, last_name, email, phone, location, linkedin_url)
     - Note: `portfolio_url` NOT in current schema - omit or set to None
     - Fallback: email from `p.email`, split `p.full_name` for names if contact missing
     - Compute `full_name` from `first + " " + last` (empty string if both None)
  3. **Generate resume object:**
     - If active resume: create signed URL (1 hour expiry) via `get_supabase_admin_client()` Storage
     - Extract summary from `parsed_data.summary` (first 200 chars if exists)
     - Return: `{id, file_name, download_url, parsed_summary}`
  4. **Return structure:** personal data dict, resume dict or None, placeholders for future fields
- [x] Reuse `_hash_id()` helper from `answer_service.py` for privacy-safe logging
- [x] Raise `ApiException(ErrorCode.VALIDATION_ERROR, status_code=500)` if signed URL generation fails

### Task 2: Create API Endpoint & Models (AC: #1-#7) - DEPENDS ON: Task 1

**Done when:** GET /v1/autofill/data endpoint implemented

- [x] Add to `apps/api/app/models/autofill.py`:
  ```python
  from pydantic import BaseModel
  from typing import Optional
  from uuid import UUID

  class PersonalData(BaseModel):
      first_name: Optional[str] = None
      last_name: Optional[str] = None
      full_name: Optional[str] = None
      email: Optional[str] = None
      phone: Optional[str] = None
      location: Optional[str] = None
      linkedin_url: Optional[str] = None
      portfolio_url: Optional[str] = None

  class ResumeData(BaseModel):
      id: UUID
      file_name: str
      download_url: str
      parsed_summary: Optional[str] = None

  class AutofillDataResponse(BaseModel):
      personal: PersonalData
      resume: Optional[ResumeData] = None
      work_authorization: Optional[str] = None
      salary_expectation: Optional[str] = None
  ```
- [x] Create `apps/api/app/routers/autofill.py`:
  - Router prefix: `/v1/autofill`
  - Tag: `autofill`
  - `GET /data` endpoint
  - Use `CurrentUser` dependency
  - Return `ok(autofill_data)`
- [x] Export new models in `apps/api/app/models/__init__.py`
- [x] Register router in `apps/api/app/main.py`

### Task 3: Add Tests (AC: #1-#7) - DEPENDS ON: All implementation tasks

**Done when:** All tests pass with `pytest`

- [x] Create `apps/api/tests/test_autofill.py`
- [x] Mock Supabase client responses (profile + resume join query)
- [x] Mock Storage signed URL generation
- [x] Test cases:
  - ✅ Active resume with complete contact data (verify all fields extracted)
  - ✅ Active resume with partial contact data (verify fallbacks work)
  - ✅ No active resume (returns profile data only, resume: null)
  - ✅ Email fallback to profile when not in parsed_data.contact
  - ✅ Name fallback to profile.full_name when contact missing
  - ✅ Full_name computed correctly (handles all-None case → empty string)
  - ✅ Signed URL generated with 1 hour expiry
  - ✅ Signed URL failure raises ApiException (status 500)
  - ✅ Unauthenticated request → 401 AUTH_REQUIRED
  - ✅ Performance assertion: response time < 1 second (use `time.time()` measurement)

### Task 4: Update OpenAPI Spec (AC: #1-#8) - DEPENDS ON: Task 2

**Done when:** OpenAPI spec includes autofill endpoint

- [x] Add to `specs/openapi.yaml`:
  - `GET /v1/autofill/data` endpoint under new `autofill` tag
  - Add schemas: `PersonalData`, `ResumeData`, `AutofillDataResponse`
  - Error responses: 401
  - Include example responses for both scenarios (with/without active resume)

---

## Dev Notes

### ✅ Database Schema Status

**No new migrations required** - uses existing schema from Stories 1.1 and 2.1:
- `profiles` table has `active_resume_id` column
- `resumes` table has `parsed_data` JSONB column
- RLS policies already enforce user-scoped data access

### 🔴 CRITICAL: Existing Infrastructure to Reuse

Import and use existing components - **DO NOT RECREATE**:

| Component | File | What to Do |
|-----------|------|-----------|
| ResumeService | `app/services/resume_service.py` | Import to access signed URL generation pattern |
| Supabase Client | `app/db/client.py` | Use `get_supabase_client()` (RLS-enforced) and `get_supabase_admin_client()` (Storage) |
| Exceptions | `app/core/exceptions.py` | Raise `ApiException` with proper error codes |
| Models | `app/models/base.py` | Use `ok()` helper for responses |
| CurrentUser | `app/core/deps.py` | Use for authentication dependency |
| Privacy Helper | `app/services/answer_service.py` | Reuse existing `_hash_id()` for logging |

### 🔴 CRITICAL: Database Query Pattern & RLS

**Single Query with Foreign Key Join:**
```python
from app.db.client import get_supabase_client

async def get_autofill_data(user_id: UUID) -> dict:
    client = get_supabase_client()  # RLS-enforced client
    result = client.table("profiles") \
        .select("*, resumes!profiles_active_resume_id_fkey(*)") \
        .eq("id", str(user_id)) \
        .single() \
        .execute()

    profile = result.data
    resume = profile.get("resumes")  # Dict or None
```

**RLS Security:**
- `get_supabase_client()` uses anon key with RLS policies enabled
- Database automatically filters results to current user's data
- No need to add `.eq("user_id", user_id)` - RLS enforces this
- See `app/db/client.py` for client initialization

**Performance:**
- Single database round-trip (meets NFR4 <1s requirement)
- Automatic join via foreign key relationship

### 🔴 CRITICAL: Signed URL Generation Pattern

```python
from app.db.client import get_supabase_admin_client
from app.core.exceptions import ApiException, ErrorCode
import logging

logger = logging.getLogger(__name__)

def generate_resume_download_url(file_path: str) -> str:
    """Generate signed URL for resume download (1 hour expiry)"""
    try:
        admin_client = get_supabase_admin_client()  # Admin for storage ops
        result = admin_client.storage.from_("resumes").create_signed_url(
            path=file_path,
            expires_in=3600
        )
        return result["signedURL"]
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {file_path}: {e}")
        raise ApiException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Failed to generate download URL",
            status_code=500
        )
```

**Key Points:**
- Use `get_supabase_admin_client()` for storage operations (bypasses RLS)
- Bucket: `"resumes"`, Expiry: 3600 seconds (1 hour)
- Raise `ApiException` on failure (see `resume_service.py` for pattern)

### 🟡 IMPORTANT: Data Extraction Priority & Fallback Chain

**Extraction order:**
1. **Priority 1:** Resume `parsed_data.contact.{field}` (nested object!)
2. **Priority 2:** Profile table fields (`profile.email`, `profile.full_name`)
3. **Priority 3:** Computed values (e.g., `full_name` from first + last)
4. **Default:** `None` for optional fields, `""` (empty string) for names

**Implementation pattern:**
```python
contact = resume_parsed.get("contact") or {}  # Handle None case

# Email: parsed → profile → None
email = contact.get("email") or profile.get("email")

# Names: parsed → split profile.full_name → empty string
first = contact.get("first_name")
last = contact.get("last_name")

if not first or not last:
    first, last = _split_full_name(profile.get("full_name", ""))

# Full name: always computed (handles all-None case)
full_name = f"{first or ''} {last or ''}".strip() or ""
```

### 🟡 IMPORTANT: Field Mapping Reference

**Actual parsed_data Schema (from Story 2.1):**
- Contact info is nested: `parsed_data.contact.{field}`
- Summary is top-level: `parsed_data.summary`

| Autofill Field | Primary Source | Fallback Source | Default |
|----------------|----------------|-----------------|---------|
| `first_name` | `parsed_data.contact.first_name` | Split `profile.full_name` | `""` |
| `last_name` | `parsed_data.contact.last_name` | Split `profile.full_name` | `""` |
| `full_name` | Compute from first + last | - | `""` |
| `email` | `parsed_data.contact.email` | `profile.email` | `None` |
| `phone` | `parsed_data.contact.phone` | - | `None` |
| `location` | `parsed_data.contact.location` | - | `None` |
| `linkedin_url` | `parsed_data.contact.linkedin_url` | - | `None` |
| `portfolio_url` | Not in current schema | - | `None` |

**Resume fields:**
- `id`: `resume.id`
- `file_name`: `resume.file_name`
- `download_url`: Generated via admin client Storage signed URL (3600s expiry)
- `parsed_summary`: First 200 chars of `parsed_data.summary` if exists, else `None`

### 🔴 CRITICAL: Performance Optimization (NFR4)

**Requirement:** Autofill response < 1 second

**Implementation:**
1. Single database query (join profiles + resumes) - minimize round-trips
2. Extract only needed fields from parsed_data.contact
3. No AI calls (pure data retrieval)
4. Generate signed URL inline (no additional API call)

**Performance Logging:**
```python
import time
from app.services.answer_service import _hash_id  # Reuse helper

start = time.time()
data = get_autofill_data(user_id)
duration_ms = (time.time() - start) * 1000

logger.info(
    f"Autofill retrieved in {duration_ms:.0f}ms - "
    f"user: {_hash_id(str(user_id))}..., has_resume: {data['resume'] is not None}"
)
```

**Test Assertion:**
```python
# In test_autofill.py
import time
start = time.time()
response = client.get("/v1/autofill/data", headers=auth_headers)
assert (time.time() - start) < 1.0, f"Response took {time.time() - start:.2f}s"
```

### ℹ️ REFERENCE: Extension Responsibilities (Not API)

The API provides structured data. The extension handles:

| Feature | FR | Extension Responsibility |
|---------|----|-----------------------------|
| Field mapping | FR40 | Map personal data to form field names/IDs |
| Highlight filled | FR41 | Add visual indicators to autofilled fields |
| Undo autofill | FR42 | Track and reverse autofill actions |
| Resume upload | FR43 | Use download_url to fetch + upload PDF |
| Cover letter | FR44 | Paste AI-generated cover letter if available |

**API Role:** Provide data only. No form interaction logic.

### ℹ️ REFERENCE: Future Expansion Fields

Placeholders for future features (return `null` for now):

- `work_authorization`: "Authorized to work in US" - future user preference
- `salary_expectation`: "$150k-$200k" - future user preference or job-specific

These fields exist in the response schema for forward compatibility.

### 🟡 IMPORTANT: Privacy-Safe Logging

**Reuse existing helper from `answer_service.py`:**
```python
# Import pattern (or copy helper to this service)
from app.services.answer_service import _hash_id

# Usage
logger.info(
    f"Autofill data retrieved - user: {_hash_id(str(user_id))}..., "
    f"has_resume: {has_resume}, duration: {duration_ms:.2f}ms"
)
```

**Logging guidelines:**
- ✅ Log: Hashed user IDs, boolean flags, performance metrics, error codes
- ❌ Never log: Full emails, phone numbers, names, resume content

### ℹ️ REFERENCE: Project Structure Notes

**New Files (4):**
- `apps/api/app/services/autofill_service.py`
- `apps/api/app/models/autofill.py`
- `apps/api/app/routers/autofill.py`
- `apps/api/tests/test_autofill.py`

**Modified Files (3):**
- `apps/api/app/models/__init__.py` - Export new models
- `apps/api/app/main.py` - Register autofill router
- `specs/openapi.yaml` - Add autofill endpoint

**File Organization (from Architecture):**
- Services: Business logic layer (autofill data retrieval)
- Models: Pydantic schemas (API request/response types)
- Routers: API endpoints (HTTP layer)
- Tests: Pytest test cases with mocked dependencies

### 🔴 CRITICAL: Previous Story Patterns to Follow

**From Story 4.2 (Answer & Outreach Generation):**
1. Service layer with clear separation of concerns
2. Privacy-safe logging with `_hash_id()` helper
3. Pydantic models with Optional fields (handle missing data)
4. Comprehensive error handling via existing exceptions
5. Test patterns: mock database, verify all edge cases

**From Story 2.2 (Resume CRUD):**
1. Signed URL generation for file downloads
2. Profile + resume join query patterns
3. Active resume resolution via `profiles.active_resume_id`

**Code Reference Files:**
- `apps/api/app/services/resume_service.py` - Signed URL generation, join queries
- `apps/api/app/db/client.py` - Supabase client initialization (RLS vs admin)
- `apps/api/app/services/answer_service.py` - Privacy-safe logging helper `_hash_id()`
- `apps/api/tests/test_resumes.py` - Test mock patterns

### FR Coverage

| FR | Description | Implementation |
|----|-------------|----------------|
| FR39 | Autofill application form fields | `GET /v1/autofill/data` provides structured data |
| FR40 | Automatic field mapping | Extension responsibility (API provides data) |
| FR41 | Highlight autofilled fields | Extension responsibility |
| FR42 | Undo autofill action | Extension responsibility |
| FR43 | Resume upload autofill | API provides `download_url` for PDF file |
| FR44 | Cover letter autofill | Extension responsibility (paste AI output) |

**API Scope:** Provide personal data + resume download URL only.
**Extension Scope:** All form interaction logic.

### Testing Strategy

**Approach:**
- Mock Supabase client responses (don't hit real database)
- Test all data extraction scenarios
- Verify signed URL generation
- Measure performance (< 1 second)

**Test Data Scenarios:**
1. User with complete parsed resume data
2. User with partial parsed resume data (missing fields)
3. User with no active resume
4. User with profile data only (no resume ever uploaded)
5. Signed URL generation failure

**Test Fixtures:**

Use existing `client` and `auth_headers` from `conftest.py`. Create story-specific mocks inline (pattern from `test_resumes.py`, `test_ai_answer.py`).

**Mock Pattern:**
```python
import time
from unittest.mock import patch, MagicMock

def test_autofill_with_active_resume(client, auth_headers, mocker):
    """Test successful autofill data retrieval with active resume."""
    # Mock database client
    mock_db = mocker.patch("app.services.autofill_service.get_supabase_client")
    mock_db.return_value.table().select().eq().single().execute.return_value = MagicMock(
        data={
            "id": "user-uuid",
            "email": "john@example.com",
            "full_name": "John Doe",
            "resumes": {
                "id": "resume-uuid",
                "file_name": "resume.pdf",
                "file_path": "user-uuid/resume-uuid.pdf",
                "parsed_data": {
                    "contact": {  # Nested object!
                        "first_name": "John",
                        "last_name": "Doe",
                        "email": "john@example.com",
                        "phone": "+1-555-0100",
                        "location": "San Francisco, CA",
                        "linkedin_url": "https://linkedin.com/in/johndoe"
                    },
                    "summary": "Senior software engineer..."
                }
            }
        }
    )

    # Mock admin client for signed URLs
    mock_admin = mocker.patch("app.services.autofill_service.get_supabase_admin_client")
    mock_admin.return_value.storage.from_().create_signed_url.return_value = {
        "signedURL": "https://supabase.../signed-url"
    }

    # Measure performance
    start = time.time()
    response = client.get("/v1/autofill/data", headers=auth_headers)
    duration = time.time() - start

    assert response.status_code == 200
    assert duration < 1.0, "Response took too long"
    # ... more assertions
```

### References

**Source Documents:**
1. Epic: `_bmad-output/planning-artifacts/epics.md` - Lines 1048-1124 (Story 5.1 definition)
2. Architecture: `_bmad-output/planning-artifacts/architecture.md` - Database schema, API patterns
3. Previous Story: `_bmad-output/implementation-artifacts/2-2-resume-crud-active-selection.md` - Signed URL pattern
4. PRD: `_bmad-output/planning-artifacts/prd.md` - FR39-FR44 definitions

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Test suite run (initial): 156 passed, 0 failed (all tests including 15 new autofill tests)
- Test suite run (post code review): 157 passed, 0 failed (added 1 test for edge case)
- All existing regression tests pass

### Code Review Fixes (2026-02-01)

**Adversarial code review found 5 HIGH/MEDIUM issues - all fixed:**

1. **HIGH - Pydantic validation failure risk:** Made `download_url` and `file_name` Optional in `ResumeData` model to handle resumes with missing file_path
   - Fix: `apps/api/app/models/autofill.py` lines 26-27

2. **MEDIUM - Error code semantic mismatch:** Changed signed URL error from `VALIDATION_ERROR` to `STORAGE_ERROR` (added new error code)
   - Fix: `apps/api/app/core/exceptions.py` line 21, `autofill_service.py` line 74

3. **MEDIUM - Inadequate error logging:** Added try-except blocks with error logging for database failures and resume data building
   - Fix: `apps/api/app/services/autofill_service.py` lines 100-152

4. **MEDIUM - Missing test coverage:** Added test for resume with missing/null file_path edge case
   - Fix: `apps/api/tests/test_autofill.py` new test `test_resume_with_missing_file_path`

5. **MEDIUM - Git discrepancy:** Updated File List to include all modified files
   - Fix: Story File List section

**Status:** All critical issues resolved. Tests passing: 157/157 ✅

### Completion Notes List

1. **Task 1 - AutofillService:** Created `autofill_service.py` with:
   - `_hash_id()` helper reused pattern from answer_service.py
   - `_split_full_name()` helper for name parsing
   - `_generate_signed_url()` with 1-hour expiry
   - `AutofillService.get_autofill_data()` method using single join query for profile + active resume
   - Data extraction with priority: resume parsed_data.contact → profile → None
   - Performance logging with duration measurement

2. **Task 2 - API Endpoint & Models:**
   - Created Pydantic models: `PersonalData`, `ResumeData`, `AutofillDataResponse`
   - Created router with `GET /v1/autofill/data` endpoint
   - Registered router in main.py with `/v1` prefix and `autofill` tag
   - Exported models in `__init__.py`

3. **Task 3 - Tests:**
   - 15 comprehensive tests covering all ACs
   - Used FastAPI dependency override pattern for service mocking
   - Tests cover: authentication, data extraction, fallbacks, name computation, signed URL, performance

4. **Task 4 - OpenAPI Spec:**
   - Added `/v1/autofill/data` endpoint with detailed description
   - Added schemas: `PersonalData`, `AutofillResumeData`, `AutofillData`, `AutofillDataResponse`
   - Included examples for both with/without active resume scenarios

### File List

**New Files (4):**
- `apps/api/app/services/autofill_service.py`
- `apps/api/app/models/autofill.py`
- `apps/api/app/routers/autofill.py`
- `apps/api/tests/test_autofill.py`

**Modified Files (4):**
- `apps/api/app/models/__init__.py` - Added autofill model exports
- `apps/api/app/main.py` - Registered autofill router
- `specs/openapi.yaml` - Added autofill endpoint and schemas
- `apps/api/app/core/exceptions.py` - Added STORAGE_ERROR code (code review fix)

### Change Log

- 2026-01-31: Implemented Story 5.1 - Autofill Data API (all 4 tasks complete)
- 2026-02-01: Code review - Fixed 5 HIGH/MEDIUM issues (Pydantic validation, error codes, logging, test coverage)
