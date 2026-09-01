import { ZodError } from "zod";
import { getAuthContext } from "@/lib/data/auth";
import { getPracticeStateSecret } from "@/lib/env/server";
import { practiceRequestSchema } from "@/lib/practice/types";
import { respondToConversationPractice, startConversationPractice } from "@/lib/practice/service";
import { createConversationPracticeProvider } from "@/lib/providers/practice/factory";
import { PracticeError, type PracticeErrorCode } from "@/lib/providers/practice/types";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 35;

const statusByCode: Record<PracticeErrorCode, number> = {
  unauthenticated: 401,
  invalid_request: 400,
  no_saved_phrases: 422,
  session_invalid: 400,
  session_expired: 400,
  target_not_found: 404,
  turn_limit_reached: 409,
  duplicate_request: 409,
  not_configured: 503,
  rate_limited: 429,
  provider_unavailable: 503,
  provider_timeout: 504,
  invalid_provider_response: 502,
  practice_invalid: 502,
};

function errorResponse(error: unknown) {
  const normalized = error instanceof PracticeError
    ? error
    : new PracticeError(error instanceof ZodError || error instanceof SyntaxError ? "invalid_request" : "provider_unavailable");
  return Response.json({ error: { code: normalized.code } }, { status: statusByCode[normalized.code] });
}

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return errorResponse(new PracticeError("invalid_request"));
  }
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") return errorResponse(new PracticeError("unauthenticated"));
  try {
    if (exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.jsonRequestBytes)) throw new PracticeError("invalid_request");
    const secret = getPracticeStateSecret();
    if (!secret) throw new PracticeError("not_configured");
    const input = practiceRequestSchema.parse(await request.json());
    const provider = createConversationPracticeProvider();
    const output = input.action === "start"
      ? await startConversationPractice(auth, input.scenarioId, provider, secret, request.signal)
      : await respondToConversationPractice(auth, input.stateToken, input.learnerResponse, provider, secret, request.signal);
    return Response.json(output);
  } catch (error) {
    return errorResponse(error);
  }
}
