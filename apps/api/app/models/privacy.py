"""Privacy models for data summary and account deletion endpoints."""

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class DeleteReason(str, Enum):
    """Optional reason for account deletion (product feedback)."""

    NO_LONGER_NEEDED = "no_longer_needed"
    SWITCHING_SERVICE = "switching_service"
    PRIVACY_CONCERNS = "privacy_concerns"
    TOO_EXPENSIVE = "too_expensive"
    NOT_USEFUL = "not_useful"
    OTHER = "other"


# ============================================================================
# Data Summary Models
# ============================================================================


class ProfileStorageInfo(BaseModel):
    """Information about stored profile data."""

    stored: bool = True
    fields: List[str] = Field(
        default=["email", "full_name", "subscription_tier", "preferences"]
    )
    location: str = "Supabase PostgreSQL (encrypted at rest)"


class ResumeStorageInfo(BaseModel):
    """Information about stored resume data."""

    count: int
    max_resumes: int = 5
    at_limit: bool = False
    storage: str = "Supabase Storage (encrypted)"
    includes: List[str] = Field(default=["PDF files", "parsed text data"])


class JobStatusBreakdown(BaseModel):
    """Breakdown of jobs by status."""

    saved: int = 0
    applied: int = 0
    interviewing: int = 0
    offered: int = 0
    rejected: int = 0
    accepted: int = 0


class JobStorageInfo(BaseModel):
    """Information about stored job data."""

    count: int
    storage: str = "Supabase PostgreSQL"
    status_breakdown: JobStatusBreakdown


class UsageOperationBreakdown(BaseModel):
    """Breakdown of usage events by operation type."""

    match: int = 0
    cover_letter: int = 0
    answer: int = 0
    outreach: int = 0
    resume_parse: int = 0


class UsageHistoryStorageInfo(BaseModel):
    """Information about stored usage history."""

    count: int
    storage: str = "Supabase PostgreSQL"
    includes: List[str] = Field(
        default=["operation type", "timestamp", "no content stored"]
    )
    breakdown: UsageOperationBreakdown


class AIGeneratedContentInfo(BaseModel):
    """Information about AI-generated content (always ephemeral)."""

    stored: bool = False
    note: str = "AI outputs are never saved to our servers"


class DataSummary(BaseModel):
    """Complete summary of all user data stored."""

    profile: ProfileStorageInfo
    resumes: ResumeStorageInfo
    jobs: JobStorageInfo
    usage_history: UsageHistoryStorageInfo
    ai_generated_content: AIGeneratedContentInfo = Field(
        default_factory=AIGeneratedContentInfo
    )
    data_retention: str = "Data retained until you delete your account"
    export_available: bool = False
    export_note: str = "Data export feature coming in future update (GDPR compliance)"


# ============================================================================
# Delete Request Models
# ============================================================================


class DeleteRequestRequest(BaseModel):
    """Request to initiate account deletion."""

    reason: Optional[DeleteReason] = Field(
        default=None, description="Optional reason for deletion (product feedback)"
    )


class DeleteRequestResponse(BaseModel):
    """Response from delete request initiation."""

    message: str = "Confirmation email sent. Please check your inbox."
    email_sent_to: str = Field(..., description="Masked email address")
    expires_in: str = "24 hours"
    deletion_initiated_at: str = Field(..., description="ISO datetime of request")


# ============================================================================
# Confirm Delete Models
# ============================================================================


class ConfirmDeleteRequest(BaseModel):
    """Request to confirm account deletion with token."""

    token: str = Field(
        ..., min_length=32, description="Deletion confirmation token from email"
    )


class ConfirmDeleteResponse(BaseModel):
    """Response from successful account deletion."""

    message: str = "Your account and all data have been permanently deleted."
    deleted_at: str = Field(..., description="ISO datetime of deletion")


# ============================================================================
# Cancel Delete Models
# ============================================================================


class CancelDeleteResponse(BaseModel):
    """Response from canceling pending deletion."""

    message: str = "Pending deletion has been cancelled. Your account remains active."
    cancelled_at: str = Field(..., description="ISO datetime of cancellation")
