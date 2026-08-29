import { z } from "zod";
import { getAuthContext } from "@/lib/data/auth";
import { verifyTranscriptCandidate } from "@/lib/data/learning-sessions";

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(["user_verified", "user_edited"]),
}).strict();

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") {
    return Response.json({ error: { code: "unauthenticated" } }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: { code: "invalid_audio" } }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: { code: "invalid_audio" } }, { status: 400 });
  const updated = await verifyTranscriptCandidate(auth, parsed.data.sessionId, parsed.data.status);
  if (!updated) return Response.json({ error: { code: "transcription_failed" } }, { status: 409 });
  return Response.json({ ok: true });
}
