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
        <span className={styles.eyebrow}>Az első dal itt kezdődik</span>
        <h2 id="final-title">Mit dúdolsz ma?</h2>
        <p>Hozd a dalt hallgatással vagy egy helyi hangfájllal. A találatot mindig te erősíted meg.</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href="/app?mode=listen">🎧 Hallgasd meg</Link>
          <Link className={styles.secondaryButton} href="/app?mode=upload">⬆️ Feltöltöm a dalt</Link>
        </div>
      </Reveal>
    </section>
  );
}
