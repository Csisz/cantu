import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import {
  buildLearningSessionInsert,
  learningSessionMetadataSchema,
  sessionIdSchema,
  toLearningHistoryItems,
  type LearningHistoryItem,
  type LearningSessionMetadata,
} from "@/lib/domain/learning-session";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteE2ELearningSession,
  hasE2ELearningSession,
  listE2ELearningSessions,
  saveE2ELearningSession,
  startE2ETranscriptionSession,
  updateE2ETranscriptionStatus,
} from "./e2e-learning-store";
import { TranscriptionError } from "@/lib/providers/speech/types";

export type LearningHistorySnapshot =
  | { status: "unavailable"; items: [] }
  | { status: "ready"; items: LearningHistoryItem[] }
  | { status: "error"; items: []; message: string };

function requireAuthenticated(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new Error("Authentication required");
  return auth;
}

export async function getLearningHistory(auth: AuthContext): Promise<LearningHistorySnapshot> {
  if (auth.status !== "authenticated") return { status: "unavailable", items: [] };
  if (isE2EAuthMockEnabled()) {
    return { status: "ready", items: listE2ELearningSessions(auth.user.id) };
  }

  const supabase = await createClient();
  const [sessionsResult, progressResult] = await Promise.all([
    supabase
      .from("learning_sessions")
      .select("id, input_type, source_status, source_duration_ms, source_char_count, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_progress")
      .select("session_id, stage, percent_complete, last_opened_at")
      .eq("user_id", auth.user.id),
  ]);

  if (sessionsResult.error || progressResult.error) {
    const error = sessionsResult.error ?? progressResult.error;
    console.error("Cantu learning history query failed", { code: error?.code });
    return {
      status: "error",
      items: [],
      message: "A saját tanulások most nem tölthetők be. Próbáld meg később.",
    };
  }

  return {
    status: "ready",
    items: toLearningHistoryItems(sessionsResult.data ?? [], progressResult.data ?? []),
  };
}

export async function saveLearningSession(
  auth: AuthContext,
  metadata: LearningSessionMetadata,
) {
  const authenticated = requireAuthenticated(auth);
  const parsed = learningSessionMetadataSchema.parse(metadata);
  if (isE2EAuthMockEnabled()) return saveE2ELearningSession(authenticated.user.id, parsed);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_sessions")
    .insert(buildLearningSessionInsert(authenticated, parsed))
    .select("id")
    .single();
  if (error) {
    console.error("Cantu learning session save failed", { code: error.code });
    throw new Error("Learning session save failed");
  }
  return data;
}

export async function deleteLearningSession(auth: AuthContext, sessionId: string) {
  const authenticated = requireAuthenticated(auth);
  const id = sessionIdSchema.parse(sessionId);
  if (isE2EAuthMockEnabled()) return deleteE2ELearningSession(authenticated.user.id, id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", authenticated.user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Cantu learning session delete failed", { code: error.code });
    throw new Error("Learning session delete failed");
  }
  return Boolean(data);
}

export async function clearLearningSessionSource(auth: AuthContext, sessionId: string) {
  const authenticated = requireAuthenticated(auth);
  const id = sessionIdSchema.parse(sessionId);
  if (isE2EAuthMockEnabled()) return hasE2ELearningSession(authenticated.user.id, id);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("clear_learning_session_source", {
    target_session_id: id,
  });
  if (error) {
    console.error("Cantu source clear failed", { code: error.code });
    throw new Error("Source clear failed");
  }
  return data;
}

export async function startTranscriptionSession(
  auth: AuthContext,
  input: {
    sourceType: "microphone" | "audio_file";
    durationMs: number;
    provider: string;
  },
) {
  const authenticated = requireAuthenticated(auth);
  if (isE2EAuthMockEnabled()) {
    return startE2ETranscriptionSession(authenticated.user.id, input.sourceType, input.durationMs);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_transcription_session", {
    p_input_type: input.sourceType,
    p_source_duration_ms: input.durationMs,
    p_provider: input.provider,
  });
  if (error) {
    if (error.message.includes("transcription_rate_limited")) {
      throw new TranscriptionError("rate_limited");
    }
    console.error("Cantu transcription start failed", { code: error.code });
    throw new TranscriptionError("transcription_failed");
  }
  const row = data[0];
  if (!row) throw new TranscriptionError("transcription_failed");
  return {
    sessionId: row.learning_session_id,
    attemptId: row.processing_attempt_id,
  };
}

export async function completeTranscriptionAttempt(
  auth: AuthContext,
  input: {
    sessionId: string;
    attemptId: string;
    status: "succeeded" | "failed";
    latencyMs: number;
    errorCode?: string;
  },
) {
  const authenticated = requireAuthenticated(auth);
  const sessionId = sessionIdSchema.parse(input.sessionId);
  const attemptId = sessionIdSchema.parse(input.attemptId);
  if (isE2EAuthMockEnabled()) {
    return updateE2ETranscriptionStatus(
      authenticated.user.id,
      sessionId,
      input.status === "succeeded" ? "stt_unverified" : "failed",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_transcription_attempt", {
    p_session_id: sessionId,
    p_attempt_id: attemptId,
    p_status: input.status,
    p_latency_ms: Math.max(0, Math.round(input.latencyMs)),
    p_error_code: input.errorCode,
  });
  if (error || !data) {
    console.error("Cantu transcription completion failed", { code: error?.code });
    return false;
  }
  return true;
}

export async function verifyTranscriptCandidate(
  auth: AuthContext,
  sessionIdInput: string,
  status: "user_verified" | "user_edited",
) {
  const authenticated = requireAuthenticated(auth);
  const sessionId = sessionIdSchema.parse(sessionIdInput);
  if (isE2EAuthMockEnabled()) {
    return updateE2ETranscriptionStatus(authenticated.user.id, sessionId, status);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_transcript_candidate", {
    p_session_id: sessionId,
    p_source_status: status,
  });
  if (error) {
    console.error("Cantu transcript verification failed", { code: error.code });
    return false;
  }
  return data;
}
