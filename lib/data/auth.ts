import "server-only";

import { cache } from "react";
import { getServerSupabaseConfiguration, isE2EAuthMockEnabled } from "@/lib/env/server";
import { getE2EAuthUser } from "@/lib/auth/e2e-session";
import type { AuthContext } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

function claimString(claims: Record<string, unknown>, key: string) {
  const value = claims[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  if (isE2EAuthMockEnabled()) {
    const user = await getE2EAuthUser();
    return user
      ? { status: "authenticated", configured: true, user }
      : { status: "unauthenticated", configured: true };
  }

  const configuration = getServerSupabaseConfiguration();
  if (!configuration.configured) {
    return { status: "unauthenticated", configured: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return { status: "unauthenticated", configured: true };
  }

  const claims = data.claims as Record<string, unknown>;
  const id = claimString(claims, "sub");
  const email = claimString(claims, "email");
  if (!id || !email) return { status: "unauthenticated", configured: true };

  const metadata =
    typeof claims.user_metadata === "object" && claims.user_metadata
      ? (claims.user_metadata as Record<string, unknown>)
      : {};
  const displayName = claimString(metadata, "display_name");

  return {
    status: "authenticated",
    configured: true,
    user: { id, email, displayName },
  };
});
