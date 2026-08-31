import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { TestPronunciationFeedbackProvider } from "./test-provider";

const input = {
  audio: new Uint8Array([1]),
  mimeType: "audio/webm",
  targetText: "Non vedo l'ora",
  sourceLanguage: "it" as const,
  learnerDurationMs: 1_500,
};

describe("TestPronunciationFeedbackProvider", () => {
  it.each([
    ["perfect", "all_words_recognized"],
    ["missing", "some_words_missing"],
    ["extra", "extra_words"],
  ] as const)("produces deterministic %s feedback", async (scenario, code) => {
    const result = await new TestPronunciationFeedbackProvider(scenario).evaluate(input);
    expect(result.observations.some((item) => item.code === code)).toBe(true);
  });

  it.each(["no_speech", "failure"] as const)("normalizes deterministic %s errors", async (scenario) => {
    await expect(new TestPronunciationFeedbackProvider(scenario).evaluate(input)).rejects.toHaveProperty(
      "code",
      scenario === "no_speech" ? "no_speech_detected" : "feedback_failed",
    );
  });
});
