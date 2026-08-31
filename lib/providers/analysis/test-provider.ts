import "server-only";

import { LEARNING_ANALYSIS_SCHEMA_VERSION, type VerifiedLearningSource } from "@/lib/analysis/schema";
import type { AnalysisProviderResult, LanguageAnalysisProvider } from "./types";

function firstReusableChunk(text: string) {
  const words = text.trim().split(/\s+/);
  return words.slice(0, Math.min(3, words.length)).join(" ").replace(/[.!?,;:]+$/u, "");
}

export class TestLanguageAnalysisProvider implements LanguageAnalysisProvider {
  readonly name = "test";
  readonly model = "cantu-test-analysis";

  async analyze(input: VerifiedLearningSource): Promise<AnalysisProviderResult> {
    const wordCount = input.text.trim().split(/\s+/).length;
    if (wordCount < 2 || input.text.trim().length < 6) {
      return {
        model: this.model,
        analysis: {
          schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
          analysisStatus: "insufficient_source",
          sourceLanguage: "it",
          explanationLanguage: "hu",
          languageAssessment: {
            detectedLanguage: "it",
            confidence: "unknown",
            noteHu: "Egy kissé hosszabb olasz mondatból hasznosabb mini leckét tudunk készíteni.",
          },
          meaning: null,
          chunks: [],
          grammar: [],
          pronunciation: null,
          transfer: [],
          recall: [],
          warnings: [{ code: "short_source", messageHu: "A forrás túl rövid a hasznos elemzéshez." }],
          shortcut: null,
          annotations: [],
        },
      };
    }

    if (/^this is |^hello world/i.test(input.text)) {
      return {
        model: this.model,
        analysis: {
          schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
          analysisStatus: "not_italian",
          sourceLanguage: "it",
          explanationLanguage: "hu",
          languageAssessment: {
            detectedLanguage: "en",
            confidence: "high",
            noteHu: "Ez valószínűleg nem olasz.",
          },
          meaning: null,
          chunks: [],
          grammar: [],
          pronunciation: null,
          transfer: [],
          recall: [],
          warnings: [{ code: "not_italian", messageHu: "A Cantu első verziója olaszhoz készült." }],
          shortcut: null,
          annotations: [],
        },
      };
    }

    const chunk = firstReusableChunk(input.text);
    return {
      model: this.model,
      usage: { inputTokens: 80, outputTokens: 180, totalTokens: 260 },
      analysis: {
        schemaVersion: LEARNING_ANALYSIS_SCHEMA_VERSION,
        analysisStatus: "ready",
        sourceLanguage: "it",
        explanationLanguage: "hu",
        languageAssessment: {
          detectedLanguage: "it",
          confidence: "high",
          noteHu: null,
        },
        meaning: {
          naturalHu: "A beszélő egy természetes, hétköznapi gondolatot fejez ki.",
          literalStructureHu: "A mondat olasz felépítését érdemes a teljes kifejezéssel együtt megjegyezni.",
          toneHu: "Semleges, társalgási hangvétel.",
        },
        chunks: [{
          sourceText: chunk,
          meaningHu: "Újra használható részlet ebből a mondatból.",
          kind: chunk.includes(" ") ? "phrase" : "word",
          baseForm: null,
          register: "neutral",
          contextNoteHu: "A pontos jelentést mindig a teljes mondat adja meg.",
          priority: "core",
          whyUsefulHu: "Ezt a részletet egyben megjegyezve más hétköznapi helyzetben is használhatod.",
        }],
        grammar: [{
          titleHu: "A mondat szerkezete",
          explanationHu: "Az olaszban a kifejezéseket gyakran érdemes szókapcsolatként megtanulni.",
          example: { italian: "Ne parliamo dopo.", meaningHu: "Beszéljünk róla később." },
        }],
        pronunciation: {
          focus: [chunk],
          noteHu: "Szöveg alapján figyeld meg a szókapcsolat ritmusát; ez nem akusztikus értékelés.",
        },
        transfer: [{ italian: "Possiamo parlarne più tardi?", meaningHu: "Beszélhetünk róla később?" }],
        recall: [
          {
            id: "meaning-1",
            type: "meaning_choice",
            promptHu: "Melyik leírás illik legjobban a forrás hangvételéhez?",
            options: [
              { id: "a", text: "Természetes, hétköznapi közlés" },
              { id: "b", text: "Hivatalos jogi szöveg" },
            ],
            correctOptionId: "a",
            correctText: null,
            explanationHu: "A forrás társalgási olasz nyelvet használ.",
            difficulty: "understand",
            mistakeFeedbackHu: "Itt a hétköznapi hangvétel a fontos, nem egy hivatalos szövegtípus.",
            reinforcementExample: {
              italian: "Ci sentiamo più tardi.",
              meaningHu: "Később beszélünk.",
            },
          },
          {
            id: "chunk-1",
            type: "fill_chunk",
            promptHu: "Írd vissza a kiemelt olasz részletet.",
            options: [],
            correctOptionId: null,
            correctText: chunk,
            explanationHu: "A teljes szókapcsolat aktív felidézése segíti a későbbi használatot.",
            difficulty: "recall",
            mistakeFeedbackHu: "A kifejezést egyben idézd fel; ne fordítsd vissza szavanként.",
            reinforcementExample: null,
          },
        ],
        warnings: [],
        shortcut: {
          takeawayHu: "Ha ezt az egy kifejezést egyben viszed magaddal, már megvan a mondat legjobban újrahasználható része.",
          coreChunkIndexes: [0],
        },
        annotations: [{
          id: "core-1",
          sourceText: chunk,
          category: "core",
          chunkIndex: 0,
          titleHu: "A mondat kulcsa",
          explanationHu: "Ez a részlet viszi a mondat legfontosabb, továbbvihető gondolatát.",
        }],
      },
    };
  }
}
