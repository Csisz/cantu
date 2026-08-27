# AGENTS.md — Cantu Coding Rules v3

These rules apply to coding agents working on the current Cantu direction. When this file conflicts with the older v2 song/lyrics documents, this v3 pack wins.

## 1. Product boundary

Cantu v1 helps **Hungarian speakers learn Italian from short user-provided real-world audio and text**.

Primary input modes:

- explicit microphone capture;
- local audio file + local waveform selection;
- pasted/typed text.

Do not rebuild Cantu as a lyrics catalogue, song database, karaoke service, translator clone, or generic multi-language platform.

## 2. Core learning outcome

A successful session is:

1. user brings a short piece of Italian they want to understand;
2. Cantu confirms what text will be analysed;
3. Cantu explains the natural Hungarian meaning;
4. Cantu extracts a few useful Italian chunks;
5. Cantu explains only the most relevant grammar/register nuance;
6. the learner says or recalls something actively;
7. useful learning items may be saved without requiring permanent storage of the complete source input.

## 3. Confirmation before teaching

Speech-to-text output is a candidate transcription, not unquestionable truth.

For audio:

`capture/select → transcribe → user verifies/edits transcript → learning generation`

Do not generate a confident lesson from an unverified low-confidence transcript.

## 4. Legal-by-design rules

- Do not scrape lyrics or copyrighted text sites.
- Do not build a server-side catalogue of copyrighted songs, lyrics, movie scripts, subtitles, books, articles, or social posts.
- Do not advertise a numeric copyright safe harbour such as “30 seconds is legal.” No such general rule should be assumed.
- For audio-file mode, keep the complete file client-side where technically feasible and upload/process only the user-selected excerpt.
- Initial selected audio processing window: maximum 30 seconds, configurable downward.
- Do not automatically split a long protected work into repeated chunks to reconstruct it.
- Do not provide bulk extraction/reconstruction workflows for copyrighted works.
- Inputs and results are private by default; no public user-content feeds, sharing, indexing, or searchable source catalogue in MVP.
- Users must be told to submit only material they are entitled to process.
- Raw audio should be transient and deleted promptly after processing.
- Source text should not be retained by default longer than needed to produce the requested learning result.
- Before public paid launch, require targeted legal review of copyright, Terms, privacy, processor contracts, notice/takedown handling, and retention.

## 5. Privacy rules

- No background microphone access.
- Recording begins only after explicit user action and browser permission.
- Show a clear recording indicator and timer.
- Do not use uploaded voices for identity, biometric recognition, emotion inference, or unrelated profiling.
- Do not send raw audio/text to analytics.
- Minimise third-party processing and retention.
- Do not train Cantu models on private user content unless a separate explicit lawful product flow is later designed and reviewed.

## 6. Audio-file rule

The preferred architecture is:

`local file → browser waveform → local selection → local clip extraction → only selected clip leaves browser`

Do not upload the full file simply because Supabase Storage exists.

## 7. Text-input rule

Text input is first-class. The MVP is for short passages, messages, captions, sentences, or excerpts — not bulk document ingestion.

Initial alpha limit: **2,000 characters** per analysis request, configurable.

The limit is a product/risk control, not a legal conclusion.

## 8. Learning quality rules

Cantu must teach, not merely translate.

Every generated learning object should distinguish:

- natural Hungarian meaning;
- optional literal structure where pedagogically useful;
- useful Italian chunks;
- register/idiom/slang notes;
- one or two contextual grammar insights at most;
- active recall or production.

Prefer reusable chunks over dictionary dumps.

Do not fabricate source text. Clearly mark uncertainty.

## 9. Provider independence

Keep external providers behind replaceable interfaces such as:

- `SpeechToTextProvider`
- `LanguageAnalysisProvider`
- `PronunciationProvider` (later)

Do not leak vendor response shapes into React components or database domain models.

## 10. Current milestone discipline

Milestones 0 and 1 are already implemented.

The next target is `MILESTONE_2_TARGET.md`: product pivot + local Input Studio.

Milestone 2 must not add real STT, LLM generation, pronunciation scoring, or server upload of audio. It should establish the new UX and client-side selection architecture first.

## 11. Engineering rules

- Next.js 16 App Router.
- TypeScript strict mode.
- Server-only secrets.
- Schema validation at trust boundaries.
- Database migrations checked into source control.
- RLS for private user data.
- Unit tests for domain logic.
- Integration/E2E tests for critical state transitions.
- Accessibility: semantic controls, keyboard support, visible focus, reduced motion, screen-reader status.
- Mobile-first.

## 12. Existing visual direction

Preserve Cantu's musical, youthful, warm visual identity and robot character. The pivot is a product change, not an excuse for a generic dashboard redesign.

The application should be calmer than the marketing landing page.

## 13. Agent workflow

Every Codex task should:

1. inspect repository and `git status` first;
2. read root `AGENTS.md` and relevant v3 docs;
3. preserve pre-existing user changes;
4. implement only the requested milestone;
5. run lint, typecheck, unit tests, E2E tests, and build;
6. report exact changed files and commands;
7. explicitly list deferred later-milestone work;
8. stop only for a genuine blocker.
