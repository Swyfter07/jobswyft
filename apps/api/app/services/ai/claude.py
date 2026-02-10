"""Claude AI provider implementation."""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from anthropic import AsyncAnthropic

from app.services.ai.prompts import RESUME_PARSE_PROMPT, format_match_prompt
from app.services.ai.provider import AIProvider

logger = logging.getLogger(__name__)


class ClaudeProvider(AIProvider):
    """Claude AI provider using Anthropic API."""

    def __init__(self, api_key: str):
        """Initialize Claude provider.

        Args:
            api_key: Anthropic API key.
        """
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    @property
    def name(self) -> str:
        """Provider name."""
        return "claude"

    async def parse_resume(self, text: str) -> Dict[str, Any]:
        """Parse resume using Claude 3.5 Sonnet.

        Args:
            text: Raw resume text.

        Returns:
            Parsed resume data as dictionary.

        Raises:
            ValueError: If AI returns invalid JSON.
        """
        prompt = RESUME_PARSE_PROMPT.format(resume_text=text)

        logger.info(f"Sending resume to Claude ({self.model})")

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = response.content[0].text

        try:
            parsed = json.loads(response_text)
            logger.info("Successfully parsed resume with Claude")
            return parsed
        except json.JSONDecodeError as e:
            logger.error(f"Claude returned invalid JSON: {e}")
            raise ValueError(f"AI returned invalid JSON: {e}") from e

    async def generate_match_analysis(
        self, resume_data: Dict[str, Any], job_description: str
    ) -> Dict[str, Any]:
        """Generate match analysis using Claude.

        Args:
            resume_data: Parsed resume data.
            job_description: Job posting description.

        Returns:
            Match analysis dictionary with match_score, strengths, gaps, recommendations.

        Raises:
            ValueError: If AI returns invalid JSON or missing required fields.
        """
        prompt = format_match_prompt(resume_data, job_description)

        logger.info(f"Generating match analysis with Claude ({self.model})")

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
                timeout=10.0,
            )
        except Exception as e:
            logger.error(f"Claude API error during match analysis: {e}")
            raise ValueError(f"Claude API error: {e}") from e

        response_text = response.content[0].text

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude returned invalid JSON for match analysis: {e}")
            raise ValueError(f"AI returned invalid JSON: {e}") from e

        # Validate required fields
        required_fields = ["match_score", "strengths", "gaps", "recommendations"]
        for field in required_fields:
            if field not in parsed:
                logger.error(f"Claude response missing required field: {field}")
                raise ValueError(f"AI response missing required field: {field}")

        # Validate match_score is an integer 0-100
        if not isinstance(parsed["match_score"], int) or not 0 <= parsed["match_score"] <= 100:
            logger.error(f"Invalid match_score: {parsed['match_score']}")
            raise ValueError("match_score must be an integer between 0 and 100")

        logger.info(f"Successfully generated match analysis with Claude, score: {parsed['match_score']}")
        return parsed


    async def generate_cover_letter(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        tone: str,
        custom_instructions: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
    ) -> Tuple[str, int]:
        """Generate cover letter using Claude.

        Args:
            resume_data: Parsed resume data.
            job_description: Job posting description.
            tone: Desired tone for the cover letter.
            custom_instructions: Optional user instructions.
            feedback: Optional feedback for regeneration.
            previous_content: Previous cover letter (required with feedback).

        Returns:
            Tuple of (content, tokens_used).

        Raises:
            ValueError: If AI returns invalid JSON or missing required fields.
        """
        from .prompts import format_cover_letter_prompt

        prompt = format_cover_letter_prompt(
            resume_data, job_description, tone, custom_instructions, feedback, previous_content
        )

        logger.info(f"Generating cover letter with Claude ({self.model}), tone: {tone}")

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,  # Cover letters need more tokens than match analysis
                messages=[{"role": "user", "content": prompt}],
                timeout=15.0,  # Longer timeout for cover letter generation
            )
        except Exception as e:
            logger.error(f"Claude API error during cover letter generation: {e}")
            raise ValueError(f"Claude API error: {e}") from e

        response_text = response.content[0].text

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude returned invalid JSON for cover letter: {e}")
            raise ValueError(f"AI returned invalid JSON: {e}") from e

        # Validate required fields
        if "content" not in parsed:
            logger.error("Claude response missing required field: content")
            raise ValueError("AI response missing required field: content")

        if "tokens_used" not in parsed:
            logger.warning("Claude response missing tokens_used, using estimate")
            # Estimate based on response length
            parsed["tokens_used"] = len(response_text) // 4

        content = parsed["content"]
        tokens_used = parsed["tokens_used"]

        logger.info(f"Successfully generated cover letter with Claude, tokens: {tokens_used}")
        return content, tokens_used

    async def generate_answer(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        question: str,
        max_length: int,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
    ) -> Tuple[str, int]:
        """Generate answer to application question using Claude.

        Args:
            resume_data: Parsed resume data.
            job_description: Job description text.
            question: Application question to answer.
            max_length: Target character length.
            feedback: Optional feedback for regeneration.
            previous_content: Previous answer (required with feedback).

        Returns:
            Tuple of (content, tokens_used).

        Raises:
            ValueError: If AI returns invalid JSON or missing required fields.
        """
        from .prompts import format_answer_prompt

        prompt = format_answer_prompt(
            resume_data, job_description, question, max_length, feedback, previous_content
        )

        logger.info(f"Generating answer with Claude ({self.model}), max_length: {max_length}")

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1500,  # Sufficient for all answer lengths
                messages=[{"role": "user", "content": prompt}],
                timeout=10.0,  # Shorter timeout for answers
            )
        except Exception as e:
            logger.error(f"Claude API error during answer generation: {e}")
            raise ValueError(f"Claude API error: {e}") from e

        response_text = response.content[0].text

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude returned invalid JSON for answer: {e}")
            raise ValueError(f"AI returned invalid JSON: {e}") from e

        # Validate required fields
        if "content" not in parsed:
            logger.error("Claude response missing required field: content")
            raise ValueError("AI response missing required field: content")

        if "tokens_used" not in parsed:
            logger.warning("Claude response missing tokens_used, using estimate")
            # Estimate based on response length
            parsed["tokens_used"] = len(response_text) // 4

        content = parsed["content"]
        tokens_used = parsed["tokens_used"]

        logger.info(f"Successfully generated answer with Claude, tokens: {tokens_used}")
        return content, tokens_used

    async def generate_outreach(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        recipient_type: str,
        platform: str,
        recipient_name: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
    ) -> Tuple[str, int]:
        """Generate outreach message using Claude.

        Args:
            resume_data: Parsed resume data.
            job_description: Job description text.
            recipient_type: Type of recipient (recruiter, hiring_manager, referral).
            platform: Target platform (linkedin, email, twitter).
            recipient_name: Optional recipient name for personalized greeting.
            feedback: Optional feedback for regeneration.
            previous_content: Previous message (required with feedback).

        Returns:
            Tuple of (content, tokens_used).

        Raises:
            ValueError: If AI returns invalid JSON or missing required fields.
        """
        from .prompts import format_outreach_prompt

        prompt = format_outreach_prompt(
            resume_data, job_description, recipient_type, platform, recipient_name, feedback, previous_content
        )

        logger.info(f"Generating outreach with Claude ({self.model}), recipient_type: {recipient_type}, platform: {platform}")

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1500,  # Sufficient for all platforms
                messages=[{"role": "user", "content": prompt}],
                timeout=10.0,  # Shorter timeout for outreach
            )
        except Exception as e:
            logger.error(f"Claude API error during outreach generation: {e}")
            raise ValueError(f"Claude API error: {e}") from e

        response_text = response.content[0].text

        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude returned invalid JSON for outreach: {e}")
            raise ValueError(f"AI returned invalid JSON: {e}") from e

        # Validate required fields
        if "content" not in parsed:
            logger.error("Claude response missing required field: content")
            raise ValueError("AI response missing required field: content")

        if "tokens_used" not in parsed:
            logger.warning("Claude response missing tokens_used, using estimate")
            # Estimate based on response length
            parsed["tokens_used"] = len(response_text) // 4

        content = parsed["content"]
        tokens_used = parsed["tokens_used"]

        logger.info(f"Successfully generated outreach with Claude, tokens: {tokens_used}")
        return content, tokens_used

    async def generate_chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
    ) -> Tuple[str, int]:
        """Generate conversational chat response using Claude.

        Args:
            system_prompt: System prompt with context.
            messages: List of message dicts with role and content.

        Returns:
            Tuple of (response_text, tokens_used).

        Raises:
            ValueError: If AI call fails.
        """
        logger.info(f"Generating chat response with Claude ({self.model})")

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                system=system_prompt,
                messages=messages,
                timeout=15.0,
            )
        except Exception as e:
            logger.error(f"Claude API error during chat: {e}")
            raise ValueError(f"Claude API error: {e}") from e

        response_text = response.content[0].text
        tokens_used = response.usage.output_tokens if response.usage else len(response_text) // 4

        logger.info(f"Successfully generated chat response with Claude, tokens: {tokens_used}")
        return response_text, tokens_used
