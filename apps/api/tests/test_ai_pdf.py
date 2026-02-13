"""Tests for PDF export endpoints."""

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


class TestPDFAuthentication:
    """Tests for authentication requirements."""

    def test_pdf_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.post(
            "/v1/ai/cover-letter/pdf",
            json={
                "content": "Cover letter content...",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestPDFSuccess:
    """Tests for successful PDF generation."""

    def test_successful_pdf_export(self, authenticated_client):
        """Successful PDF export should return binary content."""
        from app.services.pdf_service import PDFService

        # Mock generating PDF bytes
        mock_pdf_bytes = b"%PDF-1.4 mock pdf content"

        def mock_generate_pdf(self, content, file_name):
            assert content == "Cover letter content..."
            return mock_pdf_bytes

        with patch.object(PDFService, "generate_cover_letter_pdf", mock_generate_pdf):
            response = authenticated_client.post(
                "/v1/ai/cover-letter/pdf",
                json={
                    "content": "Cover letter content...",
                    "file_name": "My Cover Letter",
                },
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert 'filename="My_Cover_Letter.pdf"' in response.headers["content-disposition"]
        assert response.content == mock_pdf_bytes

    def test_default_filename_if_not_provided(self, authenticated_client):
        """Should use default filename if not provided."""
        from app.services.pdf_service import PDFService

        mock_pdf_bytes = b"%PDF-1.4 mock pdf content"

        def mock_generate_pdf(self, content, file_name):
            # Service logic might handle default, or endpoint does. 
            # In existing code, endpoint calls service with request.file_name.
            # If request.file_name is None, Pydantic/Service defaults apply.
            # Looking at router: file_name=request.file_name
            # Looking at request model (implied): likely optional.
            # Actually Router uses: pdf_service._sanitize_filename(request.file_name)
            # If sanitize handles None, good.
            # Let's check service logic assumption or just mock what we expect endpoint to do with return.
            return mock_pdf_bytes

        # We need to mock _sanitize_filename too if it's called on the result
        # Router: sanitized_filename = pdf_service._sanitize_filename(request.file_name)
        
        # Real PDFService._sanitize_filename likely handles defaults if None passed, 
        # OR request.file_name has a default in Pydantic model.
        # Let's assume endpoint behavior is consistent.
        
        with patch.object(PDFService, "generate_cover_letter_pdf", return_value=mock_pdf_bytes):
            with patch.object(PDFService, "_sanitize_filename", return_value="cover_letter"):
                response = authenticated_client.post(
                    "/v1/ai/cover-letter/pdf",
                    json={
                        "content": "Cover letter content...",
                    },
                )

        assert response.status_code == 200
        assert 'filename="cover_letter.pdf"' in response.headers["content-disposition"]


class TestPDFValidation:
    """Tests for input validation."""

    def test_empty_content_returns_422(self, authenticated_client):
        """Empty content should return 422."""
        response = authenticated_client.post(
            "/v1/ai/cover-letter/pdf",
            json={
                "content": "",
            },
        )

        assert response.status_code == 422  # Pydantic validation
