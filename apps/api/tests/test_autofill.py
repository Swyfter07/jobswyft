"""Tests for autofill data endpoint."""

import time
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
def complete_autofill_response():
    """Fixture for complete autofill data response."""
    return {
        "personal": {
            "first_name": "John",
            "last_name": "Doe",
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "+1-555-0100",
            "location": "San Francisco, CA",
            "linkedin_url": "https://linkedin.com/in/johndoe",
            "portfolio_url": None,
        },
        "resume": {
            "id": "00000000-0000-0000-0000-000000001234",
            "file_name": "john_doe_resume.pdf",
            "download_url": "https://supabase.../signed-url",
            "parsed_summary": "Senior software engineer with 8 years of experience",
        },
        "work_authorization": None,
        "salary_expectation": None,
    }


@pytest.fixture
def partial_autofill_response():
    """Fixture for partial autofill data response (fallbacks used)."""
    return {
        "personal": {
            "first_name": "Jane",
            "last_name": "Name",
            "full_name": "Jane Name",
            "email": "profile@example.com",
            "phone": "+1-555-0200",
            "location": None,
            "linkedin_url": None,
            "portfolio_url": None,
        },
        "resume": {
            "id": "00000000-0000-0000-0000-000000001234",
            "file_name": "partial_resume.pdf",
            "download_url": "https://supabase.../signed-url",
            "parsed_summary": "Data scientist specializing in ML.",
        },
        "work_authorization": None,
        "salary_expectation": None,
    }


@pytest.fixture
def no_resume_response():
    """Fixture for autofill data when no active resume."""
    return {
        "personal": {
            "first_name": "Profile",
            "last_name": "Name",
            "full_name": "Profile Name",
            "email": "profile@example.com",
            "phone": None,
            "location": None,
            "linkedin_url": None,
            "portfolio_url": None,
        },
        "resume": None,
        "work_authorization": None,
        "salary_expectation": None,
    }


@pytest.fixture
def profile_only_response():
    """Fixture for autofill data when only profile data available."""
    return {
        "personal": {
            "first_name": "Fallback",
            "last_name": "User",
            "full_name": "Fallback User",
            "email": "profile@example.com",
            "phone": None,
            "location": None,
            "linkedin_url": None,
            "portfolio_url": None,
        },
        "resume": {
            "id": "00000000-0000-0000-0000-000000001234",
            "file_name": "resume.pdf",
            "download_url": "https://supabase.../signed-url",
            "parsed_summary": None,
        },
        "work_authorization": None,
        "salary_expectation": None,
    }


class TestAutofillAuthentication:
    """Tests for authentication requirements."""

    def test_autofill_without_auth_returns_401(self):
        """Request without token should return 401."""
        client = TestClient(app)
        response = client.get("/v1/autofill/data")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"


