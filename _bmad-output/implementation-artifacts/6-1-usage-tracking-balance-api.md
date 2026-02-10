# Story 6.1: Usage Tracking & Balance API

Status: done

## Story

As a **user**,
I want **to see my AI generation balance and have limits enforced**,
So that **I understand my usage and know when to upgrade**.

## Acceptance Criteria

### AC1: Get Current Balance with Detailed Breakdown (FR54)

**Given** an authenticated user
**When** a request is made to `GET /v1/usage`
**Then** response returns current balance and limits:
```json
{
  "success": true,
  "data": {
    "subscription_tier": "free",
    "period_type": "lifetime",
    "period_key": "lifetime",
    "credits_used": 3,
    "credits_limit": 5,
    "credits_remaining": 2,
    "usage_by_type": {
      "match": 1,
      "cover_letter": 2,
      "answer": 0,
      "outreach": 0,
      "resume_parse": 0
    }
  }
}
```

### AC2: Paid Tier Monthly Reset

**Given** a paid user (pro/unlimited)
**When** checking usage
**Then** `period_type` is "monthly" and `period_key` is current month (e.g., "2026-02")
**And** usage resets at the start of each month

### AC3: Referral Bonus Credits (FR59)

**Given** a user refers someone successfully
**When** referral is validated
**Then** referring user receives bonus credits (5 credits default)
**And** a usage_event with negative `credits_used` is recorded (credit addition)

### AC4: Get Usage History

**Given** an authenticated user
**When** a request is made to `GET /v1/usage/history`
**Then** response returns paginated usage events

---

## Tasks / Subtasks

### Task 1: Add `calculate_balance()` to Existing UsageService (AC: #1, #2)

**Done when:** UsageService returns detailed balance breakdown, not just boolean

**📦 EXISTING:** `apps/api/app/services/usage_service.py`
- `get_tier_limits()` ✓
- `check_credits()` ✓ (returns bool only)
- `record_usage()` ✓
- `_get_period_key()` ✓

**🆕 ADD to existing UsageService:**

- [x] **Add method** `calculate_balance(user_id: str) -> Dict`:
  ```python
  async def calculate_balance(self, user_id: str) -> Dict[str, Any]:
      """Calculate detailed balance with usage breakdown.

      Returns dict with: subscription_tier, period_type, period_key,
      credits_used, credits_limit, credits_remaining, usage_by_type
      """
      tier = await self.get_user_tier(user_id)
      limits = await self.get_tier_limits()
      tier_config = limits.get(tier, limits["free"])

      period_type = tier_config["type"]
      period_key = self._get_period_key(period_type)
      credits_limit = tier_config["credits"]

      # Query all usage events for current period
      response = (
          self.admin_client.table("usage_events")
          .select("credits_used, operation_type")
          .eq("user_id", user_id)
          .eq("period_type", period_type)
          .eq("period_key", period_key)
          .execute()
      )

      # Aggregate by operation type
      usage_by_type = {
          "match": 0,
          "cover_letter": 0,
          "answer": 0,
          "outreach": 0,
          "resume_parse": 0,
      }
      total_used = 0

      for event in response.data or []:
          op_type = event.get("operation_type", "")
          credits = event.get("credits_used", 0)
          total_used += credits
          if op_type in usage_by_type:
              usage_by_type[op_type] += credits

      # Handle unlimited tier
      if credits_limit == -1:
          credits_remaining = -1  # Unlimited
      else:
          credits_remaining = credits_limit - total_used

      return {
          "subscription_tier": tier,
          "period_type": period_type,
          "period_key": period_key,
          "credits_used": total_used,
          "credits_limit": credits_limit,
          "credits_remaining": credits_remaining,
          "usage_by_type": usage_by_type,
      }
  ```

