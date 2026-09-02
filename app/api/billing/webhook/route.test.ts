import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ construct: vi.fn(), apply: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/billing/config", () => ({ getBillingConfiguration: () => ({ webhookSecret: "whsec_test" }) }));
vi.mock("@/lib/providers/billing/factory", () => ({ createBillingProvider: () => ({ constructWebhookEvent: mocks.construct }) }));
vi.mock("@/lib/data/billing", () => ({ applyBillingWebhook: mocks.apply }));
vi.mock("@/lib/observability/safe-log", () => ({ createOperationId: () => "operation-id", safeOperationalLog: mocks.log }));
import { POST } from "./route";

function request(body = "{}", signature: string | null = "valid", length?: number) {
  const headers: Record<string, string> = {};
  if (signature) headers["stripe-signature"] = signature;
  if (length) headers["content-length"] = String(length);
  return new Request("https://cantu.test/api/billing/webhook", { method: "POST", headers, body });
}

describe("Stripe webhook route", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.apply.mockResolvedValue("applied"); });
  it("rejects missing and invalid signatures", async () => {
    expect((await POST(request("{}", null))).status).toBe(400);
    mocks.construct.mockImplementation(() => { throw new Error("invalid signature"); });
    expect((await POST(request())).status).toBe(400);
  });
  it("rejects an oversized body before provider work", async () => {
    expect((await POST(request("{}", "valid", 300_000))).status).toBe(413);
    expect(mocks.construct).not.toHaveBeenCalled();
  });
  it("processes a supported event once and logs no raw payload", async () => {
    const event = { eventId: "evt_safe", eventType: "checkout.session.completed", eventCreated: 1, customerId: "cus_safe" };
    mocks.construct.mockReturnValue(event);
    const response = await POST(request("private raw payload"));
    expect(response.status).toBe(200);
    expect(mocks.apply).toHaveBeenCalledWith(event);
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("private raw payload");
  });
  it("acknowledges unsupported signed events without persistence", async () => {
    mocks.construct.mockReturnValue(null);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.apply).not.toHaveBeenCalled();
  });
});
