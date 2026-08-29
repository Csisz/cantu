export const MEDIA_RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;

export function chooseMediaRecorderMimeType(mediaRecorder: typeof MediaRecorder) {
  return MEDIA_RECORDER_MIME_CANDIDATES.find((mimeType) => mediaRecorder.isTypeSupported(mimeType)) ?? "";
}

export type MicrophoneErrorCode =
  | "permission_denied"
  | "no_device"
  | "unsupported"
  | "interrupted"
  | "empty_recording"
  | "capture_failed";

export function microphoneErrorCode(error: unknown): MicrophoneErrorCode {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "permission_denied";
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "no_device";
    if (error.name === "NotReadableError" || error.name === "AbortError") return "interrupted";
  }
  return "capture_failed";
}
