import type { GuardedOperation } from "@/lib/security/limits";

export type CantuPlan = "free" | "plus";
export type CantuPlanKey = "cantu_plus";

export type PlanQuota = Record<GuardedOperation, number>;

/**
 * Commercial limits are provisional beta configuration. Tune them against
 * measured product usage and provider cost before enabling live billing.
 */
export const PLAN_ENTITLEMENTS: Record<CantuPlan, { labelHu: string; monthly: PlanQuota }> = {
  free: {
    labelHu: "Free",
    monthly: { transcription: 8, analysis: 4, pronunciation: 8, practice: 16 },
  },
  plus: {
    labelHu: "Cantu Plus",
    monthly: { transcription: 120, analysis: 60, pronunciation: 120, practice: 300 },
  },
};

export const TRUSTED_PLAN_KEYS: Record<CantuPlanKey, CantuPlan> = {
  cantu_plus: "plus",
};

export function utcMonthlyPeriod(at: Date = new Date()) {
  const year = at.getUTCFullYear();
  const month = at.getUTCMonth();
  const startsAt = new Date(Date.UTC(year, month, 1));
  const endsAt = new Date(Date.UTC(year, month + 1, 1));
  return { key: `${year}-${String(month + 1).padStart(2, "0")}`, startsAt, endsAt };
}

export function planQuota(plan: CantuPlan, operation: GuardedOperation) {
  return PLAN_ENTITLEMENTS[plan].monthly[operation];
}
