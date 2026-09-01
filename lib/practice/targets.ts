import type { ReviewPhrase } from "@/lib/review/types";
import { MAX_PRACTICE_TARGETS, type PracticeTarget } from "./types";

const statePriority = { learning: 3, new: 2, review: 1, stable: 0 } as const;

export function practiceTargetPriority(phrase: ReviewPhrase) {
  return {
    lapses: phrase.review.lapseCount,
    failedRecently: phrase.review.lastRating === "again" ? 1 : 0,
    state: statePriority[phrase.review.state],
    createdAt: new Date(phrase.createdAt).getTime(),
  };
}

export function selectPracticeTargets(
  phrases: ReviewPhrase[],
  maximum = MAX_PRACTICE_TARGETS,
): PracticeTarget[] {
  return [...phrases]
    .sort((left, right) => {
      const a = practiceTargetPriority(left);
      const b = practiceTargetPriority(right);
      return b.lapses - a.lapses
        || b.failedRecently - a.failedRecently
        || b.state - a.state
        || b.createdAt - a.createdAt
        || left.id.localeCompare(right.id);
    })
    .slice(0, Math.max(0, Math.min(maximum, MAX_PRACTICE_TARGETS)))
    .map((phrase, index) => ({
      phraseId: phrase.id,
      referenceId: `target-${index + 1}`,
      italianChunk: phrase.italianChunk,
      meaningHu: phrase.meaningHu,
      noteHu: phrase.noteHu,
    }));
}
