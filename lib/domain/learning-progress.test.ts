import { describe, expect, it } from "vitest";
import { learningProgressMutationSchema, progressLabel } from "./learning-progress";

describe("generalized learning progress", () => {
  it("accepts bounded progress and recall scores", () => {
    expect(learningProgressMutationSchema.parse({
      sessionId: "30000000-0000-4000-8000-000000000003",
      stage: "recall",
      percentComplete: 90,
      recallScore: 80,
    })).toBeTruthy();
    expect(() => learningProgressMutationSchema.parse({
      sessionId: "30000000-0000-4000-8000-000000000003",
      stage: "recall",
      percentComplete: 101,
    })).toThrow();
  });

  it("formats bounded progress labels", () => {
    expect(progressLabel(-4)).toBe("0%");
    expect(progressLabel(49.6)).toBe("50%");
    expect(progressLabel(140)).toBe("100%");
  });
});
