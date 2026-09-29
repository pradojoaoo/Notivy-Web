-- O navegador não pode mais registrar uma exportação nem produzir o artefato
-- final. Apenas a Edge Function, autenticada com a chave secreta do projeto,
-- pode iniciar/finalizar uma tentativa.

create table if not exists public.export_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unlimited_exports boolean not null default false,
  created_at timestamptz not null default now()
);

revoke all on table public.export_entitlements from anon, authenticated;
grant select on table public.export_entitlements to authenticated;
alter table public.export_entitlements enable row level security;

drop policy if exists "Users can read their own export entitlement"
  on public.export_entitlements;
create policy "Users can read their own export entitlement"
  on public.export_entitlements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

alter table public.monthly_exports
  add column if not exists request_id uuid;

create unique index if not exists monthly_exports_request_idx
  on public.monthly_exports (request_id)
  where request_id is not null;

create table public.server_export_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload_hash text not null,
  status text not null default 'pending',
  month_start date not null,
  project_id uuid references public.notification_projects (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint server_export_requests_hash_format
    check (payload_hash ~ '^[0-9a-f]{64}$'),
  constraint server_export_requests_status
    check (status in ('pending', 'completed', 'denied', 'failed')),
  constraint server_export_requests_month_starts_on_first_day
    check (extract(day from month_start) = 1)
);

create index server_export_requests_user_created_idx
  on public.server_export_requests (user_id, created_at desc);

revoke all on table public.server_export_requests from public, anon, authenticated;
alter table public.server_export_requests enable row level security;

create table public.server_export_rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  window_start timestamptz not null,
  attempts smallint not null default 0,
  primary key (user_id, window_start),
  constraint server_export_rate_attempts_nonnegative check (attempts >= 0)
);

revoke all on table public.server_export_rate_limits from public, anon, authenticated;
alter table public.server_export_rate_limits enable row level security;

create or replace function public.begin_server_export(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text,
  p_project_id uuid default null
)
returns table (
  allowed boolean,
  request_status text,
  used_count integer,
  monthly_limit integer,
  resets_at timestamptz,
  error_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month_start date := date_trunc(
    'month',
    timezone('America/Sao_Paulo', now())
  )::date;
  v_resets_at timestamptz := (
    date_trunc('month', timezone('America/Sao_Paulo', now()))
    + interval '1 month'
  ) at time zone 'America/Sao_Paulo';
  v_window_start timestamptz := to_timestamp(
    floor(extract(epoch from now()) / 600) * 600
  );
  v_request public.server_export_requests%rowtype;
  v_unlimited boolean := false;
  v_attempts integer;
begin
  if p_user_id is null
    or p_request_id is null
    or p_payload_hash !~ '^[0-9a-f]{64}$' then
    return query select false, 'denied', 0, 1, v_resets_at, 'invalid_request';
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 7919)
  );

  select coalesce((
    select unlimited_exports
    from public.export_entitlements
    where user_id = p_user_id
  ), false)
  into v_unlimited;

  insert into public.server_export_rate_limits (user_id, window_start, attempts)
  values (p_user_id, v_window_start, 1)
  on conflict (user_id, window_start)
  do update set attempts = public.server_export_rate_limits.attempts + 1
  returning attempts into v_attempts;

  if v_attempts > 5 then
    return query select
      false,
      'denied',
      0,
      case when v_unlimited then 2147483647 else 1 end,
      v_resets_at,
      'rate_limited';
    return;
  end if;

  select *
  into v_request
  from public.server_export_requests
  where request_id = p_request_id;

  if found then
    if v_request.user_id <> p_user_id
      or v_request.payload_hash <> p_payload_hash then
      return query select false, 'denied', 0, 1, v_resets_at, 'request_mismatch';
      return;
    end if;

    return query select
      v_request.status in ('pending', 'completed'),
      v_request.status,
      case when v_unlimited then 0 when v_request.status = 'completed' then 1 else 0 end,
      case when v_unlimited then 2147483647 else 1 end,
      v_resets_at,
      case when v_request.status = 'denied' then 'quota_exhausted' else null end;
    return;
  end if;

  if p_project_id is not null and not exists (
    select 1
    from public.notification_projects
    where id = p_project_id
      and user_id = p_user_id
  ) then
    return query select false, 'denied', 0, 1, v_resets_at, 'project_not_found';
    return;
  end if;

  if not v_unlimited and exists (
    select 1
    from public.monthly_exports
    where user_id = p_user_id
      and month_start = v_month_start
  ) then
    return query select false, 'denied', 1, 1, v_resets_at, 'quota_exhausted';
    return;
  end if;

  insert into public.server_export_requests (
    request_id,
    user_id,
    payload_hash,
    month_start,
    project_id
  )
  values (
    p_request_id,
    p_user_id,
    p_payload_hash,
    v_month_start,
    p_project_id
  );

  return query select
    true,
    'pending',
    0,
    case when v_unlimited then 2147483647 else 1 end,
    v_resets_at,
    null::text;
