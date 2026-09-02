import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assertBillingConfiguration, getBillingMode, isE2EBillingMockEnabled } from "./config";

describe("billing configuration", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("defaults safely to disabled", () => { vi.stubEnv("CANTU_BILLING_MODE", ""); expect(getBillingMode()).toBe("disabled"); expect(() => assertBillingConfiguration()).toThrow(/billing_disabled/); });
  it("accepts complete test configuration", () => {
    vi.stubEnv("CANTU_BILLING_MODE", "test"); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder"); vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder"); vi.stubEnv("STRIPE_PRICE_ID_CANTU_PLUS", "price_test");
    expect(assertBillingConfiguration().mode).toBe("test");
  });
  it("rejects obvious test/live key mismatch and production mocks", () => {
    vi.stubEnv("CANTU_BILLING_MODE", "live"); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder"); vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder"); vi.stubEnv("STRIPE_PRICE_ID_CANTU_PLUS", "price_live");
    expect(() => assertBillingConfiguration()).toThrow(/billing_not_configured/);
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("CANTU_E2E_BILLING_MOCK", "1"); expect(isE2EBillingMockEnabled()).toBe(false);
  });
});
