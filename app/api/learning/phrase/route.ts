import { getAuthContext } from "@/lib/data/auth";
import { savePhrasebookChunk } from "@/lib/data/learning-experience";
import { phraseSaveReferenceSchema } from "@/lib/learning/player";

export async function POST(request: Request) {
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
