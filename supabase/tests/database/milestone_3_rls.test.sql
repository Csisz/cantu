begin;

create extension if not exists pgtap with schema extensions;
select plan(39);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11000000-0000-0000-0000-000000000001', 'm3-a@cantu.test', '{"display_name":"M3 A"}'::jsonb),
  ('22000000-0000-0000-0000-000000000002', 'm3-b@cantu.test', '{"display_name":"M3 B"}'::jsonb);

insert into public.learning_sessions (
  id,
  user_id,
  input_type,
  source_status,
  source_char_count,
  save_source,
  verified_source_text,
  source_retention_status
)
values
  (
    '31000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    'text',
    'user_verified',
    12,
    true,
    'Testo breve.',
    'saved'
  ),
  (
    '32000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000002',
    'text',
    'user_verified',
    14,
    true,
    'Testo privato.',
    'saved'
  );

insert into public.processing_attempts (id, session_id, stage, status)
values
  ('41000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'analysis', 'created'),
  ('42000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'analysis', 'created');

insert into public.learning_results (id, session_id, schema_version, result_json)
values
  ('51000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'test-v1', '{}'::jsonb),
  ('52000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'test-v1', '{}'::jsonb);

insert into public.learning_progress (user_id, session_id, stage, percent_complete)
values
  ('11000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'source_verified', 20),
  ('22000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', 'source_verified', 40);

insert into public.user_phrasebook (id, user_id, italian_chunk, meaning_hu, source_session_id)
values
  ('61000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'va bene', 'rendben', '31000000-0000-0000-0000-000000000001'),
  ('62000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'a presto', 'hamarosan', '32000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$insert into public.learning_sessions (
      id, user_id, input_type, source_status, source_duration_ms
    ) values (
      '33000000-0000-0000-0000-000000000003',
      '11000000-0000-0000-0000-000000000001',
      'audio_file',
      'pending',
      25000
    )$$,
  'User A can create a metadata-only learning session'
);

select results_eq(
  $$select count(*) from public.learning_sessions$$,
  array[2::bigint],
  'User A reads only their two sessions'
);

select results_eq(
  $$update public.learning_sessions
    set source_status = 'ready'
    where id = '33000000-0000-0000-0000-000000000003'::uuid
    returning source_status$$,
  array['ready'::text],
  'User A can update their own session'
);

select results_eq(
  $$select count(*) from public.learning_sessions
    where id = '32000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B session'
);

select is_empty(
  $$update public.learning_sessions set source_status = 'failed'
    where id = '32000000-0000-0000-0000-000000000002'::uuid returning id$$,
  'User A cannot update User B session'
);

select is_empty(
  $$delete from public.learning_sessions
    where id = '32000000-0000-0000-0000-000000000002'::uuid returning id$$,
  'User A cannot delete User B session'
);

select throws_ok(
  $$insert into public.learning_sessions (
      user_id, input_type, source_status, source_char_count
    ) values (
      '22000000-0000-0000-0000-000000000002', 'text', 'user_verified', 10
    )$$,
  '42501',
  null,
  'User A cannot create a session owned by User B'
);

select lives_ok(
  $$insert into public.learning_progress (
      user_id, session_id, stage, percent_complete
    ) values (
      '11000000-0000-0000-0000-000000000001',
      '33000000-0000-0000-0000-000000000003',
      'new',
      0
    )$$,
  'User A can create progress for their own session'
);

select results_eq(
  $$select count(*) from public.learning_progress$$,
  array[2::bigint],
  'User A reads only their own progress'
);

select results_eq(
  $$update public.learning_progress set percent_complete = 15
    where session_id = '33000000-0000-0000-0000-000000000003'::uuid
    returning percent_complete$$,
  array[15::numeric],
  'User A can update their own progress'
);

select results_eq(
  $$delete from public.learning_progress
    where session_id = '33000000-0000-0000-0000-000000000003'::uuid
    returning session_id$$,
  array['33000000-0000-0000-0000-000000000003'::uuid],
  'User A can delete their own progress'
);

select is_empty(
  $$update public.learning_progress set percent_complete = 60
    where user_id = '22000000-0000-0000-0000-000000000002'::uuid returning user_id$$,
  'User A cannot update User B progress'
);

select is_empty(
  $$delete from public.learning_progress
    where user_id = '22000000-0000-0000-0000-000000000002'::uuid returning user_id$$,
  'User A cannot delete User B progress'
);

select throws_ok(
  $$insert into public.learning_progress (
      user_id, session_id, stage, percent_complete
    ) values (
      '11000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000002',
      'new',
      0
    )$$,
  '23503',
  null,
  'Composite ownership prevents progress for another user session'
);

select lives_ok(
  $$insert into public.user_phrasebook (
      user_id, italian_chunk, meaning_hu
    ) values (
      '11000000-0000-0000-0000-000000000001', 'che bello', 'de szép'
    )$$,
  'User A can create a private phrasebook row'
);

select results_eq(
  $$select count(*) from public.user_phrasebook$$,
  array[2::bigint],
  'User A reads only their own phrasebook rows'
);

select results_eq(
  $$update public.user_phrasebook set note_hu = 'saját jegyzet'
    where italian_chunk = 'che bello' returning note_hu$$,
  array['saját jegyzet'::text],
  'User A can update their own phrasebook row'
);

select results_eq(
  $$delete from public.user_phrasebook
    where italian_chunk = 'che bello' returning italian_chunk$$,
  array['che bello'::text],
  'User A can delete their own phrasebook row'
);

select is_empty(
  $$update public.user_phrasebook set note_hu = 'tiltott'
    where user_id = '22000000-0000-0000-0000-000000000002'::uuid returning id$$,
  'User A cannot update User B phrasebook'
);

select is_empty(
  $$delete from public.user_phrasebook
    where user_id = '22000000-0000-0000-0000-000000000002'::uuid returning id$$,
  'User A cannot delete User B phrasebook'
);

select results_eq(
  $$select id from public.learning_results order by id$$,
  array['51000000-0000-0000-0000-000000000001'::uuid],
  'User A can read only their own learning result'
);

select results_eq(
  $$select count(*) from public.learning_results
    where id = '52000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B learning result'
);

select throws_ok(
  $$insert into public.learning_results (session_id, schema_version, result_json)
    values ('33000000-0000-0000-0000-000000000003', 'forged', '{}'::jsonb)$$,
  '42501',
  null,
  'Authenticated users cannot fabricate learning results'
);

select throws_ok(
  $$update public.learning_results set schema_version = 'forged'$$,
  '42501',
  null,
  'Authenticated users cannot modify learning results'
);

select results_eq(
  $$select id from public.processing_attempts order by id$$,
  array['41000000-0000-0000-0000-000000000001'::uuid],
  'User A can read only their own processing state'
);

select results_eq(
  $$select count(*) from public.processing_attempts
    where id = '42000000-0000-0000-0000-000000000002'::uuid$$,
  array[0::bigint],
  'User A cannot read User B processing state'
);

select throws_ok(
  $$insert into public.processing_attempts (session_id, stage)
    values ('33000000-0000-0000-0000-000000000003', 'analysis')$$,
  '42501',
  null,
  'Authenticated users cannot fabricate processing attempts'
);

select ok(
  public.clear_learning_session_source('31000000-0000-0000-0000-000000000001'),
  'User A can clear their own retained source'
);

select results_eq(
  $$select save_source, verified_source_text, source_retention_status,
      source_deleted_at is not null
    from public.learning_sessions
    where id = '31000000-0000-0000-0000-000000000001'::uuid$$,
  $$values (false, null::text, 'deleted'::text, true)$$,
  'Source clearing removes content and records deletion state'
);

select is(
  public.clear_learning_session_source('32000000-0000-0000-0000-000000000002'),
  false,
  'User A cannot clear User B source'
);

select lives_ok(
  $$delete from public.learning_sessions
    where id = '33000000-0000-0000-0000-000000000003'::uuid$$,
  'User A can delete their own learning session'
);

select lives_ok(
  $$delete from public.learning_sessions
    where id = '31000000-0000-0000-0000-000000000001'::uuid$$,
  'User A can delete a session with dependent rows'
);

reset role;

select results_eq(
  $$select count(*) from public.processing_attempts
    where session_id = '31000000-0000-0000-0000-000000000001'::uuid$$,
  array[0::bigint],
  'Deleting a session cascades to processing attempts'
);

select results_eq(
  $$select count(*) from public.learning_results
    where session_id = '31000000-0000-0000-0000-000000000001'::uuid$$,
  array[0::bigint],
  'Deleting a session cascades to learning results'
);

select results_eq(
  $$select count(*) from public.learning_progress
    where session_id = '31000000-0000-0000-0000-000000000001'::uuid$$,
  array[0::bigint],
  'Deleting a session cascades to learning progress'
);

select results_eq(
  $$select source_session_id from public.user_phrasebook
    where id = '61000000-0000-0000-0000-000000000001'::uuid$$,
  $$values (null::uuid)$$,
  'Deleting a session preserves an explicit phrase and clears its source reference'
);

select results_eq(
  $$select verified_source_text from public.learning_sessions
    where id = '32000000-0000-0000-0000-000000000002'::uuid$$,
  array['Testo privato.'::text],
  'A cross-user source clear leaves User B content unchanged'
);

select results_eq(
  $$select relrowsecurity
    from pg_class
    where oid in (
      'public.learning_sessions'::regclass,
      'public.processing_attempts'::regclass,
      'public.learning_results'::regclass,
      'public.user_phrasebook'::regclass,
      'public.learning_progress'::regclass
    )
    order by oid$$,
  array[true, true, true, true, true],
  'RLS is enabled on every Milestone 3 application table'
);

select results_eq(
  $$select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'songs',
        'recognition_attempts',
        'lyrics_versions',
        'lessons',
        'user_songs',
        'user_song_progress'
      )$$,
  array[6::bigint],
  'All six legacy song-era tables remain intact'
);

select * from finish();
rollback;
