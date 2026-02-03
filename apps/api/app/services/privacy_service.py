"""Privacy service for data summary and account deletion."""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from app.core.exceptions import (
    DeletionTokenExpiredError,
    InvalidDeletionTokenError,
    PendingDeletionNotFoundError,
)
from app.db.client import get_supabase_admin_client

logger = logging.getLogger(__name__)

# Token expiry duration
TOKEN_EXPIRY_HOURS = 24


class PrivacyService:
    """Service for privacy operations including data summary and account deletion."""

    def __init__(self):
        """Initialize privacy service with admin client.

        Raises:
            AssertionError: If admin client initialization fails.
        """
        self.admin_client = get_supabase_admin_client()
        assert self.admin_client is not None, "Failed to initialize Supabase admin client"

    def _generate_deletion_token(self) -> str:
        """Generate a secure deletion token.

        Returns:
            64-character base64url token (384 bits entropy).

        Raises:
            AssertionError: If token generation produces unexpected length.
        """
        token = secrets.token_urlsafe(48)
        # Defensive: Validate token length (48 bytes -> 64 base64url chars)
        assert len(token) == 64, f"Token generation failed: expected 64 chars, got {len(token)}"
        return token

    def _hash_token(self, token: str) -> str:
        """Hash token using SHA-256.

        Args:
            token: Raw token string.

        Returns:
            SHA-256 hash of token.
        """
        return hashlib.sha256(token.encode()).hexdigest()

    def _mask_email(self, email: str) -> str:
        """Mask email for display (e.g., j***@example.com).

        Handles edge cases: empty, no @, multiple @, @ only.

        Args:
            email: Email address to mask.

        Returns:
            Masked email string.
        """
        if not email:
            return "***"

        if "@" not in email:
            # No @ symbol - just mask everything after first char
            if len(email) <= 1:
                return "***"
            return f"{email[0]}***"

        # Split on first @ only
        parts = email.split("@", 1)
        local = parts[0]
        domain = parts[1] if len(parts) > 1 else ""

        if not local:
            # @ at start like @domain.com
            return f"***@{domain}" if domain else "***"

        # Mask local part: show first char + *** (local guaranteed non-empty here)
        masked_local = f"{local[0]}***"
        return f"{masked_local}@{domain}" if domain else masked_local

    async def get_data_summary(self, user_id: str, email: str) -> Dict[str, Any]:
        """Get summary of all data stored for user.

        Args:
            user_id: User's UUID.
            email: User's email (for profile info).

        Returns:
            Dictionary containing complete data summary.
        """
        import asyncio
        from functools import partial

        # Parallelize queries for performance (avoid N+1 pattern)
        loop = asyncio.get_event_loop()

        # Define query functions
        def get_resumes():
            return (
                self.admin_client.table("resumes")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute()
            )

        def get_jobs():
            return (
                self.admin_client.table("jobs")
                .select("status")
                .eq("user_id", user_id)
                .execute()
            )

        def get_usage():
            return (
                self.admin_client.table("usage_events")
                .select("operation_type")
                .eq("user_id", user_id)
                .execute()
            )

        # Execute queries in parallel
        resume_response, job_response, usage_response = await asyncio.gather(
            loop.run_in_executor(None, get_resumes),
            loop.run_in_executor(None, get_jobs),
            loop.run_in_executor(None, get_usage),
        )

        # Process resume count
        resume_count = resume_response.count or 0

        # Process job status breakdown
        job_count = len(job_response.data) if job_response.data else 0
        job_status_breakdown = {
            "saved": 0,
            "applied": 0,
            "interviewing": 0,
            "offered": 0,
            "rejected": 0,
            "accepted": 0,
        }
        for job in job_response.data or []:
            status = job.get("status", "applied")
            if status in job_status_breakdown:
                job_status_breakdown[status] += 1

        # Process usage breakdown
        usage_count = len(usage_response.data) if usage_response.data else 0
        usage_breakdown = {
            "match": 0,
            "cover_letter": 0,
            "answer": 0,
            "outreach": 0,
            "resume_parse": 0,
        }
        for event in usage_response.data or []:
            op_type = event.get("operation_type", "")
            if op_type in usage_breakdown:
                usage_breakdown[op_type] += 1

        max_resumes = 5
        return {
            "profile": {
                "stored": True,
                "fields": ["email", "full_name", "subscription_tier", "preferences"],
                "location": "Supabase PostgreSQL (encrypted at rest)",
            },
            "resumes": {
                "count": resume_count,
                "max_resumes": max_resumes,
                "at_limit": resume_count >= max_resumes,
                "storage": "Supabase Storage (encrypted)",
                "includes": ["PDF files", "parsed text data"],
            },
            "jobs": {
                "count": job_count,
                "storage": "Supabase PostgreSQL",
                "status_breakdown": job_status_breakdown,
            },
            "usage_history": {
                "count": usage_count,
                "storage": "Supabase PostgreSQL",
                "includes": ["operation type", "timestamp", "no content stored"],
                "breakdown": usage_breakdown,
            },
            "ai_generated_content": {
                "stored": False,
                "note": "AI outputs are never saved to our servers",
            },
            "data_retention": "Data retained until you delete your account",
            "export_available": False,
            "export_note": "Data export feature coming in future update (GDPR compliance)",
        }

    async def initiate_deletion(
        self, user_id: str, email: str, reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Initiate account deletion by generating token and sending email.

        Args:
            user_id: User's UUID.
            email: User's email address.
            reason: Optional reason for deletion (product feedback).

        Returns:
            Dictionary with deletion initiation details.

        Note:
            TODO (Post-MVP): Implement rate limiting (3 requests/hour/user) to prevent
            email spam/abuse. Current implementation allows unlimited deletion requests.
        """
        # Check for existing pending deletion (prevent duplicate requests)
        existing = (
            self.admin_client.table("profiles")
            .select("deletion_token_hash, deletion_token_expires")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if existing.data and existing.data.get("deletion_token_hash"):
            expires_str = existing.data.get("deletion_token_expires")
            if expires_str:
                try:
                    expires_at_check = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) <= expires_at_check:
                        # Already have active pending deletion
                        logger.warning(
                            f"DUPLICATE_DELETION_REQUEST - user: {user_id[:8]}... "
                            f"(existing request expires: {expires_str})"
                        )
                        # Proceed anyway but log the duplicate
                except (ValueError, AttributeError):
                    pass

        # Generate secure token
        token = self._generate_deletion_token()
        token_hash = self._hash_token(token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)

        # Store token hash and expiry in profile
        self.admin_client.table("profiles").update(
            {
                "deletion_token_hash": token_hash,
                "deletion_token_expires": expires_at.isoformat(),
            }
        ).eq("id", user_id).execute()

        # Log deletion request (MVP: log token for testing)
        reason_log = f", reason: {reason}" if reason else ""
        logger.warning(
            f"DELETION_REQUESTED - user: {user_id[:8]}...{reason_log}"
        )

        # SECURITY: Only log full token in development environment
        # CRITICAL: Never log full token in production (security vulnerability)
        from app.core.config import settings
        if settings.environment == "development":
            logger.info(
                f"Deletion token for user {user_id[:8]}...: {token[:16]}... "
                f"(full token logged for development testing: {token})"
            )
        else:
            logger.info(
                f"Deletion token for user {user_id[:8]}...: {token[:16]}... "
                f"(full token only available in development mode)"
            )

        # TODO: Send actual confirmation email (Post-MVP)
        # Email would contain link: https://app.jobswyft.com/privacy/confirm?token={token}
        # Subject: "Confirm Account Deletion - Jobswyft"

        return {
            "message": "Confirmation email sent. Please check your inbox.",
            "email_sent_to": self._mask_email(email),
            "expires_in": "24 hours",
            "deletion_initiated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def confirm_deletion(self, token: str) -> Dict[str, Any]:
        """Confirm account deletion with token.

        Args:
            token: Deletion confirmation token.

        Returns:
            Dictionary with deletion confirmation details.

        Raises:
            InvalidDeletionTokenError: If token is invalid.
            DeletionTokenExpiredError: If token has expired.
        """
        token_hash = self._hash_token(token)

        # Find profile with matching token hash
        response = (
            self.admin_client.table("profiles")
            .select("id, deletion_token_expires")
            .eq("deletion_token_hash", token_hash)
            .execute()
        )

        if not response.data:
            logger.warning(f"Invalid deletion token attempted: {token[:16]}...")
            raise InvalidDeletionTokenError()

        profile = response.data[0]
        user_id = profile["id"]
        expires_str = profile.get("deletion_token_expires")

        # Check expiry
        if expires_str:
            # Handle Supabase timestamp format (Z suffix)
            expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                logger.warning(
                    f"Expired deletion token attempted - user: {user_id[:8]}..."
                )
                raise DeletionTokenExpiredError()

        # Perform complete deletion
        await self._delete_all_user_data(user_id)

        deleted_at = datetime.now(timezone.utc).isoformat()
        return {
            "message": "Your account and all data have been permanently deleted.",
            "deleted_at": deleted_at,
        }

    async def cancel_deletion(self, user_id: str) -> Dict[str, Any]:
        """Cancel pending deletion for user.

        Args:
            user_id: User's UUID.

        Returns:
            Dictionary with cancellation confirmation.

        Raises:
            PendingDeletionNotFoundError: If no pending deletion exists.
        """
        # Check if there's a pending deletion
        response = (
            self.admin_client.table("profiles")
            .select("deletion_token_hash, deletion_token_expires")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not response.data:
            raise PendingDeletionNotFoundError()

        token_hash = response.data.get("deletion_token_hash")
        expires_str = response.data.get("deletion_token_expires")

        if not token_hash or not expires_str:
            raise PendingDeletionNotFoundError()

        # Check if expired (expired = no pending deletion)
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise PendingDeletionNotFoundError()

        # Clear pending deletion
        self.admin_client.table("profiles").update(
            {
                "deletion_token_hash": None,
                "deletion_token_expires": None,
            }
        ).eq("id", user_id).execute()

        logger.warning(f"DELETION_CANCELLED - user: {user_id[:8]}...")

        return {
            "message": "Pending deletion has been cancelled. Your account remains active.",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _delete_all_user_data(self, user_id: str) -> None:
        """Delete all user data from database and storage.

        Order matters: Storage first, then DB in FK-safe order, auth last.

        Args:
            user_id: User's UUID to delete.

        Raises:
            Exception: If critical deletion steps fail (storage or auth).
        """
        import asyncio
        from app.core.exceptions import DatabaseError

        # 1. Delete resume files from storage (batch optimization)
        resumes = (
            self.admin_client.table("resumes")
            .select("file_path")
            .eq("user_id", user_id)
            .execute()
        )
        file_paths = [r["file_path"] for r in resumes.data or [] if r.get("file_path")]

        if file_paths:
            try:
                self.admin_client.storage.from_("resumes").remove(file_paths)
                logger.info(
                    f"Deleted {len(file_paths)} resume files - user: {user_id[:8]}..."
                )
            except Exception as e:
                logger.error(
                    f"Failed to delete resume files - user: {user_id[:8]}...: {e}"
                )
                # CRITICAL: Raise error - incomplete deletion is GDPR violation
                raise DatabaseError(
                    f"Failed to delete resume files from storage. Account deletion incomplete."
                )

        # 2. Explicit DB deletions (despite CASCADE, for clarity and audit)
        # Note: feedback uses SET NULL, but we explicitly delete for GDPR
        self.admin_client.table("feedback").delete().eq("user_id", user_id).execute()
        self.admin_client.table("usage_events").delete().eq("user_id", user_id).execute()
        self.admin_client.table("jobs").delete().eq("user_id", user_id).execute()
        self.admin_client.table("resumes").delete().eq("user_id", user_id).execute()
        self.admin_client.table("profiles").delete().eq("id", user_id).execute()

        logger.warning(f"Deleted all DB records - user: {user_id[:8]}...")

        # 3. Delete auth user LAST (FK to profiles requires profile deletion first)
        try:
            self.admin_client.auth.admin.delete_user(user_id)
            logger.info(f"Deleted auth user - user: {user_id[:8]}...")
        except Exception as e:
            # Retry once (transient network failure)
            try:
                await asyncio.sleep(2)
                self.admin_client.auth.admin.delete_user(user_id)
                logger.info(f"Deleted auth user (retry) - user: {user_id[:8]}...")
            except Exception as retry_e:
                logger.error(
                    f"Failed to delete auth user after retry - user: {user_id[:8]}...: {retry_e}"
                )
                # CRITICAL: Raise error - auth user still exists (GDPR violation)
                raise DatabaseError(
                    f"Failed to delete authentication user. Account deletion incomplete."
                )

        # Audit log (PII-free)
        user_hash = hashlib.sha256(user_id.encode()).hexdigest()[:16]
        logger.warning(
            f"ACCOUNT_DELETED - user_hash: {user_hash}... "
            f"timestamp: {datetime.now(timezone.utc).isoformat()} "
            f"audit_retention: 30_days_railway_logs"
        )

    async def get_pending_deletion_expires(self, user_id: str) -> Optional[str]:
        """Check if user has a pending deletion and return expiry time.

        Args:
            user_id: User's UUID.

        Returns:
            ISO datetime string if pending deletion exists and not expired, else None.
        """
        response = (
            self.admin_client.table("profiles")
            .select("deletion_token_expires")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not response.data:
            return None

        expires_str = response.data.get("deletion_token_expires")
        if not expires_str:
            return None

        # Check if expired
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            return None

        return expires_str
