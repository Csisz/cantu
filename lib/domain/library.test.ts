import { describe, expect, it } from "vitest";
import { toLibraryItems } from "./library";

describe("library projection", () => {
  it("keeps the authenticated empty state empty", () => {
    expect(toLibraryItems([])).toEqual([]);
  });

  it("adds safe progress defaults without fabricating lesson data", () => {
    expect(
      toLibraryItems([
        {
          songId: "song-1",
          title: "Volare",
          artist: "Domenico Modugno",
          artworkUrl: null,
          savedAt: "2026-08-25T12:00:00Z",
          stage: null,
          percentComplete: null,
          lastOpenedAt: null,
        },
      ])[0]?.progress,
    ).toEqual({ stage: "new", percentComplete: 0, lastOpenedAt: null });
  });
});
