"""Tests for AI answer generation endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch

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
def mock_answer_content():
    """Fixture for sample answer content."""
    return "I am drawn to Acme Corp's mission to revolutionize the industry through innovative technology. With my 5 years of experience in backend development and a track record of building scalable systems, I am confident I can contribute meaningfully to your team's goals."


class TestAnswerAuthentication:
    """Tests for authentication requirements."""

    def test_answer_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/answer",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "question": "Why do you want to work at Acme Corp?",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestAnswerSuccess:
    """Tests for successful answer generation."""

    def test_successful_generation_with_claude_default(
        self, authenticated_client, mock_answer_content
    ):
        """Successful generation with Claude and default max_length."""
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            assert kwargs["max_length"] == 500  # Default
            return {
                "content": mock_answer_content,
                "ai_provider_used": "claude",
                "tokens_used": 450,
            }

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work at Acme Corp?",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "content" in data["data"]
        assert data["data"]["ai_provider_used"] == "claude"
        assert data["data"]["tokens_used"] == 450

    def test_successful_generation_with_gpt_explicit(
        self, authenticated_client, mock_answer_content
    ):
        """Explicit GPT provider selection should use GPT."""
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            assert kwargs["ai_provider"] == "gpt"
            return {
                "content": mock_answer_content,
                "ai_provider_used": "gpt",
                "tokens_used": 420,
            }

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work at Acme Corp?",
                    "ai_provider": "gpt",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["ai_provider_used"] == "gpt"


class TestAnswerMaxLength:
    """Tests for different max_length options."""

    @pytest.mark.parametrize("max_length", [150, 300, 500, 1000])
    def test_all_valid_max_lengths(self, authenticated_client, max_length, mock_answer_content):
        """All valid max_length values should be accepted."""
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            assert kwargs["max_length"] == max_length
            return {
                "content": mock_answer_content,
                "ai_provider_used": "claude",
                "tokens_used": 400,
            }

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work here?",
                    "max_length": max_length,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_invalid_max_length_returns_422(self, authenticated_client):
        """Invalid max_length should return 422 (Pydantic validation)."""
        response = authenticated_client.post(
            "/v1/ai/answer",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "question": "Why do you want to work here?",
                "max_length": 250,  # Invalid - not in [150, 300, 500, 1000]
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestAnswerFeedback:
    """Tests for regeneration with feedback."""

    def test_feedback_with_previous_content_works(
        self, authenticated_client, mock_answer_content
    ):
        """Feedback with previous content should regenerate."""
        from app.services.answer_service import AnswerService

        async def mock_generate(self, user_id, job_id, question, resume_id, max_length, feedback, previous_content, ai_provider):
            assert feedback == "Make it more specific about the company's product"
            assert previous_content is not None
            return {
                "content": "Revised answer with specific product mentions...",
                "ai_provider_used": "claude",
                "tokens_used": 480,
            }

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work at Acme Corp?",
                    "feedback": "Make it more specific about the company's product",
                    "previous_content": mock_answer_content,
                },
            )

        assert response.status_code == 200

    def test_feedback_without_previous_content_returns_422(self, authenticated_client):
        """Feedback without previous_content should return 422."""
        response = authenticated_client.post(
            "/v1/ai/answer",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "question": "Why do you want to work at Acme Corp?",
                "feedback": "Make it shorter",
                # Missing previous_content
            },
        )

        assert response.status_code == 422  # Pydantic validation error


class TestAnswerValidation:
    """Tests for input validation."""

    def test_empty_question_returns_422(self, authenticated_client):
        """Empty question should return 422."""
        response = authenticated_client.post(
            "/v1/ai/answer",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "question": "",
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestAnswerErrors:
    """Tests for error conditions."""

    def test_no_resume_selected_returns_400(self, authenticated_client):
        """No resume selected should return 400."""
        from app.core.exceptions import ValidationError
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            raise ValidationError("No resume selected. Upload or select a resume first.")

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work here?",
                },
            )

        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"

    def test_job_not_found_returns_404(self, authenticated_client):
        """Job not found should return 404."""
        from app.core.exceptions import JobNotFoundError
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            raise JobNotFoundError()

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work here?",
                },
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_resume_not_found_returns_404(self, authenticated_client):
        """Resume not found should return 404."""
        from app.core.exceptions import ResumeNotFoundError
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            raise ResumeNotFoundError()

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work here?",
                    "resume_id": "00000000-0000-0000-0000-000000000099",
                },
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "RESUME_NOT_FOUND"

    def test_credit_exhausted_returns_422(self, authenticated_client):
        """No credits should return 422."""
        from app.core.exceptions import CreditExhaustedError
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            raise CreditExhaustedError()

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work here?",
                },
            )

        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "CREDIT_EXHAUSTED"

    def test_ai_provider_unavailable_returns_503(self, authenticated_client):
        """Both AI providers failing should return 503."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.answer_service import AnswerService

        async def mock_generate(self, **kwargs):
            raise AIProviderUnavailableError()

        with patch.object(AnswerService, "generate_answer", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/answer",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "question": "Why do you want to work here?",
                },
            )

        assert response.status_code == 503
        data = response.json()
        assert data["error"]["code"] == "AI_PROVIDER_UNAVAILABLE"


