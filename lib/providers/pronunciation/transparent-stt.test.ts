import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { TranscriptionError, type SpeechToTextProvider } from "../speech/types";
import { TransparentSttPronunciationFeedbackProvider } from "./transparent-stt";

function speech(result: string | Error): SpeechToTextProvider {
  return {
    name: "stub",
    transcribe: vi.fn(async () => {
      if (result instanceof Error) throw result;
      return { text: result, detectedLanguage: "it" };
    }),
  };
}

const input = {
  audio: new Uint8Array([1, 2, 3]),
  mimeType: "audio/webm",
  targetText: "Non vedo l'ora",
  sourceLanguage: "it" as const,
  learnerDurationMs: 2_000,
};

describe("TransparentSttPronunciationFeedbackProvider", () => {
  it("normalizes a successful STT result into transparent feedback", async () => {
    const provider = new TransparentSttPronunciationFeedbackProvider(speech("Non vedo l’ora."));
    await expect(provider.evaluate(input)).resolves.toMatchObject({
      understoodText: "Non vedo l’ora.",
      targetMatch: { missingTokens: [], extraTokens: [], orderCorrect: true },
      observations: [{ code: "all_words_recognized" }],
    });
  });

  it.each([
    [new TranscriptionError("rate_limited"), "feedback_rate_limited"],
    [new TranscriptionError("not_configured"), "feedback_not_configured"],
    [new TranscriptionError("provider_unavailable", "provider_timeout"), "feedback_timeout"],
    [new TranscriptionError("provider_unavailable"), "feedback_failed"],
    [new TranscriptionError("transcription_failed"), "feedback_failed"],
  ])("maps speech-provider failures without leaking raw errors", async (error, code) => {
    const provider = new TransparentSttPronunciationFeedbackProvider(speech(error));
    await expect(provider.evaluate(input)).rejects.toMatchObject({ code });
  });
});
