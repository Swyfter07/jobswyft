-- Migration: 00003_create_resumes_bucket
-- Description: Create resumes storage bucket with RLS policies
-- Date: 2026-01-31

-- Create the resumes storage bucket (private, not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can upload to their own folder
-- Path format: {user_id}/{filename}
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Users can view files in their own folder
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Users can update files in their own folder
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Users can delete files in their own folder
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
