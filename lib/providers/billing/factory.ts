import "server-only";

import { assertBillingConfiguration, isE2EBillingMockEnabled } from "@/lib/billing/config";
import type { BillingProvider } from "@/lib/billing/types";
import { StripeBillingProvider } from "./stripe";
import { TestBillingProvider } from "./test-provider";

export function createBillingProvider(): BillingProvider {
  if (isE2EBillingMockEnabled()) return new TestBillingProvider();
  const config = assertBillingConfiguration();
  return new StripeBillingProvider(config.secretKey);
}
