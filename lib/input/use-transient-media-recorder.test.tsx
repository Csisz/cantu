import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTransientMediaRecorder } from "./use-transient-media-recorder";

class RecorderStub extends EventTarget {
  static isTypeSupported(type: string) { return type.startsWith("audio/webm"); }
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  start() { this.state = "recording"; }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    const data = new Event("dataavailable");
    Object.defineProperty(data, "data", {
      value: new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1])], { type: this.mimeType }),
    });
    this.dispatchEvent(data);
    this.dispatchEvent(new Event("stop"));
  }
}

describe("useTransientMediaRecorder", () => {
  const stopTrack = vi.fn();
  const getUserMedia = vi.fn();
  const createObjectURL = vi.fn(() => "blob:practice");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopTrack, addEventListener: vi.fn() }],
    });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: RecorderStub });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  });

  afterEach(() => vi.useRealTimers());

  it("requests permission only after explicit start and supports stop/replay cleanup", async () => {
    const { result, unmount } = renderHook(() => useTransientMediaRecorder(12_000));
    expect(getUserMedia).not.toHaveBeenCalled();
    await act(() => result.current.start());
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("recording");
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe("recorded"));
    expect(result.current.recording?.previewUrl).toBe("blob:practice");
    expect(stopTrack).toHaveBeenCalled();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:practice");
  });

  it("automatically stops at the short configurable limit", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTransientMediaRecorder(12_000));
    await act(() => result.current.start());
    await act(async () => { vi.advanceTimersByTime(12_000); });
    expect(result.current.status).toBe("recorded");
    expect(result.current.recording?.durationMs).toBe(12_000);
  });

  it("cancels recording, stops tracks and does not retain a Blob", async () => {
    const { result } = renderHook(() => useTransientMediaRecorder(12_000));
    await act(() => result.current.start());
    act(() => result.current.cancel());
    expect(result.current.status).toBe("idle");
    expect(result.current.recording).toBeNull();
    expect(stopTrack).toHaveBeenCalled();
  });

  it("normalizes denied and unsupported capture states", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    const denied = renderHook(() => useTransientMediaRecorder(12_000));
    await act(() => denied.result.current.start());
    expect(denied.result.current.error).toBe("permission_denied");
    denied.unmount();

    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: undefined });
    const unsupported = renderHook(() => useTransientMediaRecorder(12_000));
    await act(() => unsupported.result.current.start());
    expect(unsupported.result.current.error).toBe("unsupported");
  });
});

