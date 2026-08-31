import { describe, expect, it } from "vitest";
import type { LearningAnalysisV1 } from "@/lib/analysis/schema";
import {
  calculateRecallScore,
  gradeRecallAnswer,
  isLessonComplete,
  lessonStageSequence,
  normalizeRecallAnswer,
  normalizePhraseIdentity,
  phraseSaveReference,
  resumeLessonStage,
  stagePercent,
} from "./player";

function analysis(overrides: Partial<LearningAnalysisV1> = {}): LearningAnalysisV1 {
  return {
    schemaVersion: "learning-analysis-v1",
    analysisStatus: "ready",
    sourceLanguage: "it",
    explanationLanguage: "hu",
    languageAssessment: { detectedLanguage: "it", confidence: "high", noteHu: null },
    meaning: { naturalHu: "Alig várom, hogy holnap lássalak.", literalStructureHu: null, toneHu: null },
    chunks: [{ sourceText: "non vedo l'ora", meaningHu: "alig várom", kind: "idiom", baseForm: null, register: "colloquial", contextNoteHu: null }],
    grammar: [{ titleHu: "Állandó szerkezet", explanationHu: "Egyben érdemes megjegyezni." }],
    pronunciation: { focus: ["vedo l'ora"], noteHu: "Mondd egy ritmusegységként." },
    transfer: [{ italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." }],
    recall: [
      { id: "q1", type: "meaning_choice", promptHu: "Mit jelent?", options: [{ id: "a", text: "Alig várom" }, { id: "b", text: "Nem látom" }], correctOptionId: "a", correctText: null, explanationHu: "Állandó kifejezés." },
      { id: "q2", type: "fill_chunk", promptHu: "Írd be.", options: [], correctOptionId: null, correctText: "L'ora", explanationHu: "Az aposztróf része a formának." },
    ],
    warnings: [],
    ...overrides,
  };
}

describe("learning player domain", () => {
  it("builds the pedagogical stage order and skips empty optional stages", () => {
    expect(lessonStageSequence(analysis())).toEqual(["meaning", "chunks", "grammar", "say", "recall", "completed"]);
    expect(lessonStageSequence(analysis({ chunks: [], grammar: [], pronunciation: null, transfer: [] })))
      .toEqual(["meaning", "recall", "completed"]);
  });

  it("centralizes deterministic stage percentages and resume selection", () => {
    expect(stagePercent("meaning")).toBe(20);
    expect(stagePercent("completed")).toBe(100);
    const stages = ["meaning", "say", "recall", "completed"] as const;
    expect(resumeLessonStage("notice", [...stages])).toBe("say");
    expect(resumeLessonStage("completed", [...stages])).toBe("completed");
  });

  it("grades choices and minimally normalized fill answers without accepting paraphrases", () => {
    const [choice, fill] = analysis().recall;
    expect(gradeRecallAnswer(choice!, "a")).toBe(true);
    expect(gradeRecallAnswer(choice!, "b")).toBe(false);
    expect(gradeRecallAnswer(fill!, "  L’ORA  ")).toBe(true);
    expect(gradeRecallAnswer(fill!, "ora")).toBe(false);
    expect(normalizeRecallAnswer("  PIÙ   TARDI ")).toBe("più tardi");
  });

  it("calculates recall score from answered items and determines completion", () => {
    const answers = [
      { itemId: "q1", answer: "a", correct: true },
      { itemId: "q2", answer: "ora", correct: false },
    ];
    expect(calculateRecallScore(answers)).toBe(50);
    expect(isLessonComplete("recall", answers, 2)).toBe(false);
    expect(isLessonComplete("completed", answers, 2)).toBe(true);
  });

  it("builds a phrase-save reference without complete source or derived text fields", () => {
    const dto = phraseSaveReference("10000000-0000-4000-8000-000000000001", 2);
    expect(dto).toEqual({ sessionId: "10000000-0000-4000-8000-000000000001", chunkIndex: 2 });
    expect(dto).not.toHaveProperty("sourceText");
    expect(dto).not.toHaveProperty("meaningHu");
    expect(dto).not.toHaveProperty("audio");
  });

  it("uses a stable private-session phrase identity for idempotent saves", () => {
    expect(normalizePhraseIdentity("  NON   VEDO L’ORA ")).toBe("non vedo l’ora");
    expect(normalizePhraseIdentity("Non vedo l’ora")).toBe(normalizePhraseIdentity(" non vedo l’ora "));
  });
});
