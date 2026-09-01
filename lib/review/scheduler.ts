import type { PhraseReviewState, ReviewRating, ReviewStateName } from "./types";

export const REVIEW_SCHEDULE_CONFIG = {
  initialDelayHours: 24,
  minIntervalDays: 1,
  maxIntervalDays: 365,
  minDifficulty: 1.3,
  maxDifficulty: 3,
  initialDifficulty: 2.2,
  hardGrowth: 1.25,
  goodGrowth: 2,
  easyGrowth: 3,
  stableIntervalDays: 21,
  stableSuccessCount: 4,
} as const;

export type SchedulerInput = Pick<
  PhraseReviewState,
  "state" | "reviewCount" | "successCount" | "lapseCount" | "intervalDays" | "difficulty"
>;

export type SchedulerOutput = {
  state: ReviewStateName;
  nextReviewAt: string;
  lastReviewedAt: string;
  reviewCount: number;
  successCount: number;
  lapseCount: number;
  intervalDays: number;
  difficulty: number;
  lastRating: ReviewRating;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function addUtcDays(now: Date, days: number) {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

function nextState(successCount: number, intervalDays: number): ReviewStateName {
  if (
    successCount >= REVIEW_SCHEDULE_CONFIG.stableSuccessCount
    && intervalDays >= REVIEW_SCHEDULE_CONFIG.stableIntervalDays
  ) return "stable";
  return successCount >= 2 ? "review" : "learning";
}

export function initialReviewAt(createdAt: Date) {
  return new Date(
    createdAt.getTime() + REVIEW_SCHEDULE_CONFIG.initialDelayHours * 3_600_000,
  ).toISOString();
}

export function scheduleReview(
  current: SchedulerInput,
  rating: ReviewRating,
  now: Date,
): SchedulerOutput {
  const reviewedAt = now.toISOString();
  const reviewCount = current.reviewCount + 1;

  if (rating === "again") {
    const intervalDays = REVIEW_SCHEDULE_CONFIG.minIntervalDays;
    return {
      state: "learning",
      nextReviewAt: addUtcDays(now, intervalDays),
      lastReviewedAt: reviewedAt,
      reviewCount,
      successCount: current.successCount,
      lapseCount: current.lapseCount + 1,
      intervalDays,
      difficulty: clamp(current.difficulty + 0.2, REVIEW_SCHEDULE_CONFIG.minDifficulty, REVIEW_SCHEDULE_CONFIG.maxDifficulty),
      lastRating: rating,
    };
  }

  const successCount = current.successCount + 1;
  let intervalDays: number;
  let difficulty = current.difficulty;

  if (rating === "hard") {
    intervalDays = Math.max(
      REVIEW_SCHEDULE_CONFIG.minIntervalDays,
      Math.round(Math.max(1, current.intervalDays) * REVIEW_SCHEDULE_CONFIG.hardGrowth),
    );
    difficulty += 0.1;
  } else if (rating === "easy") {
    intervalDays = current.reviewCount === 0
      ? 7
      : Math.round(Math.max(1, current.intervalDays) * REVIEW_SCHEDULE_CONFIG.easyGrowth);
    difficulty -= 0.15;
  } else {
    intervalDays = current.reviewCount === 0
      ? 3
      : Math.round(Math.max(1, current.intervalDays) * REVIEW_SCHEDULE_CONFIG.goodGrowth);
    difficulty -= 0.05;
  }

  intervalDays = clamp(
    intervalDays,
    REVIEW_SCHEDULE_CONFIG.minIntervalDays,
    REVIEW_SCHEDULE_CONFIG.maxIntervalDays,
  );
  difficulty = clamp(
    Number(difficulty.toFixed(2)),
    REVIEW_SCHEDULE_CONFIG.minDifficulty,
    REVIEW_SCHEDULE_CONFIG.maxDifficulty,
  );

  return {
    state: nextState(successCount, intervalDays),
    nextReviewAt: addUtcDays(now, intervalDays),
    lastReviewedAt: reviewedAt,
    reviewCount,
    successCount,
    lapseCount: current.lapseCount,
    intervalDays,
    difficulty,
    lastRating: rating,
  };
}

export function reviewStrengthLabel(state: ReviewStateName) {
  return ({ new: "Új", learning: "Gyakorlom", review: "Megy", stable: "Stabil" } as const)[state];
}
