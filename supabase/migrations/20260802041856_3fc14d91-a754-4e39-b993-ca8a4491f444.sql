ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS redirected_tiktok_url text,
  ADD COLUMN IF NOT EXISTS canonical_tiktok_url text,
  ADD COLUMN IF NOT EXISTS fetch_tiktok_url text,
  ADD COLUMN IF NOT EXISTS tiktok_country_code text,
  ADD COLUMN IF NOT EXISTS tiktok_market text,
  ADD COLUMN IF NOT EXISTS source_language text,
  ADD COLUMN IF NOT EXISTS source_locale text,
  ADD COLUMN IF NOT EXISTS currency_code text,
  ADD COLUMN IF NOT EXISTS currency_symbol text,
  ADD COLUMN IF NOT EXISTS original_product_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS normalized_product_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extraction_method text,
  ADD COLUMN IF NOT EXISTS extraction_status text,
  ADD COLUMN IF NOT EXISTS extraction_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extraction_error_code text,
  ADD COLUMN IF NOT EXISTS images_downloaded_at timestamptz;

CREATE INDEX IF NOT EXISTS products_tiktok_product_id_idx
  ON public.products (tiktok_product_id, tiktok_country_code);
CREATE INDEX IF NOT EXISTS products_canonical_tiktok_url_idx
  ON public.products (canonical_tiktok_url);