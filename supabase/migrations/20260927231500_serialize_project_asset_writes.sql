-- Serializa uploads/cópias e exclusões do mesmo projeto. Sem o mesmo lock,
-- uma requisição de Storage poderia validar o projeto enquanto outra o
-- excluía, deixando um objeto órfão depois dos dois commits.
create or replace function private.can_write_notification_asset(p_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_folders text[] := storage.foldername(p_name);
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null
    or array_length(v_folders, 1) <> 2
    or v_folders[1] <> v_user_id::text
    or storage.filename(p_name) not in ('background', 'icon') then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || '/' || v_folders[2], 0)
  );

  return exists (
    select 1
    from public.notification_projects
    where user_id = v_user_id
      and id::text = v_folders[2]
  );
end;
$$;

revoke all on function private.can_write_notification_asset(text)
  from public, anon;
grant execute on function private.can_write_notification_asset(text)
  to authenticated;

create or replace function private.notification_project_has_assets(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return true;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || '/' || p_project_id::text, 0)
  );

  return exists (
    select 1
    from storage.objects
    where bucket_id = 'notivy-assets'
      and name in (
        v_user_id::text || '/' || p_project_id::text || '/background',
        v_user_id::text || '/' || p_project_id::text || '/icon'
      )
  );
end;
$$;

drop policy if exists "Users can upload their own Notivy assets" on storage.objects;
drop policy if exists "Users can replace their own Notivy assets" on storage.objects;

create policy "Users can upload their own Notivy assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'notivy-assets'
    and private.can_write_notification_asset(name)
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
  )
  with check (
    bucket_id = 'notivy-assets'
    and private.can_write_notification_asset(name)
  );
