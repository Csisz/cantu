import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/billing", () => ({ getOwnedBillingIds: vi.fn(async () => ({ customerId: "cus", subscriptionIds: ["sub"] })) }));
import { cancelBillingBeforeAccountDeletion } from "./service";
import type { BillingProvider } from "./types";

const auth = { status: "authenticated", configured: true, user: { id: "00000000-0000-0000-0000-000000000001", email: "a@example.com", displayName: null } } as const;
describe("paid account deletion coordination", () => {
  it("cancels billing before deletion may continue", async () => {
    const cancel = vi.fn(async () => undefined);
    await cancelBillingBeforeAccountDeletion(auth, { cancelSubscriptionsForAccountDeletion: cancel } as unknown as BillingProvider);
    expect(cancel).toHaveBeenCalledWith({ subscriptionIds: ["sub"] });
  });
  it("fails closed when Stripe cancellation fails", async () => {
    const provider = { cancelSubscriptionsForAccountDeletion: vi.fn(async () => { throw new Error("stripe down"); }) } as unknown as BillingProvider;
    await expect(cancelBillingBeforeAccountDeletion(auth, provider)).rejects.toThrow("stripe down");
  });
});
