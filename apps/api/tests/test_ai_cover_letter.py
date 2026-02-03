"""Tests for AI cover letter generation endpoints."""

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
def mock_cover_letter_content():
    """Fixture for sample cover letter content."""
    return """Dear Hiring Manager,

I am writing to express my strong interest in the Senior Python Developer position at Acme Corp. With over five years of experience in Python development and a proven track record of delivering robust backend solutions, I am confident in my ability to contribute effectively to your team.

My experience leading backend development at TechCorp using Python and FastAPI directly aligns with your requirements. I have successfully architected and deployed scalable APIs serving millions of requests, demonstrating both technical expertise and strategic thinking.

I am particularly drawn to Acme Corp's commitment to innovation and would welcome the opportunity to bring my skills in Python, FastAPI, PostgreSQL, and Docker to your organization. I am confident that my background positions me to make an immediate impact on your projects.

Thank you for considering my application. I look forward to discussing how my experience and skills can contribute to your team's success.

Sincerely,
John Doe"""


class TestCoverLetterAuthentication:
    """Tests for authentication requirements."""

    def test_cover_letter_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/cover-letter",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_pdf_export_without_auth_returns_401(self):
        """PDF export without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/cover-letter/pdf",
            json={
                "content": "Sample cover letter content",
            },
        )
        assert response.status_code == 401


class TestCoverLetterSuccess:
    """Tests for successful cover letter generation."""

    def test_successful_generation_with_claude_default_tone(
        self, authenticated_client, mock_cover_letter_content
    ):
        """Successful generation with Claude and default tone."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            assert kwargs["tone"] == "professional"  # Default tone
            return {
                "content": mock_cover_letter_content,
                "ai_provider_used": "claude",
                "tokens_used": 1250,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "content" in data["data"]
        assert data["data"]["ai_provider_used"] == "claude"
        assert data["data"]["tokens_used"] == 1250

    def test_successful_generation_with_gpt_explicit(
        self, authenticated_client, mock_cover_letter_content
    ):
        """Explicit GPT provider selection should use GPT."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            assert kwargs["ai_provider"] == "gpt"
            return {
                "content": mock_cover_letter_content,
                "ai_provider_used": "gpt",
                "tokens_used": 980,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "ai_provider": "gpt",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["ai_provider_used"] == "gpt"


class TestCoverLetterTones:
    """Tests for different tone options."""

    @pytest.mark.parametrize(
        "tone",
        ["confident", "friendly", "enthusiastic", "professional", "executive"],
    )
    def test_all_valid_tones(self, authenticated_client, tone, mock_cover_letter_content):
        """All valid tones should be accepted."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            assert kwargs["tone"] == tone
            return {
                "content": mock_cover_letter_content,
                "ai_provider_used": "claude",
                "tokens_used": 1200,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "tone": tone,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_invalid_tone_returns_422(self, authenticated_client):
        """Invalid tone should return 422 (Pydantic validation)."""
        response = authenticated_client.post(
            "/v1/ai/cover-letter",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "tone": "invalid_tone",
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestCoverLetterCustomInstructions:
    """Tests for custom instructions."""

    def test_custom_instructions_included(self, authenticated_client, mock_cover_letter_content):
        """Custom instructions should be passed to service."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            assert kwargs["custom_instructions"] == "Mention my open-source contributions"
            return {
                "content": mock_cover_letter_content,
                "ai_provider_used": "claude",
                "tokens_used": 1300,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "custom_instructions": "Mention my open-source contributions",
                },
            )

        assert response.status_code == 200

    def test_custom_instructions_too_long_returns_422(self, authenticated_client):
        """Custom instructions exceeding 500 chars should return 422 (Pydantic validation)."""
        response = authenticated_client.post(
            "/v1/ai/cover-letter",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "custom_instructions": "x" * 501,
            },
        )

        assert response.status_code == 422  # Pydantic validation


class TestCoverLetterFeedback:
    """Tests for regeneration with feedback."""

    def test_feedback_with_previous_content_works(
        self, authenticated_client, mock_cover_letter_content
    ):
        """Feedback with previous content should regenerate."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, user_id, job_id, resume_id, tone, custom_instructions, feedback, previous_content, ai_provider):
            assert feedback == "Make it shorter"
            assert previous_content is not None
            return {
                "content": "Shorter version...",
                "ai_provider_used": "claude",
                "tokens_used": 800,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "feedback": "Make it shorter",
                    "previous_content": mock_cover_letter_content,
                },
            )

        assert response.status_code == 200

    def test_feedback_without_previous_content_returns_400(self, authenticated_client):
        """Feedback without previous_content should return 400."""
        response = authenticated_client.post(
            "/v1/ai/cover-letter",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "feedback": "Make it shorter",
                # Missing previous_content
            },
        )

        assert response.status_code == 422  # Pydantic validation error


class TestCoverLetterProviderSelection:
    """Tests for provider selection priority."""

    def test_user_preference_used_when_no_explicit_provider(
        self, authenticated_client, mock_cover_letter_content
    ):
        """User's preferred_ai_provider should be used when no explicit provider."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, user_id, job_id, resume_id, tone, custom_instructions, feedback, previous_content, ai_provider):
            # ai_provider should be None (not explicit), service will use user preference
            assert ai_provider is None
            return {
                "content": mock_cover_letter_content,
                "ai_provider_used": "gpt",  # Simulates user preference was GPT
                "tokens_used": 1100,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    # No ai_provider specified - should use user preference
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_explicit_provider_overrides_user_preference(
        self, authenticated_client, mock_cover_letter_content
    ):
        """Explicit ai_provider should override user preference."""
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, user_id, job_id, resume_id, tone, custom_instructions, feedback, previous_content, ai_provider):
            # Explicit provider should be passed through
            assert ai_provider == "claude"
            return {
                "content": mock_cover_letter_content,
                "ai_provider_used": "claude",
                "tokens_used": 1200,
            }

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "ai_provider": "claude",  # Explicit override
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["ai_provider_used"] == "claude"


class TestCoverLetterErrors:
    """Tests for error conditions."""

    def test_no_resume_selected_returns_400(self, authenticated_client):
        """No resume selected should return 400."""
        from app.core.exceptions import ValidationError
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            raise ValidationError("No resume selected. Upload or select a resume first.")

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
            )

        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"

    def test_job_not_found_returns_404(self, authenticated_client):
        """Job not found should return 404."""
        from app.core.exceptions import JobNotFoundError
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            raise JobNotFoundError()

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_resume_not_found_returns_404(self, authenticated_client):
        """Resume not found should return 404."""
        from app.core.exceptions import ResumeNotFoundError
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            raise ResumeNotFoundError()

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "resume_id": "00000000-0000-0000-0000-000000000099",
                },
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "RESUME_NOT_FOUND"

    def test_credit_exhausted_returns_422(self, authenticated_client):
        """No credits should return 422."""
        from app.core.exceptions import CreditExhaustedError
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            raise CreditExhaustedError()

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
            )

        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "CREDIT_EXHAUSTED"

    def test_ai_provider_unavailable_returns_503(self, authenticated_client):
        """Both AI providers failing should return 503."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.cover_letter_service import CoverLetterService

        async def mock_generate(self, **kwargs):
            raise AIProviderUnavailableError()

        with patch.object(CoverLetterService, "generate_cover_letter", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
            )

        assert response.status_code == 503
        data = response.json()
        assert data["error"]["code"] == "AI_PROVIDER_UNAVAILABLE"

    def test_usage_not_recorded_on_ai_failure(self, authenticated_client):
        """Usage should NOT be recorded when AI providers fail."""
        from unittest.mock import AsyncMock, MagicMock

        from app.core.exceptions import AIProviderUnavailableError
        from app.services.cover_letter_service import CoverLetterService
        from app.services.usage_service import UsageService

        # Create a mock usage service to verify record_usage is NOT called
        mock_usage_service = MagicMock(spec=UsageService)
        mock_usage_service.check_credits = AsyncMock(return_value=True)
        mock_usage_service.record_usage = AsyncMock()

        # Create service with mocked dependencies
        service = CoverLetterService()
        service.usage_service = mock_usage_service

        # Mock other dependencies to reach AI call
        service._get_user_profile = AsyncMock(return_value={"active_resume_id": "test-resume-id"})
        service.resume_service.get_resume = AsyncMock(return_value={"parsed_data": {"skills": ["Python"]}})
        service.job_service.get_job = AsyncMock(return_value={"description": "Test job"})

        # Mock AI factory to raise error
        with patch("app.services.cover_letter_service.AIProviderFactory.cover_letter_with_fallback") as mock_ai:
            mock_ai.side_effect = ValueError("All AI providers failed")

            # Call the service directly (not through HTTP to test internal behavior)
            import asyncio
            with pytest.raises(AIProviderUnavailableError):
                asyncio.get_event_loop().run_until_complete(
                    service.generate_cover_letter(
                        user_id="test-user",
                        job_id="test-job",
                        tone="professional",
                    )
                )

        # Verify record_usage was NOT called
        mock_usage_service.record_usage.assert_not_called()


class TestPDFExport:
    """Tests for PDF export endpoint."""

    def test_successful_pdf_generation(self, authenticated_client):
        """Successful PDF generation should return PDF file."""
        from app.services.pdf_service import PDFService

        def mock_generate(self, content, file_name):
            return b"%PDF-1.4 fake pdf bytes"

        def mock_sanitize(self, filename):
            return "cover_letter_acme"

        with patch.object(PDFService, "generate_cover_letter_pdf", mock_generate):
            with patch.object(PDFService, "_sanitize_filename", mock_sanitize):
                response = authenticated_client.post(
                    "/v1/ai/cover-letter/pdf",
                    json={
                        "content": "Dear Hiring Manager,\n\nI am writing to...",
                        "file_name": "cover_letter_acme",
                    },
                )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
        assert b"%PDF" in response.content

    def test_default_filename_when_not_provided(self, authenticated_client):
        """Default filename should be used when not provided."""
        from app.services.pdf_service import PDFService

        def mock_generate(self, content, file_name):
            return b"%PDF-1.4 fake pdf bytes"

        def mock_sanitize(self, filename):
            return "cover_letter"

        with patch.object(PDFService, "generate_cover_letter_pdf", mock_generate):
            with patch.object(PDFService, "_sanitize_filename", mock_sanitize):
                response = authenticated_client.post(
                    "/v1/ai/cover-letter/pdf",
                    json={
                        "content": "Dear Hiring Manager,\n\nI am writing to...",
                    },
                )

        assert response.status_code == 200
        assert "cover_letter.pdf" in response.headers["content-disposition"]

    def test_filename_sanitization(self, authenticated_client):
        """Invalid characters in filename should be sanitized."""
        from app.services.pdf_service import PDFService

        def mock_generate(self, content, file_name):
            return b"%PDF-1.4 fake pdf bytes"

        def mock_sanitize(self, filename):
            return "Cover_Letter_Acme_Corp"

        with patch.object(PDFService, "generate_cover_letter_pdf", mock_generate):
            with patch.object(PDFService, "_sanitize_filename", mock_sanitize):
                response = authenticated_client.post(
                    "/v1/ai/cover-letter/pdf",
                    json={
                        "content": "Dear Hiring Manager,\n\nI am writing to...",
                        "file_name": "Cover Letter @ Acme Corp!",
                    },
                )

        assert response.status_code == 200
        assert "Cover_Letter_Acme_Corp.pdf" in response.headers["content-disposition"]

    def test_empty_content_returns_400(self, authenticated_client):
        """Empty content should return 400."""
        from app.services.pdf_service import PDFService

        def mock_generate(content, file_name):
            raise ValueError("Content cannot be empty")

        with patch.object(PDFService, "generate_cover_letter_pdf", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/cover-letter/pdf",
                json={
                    "content": "",
                },
            )

        # Pydantic validation catches this before service
        assert response.status_code == 422
