import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assertSafeServerConfiguration, getPracticeStateSecret, isE2EPracticeMockEnabled } from "./server";

describe("production configuration hardening", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("never enables an E2E provider in production", () => { vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("CANTU_E2E_PRACTICE_MOCK", "1"); expect(isE2EPracticeMockEnabled()).toBe(false); expect(() => assertSafeServerConfiguration()).toThrow(/Unsafe test/); });
  it("requires a dedicated production practice signing secret", () => { vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("CANTU_E2E_PRACTICE_MOCK", "0"); vi.stubEnv("PRACTICE_STATE_SECRET", ""); expect(getPracticeStateSecret()).toBeNull(); expect(() => assertSafeServerConfiguration()).toThrow(/PRACTICE_STATE_SECRET/); });
  it("accepts a separate strong signing secret", () => { vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("PRACTICE_STATE_SECRET", "a".repeat(48)); expect(getPracticeStateSecret()).toBe("a".repeat(48)); expect(() => assertSafeServerConfiguration()).not.toThrow(); });
  it("rejects billing mocks and incoherent live keys in production", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("PRACTICE_STATE_SECRET", "a".repeat(48));
    vi.stubEnv("CANTU_E2E_BILLING_MOCK", "1");
    expect(() => assertSafeServerConfiguration()).toThrow(/Unsafe test/);
    vi.stubEnv("CANTU_E2E_BILLING_MOCK", "0"); vi.stubEnv("CANTU_BILLING_MODE", "live");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder"); vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder"); vi.stubEnv("STRIPE_PRICE_ID_CANTU_PLUS", "price_placeholder");
    expect(() => assertSafeServerConfiguration()).toThrow(/conflict/);
  });
});
