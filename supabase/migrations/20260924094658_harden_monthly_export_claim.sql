-- A função passa a respeitar os privilégios e a RLS do usuário que a chamou.
-- A permissão de INSERT é limitada às três colunas necessárias; exported_at usa o padrão do banco.
grant insert (user_id, month_start, project_id)
  on table public.monthly_exports to authenticated;

create policy "Users can claim their current monthly export"
  on public.monthly_exports
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and month_start = date_trunc(
      'month',
      timezone('America/Sao_Paulo', now())
    )::date
    and (
      project_id is null
      or exists (
        select 1
        from public.notification_projects
        where id = project_id
          and user_id = (select auth.uid())
      )
    )
  );

alter function public.claim_monthly_export(uuid) security invoker;
