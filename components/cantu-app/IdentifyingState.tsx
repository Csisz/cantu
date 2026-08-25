import Image from "next/image";
import styles from "./app.module.css";

export function IdentifyingState({ onCancel }: { onCancel: () => void }) {
  return (
    <section className={styles.processState} aria-labelledby="identifying-title">
      <div className={styles.identifyingRobot} aria-hidden="true">
        <span />
        <Image src="/robot.png" alt="" fill sizes="180px" />
      </div>
      <span className={styles.panelEyebrow}>Helyi azonosítás</span>
      <h2 id="identifying-title">Megpróbálom felismerni…</h2>
      <p>Összerakom a lehetséges címet és előadót. A találat még csak jelölt lesz.</p>
      <div className={styles.identifyingDots} aria-hidden="true"><i /><i /><i /></div>
      <button className={styles.quietAction} type="button" onClick={onCancel}>Mégse</button>
    </section>
  );
}
