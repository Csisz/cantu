# 03 — Input Studio: Audio + Text

## Goal

Make source selection feel intentional, private and controllable.

## Input modes

### A. Listen

Future production flow:

1. user taps record;
2. browser requests microphone permission;
3. capture starts visibly;
4. stop automatically at maximum duration;
5. captured clip is available locally for review;
6. user confirms clip;
7. clip is sent transiently to STT;
8. transcript returned;
9. clip deleted after processing according to retention policy.

No background recording.

### B. Audio file

Preferred architecture:

1. user chooses a local supported file;
2. browser creates local object URL / decodes audio locally;
3. waveform is generated locally;
4. entire file stays on device;
5. user selects a time range;
6. range cannot exceed 30 seconds;
7. user previews selection;
8. browser extracts only selected clip;
9. only extracted clip may be transmitted.

Do not send the full file to a server solely because it is convenient.

### Supported initial formats

Target common browser-decodable formats such as:

- MP3;
- M4A/AAC where browser support permits;
- WAV;
- other formats only after compatibility testing.

Fail gracefully when decoding is unsupported.

### C. Text

Initial flow:

1. user types/pastes a short Italian passage;
2. client enforces 2,000-character initial limit;
3. user sees exact content to be analysed;
4. no public upload/indexing;
5. request goes only to the private processing pipeline.

## Unified source model

UI/domain code should use a provider-independent input abstraction:

```ts
export type LearningInput =
  | { kind: "microphone"; localClip: Blob; durationMs: number }
  | { kind: "audio_file"; localClip: Blob; durationMs: number; sourceName?: string }
  | { kind: "text"; text: string };
```

Do not persist browser `Blob` objects in database models.

## Source confirmation

No learning generation before the user knows what is being analysed.

For audio:

`audio clip → transcript candidate → user confirm/edit → analysis`

For text:

`text → exact preview → user confirm → analysis`

## Abuse / reconstruction guardrail

Cantu must not provide a convenience workflow designed to reconstruct long protected works through sequential excerpts.

Potential production safeguards:

- per-request duration/character limits;
- rate limits;
- repeated interval detection for the same local-file fingerprint where proportionate;
- no automatic “next 30 seconds” bulk operation;
- no batch transcription of a complete song/movie/book;
- Terms prohibiting infringing/bulk reconstruction use.

A source fingerprint should be treated as user-linked metadata and retained only when justified.
