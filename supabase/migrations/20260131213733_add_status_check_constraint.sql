-- Migration: Add CHECK constraint to status column and ensure description is NOT NULL
-- This migration adds validation that was missing from the original migration

-- First, remove any test data with invalid status values
DELETE FROM public.jobs WHERE status NOT IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'accepted');

-- Ensure description is NOT NULL (may already be enforced, but adding for safety)
ALTER TABLE public.jobs ALTER COLUMN description SET NOT NULL;

-- Add CHECK constraint for status enum
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'accepted'));
