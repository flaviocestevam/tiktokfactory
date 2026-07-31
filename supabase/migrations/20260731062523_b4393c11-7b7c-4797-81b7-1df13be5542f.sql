drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.profiles cascade;

drop policy if exists characters_own on public.characters;
drop policy if exists image_prompts_own on public.image_prompts;
drop policy if exists products_own on public.products;
drop policy if exists projects_own on public.projects;
drop policy if exists scenarios_own on public.scenarios;
drop policy if exists scripts_own on public.scripts;
drop policy if exists strategies_own on public.strategies;
drop policy if exists templates_own on public.templates;
drop policy if exists version_history_own on public.version_history;
drop policy if exists video_prompts_own on public.video_prompts;
drop policy if exists media_select_own on storage.objects;
drop policy if exists media_insert_own on storage.objects;
drop policy if exists media_update_own on storage.objects;
drop policy if exists media_delete_own on storage.objects;

alter table public.characters drop column if exists user_id;
alter table public.image_prompts drop column if exists user_id;
alter table public.products drop column if exists user_id;
alter table public.projects drop column if exists user_id;
alter table public.scenarios drop column if exists user_id;
alter table public.scripts drop column if exists user_id;
alter table public.strategies drop column if exists user_id;
alter table public.templates drop column if exists user_id;
alter table public.version_history drop column if exists user_id;
alter table public.video_prompts drop column if exists user_id;

do $$
declare t text;
begin
  foreach t in array array['characters','image_prompts','products','projects','scenarios','scripts','strategies','templates','version_history','video_prompts']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;