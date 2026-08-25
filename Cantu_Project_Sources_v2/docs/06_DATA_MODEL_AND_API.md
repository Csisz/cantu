# 06 — Data Model & API

## Core entities

### `users`

Supabase Auth identity/profile.

### `songs`

Canonical track identity.

Suggested fields:

- `id uuid`
- `title`
- `artist`
- `album`
- `isrc nullable`
- `artwork_url nullable`
- `source_language`
- `spotify_id nullable`
- `apple_music_id nullable`
- `musicbrainz_id nullable`
- `created_at`

Uniqueness should prefer ISRC/provider IDs where available; do not rely only on title string.

### `recognition_attempts`

- `id`
- `user_id`
- `input_type` (`microphone`, `upload`, later `link`, `manual`)
- `provider`
- `status`
- `candidate_song_json`
- `confidence nullable`
- `confirmed_song_id nullable`
- `rejected_at nullable`
- `latency_ms nullable`
- `error_code nullable`
- `created_at`

Raw ambient audio path should normally be null/deleted after processing.

### `lyrics_versions`

- `song_id`
- `provider`
- `provider_lyrics_id`
- `content_hash`
- `language`
- `rights_json`
- `timing_available`
- protected canonical content according to provider agreement

### `lessons`

- `id`
- `song_id`
- `source_language = it`
- `explanation_language = hu`
- `status`
- `schema_version`
- `generator_version`
- `lesson_json`
- `lyrics_hash`
- `created_at`

### `user_song_progress`

- `user_id`
- `song_id`
- `lesson_id`
- `stage`
- `percent_complete`
- `quiz_score`
- `last_opened_at`

### `user_vocabulary_progress` — later MVP+/v2

Spaced repetition across songs.

## API sketch

### Recognition

`POST /api/recognition`

Multipart short audio clip → normalized candidate.

`POST /api/recognition/:attemptId/confirm`

Confirms candidate and creates/links canonical song.

`POST /api/recognition/:attemptId/reject`

Rejects candidate.

### Upload

`POST /api/uploads/create`

Returns signed/resumable upload details for full audio.

### Processing

`POST /api/songs/:songId/prepare`

Idempotent orchestration after confirmed identity.

`GET /api/jobs/:jobId`

Returns processing status.

### Lessons

`GET /api/songs/:songId/lesson`

Returns learner-safe lesson representation respecting rights capabilities.

`POST /api/lessons/:lessonId/progress`

Persists completion/quiz events.

## Security/RLS

- users read/write only their progress and private uploads;
- canonical songs and reusable lesson data are server-managed;
- provider payloads and restricted lyrics are not directly queryable from client tables;
- service-role operations happen server-side only.
