import "server-only";

import { randomUUID } from "node:crypto";
import type { LearningHistoryItem, LearningSessionMetadata } from "@/lib/domain/learning-session";
import type { LearningProgressMutation } from "@/lib/domain/learning-progress";
import { normalizePhraseIdentity } from "@/lib/learning/player";
import { REVIEW_SCHEDULE_CONFIG, scheduleReview } from "@/lib/review/scheduler";
import type { PhraseReviewState, ReviewRating } from "@/lib/review/types";

type E2ERow = LearningHistoryItem & { userId: string; sourceFingerprint?: string };

type E2EAnalysisResult = {
  userId: string;
  sessionId: string;
  schemaVersion: string;
  generatorVersion: string;
  resultJson: unknown;
};

type E2EPhrase = {
  id: string;
  userId: string;
  italian_chunk: string;
  meaning_hu: string;
  note_hu: string | null;
  register: string | null;
  source_session_id: string | null;
  created_at: string;
};

type E2EReview = PhraseReviewState & { userId: string };

const storeKey = "__cantuE2ELearningSessions" as const;
const globalStore = globalThis as typeof globalThis & { [storeKey]?: E2ERow[] };
const resultStoreKey = "__cantuE2ELearningResults" as const;
const globalResultStore = globalThis as typeof globalThis & {
  [resultStoreKey]?: E2EAnalysisResult[];
};
const phraseStoreKey = "__cantuE2EPhrasebook" as const;
const globalPhraseStore = globalThis as typeof globalThis & { [phraseStoreKey]?: E2EPhrase[] };
const reviewStoreKey = "__cantuE2EPhraseReview" as const;
const globalReviewStore = globalThis as typeof globalThis & { [reviewStoreKey]?: E2EReview[] };

function rows() {
  globalStore[storeKey] ??= [];
  return globalStore[storeKey];
}

function results() {
  globalResultStore[resultStoreKey] ??= [];
  return globalResultStore[resultStoreKey];
}

function phrases() {
  globalPhraseStore[phraseStoreKey] ??= [];
  return globalPhraseStore[phraseStoreKey];
}

function reviews() {
  globalReviewStore[reviewStoreKey] ??= [];
  return globalReviewStore[reviewStoreKey];
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
  globalResultStore[resultStoreKey] = results().filter((row) => row.sessionId !== sessionId);
  for (const phrase of phrases()) {
    if (phrase.userId === userId && phrase.source_session_id === sessionId) phrase.source_session_id = null;
  }
  return true;
}

export function hasE2ELearningSession(userId: string, sessionId: string) {
  return rows().some((row) => row.userId === userId && row.id === sessionId);
}

