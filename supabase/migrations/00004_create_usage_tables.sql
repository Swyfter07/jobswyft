-- Migration: 00004_create_usage_tables
-- Description: Create usage_events table for credit tracking and global_config for tier limits
-- Date: 2026-01-31

-- Create usage_events table
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  ai_provider TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  period_type TEXT NOT NULL,
  period_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE usage_events IS 'Tracks credit usage for AI operations';
COMMENT ON COLUMN usage_events.operation_type IS 'Type: resume_parse, match, cover_letter, answer, outreach';
COMMENT ON COLUMN usage_events.period_type IS 'Type: lifetime (free), monthly (paid)';
COMMENT ON COLUMN usage_events.period_key IS 'Key: "lifetime" for free, "2026-01" for monthly';

-- Create composite index for efficient credit queries
CREATE INDEX idx_usage_events_user_period ON usage_events(user_id, period_type, period_key);

-- Enable Row Level Security
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own usage events
CREATE POLICY "Users can view own usage events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role inserts usage events (no direct user insert)
-- Usage events are inserted via admin client in resume_service

-- Create global_config table for system configuration
CREATE TABLE global_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE global_config IS 'System-wide configuration values (read by service role)';

-- Trigger for updated_at
CREATE TRIGGER update_global_config_updated_at
  BEFORE UPDATE ON global_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed tier_limits configuration
INSERT INTO global_config (key, value, description)
VALUES (
  'tier_limits',
  '{
    "free": {
      "type": "lifetime",
      "credits": 5,
      "max_resumes": 5
    },
    "pro": {
      "type": "monthly",
      "credits": 100,
      "max_resumes": 10
    },
    "unlimited": {
      "type": "monthly",
      "credits": -1,
      "max_resumes": 25
    }
  }'::jsonb,
  'Credit limits per subscription tier. credits=-1 means unlimited.'
);

-- No RLS on global_config - read via service role only
