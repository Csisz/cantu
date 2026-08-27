import styles from "../app.module.css";

type AudioPreviewControlsProps = {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReplay: () => void;
};

export function AudioPreviewControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onReplay,
}: AudioPreviewControlsProps) {
  return (
    <div className={styles.previewControls} aria-label="Kijelölt hangrészlet lejátszása">
      <button type="button" onClick={onPlay} disabled={isPlaying}>
        <span aria-hidden="true">▶</span> Lejátszás
      </button>
      <button type="button" onClick={onPause} disabled={!isPlaying}>
        <span aria-hidden="true">Ⅱ</span> Szünet
      </button>
      <button type="button" onClick={onStop}>
        <span aria-hidden="true">■</span> Leállítás
      </button>
      <button type="button" onClick={onReplay}>
        <span aria-hidden="true">↻</span> Újrajátszás
      </button>
    </div>
  );
}
