-- Políticas negativas tornam explícito que estas tabelas internas nunca são
-- acessíveis pelo cliente. A Edge Function usa service_role e ignora RLS.
create policy "Deny browser access to server export requests"
  on public.server_export_requests
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Deny browser access to server export rate limits"
  on public.server_export_rate_limits
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index server_export_requests_project_idx
  on public.server_export_requests (project_id)
  where project_id is not null;
