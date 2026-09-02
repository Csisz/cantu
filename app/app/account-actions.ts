"use server";

import "server-only";
import { redirect } from "next/navigation";
import { accountDeletionSchema, type AccountActionState } from "@/lib/account/validation";
import { clearE2EAuthSession } from "@/lib/auth/e2e-session";
import { deleteOwnedAccount } from "@/lib/data/account";
import { getAuthContext } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";
import { cancelBillingBeforeAccountDeletion } from "@/lib/billing/service";
import { createBillingProvider } from "@/lib/providers/billing/factory";

export async function deleteAccountAction(_state: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const parsed = accountDeletionSchema.safeParse({ confirmation: formData.get("confirmation") });
  if (!parsed.success) return { status: "error", message: "Írd be pontosan: TÖRLÉS" };
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") return { status: "error", message: "A törléshez jelentkezz be újra." };
  try {
    await cancelBillingBeforeAccountDeletion(auth, () => createBillingProvider());
    await deleteOwnedAccount(auth);
    if (!(await clearE2EAuthSession())) {
      const supabase = await createClient();
      await supabase.auth.signOut({ scope: "global" });
    }
  } catch {
    return { status: "error", message: "A fiókot most nem sikerült biztonságosan törölni. Ha van előfizetésed, azt előbb meg kell szüntetnünk. Próbáld újra később." };
  }
  redirect("/account-deleted");
}
