import "server-only";

import { randomUUID } from "node:crypto";
import type { LearningHistoryItem, LearningSessionMetadata } from "@/lib/domain/learning-session";

type E2ERow = LearningHistoryItem & { userId: string };

const storeKey = "__cantuE2ELearningSessions" as const;
const globalStore = globalThis as typeof globalThis & { [storeKey]?: E2ERow[] };

function rows() {
  globalStore[storeKey] ??= [];
  return globalStore[storeKey];
}

export function listE2ELearningSessions(userId: string) {
  return rows().filter((row) => row.userId === userId).map((row) => ({
    id: row.id,
    inputType: row.inputType,
    sourceStatus: row.sourceStatus,
    sourceDurationMs: row.sourceDurationMs,
    sourceCharCount: row.sourceCharCount,
    createdAt: row.createdAt,
    progress: row.progress,
  }));
}

export function saveE2ELearningSession(userId: string, metadata: LearningSessionMetadata) {
  const row: E2ERow = {
    id: randomUUID(),
    userId,
    inputType: metadata.inputType,
    sourceStatus: metadata.inputType === "text" ? "text_direct" : "pending",
    sourceDurationMs: metadata.inputType !== "text" ? metadata.sourceDurationMs : null,
    sourceCharCount: metadata.inputType === "text" ? metadata.sourceCharCount : null,
    createdAt: new Date().toISOString(),
    progress: { stage: "new", percentComplete: 0, lastOpenedAt: null },
  };
  rows().unshift(row);
  return row;
}

export function deleteE2ELearningSession(userId: string, sessionId: string) {
  const index = rows().findIndex((row) => row.userId === userId && row.id === sessionId);
  if (index < 0) return false;
  rows().splice(index, 1);
  return true;
}

export function hasE2ELearningSession(userId: string, sessionId: string) {
  return rows().some((row) => row.userId === userId && row.id === sessionId);
}

export function clearE2ELearningSessions(userId: string) {
  globalStore[storeKey] = rows().filter((row) => row.userId !== userId);
}

export function startE2ETranscriptionSession(
  userId: string,
  inputType: "microphone" | "audio_file",
  durationMs: number,
) {
  const sessionId = randomUUID();
  rows().unshift({
    id: sessionId,
    userId,
    inputType,
    sourceStatus: "pending",
    sourceDurationMs: durationMs,
    sourceCharCount: null,
    createdAt: new Date().toISOString(),
    progress: { stage: "new", percentComplete: 0, lastOpenedAt: null },
  });
  return { sessionId, attemptId: randomUUID() };
}

export function updateE2ETranscriptionStatus(
  userId: string,
  sessionId: string,
  status: "stt_unverified" | "failed" | "user_verified" | "user_edited",
) {
  const row = rows().find((item) => item.userId === userId && item.id === sessionId);
  if (!row) return false;
  row.sourceStatus = status;
  return true;
}