- [x] **Add method** `get_usage_history(user_id: str, page: int, page_size: int) -> Dict`:
  ```python
  async def get_usage_history(
      self, user_id: str, page: int = 1, page_size: int = 20
  ) -> Dict[str, Any]:
      """Get paginated usage history for user."""
      start = (page - 1) * page_size
      end = start + page_size - 1

      response = (
          self.admin_client.table("usage_events")
          .select("*", count="exact")
          .eq("user_id", user_id)
          .order("created_at", desc=True)
          .range(start, end)
          .execute()
      )

      return {
          "items": response.data or [],
          "total": response.count or 0,
          "page": page,
          "page_size": page_size,
      }
  ```

### Task 2: Add `add_referral_credits()` Method (AC: #3)

**Done when:** Service can add bonus credits via negative usage_event

- [x] **Add method** to `apps/api/app/services/usage_service.py`:
  ```python
  async def add_referral_credits(self, user_id: str, bonus_credits: int = 5) -> int:
      """Add referral bonus credits to user.

      Inserts negative credits_used to add credits.
      Referral bonuses are always lifetime (never expire).

      Args:
          user_id: User's UUID.
          bonus_credits: Credits to add (default 5).

      Returns:
          Number of credits added.
      """
      self.admin_client.table("usage_events").insert({
          "user_id": user_id,
          "operation_type": "referral_bonus",
          "ai_provider": "system",
          "credits_used": -bonus_credits,  # Negative = add credits
          "period_type": "lifetime",
          "period_key": "lifetime",
      }).execute()

      logger.info(f"Referral credits added - user: {user_id[:8]}..., amount: {bonus_credits}")
      return bonus_credits
  ```

### Task 3: Create Pydantic Models (AC: #1, #4)

**Done when:** Models support usage responses

- [x] **Create file** `apps/api/app/models/usage.py`:
  ```python
  """Usage models for credit tracking endpoints."""

  from datetime import datetime
  from typing import List, Optional
  from uuid import UUID

  from pydantic import BaseModel


  class UsageByType(BaseModel):
      """Breakdown of credits used by operation type."""
      match: int = 0
      cover_letter: int = 0
      answer: int = 0
      outreach: int = 0
      resume_parse: int = 0


  class UsageResponse(BaseModel):
      """Current usage balance response."""
      subscription_tier: str
      period_type: str
      period_key: str
      credits_used: int
      credits_limit: int  # -1 means unlimited
      credits_remaining: int  # -1 means unlimited
      usage_by_type: UsageByType


  class UsageEventItem(BaseModel):
      """Single usage event for history."""
      id: UUID
      operation_type: str
      ai_provider: Optional[str]
      credits_used: int
      period_type: str
      period_key: str
      created_at: datetime


  class UsageHistoryResponse(BaseModel):
      """Paginated usage history response."""
      items: List[UsageEventItem]
      total: int
      page: int
      page_size: int
  ```

- [x] **Export models** in `apps/api/app/models/__init__.py`:
  ```python
  from .usage import UsageByType, UsageResponse, UsageEventItem, UsageHistoryResponse
  ```

### Task 4: Create Usage Router (AC: #1, #3, #4)

**Done when:** All usage endpoints implemented and registered

- [x] **Create file** `apps/api/app/routers/usage.py`:
  ```python
  """Usage router - Credit balance and history endpoints."""

  import logging
  from fastapi import APIRouter, Depends, Query

  from app.core.deps import CurrentUser
  from app.models.base import ok
  from app.models.usage import UsageResponse, UsageHistoryResponse
  from app.services.usage_service import UsageService

  logger = logging.getLogger(__name__)
  router = APIRouter(prefix="/usage")


  def get_usage_service() -> UsageService:
      """Dependency to get usage service instance."""
      return UsageService()


  @router.get("")
  async def get_usage(
      user: CurrentUser,
      usage_service: UsageService = Depends(get_usage_service),
  ) -> dict:
      """Get current usage balance and limits.

      Returns credits used, remaining, and breakdown by operation type.
      """
      user_id = user["id"]
      balance = await usage_service.calculate_balance(user_id)
      return ok(balance)


  @router.get("/history")
  async def get_usage_history(
      user: CurrentUser,
      page: int = Query(1, ge=1),
      page_size: int = Query(20, ge=1, le=100),
      usage_service: UsageService = Depends(get_usage_service),
  ) -> dict:
      """Get paginated usage history.

      Returns list of usage events with pagination.
      """
      user_id = user["id"]
      history = await usage_service.get_usage_history(user_id, page, page_size)
      return ok(history)
  ```

