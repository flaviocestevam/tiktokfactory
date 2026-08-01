alter table public.clips add column if not exists status text not null default 'pendente';
alter table public.projects add column if not exists reference_image_uploaded_at timestamptz;
alter table public.projects add column if not exists personagem_motivo text;
alter table public.scripts add column if not exists aprovado boolean not null default false;
alter table public.scripts add column if not exists clipes_json jsonb;