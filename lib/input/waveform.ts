export const DEFAULT_WAVEFORM_PEAK_COUNT = 160;

export function createWaveformPeaks(
  channels: readonly Float32Array[],
  peakCount = DEFAULT_WAVEFORM_PEAK_COUNT,
) {
  const safePeakCount = Math.max(1, Math.round(peakCount));
  const sampleCount = channels[0]?.length ?? 0;
  if (sampleCount === 0) return Array.from({ length: safePeakCount }, () => 0);

  return Array.from({ length: safePeakCount }, (_, peakIndex) => {
    const start = Math.floor((peakIndex * sampleCount) / safePeakCount);
    const end = Math.max(start + 1, Math.floor(((peakIndex + 1) * sampleCount) / safePeakCount));
    let peak = 0;

    for (const channel of channels) {
      for (let sampleIndex = start; sampleIndex < Math.min(end, channel.length); sampleIndex += 1) {
        peak = Math.max(peak, Math.abs(channel[sampleIndex] ?? 0));
      }
    }

    return Math.min(1, peak);
  });
}