- [x] **Register router** in `apps/api/app/main.py`:
  ```python
  # Add to imports
  from app.routers import ai, auth, autofill, jobs, resumes, usage

  # Add router registration (after other routers)
  app.include_router(usage.router, prefix="/v1", tags=["usage"])
  ```

### Task 5: Verify AI Services Follow Usage Pattern

**Done when:** All AI services check credits before and record after

**📦 ALREADY IMPLEMENTED in `match_service.py` (reference pattern):**
```python
# Step 1: Check credits FIRST (line 98-102)
has_credits = await self.usage_service.check_credits(user_id)
if not has_credits:
    raise CreditExhaustedError()

# Step 6: AI generation happens here...

# Step 7: Record usage AFTER successful AI call (line 171-177)
await self.usage_service.record_usage(
    user_id=user_id,
    operation_type="match",
    ai_provider=provider_used,
    credits_used=1,
)
```

- [x] **Verify** `cover_letter_service.py` follows same pattern
- [x] **Verify** `answer_service.py` follows same pattern
- [x] **Verify** `outreach_service.py` follows same pattern
- [x] **Verify** `resume_service.py` records `resume_parse` usage

### Task 6: Add Tests (AC: #1-#4)

**Done when:** All tests pass with `pytest`

- [x] **Create file** `apps/api/tests/test_usage.py`:
  ```python
  """Tests for usage endpoints."""

  from unittest.mock import AsyncMock, MagicMock, patch
  from uuid import uuid4

  import pytest
  from fastapi.testclient import TestClient

  from app.main import app


  @pytest.fixture
  def mock_user():
      return {"id": str(uuid4()), "email": "test@example.com"}


  @pytest.fixture
  def client():
      return TestClient(app)


  class TestGetUsage:
      """Tests for GET /v1/usage endpoint."""

      def test_get_usage_free_tier(self, client, mock_user):
          """Free tier returns lifetime period type."""
          with patch("app.routers.usage.get_usage_service") as mock_svc:
              mock_svc.return_value.calculate_balance = AsyncMock(return_value={
                  "subscription_tier": "free",
                  "period_type": "lifetime",
                  "period_key": "lifetime",
                  "credits_used": 3,
                  "credits_limit": 5,
                  "credits_remaining": 2,
                  "usage_by_type": {
                      "match": 1, "cover_letter": 2,
                      "answer": 0, "outreach": 0, "resume_parse": 0
                  }
              })

              with patch("app.core.deps.get_current_user", return_value=mock_user):
                  response = client.get("/v1/usage")

              assert response.status_code == 200
              data = response.json()["data"]
              assert data["subscription_tier"] == "free"
              assert data["period_type"] == "lifetime"
              assert data["credits_remaining"] == 2

      def test_get_usage_pro_tier_monthly(self, client, mock_user):
          """Pro tier returns monthly period type with current month."""
          with patch("app.routers.usage.get_usage_service") as mock_svc:
              mock_svc.return_value.calculate_balance = AsyncMock(return_value={
                  "subscription_tier": "pro",
                  "period_type": "monthly",
                  "period_key": "2026-02",
                  "credits_used": 45,
                  "credits_limit": 100,
                  "credits_remaining": 55,
                  "usage_by_type": {
                      "match": 10, "cover_letter": 20,
                      "answer": 10, "outreach": 5, "resume_parse": 0
                  }
              })

              with patch("app.core.deps.get_current_user", return_value=mock_user):
                  response = client.get("/v1/usage")

              assert response.status_code == 200
              data = response.json()["data"]
              assert data["period_type"] == "monthly"
              assert data["credits_limit"] == 100

      def test_get_usage_unlimited_tier(self, client, mock_user):
          """Unlimited tier shows -1 for limits."""
          with patch("app.routers.usage.get_usage_service") as mock_svc:
              mock_svc.return_value.calculate_balance = AsyncMock(return_value={
                  "subscription_tier": "unlimited",
                  "period_type": "monthly",
                  "period_key": "2026-02",
                  "credits_used": 500,
                  "credits_limit": -1,
                  "credits_remaining": -1,
                  "usage_by_type": {
                      "match": 100, "cover_letter": 200,
                      "answer": 100, "outreach": 50, "resume_parse": 50
                  }
              })

              with patch("app.core.deps.get_current_user", return_value=mock_user):
                  response = client.get("/v1/usage")

              assert response.status_code == 200
              data = response.json()["data"]
              assert data["credits_limit"] == -1
              assert data["credits_remaining"] == -1

      def test_get_usage_unauthenticated(self, client):
          """Unauthenticated request returns 401."""
          response = client.get("/v1/usage")
          assert response.status_code == 401


  class TestUsageHistory:
      """Tests for GET /v1/usage/history endpoint."""

      def test_get_history_paginated(self, client, mock_user):
          """History returns paginated events."""
          with patch("app.routers.usage.get_usage_service") as mock_svc:
              mock_svc.return_value.get_usage_history = AsyncMock(return_value={
                  "items": [
                      {
                          "id": str(uuid4()),
                          "operation_type": "cover_letter",
                          "ai_provider": "claude",
                          "credits_used": 1,
                          "period_type": "lifetime",
                          "period_key": "lifetime",
                          "created_at": "2026-02-01T10:00:00Z"
                      }
                  ],
                  "total": 1,
                  "page": 1,
                  "page_size": 20
              })

              with patch("app.core.deps.get_current_user", return_value=mock_user):
                  response = client.get("/v1/usage/history?page=1&page_size=20")

              assert response.status_code == 200
              data = response.json()["data"]
              assert len(data["items"]) == 1
              assert data["total"] == 1


  class TestCalculateBalance:
      """Tests for UsageService.calculate_balance method."""

      @pytest.mark.asyncio
      async def test_aggregates_by_operation_type(self):
          """Balance correctly aggregates usage by operation type."""
          from app.services.usage_service import UsageService

          service = UsageService()
          with patch.object(service, "get_user_tier", return_value="free"):
              with patch.object(service, "get_tier_limits", return_value={
                  "free": {"type": "lifetime", "credits": 5, "max_resumes": 5}
              }):
                  with patch.object(service.admin_client, "table") as mock_table:
                      mock_table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                          data=[
                              {"operation_type": "match", "credits_used": 1},
                              {"operation_type": "cover_letter", "credits_used": 2},
                          ]
                      )

                      result = await service.calculate_balance("user-123")

                      assert result["credits_used"] == 3
                      assert result["credits_remaining"] == 2
                      assert result["usage_by_type"]["match"] == 1
                      assert result["usage_by_type"]["cover_letter"] == 2


  class TestAddReferralCredits:
      """Tests for referral credit addition."""

      @pytest.mark.asyncio
      async def test_inserts_negative_credits(self):
          """Referral credits insert negative value."""
          from app.services.usage_service import UsageService

          service = UsageService()
          with patch.object(service.admin_client, "table") as mock_table:
              mock_insert = MagicMock()
              mock_table.return_value.insert.return_value.execute = mock_insert

              result = await service.add_referral_credits("user-123", 5)

              assert result == 5
              mock_table.return_value.insert.assert_called_once()
              call_args = mock_table.return_value.insert.call_args[0][0]
              assert call_args["credits_used"] == -5
              assert call_args["operation_type"] == "referral_bonus"
              assert call_args["period_type"] == "lifetime"
  ```

