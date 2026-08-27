export const MAX_AUDIO_SELECTION_MS = 30_000;
export const TARGET_MIN_AUDIO_SELECTION_MS = 1_000;

export type AudioSelection = {
  startMs: number;
  endMs: number;
};

export type SelectionHandle = "start" | "end";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeDuration(durationMs: number) {
  return Math.max(0, Math.round(Number.isFinite(durationMs) ? durationMs : 0));
}

export function createAudioSelection(durationMs: number): AudioSelection {
  const duration = normalizeDuration(durationMs);
  return {
    startMs: 0,
    endMs: Math.min(duration, MAX_AUDIO_SELECTION_MS),
  };
}

export function updateAudioSelection(
  selection: AudioSelection,
  durationMs: number,
  handle: SelectionHandle,
  requestedMs: number,
): AudioSelection {
  const duration = normalizeDuration(durationMs);
  const minimumGap = Math.min(TARGET_MIN_AUDIO_SELECTION_MS, duration);
  const requested = Math.round(Number.isFinite(requestedMs) ? requestedMs : 0);

  if (duration <= 0) return { startMs: 0, endMs: 0 };

  const boundedStart = clamp(selection.startMs, 0, Math.max(0, duration - minimumGap));
  const boundedEnd = clamp(selection.endMs, boundedStart + minimumGap, duration);

  if (handle === "start") {
    const minimum = Math.max(0, boundedEnd - MAX_AUDIO_SELECTION_MS);
    const maximum = Math.max(minimum, boundedEnd - minimumGap);
    return { startMs: clamp(requested, minimum, maximum), endMs: boundedEnd };
  }

  const minimum = Math.min(duration, boundedStart + minimumGap);
  const maximum = Math.min(duration, boundedStart + MAX_AUDIO_SELECTION_MS);
  return { startMs: boundedStart, endMs: clamp(requested, minimum, maximum) };
}

export function formatAudioTime(milliseconds: number) {
  const safeMilliseconds = Math.max(0, Math.round(milliseconds));
  const minutes = Math.floor(safeMilliseconds / 60_000);
  const seconds = Math.floor((safeMilliseconds % 60_000) / 1_000);
  const tenths = Math.floor((safeMilliseconds % 1_000) / 100);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${tenths}`;
}
