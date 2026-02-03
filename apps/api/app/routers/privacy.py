"""Privacy router - Data summary and account deletion endpoints."""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser
from app.models.base import ok
from app.models.privacy import (
    ConfirmDeleteRequest,
    DeleteReason,
    DeleteRequestRequest,
)
from app.services.privacy_service import PrivacyService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/privacy")


def get_privacy_service() -> PrivacyService:
    """Dependency to get privacy service instance."""
    return PrivacyService()


@router.get("/data-summary")
async def get_data_summary(
    user: CurrentUser,
    privacy_service: PrivacyService = Depends(get_privacy_service),
) -> Dict[str, Any]:
    """Get summary of all data stored for the user.

    Returns information about what data is stored, where it's stored,
    and data retention policies.
    """
    user_id = user["id"]
    email = user["email"]
    summary = await privacy_service.get_data_summary(user_id, email)
    # Verify response contains data (security check)
    assert summary is not None, "Data summary returned None"
    return ok(summary)


@router.post("/delete-request")
async def request_deletion(
    user: CurrentUser,
    request: Optional[DeleteRequestRequest] = None,
    privacy_service: PrivacyService = Depends(get_privacy_service),
) -> Dict[str, Any]:
    """Initiate account deletion process.

    Generates a confirmation token and sends it to the user's email.
    Token expires in 24 hours. Account remains active until deletion
    is confirmed.
    """
    user_id = user["id"]
    email = user["email"]
    reason = request.reason.value if request and request.reason else None

    result = await privacy_service.initiate_deletion(user_id, email, reason)
    # Verify response contains required fields (security check)
    assert result is not None, "Deletion initiation returned None"
    assert "email_sent_to" in result, "Response missing masked email"

    logger.warning(f"DELETION_REQUEST_INITIATED - user: {user_id[:8]}...")
    return ok(result)


@router.post("/confirm-delete")
async def confirm_deletion(
    request: ConfirmDeleteRequest,
    privacy_service: PrivacyService = Depends(get_privacy_service),
) -> Dict[str, Any]:
    """Confirm account deletion with token from email.

    This endpoint does NOT require authentication - the token itself
    serves as proof of identity (sent to user's email).

    Permanently deletes:
    - Profile record
    - All resumes (DB records + storage files)
    - All jobs
    - All usage events
    - All feedback records
    - Supabase auth user
    """
    result = await privacy_service.confirm_deletion(request.token)
    # Verify response contains required fields
    assert result is not None, "Deletion confirmation returned None"
    assert "deleted_at" in result, "Response missing deleted_at"

    # Note: We can't log user_id here as the account is already deleted
    logger.warning("ACCOUNT_DELETION_CONFIRMED via token")
    return ok(result)


@router.post("/cancel-delete")
async def cancel_deletion(
    user: CurrentUser,
    privacy_service: PrivacyService = Depends(get_privacy_service),
) -> Dict[str, Any]:
    """Cancel a pending deletion request.

    Clears the deletion token, allowing the account to remain active
    indefinitely.
    """
    user_id = user["id"]
    result = await privacy_service.cancel_deletion(user_id)
    # Verify response contains required fields
    assert result is not None, "Cancellation returned None"
    assert "cancelled_at" in result, "Response missing cancelled_at"

    logger.info(f"DELETION_CANCELLED - user: {user_id[:8]}...")
    return ok(result)