### Task 7: Update OpenAPI Spec (AC: #1, #4)

**Done when:** OpenAPI spec includes usage endpoints

- [x] **Open** `specs/openapi.yaml`
- [x] **Add paths:**
  ```yaml
  /v1/usage:
    get:
      summary: Get current usage balance
      description: Returns credits used, remaining, and breakdown by operation type.
      tags: [usage]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Usage balance retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/UsageResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /v1/usage/history:
    get:
      summary: Get usage history
      description: Returns paginated list of usage events.
      tags: [usage]
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: page_size
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Usage history retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/UsageHistoryResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
  ```
- [x] **Add schemas:**
  ```yaml
  UsageByType:
    type: object
    properties:
      match:
        type: integer
        example: 2
      cover_letter:
        type: integer
        example: 5
      answer:
        type: integer
        example: 1
      outreach:
        type: integer
        example: 3
      resume_parse:
        type: integer
        example: 1

  UsageResponse:
    type: object
    properties:
      subscription_tier:
        type: string
        enum: [free, pro, unlimited]
        example: "free"
      period_type:
        type: string
        enum: [lifetime, monthly]
        example: "lifetime"
      period_key:
        type: string
        example: "lifetime"
      credits_used:
        type: integer
        example: 3
      credits_limit:
        type: integer
        description: "-1 means unlimited"
        example: 5
      credits_remaining:
        type: integer
        description: "-1 means unlimited"
        example: 2
      usage_by_type:
        $ref: '#/components/schemas/UsageByType'

  UsageEventItem:
    type: object
    properties:
      id:
        type: string
        format: uuid
      operation_type:
        type: string
        enum: [match, cover_letter, answer, outreach, resume_parse, referral_bonus]
      ai_provider:
        type: string
        nullable: true
      credits_used:
        type: integer
      period_type:
        type: string
      period_key:
        type: string
      created_at:
        type: string
        format: date-time

  UsageHistoryResponse:
    type: object
    properties:
      items:
        type: array
        items:
          $ref: '#/components/schemas/UsageEventItem'
      total:
        type: integer
      page:
        type: integer
      page_size:
        type: integer
  ```

