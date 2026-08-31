import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const dataMocks = vi.hoisted(() => ({
  start: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("@/lib/data/pronunciation", () => ({
  startPronunciationFeedback: (...args: unknown[]) => dataMocks.start(...args),
  completePronunciationFeedback: (...args: unknown[]) => dataMocks.complete(...args),
}));

import type { AuthContext } from "@/lib/auth/types";
import { TestPronunciationFeedbackProvider } from "@/lib/providers/pronunciation/test-provider";
import { evaluatePronunciationRecording } from "./service";

const auth: AuthContext = {
  status: "authenticated",
  configured: true,
  user: { id: "user-a", email: "a@cantu.test", displayName: null },
};

const recording = {
  sessionId: "10000000-0000-4000-8000-000000000001",
  chunkIndex: 0,
  bytes: new Uint8Array([1, 2, 3]),
  mimeType: "audio/webm",
  durationMs: 1_500,
};

describe("pronunciation feedback service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataMocks.start.mockResolvedValue({ attemptId: "20000000-0000-4000-8000-000000000002" });
    dataMocks.complete.mockResolvedValue(true);
  });

  it("uses the server-loaded canonical target and stores operational metadata only", async () => {
    const provider = new TestPronunciationFeedbackProvider();
    const evaluate = vi.spyOn(provider, "evaluate");
    const result = await evaluatePronunciationRecording(auth, recording, "Non vedo l'ora", provider);
    expect(result.observations[0]?.code).toBe("all_words_recognized");
    expect(evaluate).toHaveBeenCalledWith(expect.objectContaining({
      targetText: "Non vedo l'ora",
      audio: recording.bytes,
      learnerDurationMs: 1_500,
    }));
    expect(dataMocks.start).toHaveBeenCalledWith(auth, {
      sessionId: recording.sessionId,
      provider: "test-stt-comparison",
    });
    expect(dataMocks.complete).toHaveBeenCalledWith(auth, expect.objectContaining({
      sessionId: recording.sessionId,
      status: "succeeded",
    }));
    expect(JSON.stringify(dataMocks.complete.mock.calls)).not.toMatch(/audio|targetText|understoodText|voice/iu);
  });

  it("normalizes failure metadata without retaining audio or provider output", async () => {
    const provider = new TestPronunciationFeedbackProvider("failure");
    await expect(evaluatePronunciationRecording(auth, recording, "Non vedo l'ora", provider))
      .rejects.toHaveProperty("code", "feedback_failed");
    expect(dataMocks.complete).toHaveBeenCalledWith(auth, expect.objectContaining({
      status: "failed",
      errorCode: "feedback_failed",
    }));
    expect(JSON.stringify(dataMocks.complete.mock.calls)).not.toContain("Non vedo l'ora");
  });
});

