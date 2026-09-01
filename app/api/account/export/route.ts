import { getAuthContext } from "@/lib/data/auth";
import { exportOwnedAccountData } from "@/lib/data/account";

export async function GET() {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") return Response.json({ error: { code: "unauthenticated" } }, { status: 401 });
  try {
    const body = JSON.stringify(await exportOwnedAccountData(auth), null, 2);
    return new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="cantu-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ error: { code: "export_unavailable" } }, { status: 503 });
  }
}
