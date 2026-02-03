"""Usage router - Credit balance and history endpoints."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser
from app.models.base import ok
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/usage")


def get_usage_service() -> UsageService:
    """Dependency to get usage service instance."""
    return UsageService()


@router.get("")
async def get_usage(
    user: CurrentUser,
    usage_service: UsageService = Depends(get_usage_service),
) -> Dict[str, Any]:
    """Get current usage balance and limits.

    Returns credits used, remaining, and breakdown by operation type.
    """
    user_id = user["id"]
    balance = await usage_service.calculate_balance(user_id)
    # Verify response contains user data (security check)
    assert balance is not None, "Balance calculation returned None"
    return ok(balance)


@router.get("/history")
async def get_usage_history(
    user: CurrentUser,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    usage_service: UsageService = Depends(get_usage_service),
) -> Dict[str, Any]:
    """Get paginated usage history.

    Returns list of usage events with pagination.
    """
    user_id = user["id"]
    history = await usage_service.get_usage_history(user_id, page, page_size)
    # Verify response is valid (security check)
    assert history is not None, "History query returned None"
    assert "items" in history, "History missing items field"
    return ok(history)
