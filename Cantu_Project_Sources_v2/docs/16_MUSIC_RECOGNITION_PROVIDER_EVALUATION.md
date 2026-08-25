# 16 — Music Recognition Provider Evaluation

## Goal

Choose the best provider for Cantu's web MVP based on **real Italian-song recognition tests**, not brand familiarity.

## Candidates

### AudD — recommended first integration spike

Pros:

- simple HTTP API;
- explicitly positioned for short song identification;
- straightforward file/Blob input;
- Spotify/Apple metadata options;
- good fit for Next.js server adapter.

Questions to benchmark:

- Italian catalogue hit rate;
- covers/live/remixes;
- noisy room performance;
- latency from Hungary/EU;
- pricing at expected attempts/user;
- commercial terms/data retention.

### ACRCloud — benchmark alternative

Pros:

- established acoustic-fingerprint recognition platform;
- microphone/line-in use case explicitly documented;
- potentially useful scoring/catalog options.

Questions:

- response normalization complexity;
- required account/project configuration;
- exact costs/quotas;
- Italian match quality vs AudD.

### ShazamKit — future native track

Pros:

- Shazam catalogue/technology;
- strong on-device/native story;
- acoustic signature is not reversible to original audio.

Constraint for current product:

- current Cantu target is a web application. Apple positions ShazamKit for native Apple platforms and Android; therefore do not make the browser MVP depend on it.

## Benchmark dataset

Before production commitment, test at least ~50–100 clips across:

- current Italian pop;
- older classics;
- rap/trap;
- acoustic/live versions;
- covers;
- low-volume background playback;
- noisy room;
- 8s vs 12s vs 15s snippets.

Track:

- exact match;
- wrong match;
- no match;
- latency;
- usable identifiers returned;
- cost.

## Architecture decision

The product uses an adapter and feature flag:

`MUSIC_RECOGNITION_PROVIDER=audd`

Changing provider must not require modifying React UI, database domain objects or learning logic.
