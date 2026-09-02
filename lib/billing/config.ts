import "server-only";

import { BillingError } from "./types";

export type BillingMode = "disabled" | "test" | "live";

export function getBillingMode(): BillingMode {
  const value = process.env.CANTU_BILLING_MODE?.trim();
  return value === "test" || value === "live" ? value : "disabled";
}

export function isE2EBillingMockEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.CANTU_E2E_BILLING_MOCK === "1";
}

export function getBillingConfiguration() {
  const mode = getBillingMode();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || null;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
  const plusPriceId = process.env.STRIPE_PRICE_ID_CANTU_PLUS?.trim() || null;
  const plusPriceLabel = process.env.CANTU_PLUS_PRICE_LABEL?.trim() || null;
  return { mode, secretKey, webhookSecret, plusPriceId, plusPriceLabel };
}

export function assertBillingConfiguration(): ReturnType<typeof getBillingConfiguration> & { mode: "test" | "live"; secretKey: string; webhookSecret: string; plusPriceId: string } {
  const config = getBillingConfiguration();
  if (config.mode === "disabled") throw new BillingError("billing_disabled");
  if (!config.secretKey || !config.webhookSecret || !config.plusPriceId) {
    throw new BillingError("billing_not_configured");
  }
  if (config.mode === "test" && config.secretKey.startsWith("sk_live_")) {
    throw new BillingError("billing_not_configured");
  }
  if (config.mode === "live" && config.secretKey.startsWith("sk_test_")) {
    throw new BillingError("billing_not_configured");
  }
  return config as ReturnType<typeof getBillingConfiguration> & { mode: "test" | "live"; secretKey: string; webhookSecret: string; plusPriceId: string };
}
