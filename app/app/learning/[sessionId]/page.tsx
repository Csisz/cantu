import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { LearningSessionShell } from "@/components/cantu-app/learning/LearningSessionShell";
import { getAuthContext } from "@/lib/data/auth";
import { getOwnedLearningExperience } from "@/lib/data/learning-experience";

export const metadata: Metadata = {
  title: "Saját tanulásom",
  description: "Folytasd a privát Cantu tanulási munkamenetedet.",
};

export default async function LearningSessionPage({ params }: {
  params: Promise<{ sessionId: string }>;
}) {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") redirect("/app?auth=required#library-title");
  const { sessionId } = await params;
  let experience;

  try {
    experience = await getOwnedLearningExperience(auth, sessionId);
  } catch (error) {
    if (error instanceof ZodError) notFound();
    return (
      <main className="learningLoadError">
        <h1>A tanulást most nem sikerült betölteni.</h1>
        <p>Próbáld újra, vagy térj vissza az Input Studióhoz.</p>
        <a href={`/app/learning/${sessionId}`}>Újrapróbálom</a>
        <a href="/app#library-title">Vissza a saját tanulásaimhoz</a>
      </main>
    );
  }
  if (!experience) notFound();
  return <LearningSessionShell user={auth.user} experience={experience} />;
}
