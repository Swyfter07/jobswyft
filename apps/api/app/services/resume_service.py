"""Resume service for upload, storage, and AI parsing."""

import logging
import uuid
from typing import Any, Dict, Optional

from app.core.exceptions import ApiException, CreditExhaustedError, ErrorCode, ResumeLimitReachedError
from app.db.client import get_supabase_admin_client
from app.models.resume import ParsedResumeData
from app.services.ai.factory import AIProviderFactory
from app.services.pdf_parser import extract_text_from_pdf
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)


class ResumeService:
    """Service for managing resume uploads and parsing."""

    def __init__(self):
        """Initialize resume service."""
        self.admin_client = get_supabase_admin_client()
        self.usage_service = UsageService()

    async def get_resume_count(self, user_id: str) -> int:
        """Get count of user's resumes.

        Args:
            user_id: User's UUID.

        Returns:
            Number of resumes the user has.
        """
        response = (
            self.admin_client.table("resumes")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return response.count or 0

    async def upload_resume(
        self,
        user_id: str,
        file_content: bytes,
        file_name: str,
    ) -> Dict[str, Any]:
        """Upload and parse a resume.

        Flow:
        1. Check credits (fail fast if exhausted)
        2. Check resume limit (fail fast if at limit)
        3. Upload file to Supabase Storage
        4. Extract text with pdfplumber
        5. Parse with AI (Claude → GPT fallback)
        6. Insert resume record to database
        7. Record usage event (credit deduction LAST)

        Args:
            user_id: User's UUID.
            file_content: Raw PDF bytes.
            file_name: Original filename.

        Returns:
            Dictionary with resume data and ai_provider_used.

        Raises:
            CreditExhaustedError: If user has no credits.
            ResumeLimitReachedError: If user has 5 resumes.
            ValueError: If file validation or parsing fails.
        """
        logger.info(f"Resume upload attempt by user {user_id[:8]}..., filename={file_name}, size={len(file_content)} bytes")

        # Step 1: Check credits FIRST
        has_credits = await self.usage_service.check_credits(user_id)
        if not has_credits:
            logger.warning(f"User {user_id[:8]}... has no credits")
            raise CreditExhaustedError()

        # Step 2: Check resume limit
        max_resumes = await self.usage_service.get_max_resumes(user_id)
        current_count = await self.get_resume_count(user_id)
        if current_count >= max_resumes:
            logger.warning(
                f"User {user_id[:8]}... at resume limit ({current_count}/{max_resumes})"
            )
            raise ResumeLimitReachedError(max_resumes=max_resumes)

        # Generate unique resume ID
        resume_id = str(uuid.uuid4())
        storage_path = f"{user_id}/{resume_id}.pdf"

        # Step 3: Upload file to Supabase Storage
        logger.info(f"Uploading resume to storage: {storage_path}, size={len(file_content)} bytes")
        try:
            self.admin_client.storage.from_("resumes").upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": "application/pdf"},
            )
        except Exception as e:
            logger.error(f"Storage upload failed: {e}")
            raise ApiException(
                code=ErrorCode.VALIDATION_ERROR,
                message="Failed to upload file to storage",
                status_code=500,
                details={"error": str(e)},
            )

        # Step 4: Extract text from PDF
        try:
            extracted_text = extract_text_from_pdf(file_content)
        except ValueError as e:
            # File uploaded but extraction failed - create record with failed status
            logger.error(f"PDF extraction failed: {e}")
            return await self._create_resume_record(
                resume_id=resume_id,
                user_id=user_id,
                file_name=file_name,
                file_path=storage_path,
                parsed_data=None,
                parse_status="failed",
                ai_provider_used=None,
            )

        # Step 5: Parse with AI (Claude primary, GPT fallback)
        parsed_data: Optional[Dict[str, Any]] = None
        ai_provider_used: Optional[str] = None
        parse_status = "failed"

        try:
            raw_parsed_data, ai_provider_used = await AIProviderFactory.parse_with_fallback(
                extracted_text
            )

            # Validate parsed data against Pydantic schema
            try:
                validated = ParsedResumeData(**raw_parsed_data)
                parsed_data = validated.model_dump(exclude_none=True)
                parse_status = "completed"
                logger.info(f"Resume parsed and validated successfully with {ai_provider_used}")
            except Exception as validation_error:
                logger.warning(f"AI response validation failed: {validation_error}, storing raw data")
                parsed_data = raw_parsed_data
                parse_status = "completed"
        except ValueError as e:
            # Both AI providers failed - still create record
            logger.error(f"AI parsing failed: {e}")

        # Step 6: Insert resume record to database
        result = await self._create_resume_record(
            resume_id=resume_id,
            user_id=user_id,
            file_name=file_name,
            file_path=storage_path,
            parsed_data=parsed_data,
            parse_status=parse_status,
            ai_provider_used=ai_provider_used,
        )

        # Step 7: Record usage ONLY if parsing succeeded
        if parse_status == "completed":
            await self.usage_service.record_usage(
                user_id=user_id,
                operation_type="resume_parse",
                ai_provider=ai_provider_used,
                credits_used=1,
            )

        return result

    async def _create_resume_record(
        self,
        resume_id: str,
        user_id: str,
        file_name: str,
        file_path: str,
        parsed_data: Optional[Dict[str, Any]],
        parse_status: str,
        ai_provider_used: Optional[str],
    ) -> Dict[str, Any]:
        """Create resume record in database.

        Args:
            resume_id: Generated resume UUID.
            user_id: User's UUID.
            file_name: Original filename.
            file_path: Storage path (without bucket prefix).
            parsed_data: Parsed resume data or None.
            parse_status: Status (pending, completed, failed).
            ai_provider_used: AI provider name or None.

        Returns:
            Dictionary with resume data and metadata.
        """
        insert_data = {
            "id": resume_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_path": file_path,
            "parsed_data": parsed_data,
            "parse_status": parse_status,
        }

        response = (
            self.admin_client.table("resumes").insert(insert_data).execute()
        )

        resume_record = response.data[0]

        return {
            "resume": {
                "id": resume_record["id"],
                "user_id": resume_record["user_id"],
                "file_name": resume_record["file_name"],
                "file_path": resume_record["file_path"],
                "parsed_data": resume_record["parsed_data"],
                "parse_status": resume_record["parse_status"],
                "created_at": resume_record["created_at"],
                "updated_at": resume_record["updated_at"],
            },
            "ai_provider_used": ai_provider_used,
        }

    async def list_resumes(self, user_id: str) -> list[dict]:
        """List all resumes for a user with is_active computed.

        Args:
            user_id: User's UUID.

        Returns:
            List of resumes with is_active field computed.
        """
        # Use admin client with manual user_id filtering (RLS requires user JWT in client)
        # Get user's active_resume_id
        profile_response = (
            self.admin_client.table("profiles")
            .select("active_resume_id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        active_resume_id = (
            profile_response.data.get("active_resume_id")
            if profile_response and profile_response.data
            else None
        )

        # Get all resumes ordered by created_at DESC
        resumes_response = (
            self.admin_client.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        # Add computed is_active field
        resumes_with_active = [
            {**resume, "is_active": resume["id"] == active_resume_id}
            for resume in resumes_response.data
        ]

        return resumes_with_active

    async def get_resume(self, user_id: str, resume_id: str) -> Optional[dict]:
        """Get a single resume by ID with user_id filtering.

        Args:
            user_id: User's UUID.
            resume_id: Resume's UUID.

        Returns:
            Resume data with is_active computed, or None if not found.
        """
        # Use admin client with manual user_id filtering
        # Get user's active_resume_id
        profile_response = (
            self.admin_client.table("profiles")
            .select("active_resume_id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        active_resume_id = (
            profile_response.data.get("active_resume_id")
            if profile_response and profile_response.data
            else None
        )

        # Get resume with user_id filtering
        resume_response = (
            self.admin_client.table("resumes")
            .select("*")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not resume_response or not resume_response.data:
            return None

        resume = resume_response.data
        resume["is_active"] = resume["id"] == active_resume_id

        return resume

    async def get_signed_download_url(
        self, file_path: str, expires_in: int = 3600
    ) -> str:
        """Generate a signed URL for resume download.

        Args:
            file_path: Storage path without bucket prefix (e.g., "user-uuid/resume-uuid.pdf")
            expires_in: URL expiry in seconds (default 1 hour)

        Returns:
            Signed URL for direct file download

        Raises:
            ApiException: If signed URL generation fails.
        """
        try:
            result = self.admin_client.storage.from_("resumes").create_signed_url(
                path=file_path,
                expires_in=expires_in,
            )
            return result["signedURL"]
        except Exception as e:
            logger.error(f"Failed to generate signed URL for {file_path}: {e}")
            raise ApiException(
                code=ErrorCode.VALIDATION_ERROR,
                message="Failed to generate download URL",
                status_code=500,
            )

    async def update_parsed_data(
        self, user_id: str, resume_id: str, parsed_data: dict
    ) -> Optional[dict]:
        """Update the parsed_data for a resume.

        Performs a shallow merge: existing top-level keys not present in
        ``parsed_data`` are preserved (e.g. ``summary``).  Keys that ARE
        present are fully replaced (e.g. ``experience``).

        Args:
            user_id: User's UUID.
            resume_id: Resume's UUID.
            parsed_data: Validated parsed data dictionary (partial).

        Returns:
            Updated resume data with is_active computed, or None if not found.
        """
        # Verify resume exists and belongs to user
        resume = await self.get_resume(user_id, resume_id)
        if not resume:
            return None

        # Merge: preserve existing keys not sent by the client (e.g. summary)
        existing_data = resume.get("parsed_data") or {}
        merged_data = {**existing_data, **parsed_data}

        # Update parsed_data column
        response = (
            self.admin_client.table("resumes")
            .update({"parsed_data": merged_data})
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            return None

        updated_resume = response.data[0]
        # Carry over is_active from the get_resume call
        updated_resume["is_active"] = resume["is_active"]

        return updated_resume

    async def set_active_resume(self, user_id: str, resume_id: str) -> bool:
        """Set a resume as the user's active resume.

        Args:
            user_id: User's UUID.
            resume_id: Resume's UUID to set as active.

        Returns:
            True if successful, False if resume not found.
        """
        # Verify resume exists and belongs to user
        resume_response = (
            self.admin_client.table("resumes")
            .select("id")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not resume_response or not resume_response.data:
            return False

        # Update profile's active_resume_id using admin client
        self.admin_client.table("profiles").update(
            {"active_resume_id": resume_id}
        ).eq("id", user_id).execute()

        return True

    async def delete_resume(self, user_id: str, resume_id: str) -> bool:
        """Delete a resume and its storage file.

        Args:
            user_id: User's UUID.
            resume_id: Resume's UUID to delete.

        Returns:
            True if successful, False if resume not found.
        """
        # 1. Verify resume exists and get file_path
        resume_response = (
            self.admin_client.table("resumes")
            .select("id, file_path")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not resume_response or not resume_response.data:
            return False

        file_path = resume_response.data["file_path"]

        # 2. Check if this resume is active, clear if so
        profile_response = (
            self.admin_client.table("profiles")
            .select("active_resume_id")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        if (
            profile_response
            and profile_response.data
            and profile_response.data.get("active_resume_id") == resume_id
        ):
            self.admin_client.table("profiles").update(
                {"active_resume_id": None}
            ).eq("id", user_id).execute()

        # 3. Delete resume record
        self.admin_client.table("resumes").delete().eq("id", resume_id).eq("user_id", user_id).execute()

        # 4. Delete storage file (handle errors gracefully)
        try:
            self.admin_client.storage.from_("resumes").remove([file_path])
        except Exception as e:
            logger.error(f"Failed to delete storage file {file_path}: {e}")
            # Don't fail the request - record is deleted, storage will be orphaned

        return True
