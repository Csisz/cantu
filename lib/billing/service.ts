import "server-only";

import type { AuthContext } from "@/lib/auth/types";
import { assertBillingConfiguration, getBillingConfiguration } from "./config";
import { BillingError, type BillingProvider } from "./types";
import { getBillingSnapshot, getOrCreateBillingCustomer, getOwnedBillingIds } from "@/lib/data/billing";

function requireAuth(auth: AuthContext) {
  if (auth.status !== "authenticated") throw new BillingError("unauthenticated");
  return auth.user;
}

function appOrigin() {
  const configured = process.env.APP_ORIGIN?.trim() || "http://localhost:3000";
  const parsed = new URL(configured);
  if (!/^https?:$/.test(parsed.protocol)) throw new BillingError("billing_not_configured");
  return parsed.origin;
}

export async function createUpgradeCheckout(auth: AuthContext, provider: BillingProvider) {
  const user = requireAuth(auth);
  const config = assertBillingConfiguration();
  const snapshot = await getBillingSnapshot(auth);
  if (snapshot.subscriptionStatus && !["canceled", "incomplete_expired"].includes(snapshot.subscriptionStatus)) {
    throw new BillingError("already_subscribed");
  }
  const customerId = await getOrCreateBillingCustomer(auth, provider);
  const hour = new Date().toISOString().slice(0, 13);
  return provider.createCheckoutSession({
    customerId,
    priceId: config.plusPriceId,
    successUrl: `${appOrigin()}/app?billing=success`,
    cancelUrl: `${appOrigin()}/pricing?billing=cancelled`,
    idempotencyKey: `cantu-checkout-${user.id}-${hour}`,
  });
}

export async function createBillingPortal(auth: AuthContext, provider: BillingProvider) {
  requireAuth(auth);
  if (getBillingConfiguration().mode === "disabled") throw new BillingError("billing_disabled");
  const ids = await getOwnedBillingIds(auth);
  if (!ids.customerId) throw new BillingError("subscription_not_found");
  return provider.createCustomerPortalSession({ customerId: ids.customerId, returnUrl: `${appOrigin()}/app` });
}

export async function cancelBillingBeforeAccountDeletion(auth: AuthContext, provider: BillingProvider | (() => BillingProvider) | null) {
  requireAuth(auth);
  const ids = await getOwnedBillingIds(auth);
  if (!ids.subscriptionIds.length) return;
  if (!provider) throw new BillingError("billing_not_configured");
  const resolved = typeof provider === "function" ? provider() : provider;
  if (!resolved) throw new BillingError("billing_not_configured");
  await resolved.cancelSubscriptionsForAccountDeletion({ subscriptionIds: ids.subscriptionIds });
}
