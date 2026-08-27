import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function SourceDemo() {
  return (
    <section id="forrasbol-tanulas" className={styles.demo} aria-labelledby="demo-title">
      <div className={styles.demoAura} aria-hidden="true" />
      <Reveal className={styles.demoWrap}>
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>Egy valódi mondat, ami veled marad</span>
          <h2 id="demo-title">Előbb a jelentés. Utána a használható nyelv.</h2>
        </div>
        <div className={styles.player}>
          <div className={styles.playerTop}>
            <div className={styles.coverPlaceholder} aria-hidden="true">✦</div>
            <div>
              <strong>Saját forrás</strong>
              <span>eredeti mintamondat · olasz → magyar</span>
            </div>
            <span className={styles.nowPlaying}>ÜZENET</span>
          </div>
          <p className={styles.lyric} lang="it">
            Ci vediamo <mark>domani mattina?<span>holnap reggel</span></mark>
          </p>
          <p className={styles.translation}>Holnap reggel találkozunk?</p>
          <div className={styles.wordChips} aria-label="Kiemelt olasz kifejezések">
            <span><b>ci vediamo</b> · találkozunk</span>
            <span><b>domani</b> · holnap</span>
            <span><b>mattina</b> · reggel</span>
          </div>
          <div className={styles.playerProgress} aria-label="Példa tanulási folyamat"><span /></div>
          <div className={styles.playerTimes} aria-hidden="true"><span>Forrás</span><span>Megértés</span></div>
        </div>
      </Reveal>
    </section>
  );
}
