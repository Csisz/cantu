import { describe, expect, it } from "vitest";
import { applyE2EWebhook, clearE2EBilling, ensureE2ECustomer, reserveE2EUsage } from "./e2e-store";
import { PLAN_ENTITLEMENTS } from "./plans";

describe("deterministic billing/usage store", () => {
  it("enforces Free quota atomically and keeps hourly limits separate", () => {
    const user = "quota-user"; clearE2EBilling(user);
    for (let i = 0; i < PLAN_ENTITLEMENTS.free.monthly.analysis; i += 1) expect(reserveE2EUsage(user, "analysis", `n-${i}`, 100).allowed).toBe(true);
    expect(reserveE2EUsage(user, "analysis", "over", 100)).toMatchObject({ allowed: false, reason: "quota_exceeded" });
    expect(reserveE2EUsage("hourly-user", "analysis", "one", 1).allowed).toBe(true);
    expect(reserveE2EUsage("hourly-user", "analysis", "two", 1)).toMatchObject({ allowed: false, reason: "rate_limited" });
  });
  it("uses trusted events for Free to Plus and rejects replay/out-of-order downgrade", () => {
    const user = "event-user"; clearE2EBilling(user); const customer = ensureE2ECustomer(user);
    const base = { customerId: customer.customerId, subscriptionId: "sub", priceId: "price", currentPeriodStart: null, currentPeriodEnd: "2099-01-01T00:00:00.000Z", cancelAtPeriodEnd: false } as const;
    expect(applyE2EWebhook({ ...base, eventId: "new", eventType: "customer.subscription.updated", eventCreated: 200, status: "active" })).toBe("applied");
    expect(applyE2EWebhook({ ...base, eventId: "new", eventType: "customer.subscription.updated", eventCreated: 200, status: "active" })).toBe("duplicate");
    expect(applyE2EWebhook({ ...base, eventId: "old", eventType: "customer.subscription.deleted", eventCreated: 100, status: "canceled" })).toBe("stale");
    expect(reserveE2EUsage(user, "analysis", "plus", 100)).toMatchObject({ allowed: true, plan: "plus", limit: PLAN_ENTITLEMENTS.plus.monthly.analysis });
  });
});
