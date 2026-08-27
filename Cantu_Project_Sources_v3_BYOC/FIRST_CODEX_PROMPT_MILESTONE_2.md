# Cantu — Milestone 2 Codex CLI Prompt

You are continuing implementation of **Cantu**.

The product has intentionally pivoted from a song/lyrics-centric app to a **Bring Your Own Content Italian-learning experience**.

The new product helps Hungarian speakers understand and learn from short real-world Italian audio or text they encounter themselves.

## Authoritative documentation

The new source pack `Cantu_Project_Sources_v3_BYOC` supersedes older v2 song/lyrics documentation whenever they conflict.

Read before editing:

- root `AGENTS.md`;
- `Cantu_Project_Sources_v3_BYOC/README.md`;
- `Cantu_Project_Sources_v3_BYOC/AGENTS.md`;
- `docs/00_PRODUCT_BRIEF.md`;
- `docs/01_MVP_SCOPE.md`;
- `docs/02_LEARNING_EXPERIENCE.md`;
- `docs/03_INPUT_STUDIO_AUDIO_TEXT.md`;
- `docs/05_TECHNICAL_ARCHITECTURE.md`;
- `docs/07_UI_UX_DESIGN_SYSTEM.md`;
- `docs/08_COPYRIGHT_PRIVACY_AND_RIGHTS.md`;
- `docs/09_EXISTING_SITE_AND_PIVOT_REVIEW.md`;
- `docs/11_TEST_AND_ACCEPTANCE_PLAN.md`;
- `docs/12_IMPLEMENTATION_ROADMAP.md`;
- `docs/16_AUDIO_WAVEFORM_AND_CLIP_SPEC.md`;
- `docs/20_MIGRATION_FROM_SONG_PRODUCT.md`;
- `MILESTONE_2_TARGET.md`.

Paths above are relative to the v3 source-pack directory unless noted otherwise.

# TASK

Implement **Milestone 2 — Product Pivot & Local Input Studio** completely.

Do not implement later milestones.

The goal is to transform the active Cantu UI from:

`Listen/Upload song → identify song candidate → confirm song`

into:

`Listen / Audio file / Text → select exact source → confirm source/transcript → future learning flow`

while preserving the current Cantu visual identity, robot, responsive quality, accessibility, Auth/Supabase foundation, and verified test discipline.

---

# 0. OPERATING MODE

Work autonomously.

Before editing:

1. run `pwd`;
2. run `git status --short --branch`;
3. inspect the repository structure;
4. inspect the current `/`, `/app`, auth, Supabase, tests and current recognition flow;
5. identify all pre-existing modified/untracked files;
6. preserve those changes;
7. read root `AGENTS.md` and v3 docs;
8. inspect installed Next.js 16 documentation when framework-specific APIs matter;
9. determine the smallest coherent migration plan;
10. proceed without waiting for approval.

Do not reset, checkout-away, delete, overwrite or silently discard existing user/Milestone 1 work.

If the working tree is dirty because Milestone 1 is still uncommitted, implement Milestone 2 **on top of it** and clearly distinguish pre-existing vs new changes in the final report where possible.

Only stop for a genuine blocker such as repository corruption or an irreconcilable destructive conflict.

Do not commit or push.

---

# 1. HARD PRODUCT BOUNDARY

Cantu v1:

- teaches Italian;
- explains in Hungarian;
- uses user-provided short audio/text;
- is private by default;
- is not a copyrighted-content catalogue.

New product promise:

**Hallgasd. Olvasd. Értsd meg. Mondd ki.**

Primary positioning:

**Értsd meg az olaszt, amivel találkozol.**

Do not add a generic language selector.

---

# 2. PRESERVE EXISTING FOUNDATION

Do not regress:

- Next.js 16 App Router;
- strict TypeScript;
- existing Cantu robot/visual design;
- landing animation/motion quality;
- accessibility;
- reduced motion;
- responsive layouts;
- Supabase client/server boundaries;
- authentication;
- RLS/migrations;
- account/library shell;
- deterministic Vitest/Playwright configuration.

Milestone 2 is a product/UI/input architecture migration, not a rewrite from scratch.

---

# 3. LANDING PAGE PIVOT

