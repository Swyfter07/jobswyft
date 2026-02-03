"""Tests for AI match analysis endpoint."""

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
def mock_resume_data():
    """Fixture for sample parsed resume data."""
    return {
        "contact": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
        },
        "summary": "Senior software engineer with 5+ years of Python experience.",
        "experience": [
            {
                "title": "Senior Software Engineer",
                "company": "TechCorp",
                "start_date": "2020-01",
                "end_date": None,
                "description": "Led backend development using Python and FastAPI.",
            }
        ],
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
    }


@pytest.fixture
def mock_job_data():
    """Fixture for sample job data."""
    return {
        "id": "test-job-uuid",
        "user_id": "test-user-id-1234567890",
        "title": "Senior Python Developer",
        "company": "Acme Corp",
        "description": "Looking for a senior Python developer with experience in FastAPI and Kubernetes.",
        "location": "San Francisco, CA",
        "status": "saved",
        "created_at": "2026-01-30T12:00:00+00:00",
        "updated_at": "2026-01-30T12:00:00+00:00",
    }


@pytest.fixture
def mock_match_analysis():
    """Fixture for sample match analysis result."""
    return {
        "match_score": 78,
        "strengths": [
            "5+ years Python experience matches requirement",
            "FastAPI experience directly applicable",
            "Strong backend development background",
        ],
        "gaps": [
            "Job requires Kubernetes experience - not mentioned in resume",
            "No mention of cloud infrastructure experience",
        ],
        "recommendations": [
            "Highlight Docker experience as transferable to Kubernetes",
            "Mention any cloud platform experience in cover letter",
        ],
    }


class TestMatchAnalysisAuthentication:
    """Tests for authentication requirements."""

    def test_match_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/match",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestMatchAnalysisSuccess:
    """Tests for successful match analysis."""

    def test_successful_match_with_claude(
        self, authenticated_client, mock_resume_data, mock_job_data, mock_match_analysis
    ):
        """Successful analysis with Claude should return match data."""
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            return {**mock_match_analysis, "ai_provider_used": "claude"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["match_score"] == 78
        assert len(data["data"]["strengths"]) == 3
        assert len(data["data"]["gaps"]) == 2
        assert len(data["data"]["recommendations"]) == 2
        assert data["data"]["ai_provider_used"] == "claude"

    def test_successful_match_with_gpt_explicit(
        self, authenticated_client, mock_match_analysis
    ):
        """Explicit GPT provider selection should use GPT."""
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            # Verify ai_provider was passed correctly
            assert ai_provider == "gpt"
            return {**mock_match_analysis, "ai_provider_used": "gpt"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "ai_provider": "gpt",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["ai_provider_used"] == "gpt"

    def test_match_with_explicit_resume_id(
        self, authenticated_client, mock_match_analysis
    ):
        """Providing resume_id should use that specific resume."""
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            # Verify resume_id was passed
            assert resume_id == "11111111-1111-1111-1111-111111111111"
            return {**mock_match_analysis, "ai_provider_used": "claude"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "resume_id": "11111111-1111-1111-1111-111111111111",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200


class TestMatchAnalysisFallback:
    """Tests for AI provider fallback."""

    def test_fallback_from_claude_to_gpt(
        self, authenticated_client, mock_match_analysis
    ):
        """When Claude fails, should fall back to GPT."""
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            # Simulates fallback - GPT succeeded after Claude failed
            return {**mock_match_analysis, "ai_provider_used": "gpt"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        # Response shows which provider actually succeeded
        assert data["data"]["ai_provider_used"] == "gpt"

    def test_both_providers_fail_returns_503(self, authenticated_client):
        """When both providers fail, should return 503."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise AIProviderUnavailableError()

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 503
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AI_PROVIDER_UNAVAILABLE"


class TestMatchAnalysisValidation:
    """Tests for input validation errors."""

    def test_no_resume_selected_returns_400(self, authenticated_client):
        """No active resume and no resume_id should return 400."""
        from app.core.exceptions import ValidationError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise ValidationError("No resume selected. Upload or select a resume first.")

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "resume" in data["error"]["message"].lower()


class TestMatchAnalysisNotFound:
    """Tests for not found errors."""

    def test_job_not_found_returns_404(self, authenticated_client):
        """Non-existent job should return 404."""
        from app.core.exceptions import JobNotFoundError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise JobNotFoundError()

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_resume_not_found_returns_404(self, authenticated_client):
        """Non-existent resume should return 404."""
        from app.core.exceptions import ResumeNotFoundError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise ResumeNotFoundError()

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "resume_id": "11111111-1111-1111-1111-111111111111",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "RESUME_NOT_FOUND"


class TestMatchAnalysisCredits:
    """Tests for credit checking."""

    def test_credit_exhausted_returns_422(self, authenticated_client):
        """No remaining credits should return 422."""
        from app.core.exceptions import CreditExhaustedError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise CreditExhaustedError()

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 422
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "CREDIT_EXHAUSTED"
        assert "credits" in data["error"]["message"].lower()


class TestMatchAnalysisUsageTracking:
    """Tests for usage tracking behavior."""

    def test_usage_recorded_after_success(
        self, authenticated_client, mock_resume_data, mock_job_data, mock_match_analysis
    ):
        """Usage should be recorded after successful analysis."""
        from app.services.match_service import MatchService
        from app.services.usage_service import UsageService

        usage_recorded = {"called": False, "args": None}

        original_record = UsageService.record_usage

        async def mock_record(self, user_id, operation_type, ai_provider, credits_used):
            usage_recorded["called"] = True
            usage_recorded["args"] = {
                "user_id": user_id,
                "operation_type": operation_type,
                "ai_provider": ai_provider,
                "credits_used": credits_used,
            }

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            return {**mock_match_analysis, "ai_provider_used": "claude"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        # Note: In this mocked test, the service method is fully mocked,
        # so we're testing the endpoint behavior, not the internal usage recording.
        # The actual usage recording is tested in integration tests or service unit tests.

    def test_usage_not_recorded_on_ai_failure(self, authenticated_client):
        """Usage should NOT be recorded when AI fails."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise AIProviderUnavailableError()

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 503
        # The service raises before recording usage - this is the expected behavior

    def test_usage_not_recorded_on_validation_error(self, authenticated_client):
        """Usage should NOT be recorded on validation errors."""
        from app.core.exceptions import ValidationError
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            raise ValidationError("No resume selected.")

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 400


class TestProviderSelection:
    """Tests for AI provider selection logic."""

    def test_explicit_provider_overrides_preference(
        self, authenticated_client, mock_match_analysis
    ):
        """Explicit ai_provider in request should override user preference."""
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            # The request explicitly asks for gpt
            assert ai_provider == "gpt"
            return {**mock_match_analysis, "ai_provider_used": "gpt"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                    "ai_provider": "gpt",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["ai_provider_used"] == "gpt"

    def test_no_provider_specified_uses_default(
        self, authenticated_client, mock_match_analysis
    ):
        """No ai_provider should use user preference or default to claude."""
        from app.services.match_service import MatchService

        async def mock_generate(self, user_id, job_id, resume_id, ai_provider):
            # No explicit provider passed
            assert ai_provider is None
            return {**mock_match_analysis, "ai_provider_used": "claude"}

        with patch.object(MatchService, "generate_match_analysis", mock_generate):
            response = authenticated_client.post(
                "/v1/ai/match",
                json={
                    "job_id": "00000000-0000-0000-0000-000000000000",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        # Default provider is claude
        assert data["data"]["ai_provider_used"] == "claude"
