"""Tests for job endpoints."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def mock_auth_user():
    """Fixture to mock authentication for testing."""
    return {"id": "test-user-id", "email": "test@example.com"}


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
def mock_job_data():
    """Fixture for sample job data."""
    return {
        "id": "test-job-uuid",
        "user_id": "test-user-id",
        "title": "Senior Software Engineer",
        "company": "Acme Corp",
        "description": "We are looking for a senior engineer...",
        "location": "San Francisco, CA",
        "salary_range": "$150k-$200k",
        "employment_type": "Full-time",
        "source_url": "https://acme.com/jobs/123",
        "status": "saved",
        "notes": None,
        "created_at": "2026-01-30T12:00:00+00:00",
        "updated_at": "2026-01-30T12:00:00+00:00",
    }


class TestCreateScannedJobEndpoint:
    """Tests for POST /v1/jobs/scan endpoint."""

    def test_create_without_auth_returns_401(self, client):
        """Create without token should return 401."""
        response = client.post(
            "/v1/jobs/scan",
            json={
                "title": "Engineer",
                "company": "Acme",
                "description": "Job description",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_create_with_all_fields(self, authenticated_client, mock_job_data):
        """Create job with all fields should return 201."""
        from app.services.job_service import JobService

        async def mock_create_job(self, user_id, job_data):
            return mock_job_data

        with patch.object(JobService, "create_job", mock_create_job):
            response = authenticated_client.post(
                "/v1/jobs/scan",
                json={
                    "title": "Senior Software Engineer",
                    "company": "Acme Corp",
                    "description": "We are looking for a senior engineer...",
                    "location": "San Francisco, CA",
                    "salary_range": "$150k-$200k",
                    "employment_type": "Full-time",
                    "source_url": "https://acme.com/jobs/123",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == "test-job-uuid"
        assert data["data"]["title"] == "Senior Software Engineer"
        assert data["data"]["company"] == "Acme Corp"
        assert data["data"]["status"] == "saved"

    def test_create_with_required_fields_only(self, authenticated_client, mock_job_data):
        """Create job with only required fields should return 201."""
        from app.services.job_service import JobService

        minimal_job = {
            "id": "test-job-uuid",
            "user_id": "test-user-id",
            "title": "Engineer",
            "company": "Acme",
            "description": "Job description",
            "location": None,
            "salary_range": None,
            "employment_type": None,
            "source_url": None,
            "status": "saved",
            "notes": None,
            "created_at": "2026-01-30T12:00:00+00:00",
            "updated_at": "2026-01-30T12:00:00+00:00",
        }

        async def mock_create_job(self, user_id, job_data):
            return minimal_job

        with patch.object(JobService, "create_job", mock_create_job):
            response = authenticated_client.post(
                "/v1/jobs/scan",
                json={
                    "title": "Engineer",
                    "company": "Acme",
                    "description": "Job description",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["location"] is None
        assert data["data"]["salary_range"] is None

    def test_create_missing_title_returns_400(self, authenticated_client):
        """Missing title should return 422 VALIDATION_ERROR."""
        response = authenticated_client.post(
            "/v1/jobs/scan",
            json={
                "company": "Acme",
                "description": "Job description",
            },
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == 422  # FastAPI validation error

    def test_create_missing_company_returns_400(self, authenticated_client):
        """Missing company should return 422 VALIDATION_ERROR."""
        response = authenticated_client.post(
            "/v1/jobs/scan",
            json={
                "title": "Engineer",
                "description": "Job description",
            },
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == 422  # FastAPI validation error

    def test_create_missing_description_returns_400(self, authenticated_client):
        """Missing description should return 422 VALIDATION_ERROR."""
        response = authenticated_client.post(
            "/v1/jobs/scan",
            json={
                "title": "Engineer",
                "company": "Acme",
            },
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == 422  # FastAPI validation error


class TestGetJobEndpoint:
    """Tests for GET /v1/jobs/{id} endpoint."""

    def test_get_without_auth_returns_401(self, client):
        """Get without token should return 401."""
        response = client.get("/v1/jobs/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_get_returns_job_details(self, authenticated_client, mock_job_data):
        """Get job should return full job details."""
        from app.services.job_service import JobService

        async def mock_get_job(self, user_id, job_id):
            return mock_job_data

        with patch.object(JobService, "get_job", mock_get_job):
            response = authenticated_client.get(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == "test-job-uuid"
        assert data["data"]["title"] == "Senior Software Engineer"
        assert data["data"]["company"] == "Acme Corp"

    def test_get_nonexistent_returns_404(self, authenticated_client):
        """Get non-existent job should return 404."""
        from app.services.job_service import JobService

        async def mock_get_job(self, user_id, job_id):
            return None

        with patch.object(JobService, "get_job", mock_get_job):
            response = authenticated_client.get(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_get_another_users_job_returns_404(self, authenticated_client):
        """Get another user's job should return 404 (RLS enforcement)."""
        from app.services.job_service import JobService

        async def mock_get_job(self, user_id, job_id):
            # RLS blocks access - returns None
            return None

        with patch.object(JobService, "get_job", mock_get_job):
            response = authenticated_client.get(
                "/v1/jobs/11111111-1111-1111-1111-111111111111",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"


class TestUpdateJobEndpoint:
    """Tests for PUT /v1/jobs/{id} endpoint."""

    def test_update_without_auth_returns_401(self, client):
        """Update without token should return 401."""
        response = client.put(
            "/v1/jobs/00000000-0000-0000-0000-000000000000",
            json={"title": "New Title"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_update_specific_fields(self, authenticated_client, mock_job_data):
        """Update specific fields should return updated job."""
        from app.services.job_service import JobService

        updated_job = {**mock_job_data, "title": "Lead Software Engineer"}

        async def mock_update_job(self, user_id, job_id, updates):
            return updated_job

        with patch.object(JobService, "update_job", mock_update_job):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                json={"title": "Lead Software Engineer"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Lead Software Engineer"

    def test_update_multiple_fields(self, authenticated_client, mock_job_data):
        """Update multiple fields should return updated job."""
        from app.services.job_service import JobService

        updated_job = {
            **mock_job_data,
            "title": "Lead Software Engineer",
            "location": "Remote",
        }

        async def mock_update_job(self, user_id, job_id, updates):
            return updated_job

        with patch.object(JobService, "update_job", mock_update_job):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                json={"title": "Lead Software Engineer", "location": "Remote"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Lead Software Engineer"
        assert data["data"]["location"] == "Remote"

    def test_update_nonexistent_returns_404(self, authenticated_client):
        """Update non-existent job should return 404."""
        from app.services.job_service import JobService

        async def mock_update_job(self, user_id, job_id, updates):
            return None

        with patch.object(JobService, "update_job", mock_update_job):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                json={"title": "New Title"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_update_another_users_job_returns_404(self, authenticated_client):
        """Update another user's job should return 404 (RLS enforcement)."""
        from app.services.job_service import JobService

        async def mock_update_job(self, user_id, job_id, updates):
            # RLS blocks access - returns None
            return None

        with patch.object(JobService, "update_job", mock_update_job):
            response = authenticated_client.put(
                "/v1/jobs/22222222-2222-2222-2222-222222222222",
                json={"title": "Hacked Title"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"


class TestRLSEnforcement:
    """Tests for Row Level Security enforcement."""

    def test_user_a_cannot_read_user_b_jobs(self, authenticated_client):
        """User A cannot read User B's jobs - returns 404 not 403."""
        from app.services.job_service import JobService

        async def mock_get_job(self, user_id, job_id):
            # RLS means different user's jobs appear as "not found"
            return None

        with patch.object(JobService, "get_job", mock_get_job):
            response = authenticated_client.get(
                "/v1/jobs/33333333-3333-3333-3333-333333333333",
                headers={"Authorization": "Bearer valid-token"},
            )

        # RLS returns 404 (not 403) to avoid leaking existence information
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_user_cannot_update_another_users_job(self, authenticated_client):
        """User cannot update another user's job - returns 404."""
        from app.services.job_service import JobService

        async def mock_update_job(self, user_id, job_id, updates):
            return None

        with patch.object(JobService, "update_job", mock_update_job):
            response = authenticated_client.put(
                "/v1/jobs/44444444-4444-4444-4444-444444444444",
                json={"title": "Malicious Update"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"


# ==================== Story 5.2 Tests ====================


class TestCreateJobEndpoint:
    """Tests for POST /v1/jobs endpoint (Story 5.2)."""

    def test_create_without_auth_returns_401(self, client):
        """Create without token should return 401."""
        response = client.post(
            "/v1/jobs",
            json={
                "title": "Engineer",
                "company": "Acme",
                "description": "Job description",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_create_job_with_applied_status(self, authenticated_client, mock_job_data):
        """Create job with status=applied should return 201."""
        from app.services.job_service import JobService

        applied_job = {**mock_job_data, "status": "applied"}

        async def mock_create_job(self, user_id, job_data):
            return applied_job

        with patch.object(JobService, "create_job", mock_create_job):
            response = authenticated_client.post(
                "/v1/jobs",
                json={
                    "title": "Senior Software Engineer",
                    "company": "Acme Corp",
                    "description": "We are looking for a senior engineer...",
                    "status": "applied",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "applied"

    def test_create_job_default_status(self, authenticated_client, mock_job_data):
        """Create job without status should default to 'saved'."""
        from app.services.job_service import JobService

        async def mock_create_job(self, user_id, job_data):
            return mock_job_data  # status is "saved"

        with patch.object(JobService, "create_job", mock_create_job):
            response = authenticated_client.post(
                "/v1/jobs",
                json={
                    "title": "Engineer",
                    "company": "Acme",
                    "description": "Job description",
                },
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "saved"


class TestListJobsEndpoint:
    """Tests for GET /v1/jobs endpoint (Story 5.2)."""

    def test_list_without_auth_returns_401(self, client):
        """List without token should return 401."""
        response = client.get("/v1/jobs")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_list_jobs_paginated(self, authenticated_client, mock_job_data):
        """List jobs should return paginated response."""
        from app.services.job_service import JobService

        async def mock_list_jobs(self, user_id, filters):
            return {
                "items": [
                    {
                        "id": "test-job-uuid",
                        "title": "Software Engineer",
                        "company": "Acme Corp",
                        "status": "applied",
                        "notes_preview": "Great team",
                        "created_at": "2026-01-30T12:00:00+00:00",
                        "updated_at": "2026-01-30T14:00:00+00:00",
                    }
                ],
                "total": 1,
                "page": 1,
                "page_size": 20,
            }

        with patch.object(JobService, "list_jobs", mock_list_jobs):
            response = authenticated_client.get(
                "/v1/jobs?page=1&page_size=20",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 1
        assert len(data["data"]["items"]) == 1
        assert data["data"]["page"] == 1
        assert data["data"]["page_size"] == 20

    def test_list_jobs_filter_by_status(self, authenticated_client):
        """List jobs with status filter should apply filter."""
        from app.services.job_service import JobService

        async def mock_list_jobs(self, user_id, filters):
            # Verify filter was passed
            assert filters.get("status") == "applied"
            return {
                "items": [],
                "total": 0,
                "page": 1,
                "page_size": 20,
            }

        with patch.object(JobService, "list_jobs", mock_list_jobs):
            response = authenticated_client.get(
                "/v1/jobs?status=applied",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200

    def test_list_jobs_notes_preview(self, authenticated_client):
        """List jobs should include notes_preview truncated to 100 chars."""
        from app.services.job_service import JobService

        long_notes = "A" * 150

        async def mock_list_jobs(self, user_id, filters):
            return {
                "items": [
                    {
                        "id": "test-job-uuid",
                        "title": "Software Engineer",
                        "company": "Acme Corp",
                        "status": "applied",
                        "notes_preview": long_notes[:100],
                        "created_at": "2026-01-30T12:00:00+00:00",
                        "updated_at": "2026-01-30T14:00:00+00:00",
                    }
                ],
                "total": 1,
                "page": 1,
                "page_size": 20,
            }

        with patch.object(JobService, "list_jobs", mock_list_jobs):
            response = authenticated_client.get(
                "/v1/jobs",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]["items"][0]["notes_preview"]) == 100

    def test_list_jobs_only_returns_current_user_jobs(self, authenticated_client):
        """List jobs should only return current user's jobs (RLS enforcement)."""
        from app.services.job_service import JobService

        async def mock_list_jobs(self, user_id, filters):
            # RLS automatically filters to only current user's jobs
            # Mock returns only jobs for current user
            return {
                "items": [
                    {
                        "id": "current-user-job",
                        "title": "My Job",
                        "company": "My Company",
                        "status": "applied",
                        "notes_preview": None,
                        "created_at": "2026-01-30T12:00:00+00:00",
                        "updated_at": "2026-01-30T14:00:00+00:00",
                    }
                ],
                "total": 1,
                "page": 1,
                "page_size": 20,
            }

        with patch.object(JobService, "list_jobs", mock_list_jobs):
            response = authenticated_client.get(
                "/v1/jobs",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        # Verify only current user's jobs returned (RLS enforces this)
        assert data["data"]["total"] == 1
        assert data["data"]["items"][0]["id"] == "current-user-job"


class TestUpdateJobStatusEndpoint:
    """Tests for PUT /v1/jobs/{id}/status endpoint (Story 5.2)."""

    def test_update_status_without_auth_returns_401(self, client):
        """Update status without token should return 401."""
        response = client.put(
            "/v1/jobs/00000000-0000-0000-0000-000000000000/status",
            json={"status": "applied"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_update_job_status_valid(self, authenticated_client, mock_job_data):
        """Update job status with valid status should return updated job."""
        from app.services.job_service import JobService

        updated_job = {
            **mock_job_data,
            "status": "interviewing",
            "updated_at": "2026-01-31T12:00:00+00:00",
        }

        async def mock_update_job_status(self, user_id, job_id, status):
            return updated_job

        with patch.object(JobService, "update_job_status", mock_update_job_status):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000/status",
                json={"status": "interviewing"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "interviewing"

    def test_update_job_status_invalid(self, authenticated_client):
        """Update job status with invalid status should return 422."""
        response = authenticated_client.put(
            "/v1/jobs/00000000-0000-0000-0000-000000000000/status",
            json={"status": "invalid_status"},
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == 422  # Pydantic validation error

    def test_update_job_status_not_found(self, authenticated_client):
        """Update status for non-existent job should return 404."""
        from app.services.job_service import JobService

        async def mock_update_job_status(self, user_id, job_id, status):
            return None

        with patch.object(JobService, "update_job_status", mock_update_job_status):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000/status",
                json={"status": "applied"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_update_status_another_users_job_returns_404(self, authenticated_client):
        """Update status for another user's job should return 404 (RLS enforcement)."""
        from app.services.job_service import JobService

        async def mock_update_job_status(self, user_id, job_id, status):
            # RLS blocks access - returns None
            return None

        with patch.object(JobService, "update_job_status", mock_update_job_status):
            response = authenticated_client.put(
                "/v1/jobs/66666666-6666-6666-6666-666666666666/status",
                json={"status": "interviewing"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"


class TestDeleteJobEndpoint:
    """Tests for DELETE /v1/jobs/{id} endpoint (Story 5.2)."""

    def test_delete_without_auth_returns_401(self, client):
        """Delete without token should return 401."""
        response = client.delete("/v1/jobs/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_delete_job_success(self, authenticated_client):
        """Delete job should return success message."""
        from app.services.job_service import JobService

        async def mock_delete_job(self, user_id, job_id):
            return True

        with patch.object(JobService, "delete_job", mock_delete_job):
            response = authenticated_client.delete(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["message"] == "Job deleted successfully"

    def test_delete_job_not_found(self, authenticated_client):
        """Delete non-existent job should return 404."""
        from app.services.job_service import JobService

        async def mock_delete_job(self, user_id, job_id):
            return False

        with patch.object(JobService, "delete_job", mock_delete_job):
            response = authenticated_client.delete(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_delete_another_users_job_returns_404(self, authenticated_client):
        """Delete another user's job should return 404 (RLS enforcement)."""
        from app.services.job_service import JobService

        async def mock_delete_job(self, user_id, job_id):
            return False  # RLS blocks access

        with patch.object(JobService, "delete_job", mock_delete_job):
            response = authenticated_client.delete(
                "/v1/jobs/55555555-5555-5555-5555-555555555555",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"


class TestJobNotesEndpoint:
    """Tests for PUT /v1/jobs/{id}/notes endpoint (Story 5.2)."""

    def test_update_notes_without_auth_returns_401(self, client):
        """Update notes without token should return 401."""
        response = client.put(
            "/v1/jobs/00000000-0000-0000-0000-000000000000/notes",
            json={"notes": "Some notes"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_add_notes_to_job(self, authenticated_client, mock_job_data):
        """Add notes to job should return updated job."""
        from app.services.job_service import JobService

        updated_job = {
            **mock_job_data,
            "notes": "Recruiter mentioned team is scaling. Follow up next week.",
        }

        async def mock_update_job_notes(self, user_id, job_id, notes):
            return updated_job

        with patch.object(JobService, "update_job_notes", mock_update_job_notes):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000/notes",
                json={"notes": "Recruiter mentioned team is scaling. Follow up next week."},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["notes"] == "Recruiter mentioned team is scaling. Follow up next week."

    def test_edit_notes_replaces_content(self, authenticated_client, mock_job_data):
        """Edit notes should replace existing content."""
        from app.services.job_service import JobService

        updated_job = {**mock_job_data, "notes": "New notes content"}

        async def mock_update_job_notes(self, user_id, job_id, notes):
            return updated_job

        with patch.object(JobService, "update_job_notes", mock_update_job_notes):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000/notes",
                json={"notes": "New notes content"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["notes"] == "New notes content"

    def test_update_notes_not_found(self, authenticated_client):
        """Update notes for non-existent job should return 404."""
        from app.services.job_service import JobService

        async def mock_update_job_notes(self, user_id, job_id, notes):
            return None

        with patch.object(JobService, "update_job_notes", mock_update_job_notes):
            response = authenticated_client.put(
                "/v1/jobs/00000000-0000-0000-0000-000000000000/notes",
                json={"notes": "Some notes"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_update_notes_another_users_job_returns_404(self, authenticated_client):
        """Update notes for another user's job should return 404 (RLS enforcement)."""
        from app.services.job_service import JobService

        async def mock_update_job_notes(self, user_id, job_id, notes):
            # RLS blocks access - returns None
            return None

        with patch.object(JobService, "update_job_notes", mock_update_job_notes):
            response = authenticated_client.put(
                "/v1/jobs/77777777-7777-7777-7777-777777777777/notes",
                json={"notes": "Malicious notes"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "JOB_NOT_FOUND"

    def test_update_notes_exceeds_max_length(self, authenticated_client):
        """Update notes with content exceeding 10,000 chars should return 422."""
        long_notes = "A" * 10001

        response = authenticated_client.put(
            "/v1/jobs/00000000-0000-0000-0000-000000000000/notes",
            json={"notes": long_notes},
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == 422  # Pydantic validation error


class TestGetJobIncludesNotes:
    """Tests for GET /v1/jobs/{id} including notes (Story 5.2)."""

    def test_get_job_includes_notes(self, authenticated_client, mock_job_data):
        """Get job should include full notes field."""
        from app.services.job_service import JobService

        job_with_notes = {**mock_job_data, "notes": "Full notes content here"}

        async def mock_get_job(self, user_id, job_id):
            return job_with_notes

        with patch.object(JobService, "get_job", mock_get_job):
            response = authenticated_client.get(
                "/v1/jobs/00000000-0000-0000-0000-000000000000",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["notes"] == "Full notes content here"
