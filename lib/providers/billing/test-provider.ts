import "server-only";

import { ensureE2ECustomer, signE2EWebhook } from "@/lib/billing/e2e-store";
import type { BillingProvider, NormalizedBillingWebhookEvent } from "@/lib/billing/types";

export class TestBillingProvider implements BillingProvider {
  readonly name = "cantu-test-billing";
  async createCustomer(input: { email: string; userId: string; idempotencyKey: string }) {
    return { customerId: ensureE2ECustomer(input.userId).customerId };
  }
  async createCheckoutSession() { return { url: "/app?billing=mock-checkout" }; }
  async createCustomerPortalSession() { return { url: "/app?billing=mock-portal" }; }
  async cancelSubscriptionsForAccountDeletion() { return; }
  constructWebhookEvent(payload: string, signature: string, secret: string): NormalizedBillingWebhookEvent | null {
    if (signature !== signE2EWebhook(payload, secret)) throw new Error("invalid_signature");
    return JSON.parse(payload) as NormalizedBillingWebhookEvent;
  }
}
