import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import Stripe from "stripe";
import { StripeBillingProvider } from "./stripe";

const secret = "whsec_unit_test_only";
function payload(type = "customer.subscription.updated", created = 200) {
  return JSON.stringify({
    id: `evt_${created}`, object: "event", api_version: "2026-02-25.clover", created,
    type, livemode: false, pending_webhooks: 1, request: null,
    data: { object: { id: "sub_test", object: "subscription", customer: "cus_test", status: "active", cancel_at_period_end: false, items: { object: "list", data: [{ price: { id: "price_test" }, current_period_start: 1_788_220_800, current_period_end: 1_790_899_200 }] } } },
  });
}

describe("Stripe billing webhook adapter", () => {
  it("verifies the raw payload and normalizes an allowlisted subscription event", () => {
    const raw = payload();
    const signature = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret });
    const event = new StripeBillingProvider("sk_test_unit_only").constructWebhookEvent(raw, signature, secret);
    expect(event).toMatchObject({ eventType: "customer.subscription.updated", customerId: "cus_test", subscriptionId: "sub_test", status: "active" });
  });
  it("rejects an invalid signature", () => {
    expect(() => new StripeBillingProvider("sk_test_unit_only").constructWebhookEvent(payload(), "invalid", secret)).toThrow();
  });
  it("ignores unsupported event types after valid signature verification", () => {
    const raw = payload("invoice.created");
    const signature = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret });
    expect(new StripeBillingProvider("sk_test_unit_only").constructWebhookEvent(raw, signature, secret)).toBeNull();
  });
});
