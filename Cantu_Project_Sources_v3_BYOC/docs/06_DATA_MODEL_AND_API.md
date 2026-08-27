# 06 — Data Model & API

## Migration principle

Milestone 1 introduced song-centric foundation tables. The pivot should migrate toward generalized learning-source entities without destructively deleting legacy tables until the new flow is proven.

## Recommended new core entities

### `learning_sessions`

Private user-owned learning request/session.

Suggested fields:

- `id uuid`
- `user_id uuid`
- `input_type` (`microphone`, `audio_file`, `text`)
- `content_kind` (`speech`, `music_excerpt`, `video_excerpt`, `text`, `other`) nullable/user-supplied
- `source_language` default `it`
- `explanation_language` default `hu`
- `source_status` (`pending`, `transcribed`, `user_verified`, `user_edited`, `ready`, `failed`)
- `source_duration_ms nullable`
- `source_char_count nullable`
- `source_fingerprint nullable`
- `save_source boolean default false`
- `verified_source_text nullable`
- `created_at`
- `updated_at`

### Source retention rule

`verified_source_text` should be nullable and cleared after analysis unless the user has explicitly chosen a feature that requires saving it and the retention/legal design is approved.

Raw audio path should normally be absent/null.

### `processing_attempts`

Operational metadata:

- `id`
- `session_id`
- `stage` (`transcription`, `language_validation`, `analysis`)
- `provider`
- `status`
- `latency_ms`
- `error_code nullable`
- `confidence nullable`
- `created_at`

No raw ambient audio body in database.

### `learning_results`

Derived learning object:

- `id`
- `session_id`
- `schema_version`
- `generator_version`
- `result_json`
- `created_at`
- `updated_at`

Private to the owning user unless a later reuse model is explicitly designed.

### `user_phrasebook`

- `id`
- `user_id`
- `italian_chunk`
- `meaning_hu`
- `note_hu nullable`
- `register nullable`
- `source_session_id nullable`
- `created_at`
- `last_reviewed_at nullable`

### `learning_progress`

- `user_id`
- `session_id`
- `stage`
- `percent_complete`
- `recall_score nullable`
- `last_opened_at`

## Legacy song tables

Existing tables such as `songs`, `recognition_attempts`, `lyrics_versions`, `lessons`, `user_songs`, and `user_song_progress` should be treated as legacy/product-v2 structures after the pivot.

Do not immediately drop them in the same migration that introduces the new model. Mark deprecation and remove only after:

- new flow works;
- data migration decision is explicit;
- no runtime dependency remains.

## RLS

Private tables must enforce user ownership.

The client must never be allowed to select an arbitrary `user_id` for writes.

Derive identity server-side.

## API sketch

### Transcription

`POST /api/transcriptions`

Selected short audio clip → normalized transcript candidate.

Server validation:

- authenticated or quota-controlled user;
- MIME allowlist;
- duration <= configured maximum;
- size limit;
- no permanent raw-audio storage.

### Analysis

`POST /api/learning/analyze`

Input:

- verified Italian text;
- source status;
- explanation language `hu`.

Output:

- validated `LearningAnalysis`.

### Save

`POST /api/learning/:sessionId/save`

Persist derived result and selected phrases according to retention policy.

## Security

- private sessions/results are user-owned;
- raw provider payloads server-only when needed;
- no public source-content queries;
- no public user-content URLs;
- no client service-role key.
