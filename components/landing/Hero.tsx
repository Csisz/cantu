import Link from "next/link";
import { MediaVisual } from "@/components/ui/MediaVisual";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroGrid}>
        <Reveal className={styles.heroCopy}>
          <span className={styles.eyebrow}>Zenés olasztanulás</span>
          <h1 id="hero-title" className={styles.heroTitle}>
            Tanulj olaszul a <em>kedvenc dalaidból.</em>
          </h1>
          <p className={styles.heroPromise}>Hallgasd. Ismerd fel. Értsd meg. Tanuld meg.</p>
          <p className={styles.heroSupport}>
            Nincs meg MP3-ban? Semmi gond. Játssz le néhány másodpercet, Cantu felismeri a
            számot.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/app?mode=listen">
              <span aria-hidden="true">🎧</span> Hallgasd meg
            </Link>
            <Link className={styles.secondaryButton} href="/app?mode=upload">
              <span aria-hidden="true">⬆️</span> Feltöltöm a dalt
            </Link>
          </div>
          <p className={styles.heroNote}>Olasz dalokhoz, magyar magyarázattal.</p>
        </Reveal>

        <Reveal className={styles.heroStage}>
          <div className={styles.stageHalo} aria-hidden="true" />
          <MediaVisual
            className={styles.heroMedia}
            videoSrc="/assets/hero_idle.mp4"
            posterSrc="/robot.png"
            alt="Cantu éneklő robotkabala mikrofonnal és fejhallgatóval"
            sizes="(max-width: 860px) 92vw, 52vw"
            fit="contain"
            priority
          />
          <div className={styles.floatingNote} aria-hidden="true">
            <span>ITALIANO</span>
            <strong>la musica</strong>
            <small>a zene</small>
          </div>
        </Reveal>
      </div>
      <a className={styles.scrollHint} href="#miert-dalok">
        Fedezd fel <span aria-hidden="true" />
      </a>
    </section>
  );
}
