"""Outreach message generation service for AI-powered recruiter/hiring manager messages."""

import hashlib
import logging
from typing import Any, Dict, Optional

from app.core.exceptions import (
    AIProviderUnavailableError,
    CreditExhaustedError,
    JobNotFoundError,
    ResumeNotFoundError,
    ValidationError,
)
from app.db.client import get_supabase_admin_client
from app.services.ai.factory import AIProviderFactory
from app.services.job_service import JobService
from app.services.resume_service import ResumeService
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)

UUID_LOG_LENGTH = 8

VALID_RECIPIENT_TYPES = ["recruiter", "hiring_manager", "referral"]
VALID_PLATFORMS = ["linkedin", "email", "twitter"]


def _hash_id(id_value: str) -> str:
    """Hash an ID for privacy-safe logging.

    Args:
        id_value: The ID to hash.

    Returns:
        First 8 characters of SHA256 hash.
    """
    return hashlib.sha256(id_value.encode()).hexdigest()[:UUID_LOG_LENGTH]


class OutreachService:
    """Service for generating AI outreach messages."""

    def __init__(self):
        """Initialize outreach service with dependencies."""
        self.admin_client = get_supabase_admin_client()
        self.usage_service = UsageService()
        self.job_service = JobService()
        self.resume_service = ResumeService()

    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile with AI preference and active resume.

        Args:
            user_id: User's UUID.

        Returns:
            Profile data dictionary.

        Raises:
            Exception: Re-raised as-is for database connection errors.
        """
        try:
            response = (
                self.admin_client.table("profiles")
                .select("active_resume_id, preferred_ai_provider")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data if response and response.data else {}
        except Exception as e:
            logger.error(f"Database error fetching user profile: {e}")
            raise  # Re-raise to be handled by exception handler

    async def generate_outreach(
        self,
        user_id: str,
        job_id: str,
        recipient_type: str,
        platform: str,
        resume_id: Optional[str] = None,
        recipient_name: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
        ai_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate AI outreach message for a recruiter or hiring manager.

        Args:
            user_id: User's UUID.
            job_id: Job's UUID.
            recipient_type: Type of recipient (recruiter, hiring_manager, referral).
            platform: Target platform (linkedin, email, twitter).
            resume_id: Optional resume UUID (uses active resume if not provided).
            recipient_name: Optional recipient name for personalized greeting.
            feedback: Optional feedback for regeneration.
            previous_content: Previous message (required with feedback).
            ai_provider: Optional AI provider override ("claude" or "gpt").

        Returns:
            Dictionary with content, ai_provider_used, and tokens_used.

        Raises:
            CreditExhaustedError: If user has no credits.
            ValidationError: If validation fails.
            ResumeNotFoundError: If resume not found or belongs to another user.
            JobNotFoundError: If job not found or belongs to another user.
            AIProviderUnavailableError: If both AI providers fail.
        """
        # Step 1: Validate recipient_type
        if recipient_type not in VALID_RECIPIENT_TYPES:
            logger.warning(f"Invalid recipient_type provided: {recipient_type}")
            raise ValidationError(
                f"Invalid recipient_type. Must be one of: {', '.join(VALID_RECIPIENT_TYPES)}"
            )

        # Step 2: Validate platform
        if platform not in VALID_PLATFORMS:
            logger.warning(f"Invalid platform provided: {platform}")
            raise ValidationError(
                f"Invalid platform. Must be one of: {', '.join(VALID_PLATFORMS)}"
            )

        # Step 3: Validate feedback/previous_content
        if feedback and not previous_content:
            logger.warning("Feedback provided without previous_content")
            raise ValidationError("previous_content required when providing feedback")

        if feedback and len(feedback) > 2000:
            logger.warning(f"Feedback too long: {len(feedback)} chars")
            raise ValidationError("Feedback too long. Maximum 2000 characters.")

        if previous_content and len(previous_content) > 5000:
            logger.warning(f"Previous content too long: {len(previous_content)} chars")
            raise ValidationError("previous_content too long. Maximum 5000 characters.")

        # Step 4: Check credits (fail fast before expensive operations)
        has_credits = await self.usage_service.check_credits(user_id)
        if not has_credits:
            logger.warning(
                f"User {_hash_id(user_id)}... has no credits for outreach generation"
            )
            raise CreditExhaustedError()

        # Step 5: Validate and fetch resume (before getting profile)
        # Resolve resume ID first
        if resume_id:
            effective_resume_id = resume_id
        else:
            # Get active resume from profile only if not provided
            profile = await self._get_user_profile(user_id)
            effective_resume_id = profile.get("active_resume_id")

        if not effective_resume_id:
            logger.warning(f"User {_hash_id(user_id)}... has no resume selected")
            raise ValidationError("No resume selected. Upload or select a resume first.")

        resume = await self.resume_service.get_resume(user_id, effective_resume_id)
        if not resume:
            logger.warning(
                f"Resume {_hash_id(effective_resume_id)} not found for user {_hash_id(user_id)}..."
            )
            raise ResumeNotFoundError()

        # Check if resume has parsed data
        parsed_data = resume.get("parsed_data")
        if not parsed_data:
            logger.warning(
                f"Resume {_hash_id(effective_resume_id)} has no parsed data for user {_hash_id(user_id)}..."
            )
            raise ValidationError("Resume has not been parsed. Please re-upload your resume.")

        # Step 6: Validate and fetch job
        job = await self.job_service.get_job(user_id, job_id)
        if not job:
            logger.warning(
                f"Job {_hash_id(job_id)} not found for user {_hash_id(user_id)}..."
            )
            raise JobNotFoundError()

        job_description = job.get("description", "").strip()
        if not job_description:
            logger.warning(f"Job {_hash_id(job_id)} has no description")
            raise ValidationError("Job has no description to analyze.")

        # Step 7: Get user AI preference (only after resource validation)
        if not resume_id:
            # We already fetched profile above for active_resume_id
            user_preference = profile.get("preferred_ai_provider")
        else:
            # Fetch profile now for AI preference only
            profile = await self._get_user_profile(user_id)
            user_preference = profile.get("preferred_ai_provider")

        # Step 8: Generate outreach with AI
        try:
            logger.info(
                f"Outreach generation - user: {_hash_id(user_id)}..., "
                f"job: {_hash_id(job_id)}..., "
                f"recipient_type: {recipient_type}, "
                f"platform: {platform}, "
                f"provider: {ai_provider or user_preference or 'claude'}"
            )
            content, tokens_used, provider_used = await AIProviderFactory.outreach_with_fallback(
                resume_data=parsed_data,
                job_description=job_description,
                recipient_type=recipient_type,
                platform=platform,
                recipient_name=recipient_name,
                feedback=feedback,
                previous_content=previous_content,
                preferred_provider=ai_provider,
                user_preference=user_preference,
            )
        except ValueError as e:
            logger.error(f"All AI providers failed for outreach generation: {e}")
            raise AIProviderUnavailableError() from e

        # Step 9: Record usage AFTER successful AI call
        await self.usage_service.record_usage(
            user_id=user_id,
            operation_type="outreach",
            ai_provider=provider_used,
            credits_used=1,
        )

        # Step 10: Return outreach with provider info
        return {
            "content": content,
            "ai_provider_used": provider_used,
            "tokens_used": tokens_used,
        }
