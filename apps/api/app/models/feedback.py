"""Feedback models for user feedback submission endpoint."""

from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, field_validator


class FeedbackCategory(str, Enum):
    """Valid feedback categories."""

    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    GENERAL = "general"
    PRAISE = "praise"
    COMPLAINT = "complaint"


class FeedbackRequest(BaseModel):
    """Request to submit feedback."""

    content: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Feedback content (10-5000 characters)",
    )
    category: Optional[FeedbackCategory] = Field(
        default=FeedbackCategory.GENERAL,
        description="Feedback category",
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context (page_url, feature_used, browser, etc.)",
    )

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        """Validate content is not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError("Feedback content cannot be empty")
        return v.strip()


class FeedbackResponse(BaseModel):
    """Response after submitting feedback."""

    message: str = "Thank you for your feedback!"
    feedback_id: str = Field(..., description="Unique identifier for the submitted feedback")
