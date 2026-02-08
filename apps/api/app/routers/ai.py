"""AI router - AI-powered analysis endpoints."""

import logging

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.core.deps import CurrentUser
from app.models.ai import (
    AnswerRequest,
    AnswerResponse,
    CoverLetterPDFRequest,
    CoverLetterRequest,
    CoverLetterResponse,
    ExtractJobRequest,
    ExtractJobResponse,
    MatchAnalysisRequest,
    MatchAnalysisResponse,
    OutreachRequest,
    OutreachResponse,
)
from app.models.base import ok
from app.services.answer_service import AnswerService
from app.services.cover_letter_service import CoverLetterService
from app.services.match_service import MatchService
from app.services.extract_job_service import ExtractJobService
from app.services.outreach_service import OutreachService
from app.services.pdf_service import PDFService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai")


def get_match_service() -> MatchService:
    """Dependency to get match service instance."""
    return MatchService()


def get_cover_letter_service() -> CoverLetterService:
    """Dependency to get cover letter service instance."""
    return CoverLetterService()


def get_pdf_service() -> PDFService:
    """Dependency to get PDF service instance."""
    return PDFService()


def get_answer_service() -> AnswerService:
    """Dependency to get answer service instance."""
    return AnswerService()


def get_outreach_service() -> OutreachService:
    """Dependency to get outreach service instance."""
    return OutreachService()


def get_extract_job_service() -> ExtractJobService:
    """Dependency to get extract job service instance."""
    return ExtractJobService()


@router.post("/match")
async def generate_match_analysis(
    request: MatchAnalysisRequest,
    user: CurrentUser,
    match_service: MatchService = Depends(get_match_service),
) -> dict:
    """Generate AI match analysis between resume and job.

    Analyzes how well the user's resume matches the specified job posting.
    Returns a match score, strengths, gaps, and recommendations.

    Provider Resolution:
    1. `ai_provider` in request (highest priority)
    2. User's `preferred_ai_provider` from profile
    3. System default: Claude

    Args:
        request: Match analysis request with job_id and optional resume_id/ai_provider.
        user: Authenticated user from dependency.
        match_service: Match service instance.

    Returns:
        Match analysis with score, strengths, gaps, recommendations, and provider used.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        VALIDATION_ERROR (400): No resume selected or other validation issue.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
        CREDIT_EXHAUSTED (422): User has no remaining credits.
        AI_PROVIDER_UNAVAILABLE (503): Both AI providers failed.
    """
    user_id = user["id"]

    analysis = await match_service.generate_match_analysis(
        user_id=user_id,
        job_id=str(request.job_id),
        resume_id=str(request.resume_id) if request.resume_id else None,
        ai_provider=request.ai_provider,
    )

    # Validate response with Pydantic model
    response_data = MatchAnalysisResponse(**analysis)

    return ok(response_data.model_dump())



@router.post("/cover-letter")
async def generate_cover_letter(
    request: CoverLetterRequest,
    user: CurrentUser,
    cover_letter_service: CoverLetterService = Depends(get_cover_letter_service),
) -> dict:
    """Generate AI-powered cover letter for a job application.

    Creates a tailored cover letter based on the user's resume and the job description,
    with customizable tone and optional user instructions.

    Tone Options:
    - confident: Assertive, achievement-focused, use metrics
    - friendly: Warm, personable, authentic
    - enthusiastic: Energetic, passionate, shows motivation
    - professional: Balanced, formal, traditional (default)
    - executive: Strategic, leadership-focused, high-level

    Provider Resolution:
    1. `ai_provider` in request (highest priority)
    2. User's `preferred_ai_provider` from profile
    3. System default: Claude

    Args:
        request: Cover letter request with job_id, tone, and optional parameters.
        user: Authenticated user from dependency.
        cover_letter_service: Cover letter service instance.

    Returns:
        Generated cover letter content, AI provider used, and token count.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        VALIDATION_ERROR (400): Invalid tone, no resume selected, or other validation issue.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
        CREDIT_EXHAUSTED (422): User has no remaining credits.
        AI_PROVIDER_UNAVAILABLE (503): Both AI providers failed.
    """
    user_id = user["id"]

    cover_letter = await cover_letter_service.generate_cover_letter(
        user_id=user_id,
        job_id=str(request.job_id),
        resume_id=str(request.resume_id) if request.resume_id else None,
        tone=request.tone,
        custom_instructions=request.custom_instructions,
        feedback=request.feedback,
        previous_content=request.previous_content,
        ai_provider=request.ai_provider,
    )

    # Validate response with Pydantic model
    response_data = CoverLetterResponse(**cover_letter)

    return ok(response_data.model_dump())


