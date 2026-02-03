"""Job service for CRUD operations on scanned jobs."""

import logging
from typing import Any, Dict, Optional

from app.core.exceptions import DatabaseError
from app.db.client import get_supabase_client

logger = logging.getLogger(__name__)

# Constants
UUID_LOG_LENGTH = 8  # Number of characters to show in logs for privacy


class JobService:
    """Service for managing job records."""

    def __init__(self):
        """Initialize job service."""
        self.client = get_supabase_client()

    async def create_job(self, user_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new job record.

        Args:
            user_id: User's UUID.
            job_data: Job data from request.

        Returns:
            Created job record.

        Raises:
            Exception: If database insert fails.
        """
        try:
            insert_data = {
                "user_id": user_id,
                "title": job_data["title"],
                "company": job_data["company"],
                "description": job_data["description"],
                "location": job_data.get("location"),
                "salary_range": job_data.get("salary_range"),
                "employment_type": job_data.get("employment_type"),
                "source_url": job_data.get("source_url"),
                "status": job_data.get("status", "saved"),  # Default to "saved" if not provided
            }

            response = self.client.table("jobs").insert(insert_data).execute()

            job = response.data[0]
            logger.info(f"Job created - user: {user_id[:UUID_LOG_LENGTH]}..., job_id: {job['id'][:UUID_LOG_LENGTH]}..., status: {insert_data['status']}")

            return job
        except Exception as e:
            logger.error(f"Failed to create job for user {user_id[:UUID_LOG_LENGTH]}...: {e}")
            raise DatabaseError("Failed to save job. Please try again.")

    async def get_job(self, user_id: str, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a single job by ID.

        Args:
            user_id: User's UUID (for logging only; RLS enforces access).
            job_id: Job's UUID.

        Returns:
            Job data or None if not found/access denied by RLS.

        Raises:
            Exception: If database query fails.
        """
        try:
            response = (
                self.client.table("jobs")
                .select("*")
                .eq("id", job_id)
                .maybe_single()
                .execute()
            )

            if not response or not response.data:
                return None

            logger.info(f"Job retrieved - user: {user_id[:UUID_LOG_LENGTH]}..., job_id: {job_id[:UUID_LOG_LENGTH]}...")
            return response.data
        except Exception as e:
            logger.error(f"Failed to get job {job_id[:UUID_LOG_LENGTH]}... for user {user_id[:UUID_LOG_LENGTH]}...: {e}")
            raise DatabaseError("Failed to retrieve job. Please try again.")

    async def update_job(
        self, user_id: str, job_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a job with partial data.

        Args:
            user_id: User's UUID (for logging only; RLS enforces access).
            job_id: Job's UUID.
            updates: Dictionary of fields to update.

        Returns:
            Updated job data or None if not found/access denied by RLS.

        Raises:
            Exception: If database query fails.
        """
        try:
            # Verify job exists and belongs to user (RLS auto-filters)
            existing = (
                self.client.table("jobs")
                .select("*")
                .eq("id", job_id)
                .maybe_single()
                .execute()
            )

            if not existing or not existing.data:
                return None

            # Filter out None values for partial update
            update_data = {k: v for k, v in updates.items() if v is not None}

            if not update_data:
                # Nothing to update, return existing job (reuse from above)
                return existing.data

            # Perform update (RLS ensures only owner can update)
            result = (
                self.client.table("jobs")
                .update(update_data)
                .eq("id", job_id)
                .execute()
            )

            if not result.data:
                return None

            logger.info(
                f"Job updated - user: {user_id[:UUID_LOG_LENGTH]}..., job_id: {job_id[:UUID_LOG_LENGTH]}..., fields: {list(update_data.keys())}"
            )
            return result.data[0]
        except Exception as e:
            logger.error(f"Failed to update job {job_id[:UUID_LOG_LENGTH]}... for user {user_id[:UUID_LOG_LENGTH]}...: {e}")
            raise DatabaseError("Failed to update job. Please try again.")

    async def list_jobs(
        self, user_id: str, filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """List jobs with pagination and filtering.

        Args:
            user_id: User's UUID (for logging only; RLS enforces access).
            filters: Dictionary with status, page, page_size, sort options.

        Returns:
            Paginated list of jobs with total count.

        Raises:
            Exception: If database query fails.
        """
        try:
            page = filters.get("page", 1)
            page_size = filters.get("page_size", 20)
            sort_field = filters.get("sort", "updated_at")
            status_filter = filters.get("status")

            # Build query with count (RLS auto-filters by user_id)
            # NOTE: count="exact" triggers full table scan - for 10K+ jobs, use count="planned"
            query = self.client.table("jobs").select("*", count="exact")

            # Apply status filter if provided
            if status_filter:
                query = query.eq("status", status_filter)

            # Apply sorting (descending by default for updated_at)
            query = query.order(sort_field, desc=True)

            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size - 1
            query = query.range(start, end)

            # Execute query
            result = query.execute()

            # Build response items with notes_preview
            items = []
            for job in result.data:
                notes = job.get("notes") or ""
                notes_preview = notes[:100] if notes else None

                items.append({
                    "id": job["id"],
                    "title": job["title"],
                    "company": job["company"],
                    "status": job["status"],
                    "notes_preview": notes_preview,
                    "created_at": job["created_at"],
                    "updated_at": job["updated_at"],
                })

            logger.info(
                f"Jobs listed - user: {user_id[:UUID_LOG_LENGTH]}..., count: {len(items)}, total: {result.count}"
            )

            return {
                "items": items,
                "total": result.count or 0,
                "page": page,
                "page_size": page_size,
            }
        except Exception as e:
            logger.error(f"Failed to list jobs for user {user_id[:UUID_LOG_LENGTH]}...: {e}")
            raise DatabaseError("Failed to list jobs. Please try again.")

    async def update_job_status(
        self, user_id: str, job_id: str, status: str
    ) -> Optional[Dict[str, Any]]:
        """Update job status.

        Args:
            user_id: User's UUID.
            job_id: Job's UUID.
            status: New status value.

        Returns:
            Updated job data or None if not found.

        Raises:
            Exception: If database query fails.
        """
        # Reuse existing update_job method for status update
        result = await self.update_job(user_id, job_id, {"status": status})
        if result:
            logger.info(
                f"Job status updated - job_id: {job_id[:UUID_LOG_LENGTH]}..., new_status: {status}"
            )
        return result

    async def delete_job(self, user_id: str, job_id: str) -> bool:
        """Delete a job.

        Args:
            user_id: User's UUID (for logging only; RLS enforces access).
            job_id: Job's UUID.

        Returns:
            True if job was deleted, False if not found/access denied by RLS.

        Raises:
            Exception: If database query fails.
        """
        try:
            # Verify job exists and belongs to user first (RLS enforces)
            existing = await self.get_job(user_id, job_id)
            if not existing:
                return False

            # Delete the job (RLS ensures only owner can delete)
            self.client.table("jobs").delete().eq("id", job_id).execute()

            logger.info(f"Job deleted - job_id: {job_id[:UUID_LOG_LENGTH]}...")
            return True
        except Exception as e:
            logger.error(f"Failed to delete job {job_id[:UUID_LOG_LENGTH]}...: {e}")
            raise DatabaseError("Failed to delete job. Please try again.")

    async def update_job_notes(
        self, user_id: str, job_id: str, notes: str
    ) -> Optional[Dict[str, Any]]:
        """Update job notes.

        Args:
            user_id: User's UUID.
            job_id: Job's UUID.
            notes: New notes content.

        Returns:
            Updated job data or None if not found.

        Raises:
            Exception: If database query fails.
        """
        # Reuse existing update_job method for notes update
        result = await self.update_job(user_id, job_id, {"notes": notes})
        if result:
            logger.info(
                f"Job notes updated - job_id: {job_id[:UUID_LOG_LENGTH]}..., notes_length: {len(notes)}"
            )
        return result