export function clearE2ELearningSessions(userId: string) {
  globalStore[storeKey] = rows().filter((row) => row.userId !== userId);
  globalResultStore[resultStoreKey] = results().filter((row) => row.userId !== userId);
  globalPhraseStore[phraseStoreKey] = phrases().filter((row) => row.userId !== userId);
  globalReviewStore[reviewStoreKey] = reviews().filter((row) => row.userId !== userId);
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

export function startE2EAnalysis(
  userId: string,
  input: {
    sessionId?: string;
    inputType: "microphone" | "audio_file" | "text";
    sourceStatus: "text_direct" | "user_verified" | "user_edited";
    sourceCharCount: number;
    sourceFingerprint: string;
    schemaVersion: string;
    generatorVersion: string;
  },
) {
  let row = input.sessionId
    ? rows().find((item) => item.userId === userId && item.id === input.sessionId)
    : undefined;
  if (input.sessionId && !row) return null;
  if (!row) {
    row = {
      id: randomUUID(),
      userId,
      inputType: "text",
      sourceStatus: "text_direct",
      sourceDurationMs: null,
      sourceCharCount: input.sourceCharCount,
      sourceFingerprint: input.sourceFingerprint,
      createdAt: new Date().toISOString(),
      progress: { stage: "new", percentComplete: 0, lastOpenedAt: null },
    };
    rows().unshift(row);
  }
  if (row.sourceFingerprint && row.sourceFingerprint !== input.sourceFingerprint) {
    throw new Error("analysis_source_mismatch");
  }
  row.sourceFingerprint = input.sourceFingerprint;
  const cached = results().find((result) =>
    result.userId === userId &&
    result.sessionId === row?.id &&
    result.schemaVersion === input.schemaVersion &&
    result.generatorVersion === input.generatorVersion,
  );
  if (cached) {
    return { sessionId: row.id, attemptId: null, cachedResult: cached.resultJson };
  }
  return { sessionId: row.id, attemptId: randomUUID(), cachedResult: null };
}

export function completeE2EAnalysis(
  userId: string,
  input: {
    sessionId: string;
    schemaVersion: string;
    generatorVersion: string;
    resultJson: unknown;
  },
) {
  const row = rows().find((item) => item.userId === userId && item.id === input.sessionId);
  if (!row) return false;
  row.sourceStatus = "ready";
  const existing = results().find((result) =>
    result.userId === userId && result.sessionId === input.sessionId,
  );
  if (existing) {
    existing.schemaVersion = input.schemaVersion;
    existing.generatorVersion = input.generatorVersion;
    existing.resultJson = input.resultJson;
  } else {
    results().push({ userId, ...input });
  }
  return true;
}

export function getE2ELearningExperience(userId: string, sessionId: string) {
  const row = rows().find((item) => item.userId === userId && item.id === sessionId && item.sourceStatus === "ready");
  const result = results().find((item) => item.userId === userId && item.sessionId === sessionId);
  if (!row || !result) return null;
  return {
    resultJson: result.resultJson,
    progress: row.progress.stage === "new"
      ? null
      : {
          stage: row.progress.stage,
          percentComplete: row.progress.percentComplete,
          recallScore: row.progress.recallScore ?? null,
        },
    phrases: phrases().filter((phrase) => phrase.userId === userId && phrase.source_session_id === sessionId),
  };
}

export function saveE2EProgress(userId: string, input: LearningProgressMutation) {
  const row = rows().find((item) => item.userId === userId && item.id === input.sessionId && item.sourceStatus === "ready");
  if (!row) return false;
  row.progress = {
    stage: input.stage,
    percentComplete: input.percentComplete,
    recallScore: input.recallScore ?? null,
    lastOpenedAt: new Date().toISOString(),
  };
  return true;
}

export function saveE2EPhrase(
  userId: string,
  input: Omit<E2EPhrase, "id" | "userId" | "created_at">,
) {
  const ownedSession = rows().some((row) => row.userId === userId && row.id === input.source_session_id);
  if (!ownedSession) return { duplicate: false, saved: false };
  const duplicate = phrases().some((phrase) =>
    phrase.userId === userId
    && phrase.source_session_id === input.source_session_id
    && normalizePhraseIdentity(phrase.italian_chunk) === normalizePhraseIdentity(input.italian_chunk),
  );
  if (!duplicate) {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    phrases().push({ id, userId, ...input, created_at: timestamp });
    // The deterministic browser test store exposes a due item immediately so
    // Playwright can exercise the due queue without wall-clock manipulation.
    reviews().push({
      userId,
      phraseId: id,
      state: "new",
      nextReviewAt: timestamp,
      lastReviewedAt: null,
      reviewCount: 0,
      successCount: 0,
      lapseCount: 0,
      intervalDays: 1,
      difficulty: REVIEW_SCHEDULE_CONFIG.initialDifficulty,
      lastRating: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  return { duplicate, saved: true };
}

export function listE2EPhrases(userId: string) {
  return phrases()
    .filter((phrase) => phrase.userId === userId)
    .map((phrase) => ({
      phrase,
      review: reviews().find((review) => review.userId === userId && review.phraseId === phrase.id) ?? null,
    }));
}

export function updateE2EReview(
  userId: string,
  phraseId: string,
  rating: ReviewRating,
  now: Date,
) {
  const review = reviews().find((item) => item.userId === userId && item.phraseId === phraseId);
  if (!review) return null;
  const update = scheduleReview(review, rating, now);
  Object.assign(review, update, { updatedAt: now.toISOString() });
  return review;
}

export function bringE2EReviewForward(userId: string, phraseId: string, nextReviewAt: Date) {
  const review = reviews().find((item) => item.userId === userId && item.phraseId === phraseId);
  if (!review) return false;
  if (new Date(review.nextReviewAt).getTime() > nextReviewAt.getTime()) {
    review.nextReviewAt = nextReviewAt.toISOString();
    if (review.state === "stable") review.state = "review";
    review.updatedAt = new Date().toISOString();
  }
  return true;
}

export function deleteE2EPhrase(userId: string, phraseId: string) {
  const index = phrases().findIndex((phrase) => phrase.userId === userId && phrase.id === phraseId);
  if (index < 0) return false;
  phrases().splice(index, 1);
  globalReviewStore[reviewStoreKey] = reviews().filter((review) => review.phraseId !== phraseId);
  return true;
}
