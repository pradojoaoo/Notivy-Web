-- Permissões especiais de exportação ficam separadas do uso mensal.
-- O aplicativo pode consultar apenas a permissão da própria conta e nunca alterá-la.
create table public.export_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unlimited_exports boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.export_entitlements is
  'Permissões administrativas de exportação por conta do Notivy.';

revoke all on table public.export_entitlements from anon, authenticated;
grant select on table public.export_entitlements to authenticated;

alter table public.export_entitlements enable row level security;

create policy "Users can read their own export entitlement"
  on public.export_entitlements
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
  with entitlement as (
    select coalesce((
      select unlimited_exports
      from public.export_entitlements
      where user_id = (select auth.uid())
    ), false) as is_unlimited
  )
  select
    case
      when is_unlimited then 0
      when exists (
        select 1
        from public.monthly_exports
        where user_id = (select auth.uid())
          and month_start = date_trunc(
            'month',
            timezone('America/Sao_Paulo', now())
          )::date
      ) then 1
      else 0
    end,
    case when is_unlimited then 2147483647 else 1 end,
    (
      date_trunc('month', timezone('America/Sao_Paulo', now()))
      + interval '1 month'
    ) at time zone 'America/Sao_Paulo'
  from entitlement;
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
security invoker
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
  v_unlimited boolean := false;
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

  select coalesce((
    select unlimited_exports
    from public.export_entitlements
    where user_id = v_user_id
  ), false)
  into v_unlimited;

  if v_unlimited then
    return query select true, 0, 2147483647, v_resets_at;
    return;
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

revoke execute on function public.get_monthly_export_status() from public, anon;
revoke execute on function public.claim_monthly_export(uuid) from public, anon;
grant execute on function public.get_monthly_export_status() to authenticated;
grant execute on function public.claim_monthly_export(uuid) to authenticated;
