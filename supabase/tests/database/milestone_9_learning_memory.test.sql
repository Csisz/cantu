begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email)
values
  ('19000000-0000-0000-0000-000000000001', 'm9-a@cantu.test'),
  ('29000000-0000-0000-0000-000000000002', 'm9-b@cantu.test');

insert into public.learning_sessions (id, user_id, input_type, source_status, source_char_count)
values
  ('39000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000001', 'text', 'ready', 32),
  ('39000000-0000-0000-0000-000000000002', '29000000-0000-0000-0000-000000000002', 'text', 'ready', 28);

insert into public.user_phrasebook (id, user_id, italian_chunk, meaning_hu, source_session_id)
values
  ('49000000-0000-0000-0000-000000000001', '19000000-0000-0000-0000-000000000001', 'non vedo l''ora', 'alig várom', '39000000-0000-0000-0000-000000000001'),
  ('49000000-0000-0000-0000-000000000002', '29000000-0000-0000-0000-000000000002', 'a che ora', 'hány órakor', '39000000-0000-0000-0000-000000000002');

select results_eq(
  $$select count(*) from public.user_phrase_review$$,
  array[2::bigint],
  'Saving phrases initializes one review row each'
);

select results_eq(
  $$select state, review_count, interval_days from public.user_phrase_review
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  $$values ('new'::text, 0, 1)$$,
  'Initial review state is bounded and source-light'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.user_phrase_review'::regclass),
  true,
  'RLS is enabled on review state'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '19000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  $$select phrase_id from public.user_phrase_review$$,
  $$values ('49000000-0000-0000-0000-000000000001'::uuid)$$,
  'User A sees only their own review state'
);

select throws_ok(
  $$update public.user_phrase_review set next_review_at = '2099-01-01T00:00:00Z'$$,
  '42501', null, 'Browser cannot set an arbitrary due date'
);

select throws_ok(
  $$insert into public.user_phrase_review (phrase_id, user_id)
    values ('49000000-0000-0000-0000-000000000002', '19000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'Browser cannot fabricate review state for another phrase'
);

select throws_ok(
  $$delete from public.user_phrase_review
    where phrase_id = '49000000-0000-0000-0000-000000000002'$$,
  '42501', null, 'Browser cannot delete User B review state'
);

select throws_ok(
  $$insert into public.user_phrasebook (user_id, italian_chunk, meaning_hu, source_session_id)
    values ('19000000-0000-0000-0000-000000000001', 'vietato', 'tilos', '39000000-0000-0000-0000-000000000002')$$,
  '23503', null, 'Phrase ownership still cannot cross sessions/users'
);

reset role;

select lives_ok(
  $$update public.user_phrase_review
    set state = 'review', next_review_at = '2026-09-10T00:00:00Z', last_reviewed_at = '2026-09-01T00:00:00Z',
        review_count = 3, success_count = 2, lapse_count = 1, interval_days = 9, difficulty = 2.10,
        last_rating = 'good'
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  'Trusted server role can persist a bounded scheduler result'
);

select throws_ok(
  $$insert into public.user_phrasebook (user_id, italian_chunk, meaning_hu, source_session_id)
    values ('19000000-0000-0000-0000-000000000001', ' NON VEDO L''ORA ', 'alig várom', '39000000-0000-0000-0000-000000000001')$$,
  '23505', null, 'Idempotent duplicate save remains constrained'
);

select results_eq(
  $$select review_count, success_count, lapse_count from public.user_phrase_review
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  $$values (3, 2, 1)$$,
  'Duplicate save does not reset review history'
);

select throws_ok(
  $$update public.user_phrase_review set interval_days = -1
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'Negative review intervals are rejected'
);

select throws_ok(
  $$update public.user_phrase_review set difficulty = 9
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'Unbounded difficulty is rejected'
);

select throws_ok(
  $$update public.user_phrase_review set last_rating = 'perfect'
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'Unknown review rating is rejected'
);

select lives_ok(
  $$delete from public.learning_sessions where id = '39000000-0000-0000-0000-000000000001'$$,
  'Deleting a source session is safe'
);

select results_eq(
  $$select source_session_id from public.user_phrasebook
    where id = '49000000-0000-0000-0000-000000000001'$$,
  $$values (null::uuid)$$,
  'Derived phrase survives source-session deletion'
);

select results_eq(
  $$select state, review_count from public.user_phrase_review
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  $$values ('review'::text, 3)$$,
  'Review memory survives with the derived phrase after source deletion'
);

select lives_ok(
  $$delete from public.user_phrasebook where id = '49000000-0000-0000-0000-000000000001'$$,
  'Deleting the saved phrase is safe'
);

select results_eq(
  $$select count(*) from public.user_phrase_review
    where phrase_id = '49000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'Phrase deletion cascades review state'
);

select hasnt_column(
  'public', 'user_phrase_review', 'source_text',
  'Review state has no complete source text column'
);

select hasnt_column(
  'public', 'user_phrase_review', 'audio',
  'Review state has no raw audio column'
);

select hasnt_column(
  'public', 'user_phrase_review', 'provider_response',
  'Review state has no provider payload column'
);

select * from finish();
rollback;
