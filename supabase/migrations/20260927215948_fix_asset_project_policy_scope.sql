-- Qualifica a coluna externa para que a subconsulta compare o ID do projeto
-- com o segundo segmento do caminho do objeto, e não com o nome do projeto.
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
        and id::text = (storage.foldername(storage.objects.name))[2]
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
        and id::text = (storage.foldername(storage.objects.name))[2]
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
        and id::text = (storage.foldername(storage.objects.name))[2]
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
        and id::text = (storage.foldername(storage.objects.name))[2]
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
        and id::text = (storage.foldername(storage.objects.name))[2]
    )
  );