end;
$$;

create or replace function public.finalize_server_export(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text
)
returns table (
  allowed boolean,
  used_count integer,
  monthly_limit integer,
  resets_at timestamptz,
  error_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month_start date := date_trunc(
    'month',
    timezone('America/Sao_Paulo', now())
  )::date;
  v_resets_at timestamptz := (
    date_trunc('month', timezone('America/Sao_Paulo', now()))
    + interval '1 month'
  ) at time zone 'America/Sao_Paulo';
  v_request public.server_export_requests%rowtype;
  v_unlimited boolean := false;
  v_inserted integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 7919)
  );

  select *
  into v_request
  from public.server_export_requests
  where request_id = p_request_id
  for update;

  if not found
    or v_request.user_id <> p_user_id
    or v_request.payload_hash <> p_payload_hash then
    return query select false, 0, 1, v_resets_at, 'request_mismatch';
    return;
  end if;

  select coalesce((
    select unlimited_exports
    from public.export_entitlements
    where user_id = p_user_id
  ), false)
  into v_unlimited;

  if v_request.status = 'completed' then
    return query select
      true,
      case when v_unlimited then 0 else 1 end,
      case when v_unlimited then 2147483647 else 1 end,
      v_resets_at,
      null::text;
    return;
  end if;

  if v_request.status <> 'pending' then
    return query select false, 1, 1, v_resets_at, 'quota_exhausted';
    return;
  end if;

  if not v_unlimited then
    insert into public.monthly_exports (
      user_id,
      month_start,
      project_id,
      request_id
    )
    values (
      p_user_id,
      v_month_start,
      v_request.project_id,
      p_request_id
    )
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 and not exists (
      select 1
      from public.monthly_exports
      where user_id = p_user_id
        and month_start = v_month_start
        and request_id = p_request_id
    ) then
      update public.server_export_requests
      set status = 'denied'
      where request_id = p_request_id;

      return query select false, 1, 1, v_resets_at, 'quota_exhausted';
      return;
    end if;
  end if;

  update public.server_export_requests
  set status = 'completed',
      completed_at = coalesce(completed_at, now())
  where request_id = p_request_id;

  return query select
    true,
    case when v_unlimited then 0 else 1 end,
    case when v_unlimited then 2147483647 else 1 end,
    v_resets_at,
    null::text;
end;
$$;

revoke all on function public.begin_server_export(uuid, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.finalize_server_export(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.begin_server_export(uuid, uuid, text, uuid)
  to service_role;
grant execute on function public.finalize_server_export(uuid, uuid, text)
  to service_role;

-- O antigo claim do navegador deixa de ser uma fronteira de autorização.
revoke execute on function public.claim_monthly_export(uuid)
  from authenticated;

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

revoke execute on function public.get_monthly_export_status()
  from public, anon;
grant execute on function public.get_monthly_export_status()
  to authenticated;