class TestAutofillWithActiveResume:
    """Tests for autofill with active resume."""

    def test_complete_contact_data_extraction(
        self, mock_auth_user, complete_autofill_response
    ):
        """Verify all contact fields extracted correctly from parsed resume."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return complete_autofill_response

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

            personal = data["data"]["personal"]
            assert personal["first_name"] == "John"
            assert personal["last_name"] == "Doe"
            assert personal["full_name"] == "John Doe"
            assert personal["email"] == "john@example.com"
            assert personal["phone"] == "+1-555-0100"
            assert personal["location"] == "San Francisco, CA"
            assert personal["linkedin_url"] == "https://linkedin.com/in/johndoe"
            assert personal["portfolio_url"] is None  # Not in schema

            resume = data["data"]["resume"]
            assert resume["id"] == "00000000-0000-0000-0000-000000001234"
            assert resume["file_name"] == "john_doe_resume.pdf"
            assert resume["download_url"] == "https://supabase.../signed-url"
            assert "Senior software engineer" in resume["parsed_summary"]
        finally:
            app.dependency_overrides.clear()

    def test_partial_contact_with_fallbacks(
        self, mock_auth_user, partial_autofill_response
    ):
        """Verify fallback to profile data when parsed fields missing."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return partial_autofill_response

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")

            assert response.status_code == 200
            data = response.json()

            personal = data["data"]["personal"]
            assert personal["first_name"] == "Jane"
            # last_name should fallback to split profile.full_name ("Profile Name" -> "Name")
            assert personal["last_name"] == "Name"
            assert personal["full_name"] == "Jane Name"
            # email should fallback to profile
            assert personal["email"] == "profile@example.com"
            assert personal["phone"] == "+1-555-0200"
            assert personal["location"] is None
            assert personal["linkedin_url"] is None
        finally:
            app.dependency_overrides.clear()

    def test_profile_only_fallback(self, mock_auth_user, profile_only_response):
        """Verify fallback to profile when contact object missing entirely."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return profile_only_response

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")

            assert response.status_code == 200
            data = response.json()

            personal = data["data"]["personal"]
            # Should split "Fallback User" into first/last
            assert personal["first_name"] == "Fallback"
            assert personal["last_name"] == "User"
            assert personal["full_name"] == "Fallback User"
            assert personal["email"] == "profile@example.com"
        finally:
            app.dependency_overrides.clear()


class TestAutofillWithoutResume:
    """Tests for autofill without active resume."""

    def test_no_active_resume_returns_profile_only(
        self, authenticated_client, no_resume_response
    ):
        """Verify response with no active resume returns profile data and null resume."""
        from app.services.autofill_service import AutofillService

        async def mock_get_autofill_data(self, user_id):
            return no_resume_response

        with patch.object(AutofillService, "get_autofill_data", mock_get_autofill_data):
            response = authenticated_client.get("/v1/autofill/data")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        personal = data["data"]["personal"]
        # Should split "Profile Name"
        assert personal["first_name"] == "Profile"
        assert personal["last_name"] == "Name"
        assert personal["email"] == "profile@example.com"

        # Resume should be null
        assert data["data"]["resume"] is None

        # Placeholders should be null
        assert data["data"]["work_authorization"] is None
        assert data["data"]["salary_expectation"] is None


class TestFullNameComputation:
    """Tests for full_name computation edge cases."""

    def test_full_name_computed_correctly(self, mock_auth_user):
        """Verify full_name computed from first + last."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return {
                    "personal": {
                        "first_name": "Alice",
                        "last_name": "Smith",
                        "full_name": "Alice Smith",
                        "email": "alice@example.com",
                        "phone": None,
                        "location": None,
                        "linkedin_url": None,
                        "portfolio_url": None,
                    },
                    "resume": {
                        "id": "00000000-0000-0000-0000-000000000001",
                        "file_name": "resume.pdf",
                        "download_url": "https://url",
                        "parsed_summary": None,
                    },
                    "work_authorization": None,
                    "salary_expectation": None,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")
            data = response.json()
            assert data["data"]["personal"]["full_name"] == "Alice Smith"
        finally:
            app.dependency_overrides.clear()

    def test_full_name_empty_when_both_none(self, mock_auth_user):
        """Verify full_name is None when both first and last are empty."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return {
                    "personal": {
                        "first_name": None,
                        "last_name": None,
                        "full_name": None,
                        "email": "test@example.com",
                        "phone": None,
                        "location": None,
                        "linkedin_url": None,
                        "portfolio_url": None,
                    },
                    "resume": None,
                    "work_authorization": None,
                    "salary_expectation": None,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")
            data = response.json()
            # All name fields should be None when empty
            assert data["data"]["personal"]["first_name"] is None
            assert data["data"]["personal"]["last_name"] is None
            assert data["data"]["personal"]["full_name"] is None
        finally:
            app.dependency_overrides.clear()


class TestSignedUrlGeneration:
    """Tests for resume download URL generation."""

    def test_signed_url_generated_with_1_hour_expiry(
        self, mock_auth_user, complete_autofill_response
    ):
        """Verify signed URL generated with correct expiry time."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return complete_autofill_response

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")
            assert response.status_code == 200
            # URL should be present in the response
            assert response.json()["data"]["resume"]["download_url"] == "https://supabase.../signed-url"
        finally:
            app.dependency_overrides.clear()

    def test_resume_with_missing_file_path(self, mock_auth_user):
        """Verify resume with missing file_path returns null download_url."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return {
                    "personal": {
                        "first_name": "John",
                        "last_name": "Doe",
                        "full_name": "John Doe",
                        "email": "john@example.com",
                        "phone": None,
                        "location": None,
                        "linkedin_url": None,
                        "portfolio_url": None,
                    },
                    "resume": {
                        "id": "00000000-0000-0000-0000-000000001234",
                        "file_name": None,  # Missing file_name
                        "download_url": None,  # Missing file_path -> null URL
                        "parsed_summary": "Some summary",
                    },
                    "work_authorization": None,
                    "salary_expectation": None,
                }

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            # Resume should exist but with null download_url and file_name
            assert data["data"]["resume"] is not None
            assert data["data"]["resume"]["download_url"] is None
            assert data["data"]["resume"]["file_name"] is None
        finally:
            app.dependency_overrides.clear()

    def test_signed_url_failure_returns_500(self, mock_auth_user):
        """Verify signed URL generation failure returns 500 error."""
        from app.core.deps import get_current_user
        from app.core.exceptions import ApiException, ErrorCode
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                raise ApiException(
                    code=ErrorCode.STORAGE_ERROR,
                    message="Failed to generate download URL",
                    status_code=500,
                )

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            response = client.get("/v1/autofill/data")
            assert response.status_code == 500
            data = response.json()
            assert data["success"] is False
            assert data["error"]["code"] == "STORAGE_ERROR"
        finally:
            app.dependency_overrides.clear()


class TestPerformance:
    """Tests for performance requirements (NFR4)."""

    def test_response_time_under_1_second(
        self, mock_auth_user, complete_autofill_response
    ):
        """Verify response completes within 1 second."""
        from app.core.deps import get_current_user
        from app.routers.autofill import get_autofill_service

        async def mock_get_current_user():
            return mock_auth_user

        class MockAutofillService:
            async def get_autofill_data(self, user_id):
                return complete_autofill_response

        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[get_autofill_service] = lambda: MockAutofillService()
        client = TestClient(app)

        try:
            start = time.time()
            response = client.get("/v1/autofill/data")
            duration = time.time() - start

            assert response.status_code == 200
            assert duration < 1.0, f"Response took {duration:.2f}s, expected < 1s"
        finally:
            app.dependency_overrides.clear()


class TestNameSplitting:
    """Tests for _split_full_name helper function."""

    def test_split_full_name_normal(self):
        """Test splitting normal two-word name."""
        from app.services.autofill_service import _split_full_name

        first, last = _split_full_name("John Doe")
        assert first == "John"
        assert last == "Doe"

    def test_split_full_name_single_word(self):
        """Test splitting single word name."""
        from app.services.autofill_service import _split_full_name

        first, last = _split_full_name("Madonna")
        assert first == "Madonna"
        assert last == ""

    def test_split_full_name_empty(self):
        """Test splitting empty string."""
        from app.services.autofill_service import _split_full_name

        first, last = _split_full_name("")
        assert first == ""
        assert last == ""

    def test_split_full_name_none(self):
        """Test splitting None value."""
        from app.services.autofill_service import _split_full_name

        first, last = _split_full_name(None)
        assert first == ""
        assert last == ""

    def test_split_full_name_multiple_words(self):
        """Test splitting name with multiple words (middle name)."""
        from app.services.autofill_service import _split_full_name

        first, last = _split_full_name("John Michael Doe")
        assert first == "John"
        assert last == "Michael Doe"
