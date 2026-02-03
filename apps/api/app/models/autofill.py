"""Pydantic models for autofill data."""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PersonalData(BaseModel):
    """Personal data extracted from resume and profile."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class ResumeData(BaseModel):
    """Resume data for autofill including download URL."""

    id: UUID
    file_name: Optional[str] = None
    download_url: Optional[str] = None
    parsed_summary: Optional[str] = None


class AutofillDataResponse(BaseModel):
    """Response model for autofill data endpoint."""

    personal: PersonalData
    resume: Optional[ResumeData] = None
    work_authorization: Optional[str] = None
    salary_expectation: Optional[str] = None
