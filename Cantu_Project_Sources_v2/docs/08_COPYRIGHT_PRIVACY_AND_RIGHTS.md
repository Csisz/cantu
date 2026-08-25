# 08 — Copyright, Privacy & Rights

> Product/engineering risk notes, not legal advice.

## Separate the rights questions

Do not treat “we can technically obtain lyrics” as equivalent to “we can display/translate them to users”. Track independently:

1. music/audio possession and processing;
2. song identification metadata;
3. lyrics retrieval;
4. lyrics display;
5. synchronization/timed lyrics;
6. translation/adaptation display;
7. AI analysis of text;
8. retention/caching.

## Public product rule

Do not rely on unauthorized lyrics scraping. Use a licensed/approved source and contractually supported product behavior.

## Full translation

Full Hungarian translation of an entire copyrighted lyric can create additional rights issues. Architect it as a capability flag, not a hard dependency.

The educational experience should work with:

- a Hungarian summary;
- permitted snippets/key lines;
- vocabulary/grammar explanations;
- progressive section explanations.

## Recognition audio

A 10-second microphone snippet can contain voices or environmental audio. Minimize privacy risk:

- explicit microphone action;
- clear visual recording indicator;
- brief capture window;
- transport encryption;
- temporary processing;
- deletion after recognition;
- no ambient recordings in analytics/logs;
- document retention behavior in privacy policy.

## Uploaded audio

Treat as private user content. Use private storage, signed access and retention/deletion controls.

## Spotify/YouTube

Do not implement protected-media download/ripping. Future link import should use official/permitted metadata interfaces and user-provided URLs as identity hints.

## Provider compliance layer

Persist rights/capabilities with each lyrics result and build the UI from those flags. This allows Cantu to change vendors or territory behavior without rewriting lesson logic.
