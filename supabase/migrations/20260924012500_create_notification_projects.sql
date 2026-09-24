-- Cada linha representa um print salvo no editor do Notivy.
create table public.notification_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Print sem título',
  editor_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notification_projects_name_length
    check (char_length(name) between 1 and 120),
  constraint notification_projects_editor_state_object
    check (jsonb_typeof(editor_state) = 'object')
);

comment on table public.notification_projects is
  'Prints de notificações salvos pelos usuários do Notivy.';

comment on column public.notification_projects.editor_state is
  'Configuração serializada do editor: textos, relógio, posição e referências de imagens.';

create index notification_projects_user_updated_idx
  on public.notification_projects (user_id, updated_at desc);

-- A tabela fica acessível pela Data API somente para usuários autenticados.
revoke all on table public.notification_projects from anon;
grant select, insert, update, delete
  on table public.notification_projects to authenticated;

-- RLS acrescenta a condição de propriedade a toda consulta feita pelo aplicativo.
alter table public.notification_projects enable row level security;

create policy "Users can read their own notification projects"
  on public.notification_projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own notification projects"
  on public.notification_projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notification projects"
  on public.notification_projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notification projects"
  on public.notification_projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
