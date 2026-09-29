-- Evita recursão entre a política de exclusão de projetos e as políticas de
-- objetos do Storage. A função roda com o proprietário do banco, mas só
-- verifica as duas chaves permitidas para o usuário autenticado.
create or replace function public.notification_project_has_assets(p_project_id uuid)
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

revoke all on function public.notification_project_has_assets(uuid)
  from public, anon;
grant execute on function public.notification_project_has_assets(uuid)
  to authenticated;

drop policy if exists "Users can delete their own notification projects"
  on public.notification_projects;

create policy "Users can delete their own notification projects"
  on public.notification_projects
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and not public.notification_project_has_assets(id)
  );
