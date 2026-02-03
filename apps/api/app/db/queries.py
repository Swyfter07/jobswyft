"""Common database queries."""

from typing import Any, Dict, Optional

from app.db.client import get_supabase_admin_client


async def get_profile_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user's profile by ID.

    Args:
        user_id: The user's UUID.

    Returns:
        Profile data or None if not found.
    """
    client = get_supabase_admin_client()
    result = client.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data if result.data else None


async def update_profile(user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a user's profile.

    Args:
        user_id: The user's UUID.
        data: Profile data to update.

    Returns:
        Updated profile data or None if update failed.
    """
    client = get_supabase_admin_client()
    result = (
        client.table("profiles")
        .update(data)
        .eq("id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None
