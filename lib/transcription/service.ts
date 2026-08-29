import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import {
  completeTranscriptionAttempt,
  startTranscriptionSession,
} from "@/lib/data/learning-sessions";
import {
  TranscriptionError,
  transcriptResultSchema,
  type SpeechToTextProvider,
} from "@/lib/providers/speech/types";
import type { ValidatedTranscriptionClip } from "./validation";

export async function transcribeValidatedClip(
  auth: AuthContext,
  clip: ValidatedTranscriptionClip,
  provider: SpeechToTextProvider,
  signal?: AbortSignal,
) {
  const ids = await startTranscriptionSession(auth, {
    sourceType: clip.sourceType,
    durationMs: clip.durationMs,
    provider: provider.name,
  });
  const startedAt = performance.now();

  try {
    const transcript = transcriptResultSchema.parse(await provider.transcribe({
      bytes: clip.bytes,
      mimeType: clip.mimeType,
      durationMs: clip.durationMs,
      languageHint: "it",
      signal,
    }));
    await completeTranscriptionAttempt(auth, {
      ...ids,
      status: "succeeded",
      latencyMs: performance.now() - startedAt,
    });
    return { ...ids, transcript };
  } catch (error) {
    const normalized = error instanceof TranscriptionError
      ? error
      : new TranscriptionError("transcription_failed");
    await completeTranscriptionAttempt(auth, {
      ...ids,
      status: "failed",
      latencyMs: performance.now() - startedAt,
      errorCode: normalized.code,
    });
    throw normalized;
  }
}