class TestAnswerUsageTracking:
    """Tests for usage tracking."""

    def test_usage_recorded_after_success(self, authenticated_client, mock_answer_content):
        """Usage should be recorded after successful generation."""
        from app.services.answer_service import AnswerService
        from app.services.usage_service import UsageService

        # Track if record_usage was called
        usage_recorded = {"called": False, "operation_type": None}

        original_init = AnswerService.__init__

        def mock_init(self):
            original_init(self)
            self.usage_service = MagicMock(spec=UsageService)
            self.usage_service.check_credits = AsyncMock(return_value=True)

            async def mock_record(user_id, operation_type, ai_provider, credits_used):
                usage_recorded["called"] = True
                usage_recorded["operation_type"] = operation_type

            self.usage_service.record_usage = mock_record
            self._get_user_profile = AsyncMock(return_value={"active_resume_id": "test-id"})
            self.resume_service.get_resume = AsyncMock(return_value={"parsed_data": {"skills": ["Python"]}})
            self.job_service.get_job = AsyncMock(return_value={"description": "Test job"})

        with patch.object(AnswerService, "__init__", mock_init):
            with patch("app.services.answer_service.AIProviderFactory.answer_with_fallback") as mock_ai:
                mock_ai.return_value = (mock_answer_content, 450, "claude")

                response = authenticated_client.post(
                    "/v1/ai/answer",
                    json={
                        "job_id": "00000000-0000-0000-0000-000000000000",
                        "question": "Why do you want to work here?",
                    },
                )

        assert response.status_code == 200
        assert usage_recorded["called"] is True
        assert usage_recorded["operation_type"] == "answer"

    def test_usage_not_recorded_on_ai_failure(self, authenticated_client):
        """Usage should NOT be recorded when AI providers fail."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.answer_service import AnswerService
        from app.services.usage_service import UsageService

        # Track if record_usage was called
        mock_usage_service = MagicMock(spec=UsageService)
        mock_usage_service.check_credits = AsyncMock(return_value=True)
        mock_usage_service.record_usage = AsyncMock()

        # Create service with mocked dependencies
        service = AnswerService()
        service.usage_service = mock_usage_service
        service._get_user_profile = AsyncMock(return_value={"active_resume_id": "test-resume-id"})
        service.resume_service.get_resume = AsyncMock(return_value={"parsed_data": {"skills": ["Python"]}})
        service.job_service.get_job = AsyncMock(return_value={"description": "Test job"})

        # Mock AI factory to raise error
        with patch("app.services.answer_service.AIProviderFactory.answer_with_fallback") as mock_ai:
            mock_ai.side_effect = ValueError("All AI providers failed")

            import asyncio
            with pytest.raises(AIProviderUnavailableError):
                asyncio.get_event_loop().run_until_complete(
                    service.generate_answer(
                        user_id="test-user",
                        job_id="test-job",
                        question="Why do you want to work here?",
                    )
                )

        # Verify record_usage was NOT called
        mock_usage_service.record_usage.assert_not_called()
