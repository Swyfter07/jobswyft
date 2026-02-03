"""Test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create mock authorization headers.

    Note: For actual authentication testing, you need a valid
    Supabase token. This is a placeholder for structure.
    """
    return {"Authorization": "Bearer mock-token-for-testing"}
