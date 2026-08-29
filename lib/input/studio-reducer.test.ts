import { describe, expect, it } from "vitest";
import {
  createInitialInputStudioState,
  inputStudioReducer,
  normalizeTextInput,
  TEXT_INPUT_MAX_CHARACTERS,
} from "./studio-reducer";

describe("Input Studio domain", () => {
  it("enforces the 2,000 character text limit", () => {
    expect(normalizeTextInput(`  ${"a".repeat(2_100)}`)).toHaveLength(TEXT_INPUT_MAX_CHARACTERS);
  });

  it("moves exact normalized text through confirmation and preview", () => {
    const initial = createInitialInputStudioState("text");
    const confirmation = inputStudioReducer(initial, {
      type: "SUBMIT_TEXT",
      text: "  Ci vediamo domani?  ",
    });
    expect(confirmation).toEqual({
      status: "source_confirmation",
      source: { kind: "text", text: "Ci vediamo domani?", sourceStatus: "text_direct" },
    });
    const preview = inputStudioReducer(confirmation, { type: "CONFIRM_SOURCE" });
    expect(preview.status).toBe("learning_preview");
  });

  it("keeps empty text at entry and restores submitted text for editing", () => {
    const initial = createInitialInputStudioState("text");
    expect(inputStudioReducer(initial, { type: "SUBMIT_TEXT", text: "   " })).toBe(initial);
    const confirmation = inputStudioReducer(initial, {
      type: "SUBMIT_TEXT",
      text: "Come stai?",
    });
    expect(inputStudioReducer(confirmation, { type: "EDIT_SOURCE" })).toEqual({
      status: "entry",
      mode: "text",
      draftText: "Come stai?",
    });
  });
});
