"""Tests for AI outreach message generation endpoints."""

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
def mock_outreach_content():
    """Fixture for sample outreach content."""
    return "Hi Sarah,\n\nI came across the Senior Engineer role at Acme Corp and was impressed by the team's work on scalable infrastructure. With my 5 years of experience building similar systems, I'd love to discuss how I could contribute to your team's goals.\n\nBest regards"


class TestOutreachAuthentication:
    """Tests for authentication requirements."""

    def test_outreach_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/outreach",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "recipient_type": "recruiter",
                "platform": "linkedin",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestOutreachSuccess:
    """Tests for successful outreach generation."""

    def test_successful_generation_with_claude_default(
        self, authenticated_client, mock_outreach_content
    ):
        """Successful generation with Claude."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            return {
                "content": mock_outreach_content,
                "ai_provider_used": "claude",
                "tokens_used": 380,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "content" in data["data"]
        assert data["data"]["ai_provider_used"] == "claude"
        assert data["data"]["tokens_used"] == 380

    def test_successful_generation_with_gpt_explicit(
        self, authenticated_client, mock_outreach_content
    ):
        """Explicit GPT provider selection should use GPT."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            assert kwargs["ai_provider"] == "gpt"
            return {
                "content": mock_outreach_content,
                "ai_provider_used": "gpt",
                "tokens_used": 350,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "email",
                    "ai_provider": "gpt",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["ai_provider_used"] == "gpt"


class TestOutreachRecipientTypes:
    """Tests for different recipient types."""

    @pytest.mark.parametrize("recipient_type", ["recruiter", "hiring_manager", "referral"])
    def test_all_valid_recipient_types(self, authenticated_client, recipient_type, mock_outreach_content):
        """All valid recipient types should be accepted."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            assert kwargs["recipient_type"] == recipient_type
            return {
                "content": mock_outreach_content,
                "ai_provider_used": "claude",
                "tokens_used": 400,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": recipient_type,
                    "platform": "linkedin",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_invalid_recipient_type_returns_422(self, authenticated_client):
        """Invalid recipient_type should return 422 (Pydantic validation)."""
        response = authenticated_client.post(
            "/v1/ai/outreach",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "recipient_type": "ceo",  # Invalid
                "platform": "linkedin",
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestOutreachPlatforms:
    """Tests for different platforms."""

    @pytest.mark.parametrize("platform", ["linkedin", "email", "twitter"])
    def test_all_valid_platforms(self, authenticated_client, platform, mock_outreach_content):
        """All valid platforms should be accepted."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            assert kwargs["platform"] == platform
            return {
                "content": mock_outreach_content,
                "ai_provider_used": "claude",
                "tokens_used": 400,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": platform,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_invalid_platform_returns_422(self, authenticated_client):
        """Invalid platform should return 422 (Pydantic validation)."""
        response = authenticated_client.post(
            "/v1/ai/outreach",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "recipient_type": "recruiter",
                "platform": "facebook",  # Invalid
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestOutreachRecipientName:
    """Tests for recipient name handling."""

    def test_with_recipient_name_includes_personalized_greeting(
        self, authenticated_client
    ):
        """Message with recipient_name should include personalized greeting."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, user_id, job_id, recipient_type, platform, resume_id, recipient_name, feedback, previous_content, ai_provider):
            assert recipient_name == "Sarah Chen"
            return {
                "content": "Hi Sarah,\n\nI noticed the Senior Engineer role...",
                "ai_provider_used": "claude",
                "tokens_used": 280,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                    "recipient_name": "Sarah Chen",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "content" in data["data"]

    def test_without_recipient_name_no_placeholder(self, authenticated_client):
        """Message without recipient_name should not have placeholder."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, user_id, job_id, recipient_type, platform, resume_id, recipient_name, feedback, previous_content, ai_provider):
            assert recipient_name is None
            # Simulating AI response without placeholder
            return {
                "content": "I noticed the Senior Engineer role at Acme Corp...",
                "ai_provider_used": "claude",
                "tokens_used": 250,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                    # No recipient_name
                },
            )

        assert response.status_code == 200
        data = response.json()
        content = data["data"]["content"]
        # Verify no placeholder text
        assert "[Name]" not in content
        assert "Hi there" not in content


class TestOutreachFeedback:
    """Tests for regeneration with feedback."""

    def test_feedback_with_previous_content_works(
        self, authenticated_client, mock_outreach_content
    ):
        """Feedback with previous content should regenerate."""
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, user_id, job_id, recipient_type, platform, resume_id, recipient_name, feedback, previous_content, ai_provider):
            assert feedback == "Make it shorter and mention my cloud experience"
            assert previous_content is not None
            return {
                "content": "Shorter revised message...",
                "ai_provider_used": "claude",
                "tokens_used": 200,
            }

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "hiring_manager",
                    "platform": "email",
                    "feedback": "Make it shorter and mention my cloud experience",
                    "previous_content": mock_outreach_content,
                },
            )

        assert response.status_code == 200

    def test_feedback_without_previous_content_returns_422(self, authenticated_client):
        """Feedback without previous_content should return 422."""
        response = authenticated_client.post(
            "/v1/ai/outreach",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "recipient_type": "recruiter",
                "platform": "linkedin",
                "feedback": "Make it shorter",
                # Missing previous_content
            },
        )

        assert response.status_code == 422  # Pydantic validation error


