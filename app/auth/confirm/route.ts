import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSupabaseConfiguration } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

function appRedirect(request: NextRequest, result: "confirmed" | "confirmation-error") {
  const destination = request.nextUrl.clone();
  destination.pathname = "/app";
  destination.search = "";
  destination.searchParams.set("auth", result);
  return destination;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const requestedType = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const configuration = getServerSupabaseConfiguration();

  if (
    configuration.configured &&
    tokenHash &&
    requestedType &&
    allowedTypes.has(requestedType)
  ) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: requestedType,
    });
    if (!error) return NextResponse.redirect(appRedirect(request, "confirmed"));
  }

  return NextResponse.redirect(appRedirect(request, "confirmation-error"));
}
