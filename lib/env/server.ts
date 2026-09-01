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

export function isE2EAnalysisMockEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.CANTU_E2E_ANALYSIS_MOCK === "1"
  );
}

export function isE2EPracticeMockEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.CANTU_E2E_PRACTICE_MOCK === "1"
  );
}

export function getPracticeStateSecret() {
  const configured = process.env.PRACTICE_STATE_SECRET?.trim();
  if (configured) return configured;
  return isE2EPracticeMockEnabled()
    ? "cantu-e2e-practice-state-secret-not-for-production"
    : null;
}

export function productionMockFlags() {
  return [
    "CANTU_E2E_AUTH_MOCK",
    "CANTU_E2E_STT_MOCK",
    "CANTU_E2E_ANALYSIS_MOCK",
    "CANTU_E2E_PRACTICE_MOCK",
  ].filter((name) => process.env[name] === "1");
}

export function assertSafeServerConfiguration() {
  if (process.env.NODE_ENV !== "production") return;
  const unsafeFlags = productionMockFlags();
  if (unsafeFlags.length) throw new Error("Unsafe test configuration is disabled in production");
  if (!process.env.PRACTICE_STATE_SECRET?.trim() || process.env.PRACTICE_STATE_SECRET.trim().length < 32) {
    throw new Error("PRACTICE_STATE_SECRET must be configured securely in production");
  }
}

export function getServerSupabaseSecret() {
  const value = process.env.SUPABASE_SECRET_KEY?.trim();
  return value && value.length >= 16 ? value : null;
}
