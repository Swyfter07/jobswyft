"""AI provider factory with fallback support."""

import logging
from typing import Any, Dict, Optional, Tuple

from app.core.config import settings
from app.services.ai.claude import ClaudeProvider
from app.services.ai.openai import OpenAIProvider
from app.services.ai.provider import AIProvider

logger = logging.getLogger(__name__)


class AIProviderFactory:
    """Factory for creating AI providers with fallback support."""

    @staticmethod
    def get_claude_provider() -> Optional[ClaudeProvider]:
        """Get Claude provider if API key is configured.

        Returns:
            ClaudeProvider instance or None if not configured.
        """
        if settings.anthropic_api_key:
            return ClaudeProvider(settings.anthropic_api_key)
        return None

    @staticmethod
    def get_openai_provider() -> Optional[OpenAIProvider]:
        """Get OpenAI provider if API key is configured.

        Returns:
            OpenAIProvider instance or None if not configured.
        """
        if settings.openai_api_key:
            return OpenAIProvider(settings.openai_api_key)
        return None

    @staticmethod
    async def parse_with_fallback(text: str) -> Tuple[Dict[str, Any], str]:
        """Parse resume with Claude as primary, GPT as fallback.

        Args:
            text: Resume text to parse.

        Returns:
            Tuple of (parsed_data, provider_name).

        Raises:
            ValueError: If both providers fail.
        """
        primary = AIProviderFactory.get_claude_provider()
        fallback = AIProviderFactory.get_openai_provider()

        errors: list[str] = []

        # Try primary provider (Claude)
        if primary:
            try:
                logger.info("Attempting resume parse with Claude (primary)")
                result = await primary.parse_resume(text)
                return result, primary.name
            except Exception as e:
                logger.warning(f"Claude failed: {e}")
                errors.append(f"Claude: {e}")
        else:
            logger.warning("Claude provider not configured (missing API key)")
            errors.append("Claude: Not configured")

        # Try fallback provider (GPT)
        if fallback:
            try:
                logger.info("Attempting resume parse with OpenAI (fallback)")
                result = await fallback.parse_resume(text)
                return result, fallback.name
            except Exception as e:
                logger.warning(f"OpenAI failed: {e}")
                errors.append(f"OpenAI: {e}")
        else:
            logger.warning("OpenAI provider not configured (missing API key)")
            errors.append("OpenAI: Not configured")

        # Both failed
        error_msg = "; ".join(errors)
        logger.error(f"All AI providers failed: {error_msg}")
        raise ValueError(f"All AI providers failed: {error_msg}")

    @staticmethod
    async def match_with_fallback(
        resume_data: Dict[str, Any],
        job_description: str,
        preferred_provider: Optional[str] = None,
        user_preference: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], str]:
        """Generate match analysis with fallback support.

        Provider resolution order:
        1. preferred_provider (from request)
        2. user_preference (from user profile)
        3. "claude" (system default)

        Args:
            resume_data: Parsed resume data.
            job_description: Job description text.
            preferred_provider: Provider override from request (highest priority).
            user_preference: User's preferred provider from profile.

        Returns:
            Tuple of (analysis_dict, provider_name).

        Raises:
            ValueError: If both providers fail.
        """
        # Determine primary provider based on resolution order
        resolved_provider = preferred_provider or user_preference or "claude"

        if resolved_provider == "gpt":
            primary = AIProviderFactory.get_openai_provider()
            fallback = AIProviderFactory.get_claude_provider()
        else:
            # Default to Claude as primary
            primary = AIProviderFactory.get_claude_provider()
            fallback = AIProviderFactory.get_openai_provider()

        errors: list[str] = []

        # Try primary provider
        if primary:
            try:
                logger.info(f"Attempting match analysis with {primary.name} (primary)")
                result = await primary.generate_match_analysis(resume_data, job_description)
                return result, primary.name
            except Exception as e:
                logger.warning(f"{primary.name} failed: {e}")
                errors.append(f"{primary.name}: {e}")
        else:
            provider_name = "OpenAI" if resolved_provider == "gpt" else "Claude"
            logger.warning(f"{provider_name} provider not configured (missing API key)")
            errors.append(f"{provider_name}: Not configured")

        # Try fallback provider
        if fallback:
            try:
                logger.info(f"Attempting match analysis with {fallback.name} (fallback)")
                result = await fallback.generate_match_analysis(resume_data, job_description)
                return result, fallback.name
            except Exception as e:
                logger.warning(f"{fallback.name} failed: {e}")
                errors.append(f"{fallback.name}: {e}")
        else:
            fallback_name = "Claude" if resolved_provider == "gpt" else "OpenAI"
            logger.warning(f"{fallback_name} provider not configured (missing API key)")
            errors.append(f"{fallback_name}: Not configured")

        # Both failed
        error_msg = "; ".join(errors)
        logger.error(f"All AI providers failed for match analysis: {error_msg}")
        raise ValueError(f"All AI providers failed: {error_msg}")

    @staticmethod
    async def cover_letter_with_fallback(
        resume_data: Dict[str, Any],
        job_description: str,
        tone: str,
        custom_instructions: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
        preferred_provider: Optional[str] = None,
        user_preference: Optional[str] = None,
    ) -> Tuple[str, int, str]:
        """Generate cover letter with fallback support.

        Provider resolution order:
        1. preferred_provider (from request)
        2. user_preference (from user profile)
        3. "claude" (system default)

        Args:
            resume_data: Parsed resume data.
            job_description: Job description text.
            tone: Desired tone for cover letter.
            custom_instructions: Optional user instructions.
            feedback: Optional feedback for regeneration.
            previous_content: Previous cover letter (required with feedback).
            preferred_provider: Provider override from request (highest priority).
            user_preference: User's preferred provider from profile.

        Returns:
            Tuple of (content: str, tokens_used: int, provider_name: str).

        Raises:
            ValueError: If both providers fail.
        """
        # Determine primary provider based on resolution order
        resolved_provider = preferred_provider or user_preference or "claude"

        if resolved_provider == "gpt":
            primary = AIProviderFactory.get_openai_provider()
            fallback = AIProviderFactory.get_claude_provider()
        else:
            # Default to Claude as primary
            primary = AIProviderFactory.get_claude_provider()
            fallback = AIProviderFactory.get_openai_provider()

        errors: list[str] = []

        # Try primary provider
        if primary:
            try:
                logger.info(f"Attempting cover letter generation with {primary.name} (primary)")
                content, tokens_used = await primary.generate_cover_letter(
                    resume_data, job_description, tone, custom_instructions, feedback, previous_content
                )
                return content, tokens_used, primary.name
            except Exception as e:
                logger.warning(f"{primary.name} failed: {e}")
                errors.append(f"{primary.name}: {e}")
        else:
            provider_name = "OpenAI" if resolved_provider == "gpt" else "Claude"
            logger.warning(f"{provider_name} provider not configured (missing API key)")
            errors.append(f"{provider_name}: Not configured")

        # Try fallback provider
        if fallback:
            try:
                logger.info(f"Attempting cover letter generation with {fallback.name} (fallback)")
                content, tokens_used = await fallback.generate_cover_letter(
                    resume_data, job_description, tone, custom_instructions, feedback, previous_content
                )
                return content, tokens_used, fallback.name
            except Exception as e:
                logger.warning(f"{fallback.name} failed: {e}")
                errors.append(f"{fallback.name}: {e}")
        else:
            fallback_name = "Claude" if resolved_provider == "gpt" else "OpenAI"
            logger.warning(f"{fallback_name} provider not configured (missing API key)")
            errors.append(f"{fallback_name}: Not configured")

        # Both failed
        error_msg = "; ".join(errors)
        logger.error(f"All AI providers failed for cover letter generation: {error_msg}")
        raise ValueError(f"All AI providers failed: {error_msg}")

    @staticmethod
    async def answer_with_fallback(
        resume_data: Dict[str, Any],
        job_description: str,
        question: str,
        max_length: int,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
        preferred_provider: Optional[str] = None,
        user_preference: Optional[str] = None,
    ) -> Tuple[str, int, str]:
        """Generate answer with fallback support.

        Provider resolution order:
        1. preferred_provider (from request)
        2. user_preference (from user profile)
        3. "claude" (system default)

        Args:
            resume_data: Parsed resume data.
            job_description: Job description text.
            question: Application question to answer.
            max_length: Target character length.
            feedback: Optional feedback for regeneration.
            previous_content: Previous answer (required with feedback).
            preferred_provider: Provider override from request (highest priority).
            user_preference: User's preferred provider from profile.

        Returns:
            Tuple of (content: str, tokens_used: int, provider_name: str).

        Raises:
            ValueError: If both providers fail.
        """
        # Determine primary provider based on resolution order
        resolved_provider = preferred_provider or user_preference or "claude"

        if resolved_provider == "gpt":
            primary = AIProviderFactory.get_openai_provider()
            fallback = AIProviderFactory.get_claude_provider()
        else:
            # Default to Claude as primary
            primary = AIProviderFactory.get_claude_provider()
            fallback = AIProviderFactory.get_openai_provider()

        errors: list[str] = []

        # Try primary provider
        if primary:
            try:
                logger.info(f"Attempting answer generation with {primary.name} (primary)")
                content, tokens_used = await primary.generate_answer(
                    resume_data, job_description, question, max_length, feedback, previous_content
                )
                return content, tokens_used, primary.name
            except Exception as e:
                logger.warning(f"{primary.name} failed: {e}")
                errors.append(f"{primary.name}: {e}")
        else:
            provider_name = "OpenAI" if resolved_provider == "gpt" else "Claude"
            logger.warning(f"{provider_name} provider not configured (missing API key)")
            errors.append(f"{provider_name}: Not configured")

        # Try fallback provider
        if fallback:
            try:
                logger.info(f"Attempting answer generation with {fallback.name} (fallback)")
                content, tokens_used = await fallback.generate_answer(
                    resume_data, job_description, question, max_length, feedback, previous_content
                )
                return content, tokens_used, fallback.name
            except Exception as e:
                logger.warning(f"{fallback.name} failed: {e}")
                errors.append(f"{fallback.name}: {e}")
        else:
            fallback_name = "Claude" if resolved_provider == "gpt" else "OpenAI"
            logger.warning(f"{fallback_name} provider not configured (missing API key)")
            errors.append(f"{fallback_name}: Not configured")

        # Both failed
        error_msg = "; ".join(errors)
        logger.error(f"All AI providers failed for answer generation: {error_msg}")
        raise ValueError(f"All AI providers failed: {error_msg}")

    @staticmethod
    async def outreach_with_fallback(
        resume_data: Dict[str, Any],
        job_description: str,
        recipient_type: str,
        platform: str,
        recipient_name: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
        preferred_provider: Optional[str] = None,
        user_preference: Optional[str] = None,
    ) -> Tuple[str, int, str]:
        """Generate outreach message with fallback support.

        Provider resolution order:
        1. preferred_provider (from request)
        2. user_preference (from user profile)
        3. "claude" (system default)

        Args:
            resume_data: Parsed resume data.
            job_description: Job description text.
            recipient_type: Type of recipient (recruiter, hiring_manager, referral).
            platform: Target platform (linkedin, email, twitter).
            recipient_name: Optional recipient name for personalized greeting.
            feedback: Optional feedback for regeneration.
            previous_content: Previous message (required with feedback).
            preferred_provider: Provider override from request (highest priority).
            user_preference: User's preferred provider from profile.

        Returns:
            Tuple of (content: str, tokens_used: int, provider_name: str).

        Raises:
            ValueError: If both providers fail.
        """
        # Determine primary provider based on resolution order
        resolved_provider = preferred_provider or user_preference or "claude"

        if resolved_provider == "gpt":
            primary = AIProviderFactory.get_openai_provider()
            fallback = AIProviderFactory.get_claude_provider()
        else:
            # Default to Claude as primary
            primary = AIProviderFactory.get_claude_provider()
            fallback = AIProviderFactory.get_openai_provider()

        errors: list[str] = []

        # Try primary provider
        if primary:
            try:
                logger.info(f"Attempting outreach generation with {primary.name} (primary)")
                content, tokens_used = await primary.generate_outreach(
                    resume_data, job_description, recipient_type, platform, recipient_name, feedback, previous_content
                )
                return content, tokens_used, primary.name
            except Exception as e:
                logger.warning(f"{primary.name} failed: {e}")
                errors.append(f"{primary.name}: {e}")
        else:
            provider_name = "OpenAI" if resolved_provider == "gpt" else "Claude"
            logger.warning(f"{provider_name} provider not configured (missing API key)")
            errors.append(f"{provider_name}: Not configured")

        # Try fallback provider
        if fallback:
            try:
                logger.info(f"Attempting outreach generation with {fallback.name} (fallback)")
                content, tokens_used = await fallback.generate_outreach(
                    resume_data, job_description, recipient_type, platform, recipient_name, feedback, previous_content
                )
                return content, tokens_used, fallback.name
            except Exception as e:
                logger.warning(f"{fallback.name} failed: {e}")
                errors.append(f"{fallback.name}: {e}")
        else:
            fallback_name = "Claude" if resolved_provider == "gpt" else "OpenAI"
            logger.warning(f"{fallback_name} provider not configured (missing API key)")
            errors.append(f"{fallback_name}: Not configured")

        # Both failed
        error_msg = "; ".join(errors)
        logger.error(f"All AI providers failed for outreach generation: {error_msg}")
        raise ValueError(f"All AI providers failed: {error_msg}")