Update `/` from favourite-song/recognition messaging to the new product.

Keep the same visual spirit and narrative structure.

## Required hero direction

Headline:

**Értsd meg az olaszt, amivel találkozol.**

Promise:

**Hallgasd. Olvasd. Értsd meg. Mondd ki.**

Supporting concept:

A short sentence from a video, message, conversation, audio clip or text can become a compact Italian lesson.

## Primary entry actions

Provide three clear actions:

- `🎧 Hallgasd`
- `🎵 Hangfájl`
- `📝 Szöveg`

Route into `/app` with clear mode state, for example:

- `/app?mode=listen`
- `/app?mode=audio`
- `/app?mode=text`

Equivalent clean routing is acceptable.

## Remove/rewrite active song-specific product claims

Runtime user-facing copy should no longer promise:

- song identification;
- favourite-song lyrics learning;
- song candidate confirmation;
- full-song lesson generation;
- lyrics retrieval.

The visual design may remain musical.

Do not delete archived historical documentation merely because it contains old terminology.

---

# 4. UPDATE THE LANDING STORY

Rewrite explanatory sections around the new loop.

A recommended 3-step story:

1. **Hozd azt, amit nem értesz**
2. **Ellenőrizd, mit hallott vagy olvasott a Cantu**
3. **Értsd meg, jegyezd meg, mondd ki**

Keep copy concise and product-like.

Avoid enterprise/process language.

---

# 5. `/app` — INPUT STUDIO

Turn the active application home into the **Cantu Input Studio**.

Three first-class modes:

1. Listen
2. Audio file
3. Text

The app should feel like one coherent tool, not three separate mini-products.

Use a shared state/domain model where appropriate.

A conceptual state model may include:

```ts
type InputMode = "listen" | "audio" | "text";

type InputStudioState =
  | { status: "entry"; mode: InputMode }
  | { status: "audio_ready"; ... }
  | { status: "source_selected"; ... }
  | { status: "source_confirmation"; ... }
  | { status: "learning_preview"; ... }
  | { status: "error"; ... };
```

Adapt to the existing code rather than forcing this exact type.

---

# 6. LISTEN MODE

Milestone 2 does **not** require real STT or AI.

Prefer the smallest safe implementation:

- preserve/adapt the existing attentive/listening visual;
- present explicit future microphone action;
- if current mock flow can be cleanly adapted, keep microphone capture mocked in this milestone;
- do not call `getUserMedia` unless the v3 milestone target explicitly requires it — it does not;
- do not call MediaRecorder;
- do not make a network request;
- replace “song recognition” semantics with “short speech/source capture” semantics.

Suggested copy:

- `Vegyél fel egy rövid olasz részletet`
- `Legfeljebb 30 másodperc`

Provide privacy microcopy:

- recording starts only after explicit user action;
- only the selected/recorded short part will later be processed.

No claim that 30 seconds is legally safe.

---

# 7. AUDIO FILE MODE — CORE MILESTONE 2 FEATURE

This is the most important new interaction.

## User flow

1. choose a local audio file;
2. inspect/decode it locally;
3. display waveform;
4. select a range;
5. show start/end/duration;
6. enforce maximum 30-second selection;
7. preview selected region locally;
8. continue to source-confirmation screen.

## Critical privacy/legal architecture

**Do not upload the complete file.**

Milestone 2 must make no network request containing the selected file or clip.

The complete file stays in the browser.

Do not add Supabase Storage.

Do not create an API endpoint for audio yet.

## Supported input

Use a semantic file input with an appropriate audio accept list.

Target at least:

- MP3;
- WAV;
- M4A where browser decoding supports it.

Handle unsupported decode errors gracefully.

## Object URL cleanup

Release browser object URLs/audio resources when they are replaced or the component unmounts.

Avoid obvious memory leaks.

---

# 8. WAVEFORM

Create a real local waveform representation from the user's selected file.

Do not use a fake static waveform once a valid file is loaded.

The implementation may use:

- Web Audio API;
- a small well-maintained library if truly justified;
- canvas or SVG;
- another lightweight local rendering strategy.

Prefer avoiding a heavy dependency if the waveform/selection can be implemented maintainably without one.

