"""Feedback service for user feedback collection."""

import logging
from typing import Any, Dict, Optional

from app.db.client import get_supabase_admin_client

logger = logging.getLogger(__name__)

# Allowed context fields (whitelist for security)
ALLOWED_CONTEXT_FIELDS = {
    "page_url",
    "feature_used",
    "browser",
    "extension_version",
    "screen_size",
}


class FeedbackService:
    """Service for feedback operations."""

    def __init__(self):
        """Initialize feedback service with admin client."""
        self.admin_client = get_supabase_admin_client()
        assert self.admin_client is not None, "Failed to initialize Supabase admin client"

    def _sanitize_context(self, context: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Sanitize context by keeping only allowed fields.

        Args:
            context: Raw context dictionary from user.

        Returns:
            Sanitized context with only allowed non-empty fields, or None if empty.
            Empty strings, arrays, and objects are filtered out to save storage.
        """
        if not context:
            return None

        # Filter to only allowed fields and exclude empty/falsy values
        safe_context = {
            k: v for k, v in context.items()
            if k in ALLOWED_CONTEXT_FIELDS
            and v is not None
            and v != ""
            and v != []
            and v != {}
        }

        # Return None if empty after sanitization
        return safe_context if safe_context else None

    async def submit_feedback(
        self,
        user_id: str,
        content: str,
        category: str = "general",
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Submit user feedback.

        Args:
            user_id: User's UUID.
            content: Feedback content (already validated).
            category: Feedback category (already validated).
            context: Optional context data.

        Returns:
            Dictionary with feedback_id and confirmation message.

        Raises:
            Exception: If database insert fails.
        """
        # Prepare feedback data
        feedback_data: Dict[str, Any] = {
            "user_id": user_id,
            "content": content,
            "category": category,
        }

        # Sanitize and add context if provided
        safe_context = self._sanitize_context(context)
        if safe_context:
            feedback_data["context"] = safe_context

        # Insert feedback
        response = (
            self.admin_client.table("feedback")
            .insert(feedback_data)
            .execute()
        )

        if not response.data:
            logger.error(f"Failed to insert feedback - user: {user_id[:8]}...")
            raise RuntimeError("Failed to save feedback")

        feedback_id = response.data[0]["id"]

        logger.info(
            f"FEEDBACK_SUBMITTED - user: {user_id[:8]}... "
            f"category: {category} "
            f"feedback_id: {feedback_id[:8]}..."
        )

        return {
            "message": "Thank you for your feedback!",
            "feedback_id": feedback_id,
        }
