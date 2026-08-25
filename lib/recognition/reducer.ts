import type { EntryMode, RecognitionEvent, RecognitionState } from "./types";

export function createInitialRecognitionState(mode: EntryMode): RecognitionState {
  return { type: "entry", mode };
}

export function recognitionReducer(
  state: RecognitionState,
  event: RecognitionEvent,
): RecognitionState {
  switch (event.type) {
    case "SELECT_MODE":
      return { type: "entry", mode: event.mode };
    case "START_LISTENING":
      return { type: "listening" };
    case "START_IDENTIFYING":
      return { type: "identifying", source: event.source };
    case "CANDIDATE_FOUND":
      return { type: "candidate", source: event.source, candidate: event.candidate };
    case "CONFIRM_CANDIDATE":
      return state.type === "candidate" ? { type: "confirmed", candidate: state.candidate } : state;
    case "REJECT_CANDIDATE":
      return state.type === "candidate" ? { type: "rejected", candidate: state.candidate } : state;
    case "SHOW_NO_MATCH":
      return { type: "no-match", source: event.source };
    case "OPEN_MANUAL_SEARCH":
      return { type: "manual-search" };
    case "RETRY_LISTEN":
      return { type: "entry", mode: "listen" };
    case "CANCEL":
      return { type: "entry", mode: state.type === "identifying" && state.source === "upload" ? "upload" : "listen" };
  }
}
