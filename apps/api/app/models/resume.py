"""Resume Pydantic models."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ExperienceItem(BaseModel):
    """Work experience entry."""

    title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class EducationItem(BaseModel):
    """Education entry."""

    degree: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None


class ContactInfo(BaseModel):
    """Contact information extracted from resume."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None


class ParsedResumeData(BaseModel):
    """Structured data extracted from resume by AI."""

    contact: Optional[ContactInfo] = None
    summary: Optional[str] = None
    experience: Optional[List[ExperienceItem]] = None
    education: Optional[List[EducationItem]] = None
    skills: Optional[List[str]] = None


class ResumeResponse(BaseModel):
    """Resume response model for API."""

    id: str
    user_id: str
    file_name: str
    file_path: str
    parsed_data: Optional[ParsedResumeData] = None
    parse_status: str
    created_at: datetime
    updated_at: datetime


class ResumeUploadResponse(BaseModel):
    """Response for resume upload endpoint."""

    resume: ResumeResponse
    ai_provider_used: Optional[str] = None


class ResumeListItem(BaseModel):
    """Resume list item for list endpoint."""

    id: str
    file_name: str
    is_active: bool
    parse_status: str
    created_at: datetime
    updated_at: datetime


class ResumeDetailResponse(BaseModel):
    """Detailed resume response with download URL."""

    id: str
    file_name: str
    file_path: str
    is_active: bool
    parse_status: str
    parsed_data: Optional[ParsedResumeData] = None
    download_url: str
    created_at: datetime
    updated_at: datetime
