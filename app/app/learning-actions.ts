"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import type { PersistenceActionState } from "@/lib/domain/learning-session";
import { parseLearningSessionForm, sessionIdSchema } from "@/lib/domain/learning-session";
import { getAuthContext } from "@/lib/data/auth";
import { deleteLearningSession, saveLearningSession } from "@/lib/data/learning-sessions";

export async function saveLearningSessionAction(
  _previousState: PersistenceActionState,
  formData: FormData,
): Promise<PersistenceActionState> {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") {
    return { status: "unauthenticated", message: "A mentéshez jelentkezz be." };
  }

  try {
    await saveLearningSession(auth, parseLearningSessionForm(formData));
    revalidatePath("/app");
    return { status: "success", message: "Elmentve a saját tanulásaid közé." };
  } catch (error) {
    if (!(error instanceof ZodError)) console.error("Learning session action failed");
    return { status: "error", message: "A mentés nem sikerült. Próbáld meg újra." };
  }
}

export async function deleteLearningSessionAction(
  _previousState: PersistenceActionState,
  formData: FormData,
): Promise<PersistenceActionState> {
  const auth = await getAuthContext();
  if (auth.status !== "authenticated") {
    return { status: "unauthenticated", message: "A törléshez jelentkezz be újra." };
  }

  try {
    const sessionId = sessionIdSchema.parse(formData.get("sessionId"));
    const deleted = await deleteLearningSession(auth, sessionId);
    if (!deleted) return { status: "error", message: "Ez a tanulás már nem található." };
    revalidatePath("/app");
    return { status: "success", message: "A tanulás törölve." };
  } catch (error) {
    if (!(error instanceof ZodError)) console.error("Learning session delete action failed");
    return { status: "error", message: "A törlés nem sikerült. Próbáld meg újra." };
  }
}
