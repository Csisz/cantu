import "server-only";

import { randomUUID } from "node:crypto";
import type { AuthContext } from "@/lib/auth/types";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { PronunciationFeedbackError } from "@/lib/pronunciation/types";
import { createClient } from "@/lib/supabase/server";

function authenticatedUser(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new PronunciationFeedbackError("unauthenticated");
  return auth.user;
}

function mapDatabaseError(message: string) {
  if (message.includes("pronunciation_rate_limited")) {
    return new PronunciationFeedbackError("feedback_rate_limited");
  }
  if (message.includes("pronunciation_session_not_found")) {
    return new PronunciationFeedbackError("session_not_found");
  }
  return new PronunciationFeedbackError("feedback_failed");
}

export async function startPronunciationFeedback(
  auth: AuthContext,
  input: { sessionId: string; provider: string },
) {
  authenticatedUser(auth);
  if (isE2EAuthMockEnabled()) return { attemptId: randomUUID() };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_pronunciation_feedback", {
    p_session_id: input.sessionId,
    p_provider: input.provider,
  });
  if (error || !data) throw mapDatabaseError(error?.message ?? "");
  return { attemptId: data };
}

export async function completePronunciationFeedback(
  auth: AuthContext,
  input: {
    sessionId: string;
    attemptId: string;
    status: "succeeded" | "failed";
    latencyMs: number;
    errorCode?: string;
  },
) {
  authenticatedUser(auth);
  if (isE2EAuthMockEnabled()) return true;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_pronunciation_feedback", {
    p_session_id: input.sessionId,
    p_attempt_id: input.attemptId,
    p_status: input.status,
    p_latency_ms: Math.max(0, Math.round(input.latencyMs)),
    ...(input.errorCode ? { p_error_code: input.errorCode } : {}),
  });
  if (error || !data) throw mapDatabaseError(error?.message ?? "");
  return true;
}
