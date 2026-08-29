import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListenInput } from "./ListenInput";

class FakeTrack extends EventTarget {
  stop = vi.fn();
}

class FakeMediaRecorder extends EventTarget {
  static isTypeSupported = vi.fn((type: string) => type.startsWith("audio/webm"));
  state: RecordingState = "inactive";
  mimeType: string;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    super();
    this.mimeType = options?.mimeType ?? "audio/webm";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    const dataEvent = new Event("dataavailable") as BlobEvent;
    Object.defineProperty(dataEvent, "data", {
      value: new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1])], { type: this.mimeType }),
    });
    this.dispatchEvent(dataEvent);
    this.dispatchEvent(new Event("stop"));
  }
}

describe("ListenInput microphone capture", () => {
  let track: FakeTrack;
  let getUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    track = new FakeTrack();
    getUserMedia = vi.fn(async () => ({ getTracks: () => [track] } as unknown as MediaStream));
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    Object.defineProperty(globalThis, "MediaRecorder", { configurable: true, value: FakeMediaRecorder });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:microphone-preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("requests permission only after an explicit click, records, stops and forwards the shared clip", async () => {
    const onTranscribe = vi.fn();
    render(<ListenInput onTranscribe={onTranscribe} onSelectMode={vi.fn()} />);
    expect(getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Felvétel indítása/i }));
    await screen.findByText("Felvétel folyamatban");
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    fireEvent.click(screen.getByRole("button", { name: "Felvétel leállítása" }));
    await screen.findByText("A rövid felvétel elkészült.");
    expect(track.stop).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Felvétel átírása" }));
    expect(onTranscribe).toHaveBeenCalledWith(expect.objectContaining({
      sourceType: "microphone",
      mimeType: expect.stringContaining("audio/webm"),
      blob: expect.any(Blob),
    }));
  });

  it("automatically stops at the configured 30-second limit", async () => {
    vi.useFakeTimers();
    render(<ListenInput onTranscribe={vi.fn()} onSelectMode={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Felvétel indítása/i }));
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(screen.getByText("A rövid felvétel elkészült.")).toBeInTheDocument();
    expect(screen.getByText("00:30.0")).toBeInTheDocument();
    expect(track.stop).toHaveBeenCalled();
  });

  it("cancels without producing a clip and cleans up tracks", async () => {
    const onTranscribe = vi.fn();
    render(<ListenInput onTranscribe={onTranscribe} onSelectMode={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Felvétel indítása/i }));
    await screen.findByText("Felvétel folyamatban");
    fireEvent.click(screen.getByRole("button", { name: "Mégse" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Felvétel indítása/i })).toBeVisible());
    expect(track.stop).toHaveBeenCalled();
    expect(onTranscribe).not.toHaveBeenCalled();
  });

  it("offers recovery after permission denial", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    const onSelectMode = vi.fn();
    render(<ListenInput onTranscribe={vi.fn()} onSelectMode={onSelectMode} />);
    fireEvent.click(screen.getByRole("button", { name: /Felvétel indítása/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/mikrofonengedélyt nem kaptuk meg/i);
    fireEvent.click(screen.getByRole("button", { name: "Hangfájlt választok" }));
    expect(onSelectMode).toHaveBeenCalledWith("audio");
    expect(screen.getByRole("button", { name: /Felvétel indítása/i })).toBeVisible();
  });

  it("reports unsupported browsers without requesting permission", () => {
    Object.defineProperty(globalThis, "MediaRecorder", { configurable: true, value: undefined });
    render(<ListenInput onTranscribe={vi.fn()} onSelectMode={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Felvétel indítása/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/nem támogatja/i);
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
