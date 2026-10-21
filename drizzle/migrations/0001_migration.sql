
create policy "anyone can view media files" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "admin uploads media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "admin updates media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "admin deletes media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
