import "server-only";

import { getPublicSupabaseConfiguration } from "./client";

export function getServerSupabaseConfiguration() {
  return getPublicSupabaseConfiguration();
}

export function isE2EAuthMockEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.CANTU_E2E_AUTH_MOCK === "1"
  );
}

export function isE2ESTTMockEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.CANTU_E2E_STT_MOCK === "1"
  );
}
