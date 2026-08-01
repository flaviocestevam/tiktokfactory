ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS duracao_fala numeric,
  ADD COLUMN IF NOT EXISTS duracao_total numeric,
  ADD COLUMN IF NOT EXISTS num_clipes integer,
  ADD COLUMN IF NOT EXISTS plano_clipes jsonb;

CREATE TABLE IF NOT EXISTS public.clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  script_id uuid NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  ordem integer NOT NULL,
  duracao integer NOT NULL,
  fala text,
  acao text,
  gesto text,
  expressao text,
  camera text,
  posicao_produto text,
  estado_inicial text,
  estado_final text,
  continuidade text,
  ligacao_proximo text,
  restricoes text,
  prompt_negativo text,
  prompt_flow text,
  duracao_fala numeric,
  duracao_estimada numeric,
  palavras integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clips_script_ordem_idx ON public.clips(script_id, ordem);

GRANT ALL ON public.clips TO service_role;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;