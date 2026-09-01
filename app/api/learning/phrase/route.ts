import { getAuthContext } from "@/lib/data/auth";
import { savePhrasebookChunk } from "@/lib/data/learning-experience";
import { deletePhrasebookItem } from "@/lib/data/review";
import { phraseSaveReferenceSchema } from "@/lib/learning/player";
import { PUBLIC_BETA_LIMITS } from "@/lib/security/limits";
import { exceedsDeclaredBodyLimit, rejectUntrustedMutation } from "@/lib/security/request";

export async function POST(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  if (exceedsDeclaredBodyLimit(request, PUBLIC_BETA_LIMITS.jsonRequestBytes)) return Response.json({ status: "error", message: "Túl nagy kérés." }, { status: 413 });
  try {
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") {
      return Response.json({ status: "unauthenticated", message: "A kifejezés mentéséhez jelentkezz be újra." }, { status: 401 });
    }
    const input = await request.json().catch(() => null);
    const parsed = phraseSaveReferenceSchema.safeParse(input);
    if (!parsed.success) {
      return Response.json({ status: "error", message: "Érvénytelen kifejezéshivatkozás." }, { status: 400 });
    }
    const result = await savePhrasebookChunk(auth, parsed.data);
    return Response.json(result, { status: result.status === "success" ? 200 : 400 });
  } catch {
    return Response.json({ status: "error", message: "A kifejezést most nem sikerült elmenteni. Próbáld újra." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") {
      return Response.json({ status: "unauthenticated", message: "A törléshez jelentkezz be újra." }, { status: 401 });
    }
    const input = await request.json().catch(() => null) as { phraseId?: unknown } | null;
    const result = await deletePhrasebookItem(auth, input?.phraseId);
    return Response.json(result, { status: result.status === "success" ? 200 : 400 });
  } catch {
    return Response.json({ status: "error", message: "A kifejezést most nem sikerült törölni." }, { status: 500 });
  }
}
