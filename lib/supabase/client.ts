import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env/client";
import type { Database } from "./database.types";

export function createClient() {
  const env = getPublicSupabaseEnv();
  return createBrowserClient<Database>(env.url, env.publishableKey);
}
