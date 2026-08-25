# 04 — AI & Lyrics Pipeline

## Goal

Turn a confirmed canonical track into a safe, structured Italian → Hungarian learning object.

## Pipeline

```text
Confirmed Song Identity
        ↓
Canonical metadata / IDs
        ↓
Approved Lyrics Provider
        ↓
Rights + display capability check
        ↓
Lyrics normalization / section detection
        ↓
Italian-language validation
        ↓
Optional transcription/alignment layer
        ↓
Structured lesson generation
        ↓
Validation + quality checks
        ↓
Persist lesson version
```

## Canonical identity

Store stable identifiers when available:

- ISRC;
- title + main artist;
- provider IDs (Spotify/Apple/etc.);
- release/album metadata.

Matching lyrics should prefer stable IDs over fuzzy title strings.

## Lyrics source

Prefer a licensed/approved lyrics provider. Musixmatch is a candidate because it offers lyrics/catalog/synchronization products, but Cantu must keep the interface replaceable.

```ts
interface LyricsProvider {
  findLyrics(song: CanonicalSong): Promise<LyricsResult>;
}
```

`LyricsResult` must include capability flags such as:

- `mayDisplayFullLyrics`
- `mayDisplaySnippets`
- `mayDisplayTranslation`
- `hasLineTiming`
- `territory`

Do not infer legal rights purely from whether an API technically returns text.

## AI role

AI should perform pedagogical analysis, not act as the canonical source of copyrighted lyrics.

AI can produce:

- Hungarian summary;
- themes/tone;
- vocabulary selection;
- phrase explanations;
- grammar notes;
- ambiguity/idiom notes;
- quiz questions;
- progressive lesson sequencing.

## Structured output

Generate a validated schema, never unstructured prose as the system-of-record.

At minimum:

```ts
interface GeneratedLesson {
  songSummaryHu: string;
  themes: string[];
  quickUnderstand: {
    chorusExplanationHu: string;
    vocabulary: VocabularyItem[];
    keyLines: KeyLine[];
    grammarNotes: GrammarNote[];
    quiz: QuizItem[];
  };
  deepDivePlan: SectionPlan[];
  warnings: string[];
}
```

## Translation strategy

The pedagogical model distinguishes:

- `meaningExplanationHu` — natural Hungarian explanation;
- `literalGlossHu` — optional, local phrase-level support;
- `fullTranslation` — separate right/capability-controlled feature.

Cantu must still be useful even if full translation is disabled.

## Transcription and alignment

Transcription is optional and should serve:

- verifying unclear lyrics;
- timing sections/lines;
- karaoke/highlight experiences;
- uploaded independent music when rights permit.

Do not use transcription to intentionally reproduce/licence-bypass a complete protected lyrics catalog.

## Quality validation

Before publishing a lesson:

- lyrics likely Italian;
- no hallucinated lines presented as canonical lyrics;
- selected vocabulary actually occurs in the permitted source material;
- answer keys deterministic;
- Hungarian text grammatically coherent;
- offensive/slur terms labeled contextually when present;
- poetic/slang usage not presented as universal standard Italian.
