-- Cantu Milestone 6: resumable learning stages and idempotent private phrase saving.
-- Existing results stay immutable and source-light; no source/audio columns are added.

alter table public.learning_progress
  drop constraint learning_progress_stage;

alter table public.learning_progress
  add constraint learning_progress_stage check (
    stage in (
      'new', 'source_verified', 'understand', 'notice',
      'meaning', 'chunks', 'grammar', 'say', 'recall', 'completed'
    )
  );

comment on constraint learning_progress_stage on public.learning_progress is
  'Milestone 6 writes meaning/chunks/grammar/say/recall/completed; earlier values remain readable for safe migration.';

create unique index user_phrasebook_session_chunk_unique_idx
  on public.user_phrasebook (
    user_id,
    source_session_id,
    lower(btrim(italian_chunk))
  )
  where source_session_id is not null;

comment on index public.user_phrasebook_session_chunk_unique_idx is
  'Prevents duplicate saves of the same derived chunk within one private owned learning session.';
