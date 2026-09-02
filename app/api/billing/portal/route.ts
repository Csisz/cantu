import { createBillingPortal } from "@/lib/billing/service";
import { BillingError } from "@/lib/billing/types";
import { getAuthContext } from "@/lib/data/auth";
import { createBillingProvider } from "@/lib/providers/billing/factory";
import { rejectUntrustedMutation } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") throw new BillingError("unauthenticated");
    return Response.json(await createBillingPortal(auth, createBillingProvider()));
  } catch (error) {
    const code = error instanceof BillingError ? error.code : "billing_unavailable";
    return Response.json({ error: { code } }, { status: code === "unauthenticated" ? 401 : code === "subscription_not_found" ? 404 : 503 });
  }
}
