"""Supabase client initialization and management."""

from supabase import Client, create_client

from app.core.config import settings


def get_supabase_client() -> Client:
    """Get the Supabase client with anon key.

    This client is used for RLS-enforced queries where
    the user's session determines access.
    
    WARNING: Do not cache this client. It may hold session state.

    Returns:
        Supabase client configured with anon key.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )


def get_supabase_admin_client() -> Client:
    """Get the Supabase admin client with service role key.

    This client bypasses RLS and should be used only for
    admin operations like profile creation.

    Returns:
        Supabase client configured with service role key.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
