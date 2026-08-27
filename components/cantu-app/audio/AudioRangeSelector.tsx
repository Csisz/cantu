import {
  formatAudioTime,
  MAX_AUDIO_SELECTION_MS,
  TARGET_MIN_AUDIO_SELECTION_MS,
  type AudioSelection,
  type SelectionHandle,
} from "@/lib/input/audio-selection";
import styles from "../app.module.css";

type AudioRangeSelectorProps = {
  durationMs: number;
  selection: AudioSelection;
  onChange: (handle: SelectionHandle, valueMs: number) => void;
};

export function AudioRangeSelector({
  durationMs,
  selection,
  onChange,
}: AudioRangeSelectorProps) {
  const minimumGap = Math.min(TARGET_MIN_AUDIO_SELECTION_MS, durationMs);
  const selectedDuration = selection.endMs - selection.startMs;

  return (
    <div className={styles.rangeSection}>
      <div className={styles.rangeSummary} aria-live="polite">
        <span><small>Kezdőpont</small><strong>{formatAudioTime(selection.startMs)}</strong></span>
        <span><small>Végpont</small><strong>{formatAudioTime(selection.endMs)}</strong></span>
        <span><small>Kijelölve</small><strong>{formatAudioTime(selectedDuration)}</strong></span>
      </div>
      <label className={styles.rangeControl}>
        <span>Kezdőpont</span>
        <input
          type="range"
          aria-label="Kezdőpont"
          aria-valuetext={formatAudioTime(selection.startMs)}
          min={Math.max(0, selection.endMs - MAX_AUDIO_SELECTION_MS)}
          max={Math.max(0, selection.endMs - minimumGap)}
          step={100}
          value={selection.startMs}
          onChange={(event) => onChange("start", Number(event.currentTarget.value))}
        />
      </label>
      <label className={styles.rangeControl}>
        <span>Végpont</span>
        <input
          type="range"
          aria-label="Végpont"
          aria-valuetext={formatAudioTime(selection.endMs)}
          min={Math.min(durationMs, selection.startMs + minimumGap)}
          max={Math.min(durationMs, selection.startMs + MAX_AUDIO_SELECTION_MS)}
          step={100}
          value={selection.endMs}
          onChange={(event) => onChange("end", Number(event.currentTarget.value))}
        />
      </label>
      <p className={styles.rangeLimit}>Legfeljebb 30 másodperces részlet jelölhető ki.</p>
    </div>
  );
}