Do not send data to an external waveform service.

## Performance

Do not store every raw PCM sample in React state.

Downsample to practical peaks.

Avoid blocking the main thread unnecessarily for normal files.

If very large files need future optimisation, report it rather than over-engineering now.

---

# 9. AUDIO RANGE SELECTION

Implement an accessible range-selection model.

Invariant:

```text
0 <= start < end <= audio duration
end - start <= 30 seconds
```

Show:

- start timestamp;
- end timestamp;
- selected duration;
- clear max-30s guidance.

## Pointer interaction

Provide an intuitive selected-region overlay/handles where practical.

## Keyboard accessibility

Do not make the waveform the only way to change the selection.

Provide semantic controls for:

- `Kezdőpont`
- `Végpont`

Use range/slider controls or another accessible equivalent.

Arrow-key operation must work.

Expose current time as readable value text.

## Behaviour when exceeding maximum

Prevent or clamp invalid >30s selection deterministically.

Do not allow UI state to temporarily become invalid and rely only on a later error.

---

# 10. LOCAL SELECTION PLAYBACK

Allow user to preview the selected audio portion.

Controls:

- play selected part;
- pause/stop;
- replay.

Playback should begin at selection start and stop at selection end.

Do not autoplay when a file is chosen.

Do not play beyond the selected region when using the selection-preview action.

Clean up timers/listeners.

---

# 11. AUDIO PRIVACY MICROCOPY

Show concise product copy near the file workflow:

**A teljes fájl a készülékeden marad.**

And a short explanation that only the selected short excerpt will be processed once real processing is introduced.

Also include:

**Csak olyan tartalmat használj, amelyet jogosult vagy feldolgozni.**

Do not write legal guarantees.

Do not turn the UI into a wall of legal text.

---

# 12. TEXT MODE

Implement a first-class text input flow.

Requirements:

- large semantic textarea;
- Hungarian label/instructions;
- initial hard limit: 2,000 characters;
- live character count;
- server is not involved in Milestone 2;
- no AI call;
- no storage merely from typing;
- submit/continue disabled for empty/invalid input;
- whitespace normalized sensibly without silently rewriting wording.

Suggested button:

**Ezt értsük meg**

Do not use copyrighted song lyrics as default/sample content.

Use short original/generic Italian sample placeholder text if a placeholder is useful.

---

# 13. SOURCE CONFIRMATION

All modes should converge toward a new confirmation concept.

## Audio

Because real STT is not implemented yet, do not fabricate a realistic copyrighted transcript.

For Milestone 2, confirmation may show:

- selected audio metadata/time range;
- a clearly labelled future transcript placeholder/state;
- copy explaining that the next milestone will transcribe this selected segment.

Alternatively, a deterministic original test phrase may be used only in test/demo fixtures, clearly labelled mock.

Do not present it as if it came from the user's audio.

## Text

Show:

**Ezt fogjuk elemezni**

and the exact submitted text.

Actions:

- confirm/continue;
- edit/back.

## Replace old semantics

Remove active UI labels such as:

- `Szerintem ezt a dalt hallottam`
- song artwork/title/artist candidate as the core confirmation object;
- `Igen, ez az` where it refers to a song identity.

The future audio transcript confirmation wording should be:

- `Ezt hallottam`
- `Igen, pontos`
- `Javítom`

but real transcript editing belongs to the STT milestone.

---

# 14. LEARNING PREVIEW SKELETON

After local source confirmation, show a visually useful preview of the future learning path without calling AI.

Possible sections:

- `Mit jelent?`
- `Ezt érdemes megjegyezni`
- `Miért így mondják?`
- `Mondd ki te is`
- `Emlékszel?`

Important:

- this is a structural preview, not fake AI output;
- use clearly labelled placeholder/coming-next content;
- for text mode it is acceptable to display the user's own submitted text, but do not invent translation/chunks as if generated;
- do not create a fake production lesson.

The purpose is to establish the new information architecture and UX.

---

# 15. ACCOUNT / LIBRARY PIVOT

Preserve Milestone 1 authentication and Supabase functionality.

The current library may still be song-oriented.

For Milestone 2, update only user-facing naming necessary to avoid product contradiction.

