import { z } from "zod";
import { sessionIdSchema } from "@/lib/domain/learning-session";
import {
  ALLOWED_AUDIO_MIME_BASES,
  audioMimeBase,
  getWavDurationMs,
  hasSupportedAudioSignature,
} from "@/lib/transcription/validation";
import {
  MAX_SHADOWING_RECORDING_BYTES,
  MAX_SHADOWING_RECORDING_MS,
} from "./limits";
import { PronunciationFeedbackError } from "./types";

const metadataSchema = z.object({
  sessionId: sessionIdSchema,
  chunkIndex: z.coerce.number().int().min(0).max(5),
  durationMs: z.coerce.number().int().min(1).max(MAX_SHADOWING_RECORDING_MS),
}).strict();

export type ValidatedPronunciationRecording = {
  sessionId: string;
  chunkIndex: number;
  bytes: Uint8Array;
  mimeType: string;
  durationMs: number;
};

export async function validatePronunciationFormData(
  formData: FormData,
): Promise<ValidatedPronunciationRecording> {
  const parsed = metadataSchema.safeParse({
    sessionId: formData.get("sessionId"),
    chunkIndex: formData.get("chunkIndex"),
    durationMs: formData.get("durationMs"),
  });
  if (!parsed.success) {
    const durationIssue = parsed.error.issues.some((issue) => issue.path[0] === "durationMs");
    throw new PronunciationFeedbackError(durationIssue ? "too_long" : "invalid_recording");
  }

  const recording = formData.get("recording");
  if (!(recording instanceof File) || recording.size === 0) {
    throw new PronunciationFeedbackError("invalid_recording");
  }
  if (recording.size > MAX_SHADOWING_RECORDING_BYTES) {
    throw new PronunciationFeedbackError("too_large");
  }
  if (!ALLOWED_AUDIO_MIME_BASES.has(audioMimeBase(recording.type))) {
    throw new PronunciationFeedbackError("unsupported_format");
  }

  const bytes = new Uint8Array(await recording.arrayBuffer());
  if (!hasSupportedAudioSignature(bytes, recording.type)) {
    throw new PronunciationFeedbackError("invalid_recording");
  }
  if (audioMimeBase(recording.type).includes("wav")) {
    let actualDurationMs: number;
    try {
      actualDurationMs = getWavDurationMs(bytes);
    } catch {
      throw new PronunciationFeedbackError("invalid_recording");
    }
    if (actualDurationMs > MAX_SHADOWING_RECORDING_MS) {
      throw new PronunciationFeedbackError("too_long");
    }
    if (Math.abs(actualDurationMs - parsed.data.durationMs) > 750) {
      throw new PronunciationFeedbackError("invalid_recording");
    }
  }

  return {
    sessionId: parsed.data.sessionId,
    chunkIndex: parsed.data.chunkIndex,
    bytes,
    mimeType: recording.type,
    durationMs: parsed.data.durationMs,
  };
}

