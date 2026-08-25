import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE_PAIR,
  progressLabel,
  progressMutationSchema,
} from "./progress";

const baseProgress = {
  songId: "30000000-0000-4000-8000-000000000003",
  stage: "quick_understand" as const,
  percentComplete: 50,
};

describe("progress domain", () => {
  it("keeps the v1 language pair Italian to Hungarian", () => {
    expect(DEFAULT_LANGUAGE_PAIR).toEqual({
      sourceLanguage: "it",
      explanationLanguage: "hu",
    });
  });

  it("accepts bounded progress and rejects invalid percentages or scores", () => {
    expect(progressMutationSchema.safeParse(baseProgress).success).toBe(true);
    expect(
      progressMutationSchema.safeParse({ ...baseProgress, percentComplete: 101 }).success,
    ).toBe(false);
    expect(
      progressMutationSchema.safeParse({ ...baseProgress, quizScore: -1 }).success,
    ).toBe(false);
  });

  it("does not accept a caller-supplied user identity", () => {
    expect(
      progressMutationSchema.safeParse({
        ...baseProgress,
        userId: "10000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(false);
  });

  it("formats defensive progress labels", () => {
    expect(progressLabel(-4)).toBe("0%");
    expect(progressLabel(49.6)).toBe("50%");
    expect(progressLabel(140)).toBe("100%");
  });
});
