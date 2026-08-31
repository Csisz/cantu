import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env/client";
import { getServerSupabaseSecret } from "@/lib/env/server";
import type { Database } from "./database.types";

export function createAdminClient() {
  const secret = getServerSupabaseSecret();
  if (!secret) throw new Error("Server persistence is not configured");
  const env = getPublicSupabaseEnv();
  return createSupabaseClient<Database>(env.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
