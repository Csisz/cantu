import { z } from "zod";

const publicSupabaseEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .trim()
      .url("A Supabase projekt URL-je nem érvényes URL."),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
      .string()
      .trim()
      .min(16, "A Supabase publishable kulcs hiányzik vagy túl rövid."),
  })
  .strict();

export type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

export type SupabaseConfigurationStatus =
  | { configured: true; env: PublicSupabaseEnv }
  | { configured: false; reason: "missing" | "invalid" };

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "A Supabase konfiguráció hiányzik vagy érvénytelen. Ellenőrizd a NEXT_PUBLIC_SUPABASE_URL és NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY változókat.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

export function parsePublicSupabaseEnv(input: unknown): PublicSupabaseEnv {
  const result = publicSupabaseEnvSchema.safeParse(input);
  if (!result.success) throw new SupabaseConfigurationError();

  return {
    url: result.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function inspectPublicSupabaseEnv(input: {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}): SupabaseConfigurationStatus {
  const url = input.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url && !publishableKey) return { configured: false, reason: "missing" };

  try {
    return {
      configured: true,
      env: parsePublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      }),
    };
  } catch {
    return { configured: false, reason: "invalid" };
  }
}
