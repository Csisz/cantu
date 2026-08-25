begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'a@cantu.test', '{"display_name":"A felhasználó"}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'b@cantu.test', '{"display_name":"B felhasználó"}'::jsonb);

insert into public.songs (id, title, artist)
values
  ('30000000-0000-0000-0000-000000000003', 'Canzone A', 'Artista A'),
  ('40000000-0000-0000-0000-000000000004', 'Canzone B', 'Artista B');

insert into public.lessons (
  id, song_id, schema_version, generator_version
)
values (
  '50000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000003',
  'test-schema',
  'test-generator'
);

insert into public.lyrics_versions (
  id, song_id, provider, provider_lyrics_id, content_hash
)
values (
  '60000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000003',
  'test-provider',
  'metadata-only',
  'test-hash'
);

insert into public.user_songs (user_id, song_id)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004');

insert into public.user_song_progress (user_id, song_id, percent_complete)
values
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 25),
  ('20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004', 75);

insert into public.recognition_attempts (user_id, input_type)
values
  ('10000000-0000-0000-0000-000000000001', 'manual'),
  ('20000000-0000-0000-0000-000000000002', 'manual');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  $$select id from public.profiles order by id$$,
  array['10000000-0000-0000-0000-000000000001'::uuid],
  'User A can read only their own profile'
);

select results_eq(
  $$select count(*) from public.profiles where id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B profile'
);

select results_eq(
  $$update public.profiles set display_name = 'A frissítve' where id = '10000000-0000-0000-0000-000000000001'::uuid returning id$$,
  array['10000000-0000-0000-0000-000000000001'::uuid],
  'User A can update their own profile'
);

select is_empty(
  $$update public.profiles set display_name = 'Tiltott' where id = '20000000-0000-0000-0000-000000000002'::uuid returning id$$,
  'User A cannot update User B profile'
);

select results_eq(
  $$select song_id from public.user_song_progress order by song_id$$,
  array['30000000-0000-0000-0000-000000000003'::uuid],
  'User A can read their own progress'
);

select results_eq(
  $$select count(*) from public.user_song_progress where user_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B progress'
);

select results_eq(
  $$update public.user_song_progress set percent_complete = 40 where user_id = '10000000-0000-0000-0000-000000000001'::uuid returning percent_complete$$,
  array[40::numeric],
  'User A can update their own progress'
);

select is_empty(
  $$update public.user_song_progress set percent_complete = 40 where user_id = '20000000-0000-0000-0000-000000000002'::uuid returning user_id$$,
  'User A cannot update User B progress'
);

select results_eq(
  $$select count(*) from public.user_songs$$,
  array[1::bigint],
  'User A sees only their own library row'
);

select results_eq(
  $$select count(*) from public.user_songs where user_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B library row'
);

select results_eq(
  $$select count(*) from public.recognition_attempts$$,
  array[1::bigint],
  'User A sees only their own recognition attempt'
);

select results_eq(
  $$select count(*) from public.recognition_attempts where user_id = '20000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B recognition attempt'
);

select results_eq(
  $$select count(*) from public.songs$$,
  array[2::bigint],
  'Canonical song metadata is readable'
);

select throws_ok(
  $$insert into public.songs (title, artist) values ('Tiltott dal', 'Tiltott előadó')$$,
  '42501',
  null,
  'Authenticated users cannot insert canonical songs'
);

select throws_ok(
  $$update public.songs set title = 'Tiltott cím' returning id$$,
  '42501',
  null,
  'Authenticated users cannot update canonical songs'
);

select throws_ok(
  $$select * from public.lessons$$,
  '42501',
  null,
  'Authenticated users cannot directly read server-managed lessons'
);

select throws_ok(
  $$update public.lessons set status = 'ready'$$,
  '42501',
  null,
  'Authenticated users cannot modify server-managed lessons'
);

select throws_ok(
  $$select * from public.lyrics_versions$$,
  '42501',
  null,
  'Authenticated users cannot directly read rights-managed lyrics metadata'
);

select * from finish();
rollback;
