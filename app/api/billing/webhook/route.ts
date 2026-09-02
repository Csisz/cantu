import { getBillingConfiguration } from "@/lib/billing/config";
import { applyBillingWebhook } from "@/lib/data/billing";
import { createOperationId, safeOperationalLog } from "@/lib/observability/safe-log";
import { createBillingProvider } from "@/lib/providers/billing/factory";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createOperationId();
  if (exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.billingWebhookBytes)) return Response.json({ error: { code: "payload_too_large" } }, { status: 413 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: { code: "invalid_signature" } }, { status: 400 });
  try {
    const payload = await request.text();
    if (new TextEncoder().encode(payload).byteLength > PUBLIC_BETA_LIMITS.billingWebhookBytes) return Response.json({ error: { code: "payload_too_large" } }, { status: 413 });
    const secret = getBillingConfiguration().webhookSecret;
    if (!secret) throw new Error("not_configured");
    const event = createBillingProvider().constructWebhookEvent(payload, signature, secret);
    if (!event) return Response.json({ received: true, ignored: true });
    const outcome = await applyBillingWebhook(event);
    safeOperationalLog({ operation: "billing_webhook", status: "succeeded", requestId, provider: "stripe" });
    return Response.json({ received: true, outcome });
  } catch {
    safeOperationalLog({ operation: "billing_webhook", status: "failed", requestId, provider: "stripe", errorCode: "webhook_rejected" });
    return Response.json({ error: { code: "webhook_rejected" } }, { status: 400 });
  }
}
