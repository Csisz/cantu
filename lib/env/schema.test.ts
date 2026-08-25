import { describe, expect, it } from "vitest";
import {
  inspectPublicSupabaseEnv,
  parsePublicSupabaseEnv,
  SupabaseConfigurationError,
} from "./schema";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_for_tests",
};

describe("Supabase environment validation", () => {
  it("accepts and minimizes valid browser-safe configuration", () => {
    const parsed = parsePublicSupabaseEnv(validEnv);

    expect(parsed).toEqual({
      url: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: validEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    expect(Object.keys(parsed)).toEqual(["url", "publishableKey"]);
    expect(parsed).not.toHaveProperty("serviceRoleKey");
  });

  it("rejects missing or partial required values without echoing values", () => {
    expect(() => parsePublicSupabaseEnv({})).toThrow(SupabaseConfigurationError);
    expect(inspectPublicSupabaseEnv({})).toEqual({
      configured: false,
      reason: "missing",
    });
    expect(
      inspectPublicSupabaseEnv({ NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL }),
    ).toEqual({ configured: false, reason: "invalid" });
  });

  it("does not accept server-only fields through the public schema", () => {
    expect(() =>
      parsePublicSupabaseEnv({
        ...validEnv,
        SUPABASE_SERVICE_ROLE_KEY: "server-only-test-value",
      }),
    ).toThrow(SupabaseConfigurationError);
  });
});
