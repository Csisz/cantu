import { learningAnalysisSchema, type VerifiedSourceStatus } from "./schema";
import { AnalysisError, type AnalysisErrorCode, type CompletedLearningAnalysis } from "@/lib/providers/analysis/types";

const knownCodes = new Set<AnalysisErrorCode>([
  "invalid_source",
  "source_not_verified",
  "unauthenticated",
  "not_configured",
  "rate_limited",
  "quota_exceeded",
  "provider_unavailable",
  "provider_timeout",
  "invalid_provider_response",
  "analysis_invalid",
  "unsupported_language",
  "session_not_found",
  "source_context_mismatch",
  "analysis_in_progress",
]);

export async function requestLearningAnalysis(
  input: {
    text: string;
    sourceStatus: VerifiedSourceStatus;
    inputType: "microphone" | "audio_file" | "text";
    sessionId?: string;
  },
  signal?: AbortSignal,
): Promise<CompletedLearningAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  const payload = await response.json().catch(() => null) as {
    error?: { code?: string };
    analysis?: unknown;
    sessionId?: string;
    cached?: boolean;
    generation?: CompletedLearningAnalysis["generation"];
  } | null;
  if (!response.ok) {
    const code = payload?.error?.code;
    throw new AnalysisError(code && knownCodes.has(code as AnalysisErrorCode)
      ? code as AnalysisErrorCode
      : "provider_unavailable");
  }
  if (!payload?.sessionId || typeof payload.cached !== "boolean" || !payload.generation) {
    throw new AnalysisError("invalid_provider_response");
  }
  const parsed = learningAnalysisSchema.safeParse(payload.analysis);
  if (!parsed.success) throw new AnalysisError("invalid_provider_response");
  return {
    analysis: parsed.data,
    sessionId: payload.sessionId,
    cached: payload.cached,
    generation: payload.generation,
  };
}
