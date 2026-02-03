"""Custom exceptions and error codes."""

from typing import Any, Dict, Optional


class ErrorCode:
    """Standard error codes for the API."""

    AUTH_REQUIRED = "AUTH_REQUIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    CREDIT_EXHAUSTED = "CREDIT_EXHAUSTED"
    RESUME_LIMIT_REACHED = "RESUME_LIMIT_REACHED"
    RESUME_NOT_FOUND = "RESUME_NOT_FOUND"
    JOB_NOT_FOUND = "JOB_NOT_FOUND"
    SCAN_FAILED = "SCAN_FAILED"
    AI_GENERATION_FAILED = "AI_GENERATION_FAILED"
    AI_PROVIDER_UNAVAILABLE = "AI_PROVIDER_UNAVAILABLE"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    STORAGE_ERROR = "STORAGE_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"


class ApiException(Exception):
    """Base exception for API errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class AuthenticationError(ApiException):
    """Authentication-related errors."""

    def __init__(
        self,
        code: str = ErrorCode.AUTH_REQUIRED,
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(code=code, message=message, status_code=401, details=details)


class InvalidTokenError(AuthenticationError):
    """Invalid or expired token error."""

    def __init__(
        self,
        message: str = "Invalid or expired token",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            code=ErrorCode.INVALID_TOKEN, message=message, details=details
        )


class NotFoundError(ApiException):
    """Resource not found error."""

    def __init__(
        self,
        code: str = "NOT_FOUND",
        message: str = "Resource not found",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(code=code, message=message, status_code=404, details=details)


class ResumeLimitReachedError(ApiException):
    """User has reached maximum resume limit."""

    def __init__(self, max_resumes: int = 5):
        super().__init__(
            code=ErrorCode.RESUME_LIMIT_REACHED,
            message=f"Maximum {max_resumes} resumes allowed. Delete one to upload more.",
            status_code=422,
        )


class CreditExhaustedError(ApiException):
    """User has exhausted their credits."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.CREDIT_EXHAUSTED,
            message="You've used all your credits. Upgrade to continue.",
            status_code=422,
        )


class ResumeNotFoundError(ApiException):
    """Resume not found error."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.RESUME_NOT_FOUND,
            message="Resume not found",
            status_code=404,
        )


class JobNotFoundError(ApiException):
    """Job not found error."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.JOB_NOT_FOUND,
            message="Job not found",
            status_code=404,
        )


class AIProviderUnavailableError(ApiException):
    """Both AI providers failed."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.AI_PROVIDER_UNAVAILABLE,
            message="AI service temporarily unavailable. Please try again.",
            status_code=503,
        )


class ValidationError(ApiException):
    """Validation error."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            status_code=400,
        )


class DatabaseError(ApiException):
    """Database operation failed."""

    def __init__(self, message: str = "Database operation failed. Please try again."):
        super().__init__(
            code=ErrorCode.DATABASE_ERROR,
            message=message,
            status_code=500,
        )


class SubscriptionError(ApiException):
    """Base exception for subscription and billing errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(code=code, message=message, status_code=status_code, details=details)


class InvalidSubscriptionTierError(SubscriptionError):
    """Raised when an invalid subscription tier is provided."""

    def __init__(self, tier: str):
        super().__init__(
            code="INVALID_SUBSCRIPTION_TIER",
            message=f"Invalid subscription tier: {tier}. Valid tiers: starter, pro, power",
            status_code=400,
        )


class MockModeDisabledError(SubscriptionError):
    """Raised when mock endpoint is called but mock mode is disabled."""

    def __init__(self):
        super().__init__(
            code="MOCK_MODE_DISABLED",
            message="Mock endpoint only available when STRIPE_MOCK_MODE=true",
            status_code=403,
        )


# ============================================================================
# Privacy & Data Deletion Exceptions
# ============================================================================


class PrivacyError(ApiException):
    """Base exception for privacy and data deletion errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(code=code, message=message, status_code=status_code, details=details)


class InvalidDeletionTokenError(PrivacyError):
    """Invalid or missing deletion token."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.INVALID_TOKEN,
            message="Invalid or expired deletion token. Please request again.",
            status_code=400,
        )


class DeletionTokenExpiredError(PrivacyError):
    """Deletion token has expired."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.INVALID_TOKEN,
            message="Invalid or expired deletion token. Please request again.",
            status_code=400,
        )


class PendingDeletionNotFoundError(PrivacyError):
    """No pending deletion found for user."""

    def __init__(self):
        super().__init__(
            code="NOT_FOUND",
            message="No pending deletion request found.",
            status_code=404,
        )
