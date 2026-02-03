-- Migration: 00002_create_resumes
-- Description: Create resumes table with RLS policies
-- Date: 2026-01-31

-- Create resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  parsed_data JSONB,
  parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE resumes IS 'User resume files and parsed data';
COMMENT ON COLUMN resumes.file_path IS 'Storage path: {user_id}/{uuid}.pdf (without bucket prefix)';
COMMENT ON COLUMN resumes.parse_status IS 'Status: pending (uploaded), completed (parsed), failed (parse error)';

-- Trigger to auto-update updated_at (reusing function from profiles migration)
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own resumes
CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own resumes
CREATE POLICY "Users can insert own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own resumes
CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_user_created ON resumes(user_id, created_at DESC);
