import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { PRACTICE_SCENARIOS } from "./scenarios";
import { selectPracticeTargets } from "./targets";
import { createPracticeStateToken, readPracticeStateToken } from "./state-token";
import type { ReviewPhrase } from "@/lib/review/types";
import { applyPracticeOutcome } from "./adaptation";
import { validatePracticeTurn } from "./service";
import { practiceRequestSchema, MAX_PRACTICE_TURNS } from "./types";
import { consumePracticeNonce, consumePracticeRateLimit, resetPracticeGuardsForTests } from "./rate-limit";

function phrase(overrides: Partial<ReviewPhrase> = {}): ReviewPhrase {
  const id = overrides.id ?? "10000000-0000-4000-8000-000000000001";
  return {
    id,
    italianChunk: "Non vedo l'ora",
    meaningHu: "alig várom",
    noteHu: "Egyben használd.",
    register: "colloquial",
    sourceSessionId: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    review: {
      phraseId: id,
      state: "review",
      nextReviewAt: "2026-09-01T10:00:00.000Z",
      lastReviewedAt: null,
      reviewCount: 2,
      successCount: 1,
      lapseCount: 0,
      intervalDays: 3,
      difficulty: 2.2,
      lastRating: "good",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
    },
    ...overrides,
  };
}

describe("Real-Life Practice domain", () => {
  it("keeps the bounded scenario catalog configuration-driven", () => {
    expect(PRACTICE_SCENARIOS).toHaveLength(8);
    expect(new Set(PRACTICE_SCENARIOS.map((scenario) => scenario.id)).size).toBe(8);
    expect(PRACTICE_SCENARIOS.map((scenario) => scenario.id)).toContain("restaurant");
  });

  it("prioritizes lapsed and weak phrases deterministically and caps targets", () => {
    const stable = phrase({ id: "10000000-0000-4000-8000-000000000001", review: { ...phrase().review, state: "stable", phraseId: "10000000-0000-4000-8000-000000000001" } });
    const newPhrase = phrase({ id: "20000000-0000-4000-8000-000000000002", review: { ...phrase().review, state: "new", phraseId: "20000000-0000-4000-8000-000000000002" } });
    const lapsed = phrase({ id: "30000000-0000-4000-8000-000000000003", review: { ...phrase().review, state: "learning", lapseCount: 2, lastRating: "again", phraseId: "30000000-0000-4000-8000-000000000003" } });
    expect(selectPracticeTargets([stable, newPhrase, lapsed]).map((item) => item.phraseId)).toEqual([lapsed.id, newPhrase.id]);
    expect(selectPracticeTargets([stable, newPhrase, lapsed]).map((item) => item.referenceId)).toEqual(["target-1", "target-2"]);
  });

  it("signs source-light state, rejects tampering and expires deterministically", () => {
    const now = new Date("2026-09-01T10:00:00.000Z");
    const token = createPracticeStateToken({
      userId: "90000000-0000-4000-8000-000000000009",
      scenarioId: "restaurant",
      targetPhraseIds: ["10000000-0000-4000-8000-000000000001"],
      turnCount: 1,
      partnerReplyIt: "Cosa desidera?",
      nextGoalHu: "Válaszolj röviden.",
      struggleCounts: { "10000000-0000-4000-8000-000000000001": 0 },
      signaledPhraseIds: [],
    }, "test-secret-at-least-sixteen", now);
    const state = readPracticeStateToken(token, "test-secret-at-least-sixteen", now);
    expect(state).toMatchObject({ scenarioId: "restaurant", turnCount: 1 });
    expect(state).not.toHaveProperty("learnerResponse");
    expect(state).not.toHaveProperty("conversation");
    expect(readPracticeStateToken(`${token}x`, "test-secret-at-least-sixteen", now)).toBeNull();
    expect(readPracticeStateToken(token, "wrong-secret-at-least-sixteen", now)).toBeNull();
    expect(readPracticeStateToken(token, "test-secret-at-least-sixteen", new Date("2026-09-01T11:00:00.000Z"))).toBeNull();
  });

  it("validates contextual corrections, owned target references, and the three-turn minimum", () => {
    const target = selectPracticeTargets([phrase()]);
    const invalid = validatePracticeTurn({
      partnerReplyIt: "Va bene.", partnerReplyHuHint: null,
      learnerFeedback: { status: "needs_fix", correctedItalian: null, explanationHu: null, naturalAlternativeIt: null },
      targetUsage: { targetPhraseId: "target-1", usedSuccessfully: true },
      nextGoalHu: null, scenarioState: "complete",
    }, "respond", target, 1);
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.issues.join(" ")).toMatch(/correction|complete before|successful/i);
  });

  it("maps repeated grounded failures to one bounded server review signal", () => {
    const id = "10000000-0000-4000-8000-000000000001";
    const first = applyPracticeOutcome({ [id]: 0 }, [], id, "needs_fix");
    expect(first.signalPhraseId).toBeNull();
    const second = applyPracticeOutcome(first.struggleCounts, first.signaledPhraseIds, id, "needs_fix");
    expect(second.signalPhraseId).toBe(id);
    const third = applyPracticeOutcome(second.struggleCounts, second.signaledPhraseIds, id, "needs_fix");
    expect(third.signalPhraseId).toBeNull();
  });

  it("rejects browser ownership, target, and scheduling injection fields", () => {
    expect(practiceRequestSchema.safeParse({ action: "start", scenarioId: "restaurant", userId: "attacker" }).success).toBe(false);
    expect(practiceRequestSchema.safeParse({ action: "respond", stateToken: "x".repeat(50), learnerResponse: "Ciao", targetText: "arbitrary", nextReviewAt: "2099-01-01" }).success).toBe(false);
    expect(MAX_PRACTICE_TURNS).toBe(5);
  });

  it("rate-guards paid calls and rejects a replayed turn nonce", () => {
    resetPracticeGuardsForTests();
    const now = new Date("2026-09-01T10:00:00.000Z");
    for (let index = 0; index < 24; index += 1) expect(consumePracticeRateLimit("user-a", now)).toBe(true);
    expect(consumePracticeRateLimit("user-a", now)).toBe(false);
    expect(consumePracticeNonce("nonce-a")).toBe(true);
    expect(consumePracticeNonce("nonce-a")).toBe(false);
  });
});
