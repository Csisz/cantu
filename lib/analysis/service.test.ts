import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { AuthContext } from "@/lib/auth/types";
import type { LanguageAnalysisProvider } from "@/lib/providers/analysis/types";
import { LEARNING_ANALYSIS_SCHEMA_VERSION } from "./schema";

const persistence = vi.hoisted(() => ({
  start: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
}));

vi.mock("@/lib/data/learning-analysis", () => ({
  startLearningAnalysis: persistence.start,
  completeLearningAnalysis: persistence.complete,
  failLearningAnalysis: persistence.fail,
}));

import { analyzeVerifiedSource, fingerprintVerifiedSource } from "./service";

const auth: AuthContext = {
  status: "authenticated",
  configured: true,
  user: { id: "10000000-0000-4000-8000-000000000001", email: "teszt@cantu.local", displayName: null },
};

const request = {
  text: "Non vedo l'ora di vederti domani.",
  sourceStatus: "text_direct" as const,
  inputType: "text" as const,
};

function readyAnalysis(chunk = "Non vedo l'ora") {
  return {
    schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
    analysisStatus: "ready",
    sourceLanguage: "it",
    explanationLanguage: "hu",
    languageAssessment: { detectedLanguage: "it", confidence: "high", noteHu: null },
    meaning: { naturalHu: "Alig várom, hogy holnap lássalak.", literalStructureHu: null, toneHu: null },
    chunks: [{
      sourceText: chunk,
      meaningHu: "Alig vár valamit.",
      kind: "idiom",
      baseForm: null,
      register: "neutral",
      contextNoteHu: null,
      priority: "core",
      whyUsefulHu: "Gyakori, újrahasználható fordulat.",
    }],
    grammar: [],
    pronunciation: null,
    transfer: [{ italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." }],
    recall: [
      {
        id: "meaning-1", type: "meaning_choice", promptHu: "Mit jelent?",
        options: [{ id: "a", text: "Alig várja" }, { id: "b", text: "Nem akarja" }],
        correctOptionId: "a", correctText: null, explanationHu: "Várakozást fejez ki.",
        difficulty: "understand", mistakeFeedbackHu: "A fordulat várakozást fejez ki.",
        reinforcementExample: { italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom az indulást." },
      },
      {
        id: "fill-1", type: "fill_chunk", promptHu: "Egészítsd ki.", options: [],
        correctOptionId: null, correctText: "l'ora", explanationHu: "Ez a rögzült fordulat része.",
        difficulty: "recall", mistakeFeedbackHu: "A teljes fordulat részeként idézd fel.",
        reinforcementExample: null,
      },
    ],
    warnings: [],
    shortcut: { takeawayHu: "A non vedere l'ora fordulat viszi a lényeget.", coreChunkIndexes: [0] },
    annotations: [{
      id: "core-1", sourceText: chunk, category: "core", chunkIndex: 0,
      titleHu: "Kulcskifejezés", explanationHu: "Ezt érdemes egyben megjegyezni.",
    }],
  };
}

function providerWith(results: unknown[]): LanguageAnalysisProvider {
  return {
    name: "test",
    model: "test-model",
    analyze: vi.fn(async () => ({ analysis: results.shift(), model: "test-model" })),
  };
}

describe("learning analysis orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistence.start.mockResolvedValue({
      sessionId: "20000000-0000-4000-8000-000000000002",
      attemptId: "30000000-0000-4000-8000-000000000003",
      cachedResult: null,
    });
    persistence.complete.mockResolvedValue(true);
    persistence.fail.mockResolvedValue(true);
  });

  it("persists only source-light metadata and a fingerprint before analysis", async () => {
    const provider = providerWith([readyAnalysis()]);
    const result = await analyzeVerifiedSource(auth, request, provider);
    expect(result.analysis.analysisStatus).toBe("ready");
    const persistencePayload = persistence.start.mock.calls[0]![1];
    expect(persistencePayload).toMatchObject({
      inputType: "text",
      sourceStatus: "text_direct",
      sourceCharCount: request.text.length,
      sourceFingerprint: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(persistencePayload).not.toHaveProperty("text");
    expect(persistencePayload).not.toHaveProperty("sourceText");
    expect(persistencePayload).not.toHaveProperty("bytes");
    expect(persistencePayload).not.toHaveProperty("waveform");
    expect(JSON.stringify(persistencePayload)).not.toContain(request.text);
  });

  it("allows exactly one corrective retry after semantic validation failure", async () => {
    const provider = providerWith([readyAnalysis("invented quotation"), readyAnalysis()]);
    await expect(analyzeVerifiedSource(auth, request, provider)).resolves.toMatchObject({ cached: false });
    expect(provider.analyze).toHaveBeenCalledTimes(2);
    expect(vi.mocked(provider.analyze).mock.calls[1]![1]?.correctionIssues?.join(" ")).toContain("exact occurrence");
  });

  it("stops after the second semantic failure and records only a normalized error", async () => {
    const provider = providerWith([readyAnalysis("invented one"), readyAnalysis("invented two")]);
    await expect(analyzeVerifiedSource(auth, request, provider)).rejects.toMatchObject({ code: "analysis_invalid" });
    expect(provider.analyze).toHaveBeenCalledTimes(2);
    expect(persistence.fail).toHaveBeenCalledWith(auth, expect.objectContaining({ errorCode: "analysis_invalid" }));
    expect(persistence.complete).not.toHaveBeenCalled();
  });

  it("reuses a current private session result without a provider call", async () => {
    persistence.start.mockResolvedValue({
      sessionId: "20000000-0000-4000-8000-000000000002",
      attemptId: null,
      cachedResult: readyAnalysis(),
    });
    const provider = providerWith([]);
    const reserve = vi.fn(async () => "reserved" as const);
    const result = await analyzeVerifiedSource(auth, request, provider, undefined, reserve);
    expect(result.cached).toBe(true);
    expect(provider.analyze).not.toHaveBeenCalled();
    expect(reserve).not.toHaveBeenCalled();
  });

  it("reserves quota once before a real provider attempt", async () => {
    const reserve = vi.fn(async () => "reserved" as const);
    const provider = providerWith([readyAnalysis()]);
    await analyzeVerifiedSource(auth, request, provider, undefined, reserve);
    expect(reserve).toHaveBeenCalledTimes(1);
    expect(provider.analyze).toHaveBeenCalledTimes(1);
  });
  it("does not call the provider and closes the attempt when quota is exhausted", async () => {
    const provider = providerWith([readyAnalysis()]);
    await expect(analyzeVerifiedSource(auth, request, provider, undefined, async () => "quota_exceeded")).rejects.toMatchObject({ code: "quota_exceeded" });
    expect(provider.analyze).not.toHaveBeenCalled();
    expect(persistence.fail).toHaveBeenCalledWith(auth, expect.objectContaining({ errorCode: "quota_exceeded" }));
  });

  it("creates deterministic but content-hiding source fingerprints", () => {
    const fingerprint = fingerprintVerifiedSource(request.text);
    expect(fingerprint).toHaveLength(64);
    expect(fingerprint).not.toContain("Non vedo");
    expect(fingerprintVerifiedSource(request.text)).toBe(fingerprint);
    expect(fingerprintVerifiedSource(`${request.text} `)).not.toBe(fingerprint);
  });
});
