import type { LessonStage } from "./player";

export type LearningMutationResponse = {
  status: "success" | "error" | "unauthenticated";
  message: string;
  duplicate?: boolean;
};

async function postLearningMutation(path: string, body: unknown): Promise<LearningMutationResponse> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null) as LearningMutationResponse | null;
    if (!payload || !["success", "error", "unauthenticated"].includes(payload.status)) {
      return { status: "error", message: "A mentés most nem sikerült. A lecke ettől még folytatható." };
    }
    return payload;
  } catch {
    return { status: "error", message: "Nincs hálózati kapcsolat. A helyi lecke ettől még folytatható." };
  }
}

export function persistLearningProgress(input: {
  sessionId: string;
  stage: LessonStage;
  recallScore: number | null;
}) {
  return postLearningMutation("/api/learning/progress", input);
}

export function persistPhraseReference(input: { sessionId: string; chunkIndex: number }) {
  return postLearningMutation("/api/learning/phrase", input);
}
