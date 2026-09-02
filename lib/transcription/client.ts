import { z } from "zod";
import type { AudioClipInput } from "@/lib/input/audio-clip";
import {
  TranscriptionError,
  transcriptResultSchema,
  type TranscriptResult,
  type TranscriptionErrorCode,
} from "@/lib/providers/speech/types";

const transcriptionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  transcript: transcriptResultSchema,
});

const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum([
      "invalid_audio",
      "too_large",
      "too_long",
      "unsupported_format",
      "transcription_failed",
      "provider_unavailable",
      "rate_limited",
      "quota_exceeded",
      "not_configured",
      "unauthenticated",
    ]),
  }),
});

export type TranscriptionCandidate = {
  sessionId: string;
  transcript: TranscriptResult;
};

function clipFileName(mimeType: string) {
  if (mimeType === "audio/wav") return "selected-clip.wav";
  if (mimeType.includes("ogg")) return "recording.ogg";
  if (mimeType.includes("mp4")) return "recording.m4a";
  return "recording.webm";
}

export async function transcribeAudioClip(
  clip: AudioClipInput,
  signal?: AbortSignal,
): Promise<TranscriptionCandidate> {
  const body = new FormData();
  body.set("clip", clip.blob, clipFileName(clip.mimeType));
  body.set("sourceType", clip.sourceType);
  body.set("durationMs", String(clip.durationMs));

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body,
    signal,
  });
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(payload);
    const code: TranscriptionErrorCode = parsed.success
      ? parsed.data.error.code
      : response.status === 401
        ? "unauthenticated"
        : "transcription_failed";
    throw new TranscriptionError(code);
  }

  const parsed = transcriptionResponseSchema.safeParse(payload);
  if (!parsed.success) throw new TranscriptionError("transcription_failed");
  return parsed.data;
}

export async function verifyTranscript(
  sessionId: string,
  status: "user_verified" | "user_edited",
) {
  const response = await fetch("/api/transcribe/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, status }),
  });
  if (!response.ok) throw new TranscriptionError(response.status === 401 ? "unauthenticated" : "transcription_failed");
}
