# 16 — Audio Waveform & Clip Selection Specification

## Goal

Give users precise control over **which short part** of a local audio source Cantu will process, without uploading the complete file.

## Core UX

```text
Local file
  ↓
Waveform appears
  ↓
User drags selection handles
  ↓
Start / end / duration shown
  ↓
Preview selected region
  ↓
Ezt a részt értsük meg
```

## Initial constraints

- maximum selection duration: 30,000 ms;
- minimum useful duration target: ~1,000 ms, UX-adjustable;
- full source duration may be arbitrary within browser/memory safety limits;
- server never trusts client duration when real processing is added.

## Local-only requirement

Milestone 2:

- read file with browser APIs only;
- create object URL locally;
- decode enough data to display waveform;
- no network request containing file bytes;
- no Supabase Storage upload.

## Waveform data

Use downsampled peak/amplitude data suitable for rendering. Do not keep millions of raw samples in React state.

Potential model:

```ts
interface WaveformData {
  durationMs: number;
  peaks: number[];
}
```

## Selection model

```ts
interface AudioSelection {
  startMs: number;
  endMs: number;
}
```

Invariant:

```text
0 <= startMs < endMs <= durationMs
endMs - startMs <= 30_000
```

## Drag behaviour

When user drags start/end handle:

- clamp to file boundaries;
- prevent inverted range;
- prevent duration > max;
- prefer moving the active handle rather than unexpectedly moving the opposite boundary;
- provide precise text timestamps.

## Keyboard accessibility

Waveform handles must have semantic slider equivalents.

Suggested:

- left/right arrows: small step;
- Shift + arrows: larger step;
- accessible labels `Kezdőpont` / `Végpont`;
- expose value text as timestamp;
- selection duration announced when it changes meaningfully.

The waveform canvas/SVG cannot be the only control.

## Playback

- preview from `startMs`;
- stop at `endMs`;
- replay selection;
- pause/cancel;
- do not autoplay unexpectedly.

## Clip extraction — later processing milestone

When real STT is introduced:

- extract/re-encode only selected region;
- use a broadly supported format accepted by chosen STT provider;
- validate actual server payload size and duration;
- discard temporary server clip promptly.

## Unsupported/large file behaviour

- show a clear Hungarian error;
- do not freeze the UI;
- release object URLs/audio buffers when leaving flow;
- consider progressive waveform strategies later if very large files cause memory issues.

## Legal/privacy copy

Suggested microcopy:

> A teljes fájl a készülékeden marad. Csak a kijelölt rövid részletet dolgozza fel a Cantu, amikor továbblépsz.

And:

> Csak olyan tartalmat használj, amelyet jogosult vagy feldolgozni.

Do not say:

> “30 másodperc alatt minden felhasználás jogszerű.”
