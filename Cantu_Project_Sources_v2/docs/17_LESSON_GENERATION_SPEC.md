# 17 — Lesson Generation Specification

## Input

- confirmed canonical song metadata;
- Italian lyrics material permitted for analysis;
- rights/capability flags;
- optional section/timing metadata;
- learner language = Hungarian;
- target CEFR level optional; default beginner-friendly mixed explanation for MVP.

## Output goals

The model selects **pedagogically useful** content, not merely the most frequent words.

### Song Snapshot

- `summaryHu`: 2–4 natural Hungarian sentences;
- `themes`: 1–4 labels;
- `toneHu`;
- `listenFor`: 3 short expressions.

### Quick Understand

#### Chorus

- concise Hungarian meaning;
- 2–4 learning points;
- poetic/idiomatic warning where relevant.

#### Vocabulary

8–12 items with:

- Italian word/chunk;
- Hungarian meaning;
- base form when helpful;
- part of speech/phrase type;
- short contextual note;
- occurrence reference, not invented example.

Prioritize:

- repeated phrases;
- useful everyday chunks;
- emotionally central expressions;
- understandable grammar wins.

Avoid filling the list with names, filler sounds or opaque one-off words unless central.

#### Key lines

3–5 lines/snippets permitted by rights with:

- contextual Hungarian explanation;
- optional literal gloss;
- phrase breakdown;
- ambiguity note.

#### Grammar

1–2 notes only. Examples:

- omitted subject;
- conjugated verb/base form;
- preposition/article combination;
- pronoun/clitic;
- tense/mood relevant to meaning.

#### Quiz

Exactly 5 MVP questions covering a mix of:

- phrase meaning;
- line comprehension;
- word recognition;
- context/theme.

Every item must have deterministic answer metadata.

## Deep Dive plan

Return an ordered section plan even if full section content is generated lazily later.

## Safety/quality

- never invent canonical lyrics;
- flag uncertain interpretation;
- explain slang and profanity neutrally;
- do not sanitize away meaning if it is relevant to comprehension;
- do not overteach grammatically nonstandard lyric wording as standard Italian.
