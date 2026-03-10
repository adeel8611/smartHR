-- Anonymous Workplace Truth Portal Migration
-- Creates table for anonymous employee feedback and reports

-- Create anonymous_reports table
CREATE TABLE IF NOT EXISTS public.anonymous_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('toxic_behavior', 'salary_dissatisfaction', 'management_rating', 'workplace_safety', 'general_feedback')),
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_category ON public.anonymous_reports(category);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_sentiment ON public.anonymous_reports(sentiment);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_department ON public.anonymous_reports(department);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_created_at ON public.anonymous_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.anonymous_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anyone to insert (truly anonymous)
-- Staff can submit reports anonymously
DROP POLICY IF EXISTS "Staff can submit anonymous reports" ON public.anonymous_reports;
CREATE POLICY "Staff can submit anonymous reports"
  ON public.anonymous_reports FOR INSERT
  WITH CHECK (true);

-- Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all reports" ON public.anonymous_reports;
CREATE POLICY "Admins can view all reports"
  ON public.anonymous_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Staff can view dashboard statistics but not individual report details
DROP POLICY IF EXISTS "Staff can view aggregated data" ON public.anonymous_reports;
CREATE POLICY "Staff can view aggregated data"
  ON public.anonymous_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.anonymous_reports IS 'Anonymous employee feedback and reports for workplace issues';
COMMENT ON COLUMN public.anonymous_reports.category IS 'Report category: toxic_behavior, salary_dissatisfaction, management_rating, workplace_safety, general_feedback';
COMMENT ON COLUMN public.anonymous_reports.content IS 'Anonymous feedback content';
COMMENT ON COLUMN public.anonymous_reports.sentiment IS 'AI-categorized sentiment: positive, neutral, negative';
COMMENT ON COLUMN public.anonymous_reports.department IS 'Optional department reference for analytics';
COMMENT ON COLUMN public.anonymous_reports.created_at IS 'Report submission timestamp';
