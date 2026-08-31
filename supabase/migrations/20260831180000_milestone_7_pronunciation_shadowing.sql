-- Cantu Milestone 7: source-light pronunciation attempt metadata and usage guard.
-- Learner audio, transcripts, voiceprints and provider payloads are never stored here.

alter table public.processing_attempts
  drop constraint processing_attempts_stage;

alter table public.processing_attempts
  add constraint processing_attempts_stage check (
    stage in ('transcription', 'language_validation', 'analysis', 'pronunciation')
  );

create or replace function public.start_pronunciation_feedback(
  p_session_id uuid,
  p_provider text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_recent_attempts integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_provider is null
    or char_length(btrim(p_provider)) < 1
    or char_length(btrim(p_provider)) > 64 then
    raise exception 'invalid_provider' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.learning_sessions session
    join public.learning_results result on result.session_id = session.id
    where session.id = p_session_id
      and session.user_id = v_user_id
      and session.source_status = 'ready'
  ) then
    raise exception 'pronunciation_session_not_found' using errcode = 'P0001';
  end if;

  select count(*)::integer
  into v_recent_attempts
  from public.processing_attempts attempt
  join public.learning_sessions session on session.id = attempt.session_id
  where session.user_id = v_user_id
    and attempt.stage = 'pronunciation'
    and attempt.created_at >= timezone('utc', now()) - interval '1 hour';

  if v_recent_attempts >= 15 then
    raise exception 'pronunciation_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.processing_attempts (session_id, stage, provider, status)
  values (p_session_id, 'pronunciation', btrim(p_provider), 'running')
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

comment on function public.start_pronunciation_feedback(uuid, text) is
  'Creates owner-scoped pronunciation metadata with a 15 attempts/hour guard; stores no audio, transcript, voiceprint, or identity data.';

create or replace function public.complete_pronunciation_feedback(
  p_session_id uuid,
  p_attempt_id uuid,
  p_status text,
  p_latency_ms integer,
  p_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_status not in ('succeeded', 'failed') then
    raise exception 'invalid_attempt_status' using errcode = '22023';
  end if;

  if p_latency_ms is null or p_latency_ms < 0 then
    raise exception 'invalid_latency' using errcode = '22023';
  end if;

  update public.processing_attempts attempt
  set
    status = p_status,
    latency_ms = p_latency_ms,
    error_code = case when p_error_code is null then null else left(btrim(p_error_code), 80) end
  where attempt.id = p_attempt_id
    and attempt.session_id = p_session_id
    and attempt.stage = 'pronunciation'
    and exists (
      select 1
      from public.learning_sessions session
      where session.id = p_session_id
        and session.user_id = auth.uid()
    );

  return found;
end;
$$;

comment on function public.complete_pronunciation_feedback(uuid, uuid, text, integer, text) is
  'Finalizes owner-scoped pronunciation metadata without persisting audio, transcript, or provider payloads.';

revoke all on function public.start_pronunciation_feedback(uuid, text) from public, anon, authenticated;
revoke all on function public.complete_pronunciation_feedback(uuid, uuid, text, integer, text) from public, anon, authenticated;

grant execute on function public.start_pronunciation_feedback(uuid, text) to authenticated;
grant execute on function public.complete_pronunciation_feedback(uuid, uuid, text, integer, text) to authenticated;