Recommended visible concept:

- `Saját tanulásaim`
- or `Elmentett kifejezéseim`

Do not perform the full database migration away from song tables yet. That belongs to Milestone 3.

If data-access DTOs remain song-shaped underneath temporarily, isolate that legacy naming and do not spread it further.

Do not drop existing database tables in this milestone.

---

# 16. LEGAL-BY-DESIGN CONSTRAINTS

Treat these as hard engineering requirements:

- no lyrics scraping;
- no song/lyrics provider;
- no protected-media downloading;
- no public user source content;
- no searchable copyrighted-source catalogue;
- no automatic segmentation of an entire work;
- no “next 30 seconds” batch/reconstruction workflow;
- no statement that <=30s is legally safe;
- full selected audio file remains local in Milestone 2;
- no raw audio network call;
- no raw audio persistence;
- no text persistence during local Input Studio merely because Supabase exists.

Do not add a checkbox claiming to transfer all legal liability to the user.

Small source-rights/privacy microcopy is appropriate; full Terms implementation is later.

---

# 17. NETWORK-REQUEST GUARANTEE FOR MILESTONE 2

Local Input Studio interactions must not send user audio/text source bytes to any API.

Authentication/Supabase requests may continue where already required by Milestone 1.

Tests should distinguish normal Auth/session traffic from source-content transmission.

For the audio-file flow specifically, prove in tests where practical that no fetch/request containing the selected file occurs.

---

# 18. COMPONENT ARCHITECTURE

Do not build one giant Input Studio component.

A reasonable architecture might contain concepts such as:

```text
components/cantu-app/
  InputStudio.tsx
  InputModeTabs.tsx
  listen/
    ListenInput.tsx
  audio/
    AudioFileInput.tsx
    Waveform.tsx
    AudioRangeSelector.tsx
    AudioPreviewControls.tsx
  text/
    TextInput.tsx
  SourceConfirmation.tsx
  LearningPreview.tsx
```

and domain code such as:

```text
lib/input/
  types.ts
  audio-selection.ts
  waveform.ts
```

This is illustrative, not mandatory.

Use the structure that best fits the existing repository.

---

# 19. REMOVE DEAD SONG-RECOGNITION RUNTIME CODE CAREFULLY

Inspect which old mock recognition components are now unused.

You may delete or replace runtime components that are clearly obsolete **only if**:

- no current route/test depends on them;
- the replacement is complete;
- historical prototype/source docs remain untouched;
- Milestone 1 code is not accidentally removed.

Prefer a clean pivot rather than leaving two contradictory active product flows.

Do not remove legacy database migration/table definitions in this milestone.

---

# 20. TEST MIGRATION

The previous E2E suite tests a song candidate flow. Update it to the new product semantics.

Do not simply delete coverage.

## Required unit tests

At minimum:

1. audio selection duration never exceeds 30s;
2. selection clamps to source duration;
3. start/end cannot invert;
4. text limit is 2,000 characters;
5. relevant state transitions work.

## Component tests

At minimum:

1. Listen mode renders;
2. Audio file mode renders;
3. Text mode renders;
4. text input can continue to exact source confirmation;
5. empty text cannot continue;
6. long text is rejected/clamped according to chosen UX;
7. audio selection UI shows start/end/duration;
8. selected range cannot exceed 30s;
9. local preview controls are accessible;
10. no source network request is made in local/mock flow.

## Audio fixtures

Use a tiny legally safe generated/test audio fixture.

Do not add commercial music or copyrighted recordings to the repository.

You may generate a simple tone/test waveform programmatically as a fixture.

## E2E

Cover all configured desktop/tablet/mobile projects where the current suite does so.

### Text happy path

```text
landing
→ Szöveg
→ /app text mode
→ enter short Italian text
→ Ezt értsük meg
→ source confirmation
→ confirm
→ learning preview skeleton
```

Use an original generic Italian test phrase.

### Audio-file happy path

```text
/app?mode=audio
→ choose generated fixture
→ waveform visible
→ select <=30s
→ preview/continue
→ source confirmation
```

### Max duration

Attempt a range >30 seconds and assert valid bounded state.

### Auth regression

