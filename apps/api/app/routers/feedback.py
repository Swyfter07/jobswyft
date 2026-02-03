"""Feedback router - User feedback submission endpoint."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser
from app.models.base import ok
from app.models.feedback import FeedbackRequest
from app.services.feedback_service import FeedbackService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback")


def get_feedback_service() -> FeedbackService:
    """Dependency to get feedback service instance."""
    return FeedbackService()


@router.post("")
async def submit_feedback(
    request: FeedbackRequest,
    user: CurrentUser,
    feedback_service: FeedbackService = Depends(get_feedback_service),
) -> Dict[str, Any]:
    """Submit user feedback about the product.

    Feedback is stored for product improvement analysis.
    Category defaults to 'general' if not specified.
    Context is optional and can include page_url, feature_used, etc.
    """
    user_id = user["id"]

    result = await feedback_service.submit_feedback(
        user_id=user_id,
        content=request.content,
        category=request.category.value if request.category else "general",
        context=request.context,
    )

    # Verify response contains required fields (security check)
    assert result is not None, "Feedback submission returned None"
    assert "feedback_id" in result, "Response missing feedback_id"

    return ok(result)


# TODO (Post-MVP): Add rate limiting for feedback submissions
# - Implement: 10 submissions per hour per user
# - Prevents spam/abuse without blocking legitimate users
# - Pattern: Use Redis or in-memory rate limiter decorator
# - See Story 7.1 for similar rate limiting pattern

# TODO (Post-MVP): Add admin endpoints for feedback management
# - GET /admin/feedback - List with filters (category, date range)
# - GET /admin/feedback/stats - Aggregate statistics
