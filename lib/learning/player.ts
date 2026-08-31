import { z } from "zod";
import { isLearningAnalysisV2, type LearningAnalysis } from "@/lib/analysis/schema";

export const lessonStageSchema = z.enum([
  "meaning",
  "chunks",
  "grammar",
  "say",
  "recall",
  "completed",
]);

export type LessonStage = z.infer<typeof lessonStageSchema>;

export const LESSON_STAGE_LABELS: Record<LessonStage, string> = {
  meaning: "Mit jelent?",
  chunks: "Ezt érdemes megjegyezni",
  grammar: "Miért így mondják?",
  say: "Mondd ki te is",
  recall: "Emlékszel?",
  completed: "Kész",
};

export const LESSON_STAGE_PERCENT: Record<LessonStage, number> = {
  meaning: 20,
  chunks: 40,
  grammar: 60,
  say: 80,
  recall: 90,
  completed: 100,
};

const canonicalStageOrder: LessonStage[] = [
  "meaning",
  "chunks",
  "grammar",
  "say",
  "recall",
  "completed",
];

const legacyStageMap: Record<string, LessonStage> = {
  new: "meaning",
  source_verified: "meaning",
  understand: "meaning",
  notice: "chunks",
  meaning: "meaning",
  chunks: "chunks",
  grammar: "grammar",
  say: "say",
  recall: "recall",
  completed: "completed",
};

export type RecallAnswerState = {
  itemId: string;
  answer: string;
  correct: boolean;
};

export const progressMutationSchema = z
  .object({
    sessionId: z.string().uuid(),
    stage: lessonStageSchema,
    recallScore: z.number().int().min(0).max(100).nullable().optional(),
  })
  .strict();

export const phraseSaveReferenceSchema = z
  .object({
    sessionId: z.string().uuid(),
    chunkIndex: z.number().int().min(0).max(5),
  })
  .strict();

export type ProgressMutation = z.infer<typeof progressMutationSchema>;
export type PhraseSaveReference = z.infer<typeof phraseSaveReferenceSchema>;

export function sayPracticeTarget(analysis: LearningAnalysis) {
  const chunkIndex = isLearningAnalysisV2(analysis)
    ? analysis.shortcut?.coreChunkIndexes[0] ?? 0
    : 0;
  const chunk = analysis.chunks[chunkIndex];
  return chunk ? { text: chunk.sourceText, chunkIndex } : null;
}

export function sayPracticeText(analysis: LearningAnalysis) {
  return sayPracticeTarget(analysis)?.text ?? null;
}

export function lessonStageSequence(analysis: LearningAnalysis): LessonStage[] {
  if (analysis.analysisStatus !== "ready" || !analysis.meaning) return [];
  const stages: LessonStage[] = ["meaning"];
  if (analysis.chunks.length > 0) stages.push("chunks");
  if (analysis.grammar.length > 0 || analysis.transfer.length > 0) stages.push("grammar");
  if (sayPracticeText(analysis)) stages.push("say");
  if (analysis.recall.length > 0) stages.push("recall");
  stages.push("completed");
  return stages;
}

export function resumeLessonStage(savedStage: string | null | undefined, stages: LessonStage[]) {
  if (stages.length === 0) return null;
  const requested = savedStage ? legacyStageMap[savedStage] : undefined;
  if (!requested) return stages[0]!;
  if (stages.includes(requested)) return requested;
  const requestedIndex = canonicalStageOrder.indexOf(requested);
  return stages.find((stage) => canonicalStageOrder.indexOf(stage) >= requestedIndex) ?? stages.at(-1)!;
}

export function stagePercent(stage: LessonStage) {
  return LESSON_STAGE_PERCENT[stage];
}

export function nextLessonStage(current: LessonStage, stages: LessonStage[]) {
  const index = stages.indexOf(current);
  return index >= 0 ? stages[index + 1] ?? null : stages[0] ?? null;
}

export function previousLessonStage(current: LessonStage, stages: LessonStage[]) {
  const index = stages.indexOf(current);
  return index > 0 ? stages[index - 1] ?? null : null;
}

export function normalizeRecallAnswer(value: string) {
  return value
    .normalize("NFC")
    .replace(/[’‘`´]/gu, "'")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("it-IT");
}

export function gradeRecallAnswer(
  item: LearningAnalysis["recall"][number],
  answer: string,
) {
  if (item.type === "fill_chunk") {
    return Boolean(item.correctText)
      && normalizeRecallAnswer(answer) === normalizeRecallAnswer(item.correctText ?? "");
  }
  return Boolean(item.correctOptionId) && answer === item.correctOptionId;
}

export function calculateRecallScore(answers: RecallAnswerState[]) {
  if (answers.length === 0) return null;
  const correct = answers.filter((answer) => answer.correct).length;
  return Math.round((correct / answers.length) * 100);
}

export function isLessonComplete(
  stage: LessonStage,
  answers: RecallAnswerState[],
  recallItemCount: number,
) {
  return stage === "completed"
    && (recallItemCount === 0 || answers.length === recallItemCount);
}

export function phraseSaveReference(sessionId: string, chunkIndex: number) {
  return phraseSaveReferenceSchema.parse({ sessionId, chunkIndex });
}

export function normalizePhraseIdentity(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("it-IT");
}
