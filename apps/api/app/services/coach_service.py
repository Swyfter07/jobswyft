"""Coach chat service for AI-powered career coaching."""

import hashlib
import logging
from typing import Any, Dict, Optional

from app.core.exceptions import (
    AIProviderUnavailableError,
    CreditExhaustedError,
)
from app.db.client import get_supabase_admin_client
from app.services.ai.factory import AIProviderFactory
from app.services.ai.prompts import format_coach_chat_prompt
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)

UUID_LOG_LENGTH = 8


def _hash_id(id_value: str) -> str:
    """Hash an ID for privacy-safe logging."""
    return hashlib.sha256(id_value.encode()).hexdigest()[:UUID_LOG_LENGTH]


class CoachService:
    """Service for AI-powered career coaching chat."""

    def __init__(self):
        """Initialize coach service with dependencies."""
        self.admin_client = get_supabase_admin_client()
        self.usage_service = UsageService()

    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile for AI preference."""
        try:
            response = (
                self.admin_client.table("profiles")
                .select("preferred_ai_provider")
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )
            return response.data if response and response.data else {}
        except Exception as e:
            logger.error(f"Database error fetching user profile: {e}")
            raise

    async def send_message(
        self,
        user_id: str,
        message: str,
        job_context: Optional[dict] = None,
        resume_context: Optional[str] = None,
        history: Optional[list[dict]] = None,
    ) -> Dict[str, Any]:
        """Send a message to the career coach and get a response.

        Args:
            user_id: User's UUID.
            message: User's chat message.
            job_context: Optional job context dict with title, company, description.
            resume_context: Optional resume summary text.
            history: Optional chat history list of {role, content} dicts.

        Returns:
            Dict with message, ai_provider_used, tokens_used.

        Raises:
            CreditExhaustedError: If user has no credits.
            AIProviderUnavailableError: If both AI providers fail.
        """
        # Step 1: Check credits
        has_credits = await self.usage_service.check_credits(user_id)
        if not has_credits:
            logger.warning(f"User {_hash_id(user_id)}... has no credits for coach chat")
            raise CreditExhaustedError()

        # Step 2: Get user profile for AI preference
        profile = await self._get_user_profile(user_id)
        user_preference = profile.get("preferred_ai_provider")

        # Step 3: Build prompt with context
        system_prompt, messages = format_coach_chat_prompt(
            message=message,
            job_context=job_context,
            resume_context=resume_context,
            history=history,
        )

        # Step 4: Call AI with fallback
        try:
            logger.info(
                f"Coach chat - user: {_hash_id(user_id)}..., "
                f"provider: {user_preference or 'claude'}"
            )
            response_text, tokens_used, provider_used = await AIProviderFactory.chat_with_fallback(
                system_prompt=system_prompt,
                messages=messages,
                user_preference=user_preference,
            )
        except ValueError as e:
            logger.error(f"All AI providers failed for coach chat: {e}")
            raise AIProviderUnavailableError() from e

        # Step 5: Record usage
        await self.usage_service.record_usage(
            user_id=user_id,
            operation_type="coach",
            ai_provider=provider_used,
            credits_used=1,
        )

        # Step 6: Return response
        return {
            "message": response_text,
            "ai_provider_used": provider_used,
            "tokens_used": tokens_used,
        }
