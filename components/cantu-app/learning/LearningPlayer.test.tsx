import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningAnalysisV1, LearningAnalysisV2 } from "@/lib/analysis/schema";
import { LearningPlayer } from "./LearningPlayer";

const saveProgress = vi.fn(async (input: unknown) => {
  void input;
  return { status: "success", message: "A haladás elmentve." };
});
const savePhrase = vi.fn(async (input: unknown) => {
  void input;
  return { status: "success", message: "Elmentve a saját kifejezéseid közé.", duplicate: false };
});

vi.mock("@/lib/learning/client", () => ({
  persistLearningProgress: (input: unknown) => saveProgress(input),
  persistPhraseReference: (input: unknown) => savePhrase(input),
}));

const sessionId = "10000000-0000-4000-8000-000000000001";

function analysis(overrides: Partial<LearningAnalysisV1> = {}): LearningAnalysisV1 {
  return {
    schemaVersion: "learning-analysis-v1",
    analysisStatus: "ready",
    sourceLanguage: "it",
    explanationLanguage: "hu",
    languageAssessment: { detectedLanguage: "it", confidence: "high", noteHu: null },
    meaning: { naturalHu: "Alig várom, hogy holnap lássalak.", literalStructureHu: "Nem látom az óráját.", toneHu: "Hétköznapi, közvetlen." },
    chunks: [
      { sourceText: "non vedo l'ora", meaningHu: "alig várom", kind: "idiom", baseForm: "non vedere l'ora di", register: "colloquial", contextNoteHu: "Egyben használd." },
      { sourceText: "vederti domani", meaningHu: "holnap látni téged", kind: "phrase", baseForm: "vedere", register: "neutral", contextNoteHu: null },
    ],
    grammar: [{ titleHu: "Állandó szerkezet", explanationHu: "Itt a non vedere l'ora di egyetlen jelentésegység." }],
    pronunciation: { focus: ["vedo l'ora"], noteHu: "Mondd egy ritmusegységként." },
    transfer: [{ italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." }],
    recall: [
      { id: "q1", type: "meaning_choice", promptHu: "Mit jelent a kifejezés?", options: [{ id: "a", text: "Alig várom" }, { id: "b", text: "Nem érek rá" }], correctOptionId: "a", correctText: null, explanationHu: "Az egész kifejezés jelentése: alig várom." },
      { id: "q2", type: "fill_chunk", promptHu: "Írd vissza a kulcskifejezést.", options: [], correctOptionId: null, correctText: "non vedo l'ora", explanationHu: "A kifejezést egyben idézzük fel." },
    ],
    warnings: [],
    ...overrides,
  };
}

function analysisV2(): LearningAnalysisV2 {
  const base = analysis();
  return {
    ...base,
    schemaVersion: "learning-analysis-v2",
    chunks: base.chunks.map((chunk, index) => ({
      ...chunk,
      priority: index === 0 ? "core" : "useful",
      whyUsefulHu: index === 0 ? "Ezzel mondod el természetesen, hogy alig vársz valamit." : "Jól használható időpont-egyeztetéskor.",
    })),
    grammar: base.grammar.map((note) => ({
      ...note,
      example: { italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." },
    })),
    recall: base.recall.map((item, index) => ({
      ...item,
      difficulty: index === 0 ? "understand" : "recall",
      mistakeFeedbackHu: "A teljes kifejezés lelkes várakozást fejez ki.",
      reinforcementExample: index === 0
        ? { italian: "Non vedo l'ora di partire.", meaningHu: "Alig várom, hogy elinduljak." }
        : null,
    })),
    shortcut: {
      takeawayHu: "A non vedere l'ora a mondat legfontosabb, újrahasználható fordulata.",
      coreChunkIndexes: [0],
    },
    annotations: [{
      id: "core-1",
      sourceText: "non vedo l'ora",
      category: "core",
      chunkIndex: 0,
      titleHu: "A mondat kulcsa",
      explanationHu: "Nem szó szerint értjük: lelkes várakozást fejez ki.",
    }],
  };
}

async function reachChunks() {
  fireEvent.click(screen.getByRole("button", { name: "Tovább" }));
  await screen.findByRole("heading", { name: "Ezt érdemes megjegyezni" });
}

async function reachRecall() {
  await reachChunks();
  fireEvent.click(screen.getByRole("button", { name: "Mutasd a következőt" }));
  fireEvent.click(screen.getByRole("button", { name: "Ezt értem" }));
  await screen.findByRole("heading", { name: "Miért pont így mondják?" });
  expect(screen.getByText("Új tanítási példák · nem a forrás részei")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Jöhet a próba" }));
  await screen.findByRole("heading", { name: "Mondd ki te is" });
  fireEvent.click(screen.getByRole("button", { name: "Most kihagyom" }));
  await screen.findByRole("heading", { name: "Emlékszel?" });
}

describe("LearningPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveProgress.mockImplementation(async (input: unknown) => {
      void input;
      return { status: "success", message: "A haladás elmentve." };
    });
    savePhrase.mockImplementation(async (input: unknown) => {
      void input;
      return { status: "success", message: "Elmentve a saját kifejezéseid közé.", duplicate: false };
    });
  });

  it("shows natural meaning first and keeps literal structure optional", () => {
    render(<LearningPlayer sessionId={sessionId} analysis={analysis()} />);
    expect(screen.getByRole("heading", { name: "Mit jelent?" })).toBeInTheDocument();
    expect(screen.getByText("Alig várom, hogy holnap lássalak.")).toBeVisible();
    const details = screen.getByText("Szó szerint hogy áll össze?").closest("details");
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Szó szerint hogy áll össze?"));
    expect(details).toHaveAttribute("open");
  });

  it("teaches chunks progressively and saves only a canonical reference", async () => {
    render(<LearningPlayer sessionId={sessionId} analysis={analysis()} />);
    await reachChunks();
    expect(screen.getByText("non vedo l'ora")).toBeVisible();
    expect(screen.queryByText("vederti domani")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mentem ezt" }));
    await screen.findByRole("button", { name: "Elmentve ✓" });
    expect(savePhrase).toHaveBeenCalledWith({ sessionId, chunkIndex: 0 });
    expect(JSON.stringify(savePhrase.mock.calls.at(-1))).not.toContain("Non vedo l'ora di vederti domani.");
    expect(JSON.stringify(savePhrase.mock.calls[0])).not.toContain("Alig várom, hogy holnap lássalak");
    fireEvent.click(screen.getByRole("button", { name: "Mutasd a következőt" }));
    expect(screen.getByText("vederti domani")).toBeVisible();
  });

  it("shows interactive shadowing and local reference without claiming pronunciation scoring", async () => {
    render(<LearningPlayer sessionId={sessionId} analysis={analysis()} localPlaybackUrl="blob:cantu-local" />);
    await reachChunks();
    fireEvent.click(screen.getByRole("button", { name: "Mutasd a következőt" }));
    fireEvent.click(screen.getByRole("button", { name: "Ezt értem" }));
    fireEvent.click(await screen.findByRole("button", { name: "Jöhet a próba" }));
    expect(await screen.findByRole("heading", { name: "Mondd ki te is" })).toBeInTheDocument();
    expect(screen.getByLabelText("A helyi forrásrészlet lejátszása")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Felveszem" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Most kihagyom" })).toBeVisible();
    expect(screen.queryByText(/kiejtési pontszám/i)).not.toBeInTheDocument();
  });

  it("grades choice and fill recall deterministically and shows grounded feedback", async () => {
    render(<LearningPlayer sessionId={sessionId} analysis={analysis()} />);
    await reachRecall();
    fireEvent.click(screen.getByText("Nem érek rá"));
    fireEvent.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    expect(await screen.findByText("Nézzük meg.")).toBeVisible();
    expect(screen.getByText(/A helyes válasz:/)).toHaveTextContent("Alig várom");
    expect(screen.getByText("Az egész kifejezés jelentése: alig várom.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Következő kérdés" }));
    fireEvent.change(await screen.findByLabelText("Olasz válasz"), { target: { value: " NON VEDO L’ORA " } });
    fireEvent.click(screen.getByRole("button", { name: "Ellenőrzöm" }));
    expect(await screen.findByText("Pontosan.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Befejezem" }));
    expect(await screen.findByRole("heading", { name: "Most már érted — és van belőle valami, amit te is tudsz használni." })).toBeVisible();
    expect(screen.getByText("1 / 2")).toBeVisible();
    await waitFor(() => expect(saveProgress).toHaveBeenLastCalledWith({ sessionId, stage: "completed", recallScore: 50 }));
  });

  it("skips empty optional stages and resumes from saved progress", () => {
    const sparse = analysis({ chunks: [], grammar: [], pronunciation: null, transfer: [] });
    render(<LearningPlayer sessionId={sessionId} analysis={sparse} initialProgress={{ stage: "recall", recallScore: null }} />);
    expect(screen.getByRole("heading", { name: "Emlékszel?" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "90");
  });

  it("keeps the local lesson usable when progress or phrase persistence fails", async () => {
    saveProgress.mockResolvedValueOnce({ status: "error", message: "A haladás mentése megszakadt." });
    savePhrase.mockResolvedValueOnce({ status: "error", message: "A kifejezés mentése megszakadt.", duplicate: false });
    render(<LearningPlayer sessionId={sessionId} analysis={analysis()} />);
    fireEvent.click(screen.getByRole("button", { name: "Tovább" }));
    expect(await screen.findByRole("heading", { name: "Ezt érdemes megjegyezni" })).toBeVisible();
    expect(await screen.findByText("A haladás mentése megszakadt.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Mentem ezt" }));
    expect(await screen.findByText("A kifejezés mentése megszakadt.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Mutasd a következőt" })).toBeEnabled();
  });

  it("renders completion summary and local-only self-check when resuming a completed session", () => {
    render(<LearningPlayer sessionId={sessionId} analysis={analysis()} initialProgress={{ stage: "completed", recallScore: 75 }} initialSavedChunkIndices={[0]} />);
    expect(screen.getByRole("heading", { name: "Most már érted — és van belőle valami, amit te is tudsz használni." })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeVisible();
    expect(screen.getByText("1", { selector: "dd" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Nagyjából" }));
    expect(screen.getByRole("button", { name: "Nagyjából" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/csak ezen az oldalon marad/i)).toBeVisible();
  });

  it("bridges an active v2 source through annotation and Shortcut into the lesson", async () => {
    render(
      <LearningPlayer
        sessionId={sessionId}
        analysis={analysisV2()}
        activeSourceText="Non vedo l'ora di vederti domani."
      />,
    );
    expect(screen.getByRole("heading", { name: "Innen tanulunk" })).toBeVisible();
    expect(screen.getByText("Non vedo l'ora", { selector: "button span" })).toBeVisible();
    expect(screen.getByLabelText("Cantu robot útmutatása")).toHaveTextContent("Nézzük meg");
    fireEvent.click(screen.getByRole("button", { name: /Non vedo l'ora.*A lényeg/i }));
    expect(await screen.findByRole("heading", { name: "A mondat kulcsa" })).toBeVisible();
    expect(screen.getByText(/nem a forrás része/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Mentem ezt" }));
    await screen.findByRole("button", { name: "Elmentve ✓" });
    expect(savePhrase).toHaveBeenCalledWith({ sessionId, chunkIndex: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Mondd ki ezt" }));
    expect(screen.getByRole("button", { name: "Felveszem" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Magyarázat bezárása" }));
    fireEvent.click(screen.getByRole("button", { name: "Mutasd a Cantu Shortcutot" }));
    expect(await screen.findByRole("heading", { name: "Cantu Shortcut" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Megvan a Shortcut" }));
    expect(await screen.findByRole("heading", { name: "Mit jelent?" })).toBeVisible();
    expect(screen.getByText("Shortcut megvan ✓")).toBeVisible();
  });

  it("keeps v2 resume useful without reconstructing the complete source", async () => {
    render(
      <LearningPlayer
        sessionId={sessionId}
        analysis={analysisV2()}
        initialProgress={{ stage: "grammar", recallScore: null }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Az eredeti forrást nem mentettük el." })).toBeVisible();
    expect(screen.queryByText("Non vedo l'ora di vederti domani.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mutasd a Cantu Shortcutot" }));
    fireEvent.click(await screen.findByRole("button", { name: "Megvan a Shortcut" }));
    expect(await screen.findByRole("heading", { name: "Miért pont így mondják?" })).toBeVisible();
  });
});
