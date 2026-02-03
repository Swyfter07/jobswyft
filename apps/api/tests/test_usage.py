"""Tests for usage endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def mock_user():
    """Create a mock authenticated user."""
    return {"id": str(uuid4()), "email": "test@example.com"}


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def authenticated_client(mock_user):
    """Create a test client with mocked authentication."""
    from app.core.deps import get_current_user

    async def mock_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_user] = mock_get_current_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


class TestGetUsageAuthentication:
    """Tests for authentication requirements on /v1/usage endpoint."""

    def test_get_usage_unauthenticated_returns_401(self, client):
        """Unauthenticated request returns 401."""
        response = client.get("/v1/usage")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_get_usage_history_unauthenticated_returns_401(self, client):
        """Unauthenticated request to history returns 401."""
        response = client.get("/v1/usage/history")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestGetUsage:
    """Tests for GET /v1/usage endpoint."""

    def test_get_usage_free_tier(self, mock_user):
        """Free tier returns lifetime period type."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def calculate_balance(self, user_id):
                return {
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
                        "resume_parse": 0,
                    },
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["subscription_tier"] == "free"
            assert data["data"]["period_type"] == "lifetime"
            assert data["data"]["period_key"] == "lifetime"
            assert data["data"]["credits_used"] == 3
            assert data["data"]["credits_limit"] == 5
            assert data["data"]["credits_remaining"] == 2

            usage_by_type = data["data"]["usage_by_type"]
            assert usage_by_type["match"] == 1
            assert usage_by_type["cover_letter"] == 2
            assert usage_by_type["answer"] == 0
        finally:
            app.dependency_overrides.clear()

    def test_get_usage_pro_tier_monthly(self, mock_user):
        """Pro tier returns monthly period type with current month."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def calculate_balance(self, user_id):
                return {
                    "subscription_tier": "pro",
                    "period_type": "monthly",
                    "period_key": "2026-02",
                    "credits_used": 45,
                    "credits_limit": 100,
                    "credits_remaining": 55,
                    "usage_by_type": {
                        "match": 10,
                        "cover_letter": 20,
                        "answer": 10,
                        "outreach": 5,
                        "resume_parse": 0,
                    },
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["subscription_tier"] == "pro"
            assert data["period_type"] == "monthly"
            assert data["period_key"] == "2026-02"
            assert data["credits_limit"] == 100
            assert data["credits_remaining"] == 55
        finally:
            app.dependency_overrides.clear()

    def test_get_usage_unlimited_tier(self, mock_user):
        """Unlimited tier shows -1 for limits."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def calculate_balance(self, user_id):
                return {
                    "subscription_tier": "unlimited",
                    "period_type": "monthly",
                    "period_key": "2026-02",
                    "credits_used": 500,
                    "credits_limit": -1,
                    "credits_remaining": -1,
                    "usage_by_type": {
                        "match": 100,
                        "cover_letter": 200,
                        "answer": 100,
                        "outreach": 50,
                        "resume_parse": 50,
                    },
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["subscription_tier"] == "unlimited"
            assert data["credits_limit"] == -1
            assert data["credits_remaining"] == -1
        finally:
            app.dependency_overrides.clear()

    def test_get_usage_includes_subscription_status(self, mock_user):
        """Usage response includes subscription_status field (Story 6.2 - AC4)."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def calculate_balance(self, user_id):
                return {
                    "subscription_tier": "pro",
                    "period_type": "monthly",
                    "period_key": "2026-02",
                    "credits_used": 45,
                    "credits_limit": 100,
                    "credits_remaining": 55,
                    "usage_by_type": {
                        "match": 10,
                        "cover_letter": 20,
                        "answer": 10,
                        "outreach": 5,
                        "resume_parse": 0,
                    },
                    "subscription_status": "active",  # NEW: Story 6.2
                    "current_period_end": "2026-02-28T23:59:59+00:00",  # NEW: Story 6.2
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["subscription_status"] == "active"
            assert data["current_period_end"] == "2026-02-28T23:59:59+00:00"
        finally:
            app.dependency_overrides.clear()

    def test_get_usage_current_period_end_null_for_lifetime(self, mock_user):
        """Lifetime tier returns null for current_period_end (Story 6.2 - AC4)."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def calculate_balance(self, user_id):
                return {
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
                        "resume_parse": 0,
                    },
                    "subscription_status": "active",
                    "current_period_end": None,  # Lifetime = no period end
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["subscription_status"] == "active"
            assert data["current_period_end"] is None
        finally:
            app.dependency_overrides.clear()

    def test_get_usage_subscription_status_canceled(self, mock_user):
        """Usage response returns canceled subscription status (Story 6.2 - AC4)."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def calculate_balance(self, user_id):
                return {
                    "subscription_tier": "free",
                    "period_type": "lifetime",
                    "period_key": "lifetime",
                    "credits_used": 0,
                    "credits_limit": 5,
                    "credits_remaining": 5,
                    "usage_by_type": {
                        "match": 0,
                        "cover_letter": 0,
                        "answer": 0,
                        "outreach": 0,
                        "resume_parse": 0,
                    },
                    "subscription_status": "canceled",  # User canceled their subscription
                    "current_period_end": None,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["subscription_status"] == "canceled"
        finally:
            app.dependency_overrides.clear()


class TestUsageHistory:
    """Tests for GET /v1/usage/history endpoint."""

    def test_get_history_paginated(self, mock_user):
        """History returns paginated events."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def get_usage_history(self, user_id, page, page_size):
                return {
                    "items": [
                        {
                            "id": str(uuid4()),
                            "operation_type": "cover_letter",
                            "ai_provider": "claude",
                            "credits_used": 1,
                            "period_type": "lifetime",
                            "period_key": "lifetime",
                            "created_at": "2026-02-01T10:00:00Z",
                        }
                    ],
                    "total": 1,
                    "page": page,
                    "page_size": page_size,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage/history?page=1&page_size=20")

            assert response.status_code == 200
            data = response.json()["data"]
            assert len(data["items"]) == 1
            assert data["total"] == 1
            assert data["page"] == 1
            assert data["page_size"] == 20
            assert data["items"][0]["operation_type"] == "cover_letter"
        finally:
            app.dependency_overrides.clear()

    def test_get_history_custom_pagination(self, mock_user):
        """History respects custom pagination parameters."""
        from app.core.deps import get_current_user
        from app.routers.usage import get_usage_service

        async def mock_get_current_user():
            return mock_user

        class MockUsageService:
            async def get_usage_history(self, user_id, page, page_size):
                return {
                    "items": [],
                    "total": 50,
                    "page": page,
                    "page_size": page_size,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage/history?page=3&page_size=10")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["page"] == 3
            assert data["page_size"] == 10
        finally:
            app.dependency_overrides.clear()

    def test_get_history_invalid_page(self, authenticated_client):
        """Invalid page parameter returns 422 with helpful error."""
        response = authenticated_client.get("/v1/usage/history?page=0")
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Ensure error message mentions the validation issue
        assert any("page" in str(err).lower() for err in data["detail"])

    def test_get_history_invalid_page_size(self, authenticated_client):
        """Invalid page_size parameter returns 422 with helpful error."""
        response = authenticated_client.get("/v1/usage/history?page_size=200")
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Ensure error message mentions the validation issue
        assert any("page_size" in str(err).lower() for err in data["detail"])


class TestGetUserTier:
    """Tests for UsageService.get_user_tier method."""

    @pytest.mark.asyncio
    async def test_missing_user_raises_error(self):
        """Missing user profile raises AuthenticationError."""
        from app.core.exceptions import AuthenticationError
        from app.services.usage_service import UsageService

        service = UsageService()
        with patch.object(service.admin_client, "table") as mock_table:
            mock_response = MagicMock()
            mock_response.data = None  # No user found
            mock_table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
                mock_response
            )

            with pytest.raises(AuthenticationError):
                await service.get_user_tier("missing-user-123")


class TestCalculateBalance:
    """Tests for UsageService.calculate_balance method."""

    @pytest.mark.asyncio
    async def test_aggregates_by_operation_type(self):
        """Balance correctly aggregates usage by operation type."""
        from app.services.usage_service import UsageService

        service = UsageService()

        # Mock the async methods
        async def mock_get_user_tier(user_id):
            return "free"

        async def mock_get_tier_limits():
            return {"free": {"type": "lifetime", "credits": 5, "max_resumes": 5}}

        with patch.object(service, "get_user_tier", mock_get_user_tier):
            with patch.object(service, "get_tier_limits", mock_get_tier_limits):
                with patch.object(service.admin_client, "table") as mock_table:
                    mock_response = MagicMock()
                    mock_response.data = [
                        {"operation_type": "match", "credits_used": 1},
                        {"operation_type": "cover_letter", "credits_used": 2},
                    ]
                    mock_table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = (
                        mock_response
                    )

                    result = await service.calculate_balance("user-123")

                    assert result["credits_used"] == 3
                    assert result["credits_remaining"] == 2
                    assert result["usage_by_type"]["match"] == 1
                    assert result["usage_by_type"]["cover_letter"] == 2

    @pytest.mark.asyncio
    async def test_unlimited_tier_returns_minus_one(self):
        """Unlimited tier returns -1 for remaining credits."""
        from app.services.usage_service import UsageService

        service = UsageService()

        async def mock_get_user_tier(user_id):
            return "unlimited"

        async def mock_get_tier_limits():
            return {
                "free": {"type": "lifetime", "credits": 5, "max_resumes": 5},
                "unlimited": {"type": "monthly", "credits": -1, "max_resumes": 25},
            }

        with patch.object(service, "get_user_tier", mock_get_user_tier):
            with patch.object(service, "get_tier_limits", mock_get_tier_limits):
                with patch.object(service.admin_client, "table") as mock_table:
                    mock_response = MagicMock()
                    mock_response.data = []
                    mock_table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = (
                        mock_response
                    )

                    result = await service.calculate_balance("user-123")

                    assert result["credits_limit"] == -1
                    assert result["credits_remaining"] == -1


class TestAddReferralCredits:
    """Tests for referral credit addition."""

    @pytest.mark.asyncio
    async def test_inserts_negative_credits(self):
        """Referral credits insert negative value."""
        from app.services.usage_service import UsageService

        service = UsageService()
        with patch.object(service.admin_client, "table") as mock_table:
            mock_insert = MagicMock()
            mock_execute = MagicMock()
            mock_insert.execute = mock_execute
            mock_table.return_value.insert.return_value = mock_insert

            result = await service.add_referral_credits("user-123", 5)

            assert result == 5
            mock_table.return_value.insert.assert_called_once()
            call_args = mock_table.return_value.insert.call_args[0][0]
            assert call_args["credits_used"] == -5
            assert call_args["operation_type"] == "referral_bonus"
            assert call_args["period_type"] == "lifetime"
            assert call_args["period_key"] == "lifetime"
            assert call_args["ai_provider"] == "system"

    @pytest.mark.asyncio
    async def test_custom_bonus_amount(self):
        """Referral credits can have custom amount."""
        from app.services.usage_service import UsageService

        service = UsageService()
        with patch.object(service.admin_client, "table") as mock_table:
            mock_insert = MagicMock()
            mock_execute = MagicMock()
            mock_insert.execute = mock_execute
            mock_table.return_value.insert.return_value = mock_insert

            result = await service.add_referral_credits("user-123", 10)

            assert result == 10
            call_args = mock_table.return_value.insert.call_args[0][0]
            assert call_args["credits_used"] == -10

    @pytest.mark.asyncio
    async def test_uses_global_config_when_no_amount_specified(self):
        """Referral credits use global_config when amount not specified."""
        from app.services.usage_service import UsageService

        service = UsageService()

        async def mock_get_referral_bonus():
            return 10

        with patch.object(service, "get_referral_bonus_amount", mock_get_referral_bonus):
            with patch.object(service.admin_client, "table") as mock_table:
                mock_insert = MagicMock()
                mock_execute = MagicMock()
                mock_insert.execute = mock_execute
                mock_table.return_value.insert.return_value = mock_insert

                result = await service.add_referral_credits("user-123")

                assert result == 10
                call_args = mock_table.return_value.insert.call_args[0][0]
                assert call_args["credits_used"] == -10


class TestGetUsageHistory:
    """Tests for UsageService.get_usage_history method."""

    @pytest.mark.asyncio
    async def test_returns_paginated_results(self):
        """History returns correctly paginated results."""
        from app.services.usage_service import UsageService

        service = UsageService()
        with patch.object(service.admin_client, "table") as mock_table:
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "id": "event-1",
                    "operation_type": "match",
                    "credits_used": 1,
                }
            ]
            mock_response.count = 50
            mock_table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = (
                mock_response
            )

            result = await service.get_usage_history("user-123", page=2, page_size=10)

            assert result["items"] == mock_response.data
            assert result["total"] == 50
            assert result["page"] == 2
            assert result["page_size"] == 10

            # Verify correct range was called (page 2, size 10 -> range(10, 19))
            mock_table.return_value.select.return_value.eq.return_value.order.return_value.range.assert_called_once_with(
                10, 19
            )


