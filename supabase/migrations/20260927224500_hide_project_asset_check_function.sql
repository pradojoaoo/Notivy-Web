-- A política precisa executar esta verificação com privilégios do proprietário
-- para não reentrar no RLS do Storage, mas ela não precisa ficar exposta como
-- RPC pela API pública.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.notification_project_has_assets(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from storage.objects
    where bucket_id = 'notivy-assets'
      and name in (
        (select auth.uid())::text || '/' || p_project_id::text || '/background',
        (select auth.uid())::text || '/' || p_project_id::text || '/icon'
      )
  );
$$;

revoke all on function private.notification_project_has_assets(uuid)
  from public, anon;
grant execute on function private.notification_project_has_assets(uuid)
  to authenticated;

drop policy if exists "Users can delete their own notification projects"
  on public.notification_projects;

create policy "Users can delete their own notification projects"
  on public.notification_projects
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and not private.notification_project_has_assets(id)
  );

drop function public.notification_project_has_assets(uuid);
