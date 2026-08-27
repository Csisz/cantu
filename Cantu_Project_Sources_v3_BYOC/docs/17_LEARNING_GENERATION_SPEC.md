# 17 — Learning Generation Specification

## Input

- verified Italian source text;
- source provenance/status (`text_direct`, `user_verified`, `user_edited`);
- explanation language = Hungarian;
- optional learner level later;
- optional transcription uncertainty metadata;
- no requirement to retain original audio.

## Output goal

Produce the smallest useful learning object that helps the learner understand and reuse the input.

## 1. Meaning

### `naturalMeaningHu`

1–3 natural Hungarian sentences preserving intent/tone.

### `literalStructureHu`

Optional. Use only if it clarifies how the Italian expression is built.

Do not confuse literal gloss with the preferred translation.

## 2. Chunks

Select **3–6** useful items when the source contains enough material.

Each item:

- Italian chunk;
- Hungarian meaning in this context;
- type (`word`, `phrase`, `idiom`, `construction`);
- base form if useful;
- register (`neutral`, `formal`, `colloquial`, `slang`, `poetic`) when relevant;
- short context note;
- source occurrence reference.

Prioritise:

- reusable multi-word chunks;
- common conversational constructions;
- emotionally/semantically central language;
- grammar that unlocks meaning.

Avoid:

- filling quota with names/filler;
- obscure one-off words unless central;
- dictionary-style lists detached from context.

## 3. Grammar / “Miért így mondják?”

Maximum **1–2** notes.

Good topics:

- omitted subject;
- pronoun/clitic;
- verb + preposition;
- contracted preposition/article;
- tense/mood essential to meaning;
- word order;
- fixed construction.

Do not turn the session into a grammar chapter.

## 4. Tone / register

If relevant, explain whether the wording is:

- everyday;
- polite;
- formal;
- emotional;
- slang;
- poetic/nonstandard.

Do not present lyric/poetic language as ordinary standard Italian.

## 5. Pronunciation focus

Choose at most 1–3 useful pronunciation/listening observations.

Examples:

- connected speech;
- doubled consonant;
- stress;
- elision;
- a chunk learners may fail to hear as separate words.

Do not claim phonetic certainty beyond available information.

## 6. Transfer examples

Generate **1–3 original examples** using the same useful pattern in a different everyday context.

These are generated teaching examples, not quotations from the source.

Label them clearly as examples.

## 7. Recall

Generate **2–4** deterministic questions.

Mix:

- natural meaning;
- chunk recognition;
- use-context selection;
- fill-the-chunk;
- transfer understanding.

Avoid trivial questions that only test remembering the UI wording.

## 8. Warnings

Structured warnings can include:

- uncertain source;
- mixed language;
- slang/profanity;
- nonstandard grammar;
- ambiguous interpretation;
- insufficient text.

## Quality rules

- every quoted source chunk must actually occur in the verified source;
- no invented source lines;
- no continuation/completion of a copyrighted source beyond user input;
- no request to the model to identify and output the rest of a song/movie/book;
- Hungarian must be natural;
- explanation should be beginner-friendly without becoming inaccurate;
- uncertainty must be visible.

## Pedagogical signature

Every good Cantu result should answer:

1. **Mit jelent?**
2. **Mit érdemes ebből megjegyezni?**
3. **Miért pont így mondják?**
4. **Tudod használni máshol is?**
5. **Emlékszel rá aktívan?**
