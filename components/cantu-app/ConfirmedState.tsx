import type { RecognitionCandidate } from "@/lib/recognition/types";
import styles from "./app.module.css";

export function ConfirmedState({
  candidate,
  onAnother,
}: {
  candidate: RecognitionCandidate;
  onAnother: () => void;
}) {
  return (
    <section className={styles.outcomeState} aria-labelledby="confirmed-title">
      <span className={styles.successMark} aria-hidden="true">✓</span>
      <span className={styles.panelEyebrow}>Megerősítve</span>
      <h2 id="confirmed-title">Dal megerősítve</h2>
      <p>
        <b>{candidate.title}</b> · {candidate.artist}
      </p>
      <div className={styles.outcomeNote}>
        A dal elfogadásáig tart a Milestone 0 bemutató. A leckekészítés egy későbbi mérföldkőben érkezik.
      </div>
      <button className={styles.secondaryAction} type="button" onClick={onAnother}>Másik dalt hozok</button>
    </section>
  );
}
