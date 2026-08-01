ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS foto_canonica_path text,
  ADD COLUMN IF NOT EXISTS foto_atualizada_em timestamptz,
  ADD COLUMN IF NOT EXISTS identidade_visual_confirmada boolean NOT NULL DEFAULT false;