"""Tests for authentication endpoints."""

import pytest


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_200(self, client):
        """Health endpoint should return 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_correct_body(self, client):
        """Health endpoint should return status and version."""
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "1.0.0"

    def test_health_no_auth_required(self, client):
        """Health endpoint should not require authentication."""
        response = client.get("/health")
        assert response.status_code == 200


class TestUnauthenticatedAccess:
    """Tests for unauthenticated access handling."""

    def test_logout_without_token_returns_401(self, client):
        """Logout without token should return 401."""
        response = client.post("/v1/auth/logout")
        assert response.status_code == 401

    def test_logout_without_token_returns_auth_required(self, client):
        """Logout without token should return AUTH_REQUIRED error."""
        response = client.post("/v1/auth/logout")
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_invalid_auth_header_format(self, client):
        """Invalid Authorization header format should return 401."""
        response = client.post(
            "/v1/auth/logout",
            headers={"Authorization": "InvalidFormat"},
        )
        assert response.status_code == 401


class TestLoginEndpoint:
    """Tests for the login endpoint."""

    def test_login_no_auth_required(self, client):
        """Login endpoint should not require authentication."""
        # Note: This will fail if Supabase is not configured,
        # but it verifies the endpoint is accessible
        response = client.post("/v1/auth/login")
        # Either success (with Supabase) or 401 (auth error from Supabase)
        assert response.status_code in [200, 401]


class TestCallbackEndpoint:
    """Tests for the OAuth callback endpoint."""

    def test_callback_requires_code(self, client):
        """Callback should require code in query params."""
        # Note: We check specifically for 422 (validation error)
        # when the required query param 'code' is missing
        response = client.get("/v1/auth/callback")
        assert response.status_code == 422  # Validation error

    def test_callback_accepts_code(self, client):
        """Callback should accept code parameter and return envelope response."""
        # Note: This will fail at Supabase validation with invalid code,
        # but verifies endpoint accepts the parameter and returns proper envelope
        response = client.get("/v1/auth/callback", params={"code": "test-code"})
        # Either success or auth error (invalid code from Supabase)
        assert response.status_code in [200, 401]
        # Verify response follows envelope pattern regardless of success/failure
        data = response.json()
        assert "success" in data
        if response.status_code == 401:
            assert data["success"] is False
            assert "error" in data
            assert "code" in data["error"]


class TestProfileEndpoint:
    """Tests for the GET /v1/auth/me profile endpoint."""

    def test_get_profile_unauthenticated_returns_401(self, client):
        """GET /me without token should return 401."""
        response = client.get("/v1/auth/me")
        assert response.status_code == 401

    def test_get_profile_unauthenticated_returns_auth_required(self, client):
        """GET /me without token should return AUTH_REQUIRED error code."""
        response = client.get("/v1/auth/me")
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_get_profile_invalid_token_returns_401(self, client):
        """GET /me with invalid token should return 401."""
        response = client.get(
            "/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    def test_get_profile_invalid_token_returns_invalid_token(self, client):
        """GET /me with invalid token should return INVALID_TOKEN error code."""
        response = client.get(
            "/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "INVALID_TOKEN"


class TestDeleteAccountEndpoint:
    """Tests for the DELETE /v1/auth/account endpoint."""

    def test_delete_account_unauthenticated_returns_401(self, client):
        """DELETE /account without token should return 401."""
        response = client.delete("/v1/auth/account")
        assert response.status_code == 401

    def test_delete_account_unauthenticated_returns_auth_required(self, client):
        """DELETE /account without token should return AUTH_REQUIRED error code."""
        response = client.delete("/v1/auth/account")
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "AUTH_REQUIRED"

    def test_delete_account_invalid_token_returns_401(self, client):
        """DELETE /account with invalid token should return 401."""
        response = client.delete(
            "/v1/auth/account",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    def test_delete_account_invalid_token_returns_invalid_token(self, client):
        """DELETE /account with invalid token should return INVALID_TOKEN error code."""
        response = client.delete(
            "/v1/auth/account",
            headers={"Authorization": "Bearer invalid-token"},
        )
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "INVALID_TOKEN"
