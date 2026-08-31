begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email)
values
  ('15000000-0000-0000-0000-000000000001', 'm5-a@cantu.test'),
  ('25000000-0000-0000-0000-000000000002', 'm5-b@cantu.test');

insert into public.learning_sessions (
  id, user_id, input_type, source_status, source_duration_ms
) values (
  '35000000-0000-0000-0000-000000000003',
  '15000000-0000-0000-0000-000000000001',
  'audio_file',
  'user_verified',
  5000
);

select is(
  has_function_privilege(
    'authenticated',
    'public.start_learning_analysis(uuid,uuid,text,text,integer,text,text,text,text)',
    'execute'
  ),
  false,
  'Authenticated browser role cannot invoke the server analysis start function'
);

select is(
  has_function_privilege(
    'authenticated',
    'public.complete_learning_analysis(uuid,uuid,uuid,text,text,jsonb,integer)',
    'execute'
  ),
  false,
  'Authenticated browser role cannot fabricate a derived result through the completion function'
);

set local role service_role;

create temporary table m5_text_start as
select * from public.start_learning_analysis(
  '15000000-0000-0000-0000-000000000001',
  null,
  'text',
  'text_direct',
  32,
  repeat('a', 64),
  'test',
  'learning-analysis-v1',
  'cantu-analysis-v1:test:test-model'
);

select results_eq(
  $$select count(*) from m5_text_start$$,
  array[1::bigint],
  'Trusted server boundary creates one text analysis lifecycle'
);

select results_eq(
  $$select input_type, source_status, source_char_count, source_fingerprint,
      save_source, verified_source_text, source_retention_status
    from public.learning_sessions
    where id = (select learning_session_id from m5_text_start)$$,
  $$values ('text'::text, 'text_direct'::text, 32, repeat('a', 64), false, null::text, 'not_stored'::text)$$,
  'Analysis session stores only minimized metadata and a private fingerprint'
);

select results_eq(
  $$select stage, provider, status from public.processing_attempts
    where id = (select processing_attempt_id from m5_text_start)$$,
  $$values ('analysis'::text, 'test'::text, 'running'::text)$$,
  'Analysis start records operational metadata without source or prompt content'
);

select ok(
  public.complete_learning_analysis(
    '15000000-0000-0000-0000-000000000001',
    (select learning_session_id from m5_text_start),
    (select processing_attempt_id from m5_text_start),
    'learning-analysis-v1',
    'cantu-analysis-v1:test:test-model',
    '{"schemaVersion":"learning-analysis-v1","analysisStatus":"ready","chunks":[{"sourceText":"Non vedo"}]}'::jsonb,
    412
  ),
  'Trusted server boundary persists a validated derived result'
);

select results_eq(
  $$select schema_version, generator_version from public.learning_results
    where session_id = (select learning_session_id from m5_text_start)$$,
  $$values ('learning-analysis-v1'::text, 'cantu-analysis-v1:test:test-model'::text)$$,
  'Derived result retains explicit schema and generator versions'
);

select results_eq(
  $$select source_status, verified_source_text, save_source, source_retention_status
    from public.learning_sessions
    where id = (select learning_session_id from m5_text_start)$$,
  $$values ('ready'::text, null::text, false, 'not_stored'::text)$$,
  'Successful analysis marks readiness without persisting complete source text'
);

create temporary table m5_cached as
select * from public.start_learning_analysis(
  '15000000-0000-0000-0000-000000000001',
  (select learning_session_id from m5_text_start),
  'text',
  'text_direct',
  32,
  repeat('a', 64),
  'test',
  'learning-analysis-v1',
  'cantu-analysis-v1:test:test-model'
);

select results_eq(
  $$select processing_attempt_id is null, cached_result is not null from m5_cached$$,
  $$values (true, true)$$,
  'Current same-session fingerprint/version returns cached result without a paid attempt'
);

select results_eq(
  $$select count(*) from public.processing_attempts
    where session_id = (select learning_session_id from m5_text_start)
      and stage = 'analysis'$$,
  array[1::bigint],
  'Cache reuse does not create a duplicate processing attempt'
);

select throws_ok(
  $$select * from public.start_learning_analysis(
      '15000000-0000-0000-0000-000000000001',
      (select learning_session_id from m5_text_start),
      'text', 'text_direct', 32, repeat('b', 64), 'test',
      'learning-analysis-v1', 'cantu-analysis-v1:test:test-model'
    )$$,
  'P0001',
  'analysis_source_mismatch',
  'A different source fingerprint cannot reuse an existing private session result'
);

create temporary table m5_audio_start as
select * from public.start_learning_analysis(
  '15000000-0000-0000-0000-000000000001',
  '35000000-0000-0000-0000-000000000003',
  'audio_file',
  'user_verified',
  26,
  repeat('c', 64),
  'test',
  'learning-analysis-v1',
  'cantu-analysis-v1:test:test-model'
);

select results_eq(
  $$select count(*) from m5_audio_start where processing_attempt_id is not null$$,
  array[1::bigint],
  'An owned verified audio session can enter the shared analysis boundary'
);

select throws_ok(
  $$select * from public.start_learning_analysis(
      '25000000-0000-0000-0000-000000000002',
      '35000000-0000-0000-0000-000000000003',
      'audio_file', 'user_verified', 26, repeat('c', 64), 'test',
      'learning-analysis-v1', 'cantu-analysis-v1:test:test-model'
    )$$,
  'P0001',
  'session_not_found',
  'Trusted server orchestration still cannot attach User B to User A session'
);

select throws_ok(
  $$select * from public.start_learning_analysis(
      '15000000-0000-0000-0000-000000000001',
      '35000000-0000-0000-0000-000000000003',
      'audio_file', 'stt_unverified', 26, repeat('c', 64), 'test',
      'learning-analysis-v1', 'cantu-analysis-v1:test:test-model'
    )$$,
  '22023',
  'invalid_source_status',
  'Unverified STT output cannot enter analysis'
);

grant select on table m5_text_start to authenticated;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '15000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  $$select count(*) from public.learning_results
    where session_id = (select learning_session_id from m5_text_start)$$,
  array[1::bigint],
  'User A can read their private derived result through RLS'
);

select set_config('request.jwt.claim.sub', '25000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$select count(*) from public.learning_results
    where session_id = (select learning_session_id from m5_text_start)$$,
  array[0::bigint],
  'User B cannot read User A derived result'
);

select throws_ok(
  $$insert into public.learning_results (session_id, schema_version, generator_version, result_json)
    values (
      '35000000-0000-0000-0000-000000000003',
      'learning-analysis-v1',
      'forged',
      '{"schemaVersion":"learning-analysis-v1"}'::jsonb
    )$$,
  '42501',
  null,
  'Browser clients still cannot directly fabricate learning results'
);

reset role;

select results_eq(
  $$select count(*) from public.learning_results result
    where result.result_json ?| array['sourceTextFull', 'rawAudio', 'waveform', 'providerResponse', 'prompt', 'apiKey']$$,
  array[0::bigint],
  'Persisted derived result contains no raw source/audio/provider/prompt/secret fields'
);

delete from public.learning_sessions
where id = (select learning_session_id from m5_text_start);

select results_eq(
  $$select count(*) from public.learning_results
    where session_id = (select learning_session_id from m5_text_start)$$,
  array[0::bigint],
  'Session deletion still cascades to the derived result'
);

select results_eq(
  $$select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in ('songs','recognition_attempts','lyrics_versions','lessons','user_songs','user_song_progress')$$,
  array[6::bigint],
  'All legacy song-era tables remain intact'
);

select * from finish();
rollback;
