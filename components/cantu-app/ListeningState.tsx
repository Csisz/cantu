import styles from "./app.module.css";

export function ListeningState({ onCancel }: { onCancel: () => void }) {
  return (
    <section className={styles.processState} aria-labelledby="listening-title">
      <div className={styles.pulseVisual} aria-hidden="true">
        <span /><span /><span />
        <b>🎙️</b>
      </div>
      <span className={styles.panelEyebrow}>Mock hallgatás</span>
      <h2 id="listening-title">Figyelek…</h2>
      <p>Játssz le egy tiszta, felismerhető részt. A demó rövidesen magától továbblép.</p>
      <div className={styles.waveform} aria-hidden="true">
        {Array.from({ length: 19 }, (_, index) => <i key={index} />)}
      </div>
      <button className={styles.quietAction} type="button" onClick={onCancel}>Mégse</button>
      <small>Nem használjuk a mikrofont. Ez csak a jövőbeli élmény helyi szimulációja.</small>
    </section>
  );
}
