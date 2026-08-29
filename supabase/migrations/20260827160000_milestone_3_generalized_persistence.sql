-- Cantu Milestone 3: private, metadata-minimizing BYOC learning persistence.
-- The Milestone 1 song-era tables remain intact as legacy structures.
-- No raw audio path, audio bytes, waveform data, source catalogue, or source text is seeded.

comment on table public.songs is
  'Legacy v2 canonical song table. Preserved during the BYOC migration; active runtime must not write here.';
comment on table public.recognition_attempts is
  'Legacy v2 recognition table. Preserved during the BYOC migration; active runtime must not write here.';
comment on table public.lyrics_versions is
  'Legacy v2 lyrics metadata table. Preserved for migration safety; not used by the BYOC runtime.';
comment on table public.lessons is
  'Legacy v2 song lesson table. Preserved for migration safety; not used by the BYOC runtime.';
comment on table public.user_songs is
  'Legacy v2 personal song library. Preserved for migration safety; active runtime uses learning_sessions.';
comment on table public.user_song_progress is
  'Legacy v2 song progress. Preserved for migration safety; active runtime uses learning_progress.';

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_type text not null,
  content_kind text,
  source_language text not null default 'it',
  explanation_language text not null default 'hu',
  source_status text not null default 'pending',
  source_duration_ms integer,
  source_char_count integer,
  source_fingerprint text,
  save_source boolean not null default false,
  verified_source_text text,
  source_retention_status text not null default 'not_stored',
  source_deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint learning_sessions_id_user_unique unique (id, user_id),
  constraint learning_sessions_input_type check (
    input_type in ('microphone', 'audio_file', 'text')
  ),
  constraint learning_sessions_content_kind check (
    content_kind is null or content_kind in ('speech', 'music_excerpt', 'video_excerpt', 'text', 'other')
  ),
  constraint learning_sessions_language_pair check (
    source_language = 'it' and explanation_language = 'hu'
  ),
  constraint learning_sessions_source_status check (
    source_status in ('pending', 'transcribed', 'user_verified', 'user_edited', 'ready', 'failed')
  ),
  constraint learning_sessions_duration_bounds check (
    source_duration_ms is null or source_duration_ms between 1 and 30000
  ),
  constraint learning_sessions_char_count_bounds check (
    source_char_count is null or source_char_count between 1 and 2000
  ),
  constraint learning_sessions_input_metadata check (
    (input_type = 'text' and source_char_count is not null and source_duration_ms is null)
    or (input_type = 'audio_file' and source_duration_ms is not null and source_char_count is null)
    or (input_type = 'microphone' and source_char_count is null)
  ),
  constraint learning_sessions_fingerprint_not_blank check (
    source_fingerprint is null or char_length(btrim(source_fingerprint)) > 0
  ),
  constraint learning_sessions_retention_status check (
    source_retention_status in ('not_stored', 'ephemeral', 'saved', 'deleted')
  ),
  constraint learning_sessions_retention_consistency check (
    (source_retention_status = 'not_stored'
      and save_source = false
      and verified_source_text is null
      and source_deleted_at is null)
    or (source_retention_status = 'ephemeral'
      and save_source = false
      and source_deleted_at is null)
    or (source_retention_status = 'saved'
      and save_source = true
      and verified_source_text is not null
      and source_deleted_at is null)
    or (source_retention_status = 'deleted'
      and save_source = false
      and verified_source_text is null
      and source_deleted_at is not null)
  )
);

create index learning_sessions_user_created_idx
  on public.learning_sessions (user_id, created_at desc);
create index learning_sessions_user_status_idx
  on public.learning_sessions (user_id, source_status, created_at desc);

create table public.processing_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions (id) on delete cascade,
  stage text not null,
  provider text,
  status text not null default 'created',
  latency_ms integer,
  error_code text,
  confidence numeric(5, 4),
  created_at timestamptz not null default timezone('utc', now()),
  constraint processing_attempts_stage check (
    stage in ('transcription', 'language_validation', 'analysis')
  ),
  constraint processing_attempts_status check (
    status in ('created', 'running', 'succeeded', 'failed')
  ),
  constraint processing_attempts_provider_not_blank check (
    provider is null or char_length(btrim(provider)) > 0
  ),
  constraint processing_attempts_latency_nonnegative check (
    latency_ms is null or latency_ms >= 0
  ),
  constraint processing_attempts_confidence_bounds check (
    confidence is null or confidence between 0 and 1
  )
);

create index processing_attempts_session_created_idx
  on public.processing_attempts (session_id, created_at desc);

create table public.learning_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.learning_sessions (id) on delete cascade,
  schema_version text not null,
  generator_version text,
  result_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint learning_results_schema_version_not_blank check (
    char_length(btrim(schema_version)) > 0
  ),
  constraint learning_results_generator_version_not_blank check (
    generator_version is null or char_length(btrim(generator_version)) > 0
  ),
  constraint learning_results_json_object check (
    jsonb_typeof(result_json) = 'object'
  ),
  constraint learning_results_session_unique unique (session_id)
);

