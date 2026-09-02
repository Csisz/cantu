import { ZodError } from "zod";
import { createUpgradeCheckout } from "@/lib/billing/service";
import { BillingError, checkoutRequestSchema } from "@/lib/billing/types";
import { getAuthContext } from "@/lib/data/auth";
import { createBillingProvider } from "@/lib/providers/billing/factory";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export const runtime = "nodejs";
const status: Record<string, number> = { unauthenticated: 401, invalid_request: 400, billing_disabled: 503, billing_not_configured: 503, already_subscribed: 409, billing_unavailable: 503 };

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json") || exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.jsonRequestBytes)) throw new BillingError("invalid_request");
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") throw new BillingError("unauthenticated");
    checkoutRequestSchema.parse(await request.json());
    return Response.json(await createUpgradeCheckout(auth, createBillingProvider()));
  } catch (error) {
    const normalized = error instanceof BillingError ? error : new BillingError(error instanceof ZodError || error instanceof SyntaxError ? "invalid_request" : "billing_unavailable");
    return Response.json({ error: { code: normalized.code } }, { status: status[normalized.code] ?? 503 });
  }
}
