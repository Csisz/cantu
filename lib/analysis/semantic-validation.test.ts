import { describe, expect, it } from "vitest";
import {
  LEARNING_ANALYSIS_V1_SCHEMA_VERSION,
  LEARNING_ANALYSIS_SCHEMA_VERSION,
  learningAnalysisSchema,
  verifiedLearningSourceSchema,
  type LearningAnalysis,
} from "./schema";
import { sourceContainsExactChunk, validateLearningAnalysis } from "./semantic-validation";
import { analysisRequestSchema } from "./validation";

const source = verifiedLearningSourceSchema.parse({
  text: "Non vedo l’ora di vederti domani.",
  sourceStatus: "text_direct",
});

function readyAnalysis(): LearningAnalysis {
  return learningAnalysisSchema.parse({
    schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
    analysisStatus: "ready",
    sourceLanguage: "it",
    explanationLanguage: "hu",
    languageAssessment: { detectedLanguage: "it", confidence: "high", noteHu: null },
    meaning: {
      naturalHu: "Alig várom, hogy holnap lássalak.",
      literalStructureHu: "Nem látom az óráját annak, hogy holnap lássalak.",
      toneHu: "Meleg, hétköznapi várakozás.",
    },
    chunks: [{
      sourceText: "Non vedo l'ora",
      meaningHu: "Alig várom.",
      kind: "idiom",
      baseForm: "non vedere l'ora",
      register: "neutral",
      contextNoteHu: "Gyakori, természetes fordulat.",
      priority: "core",
      whyUsefulHu: "Gyakori, újrahasználható hétköznapi fordulat.",
    }],
    grammar: [{
      titleHu: "Di + főnévi igenév",
      explanationHu: "A di kapcsolja a várakozást a következő cselekvéshez.",
      example: { italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." },
    }],
    pronunciation: { focus: ["l’ora", "vederti"], noteHu: "Szövegalapú tipp: figyeld az elíziót és a ritmust." },
    transfer: [{ italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." }],
    recall: [
      {
        id: "meaning-1",
        type: "meaning_choice",
        promptHu: "Mit fejez ki a mondat?",
        options: [{ id: "a", text: "Várakozást" }, { id: "b", text: "Tiltást" }],
        correctOptionId: "a",
        correctText: null,
        explanationHu: "A fordulat lelkes várakozást fejez ki.",
        difficulty: "understand",
        mistakeFeedbackHu: "A fordulat várakozást fejez ki, nem tiltást.",
        reinforcementExample: { italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." },
      },
      {
        id: "fill-1",
        type: "fill_chunk",
        promptHu: "Egészítsd ki: Non vedo ___",
        options: [],
        correctOptionId: null,
        correctText: "l'ora",
        explanationHu: "A teljes fordulat: non vedere l'ora.",
        difficulty: "recall",
        mistakeFeedbackHu: "A névelő az aposztróffal együtt a kifejezés része.",
        reinforcementExample: null,
      },
    ],
    warnings: [],
    shortcut: {
      takeawayHu: "A non vedere l'ora fordulat oldja fel a mondat központi jelentését.",
      coreChunkIndexes: [0],
    },
    annotations: [{
      id: "core-1",
      sourceText: "Non vedo l'ora",
      category: "core",
      chunkIndex: 0,
      titleHu: "Kulcskifejezés",
      explanationHu: "Ezt a fordulatot egyben érdemes megjegyezni.",
    }],
  });
}

describe("learning analysis domain validation", () => {
  it("accepts harmless Unicode apostrophe and whitespace normalization for exact source chunks", () => {
    expect(sourceContainsExactChunk(source.text, "Non   vedo l'ora")).toBe(true);
    expect(validateLearningAnalysis(source, readyAnalysis()).success).toBe(true);
  });

  it("rejects an invented source quotation", () => {
    const candidate = readyAnalysis();
    candidate.chunks[0]!.sourceText = "non presente nella fonte";
    const result = validateLearningAnalysis(source, candidate);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.join(" ")).toContain("exact occurrence");
  });

  it("rejects invented annotations and invalid Shortcut references", () => {
    const invented = readyAnalysis();
    if (invented.schemaVersion !== LEARNING_ANALYSIS_SCHEMA_VERSION) throw new Error("Expected v2 fixture");
    invented.annotations[0]!.sourceText = "testo inventato";
    expect(validateLearningAnalysis(source, invented).success).toBe(false);

    const invalidShortcut = readyAnalysis();
    if (invalidShortcut.schemaVersion !== LEARNING_ANALYSIS_SCHEMA_VERSION) throw new Error("Expected v2 fixture");
    invalidShortcut.shortcut!.coreChunkIndexes = [4];
    expect(validateLearningAnalysis(source, invalidShortcut).success).toBe(false);
  });

  it("keeps persisted analysis v1 readable beside strict v2 results", () => {
    const current = readyAnalysis();
    if (current.schemaVersion !== LEARNING_ANALYSIS_SCHEMA_VERSION) throw new Error("Expected v2 fixture");
    const v1 = {
      schemaVersion: LEARNING_ANALYSIS_V1_SCHEMA_VERSION,
      analysisStatus: current.analysisStatus,
      sourceLanguage: current.sourceLanguage,
      explanationLanguage: current.explanationLanguage,
      languageAssessment: current.languageAssessment,
      meaning: current.meaning,
      chunks: current.chunks.map((chunk) => ({
        sourceText: chunk.sourceText,
        meaningHu: chunk.meaningHu,
        kind: chunk.kind,
        baseForm: chunk.baseForm,
        register: chunk.register,
        contextNoteHu: chunk.contextNoteHu,
      })),
      grammar: current.grammar.map((note) => ({
        titleHu: note.titleHu,
        explanationHu: note.explanationHu,
      })),
      pronunciation: current.pronunciation,
      transfer: current.transfer,
      recall: current.recall.map((item) => ({
        id: item.id,
        type: item.type,
        promptHu: item.promptHu,
        options: item.options,
        correctOptionId: item.correctOptionId,
        correctText: item.correctText,
        explanationHu: item.explanationHu,
      })),
      warnings: current.warnings,
    };
    expect(learningAnalysisSchema.safeParse(v1).success).toBe(true);
    expect(learningAnalysisSchema.safeParse(current).success).toBe(true);
  });

  it.each([
    ["chunks", 7],
    ["grammar", 3],
    ["transfer", 4],
    ["recall", 5],
  ] as const)("enforces the %s structural maximum", (field, count) => {
    const candidate = readyAnalysis();
    if (field === "recall") {
      candidate.recall = Array.from({ length: count }, (_, index) => ({ ...candidate.recall[0]!, id: `item-${index}` }));
    } else if (field === "transfer") {
      candidate.transfer = Array.from({ length: count }, (_, index) => ({ ...candidate.transfer[0]!, italian: `Vado al mercato ${index}.` }));
    } else if (field === "chunks") {
      candidate.chunks = Array.from({ length: count }, () => ({ ...candidate.chunks[0]!, sourceText: "domani" }));
    } else {
      candidate.grammar = Array.from({ length: count }, (_, index) => ({ ...candidate.grammar[0]!, titleHu: `Cím ${index}` }));
    }
    expect(validateLearningAnalysis(source, candidate).success).toBe(false);
  });

  it("enforces the pronunciation focus maximum", () => {
    const candidate = readyAnalysis();
    candidate.pronunciation!.focus = ["a", "b", "c", "d"];
    expect(validateLearningAnalysis(source, candidate).success).toBe(false);
  });

  it("requires deterministic recall answer metadata", () => {
    const candidate = readyAnalysis();
    candidate.recall[0]!.correctOptionId = "missing";
    expect(validateLearningAnalysis(source, candidate).success).toBe(false);
  });

  it.each(["not_italian", "insufficient_source"] as const)("allows restrained %s results", (analysisStatus) => {
    const candidate = readyAnalysis();
    Object.assign(candidate, {
      analysisStatus,
      meaning: null,
      chunks: [],
      grammar: [],
      pronunciation: null,
      transfer: [],
      recall: [],
      shortcut: null,
      annotations: [],
    });
    expect(validateLearningAnalysis(source, candidate).success).toBe(true);
  });

  it("rejects fake lesson material for a non-Italian result", () => {
    const candidate = readyAnalysis();
    candidate.analysisStatus = "not_italian";
    candidate.meaning = null;
    expect(validateLearningAnalysis(source, candidate).success).toBe(false);
  });

  it("defaults to Italian source and Hungarian explanation", () => {
    expect(verifiedLearningSourceSchema.parse({ text: "Come stai?", sourceStatus: "text_direct" })).toMatchObject({
      sourceLanguage: "it",
      explanationLanguage: "hu",
    });
  });

  it("accepts only verified source statuses and a maximum of 2,000 characters", () => {
    expect(analysisRequestSchema.safeParse({
      text: "a".repeat(2_000), sourceStatus: "text_direct", inputType: "text",
    }).success).toBe(true);
    expect(analysisRequestSchema.safeParse({
      text: "a".repeat(2_001), sourceStatus: "text_direct", inputType: "text",
    }).success).toBe(false);
    expect(analysisRequestSchema.safeParse({
      text: "Parole", sourceStatus: "stt_unverified", inputType: "audio_file", sessionId: crypto.randomUUID(),
    }).success).toBe(false);
  });
});
