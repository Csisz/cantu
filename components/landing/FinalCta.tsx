import Link from "next/link";
import { MediaVisual } from "@/components/ui/MediaVisual";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function FinalCta() {
  return (
    <section className={styles.finalCta} aria-labelledby="final-title">
      <div className={styles.meadow} aria-hidden="true" />
      <MediaVisual
        className={styles.danceMedia}
        videoSrc="/assets/dance_learn.mp4"
        posterSrc="/robot_meadow.png"
        alt="A Cantu robot virágos réten ünnepel"
        sizes="(max-width: 900px) 0px, 34vw"
        fit="cover"
      />
      <Reveal className={styles.finalPanel}>
        <span className={styles.eyebrow}>A következő „aha” pillanat itt kezdődik</span>
        <h2 id="final-title">Melyik olasz mondatot hozod?</h2>
        <p>Hallgasd meg, nyisd meg helyi hangfájlként, vagy írd be. A pontos forrást mindig te erősíted meg.</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href="/app?mode=listen">🎧 Hallgasd</Link>
          <Link className={styles.secondaryButton} href="/app?mode=audio">🎵 Hangfájl</Link>
          <Link className={styles.secondaryButton} href="/app?mode=text">📝 Szöveg</Link>
        </div>
      </Reveal>
    </section>
  );
}
