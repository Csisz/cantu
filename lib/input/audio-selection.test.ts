import { describe, expect, it } from "vitest";
import {
  createAudioSelection,
  MAX_AUDIO_SELECTION_MS,
  updateAudioSelection,
} from "./audio-selection";

describe("audio selection", () => {
  it("never creates or extends a selection beyond 30 seconds", () => {
    expect(createAudioSelection(90_000)).toEqual({ startMs: 0, endMs: 30_000 });
    const updated = updateAudioSelection(
      { startMs: 10_000, endMs: 20_000 },
      90_000,
      "end",
      80_000,
    );
    expect(updated.endMs - updated.startMs).toBe(MAX_AUDIO_SELECTION_MS);
  });

  it("clamps selection to source duration", () => {
    expect(createAudioSelection(12_345)).toEqual({ startMs: 0, endMs: 12_345 });
    expect(
      updateAudioSelection({ startMs: 5_000, endMs: 10_000 }, 12_345, "end", 99_000),
    ).toEqual({ startMs: 5_000, endMs: 12_345 });
  });

  it("prevents start and end from inverting", () => {
    const start = updateAudioSelection(
      { startMs: 5_000, endMs: 12_000 },
      20_000,
      "start",
      18_000,
    );
    const end = updateAudioSelection(
      { startMs: 5_000, endMs: 12_000 },
      20_000,
      "end",
      1_000,
    );
    expect(start).toEqual({ startMs: 11_000, endMs: 12_000 });
    expect(end).toEqual({ startMs: 5_000, endMs: 6_000 });
  });
});
