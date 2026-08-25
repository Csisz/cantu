# 03 — Song Ingest & Music Recognition

## Why this is core

Most users no longer own local MP3 collections. They hear music through Spotify, YouTube, radio, TV, social media and speakers. Requiring a file would create unnecessary friction.

Cantu therefore treats **song identity** as the product input, not “uploaded MP3”.

## Entry methods

### A. Listen & identify — MVP

Browser flow:

1. user taps `Hallgasd meg`;
2. browser requests microphone permission;
3. capture a short clip using `MediaRecorder`;
4. stop automatically after a configurable window (initial target: ~10–12 seconds);
5. send the clip to the Cantu backend;
6. backend calls `MusicRecognitionProvider`;
7. normalize the candidate;
8. show candidate to user;
9. user confirms/rejects.

### B. File upload — MVP

Use local MP3/M4A/WAV as an alternate source. The file can support:

- metadata extraction;
- recognition if metadata is missing or unreliable;
- later transcription/alignment where permitted.

### C. Paste a streaming link — later

Allow a Spotify/YouTube/Apple Music URL as a convenient identity source.

Important: this feature resolves **metadata/identity** through permitted interfaces. It must not download protected streams or bypass platform restrictions.

### D. Tab/system audio — later experiment

On compatible desktop browsers, `getDisplayMedia` may allow the user to intentionally share a browser tab/system source including audio. Treat this as a separate optional UX because browser support, permissions and device behavior vary.

## Provider abstraction

```ts
export interface MusicRecognitionProvider {
  recognize(input: RecognitionInput): Promise<RecognitionResult>;
}

export type RecognitionInput = {
  bytes: Uint8Array;
  mimeType: string;
  durationMs?: number;
};

export type RecognitionCandidate = {
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
  artworkUrl?: string;
  isrc?: string;
  providerTrackIds?: Record<string, string>;
  externalUrls?: Record<string, string>;
  matchTimecodeMs?: number;
  confidence?: number;
};
```

Never leak vendor response shapes into UI/domain code.

## Initial provider recommendation

### First web spike: AudD

Reasons:

- specifically exposes “Shazam-like” standard recognition;
- accepts uploaded files/Blobs;
- returns normalized title/artist/album/timecode;
- can return Spotify and Apple Music metadata;
- official Node/browser-friendly SDK documentation exists.

### Alternative: ACRCloud

Evaluate if we need:

- better match quality in our target catalogue;
- richer candidate/score behavior;
- commercial terms that fit scale;
- specialized microphone recognition workflows.

### Future native: ShazamKit

ShazamKit is a strong option for a native mobile Cantu application and uses acoustic signatures against the Shazam catalog. It should not be a dependency of the initial browser architecture.

## User validation is mandatory

The candidate page is part of the correctness model.

Buttons:

- `Igen, ez az`
- `Nem ez`
- `Újra meghallgatom`
- `Keresés kézzel`

If the user rejects the result, discard the candidate and do not start lyrics/AI work.

## No-match behavior

Do not show a dead end.

Offer:

1. retry closer to the speaker;
2. use a part with clear vocals/music;
3. upload a file;
4. manually type title + artist.

## Same-device caveat

If a user listens through headphones on the same device, the microphone may not hear the stream. Therefore Listen mode should explain briefly:

> “Játssz le kb. 10 másodpercet hangszórón, vagy tölts fel egy fájlt.”

Later, link import or explicit tab-audio capture can solve this case more elegantly.

## Privacy

Default recognition recordings are ephemeral:

- no long-term raw recording storage;
- delete temp object immediately after recognition processing;
- do not use ambient clips for model training;
- no background microphone access;
- visual recording indicator while capture is active.

Persist only what we need:

- recognition status;
- normalized candidate;
- provider name;
- response latency/error class;
- optional non-sensitive diagnostic identifiers.

## Cost optimization

Order operations from cheapest to most expensive:

`capture → recognition → user confirmation → lyrics → language validation → lesson generation → optional transcription/alignment`

Do not transcribe a random ambient clip into a full-song lesson before a confirmed identity exists.
