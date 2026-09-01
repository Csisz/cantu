import { getAuthContext } from "@/lib/data/auth";
import { consumePaidUsage } from "@/lib/data/usage";
import { getOwnedLearningExperience } from "@/lib/data/learning-experience";
import { createPronunciationFeedbackProvider } from "@/lib/providers/pronunciation/factory";
import { MAX_SHADOWING_REQUEST_BYTES } from "@/lib/pronunciation/limits";
import { evaluatePronunciationRecording } from "@/lib/pronunciation/service";
import {
  PronunciationFeedbackError,
  type PronunciationFeedbackErrorCode,
} from "@/lib/pronunciation/types";
import { validatePronunciationFormData } from "@/lib/pronunciation/validation";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 20;

const statusByCode: Record<PronunciationFeedbackErrorCode, number> = {
  unauthenticated: 401,
  invalid_recording: 400,
  unsupported_format: 415,
  too_large: 413,
  too_long: 400,
  session_not_found: 404,
  feedback_rate_limited: 429,
  feedback_not_configured: 503,
  feedback_timeout: 504,
  feedback_failed: 502,
  no_speech_detected: 422,
};

function errorResponse(error: unknown) {
  const normalized = error instanceof PronunciationFeedbackError
    ? error
    : new PronunciationFeedbackError("feedback_failed");
  return Response.json(
    { error: { code: normalized.code } },
    { status: statusByCode[normalized.code] },
  );
}

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse(new PronunciationFeedbackError("invalid_recording"));
  }
  if (exceedsDeclaredBodyLimit(request, MAX_SHADOWING_REQUEST_BYTES)) {
    return errorResponse(new PronunciationFeedbackError("too_large"));
  }

  const auth = await getAuthContext();
  if (auth.status !== "authenticated") {
    return errorResponse(new PronunciationFeedbackError("unauthenticated"));
  }

  try {
    if (!(await consumePaidUsage(auth.user.id, "pronunciation"))) throw new PronunciationFeedbackError("feedback_rate_limited");
    const recording = await validatePronunciationFormData(await request.formData());
    const experience = await getOwnedLearningExperience(auth, recording.sessionId);
    const target = experience?.analysis.chunks[recording.chunkIndex]?.sourceText;
    if (!experience || !target) throw new PronunciationFeedbackError("session_not_found");
    const provider = createPronunciationFeedbackProvider();
    const feedback = await evaluatePronunciationRecording(auth, recording, target, provider, request.signal);
    return Response.json(feedback);
  } catch (error) {
    return errorResponse(error);
  }
}
