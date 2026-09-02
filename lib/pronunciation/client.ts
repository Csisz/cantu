import {
  PronunciationFeedbackError,
  pronunciationFeedbackSchema,
  type PronunciationFeedback,
} from "./types";

const errorCodes = new Set([
  "unauthenticated",
  "invalid_recording",
  "unsupported_format",
  "too_large",
  "too_long",
  "session_not_found",
  "feedback_rate_limited",
  "quota_exceeded",
  "feedback_not_configured",
  "feedback_timeout",
  "feedback_failed",
  "no_speech_detected",
]);

export async function requestPronunciationFeedback(input: {
  recording: Blob;
  durationMs: number;
  sessionId: string;
  chunkIndex: number;
}, signal?: AbortSignal): Promise<PronunciationFeedback> {
  const formData = new FormData();
  formData.set("recording", input.recording, "learner-practice.webm");
  formData.set("durationMs", String(input.durationMs));
  formData.set("sessionId", input.sessionId);
  formData.set("chunkIndex", String(input.chunkIndex));

  let response: Response;
  try {
    response = await fetch("/api/pronunciation", { method: "POST", body: formData, signal });
  } catch {
    if (signal?.aborted) throw new PronunciationFeedbackError("feedback_failed");
    throw new PronunciationFeedbackError("feedback_failed");
  }
  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const code = typeof payload === "object" && payload !== null
      && "error" in payload && typeof payload.error === "object" && payload.error !== null
      && "code" in payload.error && typeof payload.error.code === "string"
      ? payload.error.code
      : "feedback_failed";
    throw new PronunciationFeedbackError(errorCodes.has(code) ? code as PronunciationFeedbackError["code"] : "feedback_failed");
  }
  const parsed = pronunciationFeedbackSchema.safeParse(payload);
  if (!parsed.success) throw new PronunciationFeedbackError("feedback_failed");
  return parsed.data;
}
