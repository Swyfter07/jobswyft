"""Abstract AI provider base class."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name identifier."""
        pass

    @abstractmethod
    async def parse_resume(self, text: str) -> Dict[str, Any]:
        """Parse resume text and extract structured data.

        Args:
            text: Raw text extracted from resume PDF.

        Returns:
            Dictionary with parsed resume fields:
            - contact: {first_name, last_name, email, phone, location, linkedin_url}
            - summary: Professional summary string
            - experience: List of work history entries
            - education: List of education entries
            - skills: List of skill strings

        Raises:
            ValueError: If parsing fails or response is invalid JSON.
        """
        pass

    @abstractmethod
    async def generate_match_analysis(
        self, resume_data: Dict[str, Any], job_description: str
    ) -> Dict[str, Any]:
        """Generate match analysis between resume and job description.

        Args:
            resume_data: Parsed resume data dictionary.
            job_description: Job posting description text.

        Returns:
            Dictionary with match analysis:
            - match_score: Integer 0-100
            - strengths: List of 3-5 strength strings
            - gaps: List of 2-4 gap strings
            - recommendations: List of 2-3 recommendation strings

        Raises:
            ValueError: If AI call fails or response is invalid JSON.
        """
        pass

    @abstractmethod
    async def generate_cover_letter(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        tone: str,
        custom_instructions: Optional[str] = None,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
    ) -> Tuple[str, int]:
        """Generate a tailored cover letter.

        Args:
            resume_data: Parsed resume data dictionary.
            job_description: Job description text.
            tone: Desired tone (confident, friendly, enthusiastic, professional, executive).
            custom_instructions: Optional user instructions to incorporate.
            feedback: Optional feedback for regeneration.
            previous_content: Previous cover letter content (required with feedback).

        Returns:
            Tuple of (content: str, tokens_used: int).

        Raises:
            ValueError: If AI call fails or response is invalid.
        """
        pass

    @abstractmethod
    async def generate_answer(
        self,
        resume_data: Dict[str, Any],
        job_description: str,
        question: str,
        max_length: int,
        feedback: Optional[str] = None,
        previous_content: Optional[str] = None,
    ) -> Tuple[str, int]:
        """Generate an answer to an application question.

        Args:
            resume_data: Parsed resume data dictionary.
            job_description: Job description text.
            question: The application question to answer.
            max_length: Target character length (150, 300, 500, 1000).
            feedback: Optional feedback for regeneration.
            previous_content: Previous answer (required with feedback).

        Returns:
            Tuple of (content: str, tokens_used: int).

        Raises:
            ValueError: If AI call fails or response is invalid.
        """
        pass

    @abstractmethod
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
        """Generate an outreach message for a recruiter or hiring manager.

        Args:
            resume_data: Parsed resume data dictionary.
            job_description: Job description text.
            recipient_type: Type of recipient (recruiter, hiring_manager, referral).
            platform: Target platform (linkedin, email, twitter).
            recipient_name: Optional recipient name for personalized greeting.
            feedback: Optional feedback for regeneration.
            previous_content: Previous message (required with feedback).

        Returns:
            Tuple of (content: str, tokens_used: int).

        Raises:
            ValueError: If AI call fails or response is invalid.
        """
        pass

    @abstractmethod
    async def generate_chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
    ) -> Tuple[str, int]:
        """Generate a conversational chat response.

        Args:
            system_prompt: System prompt with context.
            messages: List of message dicts with role and content.

        Returns:
            Tuple of (response_text, tokens_used).

        Raises:
            ValueError: If AI call fails.
        """
        pass
