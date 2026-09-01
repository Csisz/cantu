import { ZodError } from "zod";
import { getAuthContext } from "@/lib/data/auth";
import { submitPhraseReview } from "@/lib/data/review";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  if (exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.jsonRequestBytes)) return Response.json({ status: "error", message: "Túl nagy kérés." }, { status: 413 });
  try {
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") {
      return Response.json({ status: "unauthenticated", message: "Az ismétléshez jelentkezz be újra." }, { status: 401 });
    }
    const input = await request.json().catch(() => null);
    const result = await submitPhraseReview(auth, input);
    const status = result.status === "success" ? 200 : result.status === "unauthenticated" ? 401 : 400;
    return Response.json(result, { status });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ status: "error", message: "Érvénytelen ismétlési válasz." }, { status: 400 });
    }
    return Response.json({ status: "error", message: "Az ismétlést most nem sikerült menteni." }, { status: 500 });
  }
}
