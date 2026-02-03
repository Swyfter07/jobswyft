"""Autofill service - Data aggregation for form autofill."""

import hashlib
import logging
import time
from typing import Optional, Tuple
from uuid import UUID

from app.core.exceptions import ApiException, ErrorCode
from app.db.client import get_supabase_admin_client, get_supabase_client

logger = logging.getLogger(__name__)

# Privacy-safe logging: show only first 8 chars of hashed ID
UUID_LOG_LENGTH = 8


def _hash_id(id_value: str) -> str:
    """Hash an ID for privacy-safe logging.

    Args:
        id_value: The ID to hash.

    Returns:
        First 8 characters of SHA256 hash.
    """
    return hashlib.sha256(id_value.encode()).hexdigest()[:UUID_LOG_LENGTH]


def _split_full_name(full_name: str) -> Tuple[str, str]:
    """Split a full name into first and last name.

    Args:
        full_name: Full name string (e.g., "John Doe").

    Returns:
        Tuple of (first_name, last_name).
        - "John Doe" → ("John", "Doe")
        - "John" → ("John", "")
        - "" → ("", "")
    """
    if not full_name:
        return ("", "")

    parts = full_name.strip().split(" ", 1)
    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""

    return (first_name, last_name)


def _generate_signed_url(file_path: str) -> str:
    """Generate a signed URL for resume download (1 hour expiry).

    Args:
        file_path: Storage path without bucket prefix (e.g., "user-uuid/resume-uuid.pdf")

    Returns:
        Signed URL for direct file download.

    Raises:
        ApiException: If signed URL generation fails.
    """
    try:
        admin_client = get_supabase_admin_client()
        result = admin_client.storage.from_("resumes").create_signed_url(
            path=file_path,
            expires_in=3600,  # 1 hour
        )
        return result["signedURL"]
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {file_path}: {e}")
        raise ApiException(
            code=ErrorCode.STORAGE_ERROR,
            message="Failed to generate download URL",
            status_code=500,
        )


class AutofillService:
    """Service for retrieving user data for form autofill."""

    def __init__(self):
        """Initialize the autofill service."""
        self.client = get_supabase_admin_client()

    async def get_autofill_data(self, user_id: UUID) -> dict:
        """Retrieve user data structured for form autofill.

        Args:
            user_id: The authenticated user's ID.

        Returns:
            Dict containing personal data, resume info, and placeholder fields.
            - personal: first_name, last_name, full_name, email, phone, location, linkedin_url, portfolio_url
            - resume: id, file_name, download_url, parsed_summary (or None if no active resume)
            - work_authorization: None (placeholder for future)
            - salary_expectation: None (placeholder for future)
        """
        start = time.time()
        user_hash = _hash_id(str(user_id))

        try:
            # Get profile
            profile_result = (
                self.client.table("profiles")
                .select("*")
                .eq("id", str(user_id))
                .single()
                .execute()
            )

            profile = profile_result.data

            # Get active resume if exists
            resume = None
            active_resume_id = profile.get("active_resume_id")
            if active_resume_id:
                try:
                    resume_result = (
                        self.client.table("resumes")
                        .select("*")
                        .eq("id", active_resume_id)
                        .single()
                        .execute()
                    )
                    resume = resume_result.data if resume_result.data else None
                except Exception:
                    # Active resume ID exists but resume not found - continue without resume
                    resume = None

            # Extract personal data with fallbacks
            personal = self._extract_personal_data(profile, resume)

            # Build resume data if active resume exists
            resume_data = None
            if resume:
                try:
                    resume_data = self._build_resume_data(resume)
                except Exception as e:
                    logger.error(
                        f"Failed to build resume data - user: {user_hash}..., "
                        f"resume_id: {resume.get('id')}, error: {e}"
                    )
                    raise

            duration_ms = (time.time() - start) * 1000
            logger.info(
                f"Autofill retrieved in {duration_ms:.0f}ms - "
                f"user: {user_hash}..., has_resume: {resume_data is not None}"
            )

            return {
                "personal": personal,
                "resume": resume_data,
                "work_authorization": None,  # Future feature placeholder
                "salary_expectation": None,  # Future feature placeholder
            }

        except Exception as e:
            duration_ms = (time.time() - start) * 1000
            logger.error(
                f"Autofill retrieval failed after {duration_ms:.0f}ms - "
                f"user: {user_hash}..., error: {type(e).__name__}: {e}"
            )
            raise

    def _extract_personal_data(self, profile: dict, resume: Optional[dict]) -> dict:
        """Extract personal data from resume parsed_data with profile fallbacks.

        Priority:
        1. Resume parsed_data.contact fields
        2. Profile table fields
        3. None/empty string for missing fields

        Args:
            profile: User profile record from database.
            resume: Active resume record (or None).

        Returns:
            Dict with personal data fields.
        """
        # Get parsed contact data from resume (nested object)
        parsed_data = resume.get("parsed_data") if resume else None
        contact = (parsed_data.get("contact") if parsed_data else None) or {}

        # Email: parsed → profile → None
        email = contact.get("email") or profile.get("email")

        # Names: parsed → split profile.full_name → empty string
        first_name = contact.get("first_name")
        last_name = contact.get("last_name")

        if not first_name or not last_name:
            profile_first, profile_last = _split_full_name(profile.get("full_name", ""))
            first_name = first_name or profile_first
            last_name = last_name or profile_last

        # Full name: always computed (handles all-None case)
        full_name = f"{first_name or ''} {last_name or ''}".strip() or ""

        return {
            "first_name": first_name or None,
            "last_name": last_name or None,
            "full_name": full_name or None,
            "email": email,
            "phone": contact.get("phone"),
            "location": contact.get("location"),
            "linkedin_url": contact.get("linkedin_url"),
            "portfolio_url": None,  # Not in current schema
        }

    def _build_resume_data(self, resume: dict) -> dict:
        """Build resume data object with signed download URL.

        Args:
            resume: Resume record from database.

        Returns:
            Dict with resume id, file_name, download_url, and parsed_summary.
        """
        # Generate signed URL for resume download
        file_path = resume.get("file_path", "")
        download_url = _generate_signed_url(file_path) if file_path else None

        # Extract summary (first 200 chars if exists)
        parsed_data = resume.get("parsed_data") or {}
        summary = parsed_data.get("summary")
        parsed_summary = summary[:200] if summary else None

        return {
            "id": resume.get("id"),
            "file_name": resume.get("file_name"),
            "download_url": download_url,
            "parsed_summary": parsed_summary,
        }
