-- Limita apenas os recursos persistidos na nuvem. A edição e a exportação de
-- PNG continuam locais e ilimitadas.

alter table public.notification_projects
  add constraint notification_projects_editor_state_size
  check (octet_length(editor_state::text) <= 65536);

create or replace function public.enforce_notification_project_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select count(*)
  into v_project_count
  from public.notification_projects
  where user_id = new.user_id;

  if v_project_count >= 100 then
    raise exception 'project_limit_reached' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_notification_project_limit()
  from public, anon, authenticated;

create trigger enforce_notification_project_limit_before_insert
before insert on public.notification_projects
for each row execute function public.enforce_notification_project_limit();

-- O editor usa exatamente duas chaves por projeto:
-- <user_id>/<project_id>/background e <user_id>/<project_id>/icon.
-- Exigir um projeto existente limita cada conta a no máximo 200 objetos.
drop policy if exists "Users can read their own Notivy assets" on storage.objects;
drop policy if exists "Users can upload their own Notivy assets" on storage.objects;
drop policy if exists "Users can replace their own Notivy assets" on storage.objects;
drop policy if exists "Users can delete their own Notivy assets" on storage.objects;

create policy "Users can read their own Notivy assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'notivy-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) in ('background', 'icon')
    and exists (
      select 1
      from public.notification_projects
      where user_id = (select auth.uid())
        and id::text = (storage.foldername(name))[2]
    )
  );

create policy "Users can upload their own Notivy assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'notivy-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) in ('background', 'icon')
    and exists (
      select 1
      from public.notification_projects
      where user_id = (select auth.uid())
        and id::text = (storage.foldername(name))[2]
    )
  );

create policy "Users can replace their own Notivy assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'notivy-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) in ('background', 'icon')
    and exists (
      select 1
      from public.notification_projects
      where user_id = (select auth.uid())
        and id::text = (storage.foldername(name))[2]
    )
  )
  with check (
    bucket_id = 'notivy-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) in ('background', 'icon')
    and exists (
      select 1
      from public.notification_projects
      where user_id = (select auth.uid())
        and id::text = (storage.foldername(name))[2]
    )
  );

create policy "Users can delete their own Notivy assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'notivy-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) in ('background', 'icon')
    and exists (
      select 1
      from public.notification_projects
      where user_id = (select auth.uid())
        and id::text = (storage.foldername(name))[2]
    )
  );

-- A aplicação remove os arquivos antes do projeto. Esta condição também evita
-- que chamadas diretas deixem objetos órfãos e inacessíveis.
drop policy if exists "Users can delete their own notification projects"
  on public.notification_projects;

create policy "Users can delete their own notification projects"
  on public.notification_projects
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and not exists (
      select 1
      from storage.objects
      where bucket_id = 'notivy-assets'
        and name like (select auth.uid())::text || '/' || notification_projects.id::text || '/%'
    )
  );
