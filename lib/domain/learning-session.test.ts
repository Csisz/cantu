import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE_PAIR,
  buildLearningSessionInsert,
  learningSessionMetadataSchema,
  toLearningHistoryItems,
  toLearningSessionMetadata,
  toPersistenceInputType,
} from "./learning-session";

const auth = {
  status: "authenticated" as const,
  configured: true as const,
  user: { id: "10000000-0000-4000-8000-000000000001", email: "a@cantu.test", displayName: null },
};

describe("learning session persistence boundary", () => {
  it("maps the Listen UI mode to microphone persistence", () => {
    expect(toPersistenceInputType("listen")).toBe("microphone");
    expect(toPersistenceInputType("audio")).toBe("audio_file");
    expect(toPersistenceInputType("text")).toBe("text");
  });

  it("uses the fixed Italian and Hungarian language pair", () => {
    expect(DEFAULT_LANGUAGE_PAIR).toEqual({ sourceLanguage: "it", explanationLanguage: "hu" });
  });

  it("validates text and audio metadata bounds", () => {
    expect(learningSessionMetadataSchema.parse({ inputType: "text", sourceCharCount: 2000 })).toBeTruthy();
    expect(() => learningSessionMetadataSchema.parse({ inputType: "text", sourceCharCount: 2001 })).toThrow();
    expect(learningSessionMetadataSchema.parse({ inputType: "audio_file", sourceDurationMs: 30000 })).toBeTruthy();
    expect(() => learningSessionMetadataSchema.parse({ inputType: "audio_file", sourceDurationMs: 30001 })).toThrow();
  });

  it("creates a metadata-only insert with private retention defaults", () => {
    const insert = buildLearningSessionInsert(auth, { inputType: "text", sourceCharCount: 26 });
    expect(insert).toMatchObject({
      user_id: auth.user.id,
      input_type: "text",
      source_language: "it",
      explanation_language: "hu",
      source_status: "user_verified",
      source_char_count: 26,
      source_duration_ms: null,
      source_fingerprint: null,
      save_source: false,
      verified_source_text: null,
      source_retention_status: "not_stored",
    });
  });

  it("excludes text, file, blobs, audio bytes and waveform peaks", () => {
    const source = {
      kind: "audio" as const,
      fileName: "private.wav",
      fileType: "audio/wav",
      durationMs: 45_000,
      startMs: 5_000,
      endMs: 25_000,
    };
    const metadata = toLearningSessionMetadata(source);
    expect(metadata).toEqual({ inputType: "audio_file", sourceDurationMs: 20_000 });
    expect(Object.keys(metadata!)).not.toEqual(expect.arrayContaining([
      "fileName", "fileType", "file", "blob", "audioBytes", "waveform", "peaks", "durationMs",
    ]));

    const textMetadata = toLearningSessionMetadata({ kind: "text", text: "Questo resta locale." });
    expect(textMetadata).toEqual({ inputType: "text", sourceCharCount: 20 });
    expect(JSON.stringify(textMetadata)).not.toContain("Questo resta locale.");
  });

  it("projects generalized history without raw source fields", () => {
    const items = toLearningHistoryItems(
      [{
        id: "session-1",
        input_type: "text",
        source_status: "user_verified",
        source_duration_ms: null,
        source_char_count: 12,
        created_at: "2026-08-27T12:00:00Z",
      }],
      [{ session_id: "session-1", stage: "understand", percent_complete: 125, last_opened_at: "2026-08-27T13:00:00Z" }],
    );
    expect(items[0]).toMatchObject({ id: "session-1", inputType: "text", sourceCharCount: 12 });
    expect(items[0]?.progress.percentComplete).toBe(100);
    expect(JSON.stringify(items)).not.toMatch(/verified_source_text|source_fingerprint/);
  });
});
