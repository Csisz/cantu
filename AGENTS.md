<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Cantu Coding Rules v3

These rules apply to all coding agents working on Cantu.

## 1. Product boundary

Cantu v1 helps **Hungarian speakers learn Italian from short user-provided real-world audio and text**. Keep schemas extensible, but do not build a generic multi-language platform before the Italian → Hungarian experience works end-to-end.

The `Cantu_Project_Sources_v3_BYOC` source pack supersedes older song/lyrics-centric documentation whenever the two conflict.

## 2. Core outcome

A successful first session is:

1. user chooses **Listen**, **Audio file** or **Text**;
2. user brings a short piece of Italian they want to understand;
3. audio-file selection and waveform work locally in the browser;
4. Cantu shows exactly what source or transcript will be analysed;
5. the user verifies or edits it;
6. Cantu explains the natural Hungarian meaning;
7. Cantu extracts a few useful Italian chunks and one relevant language insight;
8. the learner says or recalls something actively;
9. useful derived learning items may be saved without requiring permanent storage of the complete source.

## 3. Input and providers are independent

Never couple UI or domain models directly to one speech-to-text, language-analysis or pronunciation vendor.

Use interfaces/adapters such as:

- `SpeechToTextProvider`
- `LanguageAnalysisProvider`
- `PronunciationProvider` (later)

Persist provider-specific raw payloads only in diagnostic/private fields when needed.

## 4. Confirmation before teaching

Speech-to-text output is a candidate transcription, not unquestionable truth. Always provide a user confirmation/edit step before learning generation.

Required states:

- source selection;
- transcription candidate for audio;
- user confirmation/edit;
- learning generation only after confirmation.

## 5. Legal-by-design source rules

Do not implement stream ripping, protected-media downloading, DRM bypassing, lyrics/content scraping, public source catalogues or bulk reconstruction flows. Do not claim that a numeric excerpt duration is automatically lawful.

## 6. Local and private inputs

For audio-file mode, prefer:

- complete file stays client-side;
- waveform and range selection happen locally;
- only the selected short clip may leave the browser in a later processing milestone;
- raw audio is transient and never placed in generic analytics or a default archive.

Text input is first-class, private by default and initially limited to 2,000 characters. Do not persist source text merely because Supabase exists.

## 7. Privacy for Listen mode

Microphone audio should be short-lived. By default:

- capture only the minimum useful snippet;
- send only the selected short clip for the requested processing;
- do not store the raw ambient recording after recognition unless explicitly required and disclosed;
- log metadata, not ambient audio;
- never begin recording without a clear user action and browser permission.

## 8. Learning and cost guardrails

Teach, do not merely translate: natural meaning first, then a few reusable chunks, at most one or two contextual grammar/register insights, and a small active-recall step. Do not call learning generation before the source/transcript is confirmed. Apply idempotency and usage limits to paid external APIs.

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
- E2E tests for the local text and audio-file input flows and Auth regression.
- Accessibility: keyboard navigation, focus states, semantic controls, reduced-motion handling.

## 11. Implementation discipline

Follow `Cantu_Project_Sources_v3_BYOC/docs/12_IMPLEMENTATION_ROADMAP.md`. Do not jump ahead into later milestones unless explicitly asked.

Every Codex task should:

1. inspect the repository first;
2. summarize the intended changes;
3. implement only the requested milestone;
4. run relevant tests/build/lint;
5. report changed files, checks and remaining issues;
6. never silently replace the existing visual direction.
