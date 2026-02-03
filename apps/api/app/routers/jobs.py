"""Jobs router - job scan and management endpoints."""

import logging
from uuid import UUID

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.core.deps import CurrentUser
from app.core.exceptions import JobNotFoundError
from app.models.base import ok
from app.models.job import (
    JobCreateRequest,
    JobListResponse,
    JobNotesUpdateRequest,
    JobResponse,
    JobStatusUpdateRequest,
    JobUpdateRequest,
)
from app.services.job_service import JobService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs")


def get_job_service() -> JobService:
    """Dependency to get job service instance."""
    return JobService()


@router.post("/scan")
async def create_scanned_job(
    job_data: JobCreateRequest,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> JSONResponse:
    """Save a scanned job from the extension.

    Accepts job data extracted by the Chrome extension and saves
    it to the database with status 'saved'.

    Args:
        job_data: Validated job data from extension.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Created job with 201 status code.

    Raises:
        VALIDATION_ERROR (400): Missing required fields.
        AUTH_REQUIRED (401): No authentication token.
    """
    user_id = user["id"]

    job = await job_service.create_job(
        user_id=user_id,
        job_data=job_data.model_dump(),
    )

    # Validate response with Pydantic model
    response_data = JobResponse(**job)

    return JSONResponse(content=ok(response_data.model_dump(mode="json")), status_code=201)


@router.post("")
async def create_job(
    job_data: JobCreateRequest,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> JSONResponse:
    """Create a new job record.

    Used when manually saving a job as applied or with a specific status.
    This endpoint consolidates Epic 3's scan storage + Epic 5's save functionality.

    Args:
        job_data: Validated job data with optional status.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Created job with 201 status code.

    Raises:
        VALIDATION_ERROR (400): Missing required fields.
        AUTH_REQUIRED (401): No authentication token.
    """
    user_id = user["id"]

    # Convert to dict, handling enum values
    data = job_data.model_dump()
    if data.get("status") is not None:
        data["status"] = data["status"].value

    job = await job_service.create_job(
        user_id=user_id,
        job_data=data,
    )

    # Validate response with Pydantic model
    response_data = JobResponse(**job)

    return JSONResponse(content=ok(response_data.model_dump(mode="json")), status_code=201)


@router.get("")
async def list_jobs(
    user: CurrentUser,
    status: Optional[str] = Query(None, description="Filter by job status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort: str = Query("updated_at", description="Sort field"),
    job_service: JobService = Depends(get_job_service),
) -> dict:
    """List jobs with pagination and optional filtering.

    Args:
        user: Authenticated user from dependency.
        status: Optional status filter.
        page: Page number (1-indexed).
        page_size: Number of items per page.
        sort: Field to sort by.
        job_service: Job service instance.

    Returns:
        Paginated list of jobs with total count.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
    """
    user_id = user["id"]

    filters = {
        "status": status,
        "page": page,
        "page_size": page_size,
        "sort": sort,
    }

    result = await job_service.list_jobs(user_id, filters)

    # Validate response with Pydantic model
    response_data = JobListResponse(**result)

    return ok(response_data.model_dump())


@router.get("/{job_id}")
async def get_job(
    job_id: UUID,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> dict:
    """Get job details by ID.

    Args:
        job_id: Job UUID.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Full job details.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    job = await job_service.get_job(user_id, str(job_id))

    if not job:
        logger.warning(f"Job {job_id} not found for user {user_id[:8]}...")
        raise JobNotFoundError()

    # Validate response with Pydantic model
    response_data = JobResponse(**job)

    return ok(response_data.model_dump())


@router.put("/{job_id}")
async def update_job(
    job_id: UUID,
    job_data: JobUpdateRequest,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> dict:
    """Update job fields.

    Allows partial updates - only provided fields are modified.

    Args:
        job_id: Job UUID.
        job_data: Fields to update.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Updated job details.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    # Convert to dict, handling enum values
    updates = job_data.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value

    updated_job = await job_service.update_job(user_id, str(job_id), updates)

    if not updated_job:
        logger.warning(f"Job {job_id} not found for user {user_id[:8]}...")
        raise JobNotFoundError()

    # Validate response with Pydantic model
    response_data = JobResponse(**updated_job)

    return ok(response_data.model_dump())


@router.put("/{job_id}/status")
async def update_job_status(
    job_id: UUID,
    status_data: JobStatusUpdateRequest,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> dict:
    """Update job status.

    Args:
        job_id: Job UUID.
        status_data: New status value.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Updated job details.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
        VALIDATION_ERROR (400): Invalid status value.
    """
    user_id = user["id"]

    updated_job = await job_service.update_job_status(
        user_id, str(job_id), status_data.status.value
    )

    if not updated_job:
        logger.warning(f"Job {job_id} not found for user {user_id[:8]}...")
        raise JobNotFoundError()

    # Validate response with Pydantic model
    response_data = JobResponse(**updated_job)

    return ok(response_data.model_dump())


@router.delete("/{job_id}")
async def delete_job(
    job_id: UUID,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> dict:
    """Delete a job.

    Args:
        job_id: Job UUID.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Confirmation message.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    deleted = await job_service.delete_job(user_id, str(job_id))

    if not deleted:
        logger.warning(f"Job {job_id} not found for user {user_id[:8]}...")
        raise JobNotFoundError()

    return ok({"message": "Job deleted successfully"})


@router.put("/{job_id}/notes")
async def update_job_notes(
    job_id: UUID,
    notes_data: JobNotesUpdateRequest,
    user: CurrentUser,
    job_service: JobService = Depends(get_job_service),
) -> dict:
    """Update job notes.

    Args:
        job_id: Job UUID.
        notes_data: New notes content.
        user: Authenticated user from dependency.
        job_service: Job service instance.

    Returns:
        Updated job details.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
        JOB_NOT_FOUND (404): Job doesn't exist or belongs to another user.
    """
    user_id = user["id"]

    updated_job = await job_service.update_job_notes(
        user_id, str(job_id), notes_data.notes
    )

    if not updated_job:
        logger.warning(f"Job {job_id} not found for user {user_id[:8]}...")
        raise JobNotFoundError()

    # Validate response with Pydantic model
    response_data = JobResponse(**updated_job)

    return ok(response_data.model_dump())
