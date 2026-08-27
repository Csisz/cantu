# 09 — Existing Site & Pivot Review

## Existing implementation strengths to preserve

The current Cantu product already has:

- recognizable robot character;
- premium musical visual identity;
- strong responsive landing;
- Next.js/TypeScript foundation;
- `/app` shell;
- Listen/Upload interaction language;
- confirmation/recovery state patterns;
- accessibility/reduced-motion work;
- Supabase/Auth/RLS foundation from Milestone 1.

Do not throw this work away.

## What changes conceptually

### Old

`Listen/Upload song → identify song candidate → confirm song → lyrics → lesson`

### New

`Listen/Audio/Text → select source → confirm transcript/text → understand → learn → practise`

## Component reuse map

### Keep/evolve

- landing page section structure;
- hero robot/media;
- input mode cards;
- animated listening state;
- confirmation-card visual language;
- recovery/error cards;
- account/library shell;
- test infrastructure.

### Rename/reframe

- song recognition → source/transcript verification;
- candidate song → transcript/source candidate;
- song upload → local audio source;
- “Igen, ez az” can become `Igen, pontos` for transcripts;
- song library → learning history/phrasebook.

### Remove from active product copy

- claims about learning favourite songs as the primary promise;
- Shazam-like identification as the core job;
- lyrics pipeline promises;
- full-song lesson language.

## New signature UX

The waveform selection surface should become one of Cantu's memorable interactions.

The visual language can remain musical even though the product is no longer a music catalogue.
