import "server-only";

import Stripe from "stripe";
import { stripeSubscriptionStatusSchema, type BillingProvider, type NormalizedBillingWebhookEvent } from "@/lib/billing/types";

const ALLOWED_EVENTS = new Set([
  "checkout.session.completed", "customer.subscription.created",
  "customer.subscription.updated", "customer.subscription.deleted",
]);

function identifier(value: string | { id: string } | null): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

export class StripeBillingProvider implements BillingProvider {
  readonly name = "stripe";
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { maxNetworkRetries: 0, timeout: 20_000 });
  }

  async createCustomer(input: { email: string; userId: string; idempotencyKey: string }) {
    const customer = await this.stripe.customers.create({ email: input.email, metadata: { cantu_user_id: input.userId } }, { idempotencyKey: input.idempotencyKey });
    return { customerId: customer.id };
  }

  async createCheckoutSession(input: Parameters<BillingProvider["createCheckoutSession"]>[0]) {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: input.customerId,
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      allow_promotion_codes: false,
    }, { idempotencyKey: input.idempotencyKey });
    if (!session.url) throw new Error("checkout_url_missing");
    return { url: session.url };
  }

  async createCustomerPortalSession(input: { customerId: string; returnUrl: string }) {
    const session = await this.stripe.billingPortal.sessions.create({ customer: input.customerId, return_url: input.returnUrl });
    return { url: session.url };
  }

  async cancelSubscriptionsForAccountDeletion(input: { subscriptionIds: string[] }) {
    for (const subscriptionId of input.subscriptionIds) await this.stripe.subscriptions.cancel(subscriptionId);
  }

  constructWebhookEvent(payload: string, signature: string, secret: string): NormalizedBillingWebhookEvent | null {
    const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    if (!ALLOWED_EVENTS.has(event.type)) return null;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      return { eventId: event.id, eventType: event.type, eventCreated: event.created, customerId: identifier(session.customer) };
    }
    const subscription = event.data.object as Stripe.Subscription;
    const status = stripeSubscriptionStatusSchema.safeParse(subscription.status);
    const customerId = identifier(subscription.customer);
    const item = subscription.items.data[0];
    if (!status.success || !customerId || !item?.price.id) return null;
    const eventType = event.type as "customer.subscription.created" | "customer.subscription.updated" | "customer.subscription.deleted";
    return {
      eventId: event.id,
      eventType,
      eventCreated: event.created,
      customerId,
      subscriptionId: subscription.id,
      priceId: item.price.id,
      status: status.data,
      currentPeriodStart: item.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null,
      currentPeriodEnd: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }
}
