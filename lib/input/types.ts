export type InputMode = "listen" | "audio" | "text";

export type TextLearningSource = {
  kind: "text";
  text: string;
  sourceStatus: "text_direct";
};

export type VerifiedAudioLearningSource = {
  kind: "audio" | "listen";
  text: string;
  sourceStatus: "user_verified" | "user_edited";
  sessionId: string;
  durationMs: number;
  localPlaybackUrl?: string;
};

export type LearningSource =
  | TextLearningSource
  | VerifiedAudioLearningSource;

export type InputStudioState =
  | { status: "entry"; mode: InputMode; draftText?: string }
  | { status: "source_confirmation"; source: TextLearningSource }
  | { status: "analysis_ready"; source: LearningSource };

export type InputStudioAction =
  | { type: "SELECT_MODE"; mode: InputMode }
  | { type: "SUBMIT_TEXT"; text: string }
  | { type: "COMPLETE_TRANSCRIPT"; source: VerifiedAudioLearningSource }
  | { type: "EDIT_SOURCE" }
  | { type: "CONFIRM_SOURCE" }
  | { type: "START_OVER"; mode?: InputMode };
