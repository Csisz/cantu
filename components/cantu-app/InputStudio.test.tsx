import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/studio-reducer";
import { InputStudio } from "./InputStudio";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const saveAction = vi.fn(async () => ({ status: "success" as const }));
const transcriptSessionId = "10000000-0000-4000-8000-000000000099";

function renderStudio(initialMode: "listen" | "audio" | "text", authenticated = false) {
  return render(<InputStudio initialMode={initialMode} authenticated={authenticated} saveAction={saveAction} />);
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
    throw new Error(`Unexpected fetch: ${url} ${init?.method}`);
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

  it("continues from text to exact source confirmation and local learning preview", () => {
    renderStudio("text");
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "Ci vediamo domani mattina?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    expect(screen.getByRole("heading", { name: "Ezt fogjuk elemezni" })).toBeInTheDocument();
    expect(screen.getByText("Ci vediamo domani mattina?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    expect(screen.getByRole("heading", { name: /Innen épül majd fel/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mentéshez jelentkezz be" })).toHaveAttribute("href", "#library-title");
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
    await screen.findByRole("heading", { name: /Innen épül majd fel/i });
    expect(screen.getByText(/metaadatai elmentve/i)).toBeInTheDocument();
    const verificationCall = fetchSpy.mock.calls.find(([url]) => url === "/api/transcribe/verify")!;
    expect(verificationCall[1]?.body).toBe(JSON.stringify({ sessionId: transcriptSessionId, status: "user_verified" }));
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
  });

  it("builds a metadata-only text save form without source text", () => {
    renderStudio("text", true);
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "Questo testo resta locale." } });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    const form = screen.getByRole("button", { name: "Mentés a tanulásaim közé" }).closest("form")!;
    expect(Object.fromEntries(new FormData(form).entries())).toEqual({ inputType: "text", sourceCharCount: "26" });
    expect([...new FormData(form).values()]).not.toContain("Questo testo resta locale.");
  });
});
