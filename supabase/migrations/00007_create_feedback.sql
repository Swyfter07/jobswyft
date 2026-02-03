-- Migration: Create feedback table for user feedback collection
-- Story: 7.2 - Feedback API (FR78, FR79, FR80)

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraints
ALTER TABLE feedback
ADD CONSTRAINT feedback_content_not_empty CHECK (char_length(content) >= 10),
ADD CONSTRAINT feedback_content_max_length CHECK (char_length(content) <= 5000),
ADD CONSTRAINT feedback_category_valid CHECK (
    category IN ('bug', 'feature_request', 'general', 'praise', 'complaint')
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback (for future "my feedback" feature)
CREATE POLICY "Users can read own feedback"
ON feedback FOR SELECT
USING (auth.uid() = user_id);

-- Service role bypasses RLS by default (for admin analysis)

-- Indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_category_created ON feedback(category, created_at DESC);

-- Comments
COMMENT ON TABLE feedback IS 'User feedback for product improvement. User_id SET NULL on account deletion preserves feedback for analysis.';
COMMENT ON COLUMN feedback.category IS 'Feedback type: bug, feature_request, general, praise, complaint';
COMMENT ON COLUMN feedback.context IS 'Flexible JSONB for page_url, feature_used, browser, extension_version, etc.';
