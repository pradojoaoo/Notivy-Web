-- Uma linha por usuário e mês torna o limite atômico, inclusive com cliques simultâneos.
create table public.monthly_exports (
  user_id uuid not null references auth.users (id) on delete cascade,
  month_start date not null,
  exported_at timestamptz not null default now(),
  project_id uuid references public.notification_projects (id) on delete set null,

  primary key (user_id, month_start),
  constraint monthly_exports_month_starts_on_first_day
    check (extract(day from month_start) = 1)
);

comment on table public.monthly_exports is
  'Registro da exportação mensal incluída no plano FREE do Notivy.';

create index monthly_exports_project_idx
  on public.monthly_exports (project_id)
  where project_id is not null;

-- O navegador pode consultar a própria cota, mas não inserir ou alterar registros diretamente.
revoke all on table public.monthly_exports from anon;
revoke all on table public.monthly_exports from authenticated;
grant select on table public.monthly_exports to authenticated;

alter table public.monthly_exports enable row level security;

create policy "Users can read their own monthly exports"
  on public.monthly_exports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.get_monthly_export_status()
returns table (
  used_count integer,
  monthly_limit integer,
  resets_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    case when exists (
      select 1
      from public.monthly_exports
      where user_id = (select auth.uid())
        and month_start = date_trunc(
          'month',
          timezone('America/Sao_Paulo', now())
        )::date
    ) then 1 else 0 end,
    1,
    (
      date_trunc('month', timezone('America/Sao_Paulo', now()))
      + interval '1 month'
    ) at time zone 'America/Sao_Paulo';
$$;

create or replace function public.claim_monthly_export(
  p_project_id uuid default null
)
returns table (
  allowed boolean,
  used_count integer,
  monthly_limit integer,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_month_start date := date_trunc(
    'month',
    timezone('America/Sao_Paulo', now())
  )::date;
  v_resets_at timestamptz := (
    date_trunc('month', timezone('America/Sao_Paulo', now()))
    + interval '1 month'
  ) at time zone 'America/Sao_Paulo';
  v_inserted_rows integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;

  if p_project_id is not null and not exists (
    select 1
    from public.notification_projects
    where id = p_project_id
      and user_id = v_user_id
  ) then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  insert into public.monthly_exports (user_id, month_start, project_id)
  values (v_user_id, v_month_start, p_project_id)
  on conflict (user_id, month_start) do nothing;

  get diagnostics v_inserted_rows = row_count;

  return query select
    v_inserted_rows = 1,
    1,
    1,
    v_resets_at;
end;
$$;

-- Funções públicas recebem EXECUTE de PUBLIC por padrão; removemos e liberamos só ao app autenticado.
revoke execute on function public.get_monthly_export_status() from public, anon;
revoke execute on function public.claim_monthly_export(uuid) from public, anon;
grant execute on function public.get_monthly_export_status() to authenticated;
grant execute on function public.claim_monthly_export(uuid) to authenticated;
