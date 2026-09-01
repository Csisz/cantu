import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { ReviewShell } from "@/components/cantu-app/review/ReviewShell";
import { getAuthContext } from "@/lib/data/auth";
import { getReviewSnapshot } from "@/lib/data/review";

export const metadata: Metadata = {
  title: "Mai ismétlés",
  description: "Rövid, privát Cantu ismétlés a mentett olasz kifejezéseidből.",
};

export default async function ReviewPage({ searchParams }: {
  searchParams: Promise<{ phrase?: string | string[] }>;
}) {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") redirect("/app?auth=required#library-title");
  const params = await searchParams;
  const phrase = Array.isArray(params.phrase) ? params.phrase[0] : params.phrase;
  let snapshot;
  try {
    snapshot = await getReviewSnapshot(auth, phrase);
  } catch (error) {
    if (error instanceof ZodError) notFound();
    return (
      <main className="learningLoadError">
        <h1>Az ismétlést most nem sikerült betölteni.</h1>
        <p>Próbáld újra, vagy térj vissza a mentett kifejezéseidhez.</p>
        <a href="/app/review">Újrapróbálom</a>
        <a href="/app#phrasebook-title">Vissza</a>
      </main>
    );
  }
  if (!snapshot) notFound();
  return <ReviewShell user={auth.user} snapshot={snapshot} />;
}
