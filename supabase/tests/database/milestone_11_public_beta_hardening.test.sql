begin;
select plan(16);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm11-a@example.com', '', now(), now(), now()),
('51000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm11-b@example.com', '', now(), now(), now());

select has_table('public', 'private_usage_events', 'Usage event table exists');
select is((select relrowsecurity from pg_class where oid='public.private_usage_events'::regclass), true, 'Usage events have RLS');
select has_function('public', 'consume_private_usage', array['uuid','text','uuid','integer'], 'Atomic usage RPC exists');
select function_privs_are('public', 'consume_private_usage', array['uuid','text','uuid','integer'], 'authenticated', array[]::text[], 'Browser cannot call usage RPC');
select function_privs_are('public', 'consume_private_usage', array['uuid','text','uuid','integer'], 'service_role', array['EXECUTE'], 'Service role can call usage RPC');

set local role service_role;
select ok(public.consume_private_usage('51000000-0000-0000-0000-000000000001','practice','51100000-0000-0000-0000-000000000001',2), 'First usage accepted');
select ok(not public.consume_private_usage('51000000-0000-0000-0000-000000000001','practice','51100000-0000-0000-0000-000000000001',2), 'Replay rejected');
select ok(public.consume_private_usage('51000000-0000-0000-0000-000000000001','practice','51100000-0000-0000-0000-000000000002',2), 'Second unique usage accepted');
select ok(not public.consume_private_usage('51000000-0000-0000-0000-000000000001','practice','51100000-0000-0000-0000-000000000003',2), 'Hourly limit enforced');
select ok(public.consume_private_usage('51000000-0000-0000-0000-000000000002','practice','51100000-0000-0000-0000-000000000004',2), 'Limit isolated per user');

reset role;

insert into public.learning_sessions(id,user_id,input_type,source_status,source_char_count)
values('51200000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001','text','ready',20);
insert into public.user_phrasebook(id,user_id,italian_chunk,meaning_hu,source_session_id)
values('51300000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001','va bene','rendben','51200000-0000-0000-0000-000000000001');
select is((select count(*)::integer from public.user_phrase_review where user_id='51000000-0000-0000-0000-000000000001'),1,'Review initialized');
delete from auth.users where id='51000000-0000-0000-0000-000000000001';
select is((select count(*)::integer from public.learning_sessions where user_id='51000000-0000-0000-0000-000000000001'),0,'Account deletion cascades sessions');
select is((select count(*)::integer from public.user_phrasebook where user_id='51000000-0000-0000-0000-000000000001'),0,'Account deletion cascades phrases');
select is((select count(*)::integer from public.user_phrase_review where user_id='51000000-0000-0000-0000-000000000001'),0,'Account deletion cascades review');
select is((select count(*)::integer from public.private_usage_events where user_id='51000000-0000-0000-0000-000000000001'),0,'Account deletion cascades usage events');
select is((select count(*)::integer from information_schema.columns where table_schema='public' and table_name='private_usage_events' and column_name in ('source_text','audio','waveform','transcript','provider_response','prompt')),0,'Usage guard stores no private source content');

select * from finish();
rollback;
