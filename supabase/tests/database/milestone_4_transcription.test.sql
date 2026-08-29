begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email)
values
  ('14000000-0000-0000-0000-000000000001', 'm4-a@cantu.test'),
  ('24000000-0000-0000-0000-000000000002', 'm4-b@cantu.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temporary table m4_ids as
select * from public.start_transcription_session('audio_file', 12500, 'test');

select results_eq(
  $$select count(*) from m4_ids$$,
  array[1::bigint],
  'Authenticated user can start one controlled transcription session'
);

select results_eq(
  $$select input_type, source_status, source_duration_ms, save_source,
      verified_source_text, source_retention_status
    from public.learning_sessions
    where id = (select learning_session_id from m4_ids)$$,
  $$values ('audio_file'::text, 'pending'::text, 12500, false, null::text, 'not_stored'::text)$$,
  'Transcription session stores metadata only with source-light defaults'
);

select results_eq(
  $$select stage, provider, status, latency_ms, error_code
    from public.processing_attempts
    where id = (select processing_attempt_id from m4_ids)$$,
  $$values ('transcription'::text, 'test'::text, 'running'::text, null::integer, null::text)$$,
  'Controlled start creates running operational metadata'
);

select throws_ok(
  $$select * from public.start_transcription_session('text', 1000, 'test')$$,
  '22023',
  'invalid_input_type',
  'Text cannot enter the transcription lifecycle'
);

select throws_ok(
  $$select * from public.start_transcription_session('audio_file', 30001, 'test')$$,
  '22023',
  'invalid_duration',
  'Server processing metadata rejects duration over 30 seconds'
);

select ok(
  public.complete_transcription_attempt(
    (select learning_session_id from m4_ids),
    (select processing_attempt_id from m4_ids),
    'succeeded',
    321,
    null
  ),
  'Owner can complete their controlled transcription attempt'
);

select results_eq(
  $$select source_status from public.learning_sessions
    where id = (select learning_session_id from m4_ids)$$,
  array['stt_unverified'::text],
  'Successful STT remains explicitly unverified'
);

select results_eq(
  $$select status, latency_ms, error_code from public.processing_attempts
    where id = (select processing_attempt_id from m4_ids)$$,
  $$values ('succeeded'::text, 321, null::text)$$,
  'Attempt stores normalized operational metadata only'
);

select ok(
  public.verify_transcript_candidate(
    (select learning_session_id from m4_ids),
    'user_edited'
  ),
  'Owner can mark a transcript candidate as edited'
);

select results_eq(
  $$select source_status, verified_source_text from public.learning_sessions
    where id = (select learning_session_id from m4_ids)$$,
  $$values ('user_edited'::text, null::text)$$,
  'Verification persists status but not transcript text'
);

select lives_ok(
  $$insert into public.learning_sessions (
      user_id, input_type, source_status, source_char_count
    ) values (
      '14000000-0000-0000-0000-000000000001', 'text', 'text_direct', 20
    )$$,
  'Direct text status is represented by the generalized session model'
);

select set_config('request.jwt.claim.sub', '24000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$select count(*) from public.learning_sessions
    where id = (select learning_session_id from m4_ids)$$,
  array[0::bigint],
  'User B cannot read User A transcription session'
);

select is(
  public.complete_transcription_attempt(
    (select learning_session_id from m4_ids),
    (select processing_attempt_id from m4_ids),
    'failed',
    10,
    'forged'
  ),
  false,
  'User B cannot complete User A attempt'
);

select is(
  public.verify_transcript_candidate(
    (select learning_session_id from m4_ids),
    'user_verified'
  ),
  false,
  'User B cannot verify User A transcript candidate'
);

reset role;

select results_eq(
  $$select source_status from public.learning_sessions
    where id = (select learning_session_id from m4_ids)$$,
  array['user_edited'::text],
  'Cross-user lifecycle calls leave User A status unchanged'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select throws_ok(
  $$select * from public.start_transcription_session('audio_file', 1000, 'test')$$,
  '42501',
  null,
  'Anonymous callers cannot start paid processing metadata'
);

select throws_ok(
  $$select public.verify_transcript_candidate(
      '31000000-0000-0000-0000-000000000001'::uuid,
      'user_verified'
    )$$,
  '42501',
  null,
  'Anonymous callers cannot verify transcript state'
);

select * from finish();
rollback;
