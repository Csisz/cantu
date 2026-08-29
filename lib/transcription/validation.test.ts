import { describe, expect, it } from "vitest";
import { validateTranscriptionFormData } from "./validation";

function wavFile(durationMs: number, sampleRate = 1_000) {
  const samples = Math.round((durationMs * sampleRate) / 1_000);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples * 2, true);
  return new File([buffer], "selected-clip.wav", { type: "audio/wav" });
}

function form(clip: File, durationMs: string, sourceType = "audio_file") {
  const body = new FormData();
  body.set("clip", clip);
  body.set("durationMs", durationMs);
  body.set("sourceType", sourceType);
  return body;
}

describe("server transcription input validation", () => {
  it("accepts a valid selected WAV and verifies its real duration", async () => {
    await expect(validateTranscriptionFormData(form(wavFile(2_000), "2000"))).resolves.toMatchObject({
      mimeType: "audio/wav",
      durationMs: 2_000,
      sourceType: "audio_file",
    });
  });

  it("rejects a forged WAV duration and a clip over 30 seconds", async () => {
    await expect(validateTranscriptionFormData(form(wavFile(2_000), "10000"))).rejects.toMatchObject({ code: "invalid_audio" });
    await expect(validateTranscriptionFormData(form(wavFile(30_001), "30001"))).rejects.toMatchObject({ code: "too_long" });
  });

  it("rejects missing, empty, unsupported and signature-mismatched clips", async () => {
    await expect(validateTranscriptionFormData(new FormData())).rejects.toMatchObject({ code: "too_long" });
    await expect(validateTranscriptionFormData(form(new File([], "empty.wav", { type: "audio/wav" }), "1000"))).rejects.toMatchObject({ code: "invalid_audio" });
    await expect(validateTranscriptionFormData(form(new File(["x"], "clip.flac", { type: "audio/flac" }), "1000"))).rejects.toMatchObject({ code: "unsupported_format" });
    await expect(validateTranscriptionFormData(form(new File(["not wav"], "clip.wav", { type: "audio/wav" }), "1000"))).rejects.toMatchObject({ code: "invalid_audio" });
  });
});
