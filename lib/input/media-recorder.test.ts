import { describe, expect, it, vi } from "vitest";
import { chooseMediaRecorderMimeType, microphoneErrorCode } from "./media-recorder";

describe("MediaRecorder capability boundary", () => {
  it("chooses the first browser-supported recording MIME type", () => {
    const mediaRecorder = { isTypeSupported: vi.fn((type: string) => type === "audio/ogg;codecs=opus") };
    expect(chooseMediaRecorderMimeType(mediaRecorder as unknown as typeof MediaRecorder)).toBe("audio/ogg;codecs=opus");
  });

  it("allows the browser default when no preferred MIME is available", () => {
    const mediaRecorder = { isTypeSupported: vi.fn(() => false) };
    expect(chooseMediaRecorderMimeType(mediaRecorder as unknown as typeof MediaRecorder)).toBe("");
  });

  it("normalizes recoverable microphone errors", () => {
    expect(microphoneErrorCode(new DOMException("denied", "NotAllowedError"))).toBe("permission_denied");
    expect(microphoneErrorCode(new DOMException("missing", "NotFoundError"))).toBe("no_device");
    expect(microphoneErrorCode(new DOMException("busy", "NotReadableError"))).toBe("interrupted");
    expect(microphoneErrorCode(new Error("unknown"))).toBe("capture_failed");
  });
});
