import styles from "./app.module.css";

type RecoveryStateProps = {
  kind: "rejected" | "no-match";
  onListen: () => void;
  onUpload: () => void;
  onManual: () => void;
};

export function RecoveryState({ kind, onListen, onUpload, onManual }: RecoveryStateProps) {
  const noMatch = kind === "no-match";
  return (
    <section className={styles.recoveryState} aria-labelledby="recovery-title">
      <span className={styles.recoveryIcon} aria-hidden="true">{noMatch ? "?" : "↺"}</span>
      <span className={styles.panelEyebrow}>{noMatch ? "Nincs biztos találat" : "Jelölt elutasítva"}</span>
      <h2 id="recovery-title">{noMatch ? "Most nem sikerült felismerni." : "Nem ez a dal."}</h2>
      <p>
        {noMatch
          ? "Próbáld közelebb a hangszóróhoz, vagy válassz egy tisztább, dallamos részt."
          : "Rendben — nem erősítettünk meg semmit, és nem indult további feldolgozás."}
      </p>
      {noMatch ? (
        <ul>
          <li>Menj közelebb a hangszóróhoz.</li>
          <li>Válassz egy tisztább részt a dalból.</li>
          <li>Ha ugyanazon az eszközön szól, próbáld a feltöltést.</li>
        </ul>
      ) : null}
      <div className={styles.recoveryActions}>
        <button className={styles.mainAction} type="button" onClick={onListen}>Újra meghallgatom</button>
        <button className={styles.secondaryAction} type="button" onClick={onUpload}>Feltöltöm inkább</button>
        <button className={styles.quietAction} type="button" onClick={onManual}>Keresés kézzel</button>
      </div>
    </section>
  );
}
