-- Storage bucket and RLS policies for observation photos

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'observations',
  'observations',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "org members can read observation files"
on storage.objects for select
using (
  bucket_id = 'observations'
  and (storage.foldername(name))[1] in (
    select id::text from fields
    where org_id in (select public.user_org_ids())
  )
);

create policy "org members can upload observation files"
on storage.objects for insert
with check (
  bucket_id = 'observations'
  and (storage.foldername(name))[1] in (
    select id::text from fields
    where org_id in (select public.user_org_ids())
  )
);

create policy "org members can update observation files"
on storage.objects for update
using (
  bucket_id = 'observations'
  and (storage.foldername(name))[1] in (
    select id::text from fields
    where org_id in (select public.user_org_ids())
  )
);

-- Service role bypasses RLS for server-side uploads
