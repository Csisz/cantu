import { ZodError } from "zod";
import { analyzeVerifiedSource } from "@/lib/analysis/service";
import { analysisRequestSchema } from "@/lib/analysis/validation";
import { getAuthContext } from "@/lib/data/auth";
import { reserveProviderUsage } from "@/lib/data/usage";
import { createLanguageAnalysisProvider } from "@/lib/providers/analysis/factory";
import { AnalysisError, type AnalysisErrorCode } from "@/lib/providers/analysis/types";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 45;

const statusByCode: Record<AnalysisErrorCode, number> = {
  invalid_source: 400,
  source_not_verified: 400,
  unauthenticated: 401,
  not_configured: 503,
  rate_limited: 429,
  quota_exceeded: 402,
  provider_unavailable: 503,
  provider_timeout: 504,
  invalid_provider_response: 502,
  analysis_invalid: 502,
  unsupported_language: 422,
  session_not_found: 404,
  source_context_mismatch: 409,
  analysis_in_progress: 409,
};

function errorResponse(error: unknown) {
  const normalized = error instanceof AnalysisError
    ? error
    : new AnalysisError(error instanceof ZodError || error instanceof SyntaxError
      ? "invalid_source"
      : "provider_unavailable");
  return Response.json(
    { error: { code: normalized.code } },
    { status: statusByCode[normalized.code] },
  );
}

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return errorResponse(new AnalysisError("invalid_source"));
  }
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") return errorResponse(new AnalysisError("unauthenticated"));

  try {
    if (exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.jsonRequestBytes)) {
      throw new AnalysisError("invalid_source");
    }
    const input = analysisRequestSchema.parse(await request.json());
    const provider = createLanguageAnalysisProvider();
    return Response.json(await analyzeVerifiedSource(auth, input, provider, request.signal, async () => {
      const usage = await reserveProviderUsage(auth.user.id, "analysis");
      return usage.allowed ? "reserved" : usage.reason === "duplicate_request" ? "rate_limited" : usage.reason;
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
