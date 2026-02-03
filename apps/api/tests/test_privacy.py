"""Tests for privacy endpoints."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
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


# ============================================================================
# Authentication Tests
# ============================================================================


class TestPrivacyAuthentication:
    """Tests for authentication requirements on privacy endpoints."""

    def test_data_summary_unauthenticated_returns_401(self, client):
        """Unauthenticated request returns 401."""
        response = client.get("/v1/privacy/data-summary")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_delete_request_unauthenticated_returns_401(self, client):
        """Unauthenticated request returns 401."""
        response = client.post("/v1/privacy/delete-request")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_cancel_delete_unauthenticated_returns_401(self, client):
        """Unauthenticated request returns 401."""
        response = client.post("/v1/privacy/cancel-delete")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_confirm_delete_does_not_require_auth(self, client):
        """Confirm delete endpoint does not require authentication (token is proof)."""
        from app.core.exceptions import InvalidDeletionTokenError
        from app.routers.privacy import get_privacy_service

        # Mock the service to raise invalid token (simulating what happens with wrong token)
        class MockPrivacyService:
            async def confirm_deletion(self, token):
                raise InvalidDeletionTokenError()

        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()

        try:
            response = client.post("/v1/privacy/confirm-delete", json={"token": "x" * 32})
            # Should not be 401 - will be 400 since token is invalid (not auth error)
            assert response.status_code == 400
            assert response.json()["error"]["code"] == "INVALID_TOKEN"
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Data Summary Tests
# ============================================================================


class TestDataSummary:
    """Tests for GET /v1/privacy/data-summary endpoint."""

    def test_returns_enhanced_summary(self, mock_user):
        """Data summary returns all required fields."""
        from app.core.deps import get_current_user
        from app.routers.privacy import get_privacy_service

        async def mock_get_current_user():
            return mock_user

        class MockPrivacyService:
            async def get_data_summary(self, user_id, email):
                return {
                    "profile": {
                        "stored": True,
                        "fields": ["email", "full_name", "subscription_tier", "preferences"],
                        "location": "Supabase PostgreSQL (encrypted at rest)",
                    },
                    "resumes": {
                        "count": 3,
                        "max_resumes": 5,
                        "at_limit": False,
                        "storage": "Supabase Storage (encrypted)",
                        "includes": ["PDF files", "parsed text data"],
                    },
                    "jobs": {
                        "count": 25,
                        "storage": "Supabase PostgreSQL",
                        "status_breakdown": {
                            "applied": 15,
                            "interviewing": 6,
                            "offered": 2,
                            "rejected": 2,
                        },
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
                            "resume_parse": 2,
                        },
                    },
                    "ai_generated_content": {
                        "stored": False,
                        "note": "AI outputs are never saved to our servers",
                    },
                    "data_retention": "Data retained until you delete your account",
                    "export_available": False,
                    "export_note": "Data export feature coming in future update (GDPR compliance)",
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()
        client = TestClient(app)

        try:
            response = client.get("/v1/privacy/data-summary")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["profile"]["stored"] is True
            assert data["resumes"]["count"] == 3
            assert data["resumes"]["max_resumes"] == 5
            assert data["resumes"]["at_limit"] is False
            assert data["jobs"]["count"] == 25
            assert data["jobs"]["status_breakdown"]["applied"] == 15
            assert data["usage_history"]["count"] == 47
            assert data["usage_history"]["breakdown"]["cover_letter"] == 18
            assert data["ai_generated_content"]["stored"] is False
        finally:
            app.dependency_overrides.clear()

    def test_resume_at_limit_indicator(self, mock_user):
        """Data summary correctly indicates when at resume limit."""
        from app.core.deps import get_current_user
        from app.routers.privacy import get_privacy_service

        async def mock_get_current_user():
            return mock_user

        class MockPrivacyService:
            async def get_data_summary(self, user_id, email):
                return {
                    "profile": {"stored": True, "fields": [], "location": ""},
                    "resumes": {
                        "count": 5,
                        "max_resumes": 5,
                        "at_limit": True,
                        "storage": "Supabase Storage",
                        "includes": [],
                    },
                    "jobs": {"count": 0, "storage": "", "status_breakdown": {}},
                    "usage_history": {"count": 0, "storage": "", "includes": [], "breakdown": {}},
                    "ai_generated_content": {"stored": False, "note": ""},
                    "data_retention": "",
                    "export_available": False,
                    "export_note": "",
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()
        client = TestClient(app)

        try:
            response = client.get("/v1/privacy/data-summary")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["resumes"]["count"] == 5
            assert data["resumes"]["at_limit"] is True
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Delete Request Tests
# ============================================================================


class TestDeleteRequest:
    """Tests for POST /v1/privacy/delete-request endpoint."""

    def test_initiates_deletion_returns_masked_email(self, mock_user):
        """Delete request returns masked email and token sent message."""
        from app.core.deps import get_current_user
        from app.routers.privacy import get_privacy_service

        async def mock_get_current_user():
            return mock_user

        class MockPrivacyService:
            async def initiate_deletion(self, user_id, email, reason=None):
                return {
                    "message": "Confirmation email sent. Please check your inbox.",
                    "email_sent_to": "t***@example.com",
                    "expires_in": "24 hours",
                    "deletion_initiated_at": "2026-02-01T12:00:00+00:00",
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()
        client = TestClient(app)

        try:
            response = client.post("/v1/privacy/delete-request")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["message"] == "Confirmation email sent. Please check your inbox."
            assert data["email_sent_to"] == "t***@example.com"
            assert data["expires_in"] == "24 hours"
            assert "deletion_initiated_at" in data
        finally:
            app.dependency_overrides.clear()

    def test_accepts_optional_reason(self, mock_user):
        """Delete request accepts optional reason."""
        from app.core.deps import get_current_user
        from app.routers.privacy import get_privacy_service

        async def mock_get_current_user():
            return mock_user

        captured_reason = None

        class MockPrivacyService:
            async def initiate_deletion(self, user_id, email, reason=None):
                nonlocal captured_reason
                captured_reason = reason
                return {
                    "message": "Confirmation email sent.",
                    "email_sent_to": "t***@example.com",
                    "expires_in": "24 hours",
                    "deletion_initiated_at": "2026-02-01T12:00:00+00:00",
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/privacy/delete-request",
                json={"reason": "no_longer_needed"},
            )

            assert response.status_code == 200
            assert captured_reason == "no_longer_needed"
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Confirm Delete Tests
# ============================================================================


class TestConfirmDelete:
    """Tests for POST /v1/privacy/confirm-delete endpoint."""

    def test_valid_token_confirms_deletion(self, client):
        """Valid token confirms deletion."""
        from app.routers.privacy import get_privacy_service

        class MockPrivacyService:
            async def confirm_deletion(self, token):
                return {
                    "message": "Your account and all data have been permanently deleted.",
                    "deleted_at": "2026-02-01T12:30:00+00:00",
                }

        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()

        try:
            response = client.post(
                "/v1/privacy/confirm-delete",
                json={"token": "a" * 64},  # 64 char token
            )

            assert response.status_code == 200
            data = response.json()["data"]
            assert "permanently deleted" in data["message"]
            assert "deleted_at" in data
        finally:
            app.dependency_overrides.clear()

    def test_invalid_token_returns_400(self, client):
        """Invalid token returns 400."""
        from app.core.exceptions import InvalidDeletionTokenError
        from app.routers.privacy import get_privacy_service

        class MockPrivacyService:
            async def confirm_deletion(self, token):
                raise InvalidDeletionTokenError()

        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()

        try:
            response = client.post(
                "/v1/privacy/confirm-delete",
                json={"token": "invalid" + "x" * 30},  # Meet min length
            )

            assert response.status_code == 400
            data = response.json()
            assert data["success"] is False
            assert data["error"]["code"] == "INVALID_TOKEN"
        finally:
            app.dependency_overrides.clear()

    def test_expired_token_returns_400(self, client):
        """Expired token returns 400."""
        from app.core.exceptions import DeletionTokenExpiredError
        from app.routers.privacy import get_privacy_service

        class MockPrivacyService:
            async def confirm_deletion(self, token):
                raise DeletionTokenExpiredError()

        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()

        try:
            response = client.post(
                "/v1/privacy/confirm-delete",
                json={"token": "expired" + "x" * 30},  # Meet min length
            )

            assert response.status_code == 400
            data = response.json()
            assert data["success"] is False
            assert data["error"]["code"] == "INVALID_TOKEN"
        finally:
            app.dependency_overrides.clear()

    def test_token_too_short_returns_422(self, client):
        """Token shorter than 32 chars returns validation error."""
        response = client.post(
            "/v1/privacy/confirm-delete",
            json={"token": "short"},
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data


# ============================================================================
# Cancel Delete Tests
# ============================================================================


class TestCancelDelete:
    """Tests for POST /v1/privacy/cancel-delete endpoint."""

    def test_clears_pending_deletion(self, mock_user):
        """Cancel delete clears pending deletion token."""
        from app.core.deps import get_current_user
        from app.routers.privacy import get_privacy_service

        async def mock_get_current_user():
            return mock_user

        class MockPrivacyService:
            async def cancel_deletion(self, user_id):
                return {
                    "message": "Pending deletion has been cancelled. Your account remains active.",
                    "cancelled_at": "2026-02-01T13:00:00+00:00",
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()
        client = TestClient(app)

        try:
            response = client.post("/v1/privacy/cancel-delete")

            assert response.status_code == 200
            data = response.json()["data"]
            assert "cancelled" in data["message"]
            assert "cancelled_at" in data
        finally:
            app.dependency_overrides.clear()

    def test_returns_404_if_no_pending_deletion(self, mock_user):
        """Cancel returns 404 if no pending deletion."""
        from app.core.deps import get_current_user
        from app.core.exceptions import PendingDeletionNotFoundError
        from app.routers.privacy import get_privacy_service

        async def mock_get_current_user():
            return mock_user

        class MockPrivacyService:
            async def cancel_deletion(self, user_id):
                raise PendingDeletionNotFoundError()

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_privacy_service] = lambda: MockPrivacyService()
        client = TestClient(app)

        try:
            response = client.post("/v1/privacy/cancel-delete")

            assert response.status_code == 404
            data = response.json()
            assert data["success"] is False
            assert data["error"]["code"] == "NOT_FOUND"
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Privacy Service Unit Tests
# ============================================================================


class TestPrivacyServiceEmailMasking:
    """Tests for PrivacyService._mask_email method."""

    def test_mask_normal_email(self):
        """Normal email masks correctly."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        assert service._mask_email("john@example.com") == "j***@example.com"

    def test_mask_short_local_part(self):
        """Short local part masks correctly."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        assert service._mask_email("a@test.com") == "a***@test.com"

    def test_mask_empty_email(self):
        """Empty email returns ***."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        assert service._mask_email("") == "***"

    def test_mask_no_at_symbol(self):
        """Email without @ masks first char."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        assert service._mask_email("test") == "t***"

    def test_mask_at_only(self):
        """@ only returns ***@."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        assert service._mask_email("@domain.com") == "***@domain.com"

    def test_mask_multiple_at_symbols(self):
        """Multiple @ uses first one."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        result = service._mask_email("user@@domain.com")
        assert result == "u***@@domain.com"

    def test_mask_no_domain(self):
        """Email with no domain after @."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        # When domain is empty string, the function returns without trailing @
        assert service._mask_email("user@") == "u***"


