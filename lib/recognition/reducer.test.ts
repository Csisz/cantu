import { describe, expect, it } from "vitest";
import { mockRecognitionCandidate } from "./mock";
import { createInitialRecognitionState, recognitionReducer } from "./reducer";

describe("recognitionReducer", () => {
  it("starts in the requested entry mode", () => {
    expect(createInitialRecognitionState("listen")).toEqual({ type: "entry", mode: "listen" });
    expect(createInitialRecognitionState("upload")).toEqual({ type: "entry", mode: "upload" });
  });

  it("moves listen through listening and identifying to a normalized candidate", () => {
    const listening = recognitionReducer(
      createInitialRecognitionState("listen"),
      { type: "START_LISTENING" },
    );
    expect(listening).toEqual({ type: "listening" });

    const identifying = recognitionReducer(listening, {
      type: "START_IDENTIFYING",
      source: "listen",
    });
    expect(identifying).toEqual({ type: "identifying", source: "listen" });

    const candidate = recognitionReducer(identifying, {
      type: "CANDIDATE_FOUND",
      source: "listen",
      candidate: mockRecognitionCandidate,
    });
    expect(candidate).toEqual({
      type: "candidate",
      source: "listen",
      candidate: expect.objectContaining({
        title: expect.any(String),
        artist: expect.any(String),
      }),
    });
    expect(candidate.type).not.toBe("confirmed");
  });

  it("distinguishes confirmation from rejection", () => {
    const candidateState = {
      type: "candidate" as const,
      source: "listen" as const,
      candidate: mockRecognitionCandidate,
    };

    expect(recognitionReducer(candidateState, { type: "CONFIRM_CANDIDATE" }).type).toBe("confirmed");
    expect(recognitionReducer(candidateState, { type: "REJECT_CANDIDATE" }).type).toBe("rejected");
  });

  it("supports no-match, retry, and manual-search recovery", () => {
    const noMatch = recognitionReducer(createInitialRecognitionState("listen"), {
      type: "SHOW_NO_MATCH",
      source: "listen",
    });
    expect(noMatch).toEqual({ type: "no-match", source: "listen" });
    expect(recognitionReducer(noMatch, { type: "RETRY_LISTEN" })).toEqual({
      type: "entry",
      mode: "listen",
    });
    expect(recognitionReducer(noMatch, { type: "OPEN_MANUAL_SEARCH" })).toEqual({
      type: "manual-search",
    });
  });
});
