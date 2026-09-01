import { getAuthContext } from "@/lib/data/auth";
import { saveLearningProgress } from "@/lib/data/learning-experience";
import { progressMutationSchema } from "@/lib/learning/player";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  if (exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.jsonRequestBytes)) return Response.json({ status: "error", message: "Túl nagy kérés." }, { status: 413 });
  try {
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") {
      return Response.json({ status: "unauthenticated", message: "A haladás mentéséhez jelentkezz be újra." }, { status: 401 });
    }
    const input = await request.json().catch(() => null);
    const parsed = progressMutationSchema.safeParse(input);
    if (!parsed.success) {
      return Response.json({ status: "error", message: "Érvénytelen haladási adat." }, { status: 400 });
    }
    const result = await saveLearningProgress(auth, parsed.data);
    return Response.json(result, { status: result.status === "success" ? 200 : 400 });
  } catch {
    return Response.json({ status: "error", message: "A haladást most nem sikerült menteni. A lecke ettől még folytatható." }, { status: 500 });
  }
}
