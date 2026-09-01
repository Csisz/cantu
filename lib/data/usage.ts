import "server-only";

import { randomUUID } from "node:crypto";
import { isE2EAnalysisMockEnabled, isE2EPracticeMockEnabled, isE2ESTTMockEnabled } from "@/lib/env/server";
import { PUBLIC_BETA_LIMITS, type GuardedOperation } from "@/lib/security/limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumePracticeNonce, consumePracticeRateLimit } from "@/lib/practice/rate-limit";

export async function consumePracticeUsage(userId: string, nonce: string = randomUUID()) {
  if (isE2EPracticeMockEnabled()) {
    return consumePracticeNonce(nonce) && consumePracticeRateLimit(userId);
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_private_usage", {
    p_user_id: userId,
    p_operation: "practice",
    p_request_nonce: nonce,
    p_limit: PUBLIC_BETA_LIMITS.practiceTurnsPerHour,
  });
  if (error) throw new Error("Practice usage guard unavailable");
  return data === true;
}

const limitByOperation: Record<GuardedOperation, number> = {
  transcription: PUBLIC_BETA_LIMITS.transcriptionPerHour,
  analysis: PUBLIC_BETA_LIMITS.analysisPerHour,
  pronunciation: PUBLIC_BETA_LIMITS.pronunciationPerHour,
  practice: PUBLIC_BETA_LIMITS.practiceTurnsPerHour,
};

export async function consumePaidUsage(userId: string, operation: Exclude<GuardedOperation, "practice">, nonce = randomUUID()) {
  if (isE2ESTTMockEnabled() || isE2EAnalysisMockEnabled() || isE2EPracticeMockEnabled()) return true;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_private_usage", {
    p_user_id: userId,
    p_operation: operation,
    p_request_nonce: nonce,
    p_limit: limitByOperation[operation],
  });
  if (error) throw new Error("Usage guard unavailable");
  return data === true;
}
