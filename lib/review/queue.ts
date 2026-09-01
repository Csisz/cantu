import { buildReviewItem } from "./grading";
import type { ReviewItem, ReviewPhrase } from "./types";

export const MAX_REVIEW_SESSION_ITEMS = 10;

export function isReviewDue(nextReviewAt: string, now: Date) {
  return new Date(nextReviewAt).getTime() <= now.getTime();
}

export function sortReviewQueue(phrases: ReviewPhrase[], now: Date) {
  return phrases
    .filter((phrase) => isReviewDue(phrase.review.nextReviewAt, now))
    .sort((left, right) => {
      const dueDifference = new Date(left.review.nextReviewAt).getTime()
        - new Date(right.review.nextReviewAt).getTime();
      if (dueDifference !== 0) return dueDifference;
      if (left.review.lapseCount !== right.review.lapseCount) {
        return right.review.lapseCount - left.review.lapseCount;
      }
      if (left.review.successCount !== right.review.successCount) {
        return left.review.successCount - right.review.successCount;
      }
      return left.id.localeCompare(right.id);
    });
}

export function buildReviewQueue(
  phrases: ReviewPhrase[],
  now: Date,
  maxItems = MAX_REVIEW_SESSION_ITEMS,
): ReviewItem[] {
  return sortReviewQueue(phrases, now)
    .slice(0, Math.max(0, Math.min(maxItems, MAX_REVIEW_SESSION_ITEMS)))
    .map((phrase) => buildReviewItem(phrase, phrases));
}
