"""Usage models for credit tracking endpoints."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class UsageByType(BaseModel):
    """Breakdown of credits used by operation type."""

    match: int = 0
    cover_letter: int = 0
    answer: int = 0
    outreach: int = 0
    resume_parse: int = 0
    referral_bonus: int = 0

    @field_validator("match", "cover_letter", "answer", "outreach", "resume_parse")
    @classmethod
    def validate_non_negative(cls, v: int) -> int:
        """Ensure operation type credits are non-negative."""
        if v < 0:
            raise ValueError("Operation type credits cannot be negative")
        return v


class UsageResponse(BaseModel):
    """Current usage balance response."""

    subscription_tier: str
    period_type: str
    period_key: str
    credits_used: int
    credits_limit: int  # -1 means unlimited
    credits_remaining: int  # -1 means unlimited
    usage_by_type: UsageByType
    subscription_status: str  # active, canceled, past_due, etc.
    current_period_end: str | None = None  # ISO datetime for monthly tiers
    pending_deletion_expires: str | None = None  # ISO datetime if deletion pending


class UsageEventItem(BaseModel):
    """Single usage event for history."""

    id: UUID
    operation_type: str
    ai_provider: Optional[str] = None
    credits_used: int
    period_type: str
    period_key: str
    created_at: datetime


class UsageHistoryResponse(BaseModel):
    """Paginated usage history response."""

    items: List[UsageEventItem]
    total: int
    page: int
    page_size: int
