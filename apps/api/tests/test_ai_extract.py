"""Tests for AI job extraction endpoint (POST /v1/ai/extract-job)."""

from unittest.mock import patch

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
def mock_extract_result():
    """Fixture for sample extraction result."""
    return {
        "title": "Senior Software Engineer",
        "company": "Acme Corp",
        "description": "Build scalable distributed systems...",
        "location": "San Francisco, CA",
        "salary": "$150,000 - $200,000/year",
        "employment_type": "Full-time",
    }


class TestExtractJobAuthentication:
    """Tests for authentication requirements."""

    def test_extract_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/extract-job",
            json={
                "html_content": "<div>Job posting</div>",
                "source_url": "https://example.com/job/123",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestExtractJobSuccess:
    """Tests for successful extraction."""

    def test_successful_extraction(
        self, authenticated_client, mock_extract_result
    ):
        """Successful extraction should return job fields."""
        from app.services.extract_job_service import ExtractJobService

        async def mock_extract(self, user_id, html_content, source_url, partial_data):
            return mock_extract_result

        with patch.object(ExtractJobService, "extract_job", mock_extract):
            response = authenticated_client.post(
                "/v1/ai/extract-job",
                json={
                    "html_content": "<div>Job posting content here</div>",
                    "source_url": "https://example.com/job/123",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Senior Software Engineer"
        assert data["data"]["company"] == "Acme Corp"
        assert data["data"]["description"] is not None
        assert data["data"]["location"] == "San Francisco, CA"
        assert data["data"]["salary"] == "$150,000 - $200,000/year"
        assert data["data"]["employment_type"] == "Full-time"

    def test_extraction_with_partial_data(
        self, authenticated_client, mock_extract_result
    ):
        """Extraction with partial_data should pass it through."""
        from app.services.extract_job_service import ExtractJobService

        async def mock_extract(self, user_id, html_content, source_url, partial_data):
            assert partial_data == {"title": "Engineer"}
            return mock_extract_result

        with patch.object(ExtractJobService, "extract_job", mock_extract):
            response = authenticated_client.post(
                "/v1/ai/extract-job",
                json={
                    "html_content": "<div>Job posting</div>",
                    "source_url": "https://example.com/job/123",
                    "partial_data": {"title": "Engineer"},
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200

    def test_extraction_with_null_fields(self, authenticated_client):
        """Extraction returning null fields should be valid."""
        from app.services.extract_job_service import ExtractJobService

        async def mock_extract(self, user_id, html_content, source_url, partial_data):
            return {
                "title": "Engineer",
                "company": "Acme",
                "description": None,
                "location": None,
                "salary": None,
                "employment_type": None,
            }

        with patch.object(ExtractJobService, "extract_job", mock_extract):
            response = authenticated_client.post(
                "/v1/ai/extract-job",
                json={
                    "html_content": "<div>Minimal job page</div>",
                    "source_url": "https://example.com/job/456",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["title"] == "Engineer"
        assert data["data"]["description"] is None


class TestExtractJobRateLimit:
    """Tests for rate limiting."""

    def test_rate_limit_exceeded_returns_429(self, authenticated_client):
        """Exceeding daily limit should return 429."""
        from app.services.extract_job_service import (
            ExtractJobRateLimitError,
            ExtractJobService,
        )

        async def mock_extract(self, user_id, html_content, source_url, partial_data):
            raise ExtractJobRateLimitError()

        with patch.object(ExtractJobService, "extract_job", mock_extract):
            response = authenticated_client.post(
                "/v1/ai/extract-job",
                json={
                    "html_content": "<div>Job posting</div>",
                    "source_url": "https://example.com/job/123",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 429
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "RATE_LIMITED"


class TestExtractJobProviderFailure:
    """Tests for AI provider failure."""

    def test_both_providers_fail_returns_503(self, authenticated_client):
        """When both providers fail, should return 503."""
        from app.core.exceptions import AIProviderUnavailableError
        from app.services.extract_job_service import ExtractJobService

        async def mock_extract(self, user_id, html_content, source_url, partial_data):
            raise AIProviderUnavailableError()

        with patch.object(ExtractJobService, "extract_job", mock_extract):
            response = authenticated_client.post(
                "/v1/ai/extract-job",
                json={
                    "html_content": "<div>Job posting</div>",
                    "source_url": "https://example.com/job/123",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 503
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AI_PROVIDER_UNAVAILABLE"


class TestExtractJobValidation:
    """Tests for input validation."""

    def test_empty_html_returns_422(self, authenticated_client):
        """Empty html_content should fail validation."""
        response = authenticated_client.post(
            "/v1/ai/extract-job",
            json={
                "html_content": "",
                "source_url": "https://example.com/job/123",
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        assert response.status_code == 422

    def test_missing_source_url_returns_422(self, authenticated_client):
        """Missing source_url should fail validation."""
        response = authenticated_client.post(
            "/v1/ai/extract-job",
            json={
                "html_content": "<div>Job posting</div>",
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        assert response.status_code == 422

    def test_html_content_exceeds_max_length_returns_422(self, authenticated_client):
        """HTML content exceeding 8000 chars should fail validation."""
        response = authenticated_client.post(
            "/v1/ai/extract-job",
            json={
                "html_content": "x" * 8001,
                "source_url": "https://example.com/job/123",
            },
            headers={"Authorization": "Bearer valid-token"},
        )
        assert response.status_code == 422

    def test_html_content_at_max_length_succeeds(self, authenticated_client):
        """HTML content at exactly 8000 chars should succeed."""
        from app.services.extract_job_service import ExtractJobService

        async def mock_extract(self, user_id, html_content, source_url, partial_data):
            return {
                "title": "Eng",
                "company": "Co",
                "description": None,
                "location": None,
                "salary": None,
                "employment_type": None,
            }

        with patch.object(ExtractJobService, "extract_job", mock_extract):
            response = authenticated_client.post(
                "/v1/ai/extract-job",
                json={
                    "html_content": "x" * 8000,
                    "source_url": "https://example.com/job/123",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
