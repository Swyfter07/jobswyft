"""Autofill router - Data aggregation for form autofill."""

import logging

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser
from app.models.autofill import AutofillDataResponse
from app.models.base import ok
from app.services.autofill_service import AutofillService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/autofill")


def get_autofill_service() -> AutofillService:
    """Dependency to get autofill service instance."""
    return AutofillService()


@router.get("/data")
async def get_autofill_data(
    user: CurrentUser,
    autofill_service: AutofillService = Depends(get_autofill_service),
) -> dict:
    """Retrieve user data for form autofill.

    Returns personal information extracted from the user's active resume
    (with profile fallbacks) and a signed download URL for the resume PDF.

    Data Sources:
    - Personal data: Resume parsed_data.contact → Profile fields → None
    - Resume: Active resume with signed download URL (1 hour expiry)

    Response includes placeholders for future features:
    - work_authorization (currently null)
    - salary_expectation (currently null)

    Args:
        user: Authenticated user from dependency.
        autofill_service: Autofill service instance.

    Returns:
        Autofill data containing personal info, resume data, and placeholders.

    Raises:
        AUTH_REQUIRED (401): No authentication token.
    """
    user_id = user["id"]

    data = await autofill_service.get_autofill_data(user_id=user_id)

    # Validate response with Pydantic model
    response_data = AutofillDataResponse(**data)

    return ok(response_data.model_dump())
