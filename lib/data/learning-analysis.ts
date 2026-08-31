import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import type { LearningAnalysis, VerifiedSourceStatus } from "@/lib/analysis/schema";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnalysisError } from "@/lib/providers/analysis/types";
import { completeE2EAnalysis, startE2EAnalysis } from "./e2e-learning-store";

type StartAnalysisInput = {
  sessionId?: string;
  inputType: "microphone" | "audio_file" | "text";
  sourceStatus: VerifiedSourceStatus;
  sourceCharCount: number;
  sourceFingerprint: string;
  provider: string;
  schemaVersion: string;
  generatorVersion: string;
};

function authenticatedUser(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new AnalysisError("unauthenticated");
  return auth.user;
}

function mapDatabaseError(message: string) {
  if (message.includes("analysis_rate_limited")) return new AnalysisError("rate_limited");
  if (message.includes("analysis_source_mismatch")) return new AnalysisError("source_context_mismatch");
  if (message.includes("analysis_in_progress")) return new AnalysisError("analysis_in_progress");
  if (message.includes("session_not_found")) return new AnalysisError("session_not_found");
  if (message.includes("invalid_source_status")) return new AnalysisError("source_not_verified");
  return new AnalysisError("provider_unavailable");
}

export async function startLearningAnalysis(auth: AuthContext, input: StartAnalysisInput) {
  const user = authenticatedUser(auth);
  if (isE2EAuthMockEnabled()) {
    try {
      const result = startE2EAnalysis(user.id, input);
      if (!result) throw new AnalysisError("session_not_found");
      return result;
    } catch (error) {
      if (error instanceof AnalysisError) throw error;
      throw mapDatabaseError(error instanceof Error ? error.message : "");
    }
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    throw new AnalysisError("not_configured");
  }
  const { data, error } = await admin.rpc("start_learning_analysis", {
    p_user_id: user.id,
    p_session_id: (input.sessionId ?? null) as unknown as string,
    p_input_type: input.inputType,
    p_source_status: input.sourceStatus,
    p_source_char_count: input.sourceCharCount,
    p_source_fingerprint: input.sourceFingerprint,
    p_provider: input.provider,
    p_schema_version: input.schemaVersion,
    p_generator_version: input.generatorVersion,
  });
  if (error) throw mapDatabaseError(error.message);
  const row = data[0];
  if (!row) throw new AnalysisError("provider_unavailable");
  return {
    sessionId: row.learning_session_id,
    attemptId: row.processing_attempt_id,
    cachedResult: row.cached_result,
  };
}

export async function completeLearningAnalysis(
  auth: AuthContext,
  input: {
    sessionId: string;
    attemptId: string;
    schemaVersion: string;
    generatorVersion: string;
    result: LearningAnalysis;
    latencyMs: number;
  },
) {
  const user = authenticatedUser(auth);
  if (isE2EAuthMockEnabled()) {
    return completeE2EAnalysis(user.id, {
      sessionId: input.sessionId,
      schemaVersion: input.schemaVersion,
      generatorVersion: input.generatorVersion,
      resultJson: input.result,
    });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("complete_learning_analysis", {
    p_user_id: user.id,
    p_session_id: input.sessionId,
    p_attempt_id: input.attemptId,
    p_schema_version: input.schemaVersion,
    p_generator_version: input.generatorVersion,
    p_result_json: input.result,
    p_latency_ms: Math.max(0, Math.round(input.latencyMs)),
  });
  if (error || !data) throw new AnalysisError("provider_unavailable");
  return true;
}

export async function failLearningAnalysis(
  auth: AuthContext,
  input: {
    sessionId: string;
    attemptId: string;
    latencyMs: number;
    errorCode: string;
  },
) {
  const user = authenticatedUser(auth);
  if (isE2EAuthMockEnabled()) return true;
  try {
    const admin = createAdminClient();
    await admin.rpc("fail_learning_analysis", {
      p_user_id: user.id,
      p_session_id: input.sessionId,
      p_attempt_id: input.attemptId,
      p_latency_ms: Math.max(0, Math.round(input.latencyMs)),
      p_error_code: input.errorCode,
    });
  } catch {
    // The learner-facing provider error remains primary; never log private source data.
  }
  return true;
}
