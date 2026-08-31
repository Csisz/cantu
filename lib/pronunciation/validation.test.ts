import { describe, expect, it } from "vitest";
import { MAX_SHADOWING_RECORDING_BYTES } from "./limits";
import { validatePronunciationFormData } from "./validation";

function webm(size = 16) {
  const bytes = new Uint8Array(Math.max(size, 4));
  bytes.set([0x1a, 0x45, 0xdf, 0xa3]);
  return new File([bytes], "practice.webm", { type: "audio/webm" });
}

function form(overrides: Partial<Record<"sessionId" | "chunkIndex" | "durationMs", string>> = {}, file = webm()) {
  const data = new FormData();
  data.set("sessionId", overrides.sessionId ?? "10000000-0000-4000-8000-000000000001");
  data.set("chunkIndex", overrides.chunkIndex ?? "0");
  data.set("durationMs", overrides.durationMs ?? "2500");
  data.set("recording", file);
  return data;
}

describe("pronunciation request validation", () => {
  it("accepts a short supported learner recording and canonical reference", async () => {
    await expect(validatePronunciationFormData(form())).resolves.toMatchObject({
      chunkIndex: 0,
      durationMs: 2_500,
      mimeType: "audio/webm",
    });
  });

  it("rejects excessive duration, size, remote-like text and unsupported audio", async () => {
    await expect(validatePronunciationFormData(form({ durationMs: "12001" }))).rejects.toHaveProperty("code", "too_long");
    await expect(validatePronunciationFormData(form({}, webm(MAX_SHADOWING_RECORDING_BYTES + 1)))).rejects.toHaveProperty("code", "too_large");
    await expect(validatePronunciationFormData(form({}, new File(["https://example.com/audio"], "audio.txt", { type: "text/plain" })))).rejects.toHaveProperty("code", "unsupported_format");
  });

  it("does not accept browser target text as request metadata", async () => {
    const data = form();
    data.set("targetText", "arbitrary paid transcription target");
    const result = await validatePronunciationFormData(data);
    expect(result).not.toHaveProperty("targetText");
  });
});

