"""Auth-specific Pydantic models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class ProfileResponse(BaseModel):
    """User profile data response model.

    Excludes sensitive fields like stripe_customer_id and updated_at.
    """

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    subscription_tier: str = "free"
    subscription_status: str = "active"
    active_resume_id: Optional[str] = None
    preferred_ai_provider: str = "claude"
    created_at: datetime

    class Config:
        """Pydantic model config."""

        from_attributes = True


class AccountDeletedResponse(BaseModel):
    """Response for account deletion endpoint."""

    message: str = "Your account and all data have been permanently deleted."


class LoginResponse(BaseModel):
    """Response for login endpoint with OAuth URL."""

    oauth_url: str


class CallbackRequest(BaseModel):
    """Request body for OAuth callback."""

    code: str


class UserData(BaseModel):
    """User data returned in session response."""

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    subscription_tier: str = "free"
    subscription_status: str = "active"
    preferred_ai_provider: str = "claude"


class SessionData(BaseModel):
    """Session data returned after successful authentication."""

    access_token: str
    refresh_token: str
    expires_at: int
    user: UserData


class LogoutResponse(BaseModel):
    """Response for logout endpoint."""

    message: str = "Logged out successfully"
