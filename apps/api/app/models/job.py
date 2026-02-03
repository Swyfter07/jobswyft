"""Job Pydantic models."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Job application status values."""

    saved = "saved"  # Initial state after scan (this story)
    applied = "applied"  # Story 5.2 - "Save Job" button
    interviewing = "interviewing"  # Story 5.2 - Status updates
    offered = "offered"  # Story 5.2 - Status updates
    rejected = "rejected"  # Story 5.2 - Status updates
    accepted = "accepted"  # Story 5.2 - Status updates


class JobCreateRequest(BaseModel):
    """Request model for POST /v1/jobs and POST /v1/jobs/scan."""

    title: str
    company: str
    description: str
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    source_url: Optional[str] = None
    status: Optional[JobStatus] = None  # Defaults to "saved" in service if not provided


class JobUpdateRequest(BaseModel):
    """Request model for PUT /v1/jobs/{id}.

    All fields optional for partial updates.
    """

    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    source_url: Optional[str] = None
    status: Optional[JobStatus] = None
    notes: Optional[str] = Field(None, max_length=10000)


class JobResponse(BaseModel):
    """Response model for job data."""

    id: str
    user_id: str
    title: str
    company: str
    description: str
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    source_url: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobListItem(BaseModel):
    """Item in paginated job list response."""

    id: str
    title: str
    company: str
    status: str
    notes_preview: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    """Response model for GET /v1/jobs with pagination."""

    items: list[JobListItem]
    total: int
    page: int
    page_size: int


class JobStatusUpdateRequest(BaseModel):
    """Request model for PUT /v1/jobs/{id}/status."""

    status: JobStatus


class JobNotesUpdateRequest(BaseModel):
    """Request model for PUT /v1/jobs/{id}/notes."""

    notes: str = Field(..., max_length=10000, description="Job notes (max 10,000 characters)")
