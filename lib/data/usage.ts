import "server-only";

import { randomUUID } from "node:crypto";
import { reserveE2EUsage } from "@/lib/billing/e2e-store";
import { PLAN_ENTITLEMENTS } from "@/lib/billing/plans";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { RATE_LIMIT_INVENTORY, type GuardedOperation } from "@/lib/security/limits";
import { createAdminClient } from "@/lib/supabase/admin";

export type UsageReservation = { allowed: boolean; reason: "reserved" | "rate_limited" | "quota_exceeded" | "duplicate_request" | "unavailable"; plan?: "free" | "plus"; used?: number; limit?: number };

export function isProviderOperationDisabled(operation: GuardedOperation) {
  return process.env[`CANTU_DISABLE_${operation === "practice" ? "PRACTICE" : operation.toUpperCase()}`] === "true";
}

export async function reserveProviderUsage(userId: string, operation: GuardedOperation, nonce: string = randomUUID()): Promise<UsageReservation> {
  if (isProviderOperationDisabled(operation)) return { allowed: false, reason: "unavailable" };
  const hourlyLimit = RATE_LIMIT_INVENTORY[operation].limit;
  if (isE2EAuthMockEnabled()) return reserveE2EUsage(userId, operation, nonce, hourlyLimit);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_entitled_usage", {
    p_user_id: userId,
    p_operation: operation,
    p_request_nonce: nonce,
    p_hourly_limit: hourlyLimit,
    p_free_monthly_limit: PLAN_ENTITLEMENTS.free.monthly[operation],
    p_plus_monthly_limit: PLAN_ENTITLEMENTS.plus.monthly[operation],
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return { allowed: false, reason: "unavailable" };
  const row = data as Record<string, unknown>;
  const reason = row.reason;
  if (reason !== "reserved" && reason !== "rate_limited" && reason !== "quota_exceeded" && reason !== "duplicate_request") return { allowed: false, reason: "unavailable" };
  return { allowed: row.allowed === true, reason, plan: row.plan === "plus" ? "plus" : "free", used: typeof row.used === "number" ? row.used : undefined, limit: typeof row.limit === "number" ? row.limit : undefined };
}
