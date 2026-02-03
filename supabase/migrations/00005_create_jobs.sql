-- Migration: 00005_create_jobs.sql
-- Create jobs table for storing scanned job data

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    employment_type TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'accepted')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_created ON public.jobs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own jobs"
    ON public.jobs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own jobs"
    ON public.jobs FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own jobs"
    ON public.jobs FOR DELETE
    USING (user_id = auth.uid());

-- Auto-update updated_at trigger
-- Note: Function may already exist from previous migrations - OR REPLACE handles this
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
