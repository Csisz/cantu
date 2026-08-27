import Image from "next/image";
import styles from "../app.module.css";

export function ListenInput({ onContinue }: { onContinue: () => void }) {
  return (
    <section
      id="input-panel-listen"
      className={styles.entryPanel}
      role="tabpanel"
      aria-labelledby="input-mode-listen listen-panel-title"
    >
      <div className={styles.listenVisual} aria-hidden="true">
        <span className={styles.listenRing} />
        <span className={styles.listenRing} />
        <Image
          src="/robot.png"
          alt=""
          fill
          sizes="180px"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <span className={styles.panelEyebrow}>Rövid, tudatos felvétel</span>
      <h2 id="listen-panel-title">Vegyél fel egy rövid olasz részletet</h2>
      <p className={styles.panelCopy}>
        Legfeljebb 30 másodperc. A rögzítés csak egy egyértelmű gombnyomás és a
        böngésző engedélye után indulhat el.
      </p>
      <button className={styles.mainAction} type="button" onClick={onContinue}>
        <span aria-hidden="true">🎙️</span> A folyamat előnézete
      </button>
      <div className={styles.guidance}>
        <p>
          <b>Ebben a mérföldkőben:</b> a mikrofon nem kapcsol be, nincs felvétel és
          nincs hálózati feldolgozás.
        </p>
        <p>
          <b>Később is te irányítasz:</b> csak a külön elindított, rövid felvételt
          dolgozza majd fel a Cantu.
        </p>
      </div>
    </section>
  );
}