---

## Dev Notes

### ✅ EXISTING Infrastructure (DO NOT RECREATE)

**Database Tables (already exist):**
- `usage_events` - Created in `00004_create_usage_tables.sql`
- `global_config` - Created in `00004_create_usage_tables.sql`

**UsageService (already exists):**
```
📦 apps/api/app/services/usage_service.py
├── get_tier_limits()     ✓ Returns tier config from global_config
├── get_user_tier()       ✓ Returns user's subscription_tier from profile
├── _get_period_key()     ✓ Returns "lifetime" or "YYYY-MM"
├── check_credits()       ✓ Returns bool - has credits available
├── get_max_resumes()     ✓ Returns max resumes for tier
└── record_usage()        ✓ Inserts usage_event after AI operation
```

**Error Handling (already exists):**
```
📦 apps/api/app/core/exceptions.py
├── ErrorCode.CREDIT_EXHAUSTED    ✓
└── CreditExhaustedError          ✓ (status_code=422)
```

**AI Service Integration (already implemented in match_service.py):**
- Credit check BEFORE AI generation ✓
- Record usage AFTER successful AI call ✓
- No charge on AI failure ✓

### 🔴 CRITICAL: Actual Tier Names in Database

**The database uses these tier names (NOT starter/pro/power):**
```json
{
  "free": {"type": "lifetime", "credits": 5, "max_resumes": 5},
  "pro": {"type": "monthly", "credits": 100, "max_resumes": 10},
  "unlimited": {"type": "monthly", "credits": -1, "max_resumes": 25}
}
```

