import type { InputMode, InputStudioAction, InputStudioState } from "./types";
import { TEXT_INPUT_MAX_CHARACTERS } from "./limits";

export { TEXT_INPUT_MAX_CHARACTERS } from "./limits";

export function normalizeTextInput(text: string) {
  return text.trim().slice(0, TEXT_INPUT_MAX_CHARACTERS);
}

export function createInitialInputStudioState(mode: InputMode): InputStudioState {
  return { status: "entry", mode };
}

export function inputStudioReducer(
  state: InputStudioState,
  action: InputStudioAction,
): InputStudioState {
  switch (action.type) {
    case "SELECT_MODE":
      return { status: "entry", mode: action.mode };
    case "SUBMIT_TEXT": {
      const text = normalizeTextInput(action.text);
      return text
        ? { status: "source_confirmation", source: { kind: "text", text } }
        : state;
    }
    case "SUBMIT_AUDIO":
      return { status: "source_confirmation", source: action.source };
    case "PREVIEW_LISTEN_FLOW":
      return {
        status: "source_confirmation",
        source: { kind: "listen", mocked: true },
      };
    case "EDIT_SOURCE":
      if (state.status === "entry") return state;
      return {
        status: "entry",
        mode: state.source.kind,
        draftText: state.source.kind === "text" ? state.source.text : undefined,
      };
    case "CONFIRM_SOURCE":
      return state.status === "source_confirmation"
        ? { status: "learning_preview", source: state.source }
        : state;
    case "START_OVER":
      return {
        status: "entry",
        mode: action.mode ?? (state.status === "entry" ? state.mode : state.source.kind),
      };
  }
}