Preserve existing deterministic auth/library/signout E2E coverage.

---

# 21. ACCESSIBILITY

At minimum:

- input mode controls keyboard accessible;
- semantic file input/label;
- semantic textarea label;
- waveform has text/slider controls;
- start/end range controls expose accessible labels and values;
- preview buttons are real buttons;
- focus is visible;
- errors/status via appropriate live region;
- no mouse-only drag requirement;
- reduced-motion behaviour remains intact.

---

# 22. RESPONSIVE REQUIREMENTS

Manually or via Playwright verify approximately:

- 375px mobile;
- 768px tablet;
- 1366px desktop.

Requirements:

- no horizontal overflow;
- waveform usable on mobile;
- range values readable;
- three modes understandable without tiny controls;
- text area comfortable on mobile;
- landing retains visual impact.

---

# 23. PERFORMANCE

- do not eagerly decode media before a file is selected;
- downsample waveform data;
- release object URLs/resources;
- avoid unnecessary rerenders while scrubbing;
- do not add a large audio dependency without justification;
- preserve lazy media behaviour on landing.

---

# 24. README / DOCUMENTATION

Update the repository README to reflect the v3 product direction and current Milestone 2 behaviour.

Clearly say:

- audio-file processing is currently local-only;
- real STT/AI is not yet implemented;
- full files are not uploaded by Input Studio;
- text analysis is UI-only/mock until later milestone;
- v3 source pack supersedes old song-centric docs.

Do not rewrite source-pack legal text into unsupported legal conclusions.

Preserve root `AGENTS.md` Cantu rules.

If root `AGENTS.md` does not yet contain the v3 product rules because the new pack was only added separately, append/update carefully without destroying the Next.js-generated block.

---

# 25. FORBIDDEN IN THIS MILESTONE

Do NOT implement:

- real speech-to-text;
- OpenAI or another LLM analysis call;
- real microphone MediaRecorder capture unless separately required — it is not;
- audio source upload API;
- Supabase Storage for audio;
- lyrics provider;
- AudD/ACRCloud/ShazamKit;
- protected-media download;
- database migration away from song tables;
- pronunciation scoring;
- billing;
- public sharing.

---

# 26. ACCEPTANCE CRITERIA

## Product pivot

- [ ] `/` clearly presents the new Cantu BYOC language-learning promise.
- [ ] Runtime product no longer presents song recognition as the primary product.
- [ ] Hero has Listen / Audio file / Text entry actions.
- [ ] New 3-step story reflects Bring → Verify → Learn.
- [ ] Cantu visual identity is preserved.

## Input Studio

- [ ] `/app` supports Listen mode.
- [ ] `/app` supports Audio file mode.
- [ ] `/app` supports Text mode.
- [ ] modes share coherent styling/state architecture.

## Audio file

- [ ] local semantic file input exists.
- [ ] real waveform derives locally from chosen test/user audio.
- [ ] full file is not uploaded.
- [ ] start/end selection exists.
- [ ] duration is visible.
- [ ] selection cannot exceed 30 seconds.
- [ ] range cannot invert or exceed file duration.
- [ ] selection can be adjusted without mouse-only dragging.
- [ ] selected region can be previewed locally.
- [ ] object URL/resources cleaned up.
- [ ] unsupported input produces recoverable error.

## Text

- [ ] text mode is first-class.
- [ ] 2,000-character max enforced.
- [ ] live character count exists.
- [ ] empty input cannot continue.
- [ ] exact user text appears in confirmation.
- [ ] no text AI/network analysis occurs.

## Confirmation

- [ ] source confirmation replaces song-candidate semantics.
- [ ] text flow can edit/back.
- [ ] audio flow identifies selected time range clearly.
- [ ] no fake transcript is presented as real STT output.

## Learning preview

- [ ] future learning sequence is visible structurally.
- [ ] no fake AI translation/lesson is presented as generated truth.

## Legal/privacy architecture

- [ ] no lyrics scraping/provider.
- [ ] no music recognition provider.
- [ ] no protected-media download.
- [ ] no source-content public sharing.
- [ ] no audio source network upload.
- [ ] full local audio remains client-side.
- [ ] rights/privacy microcopy exists.
- [ ] UI does not claim a 30-second legal safe harbour.

