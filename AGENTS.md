<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Cantu Coding Rules

These rules apply to all coding agents working on Cantu.

## 1. Product boundary

Cantu v1 teaches **Italian to Hungarian speakers**. Keep schemas extensible, but do not build a generic multi-language platform before the Italian → Hungarian experience works end-to-end.

## 2. Core outcome

A successful first session is:

1. user opens Cantu;
2. user chooses **Listen** or **Upload**;
3. Cantu identifies the track or extracts metadata;
4. Cantu shows a confirmation card: title, artist, artwork and source links when available;
5. user confirms “Igen, ez az”;
6. Cantu validates that the learning language is Italian;
7. Cantu obtains canonical lyrics through an approved/licensed source;
8. Cantu generates a Hungarian song summary and progressive lesson;
9. user completes **Quick Understand**: chorus + key words + key lines + short quiz;
10. user may continue into **Deep Dive** for broader or full-song understanding.

## 3. Song entry is provider-independent

Never couple UI or domain models directly to AudD, ACRCloud, ShazamKit, Musixmatch or any single vendor.

Use interfaces/adapters such as:

- `MusicRecognitionProvider`
- `LyricsProvider`
- `TranscriptionProvider`
- `LessonGenerationProvider`

Persist provider-specific raw payloads only in diagnostic/private fields when needed.

## 4. Recognition is not confirmation

A recognition match is a **candidate**, not the final track. Always provide a user confirmation step before lyrics retrieval or expensive AI work.

Required states:

- listening / recording
- identifying
- candidate found
- user confirmed
- user rejected
- no match
- retry / manual search

## 5. Do not download Spotify or YouTube audio

Do not implement stream ripping, protected-media downloading, DRM bypassing, or scraping that violates platform terms. Spotify/YouTube links may later be used to resolve identity/metadata through permitted APIs or provider metadata.

## 6. Copyright-aware lyrics architecture

Do not make public product behavior depend on scraping lyrics websites. Prefer licensed/approved lyrics providers. Separate:

- canonical lyrics retrieval;
- display rights;
- translation rights;
- AI linguistic analysis;
- time alignment.

The app must be able to disable full-lyrics or full-translation display per provider/territory/plan without breaking the lesson.

## 7. Privacy for Listen mode

Microphone audio used for recognition should be short-lived. By default:

- capture only the minimum useful snippet;
- send it only for recognition;
- do not store the raw ambient recording after recognition unless explicitly required and disclosed;
- log metadata, not ambient audio;
- never begin recording without a clear user action and browser permission.

## 8. Cost guardrails

Do not call transcription or large-language-model generation before the song is confirmed. Cache canonical song results and lessons when rights and product policy allow. Apply idempotency and usage limits to paid external APIs.

## 9. UX rules

Cantu should feel musical, youthful, warm and intelligent — not like an enterprise dashboard.

- mobile-first;
- one obvious next action per learning card;
- short steps;
- progress always visible;
- robot character used as guide, not decoration everywhere;
- learning screen calmer than the animated marketing landing page;
- avoid copying Duolingo visual identity or assets.

## 10. Engineering rules

- TypeScript strict mode.
- Server-side secrets only.
- Schema validation for all external provider responses.
- Structured AI outputs validated before persistence.
- Migrations checked into source control.
- Unit tests for domain logic and provider adapters.
- Integration tests for ingestion state transitions.
- E2E test for at least one complete mocked Italian song flow.
- Accessibility: keyboard navigation, focus states, semantic controls, reduced-motion handling.

## 11. Implementation discipline

Follow `docs/12_IMPLEMENTATION_ROADMAP.md`. Do not jump ahead by implementing AI, billing or recognition during Milestone 0 unless explicitly asked.

Every Codex task should:

1. inspect the repository first;
2. summarize the intended changes;
3. implement only the requested milestone;
4. run relevant tests/build/lint;
5. report changed files, checks and remaining issues;
6. never silently replace the existing visual direction.

