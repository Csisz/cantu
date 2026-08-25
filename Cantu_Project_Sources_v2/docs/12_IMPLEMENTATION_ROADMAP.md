# 12 — Implementation Roadmap

The order is deliberate. Each milestone must leave a working, reviewable system.

## Milestone 0 — Foundation & visual migration

Goal: turn the prototype into a maintainable Cantu web project without external AI/provider complexity.

Deliverables:

- migrate current `index.html` visual direction to Next.js/TypeScript;
- rename LyricLingo → Cantu everywhere;
- keep/refine robot assets and motion;
- fix responsive/video-ratio behavior;
- add `/app` shell;
- update hero to two entry paths: Listen + Upload;
- implement mocked Listen/recognition/confirmation UI states;
- reduced-motion/accessibility basics;
- no Supabase/OpenAI/AudD integration yet.

## Milestone 1 — Supabase foundation

- project config/env validation;
- Auth;
- schema/migrations;
- RLS;
- user library/progress skeleton.

## Milestone 2 — Music recognition vertical slice

- browser microphone capture with `MediaRecorder`;
- short clip limits;
- server recognition adapter interface;
- AudD adapter first;
- candidate normalization;
- confirmation/reject/manual fallback;
- ephemeral audio deletion;
- recognition tests.

This milestone should be independently demoable before any lyrics AI.

## Milestone 3 — Audio upload

- direct/resumable private storage upload;
- metadata extraction;
- recognition fallback for ambiguous files;
- retention/deletion behavior.

## Milestone 4 — Canonical songs + lyrics

- song identity/dedup;
- lyrics provider adapter;
- rights capability model;
- Italian validation;
- lyrics normalization.

## Milestone 5 — Lesson generation

- strict lesson schema;
- OpenAI structured generation;
- validation/retries;
- cache/versioning;
- Quick Understand payload.

## Milestone 6 — Learning UI

- Song Snapshot;
- chorus lesson;
- vocabulary cards;
- key lines;
- mini grammar;
- quiz;
- progress.

## Milestone 7 — Deep Dive

- progressive sections;
- more exercises;
- complete-understanding path;
- rights-aware rendering.

## Milestone 8 — Timing/listening intelligence

- optional transcription/alignment;
- line synchronization;
- richer replay interactions.

## Milestone 9 — Link import experiment

- Spotify/YouTube URL parsing;
- permitted metadata resolution;
- candidate confirmation;
- no protected-media download.

## Milestone 10 — Monetization/readiness

Only after activation/retention is validated:

- plans/entitlements;
- usage quotas;
- billing;
- admin operational tools.
