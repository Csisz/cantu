# 04 — AI Language Pipeline

## Goal

Turn a verified short Italian input into a compact, structured Hungarian learning object.

## Pipeline

```text
User-selected input
        ↓
Input validation
        ↓
Audio? → speech-to-text
        ↓
Transcript candidate
        ↓
User verifies/edits source text
        ↓
Italian-language validation
        ↓
Structured learning analysis
        ↓
Quality + safety validation
        ↓
Learner-safe result
        ↓
Optional save of derived learning items
```

## Verification boundary

For audio, do not treat STT as canonical truth.

The verified text becomes the source-of-truth for the lesson request.

Record whether text is:

- `stt_unverified`;
- `user_verified`;
- `user_edited`;
- `text_direct`.

## AI role

AI may produce:

- natural Hungarian meaning;
- literal structure support;
- useful phrase/chunk selection;
- contextual grammar notes;
- idiom/register/slang explanation;
- pronunciation/listening hints;
- original transfer examples;
- micro-recall questions.

## AI must not

- invent source words and present them as transcript;
- silently correct a user's source into something materially different;
- claim a poetic/slang usage is universal standard Italian;
- reconstruct missing parts of a copyrighted work;
- produce a full work merely because the user supplied a fragment;
- reuse private source input for unrelated generation/training flows.

## Structured output

Use a validated schema, not free-form prose as system-of-record.

Conceptual shape:

```ts
interface LearningAnalysis {
  sourceLanguage: "it";
  explanationLanguage: "hu";
  sourceStatus: "text_direct" | "user_verified" | "user_edited";
  meaning: {
    naturalHu: string;
    literalStructureHu?: string;
    toneHu?: string;
  };
  chunks: Array<{
    italian: string;
    meaningHu: string;
    kind: "word" | "phrase" | "idiom" | "construction";
    register?: "neutral" | "formal" | "colloquial" | "slang" | "poetic";
    contextNoteHu?: string;
  }>;
  grammar: Array<{
    titleHu: string;
    explanationHu: string;
  }>;
  pronunciation?: {
    focus: string[];
    noteHu: string;
  };
  transfer: Array<{
    italian: string;
    meaningHu: string;
  }>;
  recall: RecallItem[];
  warnings: string[];
}
```

## Source-light persistence

Prefer storing:

- verified source hash/fingerprint;
- source type;
- derived learning object;
- user-saved phrases;
- progress.

Do not permanently store raw audio by default.

Do not permanently store full source text by default unless the user explicitly chooses a product feature that requires it and the legal/privacy basis is reviewed.

## Provider abstraction

```ts
interface SpeechToTextProvider {
  transcribe(input: AudioClipInput): Promise<TranscriptResult>;
}

interface LanguageAnalysisProvider {
  analyze(input: VerifiedLearningSource): Promise<LearningAnalysis>;
}
```

Provider-specific raw responses should not leak into UI/domain models.

## Quality validation

Before presenting analysis:

- source likely Italian;
- natural Hungarian meaning is coherent;
- selected chunks actually occur in verified source;
- no invented quotation is presented as source;
- grammar notes are relevant and limited;
- transfer examples are clearly generated examples, not source quotations;
- recall answers are deterministic;
- uncertainty is surfaced.
