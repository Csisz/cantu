import { z } from "zod";
import type { GuardedOperation } from "@/lib/security/limits";
import type { CantuPlan } from "./plans";

export const stripeSubscriptionStatusSchema = z.enum([
  "active", "trialing", "past_due", "canceled", "unpaid",
  "incomplete", "incomplete_expired", "paused",
]);
export type StripeSubscriptionStatus = z.infer<typeof stripeSubscriptionStatusSchema>;

export const PLUS_ENTITLED_STATUSES = new Set<StripeSubscriptionStatus>(["active", "trialing"]);

export function entitlementPlan(status: StripeSubscriptionStatus | null): CantuPlan {
  return status && PLUS_ENTITLED_STATUSES.has(status) ? "plus" : "free";
}

export type UsageLine = { operation: GuardedOperation; used: number; limit: number; remaining: number };
export type BillingSnapshot = {
  plan: CantuPlan;
  active: boolean;
  subscriptionStatus: StripeSubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  usagePeriod: { startsAt: string; endsAt: string };
  usage: UsageLine[];
  billingMode: "disabled" | "test" | "live";
  priceLabel: string | null;
};

export const checkoutRequestSchema = z.object({ plan: z.literal("cantu_plus") }).strict();

export type CheckoutSessionInput = {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
};

export type NormalizedSubscriptionEvent = {
  eventId: string;
  eventType: "customer.subscription.created" | "customer.subscription.updated" | "customer.subscription.deleted";
  eventCreated: number;
  customerId: string;
  subscriptionId: string;
  priceId: string;
  status: StripeSubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type NormalizedBillingWebhookEvent =
  | NormalizedSubscriptionEvent
  | { eventId: string; eventType: "checkout.session.completed"; eventCreated: number; customerId: string | null };

export interface BillingProvider {
  readonly name: string;
  createCustomer(input: { email: string; userId: string; idempotencyKey: string }): Promise<{ customerId: string }>;
  createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string }>;
  createCustomerPortalSession(input: { customerId: string; returnUrl: string }): Promise<{ url: string }>;
  cancelSubscriptionsForAccountDeletion(input: { subscriptionIds: string[] }): Promise<void>;
  constructWebhookEvent(payload: string, signature: string, secret: string): NormalizedBillingWebhookEvent | null;
}

export type BillingErrorCode =
  | "unauthenticated" | "billing_disabled" | "billing_not_configured"
  | "invalid_request" | "invalid_signature" | "payload_too_large"
  | "billing_unavailable" | "already_subscribed" | "subscription_not_found";

export class BillingError extends Error {
  constructor(public readonly code: BillingErrorCode, message = code) {
    super(message);
    this.name = "BillingError";
  }
}
