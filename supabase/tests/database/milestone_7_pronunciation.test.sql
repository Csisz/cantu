begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email)
values
  ('17000000-0000-0000-0000-000000000001', 'm7-a@cantu.test'),
  ('27000000-0000-0000-0000-000000000002', 'm7-b@cantu.test');

insert into public.learning_sessions (id, user_id, input_type, source_status, source_char_count)
values
  ('37000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'text', 'ready', 24),
  ('37000000-0000-0000-0000-000000000002', '27000000-0000-0000-0000-000000000002', 'text', 'ready', 22);

insert into public.learning_results (id, session_id, schema_version, generator_version, result_json)
values
  ('57000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-000000000001', 'learning-analysis-v1', 'cantu-analysis-v1:test', '{"schemaVersion":"learning-analysis-v1","analysisStatus":"ready"}'::jsonb),
  ('57000000-0000-0000-0000-000000000002', '37000000-0000-0000-0000-000000000002', 'learning-analysis-v1', 'cantu-analysis-v1:test', '{"schemaVersion":"learning-analysis-v1","analysisStatus":"ready"}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temp table m7_attempt (id uuid);
insert into m7_attempt select public.start_pronunciation_feedback('37000000-0000-0000-0000-000000000001', 'test-stt-comparison');

select is((select count(*) from m7_attempt), 1::bigint, 'User A can start feedback for an owned ready result');
select results_eq(
  $$select stage, status from public.processing_attempts where id = (select id from m7_attempt)$$,
  $$values ('pronunciation'::text, 'running'::text)$$,
  'Pronunciation attempt stores operational metadata only'
);
select throws_ok(
  $$select public.start_pronunciation_feedback('37000000-0000-0000-0000-000000000002', 'test')$$,
  'P0001', 'pronunciation_session_not_found', 'User A cannot start feedback for User B session'
);
select ok(
  public.complete_pronunciation_feedback(
    '37000000-0000-0000-0000-000000000001',
    (select id from m7_attempt),
    'succeeded', 120, null
  ),
  'User A can finalize their own pronunciation attempt'
);
select results_eq(
  $$select status, latency_ms from public.processing_attempts where id = (select id from m7_attempt)$$,
  $$values ('succeeded'::text, 120::integer)$$,
  'Completion stores bounded operational metadata'
);
select is(
  public.complete_pronunciation_feedback(
    '37000000-0000-0000-0000-000000000002',
    (select id from m7_attempt),
    'failed', 5, 'forged'
  ),
  false,
  'User A cannot finalize an attempt through User B session'
);
select throws_ok(
  $$insert into public.processing_attempts (session_id, stage, provider, status)
    values ('37000000-0000-0000-0000-000000000001', 'pronunciation', 'forged', 'running')$$,
  '42501', null, 'Normal browser cannot fabricate pronunciation attempts'
);
select results_eq(
  $$select count(*) from public.learning_results$$,
  array[1::bigint],
  'User A still reads only their own private result'
);

reset role;

insert into public.processing_attempts (session_id, stage, provider, status)
select '37000000-0000-0000-0000-000000000001', 'pronunciation', 'rate-test', 'failed'
from generate_series(1, 14);

set local role authenticated;
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.start_pronunciation_feedback('37000000-0000-0000-0000-000000000001', 'test')$$,
  'P0001', 'pronunciation_rate_limited', 'Private-alpha guard limits feedback attempts per user and hour'
);
select ok(has_function_privilege('authenticated', 'public.start_pronunciation_feedback(uuid, text)', 'execute'), 'Authenticated role may execute the guarded start function');
select ok(not has_function_privilege('anon', 'public.start_pronunciation_feedback(uuid, text)', 'execute'), 'Anonymous role cannot execute pronunciation start');

reset role;

select is(
  (select count(*)::integer from information_schema.columns
   where table_schema = 'public'
     and (column_name ilike '%audio%' or column_name ilike '%voiceprint%' or column_name ilike '%speaker%' or column_name ilike '%emotion%')),
  0,
  'Application tables contain no audio, voiceprint, speaker, or emotion columns'
);
select is(
  (select count(*)::integer from information_schema.tables
   where table_schema = 'public'
     and (table_name ilike '%voiceprint%' or table_name ilike '%biometric%')),
  0,
  'No voiceprint or biometric table exists'
);
select lives_ok(
  $$delete from public.learning_sessions where id = '37000000-0000-0000-0000-000000000001'$$,
  'Owned-session deletion remains safe'
);
select results_eq(
  $$select count(*) from public.processing_attempts where session_id = '37000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'Session deletion cascades pronunciation attempt metadata'
);

select * from finish();
rollback;

