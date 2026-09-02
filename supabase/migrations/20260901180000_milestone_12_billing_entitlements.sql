-- Milestone 12: minimal Stripe mirror and atomic plan-aware provider usage.
-- No card details, invoice bodies, webhook payloads, learner source, audio or prompts are stored.

create table public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint billing_customers_owner_pair_unique unique (user_id, stripe_customer_id)
);

create table public.billing_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  latest_stripe_event_created bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint billing_subscription_status_check check (
    status in ('active','trialing','past_due','canceled','unpaid','incomplete','incomplete_expired','paused')
  ),
  constraint billing_subscription_customer_owner_fkey
    foreign key (user_id, stripe_customer_id)
    references public.billing_customers (user_id, stripe_customer_id)
    on delete cascade
);

create table public.billing_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  stripe_event_created bigint not null,
  processed_at timestamptz not null default timezone('utc', now()),
  constraint billing_webhook_event_type_check check (
    event_type in ('checkout.session.completed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted')
  )
);

comment on table public.billing_customers is 'Minimal private Stripe customer reference; no payment method data.';
comment on table public.billing_subscriptions is 'Minimal local subscription mirror used for Cantu entitlements.';
comment on table public.billing_webhook_events is 'Processed Stripe event IDs only; raw webhook payloads are never stored.';

alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

revoke all on table public.billing_customers, public.billing_subscriptions, public.billing_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on table public.billing_customers, public.billing_subscriptions, public.billing_webhook_events to service_role;

create or replace function public.reserve_entitled_usage(
  p_user_id uuid,
  p_operation text,
  p_request_nonce uuid,
  p_hourly_limit integer,
  p_free_monthly_limit integer,
  p_plus_monthly_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  hourly_count integer;
  monthly_count integer;
  resolved_plan text := 'free';
  resolved_limit integer;
  period_start timestamptz := date_trunc('month', timezone('utc', now())) at time zone 'utc';
  period_end timestamptz := (date_trunc('month', timezone('utc', now())) + interval '1 month') at time zone 'utc';
begin
  if p_operation not in ('transcription', 'analysis', 'pronunciation', 'practice')
    or p_hourly_limit < 1 or p_hourly_limit > 1000
    or p_free_monthly_limit < 1 or p_free_monthly_limit > 100000
    or p_plus_monthly_limit < p_free_monthly_limit or p_plus_monthly_limit > 100000 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_limit');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text || ':' || p_operation, 0));

  if exists (select 1 from public.private_usage_events where user_id=p_user_id and operation=p_operation and request_nonce=p_request_nonce) then
    return jsonb_build_object('allowed', false, 'reason', 'duplicate_request');
  end if;

  if exists (
    select 1 from public.billing_subscriptions
    where user_id=p_user_id and status in ('active','trialing')
      and (current_period_end is null or current_period_end > timezone('utc', now()))
  ) then resolved_plan := 'plus'; end if;
  resolved_limit := case when resolved_plan='plus' then p_plus_monthly_limit else p_free_monthly_limit end;

  select count(*) into hourly_count from public.private_usage_events
    where user_id=p_user_id and operation=p_operation and created_at > timezone('utc', now()) - interval '1 hour';
  if hourly_count >= p_hourly_limit then
    return jsonb_build_object('allowed', false, 'reason', 'rate_limited', 'plan', resolved_plan, 'used', hourly_count, 'limit', p_hourly_limit);
  end if;

  select count(*) into monthly_count from public.private_usage_events
    where user_id=p_user_id and operation=p_operation and created_at >= period_start and created_at < period_end;
  if monthly_count >= resolved_limit then
    return jsonb_build_object('allowed', false, 'reason', 'quota_exceeded', 'plan', resolved_plan, 'used', monthly_count, 'limit', resolved_limit);
  end if;

  insert into public.private_usage_events(user_id, operation, request_nonce) values(p_user_id,p_operation,p_request_nonce);
  delete from public.private_usage_events where created_at < period_start - interval '32 days';
  return jsonb_build_object('allowed', true, 'reason', 'reserved', 'plan', resolved_plan, 'used', monthly_count + 1, 'limit', resolved_limit);
end;
$$;

revoke all on function public.reserve_entitled_usage(uuid,text,uuid,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.reserve_entitled_usage(uuid,text,uuid,integer,integer,integer) to service_role;

create or replace function public.apply_stripe_subscription_event(
  p_event_id text,
  p_event_type text,
  p_event_created bigint,
  p_customer_id text,
  p_subscription_id text,
  p_price_id text,
  p_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  inserted_count integer;
  latest_created bigint;
begin
  if p_event_type not in ('customer.subscription.created','customer.subscription.updated','customer.subscription.deleted')
    or p_status not in ('active','trialing','past_due','canceled','unpaid','incomplete','incomplete_expired','paused') then
    raise exception 'unsupported_billing_event';
  end if;
  insert into public.billing_webhook_events(stripe_event_id,event_type,stripe_event_created)
    values(p_event_id,p_event_type,p_event_created) on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return 'duplicate'; end if;

  select user_id into owner_id from public.billing_customers where stripe_customer_id=p_customer_id;
  if owner_id is null then raise exception 'billing_customer_not_found'; end if;
  select latest_stripe_event_created into latest_created from public.billing_subscriptions where user_id=owner_id;
  if latest_created is not null and latest_created > p_event_created then return 'stale'; end if;

  insert into public.billing_subscriptions(
    user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,status,
    current_period_start,current_period_end,cancel_at_period_end,latest_stripe_event_created
  ) values(
    owner_id,p_customer_id,p_subscription_id,p_price_id,p_status,
    p_period_start,p_period_end,p_cancel_at_period_end,p_event_created
  ) on conflict(user_id) do update set
    stripe_customer_id=excluded.stripe_customer_id,
    stripe_subscription_id=excluded.stripe_subscription_id,
    stripe_price_id=excluded.stripe_price_id,
    status=excluded.status,
    current_period_start=excluded.current_period_start,
    current_period_end=excluded.current_period_end,
    cancel_at_period_end=excluded.cancel_at_period_end,
    latest_stripe_event_created=excluded.latest_stripe_event_created,
    updated_at=timezone('utc', now());
  return 'applied';
end;
$$;

create or replace function public.record_stripe_checkout_event(
  p_event_id text, p_event_created bigint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer;
begin
  insert into public.billing_webhook_events(stripe_event_id,event_type,stripe_event_created)
  values(p_event_id,'checkout.session.completed',p_event_created) on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return case when inserted_count=0 then 'duplicate' else 'recorded' end;
end;
$$;

revoke all on function public.apply_stripe_subscription_event(text,text,bigint,text,text,text,text,timestamptz,timestamptz,boolean) from public, anon, authenticated;
revoke all on function public.record_stripe_checkout_event(text,bigint) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(text,text,bigint,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;
grant execute on function public.record_stripe_checkout_event(text,bigint) to service_role;
