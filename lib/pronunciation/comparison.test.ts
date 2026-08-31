import { describe, expect, it } from "vitest";
import {
  buildTransparentPronunciationFeedback,
  comparePronunciationTokens,
  normalizeItalianText,
} from "./comparison";

describe("transparent pronunciation comparison", () => {
  it("normalizes punctuation, case and typographic apostrophes", () => {
    expect(normalizeItalianText("  NON vedo L’ORA! ")).toBe("non vedo l'ora");
    expect(comparePronunciationTokens("Non vedo l’ora.", "non vedo lora")).toEqual({
      matchedTokens: ["non", "vedo", "l'ora"],
      missingTokens: [],
      extraTokens: [],
      orderCorrect: true,
    });
  });

  it("reports missing and extra tokens without phoneme claims", () => {
    const result = buildTransparentPronunciationFeedback({
      targetText: "Non vedo l'ora di partire",
      understoodText: "Non vedo di andare",
      learnerDurationMs: 2_800,
    });
    expect(result.targetMatch.missingTokens).toEqual(["l'ora", "partire"]);
    expect(result.targetMatch.extraTokens).toEqual(["andare"]);
    expect(result.observations.map((item) => item.code)).toEqual(["some_words_missing", "extra_words"]);
    expect(JSON.stringify(result)).not.toMatch(/fonéma|akcentus|native|százalék/iu);
  });

  it("detects word-order differences independently of punctuation", () => {
    const result = comparePronunciationTokens("domani partiamo", "partiamo, domani");
    expect(result.missingTokens).toEqual([]);
    expect(result.extraTokens).toEqual([]);
    expect(result.orderCorrect).toBe(false);
  });

  it("returns evidence-based positive feedback and actual duration", () => {
    const result = buildTransparentPronunciationFeedback({
      targetText: "Non vedo l'ora",
      understoodText: "Non vedo l'ora.",
      learnerDurationMs: 2_345.4,
    });
    expect(result.observations).toEqual([{ code: "all_words_recognized", messageHu: "Minden szót elcsíptem." }]);
    expect(result.timing.learnerDurationMs).toBe(2_345);
  });
});

