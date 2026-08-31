import "server-only";

import { buildTransparentPronunciationFeedback } from "@/lib/pronunciation/comparison";
import {
  PronunciationFeedbackError,
  pronunciationFeedbackSchema,
  type PronunciationFeedbackInput,
  type PronunciationFeedbackProvider,
} from "@/lib/pronunciation/types";
import { TranscriptionError, type SpeechToTextProvider } from "../speech/types";

function mapTranscriptionError(error: unknown) {
  if (!(error instanceof TranscriptionError)) return new PronunciationFeedbackError("feedback_failed");
  if (error.code === "rate_limited") return new PronunciationFeedbackError("feedback_rate_limited");
  if (error.code === "not_configured") return new PronunciationFeedbackError("feedback_not_configured");
  if (error.code === "provider_unavailable") {
    return new PronunciationFeedbackError(
      error.message === "provider_timeout" ? "feedback_timeout" : "feedback_failed",
    );
  }
  return new PronunciationFeedbackError("feedback_failed");
}

export class TransparentSttPronunciationFeedbackProvider implements PronunciationFeedbackProvider {
  readonly name: string;

  constructor(private readonly speechProvider: SpeechToTextProvider) {
    this.name = `${speechProvider.name}-stt-comparison`;
  }

  async evaluate(input: PronunciationFeedbackInput) {
    try {
      const transcript = await this.speechProvider.transcribe({
        bytes: input.audio,
        mimeType: input.mimeType,
        durationMs: input.learnerDurationMs,
        languageHint: input.sourceLanguage,
        signal: input.signal,
      });
      if (!transcript.text.trim()) throw new PronunciationFeedbackError("no_speech_detected");
      return pronunciationFeedbackSchema.parse(buildTransparentPronunciationFeedback({
        targetText: input.targetText,
        understoodText: transcript.text,
        learnerDurationMs: input.learnerDurationMs,
        referenceDurationMs: input.referenceDurationMs,
      }));
    } catch (error) {
      if (error instanceof PronunciationFeedbackError) throw error;
      throw mapTranscriptionError(error);
    }
  }
}

