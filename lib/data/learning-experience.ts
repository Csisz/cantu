import "server-only";

import { learningAnalysisSchema, type LearningAnalysis } from "@/lib/analysis/schema";
import type { AuthContext } from "@/lib/auth/types";
import { sessionIdSchema } from "@/lib/domain/learning-session";
import { learningProgressMutationSchema } from "@/lib/domain/learning-progress";
import {
  phraseSaveReferenceSchema,
  stagePercent,
  type LessonStage,
} from "@/lib/learning/player";
import { isE2EAuthMockEnabled } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import {
  getE2ELearningExperience,
  saveE2EPhrase,
  saveE2EProgress,
} from "./e2e-learning-store";

export type LearningExperienceSnapshot = {
  sessionId: string;
  analysis: LearningAnalysis;
  progress: {
    stage: string;
    percentComplete: number;
    recallScore: number | null;
  } | null;
  savedChunkIndices: number[];
};

export type LearningMutationResult = {
  status: "success" | "error" | "unauthenticated";
  message: string;
  duplicate?: boolean;
};

function requireUser(auth: AuthContext) {
  if (auth.status !== "authenticated") return null;
  return auth.user;
}

function savedIndices(
  analysis: LearningAnalysis,
  phrases: Array<{ italian_chunk: string; meaning_hu: string }>,
) {
  return analysis.chunks.flatMap((chunk, index) =>
    phrases.some((phrase) =>
      phrase.italian_chunk === chunk.sourceText && phrase.meaning_hu === chunk.meaningHu,
    ) ? [index] : [],
  );
}

export async function getOwnedLearningExperience(
  auth: AuthContext,
  sessionIdInput: string,
): Promise<LearningExperienceSnapshot | null> {
  const user = requireUser(auth);
  if (!user) return null;
  const sessionId = sessionIdSchema.parse(sessionIdInput);

  if (isE2EAuthMockEnabled()) {
    const snapshot = getE2ELearningExperience(user.id, sessionId);
    if (!snapshot) return null;
    const parsed = learningAnalysisSchema.safeParse(snapshot.resultJson);
    if (!parsed.success || parsed.data.analysisStatus !== "ready") return null;
    return {
      sessionId,
      analysis: parsed.data,
      progress: snapshot.progress,
      savedChunkIndices: savedIndices(parsed.data, snapshot.phrases),
    };
  }

  const supabase = await createClient();
  const [sessionResult, analysisResult, progressResult, phraseResult] = await Promise.all([
    supabase
      .from("learning_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .eq("source_status", "ready")
      .maybeSingle(),
    supabase
      .from("learning_results")
      .select("result_json")
      .eq("session_id", sessionId)
      .maybeSingle(),
    supabase
      .from("learning_progress")
      .select("stage, percent_complete, recall_score")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_phrasebook")
      .select("italian_chunk, meaning_hu")
      .eq("source_session_id", sessionId)
      .eq("user_id", user.id),
  ]);

  const queryError = sessionResult.error ?? analysisResult.error ?? progressResult.error ?? phraseResult.error;
  if (queryError) {
    console.error("Cantu learning experience load failed", { code: queryError.code });
    throw new Error("Learning experience load failed");
  }
  if (!sessionResult.data || !analysisResult.data) return null;
  const parsed = learningAnalysisSchema.safeParse(analysisResult.data.result_json);
  if (!parsed.success || parsed.data.analysisStatus !== "ready") return null;

  return {
    sessionId,
    analysis: parsed.data,
    progress: progressResult.data
      ? {
          stage: progressResult.data.stage,
          percentComplete: Number(progressResult.data.percent_complete),
          recallScore: progressResult.data.recall_score === null
            ? null
            : Number(progressResult.data.recall_score),
        }
      : null,
    savedChunkIndices: savedIndices(parsed.data, phraseResult.data ?? []),
  };
}

export async function saveLearningProgress(
  auth: AuthContext,
  input: { sessionId: string; stage: LessonStage; recallScore?: number | null },
): Promise<LearningMutationResult> {
  const user = requireUser(auth);
  if (!user) return { status: "unauthenticated", message: "A haladás mentéséhez jelentkezz be újra." };
  const parsed = learningProgressMutationSchema.parse({
    sessionId: input.sessionId,
    stage: input.stage,
    percentComplete: stagePercent(input.stage),
    recallScore: input.recallScore ?? null,
  });

  if (isE2EAuthMockEnabled()) {
    const saved = saveE2EProgress(user.id, parsed);
    return saved
      ? { status: "success", message: "A haladás elmentve." }
      : { status: "error", message: "A haladást most nem sikerült menteni." };
  }

  const supabase = await createClient();
  const { data: ownedSession, error: ownershipError } = await supabase
    .from("learning_sessions")
    .select("id")
    .eq("id", parsed.sessionId)
    .eq("user_id", user.id)
    .eq("source_status", "ready")
    .maybeSingle();
  if (ownershipError || !ownedSession) {
    return { status: "error", message: "Ez a tanulás nem érhető el." };
  }

  const { error } = await supabase.from("learning_progress").upsert({
    user_id: user.id,
    session_id: parsed.sessionId,
    stage: parsed.stage,
    percent_complete: parsed.percentComplete,
    recall_score: parsed.recallScore ?? null,
    last_opened_at: new Date().toISOString(),
  }, { onConflict: "user_id,session_id" });
  if (error) {
    console.error("Cantu learning progress save failed", { code: error.code });
    return { status: "error", message: "A haladást most nem sikerült menteni. A lecke ettől még folytatható." };
  }
  return { status: "success", message: "A haladás elmentve." };
}

export async function savePhrasebookChunk(
  auth: AuthContext,
  input: unknown,
): Promise<LearningMutationResult> {
  const user = requireUser(auth);
  if (!user) return { status: "unauthenticated", message: "A kifejezés mentéséhez jelentkezz be újra." };
  const reference = phraseSaveReferenceSchema.parse(input);

  const experience = await getOwnedLearningExperience(auth, reference.sessionId);
  const chunk = experience?.analysis.chunks[reference.chunkIndex];
  if (!experience || !chunk) return { status: "error", message: "Ez a kifejezés nem található a saját tanulásodban." };

  const canonicalPhrase = {
    italian_chunk: chunk.sourceText,
    meaning_hu: chunk.meaningHu,
    note_hu: chunk.contextNoteHu,
    register: chunk.register,
    source_session_id: reference.sessionId,
  };

  if (isE2EAuthMockEnabled()) {
    const result = saveE2EPhrase(user.id, canonicalPhrase);
    return {
      status: "success",
      message: result.duplicate ? "Ez a kifejezés már el van mentve." : "Elmentve a saját kifejezéseid közé.",
      duplicate: result.duplicate,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_phrasebook").insert({
    user_id: user.id,
    ...canonicalPhrase,
  });
  if (error?.code === "23505") {
    return { status: "success", message: "Ez a kifejezés már el van mentve.", duplicate: true };
  }
  if (error) {
    console.error("Cantu phrase save failed", { code: error.code });
    return { status: "error", message: "A kifejezést most nem sikerült elmenteni. Próbáld újra." };
  }
  return { status: "success", message: "Elmentve a saját kifejezéseid közé.", duplicate: false };
}
