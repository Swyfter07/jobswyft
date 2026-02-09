"""Tests for AI job extraction endpoint (POST /v1/ai/extract-job)."""

import json
from types import SimpleNamespace
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


class TestExtractJobServiceUnit:
    """Unit tests for ExtractJobService internals — exercises real service logic."""

    @pytest.mark.asyncio
    async def test_call_provider_claude_returns_text(self):
        """_call_provider should extract text from Claude response."""
        from app.services.ai.claude import ClaudeProvider
        from app.services.extract_job_service import ExtractJobService

        mock_provider = MagicMock(spec=ClaudeProvider)
        mock_provider.model = "test-model"
        mock_response = SimpleNamespace(
            content=[SimpleNamespace(text='{"title": "Engineer", "company": "Acme"}')]
        )
        mock_provider.client = MagicMock()
        mock_provider.client.messages = MagicMock()
        mock_provider.client.messages.create = AsyncMock(return_value=mock_response)

        result = await ExtractJobService._call_provider(mock_provider, "test prompt")
        parsed = json.loads(result)
        assert parsed["title"] == "Engineer"
        assert parsed["company"] == "Acme"

    @pytest.mark.asyncio
    async def test_call_provider_claude_empty_response_raises(self):
        """_call_provider should raise on empty Claude response."""
        from app.services.ai.claude import ClaudeProvider
        from app.services.extract_job_service import ExtractJobService

        mock_provider = MagicMock(spec=ClaudeProvider)
        mock_provider.model = "test-model"
        mock_response = SimpleNamespace(content=[])
        mock_provider.client = MagicMock()
        mock_provider.client.messages = MagicMock()
        mock_provider.client.messages.create = AsyncMock(return_value=mock_response)

        with pytest.raises(ValueError, match="empty response"):
            await ExtractJobService._call_provider(mock_provider, "test prompt")

    @pytest.mark.asyncio
    async def test_call_provider_openai_returns_text(self):
        """_call_provider should extract text from OpenAI response."""
        from app.services.ai.openai import OpenAIProvider
        from app.services.extract_job_service import ExtractJobService

        mock_provider = MagicMock(spec=OpenAIProvider)
        mock_provider.model = "test-model"
        mock_choice = SimpleNamespace(
            message=SimpleNamespace(content='{"title": "Dev", "company": "Co"}')
        )
        mock_response = SimpleNamespace(choices=[mock_choice])
        mock_provider.client = MagicMock()
        mock_provider.client.chat = MagicMock()
        mock_provider.client.chat.completions = MagicMock()
        mock_provider.client.chat.completions.create = AsyncMock(return_value=mock_response)

        result = await ExtractJobService._call_provider(mock_provider, "test prompt")
        parsed = json.loads(result)
        assert parsed["title"] == "Dev"

    @pytest.mark.asyncio
    async def test_call_provider_openai_empty_response_raises(self):
        """_call_provider should raise on empty OpenAI response."""
        from app.services.ai.openai import OpenAIProvider
        from app.services.extract_job_service import ExtractJobService

        mock_provider = MagicMock(spec=OpenAIProvider)
        mock_provider.model = "test-model"
        mock_choice = SimpleNamespace(message=SimpleNamespace(content=None))
        mock_response = SimpleNamespace(choices=[mock_choice])
        mock_provider.client = MagicMock()
        mock_provider.client.chat = MagicMock()
        mock_provider.client.chat.completions = MagicMock()
        mock_provider.client.chat.completions.create = AsyncMock(return_value=mock_response)

        with pytest.raises(ValueError, match="empty response"):
            await ExtractJobService._call_provider(mock_provider, "test prompt")

    @pytest.mark.asyncio
    async def test_extract_job_filters_response_fields(self):
        """extract_job should only return the 6 expected fields."""
        from app.services.extract_job_service import ExtractJobService

        service = ExtractJobService.__new__(ExtractJobService)
        service.admin_client = MagicMock()
        service._check_daily_limit = AsyncMock()
        service._record_extraction = AsyncMock()

        llm_response = json.dumps({
            "title": "Eng", "company": "Co", "description": "Desc",
            "location": "NY", "salary": "100k", "employment_type": "FT",
            "hacker_field": "should_not_appear", "ssn": "000-00-0000",
        })

        with patch.object(
            ExtractJobService, "_call_provider", new_callable=AsyncMock, return_value=llm_response
        ), patch("app.services.extract_job_service.AIProviderFactory") as mock_factory:
            mock_factory.get_claude_provider.return_value = MagicMock(name="claude")
            mock_factory.get_openai_provider.return_value = None
            result = await service.extract_job("user-id", "<html>page</html>", "https://x.com")

        assert set(result.keys()) == {"title", "company", "description", "location", "salary", "employment_type"}
        assert "hacker_field" not in result
        assert "ssn" not in result

    @pytest.mark.asyncio
    async def test_extract_job_malformed_json_falls_to_next_provider(self):
        """Malformed JSON from primary should fallback to secondary provider."""
        from app.services.extract_job_service import ExtractJobService

        service = ExtractJobService.__new__(ExtractJobService)
        service.admin_client = MagicMock()
        service._check_daily_limit = AsyncMock()
        service._record_extraction = AsyncMock()

        call_count = 0

        async def mock_call(provider, prompt):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return "NOT VALID JSON {{"
            return '{"title": "Fallback", "company": "Co"}'

        with patch.object(
            ExtractJobService, "_call_provider", side_effect=mock_call
        ), patch("app.services.extract_job_service.AIProviderFactory") as mock_factory:
            mock_factory.get_claude_provider.return_value = MagicMock(name="claude")
            mock_factory.get_openai_provider.return_value = MagicMock(name="openai")
            result = await service.extract_job("user-id", "<html>x</html>", "https://x.com")

        assert result["title"] == "Fallback"
        assert call_count == 2
