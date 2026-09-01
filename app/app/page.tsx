import type { Metadata } from "next";
import { AppShell } from "@/components/cantu-app/AppShell";
import { getAuthContext } from "@/lib/data/auth";
import { getLearningHistory } from "@/lib/data/learning-sessions";
import { getPhrasebookSnapshot } from "@/lib/data/review";
import type { InputMode } from "@/lib/input/types";

export const metadata: Metadata = {
  title: "Input Studio",
  description: "Hozz egy rövid olasz hangrészletet vagy szöveget, és jelöld ki pontosan, mit szeretnél megérteni.",
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
  const initialMode: InputMode =
    requestedMode === "audio" || requestedMode === "text" ? requestedMode : "listen";
  const authResult = Array.isArray(params.auth) ? params.auth[0] : params.auth;
  const authNotice =
    authResult === "confirmed"
      ? "Az e-mail-címed megerősítve. A fiókod használatra kész."
      : authResult === "confirmation-error"
        ? "A megerősítő link lejárt vagy érvénytelen. Kérj új levelet a regisztrációval."
        : undefined;
  const auth = await getAuthContext();
  const [history, phrasebook] = await Promise.all([
    getLearningHistory(auth),
    getPhrasebookSnapshot(auth),
  ]);

  return (
    <AppShell
      initialMode={initialMode}
      auth={auth}
      history={history}
      phrasebook={phrasebook}
      authNotice={authNotice}
    />
  );
}
