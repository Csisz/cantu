# 01 — MVP Scope

## MVP goal

Prove that a Hungarian-speaking learner can bring a short piece of Italian audio or text and quickly reach a useful learning outcome.

## In scope

### Input

- **Listen**: explicit short microphone capture.
- **Audio file**: local file selection, local waveform, local segment selection.
- **Text**: paste/type short Italian text.
- User confirmation/edit step before teaching.

### Initial limits

- selected audio sent for processing: maximum **30 seconds**;
- pasted text: maximum **2,000 characters**;
- source language: Italian only;
- explanation language: Hungarian only.

These are configurable product/risk limits, not legal safe-harbour claims.

### Audio-file privacy architecture

- full file remains client-side where feasible;
- waveform is generated locally;
- user selects the excerpt locally;
- only selected excerpt may be transmitted in later milestones;
- no default full-file Supabase Storage upload.

### Learning

A processed/verified input produces:

- natural Hungarian meaning;
- optional literal structure where useful;
- 3–6 useful words/chunks;
- register/idiom note if relevant;
- 1–2 contextual grammar insights maximum;
- pronunciation/listening cue;
- 2–4 question micro-recall;
- optional save-to-phrasebook/progress.

## Explicitly not required for first usable release

- arbitrary language pairs;
- public user-content sharing;
- social feed;
- lyrics catalogue;
- music-recognition provider;
- protected-media downloading;
- bulk document ingestion;
- automated full-book/full-song segmentation;
- persistent raw-audio library;
- real-time simultaneous interpretation;
- advanced pronunciation scoring;
- teacher/classroom management;
- gamification economy;
- billing before core activation is validated.

## Content-type principle

The product is source-agnostic at the learning layer. The user may bring speech or text that originates from everyday conversation, a message, a video, podcast, music excerpt or other source, but Cantu itself does not fetch the protected source for them.

## MVP success criteria

A test user can:

1. choose Listen, Audio file or Text;
2. provide a short Italian input;
3. verify what Cantu will analyse;
4. receive a clear Hungarian meaning;
5. learn several useful Italian chunks;
6. complete a short recall step;
7. correctly explain the input's meaning and recognise at least one reusable phrase later.