class TestPrivacyServiceTokenGeneration:
    """Tests for token generation and hashing."""

    def test_token_length(self):
        """Generated token has correct length (64 chars)."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        token = service._generate_deletion_token()
        assert len(token) == 64

    def test_token_uniqueness(self):
        """Each generated token is unique."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        tokens = [service._generate_deletion_token() for _ in range(100)]
        assert len(set(tokens)) == 100

    def test_hash_consistency(self):
        """Same token produces same hash."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        token = "test_token_12345"
        hash1 = service._hash_token(token)
        hash2 = service._hash_token(token)
        assert hash1 == hash2

    def test_hash_is_sha256(self):
        """Hash is valid SHA-256 (64 hex chars)."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        token = "test_token"
        hash_value = service._hash_token(token)
        assert len(hash_value) == 64
        assert all(c in "0123456789abcdef" for c in hash_value)


class TestPrivacyServiceDataSummary:
    """Tests for PrivacyService.get_data_summary method."""

    @pytest.mark.asyncio
    async def test_counts_records_correctly(self):
        """Data summary counts records correctly."""
        from app.services.privacy_service import PrivacyService

        service = PrivacyService()
        user_id = str(uuid4())

        with patch.object(service.admin_client, "table") as mock_table:
            # Mock resume count
            mock_resume_response = MagicMock()
            mock_resume_response.count = 3
            mock_resume_response.data = []

            # Mock job response
            mock_job_response = MagicMock()
            mock_job_response.data = [
                {"status": "applied"},
                {"status": "applied"},
                {"status": "interviewing"},
            ]

            # Mock usage response
            mock_usage_response = MagicMock()
            mock_usage_response.data = [
                {"operation_type": "match"},
                {"operation_type": "cover_letter"},
                {"operation_type": "cover_letter"},
            ]

            def mock_table_side_effect(table_name):
                mock_chain = MagicMock()
                if table_name == "resumes":
                    mock_chain.select.return_value.eq.return_value.execute.return_value = mock_resume_response
                elif table_name == "jobs":
                    mock_chain.select.return_value.eq.return_value.execute.return_value = mock_job_response
                elif table_name == "usage_events":
                    mock_chain.select.return_value.eq.return_value.execute.return_value = mock_usage_response
                return mock_chain

            mock_table.side_effect = mock_table_side_effect

            result = await service.get_data_summary(user_id, "test@example.com")

            assert result["resumes"]["count"] == 3
            assert result["resumes"]["at_limit"] is False
            assert result["jobs"]["count"] == 3
            assert result["jobs"]["status_breakdown"]["applied"] == 2
            assert result["jobs"]["status_breakdown"]["interviewing"] == 1
            assert result["usage_history"]["count"] == 3
            assert result["usage_history"]["breakdown"]["match"] == 1
            assert result["usage_history"]["breakdown"]["cover_letter"] == 2


# ============================================================================
# Usage Endpoint Enhancement Tests
# ============================================================================


class TestUsagePendingDeletion:
    """Tests for pending_deletion_expires in usage endpoint."""

    def test_returns_pending_deletion_expires_when_present(self, mock_user):
        """Usage response includes pending_deletion_expires when present."""
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
                    "current_period_end": None,
                    "pending_deletion_expires": "2026-02-02T12:00:00+00:00",
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            assert data["pending_deletion_expires"] == "2026-02-02T12:00:00+00:00"
        finally:
            app.dependency_overrides.clear()

    def test_omits_pending_deletion_expires_when_not_present(self, mock_user):
        """Usage response omits pending_deletion_expires when not set."""
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
                    "current_period_end": None,
                    # Note: No pending_deletion_expires
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_usage_service] = lambda: MockUsageService()
        client = TestClient(app)

        try:
            response = client.get("/v1/usage")

            assert response.status_code == 200
            data = response.json()["data"]
            # Field should be absent or None
            assert data.get("pending_deletion_expires") is None
        finally:
            app.dependency_overrides.clear()
