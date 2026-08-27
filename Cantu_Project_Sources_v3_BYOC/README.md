# Cantu — Project Source Pack v3 (Bring Your Own Content)

> **Mission:** help Hungarian speakers understand and actively learn Italian from short real-world audio and text they encounter themselves.

This pack supersedes the song/lyrics-centric v2 product direction when the two conflict. The existing Cantu codebase remains valuable: the visual identity, Next.js foundation, Supabase/Auth work, mock Listen/Upload flow, accessibility, and tests are retained and evolved.

## Product pivot

Cantu is no longer defined as a lyrics catalogue or song-identification service. It becomes a **private, user-initiated language decoding and learning tool**.

Primary inputs:

1. **Listen** — record a short audio excerpt with an explicit microphone action.
2. **Audio file** — open a local audio file, view its waveform locally, and select a maximum 30-second excerpt for processing.
3. **Text** — paste or type a short Italian passage.

All inputs converge into the same learning loop:

`input → verify → understand → notice → say → recall → optionally save learning items`

## Core legal-by-design principle

Cantu must not become a public copyrighted-content catalogue.

- user supplies the source material;
- processing is private to that user;
- full uploaded audio stays in the browser where technically feasible;
- only the user-selected short audio clip is sent for processing;
- raw audio is transient and deleted promptly after processing;
- text/audio originals are not publicly shared or indexed;
- Cantu does not scrape lyrics or fetch full copyrighted lyrics from third-party sites;
- there is no claim that “30 seconds” or any numeric limit is automatically copyright-safe;
- limits exist for product, privacy, cost, and risk reduction, not as a legal safe harbour;
- public commercial launch requires a targeted Hungarian/EU legal review of the actual production flow and Terms/Privacy implementation.

## Read first

1. `AGENTS.md`
2. `docs/00_PRODUCT_BRIEF.md`
3. `docs/01_MVP_SCOPE.md`
4. `docs/02_LEARNING_EXPERIENCE.md`
5. `docs/03_INPUT_STUDIO_AUDIO_TEXT.md`
6. `docs/04_AI_LANGUAGE_PIPELINE.md`
7. `docs/05_TECHNICAL_ARCHITECTURE.md`
8. `docs/08_COPYRIGHT_PRIVACY_AND_RIGHTS.md`
9. `docs/12_IMPLEMENTATION_ROADMAP.md`
10. `docs/16_AUDIO_WAVEFORM_AND_CLIP_SPEC.md`
11. `docs/17_LEARNING_GENERATION_SPEC.md`
12. `docs/19_LEGAL_BY_DESIGN_CHECKLIST.md`
13. `MILESTONE_2_TARGET.md`
14. `prompts/FIRST_CODEX_PROMPT_MILESTONE_2.md`

## Existing implementation state assumed by this pack

- Milestone 0: Next.js/TypeScript visual migration — complete.
- Milestone 1: Supabase/Auth/RLS foundation — implemented and locally verified; cloud deployment may still need configuration.
- Next implementation target: **Milestone 2 — Product pivot & local Input Studio**.

## Product promise

> **Hallgasd. Olvasd. Értsd meg. Mondd ki.**

The first success is not “translate everything.” The first success is:

> “I understood this real Italian phrase, I noticed how it works, and I can use or say something from it myself.”
