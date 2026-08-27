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
          <span className={styles.eyebrow}>A te olaszod. A te tanulási pillanatod.</span>
          <h1 id="hero-title" className={styles.heroTitle}>
            Értsd meg az olaszt, <em>amivel találkozol.</em>
          </h1>
          <p className={styles.heroPromise}>Hallgasd. Olvasd. Értsd meg. Mondd ki.</p>
          <p className={styles.heroSupport}>
            Egy mondat egy videóból, üzenetből, beszélgetésből, hangrészletből vagy
            szövegből kompakt olasz leckévé válhat.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/app?mode=listen">
              <span aria-hidden="true">🎧</span> Hallgasd
            </Link>
            <Link className={styles.secondaryButton} href="/app?mode=audio">
              <span aria-hidden="true">🎵</span> Hangfájl
            </Link>
            <Link className={styles.secondaryButton} href="/app?mode=text">
              <span aria-hidden="true">📝</span> Szöveg
            </Link>
          </div>
          <p className={styles.heroNote}>Olasz tanulási nyelv · magyar magyarázat · privát források</p>
        </Reveal>

        <Reveal className={styles.heroStage}>
          <div className={styles.stageHalo} aria-hidden="true" />
          <MediaVisual
            className={styles.heroMedia}
            videoSrc="/assets/hero_idle.mp4"
            posterSrc="/robot.png"
            alt="Cantu robotkalauz mikrofonnal és fejhallgatóval"
            sizes="(max-width: 860px) 92vw, 52vw"
            fit="contain"
            priority
          />
          <div className={styles.floatingNote} aria-hidden="true">
            <span>ITALIANO</span>
            <strong>capire davvero</strong>
            <small>igazán megérteni</small>
          </div>
        </Reveal>
      </div>
      <a className={styles.scrollHint} href="#miert-cantu">
        Fedezd fel <span aria-hidden="true" />
      </a>
    </section>
  );
}
