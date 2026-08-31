import "server-only";

import { buildTransparentPronunciationFeedback } from "@/lib/pronunciation/comparison";
import { PronunciationFeedbackError, type PronunciationFeedbackInput, type PronunciationFeedbackProvider } from "@/lib/pronunciation/types";

export type TestPronunciationScenario = "perfect" | "missing" | "extra" | "no_speech" | "failure";

export class TestPronunciationFeedbackProvider implements PronunciationFeedbackProvider {
  readonly name = "test-stt-comparison";

  constructor(private readonly scenario: TestPronunciationScenario = "perfect") {}

  async evaluate(input: PronunciationFeedbackInput) {
    if (this.scenario === "no_speech") throw new PronunciationFeedbackError("no_speech_detected");
    if (this.scenario === "failure") throw new PronunciationFeedbackError("feedback_failed");
    const words = input.targetText.trim().split(/\s+/u);
    const understoodText = this.scenario === "missing"
      ? words.slice(0, Math.max(1, words.length - 1)).join(" ")
      : this.scenario === "extra"
        ? `${input.targetText} davvero`
        : input.targetText;
    return buildTransparentPronunciationFeedback({
      targetText: input.targetText,
      understoodText,
      learnerDurationMs: input.learnerDurationMs,
      referenceDurationMs: input.referenceDurationMs,
    });
  }
}

