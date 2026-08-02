ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_image_analysis jsonb,
  ADD COLUMN IF NOT EXISTS image_analysis_at timestamptz,
  ADD COLUMN IF NOT EXISTS image_analysis_status text;