"""Auth service - handles authentication operations with Supabase."""

import hashlib
import logging
from typing import Any, Dict, Optional

from supabase import Client

from app.core.config import settings
from app.core.exceptions import ApiException, AuthenticationError, ErrorCode, InvalidTokenError, NotFoundError
from app.db.client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""

    def __init__(self):
        """Initialize the auth service."""
        self._client: Optional[Client] = None
        self._admin_client: Optional[Client] = None

    @property
    def client(self) -> Client:
        """Get the Supabase client (anon key)."""
        if self._client is None:
            self._client = get_supabase_client()
        return self._client

    @property
    def admin_client(self) -> Client:
        """Get the Supabase admin client (service role key)."""
        if self._admin_client is None:
            self._admin_client = get_supabase_admin_client()
        return self._admin_client

    async def get_oauth_url(self, redirect_url: Optional[str] = None) -> str:
        """Get the OAuth URL for Google sign-in.

        Args:
            redirect_url: Optional custom redirect URL after OAuth.

        Returns:
            The OAuth URL to redirect the user to.

        Raises:
            AuthenticationError: If OAuth URL generation fails.
        """
        try:
            # Default redirect to our callback endpoint
            callback_url = redirect_url or f"http://localhost:{settings.port}/v1/auth/callback"

            # Use SDK's sign_in_with_oauth which handles PKCE automatically
            response = self.client.auth.sign_in_with_oauth(
                {
                    "provider": "google",
                    "options": {
                        "redirect_to": callback_url,
                    },
                }
            )

            if not response.url:
                raise AuthenticationError(
                    code=ErrorCode.AUTH_REQUIRED,
                    message="Failed to generate OAuth URL",
                )

            return response.url

        except AuthenticationError:
            raise
        except Exception as e:
            raise AuthenticationError(
                code=ErrorCode.AUTH_REQUIRED,
                message=f"OAuth initialization failed: {str(e)}",
            )

    async def handle_oauth_callback(self, code: str) -> Dict[str, Any]:
        """Handle OAuth callback and exchange code for tokens.

        Args:
            code: The authorization code from OAuth provider.

        Returns:
            Session data including tokens and user info.

        Raises:
            AuthenticationError: If code exchange fails.
        """
        try:
            # Use SDK's exchange_code_for_session (handles PKCE verification)
            response = self.client.auth.exchange_code_for_session({"auth_code": code})

            if not response.session:
                raise AuthenticationError(
                    code=ErrorCode.AUTH_REQUIRED,
                    message="Failed to exchange code for session",
                )

            session = response.session
            user = response.user

            # Ensure profile exists (trigger should handle this, but verify)
            await self.create_profile_if_not_exists(user)

            return {
                "access_token": session.access_token,
                "refresh_token": session.refresh_token,
                "expires_at": session.expires_at,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.user_metadata.get("full_name")
                    or user.user_metadata.get("name"),
                },
            }

        except AuthenticationError:
            raise
        except Exception as e:
            raise AuthenticationError(
                code=ErrorCode.AUTH_REQUIRED,
                message=f"OAuth callback failed: {str(e)}",
            )

    async def create_profile_if_not_exists(self, user: Any) -> None:
        """Create a profile record if it doesn't exist.

        This is a safety check - the database trigger should handle this,
        but we verify and create if needed.

        Args:
            user: The Supabase user object.
        """
        try:
            # Check if profile exists
            result = (
                self.admin_client.table("profiles")
                .select("id")
                .eq("id", user.id)
                .execute()
            )

            if not result.data:
                # Create profile
                self.admin_client.table("profiles").insert(
                    {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.user_metadata.get("full_name")
                        or user.user_metadata.get("name")
                        or "",
                    }
                ).execute()

        except Exception as e:
            # Log error but don't fail - trigger should have created the profile
            logger.warning(f"Profile creation fallback failed: {e}")
            pass

    async def logout(self, access_token: str) -> bool:
        """Invalidate the user's session.

        Args:
            access_token: The user's access token.

        Returns:
            True if logout was successful.

        Raises:
            InvalidTokenError: If the token cannot be invalidated.
        """
        try:
            # First get the user from the token to get their user_id
            response = self.client.auth.get_user(access_token)

            if not response.user:
                raise InvalidTokenError(message="Cannot invalidate session: invalid token")

            # Use admin client to sign out the user (invalidates all sessions)
            # This properly invalidates the session server-side
            self.admin_client.auth.admin.sign_out(response.user.id)
            return True
        except InvalidTokenError:
            raise
        except Exception as e:
            # Log the error but still return success for client-side cleanup
            # The token will expire naturally if server-side invalidation fails
            logger.warning(f"Server-side logout failed: {e}")
            return True

    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a JWT access token and return user data.

        Args:
            token: The JWT access token.

        Returns:
            User data if token is valid, None otherwise.

        Raises:
            InvalidTokenError: If the token is invalid or expired.
        """
        try:
            # Get user from token
            response = self.client.auth.get_user(token)

            if not response.user:
                raise InvalidTokenError()

            user = response.user

            # Get profile data
            profile_result = (
                self.admin_client.table("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
                .execute()
            )

            profile = profile_result.data if profile_result.data else {}

            return {
                "id": user.id,
                "email": user.email,
                "full_name": profile.get("full_name"),
                "subscription_tier": profile.get("subscription_tier", "free"),
                "subscription_status": profile.get("subscription_status", "active"),
                "preferred_ai_provider": profile.get("preferred_ai_provider", "claude"),
            }

        except InvalidTokenError:
            raise
        except Exception as e:
            raise InvalidTokenError(
                message=f"Token verification failed: {str(e)}",
            )

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile data.

        Args:
            user_id: The user's ID.

        Returns:
            Profile data dictionary.

        Raises:
            NotFoundError: If the profile is not found.
        """
        try:
            result = (
                self.admin_client.table("profiles")
                .select(
                    "id, email, full_name, subscription_tier, subscription_status, "
                    "active_resume_id, preferred_ai_provider, created_at"
                )
                .eq("id", user_id)
                .single()
                .execute()
            )

            if not result.data:
                raise NotFoundError(message="Profile not found")

            return result.data

        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to retrieve profile: {str(e)}")
            raise ApiException(
                code="INTERNAL_ERROR",
                message="Failed to retrieve profile",
                status_code=500,
            )

    async def delete_account(self, user_id: str) -> Dict[str, str]:
        """Delete user account and all associated data.

        This deletes the Supabase auth user, which cascades to delete:
        - Profile record (CASCADE from FK)
        - Resumes (CASCADE from profile FK)
        - Jobs (CASCADE from profile FK)
        - Usage events (CASCADE from profile FK)
        - Feedback records will have user_id set to NULL (SET NULL constraint)

        Args:
            user_id: The user's ID.

        Returns:
            Success confirmation message.

        Raises:
            AuthenticationError: If deletion fails.
        """
        try:
            # Delete the Supabase auth user - CASCADE handles the rest
            self.admin_client.auth.admin.delete_user(user_id)

            # Log deletion event with hashed identifier for audit (truncated for privacy)
            user_id_hash = hashlib.sha256(user_id.encode()).hexdigest()[:8]
            logger.info(f"Account deleted: user_id_hash={user_id_hash}")

            return {
                "message": "Your account and all data have been permanently deleted."
            }

        except Exception as e:
            logger.error(f"Account deletion failed: {str(e)}")
            raise ApiException(
                code="ACCOUNT_DELETION_FAILED",
                message="Failed to delete account. Please try again.",
                status_code=500,
            )
