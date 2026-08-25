# Cantu — Project Source Pack v2

> **Mission:** help Hungarian speakers understand and learn Italian through songs they already love.

This pack is intended to be uploaded as project context and copied into the Cantu repository. It is written for both human product decisions and coding agents such as Codex.

## What changed in v2

The product now treats song acquisition as a first-class capability instead of assuming users own MP3 files.

Cantu supports three song-entry concepts:

1. **Listen & identify** — Shazam-like recognition from a short microphone recording.
2. **Upload audio** — MP3/M4A/WAV upload for users who have a local file.
3. **Link/import later** — resolve Spotify/YouTube links to track identity and metadata without downloading protected audio.

Every entry method converges into the same canonical song record, user confirmation step, lyrics pipeline and lesson-generation pipeline.

## Read first

1. `AGENTS.md` — hard constraints for coding agents.
2. `docs/00_PRODUCT_BRIEF.md` — product definition.
3. `docs/01_MVP_SCOPE.md` — exact v1 boundaries.
4. `docs/02_LEARNING_EXPERIENCE.md` — learner flow.
5. `docs/03_SONG_INGEST_AND_RECOGNITION.md` — upload + Shazam-like recognition.
6. `docs/04_AI_AND_LYRICS_PIPELINE.md` — canonical lyrics and AI processing.
7. `docs/05_TECHNICAL_ARCHITECTURE.md` — proposed architecture.
8. `docs/09_EXISTING_SITE_REVIEW.md` — review of the supplied landing page.
9. `docs/12_IMPLEMENTATION_ROADMAP.md` — incremental Codex plan.
10. `prompts/CHAT_STARTER_FIRST_CODEX_PROMPT.md` — paste this into a new ChatGPT project conversation to request the first Codex CLI prompt.

## Core product principle

The first success is **not memorizing the whole song**. The first success is:

> “I understand what this song is about, I recognize its chorus, and I learned a few useful Italian expressions from it.”

The learner can then choose to continue toward complete line-by-line understanding.