## Milestone 1 regression

- [ ] Supabase/Auth foundation still compiles.
- [ ] sign-in/sign-out/session behaviour tests remain.
- [ ] existing DB/RLS files are not destructively removed.
- [ ] account/library shell remains usable with updated visible terminology where needed.

## Quality

- [ ] strict TypeScript passes.
- [ ] lint passes.
- [ ] unit/component tests pass.
- [ ] E2E passes across configured projects.
- [ ] build passes.
- [ ] runtime console has no unexpected errors.
- [ ] responsive checks pass.
- [ ] `git diff --check` passes.

Do not check an item unless verified.

---

# 27. REQUIRED VERIFICATION

Run the repository's actual commands.

At minimum:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
git diff --check
```

If Milestone 1 database scripts are available and your changes touched Supabase/database files, run relevant local DB checks too.

If you did not touch DB schema, do not perform destructive unnecessary database work merely for ceremony.

Run a production/dev runtime smoke test for:

- `/`
- `/app?mode=listen`
- `/app?mode=audio`
- `/app?mode=text`

Check desktop/mobile and console errors.

---

# 28. SOURCE/SECRET/NETWORK REVIEW

Before finishing:

Search runtime code for stale active concepts:

- `LyricLingo`
- `Szerintem ezt a dalt`
- `AUDD`
- `ACRCLOUD`
- `lyrics`

Interpret docs/legacy files separately from runtime code.

Also confirm:

- no new secrets;
- `.env*` safety preserved;
- no source audio upload endpoint;
- no provider API call;
- no user source in generic analytics/logging.

---

# 29. FINAL DIFF REVIEW

Run:

```bash
git status --short --branch
git diff --check
```

Inspect final diff.

Ensure:

- no unrelated files changed;
- no commercial audio fixture added;
- generated fixture is safe;
- no build/test artifacts tracked;
- no Milestone 1 work accidentally removed;
- no source pack accidentally rewritten beyond necessary root docs.

Do not commit or push.

---

# 30. FINAL REPORT FORMAT

Return exactly this structure:

```markdown
# Milestone 2 — Product Pivot & Input Studio Report

## 1. Repository inspection
- initial git status
- pre-existing changes preserved
- relevant architecture reviewed
- v3 documentation reviewed

## 2. Product pivot implemented
- landing changes
- runtime terminology removed/replaced
- new input model

## 3. Input Studio
### Listen
- behaviour
- what remains mocked

### Audio file
- local file handling
- waveform implementation
- selection model
- max-duration handling
- local preview
- resource cleanup

### Text
- input/limit
- confirmation

## 4. Legal/privacy-by-design implementation
- full-file local handling
- network behaviour
- source-rights microcopy
- no-safe-harbour wording
- prohibited integrations confirmed absent

## 5. Architecture decisions
- components
- domain/state model
- why chosen waveform approach
- how next STT milestone can connect without redesign

## 6. Milestone 1 regression status
- Supabase/Auth
- account/library
- database files/RLS

## 7. Changed files
- `path` — purpose

## 8. Tests added/updated
- unit
- component
- E2E
- test fixture provenance

## 9. Verification executed
- `<exact command>` — PASS/FAIL

Include install/lint/typecheck/test/e2e/build/diff-check.

## 10. Runtime/manual verification
- `/`
- `/app?mode=listen`
- `/app?mode=audio`
- `/app?mode=text`
- mobile/tablet/desktop
- console errors
- network behaviour for local source content

## 11. Acceptance criteria
- [x] ...
- [ ] ... — explanation

## 12. Explicitly deferred
Confirm NOT implemented:
- real microphone recording
- STT provider
- LLM analysis
- audio upload/storage
- generalized DB migration
- pronunciation scoring
- public sharing
- billing

## 13. Remaining issues
`None`
or concrete items.

## 14. Final git status
Exact output summary.

## 15. Milestone status
**Milestone 2: COMPLETE**
or
**Milestone 2: INCOMPLETE**
```

Do not propose or implement Milestone 3 in the same task.

Start now by inspecting the repository and preserving the existing work, then implement the entire Milestone 2 autonomously.
