import { z } from "zod";

export const pronunciationObservationCodeSchema = z.enum([
  "all_words_recognized",
  "some_words_missing",
  "extra_words",
  "word_order_difference",
  "recording_too_short",
  "recording_too_long",
  "no_speech_detected",
  "transcription_uncertain",
]);

export const pronunciationFeedbackSchema = z
  .object({
    understoodText: z.string().trim().min(1).max(2_000).nullable(),
    targetMatch: z.object({
      matchedTokens: z.array(z.string().trim().min(1).max(100)).max(40),
      missingTokens: z.array(z.string().trim().min(1).max(100)).max(40),
      extraTokens: z.array(z.string().trim().min(1).max(100)).max(40),
      orderCorrect: z.boolean(),
    }).strict(),
    timing: z.object({
      learnerDurationMs: z.number().int().min(1).max(12_000),
      referenceDurationMs: z.number().int().min(1).max(30_000).optional(),
    }).strict(),
    observations: z.array(z.object({
      code: pronunciationObservationCodeSchema,
      messageHu: z.string().trim().min(1).max(300),
    }).strict()).min(1).max(6),
  })
  .strict();

export type PronunciationFeedback = z.infer<typeof pronunciationFeedbackSchema>;

export type PronunciationFeedbackInput = {
  audio: Uint8Array;
  mimeType: string;
  targetText: string;
  sourceLanguage: "it";
  learnerDurationMs: number;
  referenceDurationMs?: number;
  signal?: AbortSignal;
};

export interface PronunciationFeedbackProvider {
  readonly name: string;
  evaluate(input: PronunciationFeedbackInput): Promise<PronunciationFeedback>;
}

export type PronunciationFeedbackErrorCode =
  | "unauthenticated"
  | "invalid_recording"
  | "unsupported_format"
  | "too_large"
  | "too_long"
  | "session_not_found"
  | "feedback_rate_limited"
  | "quota_exceeded"
  | "feedback_not_configured"
  | "feedback_timeout"
  | "feedback_failed"
  | "no_speech_detected";

export class PronunciationFeedbackError extends Error {
  constructor(
    public readonly code: PronunciationFeedbackErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "PronunciationFeedbackError";
  }
}
