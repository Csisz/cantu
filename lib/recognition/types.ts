export type EntryMode = "listen" | "upload";
export type RecognitionSource = EntryMode | "manual";

export type RecognitionCandidate = {
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
};

export type RecognitionState =
  | { type: "entry"; mode: EntryMode }
  | { type: "listening" }
  | { type: "identifying"; source: RecognitionSource }
  | { type: "candidate"; source: RecognitionSource; candidate: RecognitionCandidate }
  | { type: "confirmed"; candidate: RecognitionCandidate }
  | { type: "rejected"; candidate: RecognitionCandidate }
  | { type: "no-match"; source: RecognitionSource }
  | { type: "manual-search" };

export type RecognitionEvent =
  | { type: "SELECT_MODE"; mode: EntryMode }
  | { type: "START_LISTENING" }
  | { type: "START_IDENTIFYING"; source: RecognitionSource }
  | { type: "CANDIDATE_FOUND"; source: RecognitionSource; candidate: RecognitionCandidate }
  | { type: "CONFIRM_CANDIDATE" }
  | { type: "REJECT_CANDIDATE" }
  | { type: "SHOW_NO_MATCH"; source: RecognitionSource }
  | { type: "OPEN_MANUAL_SEARCH" }
  | { type: "RETRY_LISTEN" }
  | { type: "CANCEL" };