class TestNegativeCreditsHandling:
    """Tests for referral bonus handling in balance calculation."""

    @pytest.mark.asyncio
    async def test_referral_credits_reduce_total_used(self):
        """Referral bonus (negative credits) reduces total used."""
        from app.services.usage_service import UsageService

        service = UsageService()

        async def mock_get_user_tier(user_id):
            return "free"

        async def mock_get_tier_limits():
            return {"free": {"type": "lifetime", "credits": 5, "max_resumes": 5}}

        with patch.object(service, "get_user_tier", mock_get_user_tier):
            with patch.object(service, "get_tier_limits", mock_get_tier_limits):
                with patch.object(service.admin_client, "table") as mock_table:
                    mock_response = MagicMock()
                    mock_response.data = [
                        {"operation_type": "match", "credits_used": 3},
                        {"operation_type": "referral_bonus", "credits_used": -5},
                    ]
                    mock_table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = (
                        mock_response
                    )

                    result = await service.calculate_balance("user-123")

                    # 3 - 5 = -2 used, so remaining = 5 - (-2) = 7
                    assert result["credits_used"] == -2
                    assert result["credits_remaining"] == 7
                    # Verify referral_bonus appears in usage breakdown
                    assert result["usage_by_type"]["referral_bonus"] == -5
                    assert result["usage_by_type"]["match"] == 3
