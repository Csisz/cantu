# 11 — Test & Acceptance Plan

## Unit tests

### Input Studio

- audio duration formatting;
- selection never exceeds 30 seconds;
- handles cannot cross invalidly;
- selection clamps at file boundaries;
- text character limit;
- input-type state transitions.

### Processing

Later milestones:

- STT normalization;
- transcript verification transitions;
- language validation;
- learning schema validation;
- source retention decisions;
- prompt-injection delimiter handling.

## Component tests

- three input modes render;
- text input works and enforces limit;
- audio file remains local;
- waveform selection can be adjusted;
- selected duration displayed;
- selection preview controls accessible;
- confirmation screen renders exact source;
- no network request during Milestone 2 local Input Studio flow.

## E2E — Milestone 2

### A. Text happy path

`/ → Szöveg → /app text mode → paste short Italian text → confirm source → mock learning skeleton`

### B. Audio-file happy path

`/ → Hangfájl → local fixture → waveform → <=30s selection → confirm selection → source confirmation`

No file contents should be sent to server in Milestone 2.

### C. Long selection

Attempt >30s → UI prevents/adjusts selection and explains limit.

### D. Accessibility

Keyboard user can:

- switch input mode;
- select file;
- adjust audio range with accessible controls;
- play selection;
- continue;
- edit text.

### E. Existing Auth

Milestone 1 auth/session/library skeleton remains functional.

## Later STT E2E

- microphone permission granted;
- permission denied;
- STT candidate returned;
- user edits transcript;
- no analysis starts before confirmation;
- raw clip deletion path executes.

## Legal/privacy tests

Automated where practical:

- full local audio file is not posted by Input Studio;
- endpoint rejects duration above configured max;
- endpoint rejects oversized payload;
- source text max enforced server-side;
- user A cannot access user B learning sessions;
- raw audio path is absent/null after successful processing;
- public unauthenticated source-content access denied.

## Build gate

Every milestone:

- lint;
- typecheck;
- unit/component tests;
- E2E;
- production build;
- `git diff --check`;
- runtime console check.
