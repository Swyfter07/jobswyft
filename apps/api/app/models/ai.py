"""Pydantic models for AI endpoints."""

from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class MatchAnalysisRequest(BaseModel):
    """Request model for POST /v1/ai/match."""

    job_id: UUID
    resume_id: Optional[UUID] = None
    ai_provider: Optional[Literal["claude", "gpt"]] = Field(
        default=None,
        description="AI provider to use: 'claude' or 'gpt'. Overrides user preference.",
    )


class MatchAnalysisResponse(BaseModel):
    """Response model for match analysis result."""

    match_score: int = Field(..., ge=0, le=100, description="Match score 0-100")
    strengths: list[str] = Field(..., description="List of matching qualifications")
    gaps: list[str] = Field(..., description="List of missing requirements")
    recommendations: list[str] = Field(..., description="Actionable suggestions")
    ai_provider_used: str = Field(..., description="AI provider that generated the analysis")



class CoverLetterRequest(BaseModel):
    """Request model for POST /v1/ai/cover-letter."""

    job_id: UUID
    resume_id: Optional[UUID] = None
    tone: Literal["confident", "friendly", "enthusiastic", "professional", "executive"] = "professional"
    custom_instructions: Optional[str] = Field(None, max_length=500)
    feedback: Optional[str] = Field(None, max_length=2000)
    previous_content: Optional[str] = Field(None, max_length=5000)
    ai_provider: Optional[Literal["claude", "gpt"]] = None

    @model_validator(mode="after")
    def validate_feedback_requires_previous(self):
        """Validate that previous_content is provided when feedback is given."""
        if self.feedback and not self.previous_content:
            raise ValueError("previous_content required when providing feedback")
        return self


class CoverLetterResponse(BaseModel):
    """Response model for cover letter generation result."""

    content: str = Field(..., description="Generated cover letter text")
    ai_provider_used: str = Field(..., description="AI provider that generated the letter")
    tokens_used: int = Field(..., description="Approximate tokens used in generation")


class CoverLetterPDFRequest(BaseModel):
    """Request model for POST /v1/ai/cover-letter/pdf."""

    content: str = Field(..., min_length=1, description="Cover letter content to convert to PDF")
    file_name: Optional[str] = Field(None, description="Optional filename for the PDF")


class AnswerRequest(BaseModel):
    """Request model for POST /v1/ai/answer."""

    job_id: UUID
    resume_id: Optional[UUID] = None
    question: str = Field(..., min_length=1, max_length=2000)
    max_length: Literal[150, 300, 500, 1000] = 500
    feedback: Optional[str] = Field(None, max_length=2000)
    previous_content: Optional[str] = Field(None, max_length=5000)
    ai_provider: Optional[Literal["claude", "gpt"]] = None

    @model_validator(mode="after")
    def validate_feedback_requires_previous(self):
        """Validate that previous_content is provided when feedback is given."""
        if self.feedback and not self.previous_content:
            raise ValueError("previous_content required when providing feedback")
        return self


class AnswerResponse(BaseModel):
    """Response model for answer generation result."""

    content: str = Field(..., description="Generated answer text")
    ai_provider_used: str = Field(..., description="AI provider that generated the answer")
    tokens_used: int = Field(..., description="Approximate tokens used in generation")


class OutreachRequest(BaseModel):
    """Request model for POST /v1/ai/outreach."""

    job_id: UUID
    resume_id: Optional[UUID] = None
    recipient_type: Literal["recruiter", "hiring_manager", "referral"]
    platform: Literal["linkedin", "email", "twitter"]
    recipient_name: Optional[str] = Field(None, max_length=100)
    feedback: Optional[str] = Field(None, max_length=2000)
    previous_content: Optional[str] = Field(None, max_length=5000)
    ai_provider: Optional[Literal["claude", "gpt"]] = None

    @model_validator(mode="after")
    def validate_feedback_requires_previous(self):
        """Validate that previous_content is provided when feedback is given."""
        if self.feedback and not self.previous_content:
            raise ValueError("previous_content required when providing feedback")
        return self


class OutreachResponse(BaseModel):
    """Response model for outreach generation result."""

    content: str = Field(..., description="Generated outreach message text")
    ai_provider_used: str = Field(..., description="AI provider that generated the message")
    tokens_used: int = Field(..., description="Approximate tokens used in generation")


class PartialJobData(BaseModel):
    """Typed partial job data for extraction context."""

    title: Optional[str] = Field(default=None, max_length=500)
    company: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=10000)
    location: Optional[str] = Field(default=None, max_length=500)
    salary: Optional[str] = Field(default=None, max_length=200)
    employment_type: Optional[str] = Field(default=None, max_length=100)


class ExtractJobRequest(BaseModel):
    """Request model for POST /v1/ai/extract-job."""

    html_content: str = Field(..., min_length=1, max_length=8000)
    source_url: str = Field(..., min_length=1, max_length=2048)
    partial_data: Optional[PartialJobData] = Field(default=None)


class ExtractJobResponse(BaseModel):
    """Response model for job extraction result."""

    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    employment_type: Optional[str] = None
