"""Tests for feedback endpoints."""

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


class TestFeedbackAuthentication:
    """Tests for authentication requirements on feedback endpoints."""

    def test_submit_feedback_unauthenticated_returns_401(self, client):
        """Unauthenticated request returns 401."""
        response = client.post(
            "/v1/feedback",
            json={"content": "This is my feedback about the product."},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


# ============================================================================
# Submit Feedback Tests
# ============================================================================


class TestSubmitFeedback:
    """Tests for POST /v1/feedback endpoint."""

    def test_submit_feedback_with_all_fields(self, mock_user):
        """Submit feedback with all fields returns 200 + feedback_id."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        feedback_id = str(uuid4())

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": feedback_id,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={
                    "content": "The cover letter generation is amazing! Would love more tone options.",
                    "category": "feature_request",
                    "context": {
                        "page_url": "https://linkedin.com/jobs/123",
                        "feature_used": "cover_letter",
                        "browser": "Chrome 120",
                    },
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["message"] == "Thank you for your feedback!"
            assert data["data"]["feedback_id"] == feedback_id
        finally:
            app.dependency_overrides.clear()

    def test_submit_feedback_with_only_content(self, mock_user):
        """Submit feedback with only content returns 200 (category defaults to general)."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        captured_category = None
        feedback_id = str(uuid4())

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_category
                captured_category = category
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": feedback_id,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "Great product! I really enjoy using it."},
            )

            assert response.status_code == 200
            assert captured_category == "general"
        finally:
            app.dependency_overrides.clear()

    def test_submit_feedback_with_category(self, mock_user):
        """Submit feedback with category saves correct category."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        captured_category = None
        feedback_id = str(uuid4())

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_category
                captured_category = category
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": feedback_id,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={
                    "content": "Found a bug when clicking the button twice.",
                    "category": "bug",
                },
            )

            assert response.status_code == 200
            assert captured_category == "bug"
        finally:
            app.dependency_overrides.clear()

    def test_submit_feedback_with_context(self, mock_user):
        """Submit feedback with context saves context correctly."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        captured_context = None
        feedback_id = str(uuid4())

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_context
                captured_context = context
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": feedback_id,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={
                    "content": "The extension works great on this page.",
                    "context": {
                        "page_url": "https://indeed.com/job/12345",
                        "browser": "Firefox 121",
                        "extension_version": "1.2.3",
                    },
                },
            )

            assert response.status_code == 200
            assert captured_context["page_url"] == "https://indeed.com/job/12345"
            assert captured_context["browser"] == "Firefox 121"
            assert captured_context["extension_version"] == "1.2.3"
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Validation Tests
# ============================================================================


class TestFeedbackValidation:
    """Tests for feedback content validation."""

    def test_empty_content_returns_422(self, mock_user):
        """Empty content returns validation error."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": ""},
            )

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
        finally:
            app.dependency_overrides.clear()

    def test_content_too_short_returns_422(self, mock_user):
        """Content less than 10 characters returns validation error."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "Too short"},  # 9 characters
            )

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
        finally:
            app.dependency_overrides.clear()

    def test_content_exactly_10_chars_succeeds(self, mock_user):
        """Content exactly 10 characters succeeds."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": str(uuid4()),
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "1234567890"},  # Exactly 10 characters
            )

            assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_content_too_long_returns_422(self, mock_user):
        """Content more than 5000 characters returns validation error."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "x" * 5001},  # 5001 characters
            )

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
        finally:
            app.dependency_overrides.clear()

    def test_content_exactly_5000_chars_succeeds(self, mock_user):
        """Content exactly 5000 characters succeeds."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": str(uuid4()),
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "x" * 5000},  # Exactly 5000 characters
            )

            assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

    def test_invalid_category_returns_422(self, mock_user):
        """Invalid category value returns validation error."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={
                    "content": "This is valid feedback content.",
                    "category": "invalid_category",
                },
            )

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
        finally:
            app.dependency_overrides.clear()

    def test_whitespace_only_content_returns_422(self, mock_user):
        """Whitespace-only content returns validation error."""
        from app.core.deps import get_current_user

        async def mock_get_current_user():
            return mock_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "          "},  # Whitespace only (10+ chars)
            )

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Context Sanitization Tests
# ============================================================================


