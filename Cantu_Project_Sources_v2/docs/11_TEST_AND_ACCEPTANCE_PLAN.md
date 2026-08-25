# 11 — Test & Acceptance Plan

## Unit tests

- recognition response normalization;
- canonical track deduplication;
- language validation rules;
- lesson schema validation;
- rights capability filtering;
- progress calculations;
- input size/type validation.

## Integration tests

Mock external providers and verify:

1. microphone clip → candidate;
2. candidate confirm → canonical song;
3. candidate reject → no lyrics/AI call;
4. no-match → retry/manual states;
5. confirmed song → lyrics → lesson;
6. provider timeout → recoverable error;
7. duplicate confirmed song → cache reuse.

## E2E scenarios

### A — Listen success

- tap Listen;
- microphone permission granted;
- mocked audio recorded;
- candidate appears;
- confirm;
- lesson becomes ready;
- complete Quick Understand.

### B — Wrong recognition

- candidate appears;
- press `Nem ez`;
- no lesson generation starts;
- retry/manual search visible.

### C — Microphone denied

- no broken UI;
- explain permission requirement;
- Upload/manual route available.

### D — Non-Italian track

- identify and confirm correctly;
- lyrics validation says non-Italian;
- explain that v1 teaches Italian only;
- do not generate misleading Italian lesson.

### E — Rights-limited lyrics

- full lyrics display disabled;
- permitted educational lesson still renders correctly.

## Milestone 0 acceptance

Before backend work begins:

- existing visual identity preserved;
- brand changed to Cantu;
- responsive landing works;
- true `/app` route exists;
- Listen and Upload entry UI exists as mock states;
- no real provider integration yet;
- tests/build/lint pass.
