import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import {
  completePronunciationFeedback,
  startPronunciationFeedback,
} from "@/lib/data/pronunciation";
import {
  PronunciationFeedbackError,
  pronunciationFeedbackSchema,
  type PronunciationFeedbackProvider,
} from "./types";
import type { ValidatedPronunciationRecording } from "./validation";

export async function evaluatePronunciationRecording(
  auth: AuthContext,
  recording: ValidatedPronunciationRecording,
  targetText: string,
  provider: PronunciationFeedbackProvider,
  signal?: AbortSignal,
) {
  const { attemptId } = await startPronunciationFeedback(auth, {
    sessionId: recording.sessionId,
    provider: provider.name,
  });
  const startedAt = performance.now();

  try {
    const feedback = pronunciationFeedbackSchema.parse(await provider.evaluate({
      audio: recording.bytes,
      mimeType: recording.mimeType,
      targetText,
      sourceLanguage: "it",
      learnerDurationMs: recording.durationMs,
      signal,
    }));
    await completePronunciationFeedback(auth, {
      sessionId: recording.sessionId,
      attemptId,
      status: "succeeded",
      latencyMs: performance.now() - startedAt,
    });
    return feedback;
  } catch (error) {
    const normalized = error instanceof PronunciationFeedbackError
      ? error
      : new PronunciationFeedbackError("feedback_failed");
    try {
      await completePronunciationFeedback(auth, {
        sessionId: recording.sessionId,
        attemptId,
        status: "failed",
        latencyMs: performance.now() - startedAt,
        errorCode: normalized.code,
      });
    } catch {
      // The learner-facing error remains primary; source or audio is never logged.
    }
    throw normalized;
  }
}

