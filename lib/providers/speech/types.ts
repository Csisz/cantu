import { z } from "zod";

export const transcriptResultSchema = z
  .object({
    text: z.string().trim().min(1).max(2_000),
    detectedLanguage: z.string().trim().min(2).max(16).optional(),
    warnings: z.array(z.string().trim().min(1).max(200)).max(5).optional(),
  })
  .strict();

export type TranscriptResult = z.infer<typeof transcriptResultSchema>;

export type SpeechToTextInput = {
  bytes: Uint8Array;
  mimeType: string;
  durationMs?: number;
  languageHint?: "it";
  signal?: AbortSignal;
};

export interface SpeechToTextProvider {
  readonly name: string;
  transcribe(input: SpeechToTextInput): Promise<TranscriptResult>;
}

export type TranscriptionErrorCode =
  | "invalid_audio"
  | "too_large"
  | "too_long"
  | "unsupported_format"
  | "transcription_failed"
  | "provider_unavailable"
  | "rate_limited"
  | "not_configured"
  | "unauthenticated";

export class TranscriptionError extends Error {
  constructor(
    public readonly code: TranscriptionErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "TranscriptionError";
  }
}
