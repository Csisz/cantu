import { getAuthContext } from "@/lib/data/auth";
import { createSpeechToTextProvider } from "@/lib/providers/speech/factory";
import { TranscriptionError, type TranscriptionErrorCode } from "@/lib/providers/speech/types";
import { transcribeValidatedClip } from "@/lib/transcription/service";
import {
  MAX_TRANSCRIPTION_REQUEST_BYTES,
  validateTranscriptionFormData,
} from "@/lib/transcription/validation";

export const runtime = "nodejs";
export const maxDuration = 35;

const statusByCode: Record<TranscriptionErrorCode, number> = {
  unauthenticated: 401,
  invalid_audio: 400,
  unsupported_format: 415,
  too_large: 413,
  too_long: 400,
  rate_limited: 429,
  not_configured: 503,
  provider_unavailable: 503,
  transcription_failed: 502,
};

function errorResponse(error: unknown) {
  const normalized = error instanceof TranscriptionError
    ? error
    : new TranscriptionError("transcription_failed");
  return Response.json(
    { error: { code: normalized.code } },
    { status: statusByCode[normalized.code] },
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse(new TranscriptionError("invalid_audio"));
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_TRANSCRIPTION_REQUEST_BYTES) {
    return errorResponse(new TranscriptionError("too_large"));
  }

  const auth = await getAuthContext();
  if (auth.status !== "authenticated") {
    return errorResponse(new TranscriptionError("unauthenticated"));
  }

  try {
    const clip = await validateTranscriptionFormData(await request.formData());
    const provider = createSpeechToTextProvider();
    const result = await transcribeValidatedClip(auth, clip, provider, request.signal);
    return Response.json({
      sessionId: result.sessionId,
      transcript: result.transcript,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
