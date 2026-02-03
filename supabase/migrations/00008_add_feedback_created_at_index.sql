-- Migration: Add standalone created_at index for time-based queries
-- Story: 7.2 - Code Review Fix
-- Context: Admin queries by date without category filter need optimization

-- Add standalone created_at index for time-range queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Comment
COMMENT ON INDEX idx_feedback_created_at IS 'Optimizes time-range queries without category filter (e.g., "all feedback from last week")';
