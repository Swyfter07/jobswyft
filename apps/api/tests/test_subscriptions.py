"""Tests for subscription endpoints."""

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


class TestCheckoutSession:
    """Tests for POST /v1/subscriptions/checkout endpoint."""

    def test_create_checkout_mock_mode(self, mock_user):
        """Mock mode returns mock checkout URL."""
        from app.core.deps import get_current_user
        from app.routers.subscriptions import get_stripe_service

        async def mock_get_current_user():
            return mock_user

        class MockService:
            async def create_checkout_session(
                self, user_id, tier, success_url, cancel_url
            ):
                return {
                    "checkout_url": f"mock://checkout?tier={tier}",
                    "mock": True,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_stripe_service] = lambda: MockService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/subscriptions/checkout",
                json={
                    "tier": "pro",
                    "success_url": "https://app.jobswyft.com/account?success=true",
                    "cancel_url": "https://app.jobswyft.com/account?canceled=true",
                },
            )

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["checkout_url"].startswith("mock://")
            assert data["mock"] is True
        finally:
            app.dependency_overrides.clear()

    def test_checkout_invalid_tier_rejected_by_pydantic(self, mock_user):
        """Invalid tier rejected by Pydantic enum validation."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/subscriptions/checkout",
                json={
                    "tier": "invalid",
                    "success_url": "https://app.jobswyft.com/account?success=true",
                    "cancel_url": "https://app.jobswyft.com/account?canceled=true",
                },
            )

            assert response.status_code == 422  # Pydantic validation error
        finally:
            app.dependency_overrides.clear()

    def test_checkout_all_valid_tiers(self, mock_user):
        """All valid tiers are accepted: starter, pro, power."""
        from app.core.deps import get_current_user
        from app.routers.subscriptions import get_stripe_service

        async def mock_get_current_user():
            return mock_user

        class MockService:
            async def create_checkout_session(
                self, user_id, tier, success_url, cancel_url
            ):
                return {
                    "checkout_url": f"mock://checkout?tier={tier}",
                    "mock": True,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_stripe_service] = lambda: MockService()
        client = TestClient(app)

        try:
            for tier in ["starter", "pro", "power"]:
                response = client.post(
                    "/v1/subscriptions/checkout",
                    json={
                        "tier": tier,
                        "success_url": "https://app.jobswyft.com/success",
                        "cancel_url": "https://app.jobswyft.com/cancel",
                    },
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_checkout_unauthenticated(self, client):
        """Unauthenticated request returns 401."""
        response = client.post(
            "/v1/subscriptions/checkout",
            json={
                "tier": "pro",
                "success_url": "https://app.jobswyft.com/success",
                "cancel_url": "https://app.jobswyft.com/cancel",
            },
        )
        assert response.status_code == 401


class TestPortalSession:
    """Tests for POST /v1/subscriptions/portal endpoint."""

    def test_create_portal_mock_mode(self, mock_user):
        """Mock mode returns mock portal URL."""
        from app.core.deps import get_current_user
        from app.routers.subscriptions import get_stripe_service

        async def mock_get_current_user():
            return mock_user

        class MockService:
            async def create_portal_session(self, user_id):
                return {
                    "portal_url": "mock://portal",
                    "mock": True,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_stripe_service] = lambda: MockService()
        client = TestClient(app)

        try:
            response = client.post("/v1/subscriptions/portal")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["portal_url"] == "mock://portal"
            assert data["mock"] is True
        finally:
            app.dependency_overrides.clear()

    def test_portal_unauthenticated(self, client):
        """Unauthenticated request returns 401."""
        response = client.post("/v1/subscriptions/portal")
        assert response.status_code == 401


class TestMockCancel:
    """Tests for POST /v1/subscriptions/mock-cancel endpoint."""

    def test_mock_cancel_downgrades_to_free(self, mock_user):
        """Mock cancel sets tier to free."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            with patch(
                "app.routers.subscriptions.get_supabase_admin_client"
            ) as mock_client:
                mock_table = MagicMock()
                mock_client.return_value.table.return_value = mock_table
                mock_table.update.return_value.eq.return_value.execute.return_value = (
                    None
                )

                with patch("app.routers.subscriptions.settings") as mock_settings:
                    mock_settings.stripe_mock_mode = True

                    response = client.post("/v1/subscriptions/mock-cancel", json={})

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["tier"] == "free"
        finally:
            app.dependency_overrides.clear()

    def test_mock_cancel_returns_403_in_real_mode(self, mock_user):
        """Mock cancel returns 403 when mock mode disabled."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            with patch("app.routers.subscriptions.settings") as mock_settings:
                mock_settings.stripe_mock_mode = False

                response = client.post("/v1/subscriptions/mock-cancel", json={})

            assert response.status_code == 403
            assert response.json()["error"]["code"] == "MOCK_MODE_DISABLED"
        finally:
            app.dependency_overrides.clear()

    def test_mock_cancel_updates_database_correctly(self, mock_user):
        """Mock cancel actually updates subscription_tier and subscription_status in database."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            with patch(
                "app.routers.subscriptions.get_supabase_admin_client"
            ) as mock_client:
                mock_table = MagicMock()
                mock_client.return_value.table.return_value = mock_table
                mock_table.update.return_value.eq.return_value.execute.return_value = (
                    None
                )

                with patch("app.routers.subscriptions.settings") as mock_settings:
                    mock_settings.stripe_mock_mode = True

                    response = client.post("/v1/subscriptions/mock-cancel", json={})

                # Verify database update was called correctly
                assert response.status_code == 200
                mock_client.return_value.table.assert_called_with("profiles")

                # Verify update payload structure
                update_call = mock_table.update.call_args[0][0]
                assert update_call["subscription_tier"] == "free"
                assert update_call["subscription_status"] == "canceled"
                assert "updated_at" in update_call

                # Verify eq filter was applied with correct user_id
                mock_table.update.return_value.eq.assert_called_with("id", mock_user["id"])
        finally:
            app.dependency_overrides.clear()


