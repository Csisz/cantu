import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PracticeShell } from "@/components/cantu-app/practice/PracticeShell";
import { getAuthContext } from "@/lib/data/auth";
import { loadOwnedPhrases } from "@/lib/data/review";
import { selectPracticeTargets } from "@/lib/practice/targets";

export const metadata: Metadata = {
  title: "Real-Life Practice Lab",
  description: "Használd a saját mentett olasz kifejezéseidet rövid, valódi helyzetekben.",
};

export default async function PracticePage() {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") redirect("/app?auth=required#library-title");
  const targets = selectPracticeTargets(await loadOwnedPhrases(auth));
  if (!targets.length) redirect("/app#phrasebook-title");
  return <PracticeShell user={auth.user} suggestedTargets={targets.map(({ referenceId, italianChunk, meaningHu, noteHu }) => ({
    referenceId,
    italianChunk,
    meaningHu,
    noteHu,
  }))} />;
}
