"""Security utilities and exception handlers."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import ApiException
from app.models.base import error_response


def register_exception_handlers(app: FastAPI) -> None:
    """Register exception handlers for the FastAPI application.

    This approach correctly catches exceptions from dependencies (like get_current_user)
    unlike BaseHTTPMiddleware which runs after dependency resolution.

    Args:
        app: The FastAPI application instance.
    """

    @app.exception_handler(ApiException)
    async def api_exception_handler(request: Request, exc: ApiException) -> JSONResponse:
        """Handle ApiException and return proper error response envelope."""
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                code=exc.code,
                message=exc.message,
                details=exc.details,
            ),
        )
