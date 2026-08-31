import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/studio-reducer";
import { InputStudio } from "./InputStudio";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const transcriptSessionId = "10000000-0000-4000-8000-000000000099";

function readyAnalysis(sourceText = "Ci vediamo domani") {
  return {
    schemaVersion: "learning-analysis-v1",
    analysisStatus: "ready",
    sourceLanguage: "it",
    explanationLanguage: "hu",
    languageAssessment: { detectedLanguage: "it", confidence: "high", noteHu: null },
    meaning: { naturalHu: "Holnap reggel találkozunk?", literalStructureHu: null, toneHu: "Hétköznapi kérdés." },
    chunks: [{ sourceText, meaningHu: "Holnap találkozunk.", kind: "phrase", baseForm: null, register: "neutral", contextNoteHu: null }],
    grammar: [{ titleHu: "Jelen idő", explanationHu: "Az olasz jelen idő közeljövőre is utalhat." }],
    pronunciation: { focus: ["vediamo"], noteHu: "Szövegalapú tipp: figyeld az összefolyó ritmust." },
    transfer: [{ italian: "Ci sentiamo questa sera?", meaningHu: "Beszélünk ma este?" }],
    recall: [
      { id: "q1", type: "meaning_choice", promptHu: "Mikor találkoznak?", options: [{ id: "a", text: "Holnap" }, { id: "b", text: "Tegnap" }], correctOptionId: "a", correctText: null, explanationHu: "A domani jelentése holnap." },
      { id: "q2", type: "fill_chunk", promptHu: "Egészítsd ki a kifejezést.", options: [], correctOptionId: null, correctText: "vediamo", explanationHu: "A vediamo a vedere ragozott alakja." },
    ],
    warnings: [],
  };
}

function renderStudio(initialMode: "listen" | "audio" | "text", authenticated = false) {
  return render(<InputStudio initialMode={initialMode} authenticated={authenticated} />);
}

const sampleRate = 16_000;
const waveformSamples = Float32Array.from({ length: 45 * sampleRate }, (_, index) => Math.sin(index / 9) * 0.6);

class AudioContextMock {
  decodeAudioData = vi.fn(async () => ({
    duration: 45,
    sampleRate,
    length: waveformSamples.length,
    numberOfChannels: 1,
    getChannelData: () => waveformSamples,
  }));
  close = vi.fn(async () => undefined);
}

function generatedFile(name = "generated-tone.wav") {
  const file = new File(["full-source-must-remain-local"], name, { type: "audio/wav" });
  Object.defineProperty(file, "arrayBuffer", { value: vi.fn(async () => new ArrayBuffer(16)) });
  return file;
}

async function loadAudio(name?: string) {
  fireEvent.change(screen.getByLabelText("Hangfájl kiválasztása"), { target: { files: [generatedFile(name)] } });
  await screen.findByRole("img", { name: /Helyi hullámforma/i });
}

function mockTranscriptionFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === "/api/transcribe") {
      return Response.json({
        sessionId: transcriptSessionId,
        transcript: { text: "Ci vediamo domani mattina?", detectedLanguage: "it" },
      });
    }
    if (url === "/api/transcribe/verify") return Response.json({ ok: true });
    if (url === "/api/analyze") {
      return Response.json({
        analysis: readyAnalysis(),
        sessionId: transcriptSessionId,
        cached: false,
        generation: {
          model: "cantu-test-analysis", reasoningEffort: "low",
          schemaVersion: "learning-analysis-v1", promptVersion: "cantu-analysis-v1", latencyMs: 10,
        },
      });
    }
    throw new Error(`Unexpected fetch: ${url} ${init?.method}`);
  });
}

function mockAnalysisFetch(analysis: unknown = readyAnalysis()) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    if (String(input) === "/api/analyze") {
      return Response.json({
        analysis,
        sessionId: transcriptSessionId,
        cached: false,
        generation: {
          model: "cantu-test-analysis",
          reasoningEffort: "low",
          schemaVersion: "learning-analysis-v1",
          promptVersion: "cantu-analysis-v1",
          latencyMs: 12,
        },
      });
    }
    throw new Error(`Unexpected fetch: ${String(input)}`);
  });
}