class TestContextSanitization:
    """Tests for context field sanitization in FeedbackService."""

    def test_valid_context_fields_preserved(self):
        """Valid context fields are preserved."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        context = {
            "page_url": "https://example.com",
            "feature_used": "match",
            "browser": "Chrome 120",
            "extension_version": "1.0.0",
            "screen_size": "1920x1080",
        }

        result = service._sanitize_context(context)

        assert result is not None
        assert result["page_url"] == "https://example.com"
        assert result["feature_used"] == "match"
        assert result["browser"] == "Chrome 120"
        assert result["extension_version"] == "1.0.0"
        assert result["screen_size"] == "1920x1080"

    def test_unknown_context_fields_stripped(self):
        """Unknown context fields are silently stripped."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        context = {
            "page_url": "https://example.com",
            "secret_token": "should_be_removed",
            "password": "also_removed",
            "unknown_field": "stripped",
        }

        result = service._sanitize_context(context)

        assert result is not None
        assert result["page_url"] == "https://example.com"
        assert "secret_token" not in result
        assert "password" not in result
        assert "unknown_field" not in result

    def test_empty_context_returns_none(self):
        """Empty context returns None."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()

        assert service._sanitize_context({}) is None
        assert service._sanitize_context(None) is None

    def test_context_with_only_unknown_fields_returns_none(self):
        """Context with only unknown fields returns None."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        context = {
            "secret": "value",
            "api_key": "12345",
        }

        result = service._sanitize_context(context)

        assert result is None

    def test_context_with_none_values_stripped(self):
        """Context fields with None values are stripped."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        context = {
            "page_url": "https://example.com",
            "browser": None,
            "feature_used": None,
        }

        result = service._sanitize_context(context)

        assert result is not None
        assert result["page_url"] == "https://example.com"
        assert "browser" not in result
        assert "feature_used" not in result

    def test_context_with_empty_strings_stripped(self):
        """Context fields with empty strings are stripped."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        context = {
            "page_url": "https://example.com",
            "browser": "",
            "feature_used": "",
        }

        result = service._sanitize_context(context)

        assert result is not None
        assert result["page_url"] == "https://example.com"
        assert "browser" not in result
        assert "feature_used" not in result

    def test_context_with_empty_arrays_and_objects_stripped(self):
        """Context fields with empty arrays and objects are stripped."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        context = {
            "page_url": "https://example.com",
            "browser": [],
            "feature_used": {},
        }

        result = service._sanitize_context(context)

        assert result is not None
        assert result["page_url"] == "https://example.com"
        assert "browser" not in result
        assert "feature_used" not in result


# ============================================================================
# Unicode & Special Character Tests
# ============================================================================


class TestUnicodeAndSpecialCharacters:
    """Tests for Unicode and special character handling."""

    def test_unicode_content_succeeds(self, mock_user):
        """Unicode content (emojis) succeeds."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        captured_content = None

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_content
                captured_content = content
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": str(uuid4()),
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "Great feature! 🎉👍 Love it!"},
            )

            assert response.status_code == 200
            assert "🎉" in captured_content
            assert "👍" in captured_content
        finally:
            app.dependency_overrides.clear()

    def test_non_ascii_characters_succeeds(self, mock_user):
        """Non-ASCII characters succeed."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        captured_content = None

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_content
                captured_content = content
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": str(uuid4()),
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "Très bien! 很好! すごい! Отлично!"},
            )

            assert response.status_code == 200
            assert "Très" in captured_content
            assert "很好" in captured_content
            assert "すごい" in captured_content
            assert "Отлично" in captured_content
        finally:
            app.dependency_overrides.clear()

    def test_mixed_content_with_emojis_and_special_chars(self, mock_user):
        """Mixed content with emojis and special characters succeeds."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        async def mock_get_current_user():
            return mock_user

        captured_content = None

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_content
                captured_content = content
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": str(uuid4()),
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={
                    "content": "Feature request: 添加更多选项 🚀 — it would be très utile!"
                },
            )

            assert response.status_code == 200
            assert "添加更多选项" in captured_content
            assert "🚀" in captured_content
            assert "très" in captured_content
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# Service Unit Tests
# ============================================================================