**Tier Logic:**
- `free` - Lifetime 5 credits, never resets
- `pro` - Monthly 100 credits, resets on 1st
- `unlimited` - No credit limit (`credits: -1`)

### 🔴 CRITICAL: Admin Client Required for usage_events

**Why admin client is used (not RLS client):**

Looking at `00004_create_usage_tables.sql`:
```sql
-- RLS Policy: Users can view their own usage events
CREATE POLICY "Users can view own usage events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role inserts usage events (no direct user insert)
```

**Key insight:** There is NO INSERT policy for users - only SELECT. This means:
- **SELECT:** Could use RLS client (but admin works too)
- **INSERT:** MUST use admin client (service role)

The existing `usage_service.py` correctly uses `admin_client` for all operations.

### 🔴 CRITICAL: Negative Credits for Referrals

**Referral Bonus Mechanism:**
```python
# Insert with NEGATIVE credits_used to ADD credits
{
    "operation_type": "referral_bonus",
    "ai_provider": "system",
    "credits_used": -5,  # Negative = add 5 credits
    "period_type": "lifetime",  # Bonuses never expire
    "period_key": "lifetime"
}
```

**Balance Calculation:**
- `SUM(credits_used)` naturally handles positive/negative values
- Positive = credits consumed by AI operations
- Negative = credits added (referral bonus)

### 🟡 IMPORTANT: Monthly Reset Mechanism

**No cron job needed!** Reset happens organically:

1. User on 2026-01-31 has used 98/100 credits with `period_key="2026-01"`
2. On 2026-02-01, `_get_period_key("monthly")` returns `"2026-02"`
3. Balance query filters by new period_key, finds 0 usage events
4. User now has 100/100 credits available

### 🟡 IMPORTANT: Unlimited Tier Handling

When `credits_limit == -1`:
- `check_credits()` returns `True` immediately (line 93-94)
- `calculate_balance()` should return `-1` for both limit and remaining
- UI should display "Unlimited" instead of a number

### ℹ️ REFERENCE: Files to Modify

**Add to existing:**
- `apps/api/app/services/usage_service.py` - Add `calculate_balance()`, `get_usage_history()`, `add_referral_credits()`
- `apps/api/app/main.py` - Register usage router

**Create new:**
- `apps/api/app/models/usage.py` - Pydantic models
- `apps/api/app/routers/usage.py` - Endpoints
- `apps/api/tests/test_usage.py` - Tests

**Update:**
- `specs/openapi.yaml` - Add /v1/usage paths and schemas
- `apps/api/app/models/__init__.py` - Export new models

### FR Coverage

| FR | Description | Implementation |
|----|-------------|----------------|
| FR54 | View AI generation balance | `GET /v1/usage` returns detailed breakdown |
| FR56 | 5 free generations on signup | ✅ Already implemented - profile defaults to tier="free" |
| FR59 | Referral bonus credits | `add_referral_credits()` inserts negative usage_event |
| FR60 | Block AI when no balance | ✅ Already implemented - `check_credits()` + `CreditExhaustedError` |
| FR61 | Display upgrade message | ✅ Already implemented - error message in `CreditExhaustedError` |

### References

**Source Documents:**
1. Epic: `_bmad-output/planning-artifacts/epics.md` - Lines 1227-1324 (Story 6.1 definition)
2. Architecture: `_bmad-output/planning-artifacts/architecture.md` - Database schema, API patterns
3. PRD: `_bmad-output/planning-artifacts/prd.md` - FR54, FR56, FR59-FR61 definitions

**Existing Code Reference:**
- `apps/api/app/services/usage_service.py` - Current implementation
- `apps/api/app/services/match_service.py` - Usage tracking pattern (lines 98-102, 171-177)
- `supabase/migrations/00004_create_usage_tables.sql` - Schema definition

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- One test initially failed due to incomplete mock data (missing "free" tier in mock)
- Fixed by adding complete tier config to test mock

### Completion Notes List

