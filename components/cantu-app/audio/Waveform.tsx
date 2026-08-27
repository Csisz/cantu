"use client";

import { useRef, type PointerEvent } from "react";
import type { AudioSelection, SelectionHandle } from "@/lib/input/audio-selection";
import { formatAudioTime } from "@/lib/input/audio-selection";
import styles from "../app.module.css";

type WaveformProps = {
  peaks: number[];
  durationMs: number;
  selection: AudioSelection;
  onChange: (handle: SelectionHandle, valueMs: number) => void;
};

export function Waveform({ peaks, durationMs, selection, onChange }: WaveformProps) {
  const activeHandle = useRef<SelectionHandle | null>(null);
  const startPercent = durationMs > 0 ? (selection.startMs / durationMs) * 100 : 0;
  const endPercent = durationMs > 0 ? (selection.endMs / durationMs) * 100 : 0;

  function timeFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;
    return Math.min(durationMs, Math.max(0, ratio * durationMs));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const requested = timeFromPointer(event);
    activeHandle.current =
      Math.abs(requested - selection.startMs) <= Math.abs(requested - selection.endMs)
        ? "start"
        : "end";
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(activeHandle.current, requested);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!activeHandle.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onChange(activeHandle.current, timeFromPointer(event));
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeHandle.current = null;
  }

  return (
    <div>
      <div
        className={styles.waveformSurface}
        role="img"
        aria-label={`Helyi hullámforma. Kijelölés: ${formatAudioTime(selection.startMs)} és ${formatAudioTime(selection.endMs)} között.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <svg viewBox={`0 0 ${peaks.length} 100`} preserveAspectRatio="none" aria-hidden="true">
          {peaks.map((peak, index) => {
            const height = Math.max(4, peak * 88);
            return (
              <rect
                key={index}
                x={index + 0.12}
                y={(100 - height) / 2}
                width={0.76}
                height={height}
                rx={0.35}
              />
            );
          })}
        </svg>
        <span
          className={styles.waveformSelection}
          style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }}
          aria-hidden="true"
        />
        <span className={styles.waveformHandle} style={{ left: `${startPercent}%` }} aria-hidden="true" />
        <span className={styles.waveformHandle} style={{ left: `${endPercent}%` }} aria-hidden="true" />
      </div>
      <p className={styles.waveformHint}>Érintsd meg vagy húzd a hullámformát; pontosításhoz használd az alábbi csúszkákat.</p>
    </div>
  );
}
