"""Match analysis service for AI-powered resume-job matching."""

import hashlib
import logging
from typing import Any, Dict, Optional

from app.core.exceptions import (
    AIProviderUnavailableError,
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


def _hash_id(id_value: str) -> str:
    """Hash an ID for privacy-safe logging.

    Args:
        id_value: The ID to hash.

    Returns:
        First 8 characters of SHA256 hash.
    """
    return hashlib.sha256(id_value.encode()).hexdigest()[:UUID_LOG_LENGTH]


class MatchService:
    """Service for generating AI match analysis between resumes and jobs."""

    def __init__(self):
        """Initialize match service with dependencies."""
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

    async def generate_match_analysis(
        self,
        user_id: str,
        job_id: str,
        resume_id: Optional[str] = None,
        ai_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate AI match analysis between a resume and job.

        Args:
            user_id: User's UUID.
            job_id: Job's UUID.
            resume_id: Optional resume UUID (uses active resume if not provided).
            ai_provider: Optional AI provider override ("claude" or "gpt").

        Returns:
            Match analysis dictionary with match_score, strengths, gaps,
            recommendations, and ai_provider_used.

        Raises:
            ValidationError: If no resume selected.
            ResumeNotFoundError: If resume not found or belongs to another user.
            JobNotFoundError: If job not found or belongs to another user.
            AIProviderUnavailableError: If both AI providers fail.
        """
        # Step 1: Get user profile for active resume and AI preference
        profile = await self._get_user_profile(user_id)
        user_preference = profile.get("preferred_ai_provider")

        # Step 2: Resolve resume ID
        effective_resume_id = resume_id or profile.get("active_resume_id")
        if not effective_resume_id:
            logger.warning(f"User {_hash_id(user_id)}... has no resume selected")
            raise ValidationError("No resume selected. Upload or select a resume first.")

        # Step 3: Validate and fetch resume
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

        # Step 4: Validate and fetch job
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

        # Validate job description length (max 10,000 chars to avoid AI API limits)
        max_description_length = 10000
        if len(job_description) > max_description_length:
            logger.warning(
                f"Job {_hash_id(job_id)} description too long: {len(job_description)} chars"
            )
            raise ValidationError(
                f"Job description too long (max {max_description_length} characters). "
                "Please shorten the description."
            )

        # Step 5: Generate match analysis with AI
        try:
            logger.info(
                f"Match analysis - user: {_hash_id(user_id)}..., "
                f"job: {_hash_id(job_id)}..., "
                f"provider: {ai_provider or user_preference or 'claude'}"
            )
            analysis, provider_used = await AIProviderFactory.match_with_fallback(
                resume_data=parsed_data,
                job_description=job_description,
                preferred_provider=ai_provider,
                user_preference=user_preference,
            )
        except ValueError as e:
            logger.error(f"All AI providers failed for match analysis: {e}")
            raise AIProviderUnavailableError() from e

        # Step 6: Return analysis with provider info
        return {
            "match_score": analysis["match_score"],
            "strengths": analysis["strengths"],
            "gaps": analysis["gaps"],
            "recommendations": analysis["recommendations"],
            "ai_provider_used": provider_used,
        }
