"""Dependency injection for FastAPI."""

from typing import Annotated, Optional

from fastapi import Depends, Header

from app.core.exceptions import AuthenticationError, ErrorCode, InvalidTokenError


async def get_token_from_header(
    authorization: Annotated[Optional[str], Header()] = None,
) -> str:
    """Extract Bearer token from Authorization header.

    Args:
        authorization: The Authorization header value.

    Returns:
        The extracted token.

    Raises:
        AuthenticationError: If no token is provided.
    """
    if not authorization:
        raise AuthenticationError(
            code=ErrorCode.AUTH_REQUIRED,
            message="Authorization header required",
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError(
            code=ErrorCode.AUTH_REQUIRED,
            message="Invalid authorization header format. Use: Bearer <token>",
        )

    return parts[1]


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_header)],
) -> dict:
    """Get the current authenticated user from the token.

    Args:
        token: The JWT access token.

    Returns:
        User data from the token.

    Raises:
        InvalidTokenError: If the token is invalid or expired.
    """
    # Import here to avoid circular imports
    from app.services.auth_service import AuthService

    auth_service = AuthService()
    user = await auth_service.verify_token(token)

    if not user:
        raise InvalidTokenError()

    return user


# Type alias for dependency injection
CurrentUser = Annotated[dict, Depends(get_current_user)]