@router.post("/cover-letter/pdf")
async def export_cover_letter_pdf(
    request: CoverLetterPDFRequest,
    user: CurrentUser,
    pdf_service: PDFService = Depends(get_pdf_service),
) -> Response:
    """Export cover letter as a professionally formatted PDF.

    Converts cover letter text into a PDF document with professional formatting:
    - Standard letter size (8.5" x 11")
    - 1-inch margins
    - Professional serif font (Times New Roman, 12pt)
    - Proper paragraph spacing
    - Current date at top

    Note: This endpoint does NOT count against usage balance.

    Args:
        request: PDF request with cover letter content and optional filename.
        user: Authenticated user from dependency.
        pdf_service: PDF service instance.

    Returns:
        PDF file as binary response with Content-Disposition header.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        VALIDATION_ERROR (400): Empty content.
    """
    # Generate PDF
    pdf_bytes = pdf_service.generate_cover_letter_pdf(
        content=request.content,
        file_name=request.file_name,
    )

    # Sanitize filename for safe download
    sanitized_filename = pdf_service._sanitize_filename(request.file_name)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{sanitized_filename}.pdf"'
        },
    )


@router.post("/answer")
async def generate_answer(
    request: AnswerRequest,
    user: CurrentUser,
    answer_service: AnswerService = Depends(get_answer_service),
) -> dict:
    """Generate AI-powered answer to an application question.

    Creates a tailored answer based on the user's resume and the job description,
    with configurable length and optional regeneration with feedback.

    Length Options:
    - 150: Short - Brief, direct response
    - 300: Medium - Concise with one supporting point
    - 500: Standard - 2-3 supporting points (default)
    - 1000: Detailed - With examples and context

    Provider Resolution:
    1. `ai_provider` in request (highest priority)
    2. User's `preferred_ai_provider` from profile
    3. System default: Claude

    Args:
        request: Answer request with job_id, question, and optional parameters.
        user: Authenticated user from dependency.
        answer_service: Answer service instance.

    Returns:
        Generated answer content, AI provider used, and token count.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        VALIDATION_ERROR (400): Invalid max_length, no resume selected, or other validation issue.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
        CREDIT_EXHAUSTED (422): User has no remaining credits.
        AI_PROVIDER_UNAVAILABLE (503): Both AI providers failed.
    """
    user_id = user["id"]

    answer = await answer_service.generate_answer(
        user_id=user_id,
        job_id=str(request.job_id),
        question=request.question,
        resume_id=str(request.resume_id) if request.resume_id else None,
        max_length=request.max_length,
        feedback=request.feedback,
        previous_content=request.previous_content,
        ai_provider=request.ai_provider,
    )

    # Validate response with Pydantic model
    response_data = AnswerResponse(**answer)

    return ok(response_data.model_dump())


@router.post("/outreach")
async def generate_outreach(
    request: OutreachRequest,
    user: CurrentUser,
    outreach_service: OutreachService = Depends(get_outreach_service),
) -> dict:
    """Generate AI-powered outreach message for a recruiter or hiring manager.

    Creates a tailored outreach message based on the user's resume and job description,
    adapting to the recipient type and platform constraints.

    Recipient Types:
    - recruiter: Professional, concise, highlights relevant experience
    - hiring_manager: Technical depth, shows understanding of challenges
    - referral: Warmer tone, asks for guidance/introduction

    Platforms:
    - linkedin: Max 300 characters, punchy and professional
    - email: Full email with subject line, 150-300 words
    - twitter: Max 280 characters, casual professional

    Provider Resolution:
    1. `ai_provider` in request (highest priority)
    2. User's `preferred_ai_provider` from profile
    3. System default: Claude

    Args:
        request: Outreach request with job_id, recipient_type, platform, and optional parameters.
        user: Authenticated user from dependency.
        outreach_service: Outreach service instance.

    Returns:
        Generated outreach message content, AI provider used, and token count.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        VALIDATION_ERROR (400): Invalid recipient_type/platform, no resume selected, or other validation issue.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
        CREDIT_EXHAUSTED (422): User has no remaining credits.
        AI_PROVIDER_UNAVAILABLE (503): Both AI providers failed.
    """
    user_id = user["id"]

    outreach = await outreach_service.generate_outreach(
        user_id=user_id,
        job_id=str(request.job_id),
        recipient_type=request.recipient_type,
        platform=request.platform,
        resume_id=str(request.resume_id) if request.resume_id else None,
        recipient_name=request.recipient_name,
        feedback=request.feedback,
        previous_content=request.previous_content,
        ai_provider=request.ai_provider,
    )

    # Validate response with Pydantic model
    response_data = OutreachResponse(**outreach)

    return ok(response_data.model_dump())


@router.post("/extract-job")
async def extract_job(
    request: ExtractJobRequest,
    user: CurrentUser,
    extract_service: ExtractJobService = Depends(get_extract_job_service),
) -> dict:
    """Extract job data from HTML using AI.

    LLM-based extraction fallback used when CSS/JSON-LD scanning yields
    incomplete data. Rate limited to 50 requests per user per day.
    No credit cost (infrastructure, not user-facing AI feature).

    Args:
        request: Extract job request with HTML content and source URL.
        user: Authenticated user from dependency.
        extract_service: Extract job service instance.

    Returns:
        Extracted job fields (title, company, description, location, salary, employment_type).

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        RATE_LIMITED (429): Daily extraction limit exceeded.
        AI_PROVIDER_UNAVAILABLE (503): Both AI providers failed.
    """
    user_id = user["id"]

    result = await extract_service.extract_job(
        user_id=user_id,
        html_content=request.html_content,
        source_url=request.source_url,
        partial_data=request.partial_data,
    )

    response_data = ExtractJobResponse(**result)
    return ok(response_data.model_dump())
