"use server";

import "server-only";

import { redirect } from "next/navigation";
import {
  clearE2EAuthSession,
  establishE2EAuthSession,
} from "@/lib/auth/e2e-session";
import type { AuthActionState } from "@/lib/auth/types";
import {
  authErrorMessage,
  parseSignInForm,
  parseSignUpForm,
} from "@/lib/auth/validation";
import { getServerSupabaseConfiguration } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

const configurationMessage =
  "A fiókokhoz még nincs beállítva a helyi Supabase kapcsolat.";

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseSignInForm(formData);
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.fieldErrors };
  }

  if (await establishE2EAuthSession()) redirect("/app");

  const configuration = getServerSupabaseConfiguration();
  if (!configuration.configured) {
    return { status: "error", message: configurationMessage };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: authErrorMessage(error.code) };
  }

  redirect("/app");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseSignUpForm(formData);
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.fieldErrors };
  }

  if (await establishE2EAuthSession()) redirect("/app");

  const configuration = getServerSupabaseConfiguration();
  if (!configuration.configured) {
    return { status: "error", message: configurationMessage };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.displayName
        ? { display_name: parsed.data.displayName }
        : undefined,
    },
  });

  if (error) {
    return { status: "error", message: authErrorMessage(error.code) };
  }

  if (data.session) redirect("/app");

  return {
    status: "success",
    message:
      "A fiók elkészült. Nyisd meg a megerősítő levelet, majd jelentkezz be.",
  };
}

export async function signOutAction() {
  if (await clearE2EAuthSession()) redirect("/app");

  const configuration = getServerSupabaseConfiguration();
  if (configuration.configured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/app");
}
