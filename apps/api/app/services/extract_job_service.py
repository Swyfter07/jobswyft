"""Job extraction service — LLM-based extraction fallback for scan engine."""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.exceptions import AIProviderUnavailableError, ApiException, ErrorCode
from app.db.client import get_supabase_admin_client
from app.services.ai.claude import ClaudeProvider
from app.services.ai.factory import AIProviderFactory
from app.services.ai.openai import OpenAIProvider

logger = logging.getLogger(__name__)

# Rate limit: 50 requests per user per day (no credit cost)
DAILY_EXTRACT_LIMIT = 50


class ExtractJobRateLimitError(ApiException):
    """Daily extraction rate limit exceeded."""

    def __init__(self):
        super().__init__(
            code=ErrorCode.RATE_LIMITED,
            message="Daily AI extraction limit reached (50/day). Try again tomorrow.",
            status_code=429,
        )


class ExtractJobService:
    """Service for AI-based job data extraction from HTML.

    NOTE: Uses synchronous Supabase client within async methods — consistent
    with all existing services (MatchService, CoverLetterService, etc.).
    A codebase-wide migration to AsyncClient is tracked separately.
    """

    def __init__(self):
        self.admin_client = get_supabase_admin_client()

    async def _check_daily_limit(self, user_id: str) -> None:
        """Check if user has exceeded daily extraction limit.

        Uses usage_events table with operation_type='extract_job' and
        daily period_key (YYYY-MM-DD). No credit cost — just rate limiting.

        Args:
            user_id: User's UUID.

        Raises:
            ExtractJobRateLimitError: If daily limit exceeded.
        """
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        response = (
            self.admin_client.table("usage_events")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("operation_type", "extract_job")
            .eq("period_key", today)
            .execute()
        )

        count = response.count or 0
        if count >= DAILY_EXTRACT_LIMIT:
            logger.warning(
                f"User {user_id[:8]}... exceeded daily extract limit: {count}/{DAILY_EXTRACT_LIMIT}"
            )
            raise ExtractJobRateLimitError()

    async def _record_extraction(self, user_id: str, ai_provider: str) -> None:
        """Record an extraction event (no credit cost).

        Args:
            user_id: User's UUID.
            ai_provider: AI provider used.
        """
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        try:
            self.admin_client.table("usage_events").insert(
                {
                    "user_id": user_id,
                    "operation_type": "extract_job",
                    "ai_provider": ai_provider,
                    "credits_used": 0,
                    "period_type": "daily",
                    "period_key": today,
                }
            ).execute()

            logger.info(f"Recorded extract_job usage: user={user_id[:8]}..., provider={ai_provider}")
        except Exception as e:
            logger.error(f"Failed to record extract_job usage for user={user_id[:8]}...: {e}")

    async def extract_job(
        self,
        user_id: str,
        html_content: str,
        source_url: str,
        partial_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Extract job data from HTML using LLM.

        Args:
            user_id: User's UUID.
            html_content: Cleaned HTML from the job page (max 8000 chars).
            source_url: URL of the job page.
            partial_data: Optional partial data from CSS/OG extraction.

        Returns:
            Dictionary with extracted job fields.

        Raises:
            ExtractJobRateLimitError: If daily limit exceeded.
            AIProviderUnavailableError: If both AI providers fail.
        """
        # Check daily rate limit
        await self._check_daily_limit(user_id)

        # Format prompt
        from app.services.ai.prompts import format_job_extract_prompt

        prompt = format_job_extract_prompt(html_content, source_url, partial_data)

        # Try Claude first, then OpenAI
        primary = AIProviderFactory.get_claude_provider()
        fallback = AIProviderFactory.get_openai_provider()

        logger.info(
            f"Extract job providers: primary={'claude' if primary else 'None'}, "
            f"fallback={'openai' if fallback else 'None'}"
        )

        errors: list[str] = []

        for provider in [primary, fallback]:
            if not provider:
                continue
            try:
                logger.info(f"Attempting job extraction with {provider.name}")
                response_text = await self._call_provider(provider, prompt)
                parsed = json.loads(response_text)

                # Record successful extraction
                await self._record_extraction(user_id, provider.name)

                # Return only expected fields
                return {
                    "title": parsed.get("title"),
                    "company": parsed.get("company"),
                    "description": parsed.get("description"),
                    "location": parsed.get("location"),
                    "salary": parsed.get("salary"),
                    "employment_type": parsed.get("employment_type"),
                }

            except json.JSONDecodeError as e:
                logger.warning(f"{provider.name} returned invalid JSON: {e}")
                errors.append(f"{provider.name}: Invalid JSON")
            except Exception as e:
                logger.warning(f"{provider.name} failed: {e}")
                errors.append(f"{provider.name}: {e}")

        # Both failed
        error_msg = "; ".join(errors) if errors else "No providers configured"
        logger.error(f"All AI providers failed for job extraction: {error_msg}")
        raise AIProviderUnavailableError()

    @staticmethod
    async def _call_provider(provider: Any, prompt: str) -> str:
        """Call the appropriate provider API and return raw response text.

        Args:
            provider: AIProvider instance (Claude or OpenAI).
            prompt: The formatted prompt.

        Returns:
            Raw response text from the provider.
        """
        # Use fast/cheap models for extraction (not the expensive ones used for match/cover-letter)
        CLAUDE_EXTRACT_MODEL = "claude-haiku-4-5-20251001"
        OPENAI_EXTRACT_MODEL = "gpt-4o-mini"
        EXTRACT_MAX_TOKENS = 4000

        if isinstance(provider, ClaudeProvider):
            logger.info(f"Calling Claude ({CLAUDE_EXTRACT_MODEL}) with timeout=30s, max_tokens={EXTRACT_MAX_TOKENS}")
            response = await provider.client.messages.create(
                model=CLAUDE_EXTRACT_MODEL,
                max_tokens=EXTRACT_MAX_TOKENS,
                messages=[{"role": "user", "content": prompt}],
                timeout=30.0,
            )
            if not response.content:
                raise ValueError("Claude returned empty response")
            return response.content[0].text
        elif isinstance(provider, OpenAIProvider):
            logger.info(f"Calling OpenAI ({OPENAI_EXTRACT_MODEL}) with timeout=30s, max_tokens={EXTRACT_MAX_TOKENS}")
            response = await provider.client.chat.completions.create(
                model=OPENAI_EXTRACT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=EXTRACT_MAX_TOKENS,
                timeout=30.0,
            )
            text = response.choices[0].message.content
            if not text:
                raise ValueError("OpenAI returned empty response")
            return text
        else:
            raise ValueError(f"Unknown provider type: {type(provider)}")