class TestWebhook:
    """Tests for POST /v1/webhooks/stripe endpoint."""

    def test_webhook_accepts_post(self, client):
        """Webhook endpoint accepts POST requests."""
        from app.routers.webhooks import get_stripe_service

        class MockService:
            async def handle_webhook(self, payload, signature):
                return {"status": "ignored"}

        app.dependency_overrides[get_stripe_service] = lambda: MockService()

        try:
            response = client.post(
                "/v1/webhooks/stripe",
                content=b"test_payload",
                headers={"stripe-signature": "test_sig"},
            )

            assert response.status_code == 200
            assert response.json()["received"] is True
        finally:
            app.dependency_overrides.clear()


class TestMockStripeService:
    """Tests for MockStripeService implementation."""

    @pytest.mark.asyncio
    async def test_checkout_maps_tier_to_database(self):
        """Checkout maps API tier to database tier."""
        from app.services.stripe_service import MockStripeService

        service = MockStripeService()
        user_id = str(uuid4())

        with patch(
            "app.db.client.get_supabase_admin_client"
        ) as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table
            mock_table.update.return_value.eq.return_value.execute.return_value = None

            # Test "power" → "unlimited" mapping
            result = await service.create_checkout_session(
                user_id=user_id,
                tier="power",
                success_url="https://app.jobswyft.com/account",
                cancel_url="https://app.jobswyft.com/account",
            )

            assert result["checkout_url"] == "mock://checkout?tier=power"
            assert result["mock"] is True

            call_args = mock_table.update.call_args[0][0]
            assert call_args["subscription_tier"] == "unlimited"  # Mapped!
            assert call_args["subscription_status"] == "active"

    @pytest.mark.asyncio
    async def test_checkout_starter_maps_to_pro(self):
        """Checkout maps starter tier to pro database tier."""
        from app.services.stripe_service import MockStripeService

        service = MockStripeService()
        user_id = str(uuid4())

        with patch(
            "app.db.client.get_supabase_admin_client"
        ) as mock_client:
            mock_table = MagicMock()
            mock_client.return_value.table.return_value = mock_table
            mock_table.update.return_value.eq.return_value.execute.return_value = None

            # Test "starter" → "pro" mapping
            result = await service.create_checkout_session(
                user_id=user_id,
                tier="starter",
                success_url="https://app.jobswyft.com/account",
                cancel_url="https://app.jobswyft.com/account",
            )

            assert result["checkout_url"] == "mock://checkout?tier=starter"
            call_args = mock_table.update.call_args[0][0]
            assert call_args["subscription_tier"] == "pro"  # Mapped!

    @pytest.mark.asyncio
    async def test_checkout_invalid_tier_raises_exception(self):
        """Invalid tier raises InvalidSubscriptionTierError."""
        from app.core.exceptions import InvalidSubscriptionTierError
        from app.services.stripe_service import MockStripeService

        service = MockStripeService()

        with pytest.raises(InvalidSubscriptionTierError) as exc_info:
            await service.create_checkout_session(
                user_id=str(uuid4()),
                tier="invalid",
                success_url="https://example.com",
                cancel_url="https://example.com",
            )

        assert "invalid" in str(exc_info.value.message)

    @pytest.mark.asyncio
    async def test_portal_session_returns_mock_url(self):
        """Portal session returns mock URL."""
        from app.services.stripe_service import MockStripeService

        service = MockStripeService()
        user_id = str(uuid4())

        result = await service.create_portal_session(user_id=user_id)

        assert result["portal_url"] == "mock://portal"
        assert result["mock"] is True

    @pytest.mark.asyncio
    async def test_webhook_handler_returns_ignored(self):
        """Webhook handler returns ignored status in mock mode."""
        from app.services.stripe_service import MockStripeService

        service = MockStripeService()

        result = await service.handle_webhook(b"test_payload", "test_signature")

        assert result["status"] == "ignored"
