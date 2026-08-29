-- Cantu Milestone 4: controlled, source-light transcription lifecycle.
-- Raw audio and transcript text never enter PostgreSQL through these functions.

alter table public.learning_sessions
  drop constraint learning_sessions_source_status;

alter table public.learning_sessions
  add constraint learning_sessions_source_status check (
    source_status in (
      'pending',
      'transcribed',
      'stt_unverified',
      'user_verified',
      'user_edited',
      'text_direct',
      'ready',
      'failed'
    )
  );

create or replace function public.start_transcription_session(
  p_input_type text,
  p_source_duration_ms integer,
  p_provider text
)
returns table (learning_session_id uuid, processing_attempt_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_attempt_id uuid;
  v_recent_attempts integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_input_type not in ('microphone', 'audio_file') then
    raise exception 'invalid_input_type' using errcode = '22023';
  end if;

  if p_source_duration_ms is null or p_source_duration_ms < 1 or p_source_duration_ms > 30000 then
    raise exception 'invalid_duration' using errcode = '22023';
  end if;

  if p_provider is null
    or char_length(btrim(p_provider)) < 1
    or char_length(btrim(p_provider)) > 64 then
    raise exception 'invalid_provider' using errcode = '22023';
  end if;

  select count(*)::integer
  into v_recent_attempts
  from public.processing_attempts as attempt
  join public.learning_sessions as session on session.id = attempt.session_id
  where session.user_id = v_user_id
    and attempt.stage = 'transcription'
    and attempt.created_at >= timezone('utc', now()) - interval '1 hour';

  if v_recent_attempts >= 20 then
    raise exception 'transcription_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.learning_sessions (
    user_id,
    input_type,
    source_status,
    source_duration_ms,
    save_source,
    verified_source_text,
    source_retention_status
  ) values (
    v_user_id,
    p_input_type,
    'pending',
    p_source_duration_ms,
    false,
    null,
    'not_stored'
  )
  returning id into v_session_id;

  insert into public.processing_attempts (
    session_id,
    stage,
    provider,
    status
  ) values (
    v_session_id,
    'transcription',
    btrim(p_provider),
    'running'
  )
  returning id into v_attempt_id;

  return query select v_session_id, v_attempt_id;
end;
$$;

comment on function public.start_transcription_session(text, integer, text) is
  'Creates owner-scoped transcription metadata with a 20 attempts/hour private-alpha guard; stores no audio or transcript.';

create or replace function public.complete_transcription_attempt(
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
declare
  v_user_id uuid := auth.uid();
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_status not in ('succeeded', 'failed') then
    raise exception 'invalid_attempt_status' using errcode = '22023';
  end if;

  if p_latency_ms is null or p_latency_ms < 0 then
    raise exception 'invalid_latency' using errcode = '22023';
  end if;

  update public.processing_attempts as attempt
  set
    status = p_status,
    latency_ms = p_latency_ms,
    error_code = case
      when p_error_code is null then null
      else left(btrim(p_error_code), 80)
    end
  where attempt.id = p_attempt_id
    and attempt.session_id = p_session_id
    and attempt.stage = 'transcription'
    and exists (
      select 1
      from public.learning_sessions as session
      where session.id = p_session_id
        and session.user_id = v_user_id
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then return false; end if;

  update public.learning_sessions
  set source_status = case when p_status = 'succeeded' then 'stt_unverified' else 'failed' end
  where id = p_session_id
    and user_id = v_user_id;

  return true;
end;
$$;

comment on function public.complete_transcription_attempt(uuid, uuid, text, integer, text) is
  'Finalizes owned transcription metadata without storing audio, provider payloads, or transcript text.';

create or replace function public.verify_transcript_candidate(
  p_session_id uuid,
  p_source_status text
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

  if p_source_status not in ('user_verified', 'user_edited') then
    raise exception 'invalid_source_status' using errcode = '22023';
  end if;

  update public.learning_sessions
  set source_status = p_source_status
  where id = p_session_id
    and user_id = auth.uid()
    and source_status = 'stt_unverified';

  return found;
end;
$$;

comment on function public.verify_transcript_candidate(uuid, text) is
  'Records owner confirmation/edit metadata only; verified transcript remains transient client state.';

revoke all on function public.start_transcription_session(text, integer, text) from public, anon, authenticated;
revoke all on function public.complete_transcription_attempt(uuid, uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.verify_transcript_candidate(uuid, text) from public, anon, authenticated;

grant execute on function public.start_transcription_session(text, integer, text) to authenticated;
grant execute on function public.complete_transcription_attempt(uuid, uuid, text, integer, text) to authenticated;
grant execute on function public.verify_transcript_candidate(uuid, text) to authenticated;
