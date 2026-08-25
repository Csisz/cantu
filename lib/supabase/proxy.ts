import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseConfiguration } from "@/lib/env/server";
import type { Database } from "./database.types";

export async function updateSupabaseSession(request: NextRequest) {
  const configuration = getServerSupabaseConfiguration();
  if (!configuration.configured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    configuration.env.url,
    configuration.env.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headersToSet).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}
