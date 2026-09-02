import { createHmac } from "node:crypto";
import type { GuardedOperation } from "@/lib/security/limits";
import { PLAN_ENTITLEMENTS, utcMonthlyPeriod, type CantuPlan } from "./plans";
import { entitlementPlan, stripeSubscriptionStatusSchema, type NormalizedBillingWebhookEvent } from "./types";

type E2EBilling = {
  userId: string;
  customerId: string;
  subscriptionId: string | null;
  priceId: string | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  latestEventCreated: number;
};
type E2EUsage = { userId: string; operation: GuardedOperation; nonce: string; createdAt: string };
const billingKey = "__cantuE2EBilling";
const usageKey = "__cantuE2EBillingUsage";
const eventKey = "__cantuE2EBillingEvents";
const root = globalThis as typeof globalThis & Record<string, unknown>;
const billings = () => (root[billingKey] ??= []) as E2EBilling[];
const usages = () => (root[usageKey] ??= []) as E2EUsage[];
const events = () => (root[eventKey] ??= new Set<string>()) as Set<string>;

export function getE2EBilling(userId: string) {
  return billings().find((row) => row.userId === userId) ?? null;
}

export function ensureE2ECustomer(userId: string) {
  let row = getE2EBilling(userId);
  if (!row) {
    row = { userId, customerId: `cus_cantu_${userId}`, subscriptionId: null, priceId: null, status: null, cancelAtPeriodEnd: false, currentPeriodEnd: null, latestEventCreated: 0 };
    billings().push(row);
  }
  return row;
}

export function clearE2EBilling(userId: string) {
  root[billingKey] = billings().filter((row) => row.userId !== userId);
  root[usageKey] = usages().filter((row) => row.userId !== userId);
  // Test logins are isolated disposable accounts. Reset mock webhook receipts
  // so the same deterministic fixtures can run independently per viewport.
  root[eventKey] = new Set<string>();
}

export function reserveE2EUsage(userId: string, operation: GuardedOperation, nonce: string, hourlyLimit: number) {
  if (usages().some((row) => row.userId === userId && row.operation === operation && row.nonce === nonce)) return { allowed: false, reason: "duplicate_request" as const };
  const now = new Date();
  const hour = usages().filter((row) => row.userId === userId && row.operation === operation && new Date(row.createdAt).getTime() > now.getTime() - 3_600_000).length;
  if (hour >= hourlyLimit) return { allowed: false, reason: "rate_limited" as const };
  const billing = getE2EBilling(userId);
  const parsed = stripeSubscriptionStatusSchema.safeParse(billing?.status);
  const plan: CantuPlan = parsed.success ? entitlementPlan(parsed.data) : "free";
  const period = utcMonthlyPeriod(now);
  const used = usages().filter((row) => row.userId === userId && row.operation === operation && new Date(row.createdAt) >= period.startsAt && new Date(row.createdAt) < period.endsAt).length;
  const limit = PLAN_ENTITLEMENTS[plan].monthly[operation];
  if (used >= limit) return { allowed: false, reason: "quota_exceeded" as const, plan, used, limit };
  usages().push({ userId, operation, nonce, createdAt: now.toISOString() });
  return { allowed: true, reason: "reserved" as const, plan, used: used + 1, limit };
}

export function e2eUsageCount(userId: string, operation: GuardedOperation, startsAt: Date, endsAt: Date) {
  return usages().filter((row) => row.userId === userId && row.operation === operation && new Date(row.createdAt) >= startsAt && new Date(row.createdAt) < endsAt).length;
}

export function signE2EWebhook(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function applyE2EWebhook(event: NormalizedBillingWebhookEvent) {
  if (events().has(event.eventId)) return "duplicate";
  events().add(event.eventId);
  if (event.eventType === "checkout.session.completed") return "recorded";
  const row = billings().find((item) => item.customerId === event.customerId);
  if (!row) throw new Error("billing_customer_not_found");
  if (row.latestEventCreated > event.eventCreated) return "stale";
  Object.assign(row, { subscriptionId: event.subscriptionId, priceId: event.priceId, status: event.status, cancelAtPeriodEnd: event.cancelAtPeriodEnd, currentPeriodEnd: event.currentPeriodEnd, latestEventCreated: event.eventCreated });
  return "applied";
}
