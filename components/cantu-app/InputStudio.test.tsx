import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/studio-reducer";
import { InputStudio } from "./InputStudio";

const saveAction = vi.fn(async () => ({ status: "success" as const }));

function renderStudio(initialMode: "listen" | "audio" | "text", authenticated = false) {
  return render(
    <InputStudio
      initialMode={initialMode}
      authenticated={authenticated}
      saveAction={saveAction}
    />,
  );
}

const waveformSamples = Float32Array.from({ length: 4_500 }, (_, index) =>
  Math.sin(index / 9) * 0.6,
);

class AudioContextMock {
  decodeAudioData = vi.fn(async () => ({
    duration: 45,
    numberOfChannels: 1,
    getChannelData: () => waveformSamples,
  }));
  close = vi.fn(async () => undefined);
}

describe("InputStudio", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "AudioContext", {
      configurable: true,
      value: AudioContextMock,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:cantu-test-audio"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterAll(() => vi.restoreAllMocks());
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["listen" as const, /Vegyél fel egy rövid olasz részletet/i],
    ["audio" as const, /Válaszd ki pontosan/i],
    ["text" as const, /Mit szeretnél megérteni/i],
  ])("renders %s mode", (mode, heading) => {
    renderStudio(mode);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("continues from text to exact source confirmation and learning preview", () => {
    renderStudio("text");
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), {
      target: { value: "Ci vediamo domani mattina?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    expect(screen.getByRole("heading", { name: "Ezt fogjuk elemezni" })).toBeInTheDocument();
    expect(screen.getByText("Ci vediamo domani mattina?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));
    expect(screen.getByRole("heading", { name: /Innen épül majd fel/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mit jelent?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mentéshez jelentkezz be" })).toHaveAttribute("href", "#library-title");
  });

  it("does not allow empty text to continue", () => {
    renderStudio("text");
    expect(screen.getByRole("button", { name: "Ezt értsük meg" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Ezt értsük meg" })).toBeDisabled();
  });

  it("clamps long text and reports the 2,000 character limit", () => {
    renderStudio("text");
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), {
      target: { value: "a".repeat(TEXT_INPUT_MAX_CHARACTERS + 50) },
    });
    expect(screen.getByLabelText("Olasz szöveg")).toHaveValue("a".repeat(TEXT_INPUT_MAX_CHARACTERS));
    expect(screen.getByText("2000 / 2000 karakter")).toBeInTheDocument();
  });

  it("renders bounded audio selection and accessible local preview controls without fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderStudio("audio");
    const file = new File(["generated test bytes"], "generated-tone.wav", { type: "audio/wav" });
    Object.defineProperty(file, "arrayBuffer", {
      value: vi.fn(async () => new ArrayBuffer(16)),
    });

    fireEvent.change(screen.getByLabelText("Hangfájl kiválasztása"), {
      target: { files: [file] },
    });

    expect(await screen.findByRole("img", { name: /Helyi hullámforma/i })).toBeInTheDocument();
    expect(screen.getAllByText("00:30.0", { selector: "strong" })).toHaveLength(2);
    expect(screen.getByLabelText("Kezdőpont")).toHaveAttribute("aria-valuetext", "00:00.0");
    expect(screen.getByLabelText("Végpont")).toHaveAttribute("max", "30000");
    fireEvent.change(screen.getByLabelText("Végpont"), { target: { value: "45000" } });
    expect(screen.getByLabelText("Végpont")).toHaveValue("30000");

    expect(screen.getByRole("button", { name: /Lejátszás/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Szünet/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Leállítás/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Újrajátszás/i })).toBeEnabled();
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ezt a részt értsük meg" }));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cantu-test-audio"));
    expect(screen.getByText("generated-tone.wav")).toBeInTheDocument();
    expect(screen.getByText(/Átirat a következő mérföldkőben/i)).toBeInTheDocument();
  });

  it("builds a metadata-only text save form without the source text", () => {
    renderStudio("text", true);
    fireEvent.change(screen.getByLabelText("Olasz szöveg"), {
      target: { value: "Questo testo resta locale." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ezt értsük meg" }));
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));

    const form = screen.getByRole("button", { name: "Mentés a tanulásaim közé" }).closest("form");
    expect(form).not.toBeNull();
    const payload = new FormData(form!);
    expect(Object.fromEntries(payload.entries())).toEqual({
      inputType: "text",
      sourceCharCount: "26",
    });
    expect([...payload.values()]).not.toContain("Questo testo resta locale.");
  });

  it("builds an audio save form with selected duration only", async () => {
    renderStudio("audio", true);
    const file = new File(["generated bytes"], "private-local-name.wav", { type: "audio/wav" });
    Object.defineProperty(file, "arrayBuffer", { value: vi.fn(async () => new ArrayBuffer(16)) });
    fireEvent.change(screen.getByLabelText("Hangfájl kiválasztása"), { target: { files: [file] } });
    await screen.findByRole("img", { name: /Helyi hullámforma/i });
    fireEvent.click(screen.getByRole("button", { name: "Ezt a részt értsük meg" }));
    fireEvent.click(screen.getByRole("button", { name: "Rendben, tovább" }));

    const form = screen.getByRole("button", { name: "Mentés a tanulásaim közé" }).closest("form");
    const payload = new FormData(form!);
    expect(Object.fromEntries(payload.entries())).toEqual({
      inputType: "audio_file",
      sourceDurationMs: "30000",
    });
    expect([...payload.values()]).not.toContain("private-local-name.wav");
  });
});
