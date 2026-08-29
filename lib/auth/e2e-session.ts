import "server-only";

import { cookies } from "next/headers";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import type { AuthUserDTO } from "./types";
import { clearE2ELearningSessions } from "@/lib/data/e2e-learning-store";

const COOKIE_NAME = "cantu-e2e-auth";
const TEST_USER: AuthUserDTO = {
  id: "e2e00000-0000-4000-8000-000000000001",
  email: "teszt@cantu.local",
  displayName: "Teszt Tanuló",
};

export async function getE2EAuthUser() {
  if (!isE2EAuthMockEnabled()) return null;
  return (await cookies()).get(COOKIE_NAME)?.value === "authenticated" ? TEST_USER : null;
}

export async function establishE2EAuthSession() {
  if (!isE2EAuthMockEnabled()) return false;
  clearE2ELearningSessions(TEST_USER.id);
  (await cookies()).set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
  return true;
}

export async function clearE2EAuthSession() {
  if (!isE2EAuthMockEnabled()) return false;
  clearE2ELearningSessions(TEST_USER.id);
  (await cookies()).delete(COOKIE_NAME);
  return true;
}
