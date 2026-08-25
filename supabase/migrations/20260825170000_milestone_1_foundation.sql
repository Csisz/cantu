-- Cantu Milestone 1: identity, canonical song metadata, and private learner state.
-- No audio, lyrics text, recognition provider payloads, or generated lesson content is seeded.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length check (
    display_name is null or char_length(btrim(display_name)) between 1 and 80
  )
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  album text,
  isrc text,
  artwork_url text,
  source_language text not null default 'it',
  spotify_id text,
  apple_music_id text,
  musicbrainz_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint songs_title_not_blank check (char_length(btrim(title)) > 0),
  constraint songs_artist_not_blank check (char_length(btrim(artist)) > 0),
  constraint songs_source_language_it check (source_language = 'it')
);

create unique index songs_isrc_unique on public.songs (isrc) where isrc is not null;
create unique index songs_spotify_id_unique on public.songs (spotify_id) where spotify_id is not null;
create unique index songs_apple_music_id_unique on public.songs (apple_music_id) where apple_music_id is not null;
create unique index songs_musicbrainz_id_unique on public.songs (musicbrainz_id) where musicbrainz_id is not null;
create index songs_title_artist_idx on public.songs (lower(title), lower(artist));

create table public.recognition_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input_type text not null,
  provider text,
  status text not null default 'created',
  candidate_song_json jsonb,
  confidence numeric(5, 4),
  confirmed_song_id uuid references public.songs (id) on delete set null,
  rejected_at timestamptz,
  latency_ms integer,
  error_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recognition_attempts_input_type check (
    input_type in ('microphone', 'upload', 'manual', 'link')
  ),
  constraint recognition_attempts_status check (
    status in ('created', 'identifying', 'awaiting_confirmation', 'confirmed', 'rejected', 'no_match', 'failed')
  ),
  constraint recognition_attempts_candidate_object check (
    candidate_song_json is null or jsonb_typeof(candidate_song_json) = 'object'
  ),
  constraint recognition_attempts_confidence_bounds check (
    confidence is null or confidence between 0 and 1
  ),
  constraint recognition_attempts_latency_nonnegative check (
    latency_ms is null or latency_ms >= 0
  )
);

create index recognition_attempts_user_created_idx
  on public.recognition_attempts (user_id, created_at desc);
create index recognition_attempts_confirmed_song_idx
  on public.recognition_attempts (confirmed_song_id)
  where confirmed_song_id is not null;

create table public.lyrics_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  provider text not null,
  provider_lyrics_id text not null,
  content_hash text not null,
  language text not null default 'it',
  rights_json jsonb not null default '{}'::jsonb,
  timing_available boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint lyrics_versions_provider_not_blank check (char_length(btrim(provider)) > 0),
  constraint lyrics_versions_provider_id_not_blank check (char_length(btrim(provider_lyrics_id)) > 0),
  constraint lyrics_versions_hash_not_blank check (char_length(btrim(content_hash)) > 0),
  constraint lyrics_versions_language_it check (language = 'it'),
  constraint lyrics_versions_rights_object check (jsonb_typeof(rights_json) = 'object'),
  constraint lyrics_versions_provider_identity_unique unique (song_id, provider, provider_lyrics_id)
);

create index lyrics_versions_song_idx on public.lyrics_versions (song_id, created_at desc);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  source_language text not null default 'it',
  explanation_language text not null default 'hu',
  status text not null default 'draft',
  schema_version text not null,
  generator_version text not null,
  lesson_json jsonb not null default '{}'::jsonb,
  lyrics_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lessons_source_language_it check (source_language = 'it'),
  constraint lessons_explanation_language_hu check (explanation_language = 'hu'),
  constraint lessons_status check (status in ('draft', 'generating', 'ready', 'failed')),
  constraint lessons_schema_version_not_blank check (char_length(btrim(schema_version)) > 0),
  constraint lessons_generator_version_not_blank check (char_length(btrim(generator_version)) > 0),
  constraint lessons_json_object check (jsonb_typeof(lesson_json) = 'object'),
  constraint lessons_id_song_unique unique (id, song_id)
);

create index lessons_song_language_idx
  on public.lessons (song_id, source_language, explanation_language, created_at desc);

create table public.user_songs (
  user_id uuid not null references auth.users (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  saved_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, song_id)
);

create index user_songs_user_saved_idx on public.user_songs (user_id, saved_at desc);

create table public.user_song_progress (
  user_id uuid not null,
  song_id uuid not null,
  lesson_id uuid,
  stage text not null default 'new',
  percent_complete numeric(5, 2) not null default 0,
  quiz_score numeric(5, 2),
  last_opened_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, song_id),
  foreign key (user_id, song_id)
    references public.user_songs (user_id, song_id)
    on delete cascade,
  foreign key (lesson_id, song_id)
    references public.lessons (id, song_id)
    on delete set null (lesson_id),
  constraint user_song_progress_stage check (
    stage in ('new', 'quick_understand', 'deep_dive', 'completed')
  ),
  constraint user_song_progress_percent_bounds check (
    percent_complete between 0 and 100
  ),
  constraint user_song_progress_quiz_bounds check (
    quiz_score is null or quiz_score between 0 and 100
  )
);

create index user_song_progress_user_opened_idx
  on public.user_song_progress (user_id, last_opened_at desc nulls last);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger songs_set_updated_at
before update on public.songs
for each row execute function public.set_updated_at();

create trigger recognition_attempts_set_updated_at
before update on public.recognition_attempts
for each row execute function public.set_updated_at();

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger user_song_progress_set_updated_at
before update on public.user_song_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.recognition_attempts enable row level security;
alter table public.lyrics_versions enable row level security;
alter table public.lessons enable row level security;
alter table public.user_songs enable row level security;
alter table public.user_song_progress enable row level security;

create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy songs_read_metadata
on public.songs for select to anon, authenticated
using (true);

create policy recognition_attempts_select_own
on public.recognition_attempts for select to authenticated
using ((select auth.uid()) = user_id);

create policy recognition_attempts_insert_own
on public.recognition_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy recognition_attempts_update_own
on public.recognition_attempts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy recognition_attempts_delete_own
on public.recognition_attempts for delete to authenticated
using ((select auth.uid()) = user_id);

create policy user_songs_select_own
on public.user_songs for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_songs_insert_own
on public.user_songs for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy user_songs_update_own
on public.user_songs for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_songs_delete_own
on public.user_songs for delete to authenticated
using ((select auth.uid()) = user_id);

create policy user_song_progress_select_own
on public.user_song_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_song_progress_insert_own
on public.user_song_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy user_song_progress_update_own
on public.user_song_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_song_progress_delete_own
on public.user_song_progress for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.songs from anon, authenticated;
revoke all on table public.recognition_attempts from anon, authenticated;
revoke all on table public.lyrics_versions from anon, authenticated;
revoke all on table public.lessons from anon, authenticated;
revoke all on table public.user_songs from anon, authenticated;
revoke all on table public.user_song_progress from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.songs to anon, authenticated;
grant select, insert, update, delete on table public.recognition_attempts to authenticated;
grant select, insert, update, delete on table public.user_songs to authenticated;
grant select, insert, update, delete on table public.user_song_progress to authenticated;
