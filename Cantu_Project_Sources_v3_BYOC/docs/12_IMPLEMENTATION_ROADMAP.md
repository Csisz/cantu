# 12 — Implementation Roadmap v3

The order is deliberate. Each milestone must leave a working, reviewable system.

## Milestone 0 — Foundation & visual migration — COMPLETE

- Next.js/TypeScript migration;
- Cantu branding;
- preserved visual identity;
- `/app` shell;
- mocked Listen/Upload/confirmation UX;
- accessibility/reduced motion;
- tests/build.

## Milestone 1 — Supabase foundation — IMPLEMENTED / LOCAL VERIFIED

- Supabase SSR foundation;
- Auth;
- migrations;
- RLS;
- library/progress skeleton;
- local database tests.

Cloud production connection/deployment may remain operational setup.

## Milestone 2 — Product pivot & local Input Studio — NEXT

Goal: replace song-recognition semantics with Bring Your Own Content.

- new landing copy and three input paths;
- Listen / Audio file / Text;
- local audio waveform;
- local max-30s range selection;
- local playback;
- text input + limit;
- source confirmation states;
- update tests;
- no real STT/LLM/network audio processing.

## Milestone 3 — Generalized persistence migration

- introduce `learning_sessions`, `processing_attempts`, `learning_results`, phrasebook/progress model;
- migrate app away from song-specific tables;
- preserve legacy tables until safe removal;
- RLS tests;
- retention-state model;
- data deletion paths.

## Milestone 4 — Speech-to-text vertical slice

- real explicit microphone capture;
- browser-selected audio clip extraction;
- server validation;
- `SpeechToTextProvider` abstraction;
- first provider implementation;
- normalized transcript candidate;
- uncertainty representation;
- user confirm/edit;
- raw clip deletion;
- privacy/retention integration tests.

This milestone does **not** generate the full learning analysis yet.

## Milestone 5 — Structured learning analysis

- `LanguageAnalysisProvider` abstraction;
- strict learning schema;
- Italian validation;
- natural Hungarian meaning;
- chunk selection;
- register/idiom/contextual grammar;
- original transfer examples;
- recall questions;
- structured validation/retry;
- prompt-injection boundary tests.

## Milestone 6 — Learning experience UI

Implement the full Cantu loop:

1. Mit jelent?
2. Ezt érdemes megjegyezni
3. Miért így mondják?
4. Mondd ki te is
5. Emlékszel?

- progressive cards;
- clear next action;
- session completion;
- save derived phrases/results.

## Milestone 7 — Pronunciation & shadowing

- playback/chunk replay;
- recording for learner production;
- optional pronunciation provider;
- transparent feedback;
- no biometric identification/emotion inference.

## Milestone 8 — Phrasebook, review & learning memory

- personal phrasebook;
- spaced review;
- session history;
- progress;
- source-light retention;
- delete/export controls.

## Milestone 9 — Public beta compliance hardening

Before public commercial use:

- targeted Hungarian/EU legal review;
- Terms;
- Privacy Notice;
- processor/subprocessor review;
- retention/deletion verification;
- DSA/notice process assessment;
- age policy;
- abuse/rate limits;
- anti-reconstruction controls;
- production Supabase/Vercel hardening;
- security review.

## Milestone 10 — Monetization

Only after activation/retention and legal launch gate:

- plans;
- usage quotas;
- billing;
- cost controls;
- admin operational tooling.

## Future experiments

Only after core loop works:

- additional languages;
- browser tab/system audio where permitted;
- image/OCR text input;
- shareable user-authored learning cards without source-copyright leakage;
- group/classroom workflows.
