"""Auth router - authentication endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, get_token_from_header
from app.models.base import ok
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth")


def get_auth_service() -> AuthService:
    """Dependency to get auth service instance."""
    return AuthService()


@router.post("/login")
async def login(
    redirect_url: Optional[str] = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Initiate OAuth login flow.

    Args:
        redirect_url: Optional custom redirect URL after OAuth.
        auth_service: The auth service instance.

    Returns:
        OAuth URL for Google sign-in.
    """
    oauth_url = await auth_service.get_oauth_url(redirect_url)
    return ok({"oauth_url": oauth_url})


@router.get("/callback")
async def callback(
    code: str,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Handle OAuth callback from Supabase redirect.

    Args:
        code: The authorization code from query parameter.
        auth_service: The auth service instance.

    Returns:
        Session tokens and user data.
    """
    session_data = await auth_service.handle_oauth_callback(code)
    return ok(session_data)


@router.post("/logout")
async def logout(
    token: str = Depends(get_token_from_header),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Logout user and invalidate session.

    Args:
        token: The user's access token.
        auth_service: The auth service instance.

    Returns:
        Logout confirmation.
    """
    await auth_service.logout(token)
    return ok({"message": "Logged out successfully"})


@router.get("/me")
async def get_me(
    user: CurrentUser,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Get current user profile.

    Args:
        user: The authenticated user from dependency injection.
        auth_service: The auth service instance.

    Returns:
        User profile data.
    """
    profile = await auth_service.get_profile(user["id"])
    return ok(profile)


@router.delete("/account")
async def delete_account(
    user: CurrentUser,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Delete current user's account and all associated data.

    This permanently deletes:
    - User profile
    - All resumes (records and storage files)
    - All jobs
    - All usage events
    - Feedback records will be anonymized (user_id set to NULL)

    Args:
        user: The authenticated user from dependency injection.
        auth_service: The auth service instance.

    Returns:
        Deletion confirmation message.
    """
    result = await auth_service.delete_account(user["id"])
    return ok(result)
