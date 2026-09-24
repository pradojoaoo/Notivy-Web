-- Bucket privado para wallpapers e logos enviados no editor.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'notivy-assets',
  'notivy-assets',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
);

-- Cada objeto deve ficar em: <user_id>/<project_id>/<asset_type>.
create policy "Users can read their own Notivy assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'notivy-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can upload their own Notivy assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'notivy-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own Notivy assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'notivy-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'notivy-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own Notivy assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'notivy-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
