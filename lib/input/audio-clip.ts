import { MAX_AUDIO_SELECTION_MS } from "./limits";

export const EXTRACTED_AUDIO_MIME_TYPE = "audio/wav";

export type AudioBufferLike = {
  sampleRate: number;
  numberOfChannels: number;
  length: number;
  getChannelData(channel: number): Float32Array;
};

export type AudioClipInput = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  sourceType: "microphone" | "audio_file";
};

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function extractSelectionAsWav(
  audioBuffer: AudioBufferLike,
  startMs: number,
  endMs: number,
): Blob {
  const roundedStart = Math.round(startMs);
  const roundedEnd = Math.round(endMs);
  const durationMs = roundedEnd - roundedStart;
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    roundedStart < 0 ||
    durationMs < 1 ||
    durationMs > MAX_AUDIO_SELECTION_MS ||
    audioBuffer.sampleRate <= 0 ||
    audioBuffer.numberOfChannels < 1
  ) {
    throw new Error("Invalid audio selection");
  }

  const startFrame = Math.floor((roundedStart * audioBuffer.sampleRate) / 1_000);
  const requestedEndFrame = Math.ceil((roundedEnd * audioBuffer.sampleRate) / 1_000);
  const endFrame = Math.min(audioBuffer.length, requestedEndFrame);
  if (startFrame >= endFrame || startFrame >= audioBuffer.length) {
    throw new Error("Audio selection is outside the decoded source");
  }

  const frameCount = endFrame - startFrame;
  const bytesPerSample = 2;
  const dataBytes = frameCount * bytesPerSample;
  const wav = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(wav);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, channel) =>
    audioBuffer.getChannelData(channel),
  );
  for (let frame = 0; frame < frameCount; frame += 1) {
    let mono = 0;
    for (const channel of channels) mono += channel[startFrame + frame] ?? 0;
    mono = Math.max(-1, Math.min(1, mono / channels.length));
    view.setInt16(44 + frame * 2, Math.round(mono < 0 ? mono * 0x8000 : mono * 0x7fff), true);
  }

  return new Blob([wav], { type: EXTRACTED_AUDIO_MIME_TYPE });
}
