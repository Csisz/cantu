import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import { getBillingConfiguration, isE2EBillingMockEnabled } from "@/lib/billing/config";
import { applyE2EWebhook, ensureE2ECustomer, e2eUsageCount, getE2EBilling } from "@/lib/billing/e2e-store";
import { PLAN_ENTITLEMENTS, utcMonthlyPeriod, type CantuPlan } from "@/lib/billing/plans";
import { entitlementPlan, stripeSubscriptionStatusSchema, type BillingProvider, type BillingSnapshot, type NormalizedBillingWebhookEvent } from "@/lib/billing/types";
import { RATE_LIMIT_INVENTORY, type GuardedOperation } from "@/lib/security/limits";
import { createAdminClient } from "@/lib/supabase/admin";

const OPERATIONS = Object.keys(RATE_LIMIT_INVENTORY) as GuardedOperation[];

function requireUser(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new Error("Unauthenticated");
  return auth.user;
}

export async function getBillingSnapshot(auth: AuthContext): Promise<BillingSnapshot> {
  const config = getBillingConfiguration();
  const period = utcMonthlyPeriod();
  if (auth.status !== "authenticated") return {
    plan: "free", active: false, subscriptionStatus: null, cancelAtPeriodEnd: false,
    currentPeriodEnd: null, usagePeriod: { startsAt: period.startsAt.toISOString(), endsAt: period.endsAt.toISOString() },
    usage: OPERATIONS.map((operation) => ({ operation, used: 0, limit: PLAN_ENTITLEMENTS.free.monthly[operation], remaining: PLAN_ENTITLEMENTS.free.monthly[operation] })),
    billingMode: config.mode, priceLabel: config.plusPriceLabel,
  };
  let status: BillingSnapshot["subscriptionStatus"] = null;
  let cancelAtPeriodEnd = false;
  let currentPeriodEnd: string | null = null;
  let counts: number[];
  if (isE2EBillingMockEnabled()) {
    const row = getE2EBilling(auth.user.id);
    const parsed = stripeSubscriptionStatusSchema.safeParse(row?.status);
    status = parsed.success ? parsed.data : null;
    cancelAtPeriodEnd = row?.cancelAtPeriodEnd ?? false;
    currentPeriodEnd = row?.currentPeriodEnd ?? null;
    counts = OPERATIONS.map((operation) => e2eUsageCount(auth.user.id, operation, period.startsAt, period.endsAt));
  } else {
    const admin = createAdminClient();
    const [subscription, ...usage] = await Promise.all([
      admin.from("billing_subscriptions").select("status,cancel_at_period_end,current_period_end").eq("user_id", auth.user.id).maybeSingle(),
      ...OPERATIONS.map((operation) => admin.from("private_usage_events").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("operation", operation).gte("created_at", period.startsAt.toISOString()).lt("created_at", period.endsAt.toISOString())),
    ]);
    if (subscription.error || usage.some((item) => item.error)) throw new Error("Billing snapshot unavailable");
    const parsed = stripeSubscriptionStatusSchema.safeParse(subscription.data?.status);
    status = parsed.success ? parsed.data : null;
    cancelAtPeriodEnd = subscription.data?.cancel_at_period_end ?? false;
    currentPeriodEnd = subscription.data?.current_period_end ?? null;
    counts = usage.map((item) => item.count ?? 0);
  }
  if (currentPeriodEnd && new Date(currentPeriodEnd).getTime() <= Date.now()) status = null;
  const plan: CantuPlan = entitlementPlan(status);
  return {
    plan, active: plan === "plus", subscriptionStatus: status, cancelAtPeriodEnd, currentPeriodEnd,
    usagePeriod: { startsAt: period.startsAt.toISOString(), endsAt: period.endsAt.toISOString() },
    usage: OPERATIONS.map((operation, index) => {
      const limit = PLAN_ENTITLEMENTS[plan].monthly[operation];
      const used = counts[index] ?? 0;
      return { operation, used, limit, remaining: Math.max(0, limit - used) };
    }),
    billingMode: config.mode, priceLabel: config.plusPriceLabel,
  };
}

export async function getOrCreateBillingCustomer(auth: AuthContext, provider: BillingProvider) {
  const user = requireUser(auth);
  if (isE2EBillingMockEnabled()) return ensureE2ECustomer(user.id).customerId;
  const admin = createAdminClient();
  const existing = await admin.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (existing.error) throw new Error("Billing customer unavailable");
  if (existing.data) return existing.data.stripe_customer_id;
  const created = await provider.createCustomer({ email: user.email, userId: user.id, idempotencyKey: `cantu-customer-${user.id}` });
  const saved = await admin.from("billing_customers").upsert({ user_id: user.id, stripe_customer_id: created.customerId }, { onConflict: "user_id" }).select("stripe_customer_id").single();
  if (saved.error) throw new Error("Billing customer unavailable");
  return saved.data.stripe_customer_id;
}

export async function getOwnedBillingIds(auth: AuthContext) {
  const user = requireUser(auth);
  if (isE2EBillingMockEnabled()) {
    const row = getE2EBilling(user.id);
    return { customerId: row?.customerId ?? null, subscriptionIds: row?.subscriptionId ? [row.subscriptionId] : [] };
  }
  const admin = createAdminClient();
  const [customer, subscription] = await Promise.all([
    admin.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle(),
    admin.from("billing_subscriptions").select("stripe_subscription_id,status").eq("user_id", user.id).maybeSingle(),
  ]);
  if (customer.error || subscription.error) throw new Error("Billing state unavailable");
  const cancelable = subscription.data && !["canceled", "incomplete_expired"].includes(subscription.data.status);
  return { customerId: customer.data?.stripe_customer_id ?? null, subscriptionIds: cancelable ? [subscription.data!.stripe_subscription_id] : [] };
}

export async function applyBillingWebhook(event: NormalizedBillingWebhookEvent) {
  if (isE2EBillingMockEnabled()) return applyE2EWebhook(event);
  const admin = createAdminClient();
  if (event.eventType === "checkout.session.completed") {
    const result = await admin.rpc("record_stripe_checkout_event", { p_event_id: event.eventId, p_event_created: event.eventCreated });
    if (result.error) throw new Error("Webhook persistence failed");
    return result.data;
  }
  const result = await admin.rpc("apply_stripe_subscription_event", {
    p_event_id: event.eventId, p_event_type: event.eventType, p_event_created: event.eventCreated,
    p_customer_id: event.customerId, p_subscription_id: event.subscriptionId, p_price_id: event.priceId,
    p_status: event.status, p_period_start: event.currentPeriodStart as unknown as string,
    p_period_end: event.currentPeriodEnd as unknown as string, p_cancel_at_period_end: event.cancelAtPeriodEnd,
  });
  if (result.error) throw new Error("Webhook persistence failed");
  return result.data;
}
