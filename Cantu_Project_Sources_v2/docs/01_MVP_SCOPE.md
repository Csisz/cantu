# 01 — MVP Scope

## MVP goal

Prove that a Hungarian-speaking learner can take an Italian song, identify/confirm it and complete a useful AI-generated lesson.

## In scope

### Song entry

- **Listen** with browser microphone: record a short snippet and identify the track.
- **Upload** local audio file.
- Manual fallback search/edit of title and artist if identification fails.
- Confirmation screen before processing.

### Language

- Italian input songs only.
- Hungarian explanations and UI.
- Detect/validate likely Italian lyrics before lesson generation.

### Learning

- song summary;
- chorus-focused first lesson;
- 8–12 key words/expressions;
- selected key lines with Hungarian explanation;
- 1–2 contextual grammar notes;
- 5-question quiz;
- Deep Dive entry point.

### Product foundations

- authentication or controlled trial;
- saved songs/lessons;
- progress state;
- responsive web UI;
- usage/cost limits;
- provider adapters.

## Explicitly not required for first usable release

- native iOS/Android app;
- direct ShazamKit integration;
- full Spotify playback SDK;
- YouTube audio downloading;
- automatic support for every language;
- social features;
- teacher/classroom management;
- speech-scoring/pronunciation AI;
- gamification economy with leagues/coins;
- fully synchronized karaoke for every track;
- billing before the core loop is validated.

## Later but architecturally anticipated

- paste Spotify/YouTube/Apple Music link;
- desktop tab-audio capture where browser APIs permit;
- multiple recognition providers and fallback routing;
- English, German, French and more;
- automatic source-language selection;
- native mobile microphone recognition using platform SDKs;
- spaced repetition across songs;
- playlists and learning paths.

## MVP success criteria

A test user can complete this without developer intervention:

1. press Listen;
2. allow microphone;
3. play an Italian song nearby;
4. receive a plausible track candidate;
5. confirm it;
6. receive a lesson;
7. finish Quick Understand;
8. accurately explain the song's topic and recognize several taught expressions.
