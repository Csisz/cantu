-- Cantu Milestone 5: private, source-light structured analysis lifecycle.
-- Only service-role server orchestration may write operational attempts/results.
-- Source text, prompts, provider payloads and audio are never accepted by these functions.

create unique index processing_attempts_one_running_analysis_idx
  on public.processing_attempts (session_id)
  where stage = 'analysis' and status = 'running';

create or replace function public.start_learning_analysis(
  p_user_id uuid,
  p_session_id uuid,
  p_input_type text,
  p_source_status text,
  p_source_char_count integer,
  p_source_fingerprint text,
  p_provider text,
  p_schema_version text,
  p_generator_version text
)
returns table (
  learning_session_id uuid,
  processing_attempt_id uuid,
  cached_result jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.learning_sessions%rowtype;
  v_session_id uuid;
  v_attempt_id uuid;
  v_cached_result jsonb;
  v_recent_attempts integer;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_source_status not in ('text_direct', 'user_verified', 'user_edited') then
    raise exception 'invalid_source_status' using errcode = '22023';
  end if;
  if p_input_type not in ('microphone', 'audio_file', 'text') then
    raise exception 'invalid_input_type' using errcode = '22023';
  end if;
  if p_source_char_count is null or p_source_char_count < 1 or p_source_char_count > 2000 then
    raise exception 'invalid_source_char_count' using errcode = '22023';
  end if;
  if p_source_fingerprint is null or p_source_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_source_fingerprint' using errcode = '22023';
  end if;
  if p_provider is null or char_length(btrim(p_provider)) not between 1 and 64
    or p_schema_version is null or char_length(btrim(p_schema_version)) not between 1 and 80
    or p_generator_version is null or char_length(btrim(p_generator_version)) not between 1 and 80 then
    raise exception 'invalid_analysis_metadata' using errcode = '22023';
  end if;

  if p_session_id is null then
    if p_input_type <> 'text' or p_source_status <> 'text_direct' then
      raise exception 'session_not_found' using errcode = 'P0001';
    end if;
    insert into public.learning_sessions (
      user_id, input_type, source_status, source_char_count, source_fingerprint,
      save_source, verified_source_text, source_retention_status
    ) values (
      p_user_id, 'text', 'text_direct', p_source_char_count, p_source_fingerprint,
      false, null, 'not_stored'
    ) returning id into v_session_id;
  else
    select * into v_session
    from public.learning_sessions
    where id = p_session_id and user_id = p_user_id
    for update;
    if not found then raise exception 'session_not_found' using errcode = 'P0001'; end if;
    if v_session.input_type <> p_input_type
      or v_session.source_language <> 'it'
      or v_session.explanation_language <> 'hu'
      or v_session.source_status not in (p_source_status, 'ready') then
      raise exception 'invalid_source_status' using errcode = '22023';
    end if;
    if v_session.source_fingerprint is not null
      and v_session.source_fingerprint <> p_source_fingerprint then
      raise exception 'analysis_source_mismatch' using errcode = 'P0001';
    end if;
    update public.learning_sessions
    set source_fingerprint = p_source_fingerprint,
        source_char_count = case when input_type = 'text' then p_source_char_count else source_char_count end
    where id = p_session_id and user_id = p_user_id;
    v_session_id := p_session_id;
  end if;

  select result_json into v_cached_result
  from public.learning_results
  where session_id = v_session_id
    and schema_version = p_schema_version
    and generator_version = p_generator_version;

  if found then
    return query select v_session_id, null::uuid, v_cached_result;
    return;
  end if;

  select count(*)::integer into v_recent_attempts
  from public.processing_attempts attempt
  join public.learning_sessions session on session.id = attempt.session_id
  where session.user_id = p_user_id
    and attempt.stage = 'analysis'
    and attempt.created_at >= timezone('utc', now()) - interval '1 hour';
  if v_recent_attempts >= 10 then
    raise exception 'analysis_rate_limited' using errcode = 'P0001';
  end if;

  begin
    insert into public.processing_attempts (session_id, stage, provider, status)
    values (v_session_id, 'analysis', btrim(p_provider), 'running')
    returning id into v_attempt_id;
  exception when unique_violation then
    raise exception 'analysis_in_progress' using errcode = 'P0001';
  end;

  return query select v_session_id, v_attempt_id, null::jsonb;
end;
$$;

create or replace function public.complete_learning_analysis(
  p_user_id uuid,
  p_session_id uuid,
  p_attempt_id uuid,
  p_schema_version text,
  p_generator_version text,
  p_result_json jsonb,
  p_latency_ms integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if p_latency_ms is null or p_latency_ms < 0 then
    raise exception 'invalid_latency' using errcode = '22023';
  end if;
  if jsonb_typeof(p_result_json) <> 'object'
    or p_result_json->>'schemaVersion' <> p_schema_version then
    raise exception 'invalid_learning_result' using errcode = '22023';
  end if;

  update public.processing_attempts attempt
  set status = 'succeeded', latency_ms = p_latency_ms, error_code = null
  where attempt.id = p_attempt_id
    and attempt.session_id = p_session_id
    and attempt.stage = 'analysis'
    and attempt.status = 'running'
    and exists (
      select 1 from public.learning_sessions session
      where session.id = p_session_id and session.user_id = p_user_id
    );
  get diagnostics v_updated = row_count;
  if v_updated = 0 then return false; end if;

  insert into public.learning_results (
    session_id, schema_version, generator_version, result_json
  ) values (
    p_session_id, btrim(p_schema_version), btrim(p_generator_version), p_result_json
  )
  on conflict (session_id) do update set
    schema_version = excluded.schema_version,
    generator_version = excluded.generator_version,
    result_json = excluded.result_json;

  update public.learning_sessions
  set source_status = 'ready', verified_source_text = null,
      save_source = false, source_retention_status = 'not_stored'
  where id = p_session_id and user_id = p_user_id;
  return true;
end;
$$;

create or replace function public.fail_learning_analysis(
  p_user_id uuid,
  p_session_id uuid,
  p_attempt_id uuid,
  p_latency_ms integer,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.processing_attempts attempt
  set status = 'failed', latency_ms = greatest(0, p_latency_ms),
      error_code = left(coalesce(btrim(p_error_code), 'analysis_failed'), 80)
  where attempt.id = p_attempt_id
    and attempt.session_id = p_session_id
    and attempt.stage = 'analysis'
    and attempt.status = 'running'
    and exists (
      select 1 from public.learning_sessions session
      where session.id = p_session_id and session.user_id = p_user_id
    );
  return found;
end;
$$;

comment on function public.start_learning_analysis(uuid, uuid, text, text, integer, text, text, text, text) is
  'Service-role-only source-light analysis start/cache/rate boundary. Fingerprint is session-private; source text is never accepted.';
comment on function public.complete_learning_analysis(uuid, uuid, uuid, text, text, jsonb, integer) is
  'Service-role-only validated derived-result persistence. Raw provider responses, prompts and source text are never accepted.';
comment on function public.fail_learning_analysis(uuid, uuid, uuid, integer, text) is
  'Service-role-only normalized analysis failure metadata.';

revoke all on function public.start_learning_analysis(uuid, uuid, text, text, integer, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.complete_learning_analysis(uuid, uuid, uuid, text, text, jsonb, integer)
  from public, anon, authenticated;
revoke all on function public.fail_learning_analysis(uuid, uuid, uuid, integer, text)
  from public, anon, authenticated;

grant execute on function public.start_learning_analysis(uuid, uuid, text, text, integer, text, text, text, text)
  to service_role;
grant execute on function public.complete_learning_analysis(uuid, uuid, uuid, text, text, jsonb, integer)
  to service_role;
grant execute on function public.fail_learning_analysis(uuid, uuid, uuid, integer, text)
  to service_role;

grant select on table public.learning_sessions, public.processing_attempts, public.learning_results
  to service_role;
