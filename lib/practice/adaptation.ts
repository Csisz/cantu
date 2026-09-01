import type { PracticeFeedbackStatus } from "./types";

export const PRACTICE_REVIEW_SIGNAL_THRESHOLD = 2;

export function applyPracticeOutcome(
  struggleCounts: Record<string, number>,
  signaledPhraseIds: string[],
  phraseId: string | null,
  status: PracticeFeedbackStatus | null,
) {
  const nextCounts = { ...struggleCounts };
  if (!phraseId || status !== "needs_fix") {
    return { struggleCounts: nextCounts, signaledPhraseIds: [...signaledPhraseIds], signalPhraseId: null };
  }
  nextCounts[phraseId] = Math.min(5, (nextCounts[phraseId] ?? 0) + 1);
  const shouldSignal = nextCounts[phraseId] >= PRACTICE_REVIEW_SIGNAL_THRESHOLD && !signaledPhraseIds.includes(phraseId);
  return {
    struggleCounts: nextCounts,
    signaledPhraseIds: shouldSignal ? [...signaledPhraseIds, phraseId] : [...signaledPhraseIds],
    signalPhraseId: shouldSignal ? phraseId : null,
  };
}
