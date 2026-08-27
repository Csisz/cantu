export type InputMode = "listen" | "audio" | "text";

export type TextLearningSource = {
  kind: "text";
  text: string;
};

export type AudioLearningSource = {
  kind: "audio";
  fileName: string;
  fileType: string;
  durationMs: number;
  startMs: number;
  endMs: number;
};

export type ListenLearningSource = {
  kind: "listen";
  mocked: true;
};

export type LearningSource =
  | TextLearningSource
  | AudioLearningSource
  | ListenLearningSource;

export type InputStudioState =
  | { status: "entry"; mode: InputMode; draftText?: string }
  | { status: "source_confirmation"; source: LearningSource }
  | { status: "learning_preview"; source: LearningSource };

export type InputStudioAction =
  | { type: "SELECT_MODE"; mode: InputMode }
  | { type: "SUBMIT_TEXT"; text: string }
  | { type: "SUBMIT_AUDIO"; source: AudioLearningSource }
  | { type: "PREVIEW_LISTEN_FLOW" }
  | { type: "EDIT_SOURCE" }
  | { type: "CONFIRM_SOURCE" }
  | { type: "START_OVER"; mode?: InputMode };