class TestFeedbackServiceUnit:
    """Unit tests for FeedbackService methods."""

    @pytest.mark.asyncio
    async def test_submit_feedback_returns_correct_structure(self):
        """submit_feedback() returns correct structure."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        user_id = str(uuid4())
        feedback_id = str(uuid4())

        with patch.object(service.admin_client, "table") as mock_table:
            mock_response = MagicMock()
            mock_response.data = [{"id": feedback_id}]
            mock_table.return_value.insert.return_value.execute.return_value = mock_response

            result = await service.submit_feedback(
                user_id=user_id,
                content="This is test feedback content.",
                category="general",
                context=None,
            )

            assert result["message"] == "Thank you for your feedback!"
            assert result["feedback_id"] == feedback_id

    @pytest.mark.asyncio
    async def test_submit_feedback_logs_at_info_level(self):
        """submit_feedback() logs at INFO level."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        user_id = str(uuid4())
        feedback_id = str(uuid4())

        with patch.object(service.admin_client, "table") as mock_table:
            mock_response = MagicMock()
            mock_response.data = [{"id": feedback_id}]
            mock_table.return_value.insert.return_value.execute.return_value = mock_response

            with patch("app.services.feedback_service.logger") as mock_logger:
                await service.submit_feedback(
                    user_id=user_id,
                    content="This is test feedback content.",
                    category="bug",
                    context=None,
                )

                mock_logger.info.assert_called_once()
                call_args = mock_logger.info.call_args[0][0]
                assert "FEEDBACK_SUBMITTED" in call_args
                assert "bug" in call_args

    @pytest.mark.asyncio
    async def test_submit_feedback_raises_on_db_failure(self):
        """submit_feedback() raises exception on database failure."""
        from app.services.feedback_service import FeedbackService

        service = FeedbackService()
        user_id = str(uuid4())

        with patch.object(service.admin_client, "table") as mock_table:
            mock_response = MagicMock()
            mock_response.data = None  # Simulate failure
            mock_table.return_value.insert.return_value.execute.return_value = mock_response

            with pytest.raises(Exception) as exc_info:
                await service.submit_feedback(
                    user_id=user_id,
                    content="This is test feedback content.",
                    category="general",
                    context=None,
                )

            assert "Failed to save feedback" in str(exc_info.value)

    def test_database_failure_returns_error_envelope(self):
        """Database failure returns proper error envelope from router."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        mock_user = {"id": str(uuid4()), "email": "test@example.com"}

        async def mock_get_current_user():
            return mock_user

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                raise RuntimeError("Failed to save feedback")

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={"content": "This should fail due to database error."},
            )

            # Should return 500 with error envelope
            assert response.status_code == 500
            data = response.json()
            assert data["success"] is False
            assert "error" in data
        finally:
            app.dependency_overrides.clear()


# ============================================================================
# All Category Types Tests
# ============================================================================


class TestAllFeedbackCategories:
    """Tests for all supported feedback categories."""

    @pytest.mark.parametrize(
        "test_category",
        ["bug", "feature_request", "general", "praise", "complaint"],
    )
    def test_all_valid_categories_succeed(self, test_category):
        """All valid categories succeed."""
        from app.core.deps import get_current_user
        from app.routers.feedback import get_feedback_service

        mock_user = {"id": str(uuid4()), "email": "test@example.com"}

        async def mock_get_current_user():
            return mock_user

        captured_category = None

        class MockFeedbackService:
            async def submit_feedback(self, user_id, content, category, context):
                nonlocal captured_category
                captured_category = category
                return {
                    "message": "Thank you for your feedback!",
                    "feedback_id": str(uuid4()),
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_feedback_service] = lambda: MockFeedbackService()
        client = TestClient(app)

        try:
            response = client.post(
                "/v1/feedback",
                json={
                    "content": f"Testing the {test_category} category.",
                    "category": test_category,
                },
            )

            assert response.status_code == 200
            assert captured_category == test_category
        finally:
            app.dependency_overrides.clear()
