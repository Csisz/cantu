import { z } from "zod";

export const LEARNING_ANALYSIS_SCHEMA_VERSION = "learning-analysis-v1" as const;
export const LEARNING_ANALYSIS_PROMPT_VERSION = "cantu-analysis-v1" as const;
export const DEFAULT_LANGUAGE_ANALYSIS_MODEL = "gpt-5.6-terra" as const;
export const DEFAULT_ANALYSIS_REASONING_EFFORT = "low" as const;
export const MAX_ANALYSIS_ATTEMPTS_PER_HOUR = 10;

export const verifiedSourceStatusSchema = z.enum([
  "text_direct",
  "user_verified",
  "user_edited",
]);

export const verifiedLearningSourceSchema = z
  .object({
    text: z.string().trim().min(1).max(2_000),
    sourceStatus: verifiedSourceStatusSchema,
    sourceLanguage: z.literal("it").default("it"),
    explanationLanguage: z.literal("hu").default("hu"),
  })
  .strict();

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

export const learningAnalysisSchema = z
  .object({
    schemaVersion: z.literal(LEARNING_ANALYSIS_SCHEMA_VERSION),
    analysisStatus: z.enum(["ready", "not_italian", "insufficient_source"]),
    sourceLanguage: z.literal("it"),
    explanationLanguage: z.literal("hu"),
    languageAssessment: z
      .object({
        detectedLanguage: z.string().trim().min(2).max(32).nullable(),
        confidence: z.enum(["high", "medium", "low", "unknown"]),
        noteHu: boundedText(400).nullable(),
      })
      .strict(),
    meaning: z
      .object({
        naturalHu: boundedText(1_000),
        literalStructureHu: boundedText(800).nullable(),
        toneHu: boundedText(400).nullable(),
      })
      .strict()
      .nullable(),
    chunks: z
      .array(
        z
          .object({
            sourceText: boundedText(300),
            meaningHu: boundedText(500),
            kind: z.enum(["word", "phrase", "idiom", "construction"]),
            baseForm: boundedText(200).nullable(),
            register: z
              .enum(["neutral", "formal", "colloquial", "slang", "poetic"])
              .nullable(),
            contextNoteHu: boundedText(500).nullable(),
          })
          .strict(),
      )
      .max(6),
    grammar: z
      .array(
        z
          .object({
            titleHu: boundedText(160),
            explanationHu: boundedText(800),
          })
          .strict(),
      )
      .max(2),
    pronunciation: z
      .object({
        focus: z.array(boundedText(120)).min(1).max(3),
        noteHu: boundedText(500),
      })
      .strict()
      .nullable(),
    transfer: z
      .array(
        z
          .object({
            italian: boundedText(400),
            meaningHu: boundedText(500),
          })
          .strict(),
      )
      .max(3),
    recall: z
      .array(
        z
          .object({
            id: z.string().trim().regex(/^[a-z0-9_-]{1,64}$/),
            type: z.enum([
              "meaning_choice",
              "chunk_choice",
              "context_choice",
              "fill_chunk",
            ]),
            promptHu: boundedText(500),
            options: z
              .array(
                z
                  .object({
                    id: z.string().trim().regex(/^[a-z0-9_-]{1,64}$/),
                    text: boundedText(300),
                  })
                  .strict(),
              )
              .max(4),
            correctOptionId: z.string().trim().regex(/^[a-z0-9_-]{1,64}$/).nullable(),
            correctText: boundedText(300).nullable(),
            explanationHu: boundedText(600),
          })
          .strict(),
      )
      .max(4),
    warnings: z
      .array(
        z
          .object({
            code: z.string().trim().regex(/^[a-z0-9_-]{1,64}$/),
            messageHu: boundedText(500),
          })
          .strict(),
      )
      .max(6),
  })
  .strict();

export type VerifiedSourceStatus = z.infer<typeof verifiedSourceStatusSchema>;
export type VerifiedLearningSource = z.infer<typeof verifiedLearningSourceSchema>;
export type LearningAnalysis = z.infer<typeof learningAnalysisSchema>;

const nullableString = (maximum: number) => ({
  type: ["string", "null"],
  minLength: 1,
  maxLength: maximum,
});

const objectSchema = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const learningAnalysisJsonSchema = objectSchema({
  schemaVersion: { type: "string", const: LEARNING_ANALYSIS_SCHEMA_VERSION },
  analysisStatus: {
    type: "string",
    enum: ["ready", "not_italian", "insufficient_source"],
  },
  sourceLanguage: { type: "string", const: "it" },
  explanationLanguage: { type: "string", const: "hu" },
  languageAssessment: objectSchema({
    detectedLanguage: nullableString(32),
    confidence: { type: "string", enum: ["high", "medium", "low", "unknown"] },
    noteHu: nullableString(400),
  }),
  meaning: {
    anyOf: [
      objectSchema({
        naturalHu: { type: "string", minLength: 1, maxLength: 1_000 },
        literalStructureHu: nullableString(800),
        toneHu: nullableString(400),
      }),
      { type: "null" },
    ],
  },
  chunks: {
    type: "array",
    maxItems: 6,
    items: objectSchema({
      sourceText: { type: "string", minLength: 1, maxLength: 300 },
      meaningHu: { type: "string", minLength: 1, maxLength: 500 },
      kind: { type: "string", enum: ["word", "phrase", "idiom", "construction"] },
      baseForm: nullableString(200),
      register: {
        type: ["string", "null"],
        enum: ["neutral", "formal", "colloquial", "slang", "poetic", null],
      },
      contextNoteHu: nullableString(500),
    }),
  },
  grammar: {
    type: "array",
    maxItems: 2,
    items: objectSchema({
      titleHu: { type: "string", minLength: 1, maxLength: 160 },
      explanationHu: { type: "string", minLength: 1, maxLength: 800 },
    }),
  },
  pronunciation: {
    anyOf: [
      objectSchema({
        focus: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: { type: "string", minLength: 1, maxLength: 120 },
        },
        noteHu: { type: "string", minLength: 1, maxLength: 500 },
      }),
      { type: "null" },
    ],
  },
  transfer: {
    type: "array",
    maxItems: 3,
    items: objectSchema({
      italian: { type: "string", minLength: 1, maxLength: 400 },
      meaningHu: { type: "string", minLength: 1, maxLength: 500 },
    }),
  },
  recall: {
    type: "array",
    maxItems: 4,
    items: objectSchema({
      id: { type: "string", pattern: "^[a-z0-9_-]{1,64}$" },
      type: {
        type: "string",
        enum: ["meaning_choice", "chunk_choice", "context_choice", "fill_chunk"],
      },
      promptHu: { type: "string", minLength: 1, maxLength: 500 },
      options: {
        type: "array",
        maxItems: 4,
        items: objectSchema({
          id: { type: "string", pattern: "^[a-z0-9_-]{1,64}$" },
          text: { type: "string", minLength: 1, maxLength: 300 },
        }),
      },
      correctOptionId: nullableString(64),
      correctText: nullableString(300),
      explanationHu: { type: "string", minLength: 1, maxLength: 600 },
    }),
  },
  warnings: {
    type: "array",
    maxItems: 6,
    items: objectSchema({
      code: { type: "string", pattern: "^[a-z0-9_-]{1,64}$" },
      messageHu: { type: "string", minLength: 1, maxLength: 500 },
    }),
  },
});
