-- Both buckets are public-read (product photos and install photos are shown on the public
-- site — §6.1's "Recent installs gallery" reads from job-photos). Writes are staff-only.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true), ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

create policy "anyone reads product-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

create policy "staff manage product-images" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and is_staff())
  with check (bucket_id = 'product-images' and is_staff());

create policy "anyone reads job-photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'job-photos');

create policy "staff manage job-photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'job-photos' and is_staff())
  with check (bucket_id = 'job-photos' and is_staff());
