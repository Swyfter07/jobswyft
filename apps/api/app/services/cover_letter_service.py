"""Cover letter generation service for AI-powered cover letters."""

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

VALID_TONES = ["confident", "friendly", "enthusiastic", "professional", "executive"]


def _hash_id(id_value: str) -> str:
    """Hash an ID for privacy-safe logging.

    Args:
        id_value: The ID to hash.

    Returns:
        First 8 characters of SHA256 hash.
    """
    return hashlib.sha256(id_value.encode()).hexdigest()[:UUID_LOG_LENGTH]


class CoverLetterService:
    """Service for generating AI cover letters."""

    def __init__(self):
        """Initialize cover letter service with dependencies."""
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

    async def generate_cover_letter(
        self,
        user_id: str,
        job_id: str,
        resume_id: Optional[str] = None,
        tone: str = "professional",
        custom_instructions: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
        ai_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate AI cover letter for a job application.

        Args:
            user_id: User's UUID.
            job_id: Job's UUID.
            resume_id: Optional resume UUID (uses active resume if not provided).
            tone: Desired tone (confident, friendly, enthusiastic, professional, executive).
            custom_instructions: Optional user instructions to incorporate.
            feedback: Optional feedback for regeneration.
            previous_content: Previous cover letter (required with feedback).
            ai_provider: Optional AI provider override ("claude" or "gpt").

        Returns:
            Dictionary with content, ai_provider_used, and tokens_used.

        Raises:
            CreditExhaustedError: If user has no credits.
            ValidationError: If validation fails (invalid tone, missing resume, etc.).
            ResumeNotFoundError: If resume not found or belongs to another user.
            JobNotFoundError: If job not found or belongs to another user.
            AIProviderUnavailableError: If both AI providers fail.
        """
        # Step 1: Validate tone
        if tone not in VALID_TONES:
            logger.warning(f"Invalid tone provided: {tone}")
            raise ValidationError(
                f"Invalid tone. Must be one of: {', '.join(VALID_TONES)}"
            )

        # Step 2: Validate custom_instructions length
        if custom_instructions and len(custom_instructions) > 500:
            logger.warning(
                f"Custom instructions too long: {len(custom_instructions)} chars"
            )
            raise ValidationError(
                "Custom instructions too long. Maximum 500 characters."
            )

        # Step 3: Validate feedback/previous_content
        if feedback and not previous_content:
            logger.warning("Feedback provided without previous_content")
            raise ValidationError(
                "previous_content required when providing feedback"
            )

        if feedback and len(feedback) > 2000:
            logger.warning(f"Feedback too long: {len(feedback)} chars")
            raise ValidationError("Feedback too long. Maximum 2000 characters.")

        if previous_content and len(previous_content) > 5000:
            logger.warning(
                f"Previous content too long: {len(previous_content)} chars"
            )
            raise ValidationError(
                "previous_content too long. Maximum 5000 characters."
            )

        # Step 4: Check credits
        has_credits = await self.usage_service.check_credits(user_id)
        if not has_credits:
            logger.warning(
                f"User {_hash_id(user_id)}... has no credits for cover letter generation"
            )
            raise CreditExhaustedError()

        # Step 5: Get user profile for active resume and AI preference
        profile = await self._get_user_profile(user_id)
        user_preference = profile.get("preferred_ai_provider")

        # Step 6: Resolve resume ID
        effective_resume_id = resume_id or profile.get("active_resume_id")
        if not effective_resume_id:
            logger.warning(f"User {_hash_id(user_id)}... has no resume selected")
            raise ValidationError("No resume selected. Upload or select a resume first.")

        # Step 7: Validate and fetch resume
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

        # Step 8: Validate and fetch job
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

        # Step 9: Generate cover letter with AI
        try:
            logger.info(
                f"Cover letter generation - user: {_hash_id(user_id)}..., "
                f"job: {_hash_id(job_id)}..., "
                f"tone: {tone}, "
                f"provider: {ai_provider or user_preference or 'claude'}"
            )
            content, tokens_used, provider_used = await AIProviderFactory.cover_letter_with_fallback(
                resume_data=parsed_data,
                job_description=job_description,
                tone=tone,
                custom_instructions=custom_instructions,
                feedback=feedback,
                previous_content=previous_content,
                preferred_provider=ai_provider,
                user_preference=user_preference,
            )
        except ValueError as e:
            logger.error(f"All AI providers failed for cover letter generation: {e}")
            raise AIProviderUnavailableError() from e

        # Step 10: Record usage AFTER successful AI call
        await self.usage_service.record_usage(
            user_id=user_id,
            operation_type="cover_letter",
            ai_provider=provider_used,
            credits_used=1,
        )

        # Step 11: Return cover letter with provider info
        return {
            "content": content,
            "ai_provider_used": provider_used,
            "tokens_used": tokens_used,
        }
