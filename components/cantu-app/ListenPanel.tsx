import Image from "next/image";
import styles from "./app.module.css";

type ListenPanelProps = {
  onStart: () => void;
  onManual: () => void;
  onNoMatch: () => void;
};

export function ListenPanel({ onStart, onManual, onNoMatch }: ListenPanelProps) {
  return (
    <section className={styles.entryPanel} role="tabpanel" aria-labelledby="listen-panel-title">
      <div className={styles.listenVisual} aria-hidden="true">
        <span className={styles.listenRing} />
        <span className={styles.listenRing} />
        <Image src="/robot.png" alt="" fill sizes="180px" loading="eager" fetchPriority="high" />
      </div>
      <span className={styles.panelEyebrow}>Hallgatás</span>
      <h2 id="listen-panel-title">Játssz le kb. 10 másodpercet hangszórón.</h2>
      <p className={styles.panelCopy}>
        A valódi változat csak egy külön, egyértelmű gombnyomás után kér majd mikrofonengedélyt.
        Ez a bemutató nem hallgat bele semmibe.
      </p>
      <button className={styles.mainAction} type="button" onClick={onStart}>
        <span aria-hidden="true">🎙️</span> Mock hallgatás indítása
      </button>
      <div className={styles.guidance}>
        <p><b>Fejhallgatót használsz?</b> A mikrofon nem biztos, hogy hallja ugyanannak az eszköznek a hangját.</p>
        <p><b>Adatvédelem:</b> ebben a mérföldkőben nincs hangrögzítés és semmi nem hagyja el a böngészőt.</p>
      </div>
      <div className={styles.textActions}>
        <button type="button" onClick={onManual}>Keresés kézzel</button>
        <button type="button" onClick={onNoMatch}>Nincs találat? Mutasd a lehetőségeket</button>
      </div>
    </section>
  );
}