create table public.user_phrasebook (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  italian_chunk text not null,
  meaning_hu text not null,
  note_hu text,
  register text,
  source_session_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  last_reviewed_at timestamptz,
  constraint user_phrasebook_chunk_not_blank check (char_length(btrim(italian_chunk)) > 0),
  constraint user_phrasebook_meaning_not_blank check (char_length(btrim(meaning_hu)) > 0),
  constraint user_phrasebook_source_owner_fkey
    foreign key (source_session_id, user_id)
    references public.learning_sessions (id, user_id)
    on delete set null (source_session_id)
);

create index user_phrasebook_user_created_idx
  on public.user_phrasebook (user_id, created_at desc);

create table public.learning_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null,
  stage text not null default 'new',
  percent_complete numeric(5, 2) not null default 0,
  recall_score numeric(5, 2),
  last_opened_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, session_id),
  constraint learning_progress_session_owner_fkey
    foreign key (session_id, user_id)
    references public.learning_sessions (id, user_id)
    on delete cascade,
  constraint learning_progress_stage check (
    stage in ('new', 'source_verified', 'understand', 'notice', 'say', 'recall', 'completed')
  ),
  constraint learning_progress_percent_bounds check (
    percent_complete between 0 and 100
  ),
  constraint learning_progress_recall_bounds check (
    recall_score is null or recall_score between 0 and 100
  )
);

create index learning_progress_user_opened_idx
  on public.learning_progress (user_id, last_opened_at desc);

create trigger learning_sessions_set_updated_at
before update on public.learning_sessions
for each row execute function public.set_updated_at();

create trigger learning_results_set_updated_at
before update on public.learning_results
for each row execute function public.set_updated_at();

create trigger learning_progress_set_updated_at
before update on public.learning_progress
for each row execute function public.set_updated_at();

create or replace function public.clear_learning_session_source(target_session_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.learning_sessions
  set
    verified_source_text = null,
    save_source = false,
    source_retention_status = 'deleted',
    source_deleted_at = timezone('utc', now())
  where id = target_session_id
    and user_id = (select auth.uid());

  return found;
end;
$$;

comment on function public.clear_learning_session_source(uuid) is
  'Clears retained source text for the authenticated owner; never accepts a browser-supplied user id.';

alter table public.learning_sessions enable row level security;
alter table public.processing_attempts enable row level security;
alter table public.learning_results enable row level security;
alter table public.user_phrasebook enable row level security;
alter table public.learning_progress enable row level security;

create policy learning_sessions_select_own
on public.learning_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy learning_sessions_insert_metadata_own
on public.learning_sessions for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and save_source = false
  and verified_source_text is null
  and source_retention_status = 'not_stored'
);

create policy learning_sessions_update_metadata_own
on public.learning_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and save_source = false
  and verified_source_text is null
  and source_retention_status in ('not_stored', 'deleted')
);

create policy learning_sessions_delete_own
on public.learning_sessions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy processing_attempts_select_own
on public.processing_attempts for select to authenticated
using (
  exists (
    select 1
    from public.learning_sessions
    where learning_sessions.id = processing_attempts.session_id
      and learning_sessions.user_id = (select auth.uid())
  )
);

create policy learning_results_select_own
on public.learning_results for select to authenticated
using (
  exists (
    select 1
    from public.learning_sessions
    where learning_sessions.id = learning_results.session_id
      and learning_sessions.user_id = (select auth.uid())
  )
);

create policy user_phrasebook_select_own
on public.user_phrasebook for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_phrasebook_insert_own
on public.user_phrasebook for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy user_phrasebook_update_own
on public.user_phrasebook for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_phrasebook_delete_own
on public.user_phrasebook for delete to authenticated
using ((select auth.uid()) = user_id);

create policy learning_progress_select_own
on public.learning_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy learning_progress_insert_own
on public.learning_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy learning_progress_update_own
on public.learning_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learning_progress_delete_own
on public.learning_progress for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.learning_sessions from anon, authenticated;
revoke all on table public.processing_attempts from anon, authenticated;
revoke all on table public.learning_results from anon, authenticated;
revoke all on table public.user_phrasebook from anon, authenticated;
revoke all on table public.learning_progress from anon, authenticated;

grant select, insert, update, delete on table public.learning_sessions to authenticated;
grant select on table public.processing_attempts to authenticated;
grant select on table public.learning_results to authenticated;
grant select, insert, update, delete on table public.user_phrasebook to authenticated;
grant select, insert, update, delete on table public.learning_progress to authenticated;

revoke all on function public.clear_learning_session_source(uuid) from public, anon, authenticated;
grant execute on function public.clear_learning_session_source(uuid) to authenticated;
