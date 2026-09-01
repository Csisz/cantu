-- Milestone 11: distributed, source-free abuse controls for public beta.
-- Existing user-owned tables already cascade from auth.users; this migration adds
-- no source, audio, transcript, prompt or provider-response storage.

create table public.private_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  operation text not null,
  request_nonce uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint private_usage_events_operation_check
    check (operation in ('transcription', 'analysis', 'pronunciation', 'practice')),
  constraint private_usage_events_request_unique unique (user_id, operation, request_nonce)
);

comment on table public.private_usage_events is
  'Private source-free hourly usage/replay guard. Stores only user ownership, operation, opaque nonce and timestamp.';

create index private_usage_events_window_idx
  on public.private_usage_events (user_id, operation, created_at desc);

alter table public.private_usage_events enable row level security;
revoke all on table public.private_usage_events from public, anon, authenticated;
grant select, insert, delete on table public.private_usage_events to service_role;

create or replace function public.consume_private_usage(
  p_user_id uuid,
  p_operation text,
  p_request_nonce uuid,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  if p_operation not in ('transcription', 'analysis', 'pronunciation', 'practice')
    or p_limit < 1 or p_limit > 1000 then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_operation, 0)
  );

  if exists (
    select 1 from public.private_usage_events
    where user_id = p_user_id and operation = p_operation and request_nonce = p_request_nonce
  ) then
    return false;
  end if;

  select count(*) into recent_count
  from public.private_usage_events
  where user_id = p_user_id
    and operation = p_operation
    and created_at > timezone('utc', now()) - interval '1 hour';

  if recent_count >= p_limit then return false; end if;

  insert into public.private_usage_events (user_id, operation, request_nonce)
  values (p_user_id, p_operation, p_request_nonce);

  delete from public.private_usage_events
  where user_id = p_user_id and created_at < timezone('utc', now()) - interval '24 hours';
  return true;
end;
$$;

comment on function public.consume_private_usage(uuid, text, uuid, integer) is
  'Service-role-only atomic hourly usage and replay guard. Accepts no learner content.';

revoke all on function public.consume_private_usage(uuid, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_private_usage(uuid, text, uuid, integer) to service_role;
