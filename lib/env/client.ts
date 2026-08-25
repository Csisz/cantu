import {
  inspectPublicSupabaseEnv,
  parsePublicSupabaseEnv,
  type SupabaseConfigurationStatus,
} from "./schema";

function publicValues() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getPublicSupabaseEnv() {
  return parsePublicSupabaseEnv(publicValues());
}

export function getPublicSupabaseConfiguration(): SupabaseConfigurationStatus {
  return inspectPublicSupabaseEnv(publicValues());
}
