-- Migration: Add deletion token fields to profiles table
-- Story: 7.1 Privacy & Data Deletion API
-- Purpose: Store hashed deletion confirmation tokens with expiry for GDPR compliance

-- Add deletion token fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deletion_token_hash TEXT,
ADD COLUMN IF NOT EXISTS deletion_token_expires TIMESTAMPTZ;

-- Partial index for non-null tokens (performance optimization)
-- Reduces index size by excluding profiles without pending deletions
-- Token lookup happens on confirm-delete endpoint using the hash
-- Note: Cannot use NOW() in partial index (not immutable), so we only filter on IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_token
ON profiles(deletion_token_hash)
WHERE deletion_token_hash IS NOT NULL;

-- Documentation comments
COMMENT ON COLUMN profiles.deletion_token_hash IS 'SHA-256 hash of deletion confirmation token (48-byte token = 384 bits entropy). Never store plaintext.';
COMMENT ON COLUMN profiles.deletion_token_expires IS 'Expiry timestamp for deletion token (24 hours from request). Expired tokens remain until new request or account deletion.';

-- Note: Service role bypasses RLS, so no policy changes needed for admin_client access.
-- The privacy service uses admin_client for all deletion operations.
