# Milestone 2 — Product Pivot & Local Input Studio

## Goal

Replace the active song-recognition product flow with the new Cantu Bring Your Own Content experience while preserving the existing visual identity and Milestone 1 foundations.

## Required outcome

A user can enter `/app` and choose:

1. **Hallgasd** — a local/mock microphone-oriented flow for short spoken audio;
2. **Hangfájl** — open a local audio file, see a waveform, select a maximum 30-second segment, preview it locally;
3. **Szöveg** — paste/type a short Italian text passage.

All paths converge on a **source confirmation** screen before later AI processing.

## Audio-file requirements

- complete file remains in browser memory/local object URL;
- no full-file network upload;
- waveform generated locally;
- draggable/keyboard-accessible selection region;
- selection length visibly shown;
- hard maximum 30 seconds;
- local playback of selection;
- only metadata/local state in Milestone 2;
- no Supabase Storage upload.

## Listen requirements

Milestone 2 may keep microphone capture mocked if that produces a safer, smaller migration. The final UI and state model must be ready for real explicit capture in a later milestone.

Do not add provider calls.

## Text requirements

- textarea/input with 2,000-character initial limit;
- live remaining-character feedback;
- source language fixed to Italian for v1;
- no public sharing;
- no AI call yet;
- confirmation view shows exactly what would be analysed.

## Product copy

Replace active song-specific copy with the new positioning:

**Értsd meg az olaszt, amivel találkozol.**

Primary promise:

**Hallgasd. Olvasd. Értsd meg. Mondd ki.**

## Mock post-input flow

After confirmation, show the skeleton of the future learning sequence without generating real AI content:

- `Ezt fogjuk elemezni`
- `Mit jelent?` placeholder
- `Hasznos kifejezések` placeholder
- `Miért így mondják?` placeholder
- `Mondd ki te is` future marker

Do not fabricate realistic copyrighted source content.

## Data / backend

Milestone 1 Supabase/Auth/RLS work must remain intact.

Do not perform the full generalized database migration yet unless specifically needed for compile-safe new types. The next milestone owns persistence migration.

## Must not implement yet

- real speech-to-text;
- OpenAI/LLM learning generation;
- pronunciation scoring;
- full audio upload;
- public content sharing;
- lyrics provider;
- music recognition provider;
- billing.

## Completion checks

- `/` updated to new positioning while visual spirit is preserved;
- `/app` has 3 clear input modes;
- audio-file waveform/selection works locally;
- max 30-second selection enforced;
- text flow works locally;
- existing Supabase/auth shell still works;
- accessibility/reduced motion maintained;
- tests updated from song-candidate semantics to source-confirmation semantics;
- lint/typecheck/unit/E2E/build pass;
- no unexpected network call from local input processing.
