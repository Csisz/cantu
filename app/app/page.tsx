import type { Metadata } from "next";
import { AppShell } from "@/components/cantu-app/AppShell";
import { getAuthContext } from "@/lib/data/auth";
import { getLibrarySnapshot } from "@/lib/data/library";
import type { EntryMode } from "@/lib/recognition/types";

export const metadata: Metadata = {
  title: "Dal felismerése",
  description: "Hozz be egy olasz dalt hallgatással vagy helyi hangfájllal.",
};

type AppPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    auth?: string | string[];
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = await searchParams;
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const initialMode: EntryMode = requestedMode === "upload" ? "upload" : "listen";
  const authResult = Array.isArray(params.auth) ? params.auth[0] : params.auth;
  const authNotice =
    authResult === "confirmed"
      ? "Az e-mail-címed megerősítve. A fiókod használatra kész."
      : authResult === "confirmation-error"
        ? "A megerősítő link lejárt vagy érvénytelen. Kérj új levelet a regisztrációval."
        : undefined;
  const auth = await getAuthContext();
  const library = await getLibrarySnapshot(auth);

  return (
    <AppShell
      initialMode={initialMode}
      auth={auth}
      library={library}
      authNotice={authNotice}
    />
  );
}
