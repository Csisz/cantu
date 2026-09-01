import { describe, expect, it } from "vitest";
import { buildReviewItem, gradeReviewAnswer, normalizeItalianReviewAnswer } from "./grading";
import { buildReviewQueue, MAX_REVIEW_SESSION_ITEMS, sortReviewQueue } from "./queue";
import { REVIEW_SCHEDULE_CONFIG, initialReviewAt, scheduleReview } from "./scheduler";
import type { ReviewPhrase } from "./types";

const now = new Date("2026-08-31T10:00:00.000Z");

function phrase(overrides: Partial<ReviewPhrase> = {}): ReviewPhrase {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    italianChunk: "Non vedo l'ora",
    meaningHu: "Alig várom",
    noteHu: "Egyben érdemes megjegyezni.",
    register: "colloquial",
    sourceSessionId: null,
    createdAt: "2026-08-29T10:00:00.000Z",
    review: {
      phraseId: "10000000-0000-4000-8000-000000000001",
      state: "new",
      nextReviewAt: "2026-08-30T10:00:00.000Z",
      lastReviewedAt: null,
      reviewCount: 0,
      successCount: 0,
      lapseCount: 0,
      intervalDays: 1,
      difficulty: REVIEW_SCHEDULE_CONFIG.initialDifficulty,
      lastRating: null,
      createdAt: "2026-08-29T10:00:00.000Z",
      updatedAt: "2026-08-29T10:00:00.000Z",
    },
    ...overrides,
  };
}

describe("review scheduler", () => {
  it("initializes a new phrase exactly one UTC day later", () => {
    expect(initialReviewAt(now)).toBe("2026-09-01T10:00:00.000Z");
  });

  it.each([
    ["again", 1, 1],
    ["hard", 1, 0],
    ["good", 3, 0],
    ["easy", 7, 0],
  ] as const)("applies the explainable %s interval", (rating, interval, lapses) => {
    const result = scheduleReview(phrase().review, rating, now);
    expect(result.intervalDays).toBe(interval);
    expect(result.lapseCount).toBe(lapses);
    expect(result.nextReviewAt).toBe(new Date(now.getTime() + interval * 86_400_000).toISOString());
  });

  it("keeps intervals and difficulty bounded under repeated success and failure", () => {
    let state = phrase().review;
    for (let index = 0; index < 20; index += 1) {
      state = { ...state, ...scheduleReview(state, "easy", now) };
    }
    expect(state.intervalDays).toBe(REVIEW_SCHEDULE_CONFIG.maxIntervalDays);
    expect(state.difficulty).toBe(REVIEW_SCHEDULE_CONFIG.minDifficulty);
    expect(state.state).toBe("stable");
    for (let index = 0; index < 20; index += 1) {
      state = { ...state, ...scheduleReview(state, "again", now) };
    }
    expect(state.intervalDays).toBeGreaterThanOrEqual(1);
    expect(state.difficulty).toBe(REVIEW_SCHEDULE_CONFIG.maxDifficulty);
    expect(state.intervalDays).not.toBeLessThan(0);
  });

  it("is deterministic for an injected instant", () => {
    expect(scheduleReview(phrase().review, "good", now))
      .toEqual(scheduleReview(phrase().review, "good", new Date(now.toISOString())));
  });
});

describe("review queue and grading", () => {
  const second = phrase({
    id: "20000000-0000-4000-8000-000000000002",
    italianChunk: "A che ora?",
    meaningHu: "Hány órakor?",
    review: {
      ...phrase().review,
      phraseId: "20000000-0000-4000-8000-000000000002",
      nextReviewAt: "2026-08-30T10:00:00.000Z",
      lapseCount: 3,
    },
  });

  it("prioritizes overdue then lapsed items, excludes future items and caps at ten", () => {
    const future = phrase({ id: "30000000-0000-4000-8000-000000000003", review: { ...phrase().review, phraseId: "30000000-0000-4000-8000-000000000003", nextReviewAt: "2026-09-02T10:00:00.000Z" } });
    expect(sortReviewQueue([phrase(), second, future], now).map((item) => item.id)).toEqual([second.id, phrase().id]);
    const many = Array.from({ length: 15 }, (_, index) => phrase({ id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, review: { ...phrase().review, phraseId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}` } }));
    expect(buildReviewQueue(many, now)).toHaveLength(MAX_REVIEW_SESSION_ITEMS);
  });

  it("grades Hungarian choices and Italian typed answers without AI", () => {
    const choice = buildReviewItem(phrase(), [phrase(), second]);
    expect(choice.activityType).toBe("it_to_hu");
    expect(gradeReviewAnswer(choice, choice.correctOptionId!)).toBe(true);
    expect(gradeReviewAnswer(choice, "not-an-option")).toBe(false);

    const typedPhrase = phrase({ review: { ...phrase().review, reviewCount: 1 } });
    const typed = buildReviewItem(typedPhrase, [typedPhrase, second]);
    expect(typed.activityType).toBe("hu_to_it");
    expect(gradeReviewAnswer(typed, "  NON   VEDO L’ORA ")).toBe(true);
    expect(gradeReviewAnswer(typed, "Non aspetto")).toBe(false);
    expect(normalizeItalianReviewAnswer("  PIÙ   TARDI ")).toBe("più tardi");
  });

  it("creates a deterministic fill activity without source reconstruction", () => {
    const fillPhrase = phrase({ review: { ...phrase().review, reviewCount: 2 } });
    const item = buildReviewItem(fillPhrase, [fillPhrase, second]);
    expect(item.activityType).toBe("fill_chunk");
    expect(item.prompt).toContain("_____");
    expect(gradeReviewAnswer(item, item.correctText!)).toBe(true);
    expect(item).not.toHaveProperty("sourceText");
    expect(item).not.toHaveProperty("audio");
  });
});
