"""Resume router - resume upload and management endpoints."""

import logging

from fastapi import APIRouter, Depends, File, UploadFile
from uuid import UUID

from app.core.deps import CurrentUser
from app.core.exceptions import ApiException, ErrorCode, ResumeNotFoundError
from app.models.base import ok, paginated
from app.models.resume import ParsedResumeData, ResumeListItem, ResumeDetailResponse
from app.services.resume_service import ResumeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resumes")

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_CONTENT_TYPES = ["application/pdf"]


def get_resume_service() -> ResumeService:
    """Dependency to get resume service instance."""
    return ResumeService()


@router.post("")
async def upload_resume(
    user: CurrentUser,
    file: UploadFile = File(...),
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """Upload and parse a resume.

    Accepts PDF files up to 10MB. Extracts text and parses using AI
    (Claude primary, GPT fallback). Credits are consumed only on
    successful parse.

    Args:
        user: Authenticated user from dependency.
        file: Uploaded PDF file.
        resume_service: Resume service instance.

    Returns:
        Created resume with parsed data and ai_provider_used.

    Raises:
        VALIDATION_ERROR (400): File is not PDF or exceeds 10MB.
        AUTH_REQUIRED (401): No authentication token.
        CREDIT_EXHAUSTED (422): User has no credits remaining.
        RESUME_LIMIT_REACHED (422): User has 5 resumes already.
    """
    user_id = user["id"]

    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        logger.warning(
            f"Invalid file type: {file.content_type} from user {user_id[:8]}..."
        )
        raise ApiException(
            code=ErrorCode.VALIDATION_ERROR,
            message="Only PDF files are allowed",
            status_code=400,
            details={"content_type": file.content_type},
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        logger.warning(
            f"File too large: {len(content)} bytes from user {user_id[:8]}..."
        )
        raise ApiException(
            code=ErrorCode.VALIDATION_ERROR,
            message="File size exceeds 10MB limit",
            status_code=400,
            details={"size_bytes": len(content), "max_bytes": MAX_FILE_SIZE},
        )

    # Upload and parse resume
    result = await resume_service.upload_resume(
        user_id=user_id,
        file_content=content,
        file_name=file.filename or "resume.pdf",
    )

    return ok(result)


@router.get("")
async def list_resumes(
    user: CurrentUser,
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """List all resumes for the authenticated user.

    Returns paginated list of resumes sorted by created_at descending.
    The is_active field is computed based on profile.active_resume_id.

    Args:
        user: Authenticated user from dependency.
        resume_service: Resume service instance.

    Returns:
        Paginated list of resumes with computed is_active field.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
    """
    user_id = user["id"]

    resumes = await resume_service.list_resumes(user_id)

    # Convert to ResumeListItem models for response validation
    items = [ResumeListItem(**resume) for resume in resumes]

    return paginated(items=[item.model_dump() for item in items], total=len(items), page=1, page_size=50)


@router.get("/{resume_id}")
async def get_resume(
    resume_id: UUID,
    user: CurrentUser,
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """Get detailed resume information with download URL.

    Args:
        resume_id: Resume UUID.
        user: Authenticated user from dependency.
        resume_service: Resume service instance.

    Returns:
        Full resume details including parsed_data and signed download URL.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    resume = await resume_service.get_resume(user_id, str(resume_id))

    if not resume:
        logger.warning(f"Resume {resume_id} not found for user {user_id[:8]}...")
        raise ResumeNotFoundError()

    # Generate signed download URL
    download_url = await resume_service.get_signed_download_url(resume["file_path"])

    # Build response with download URL
    response_data = {
        **resume,
        "download_url": download_url,
    }

    # Validate with Pydantic model
    detail_response = ResumeDetailResponse(**response_data)

    return ok(detail_response.model_dump())


@router.patch("/{resume_id}/parsed-data")
async def update_resume_parsed_data(
    resume_id: UUID,
    body: ParsedResumeData,
    user: CurrentUser,
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """Update resume parsed data.

    Accepts full ParsedResumeData JSON body. Overwrites entire parsed_data column.

    Args:
        resume_id: Resume UUID.
        body: ParsedResumeData to save.
        user: Authenticated user from dependency.
        resume_service: Resume service instance.

    Returns:
        Updated resume details with download URL.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    validated_data = body.model_dump(exclude_none=True)

    updated_resume = await resume_service.update_parsed_data(
        user_id, str(resume_id), validated_data
    )

    if not updated_resume:
        logger.warning(f"Resume {resume_id} not found for user {user_id[:8]}...")
        raise ResumeNotFoundError()

    # Generate signed download URL for consistency with GET endpoint
    download_url = await resume_service.get_signed_download_url(
        updated_resume["file_path"]
    )

    response_data = {
        **updated_resume,
        "download_url": download_url,
    }

    detail_response = ResumeDetailResponse(**response_data)

    return ok(detail_response.model_dump())


@router.put("/{resume_id}/active")
async def set_active_resume(
    resume_id: UUID,
    user: CurrentUser,
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """Set a resume as the user's active resume.

    Args:
        resume_id: Resume UUID to set as active.
        user: Authenticated user from dependency.
        resume_service: Resume service instance.

    Returns:
        Success message with active_resume_id.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    success = await resume_service.set_active_resume(user_id, str(resume_id))

    if not success:
        logger.warning(f"Resume {resume_id} not found for user {user_id[:8]}...")
        raise ResumeNotFoundError()

    logger.info(f"User {user_id[:8]}... set resume {resume_id} as active")

    return ok({
        "message": "Resume set as active",
        "active_resume_id": str(resume_id),
    })


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: UUID,
    user: CurrentUser,
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """Delete a resume and its storage file.

    If the resume is currently active, clears the active_resume_id.

    Args:
        resume_id: Resume UUID to delete.
        user: Authenticated user from dependency.
        resume_service: Resume service instance.

    Returns:
        Success message confirming deletion.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        RESUME_NOT_FOUND (404): Resume doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    success = await resume_service.delete_resume(user_id, str(resume_id))

    if not success:
        logger.warning(f"Resume {resume_id} not found for user {user_id[:8]}...")
        raise ResumeNotFoundError()

    logger.info(f"User {user_id[:8]}... deleted resume {resume_id}")

    return ok({"message": "Resume deleted successfully"})