- **Task 1:** Added `calculate_balance()` and `get_usage_history()` methods to UsageService. Methods aggregate usage by operation type and support pagination.
- **Task 2:** Added `add_referral_credits()` method that inserts negative credits_used for referral bonuses.
- **Task 3:** Created Pydantic models in `usage.py` with proper typing and exported from `__init__.py`.
- **Task 4:** Created usage router with `GET /v1/usage` and `GET /v1/usage/history` endpoints. Registered in main.py.
- **Task 5:** Verified all AI services (cover_letter, answer, outreach, resume) follow the check_credits → AI call → record_usage pattern.
- **Task 6:** Created 15 comprehensive tests covering authentication, tier handling, pagination, referral credits, and negative credits handling. All tests pass.
- **Task 7:** Updated OpenAPI spec with usage endpoints and schemas including UsageByType, UsageBalanceData, UsageEventItem, and UsageHistoryData.

### Code Review Fixes (AI)

**Date:** 2026-02-01
**Reviewer:** Senior Developer Code Review Agent

**HIGH SEVERITY FIXES:**
1. **Pydantic Model Validation** - Added field validators to `UsageByType` to ensure operation type credits are non-negative
2. **Missing User Error Handling** - Changed `get_user_tier()` to raise `JobswyftError` instead of silently returning "free" when user profile not found
3. **DateTime Deprecation** - Replaced `datetime.utcnow()` with `datetime.now(timezone.utc)` for Python 3.12+ compatibility
4. **Missing referral_bonus in usage_by_type** - Added `referral_bonus` field to track bonus credits separately in usage breakdown
5. **Router Type Hints** - Improved return type hints from `dict` to `Dict[str, Any]` for better type safety
6. **Router Security Assertions** - Added assertions to verify service responses are valid before returning to user
7. **Referral Bonus Configuration** - Added `get_referral_bonus_amount()` method to read bonus from `global_config` instead of hardcoding default

**MEDIUM SEVERITY FIXES:**
8. **Missing Balance Logging** - Added logging to `calculate_balance()` for debugging and monitoring
9. **Pagination Error Messages** - Enhanced pagination validation tests to verify helpful error messages

**DOCUMENTATION FIXES:**
10. **Race Condition Warning** - Added documentation warning about potential race condition between `check_credits()` and `record_usage()` in high-concurrency scenarios
11. **Query Parameter Descriptions** - Added descriptions to pagination query parameters

**FILES UPDATED:**
- `apps/api/app/models/usage.py` - Added validators and referral_bonus field
- `apps/api/app/services/usage_service.py` - Error handling, logging, config-based referral bonus
- `apps/api/app/routers/usage.py` - Type hints, security assertions, parameter descriptions
- `apps/api/tests/test_usage.py` - Enhanced validation tests, added test for missing user error
- `specs/openapi.yaml` - Added referral_bonus field to UsageByType schema

### Change Log

- 2026-02-01: Implemented Story 6.1 - Usage Tracking & Balance API. Added 3 new service methods, 2 new endpoints, Pydantic models, 15 tests, OpenAPI documentation.
- 2026-02-01: Applied code review fixes - Enhanced validation, error handling, logging, and security. Added 10 improvements across HIGH/MEDIUM severity issues.

### File List

**Files Created:**
- `apps/api/app/models/usage.py`
- `apps/api/app/routers/usage.py`
- `apps/api/tests/test_usage.py`

**Files Modified:**
- `apps/api/app/services/usage_service.py` - Added `calculate_balance()`, `get_usage_history()`, `add_referral_credits()`, `get_referral_bonus_amount()`
- `apps/api/app/models/__init__.py` - Exported new models (lines 29-34)
- `apps/api/app/main.py` - Registered usage router (line 64)
- `apps/api/app/routers/usage.py` - Created with enhanced type safety and security
- `specs/openapi.yaml` - Added /v1/usage and /v1/usage/history paths with schemas
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status to review
