import { describe, expect, it } from "vitest";
import { PLAN_ENTITLEMENTS, planQuota, utcMonthlyPeriod } from "./plans";
import { checkoutRequestSchema, entitlementPlan } from "./types";

describe("Cantu plan entitlements", () => {
  it("keeps one centralized provisional quota matrix", () => {
    expect(planQuota("plus", "analysis")).toBeGreaterThan(planQuota("free", "analysis"));
    expect(PLAN_ENTITLEMENTS.free.monthly.practice).toBeGreaterThan(0);
  });
  it("maps only trusted payable states to Plus", () => {
    expect(entitlementPlan("active")).toBe("plus");
    expect(entitlementPlan("trialing")).toBe("plus");
    for (const status of ["past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"] as const) expect(entitlementPlan(status)).toBe("free");
  });
  it("uses stable UTC calendar-month boundaries", () => {
    expect(utcMonthlyPeriod(new Date("2026-12-31T23:59:59Z"))).toMatchObject({ key: "2026-12" });
    expect(utcMonthlyPeriod(new Date("2027-01-01T00:00:00Z")).startsAt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
  it("accepts only the internal Plus key, never a browser Price or amount", () => {
    expect(checkoutRequestSchema.safeParse({ plan: "cantu_plus" }).success).toBe(true);
    expect(checkoutRequestSchema.safeParse({ plan: "cantu_plus", priceId: "price_attacker", amount: 1 }).success).toBe(false);
  });
});
