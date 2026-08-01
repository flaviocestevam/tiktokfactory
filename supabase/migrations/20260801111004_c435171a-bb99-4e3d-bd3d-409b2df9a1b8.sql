ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_tiktok_url text,
  ADD COLUMN IF NOT EXISTS resolved_tiktok_url text,
  ADD COLUMN IF NOT EXISTS tiktok_product_id text,
  ADD COLUMN IF NOT EXISTS tiktok_region text,
  ADD COLUMN IF NOT EXISTS last_analyzed_at timestamptz,
  ADD COLUMN IF NOT EXISTS vendedor text,
  ADD COLUMN IF NOT EXISTS desconto text,
  ADD COLUMN IF NOT EXISTS cupom text,
  ADD COLUMN IF NOT EXISTS frete text,
  ADD COLUMN IF NOT EXISTS quantidade_vendida text,
  ADD COLUMN IF NOT EXISTS numero_avaliacoes text,
  ADD COLUMN IF NOT EXISTS imagem_principal text,
  ADD COLUMN IF NOT EXISTS imagens_enviadas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS descricao_colada text,
  ADD COLUMN IF NOT EXISTS origem_dados jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS cta_tipo text,
  ADD COLUMN IF NOT EXISTS etapa integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reference_image_url text,
  ADD COLUMN IF NOT EXISTS reference_image_path text,
  ADD COLUMN IF NOT EXISTS image_prompt_used text,
  ADD COLUMN IF NOT EXISTS image_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imagem_produto_referencia text;

ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS variante integer,
  ADD COLUMN IF NOT EXISTS angulo_nome text,
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS publico text,
  ADD COLUMN IF NOT EXISTS emocao text,
  ADD COLUMN IF NOT EXISTS gancho_visual text,
  ADD COLUMN IF NOT EXISTS duracao_estimada numeric,
  ADD COLUMN IF NOT EXISTS palavras integer;

ALTER TABLE public.video_prompts
  ADD COLUMN IF NOT EXISTS script_id uuid REFERENCES public.scripts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS video_prompts_script_id_idx ON public.video_prompts(script_id);

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS vocabulario text,
  ADD COLUMN IF NOT EXISTS palavras_proibidas text,
  ADD COLUMN IF NOT EXISTS objecoes_comuns text,
  ADD COLUMN IF NOT EXISTS regras_imagem text,
  ADD COLUMN IF NOT EXISTS regras_video text,
  ADD COLUMN IF NOT EXISTS regras_flow text;