import { z } from "zod";
import { MAX_AUDIO_SELECTION_MS } from "@/lib/input/limits";
import { TranscriptionError } from "@/lib/providers/speech/types";

export const MAX_TRANSCRIPTION_CLIP_BYTES = 2 * 1024 * 1024;
export const MAX_TRANSCRIPTION_REQUEST_BYTES = MAX_TRANSCRIPTION_CLIP_BYTES + 64 * 1024;

export const ALLOWED_AUDIO_MIME_BASES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
]);

const metadataSchema = z.object({
  sourceType: z.enum(["microphone", "audio_file"]),
  durationMs: z.coerce.number().int().min(1).max(MAX_AUDIO_SELECTION_MS),
});

export function audioMimeBase(mimeType: string) {
  return mimeType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function hasAscii(bytes: Uint8Array, offset: number, value: string) {
  return value.split("").every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

export function hasSupportedAudioSignature(bytes: Uint8Array, mimeType: string) {
  const base = audioMimeBase(mimeType);
  if (base === "audio/wav" || base === "audio/x-wav") {
    return bytes.length >= 44 && hasAscii(bytes, 0, "RIFF") && hasAscii(bytes, 8, "WAVE");
  }
  if (base === "audio/webm") {
    return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }
  if (base === "audio/ogg") return bytes.length >= 4 && hasAscii(bytes, 0, "OggS");
  if (base === "audio/mp4") return bytes.length >= 12 && hasAscii(bytes, 4, "ftyp");
  if (base === "audio/mpeg") {
    return bytes.length >= 3 && (hasAscii(bytes, 0, "ID3") || (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0));
  }
  return false;
}

export function getWavDurationMs(bytes: Uint8Array) {
  if (!hasSupportedAudioSignature(bytes, "audio/wav")) throw new TranscriptionError("invalid_audio");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let byteRate = 0;
  let dataSize = 0;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkSize = view.getUint32(offset + 4, true);
    if (hasAscii(bytes, offset, "fmt ") && chunkSize >= 16 && offset + 20 <= bytes.length) {
      byteRate = view.getUint32(offset + 16, true);
    }
    if (hasAscii(bytes, offset, "data")) {
      dataSize = Math.min(chunkSize, Math.max(0, bytes.length - offset - 8));
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  if (byteRate <= 0 || dataSize <= 0) throw new TranscriptionError("invalid_audio");
  return Math.round((dataSize / byteRate) * 1_000);
}

export type ValidatedTranscriptionClip = {
  bytes: Uint8Array;
  mimeType: string;
  durationMs: number;
  sourceType: "microphone" | "audio_file";
};

export async function validateTranscriptionFormData(formData: FormData): Promise<ValidatedTranscriptionClip> {
  const parsed = metadataSchema.safeParse({
    sourceType: formData.get("sourceType"),
    durationMs: formData.get("durationMs"),
  });
  if (!parsed.success) {
    const durationIssue = parsed.error.issues.some((issue) => issue.path[0] === "durationMs");
    throw new TranscriptionError(durationIssue ? "too_long" : "invalid_audio");
  }

  const clip = formData.get("clip");
  if (!(clip instanceof File) || clip.size === 0) throw new TranscriptionError("invalid_audio");
  if (clip.size > MAX_TRANSCRIPTION_CLIP_BYTES) throw new TranscriptionError("too_large");
  if (!ALLOWED_AUDIO_MIME_BASES.has(audioMimeBase(clip.type))) throw new TranscriptionError("unsupported_format");

  const bytes = new Uint8Array(await clip.arrayBuffer());
  if (!hasSupportedAudioSignature(bytes, clip.type)) throw new TranscriptionError("invalid_audio");
  if (audioMimeBase(clip.type).includes("wav")) {
    const actualDurationMs = getWavDurationMs(bytes);
    if (actualDurationMs > MAX_AUDIO_SELECTION_MS) throw new TranscriptionError("too_long");
    if (Math.abs(actualDurationMs - parsed.data.durationMs) > 750) {
      throw new TranscriptionError("invalid_audio");
    }
  }

  return {
    bytes,
    mimeType: clip.type,
    durationMs: parsed.data.durationMs,
    sourceType: parsed.data.sourceType,
  };
}
