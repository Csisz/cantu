begin;
select plan(25);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('62000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','m12-a@example.com','',now(),now(),now()),
('62000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','m12-b@example.com','',now(),now(),now());

select has_table('public','billing_customers','Billing customers table exists');
select has_table('public','billing_subscriptions','Billing subscriptions table exists');
select has_table('public','billing_webhook_events','Webhook idempotency table exists');
select is((select relrowsecurity from pg_class where oid='public.billing_customers'::regclass),true,'Customer RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.billing_subscriptions'::regclass),true,'Subscription RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.billing_webhook_events'::regclass),true,'Webhook RLS enabled');
select table_privs_are('public','billing_customers','authenticated',array[]::text[],'Browser has no customer table privileges');
select table_privs_are('public','billing_subscriptions','authenticated',array[]::text[],'Browser has no subscription table privileges');
select table_privs_are('public','billing_webhook_events','authenticated',array[]::text[],'Browser has no webhook table privileges');
select function_privs_are('public','reserve_entitled_usage',array['uuid','text','uuid','integer','integer','integer'],'authenticated',array[]::text[],'Browser cannot reserve quota');
select function_privs_are('public','apply_stripe_subscription_event',array['text','text','bigint','text','text','text','text','timestamp with time zone','timestamp with time zone','boolean'],'authenticated',array[]::text[],'Browser cannot grant entitlement');

set local role service_role;
insert into public.billing_customers(user_id,stripe_customer_id) values
('62000000-0000-0000-0000-000000000001','cus_m12_a'),
('62000000-0000-0000-0000-000000000002','cus_m12_b');

select is((public.reserve_entitled_usage('62000000-0000-0000-0000-000000000001','analysis','62100000-0000-0000-0000-000000000001',10,2,4)->>'reason'),'reserved','Free first usage reserved');
select is((public.reserve_entitled_usage('62000000-0000-0000-0000-000000000001','analysis','62100000-0000-0000-0000-000000000002',10,2,4)->>'reason'),'reserved','Free second usage reserved');
select is((public.reserve_entitled_usage('62000000-0000-0000-0000-000000000001','analysis','62100000-0000-0000-0000-000000000003',10,2,4)->>'reason'),'quota_exceeded','Free monthly quota enforced atomically');

select is(public.apply_stripe_subscription_event('evt_m12_new','customer.subscription.created',200,'cus_m12_a','sub_m12_a','price_plus','active',now(),now()+interval '1 month',false),'applied','Signed-boundary subscription event applied');
select is(public.apply_stripe_subscription_event('evt_m12_old','customer.subscription.updated',100,'cus_m12_a','sub_m12_a','price_plus','canceled',now(),now(),false),'stale','Older event cannot overwrite current state');
select is((select status from public.billing_subscriptions where user_id='62000000-0000-0000-0000-000000000001'),'active','Newest subscription state retained');
select is(public.apply_stripe_subscription_event('evt_m12_new','customer.subscription.created',200,'cus_m12_a','sub_m12_a','price_plus','active',now(),now()+interval '1 month',false),'duplicate','Webhook replay is idempotent');
select is((public.reserve_entitled_usage('62000000-0000-0000-0000-000000000001','analysis','62100000-0000-0000-0000-000000000003',10,2,4)->>'reason'),'reserved','Plus receives larger quota after trusted event');
select is((public.reserve_entitled_usage('62000000-0000-0000-0000-000000000001','analysis','62100000-0000-0000-0000-000000000003',10,2,4)->>'reason'),'duplicate_request','Request nonce prevents double charge');

select throws_ok($$insert into public.billing_customers(user_id,stripe_customer_id) values('62000000-0000-0000-0000-000000000002','cus_m12_a')$$,'23505',null,'Stripe customer IDs are unique');
select throws_ok($$insert into public.billing_subscriptions(user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,status) values('62000000-0000-0000-0000-000000000002','cus_m12_b','sub_m12_a','price_plus','active')$$,'23505',null,'Stripe subscription IDs are unique');

reset role;
delete from auth.users where id='62000000-0000-0000-0000-000000000001';
select is((select count(*)::integer from public.billing_customers where user_id='62000000-0000-0000-0000-000000000001'),0,'Account deletion cascades billing customer');
select is((select count(*)::integer from public.billing_subscriptions where user_id='62000000-0000-0000-0000-000000000001'),0,'Account deletion cascades subscription mirror');
select is((select count(*)::integer from information_schema.columns where table_schema='public' and table_name in ('billing_customers','billing_subscriptions','billing_webhook_events') and column_name in ('card_number','cvc','raw_payload','invoice_body','source_text','audio','prompt')),0,'Billing schema stores no payment or learner content');

select * from finish();
rollback;
