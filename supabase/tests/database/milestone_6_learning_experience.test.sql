begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email)
values
  ('16000000-0000-0000-0000-000000000001', 'm6-a@cantu.test'),
  ('26000000-0000-0000-0000-000000000002', 'm6-b@cantu.test');

insert into public.learning_sessions (
  id, user_id, input_type, source_status, source_char_count
) values
  ('36000000-0000-0000-0000-000000000001', '16000000-0000-0000-0000-000000000001', 'text', 'ready', 36),
  ('36000000-0000-0000-0000-000000000002', '26000000-0000-0000-0000-000000000002', 'text', 'ready', 32);

insert into public.learning_results (id, session_id, schema_version, generator_version, result_json)
values
  ('56000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-000000000001', 'learning-analysis-v1', 'cantu-analysis-v1:test', '{"schemaVersion":"learning-analysis-v1","analysisStatus":"ready"}'::jsonb),
  ('56000000-0000-0000-0000-000000000002', '36000000-0000-0000-0000-000000000002', 'learning-analysis-v1', 'cantu-analysis-v1:test', '{"schemaVersion":"learning-analysis-v1","analysisStatus":"ready"}'::jsonb);

insert into public.learning_progress (user_id, session_id, stage, percent_complete)
values ('26000000-0000-0000-0000-000000000002', '36000000-0000-0000-0000-000000000002', 'meaning', 20);

set local role authenticated;
select set_config('request.jwt.claim.sub', '16000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$insert into public.learning_progress (user_id, session_id, stage, percent_complete)
    values ('16000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-000000000001', 'meaning', 20)$$,
  'User A can create exact Milestone 6 progress for their own session'
);

select lives_ok(
  $$update public.learning_progress set stage = 'chunks', percent_complete = 40
    where user_id = '16000000-0000-0000-0000-000000000001'
      and session_id = '36000000-0000-0000-0000-000000000001'$$,
  'Chunks stage is accepted'
);

select lives_ok(
  $$update public.learning_progress set stage = 'grammar', percent_complete = 60
    where user_id = '16000000-0000-0000-0000-000000000001'
      and session_id = '36000000-0000-0000-0000-000000000001'$$,
  'Grammar stage is accepted'
);

select lives_ok(
  $$update public.learning_progress set stage = 'say', percent_complete = 80
    where user_id = '16000000-0000-0000-0000-000000000001'
      and session_id = '36000000-0000-0000-0000-000000000001'$$,
  'Say stage is accepted'
);

select lives_ok(
  $$update public.learning_progress set stage = 'recall', percent_complete = 90
    where user_id = '16000000-0000-0000-0000-000000000001'
      and session_id = '36000000-0000-0000-0000-000000000001'$$,
  'Recall stage is accepted'
);

select lives_ok(
  $$update public.learning_progress set stage = 'completed', percent_complete = 100, recall_score = 50
    where user_id = '16000000-0000-0000-0000-000000000001'
      and session_id = '36000000-0000-0000-0000-000000000001'$$,
  'Completion accepts bounded deterministic recall score'
);

select throws_ok(
  $$update public.learning_progress set stage = 'made_up'
    where session_id = '36000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'Unknown progress stage is rejected'
);

select is_empty(
  $$update public.learning_progress set percent_complete = 1
    where session_id = '36000000-0000-0000-0000-000000000002' returning session_id$$,
  'User A cannot update User B progress'
);

select throws_ok(
  $$insert into public.learning_progress (user_id, session_id, stage, percent_complete)
    values ('16000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-000000000002', 'meaning', 20)$$,
  '23503', null, 'Composite ownership prevents progress on User B session'
);

select lives_ok(
  $$insert into public.user_phrasebook (user_id, italian_chunk, meaning_hu, source_session_id)
    values ('16000000-0000-0000-0000-000000000001', 'non vedo l''ora', 'alig várom', '36000000-0000-0000-0000-000000000001')$$,
  'User A can explicitly save a derived phrase from their own session'
);

select throws_ok(
  $$insert into public.user_phrasebook (user_id, italian_chunk, meaning_hu, source_session_id)
    values ('16000000-0000-0000-0000-000000000001', ' NON VEDO L''ORA ', 'alig várom', '36000000-0000-0000-0000-000000000001')$$,
  '23505', null, 'Normalized per-session phrase duplicate is idempotently constrained'
);

select throws_ok(
  $$insert into public.user_phrasebook (user_id, italian_chunk, meaning_hu, source_session_id)
    values ('26000000-0000-0000-0000-000000000002', 'vietato', 'tiltott', '36000000-0000-0000-0000-000000000002')$$,
  '42501', null, 'User A cannot write User B phrase ownership'
);

select throws_ok(
  $$insert into public.user_phrasebook (user_id, italian_chunk, meaning_hu, source_session_id)
    values ('16000000-0000-0000-0000-000000000001', 'a presto', 'hamarosan', '36000000-0000-0000-0000-000000000002')$$,
  '23503', null, 'Phrase source reference cannot cross user ownership'
);

select results_eq(
  $$select count(*) from public.learning_results$$,
  array[1::bigint],
  'User A can read only their own private learning result'
);

select throws_ok(
  $$insert into public.learning_results (session_id, schema_version, result_json)
    values ('36000000-0000-0000-0000-000000000001', 'forged', '{}'::jsonb)$$,
  '42501', null, 'Browser still cannot fabricate a learning result'
);

select lives_ok(
  $$delete from public.learning_sessions where id = '36000000-0000-0000-0000-000000000001'$$,
  'Owner can delete a completed learning session safely'
);

reset role;

select results_eq(
  $$select source_session_id from public.user_phrasebook where italian_chunk = 'non vedo l''ora'$$,
  $$values (null::uuid)$$,
  'Saved derived phrase survives session deletion with source reference cleared'
);

select results_eq(
  $$select count(*) from public.learning_progress where session_id = '36000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'Session deletion cascades to learning progress'
);

select * from finish();
rollback;
