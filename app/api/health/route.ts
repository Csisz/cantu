import { getServerSupabaseConfiguration, getServerSupabaseSecret, productionMockFlags } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicSupabase = getServerSupabaseConfiguration();
  const safe = process.env.NODE_ENV !== "production" || productionMockFlags().length === 0;
  return Response.json({
    status: safe ? "ok" : "misconfigured",
    checks: {
      publicDatabaseConfiguration: publicSupabase.configured,
      serverPersistenceConfiguration: Boolean(getServerSupabaseSecret()),
      speechProviderConfiguration: Boolean(process.env.OPENAI_API_KEY?.trim()),
      practiceStateSigning: Boolean(process.env.PRACTICE_STATE_SECRET?.trim()),
      productionMocksDisabled: safe,
    },
  }, { status: safe ? 200 : 503, headers: { "cache-control": "no-store" } });
}