describe("InputStudio", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "AudioContext", { configurable: true, value: AudioContextMock });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:cantu-test-audio") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterAll(() => vi.restoreAllMocks());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  it.each([
    ["listen" as const, /Vegyél fel egy rövid olasz részletet/i],
    ["audio" as const, /Válaszd ki pontosan/i],
    ["text" as const, /Mit szeretnél megérteni/i],
  ])("renders %s mode", (mode, heading) => {
    renderStudio(mode);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("continues from text to exact source confirmation and reaches the auth boundary only on explicit analysis", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderStudio("text");
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "Ci vediamo domani mattina?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    expect(screen.getByRole("heading", { name: "Ezt fogjuk elemezni" })).toBeInTheDocument();
    expect(screen.getByText("Ci vediamo domani mattina?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    expect(screen.getByRole("heading", { name: /Készen áll a megértésre/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    const analyzeButton = screen.getByRole("button", { name: "Értsük meg" });
    fireEvent.click(analyzeButton);
    fireEvent.click(analyzeButton);
    expect(screen.getByRole("heading", { name: "Az elemzéshez jelentkezz be" })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks empty text and clamps text to 2,000 characters", () => {
    renderStudio("text");
    const button = screen.getByRole("button", { name: "Ezt értsük meg" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "a".repeat(TEXT_INPUT_MAX_CHARACTERS + 50) } });
    expect(screen.getByLabelText("Olasz szöveg")).toHaveValue("a".repeat(TEXT_INPUT_MAX_CHARACTERS));
    expect(screen.getByText("2000 / 2000 karakter")).toBeInTheDocument();
  });

  it("renders bounded audio selection and makes no request before explicit transcription", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderStudio("audio");
    await loadAudio();
    expect(screen.getByLabelText("Kezdőpont")).toHaveAttribute("aria-valuetext", "00:00.0");
    expect(screen.getByLabelText("Végpont")).toHaveAttribute("max", "30000");
    fireEvent.change(screen.getByLabelText("Végpont"), { target: { value: "45000" } });
    expect(screen.getByLabelText("Végpont")).toHaveValue("30000");
    expect(screen.getByRole("button", { name: /Lejátszás/i })).toBeEnabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps unauthenticated audio local and reaches the auth boundary without a request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderStudio("audio");
    await loadAudio("private-full-source.wav");
    fireEvent.click(screen.getByRole("button", { name: "Kijelölt rész átírása" }));
    expect(screen.getByRole("heading", { name: "Az átíráshoz jelentkezz be" })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends only the generated selected clip, displays an unconfirmed candidate, and verifies it", async () => {
    const fetchSpy = mockTranscriptionFetch();
    renderStudio("audio", true);
    await loadAudio("private-full-source.wav");
    fireEvent.click(screen.getByRole("button", { name: "Kijelölt rész átírása" }));
    expect(await screen.findByRole("heading", { name: "Ezt hallottam" })).toBeInTheDocument();
    expect(screen.getByText("Ci vediamo domani mattina?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Igen, pontos" })).toBeVisible();

    const transcriptionCall = fetchSpy.mock.calls.find(([url]) => url === "/api/transcribe")!;
    const body = transcriptionCall[1]?.body as FormData;
    const sentClip = body.get("clip") as File;
    expect(sentClip.name).toBe("selected-clip.wav");
    expect(sentClip.type).toBe("audio/wav");
    expect([...body.values()]).not.toContain("private-full-source.wav");

    fireEvent.click(screen.getByRole("button", { name: "Igen, pontos" }));
    await screen.findByRole("heading", { name: /Készen áll a megértésre/i });
    const verificationCall = fetchSpy.mock.calls.find(([url]) => url === "/api/transcribe/verify")!;
    expect(verificationCall[1]?.body).toBe(JSON.stringify({ sessionId: transcriptSessionId, status: "user_verified" }));
    const analyzeButton = screen.getByRole("button", { name: "Értsük meg" });
    fireEvent.click(analyzeButton);
    fireEvent.click(analyzeButton);
    expect(await screen.findByRole("heading", { name: "Mit jelent?" })).toBeInTheDocument();
    expect(fetchSpy.mock.calls.filter(([url]) => url === "/api/analyze")).toHaveLength(1);
    const analysisCall = fetchSpy.mock.calls.find(([url]) => url === "/api/analyze")!;
    expect(JSON.parse(String(analysisCall[1]?.body))).toMatchObject({
      text: "Ci vediamo domani mattina?",
      sourceStatus: "user_verified",
      inputType: "audio_file",
      sessionId: transcriptSessionId,
    });
  });

  it("marks a corrected transcript as user_edited without sending the text to persistence", async () => {
    const fetchSpy = mockTranscriptionFetch();
    renderStudio("audio", true);
    await loadAudio();
    fireEvent.click(screen.getByRole("button", { name: "Kijelölt rész átírása" }));
    await screen.findByRole("heading", { name: "Ezt hallottam" });
    fireEvent.click(screen.getByRole("button", { name: "Javítom" }));
    fireEvent.change(screen.getByLabelText("Javított olasz szöveg"), { target: { value: "Ci vediamo domani sera?" } });
    fireEvent.click(screen.getByRole("button", { name: "Javítás megerősítése" }));
    await screen.findByText("Ci vediamo domani sera?");

    const verificationCall = fetchSpy.mock.calls.find(([url]) => url === "/api/transcribe/verify")!;
    expect(verificationCall[1]?.body).toBe(JSON.stringify({ sessionId: transcriptSessionId, status: "user_edited" }));
    expect(String(verificationCall[1]?.body)).not.toContain("Ci vediamo");
    fireEvent.click(screen.getByRole("button", { name: "Értsük meg" }));
    await screen.findByRole("heading", { name: "Mit jelent?" });
    const analysisCall = fetchSpy.mock.calls.find(([url]) => url === "/api/analyze")!;
    expect(JSON.parse(String(analysisCall[1]?.body))).toMatchObject({
      text: "Ci vediamo domani sera?",
      sourceStatus: "user_edited",
    });
    expect(String(analysisCall[1]?.body)).not.toContain("Ci vediamo domani mattina?");
  });

  it("analyzes confirmed text only after an explicit action and renders the structured preview", async () => {
    const fetchSpy = mockAnalysisFetch();
    renderStudio("text", true);
    const text = "Ci vediamo domani mattina?";
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Értsük meg" }));
    expect(await screen.findByRole("heading", { name: "Mit jelent?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ezt érdemes megjegyezni" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tovább" }));
    expect(screen.getByRole("heading", { name: "Ezt érdemes megjegyezni" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ezt értem" }));
    expect(screen.getByRole("heading", { name: "Miért pont így mondják?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Próbáld más helyzetben" })).toBeInTheDocument();
    const analysisCalls = fetchSpy.mock.calls.filter(([url]) => url === "/api/analyze");
    expect(analysisCalls).toHaveLength(1);
    const call = analysisCalls[0]!;
    expect(call[0]).toBe("/api/analyze");
    expect(JSON.parse(String(call[1]?.body))).toEqual({
      text,
      sourceStatus: "text_direct",
      inputType: "text",
    });
  });

  it("shows a recoverable Hungarian provider error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(
      { error: { code: "provider_unavailable" } },
      { status: 503 },
    ));
    renderStudio("text", true);
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "Possiamo parlarne domani?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    fireEvent.click(screen.getByRole("button", { name: "Értsük meg" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/átmenetileg nem érhető el/i);
    expect(screen.getByRole("button", { name: "Újrapróbálom" })).toBeEnabled();
  });

  it("renders a restrained non-Italian state without fabricated lesson sections", async () => {
    mockAnalysisFetch({
      schemaVersion: "learning-analysis-v1",
      analysisStatus: "not_italian",
      sourceLanguage: "it",
      explanationLanguage: "hu",
      languageAssessment: { detectedLanguage: "en", confidence: "high", noteHu: "Ez angolnak tűnik." },
      meaning: null,
      chunks: [], grammar: [], pronunciation: null, transfer: [], recall: [],
      warnings: [{ code: "not_italian", messageHu: "Nem olasz forrás." }],
    });
    renderStudio("text", true);
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "This is definitely English." } });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    fireEvent.click(screen.getByRole("button", { name: "Értsük meg" }));
    expect(await screen.findByRole("heading", { name: "Ez valószínűleg nem olasz." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mit jelent?" })).not.toBeInTheDocument();
  });
});