class TestOutreachErrors:
    """Tests for error conditions."""

    def test_no_resume_selected_returns_400(self, authenticated_client):
        """No resume selected should return 400."""
        from app.core.exceptions import ValidationError
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            raise ValidationError("No resume selected. Upload or select a resume first.")

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                },
            )

        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"

    def test_job_not_found_returns_404(self, authenticated_client):
        """Job not found should return 404."""
        from app.core.exceptions import JobNotFoundError
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            raise JobNotFoundError()

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                },
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_resume_not_found_returns_404(self, authenticated_client):
        """Resume not found should return 404."""
        from app.core.exceptions import ResumeNotFoundError
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            raise ResumeNotFoundError()

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                    "resume_id": "00000000-0000-0000-0000-000000000099",
                },
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "RESUME_NOT_FOUND"

    def test_credit_exhausted_returns_422(self, authenticated_client):
        """No credits should return 422."""
        from app.core.exceptions import CreditExhaustedError
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            raise CreditExhaustedError()

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                },
            )

        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "CREDIT_EXHAUSTED"

    def test_ai_provider_unavailable_returns_503(self, authenticated_client):
        """Both AI providers failing should return 503."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.outreach_service import OutreachService

        async def mock_generate(self, **kwargs):
            raise AIProviderUnavailableError()

        with patch.object(OutreachService, "generate_outreach", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/outreach",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "recipient_type": "recruiter",
                    "platform": "linkedin",
                },
            )

        assert response.status_code == 503
        data = response.json()
        assert data["error"]["code"] == "AI_PROVIDER_UNAVAILABLE"


class TestOutreachUsageTracking:
    """Tests for usage tracking."""

    def test_usage_recorded_after_success(self, authenticated_client, mock_outreach_content):
        """Usage should be recorded after successful generation."""
        from app.services.outreach_service import OutreachService
        from app.services.usage_service import UsageService

        # Track if record_usage was called
        usage_recorded = {"called": False, "operation_type": None}

        original_init = OutreachService.__init__

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

        with patch.object(OutreachService, "__init__", mock_init):
            with patch("app.services.outreach_service.AIProviderFactory.outreach_with_fallback") as mock_ai:
                mock_ai.return_value = (mock_outreach_content, 380, "claude")

                response = authenticated_client.post(
                    "/v1/ai/outreach",
                    json={
                        "job_id": "00000000-0000-0000-0000-000000000000",
                        "recipient_type": "recruiter",
                        "platform": "linkedin",
                    },
                )

        assert response.status_code == 200
        assert usage_recorded["called"] is True
        assert usage_recorded["operation_type"] == "outreach"

    def test_usage_not_recorded_on_ai_failure(self, authenticated_client):
        """Usage should NOT be recorded when AI providers fail."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.outreach_service import OutreachService
        from app.services.usage_service import UsageService

        # Track if record_usage was called
        mock_usage_service = MagicMock(spec=UsageService)
        mock_usage_service.check_credits = AsyncMock(return_value=True)
        mock_usage_service.record_usage = AsyncMock()

        # Create service with mocked dependencies
        service = OutreachService()
        service.usage_service = mock_usage_service
        service._get_user_profile = AsyncMock(return_value={"active_resume_id": "test-resume-id"})
        service.resume_service.get_resume = AsyncMock(return_value={"parsed_data": {"skills": ["Python"]}})
        service.job_service.get_job = AsyncMock(return_value={"description": "Test job"})

        # Mock AI factory to raise error
        with patch("app.services.outreach_service.AIProviderFactory.outreach_with_fallback") as mock_ai:
            mock_ai.side_effect = ValueError("All AI providers failed")

            import asyncio
            with pytest.raises(AIProviderUnavailableError):
                asyncio.get_event_loop().run_until_complete(
                    service.generate_outreach(
                        user_id="test-user",
                        job_id="test-job",
                        recipient_type="recruiter",
                        platform="linkedin",
                    )
                )

        # Verify record_usage was NOT called
        mock_usage_service.record_usage.assert_not_called()
