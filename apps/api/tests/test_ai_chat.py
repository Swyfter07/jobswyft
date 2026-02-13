"""Tests for AI chat (Career Coach) endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def mock_auth_user():
    """Fixture to mock authentication for testing."""
    return {"id": "test-user-id-1234567890", "email": "test@example.com"}


@pytest.fixture
def authenticated_client(mock_auth_user):
    """Create a test client with mocked authentication."""
    from app.core.deps import get_current_user

    async def mock_get_current_user():
        return mock_auth_user

    app.dependency_overrides[get_current_user] = mock_get_current_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_chat_response():
    """Fixture for sample chat response."""
    return "Based on your resume and the job description, I recommend highlighting your experience with Python."


class TestChatAuthentication:
    """Tests for authentication requirements."""

    def test_chat_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/chat",
            json={
                "message": "How can I improve my resume?",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestChatSuccess:
    """Tests for successful chat interaction."""

    def test_successful_chat_simple(self, authenticated_client, mock_chat_response):
        """Successful chat with just a message."""
        from app.services.coach_service import CoachService

        async def mock_send(self, **kwargs):
            return {
                "message": mock_chat_response,
                "ai_provider_used": "claude",
                "tokens_used": 150,
            }

        with patch.object(CoachService, "send_message", mock_send):
            response = authenticated_client.post(
                "/v1/ai/chat",
                json={
                    "message": "How can I improve my resume?",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["message"] == mock_chat_response
        assert data["data"]["ai_provider_used"] == "claude"

    def test_successful_chat_with_context(self, authenticated_client, mock_chat_response):
        """Successful chat with job and resume context."""
        from app.services.coach_service import CoachService

        async def mock_send(self, **kwargs):
            assert kwargs["job_context"]["title"] == "Software Engineer"
            assert kwargs["resume_context"] == "Skills: Python, FastAPI"
            return {
                "message": mock_chat_response,
                "ai_provider_used": "gpt",
                "tokens_used": 200,
            }

        with patch.object(CoachService, "send_message", mock_send):
            response = authenticated_client.post(
                "/v1/ai/chat",
                json={
                    "message": "Is this job a good fit?",
                    "job_context": {"title": "Software Engineer", "company": "Acme"},
                    "resume_context": "Skills: Python, FastAPI",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_successful_chat_with_history(self, authenticated_client, mock_chat_response):
        """Successful chat with conversation history."""
        from app.services.coach_service import CoachService

        async def mock_send(self, **kwargs):
            assert len(kwargs["history"]) == 2
            assert kwargs["history"][0]["role"] == "user"
            return {
                "message": mock_chat_response,
                "ai_provider_used": "claude",
                "tokens_used": 180,
            }

        with patch.object(CoachService, "send_message", mock_send):
            response = authenticated_client.post(
                "/v1/ai/chat",
                json={
                    "message": "Can you elaborate on that?",
                    "history": [
                        {"role": "user", "content": "How do I apply?"},
                        {"role": "assistant", "content": "You can apply on their website."},
                    ],
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestChatValidation:
    """Tests for input validation."""

    def test_empty_message_returns_422(self, authenticated_client):
        """Empty message should return 422."""
        response = authenticated_client.post(
            "/v1/ai/chat",
            json={
                "message": "",
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestChatErrors:
    """Tests for error conditions."""

    def test_credit_exhausted_returns_422(self, authenticated_client):
        """No credits should return 422."""
        from app.core.exceptions import CreditExhaustedError
        from app.services.coach_service import CoachService

        async def mock_send(self, **kwargs):
            raise CreditExhaustedError()

        with patch.object(CoachService, "send_message", mock_send):
            response = authenticated_client.post(
                "/v1/ai/chat",
                json={
                    "message": "Hello",
                },
            )

        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "CREDIT_EXHAUSTED"

    def test_ai_provider_unavailable_returns_503(self, authenticated_client):
        """Both AI providers failing should return 503."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.coach_service import CoachService

        async def mock_send(self, **kwargs):
            raise AIProviderUnavailableError()

        with patch.object(CoachService, "send_message", mock_send):
            response = authenticated_client.post(
                "/v1/ai/chat",
                json={
                    "message": "Hello",
                },
            )

        assert response.status_code == 503
        data = response.json()
        assert data["error"]["code"] == "AI_PROVIDER_UNAVAILABLE"
