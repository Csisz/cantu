import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function KaraokeDemo() {
  return (
    <section id="dalbol-lecke" className={styles.demo} aria-labelledby="demo-title">
      <div className={styles.demoAura} aria-hidden="true" />
      <Reveal className={styles.demoWrap}>
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>Egy dal, ami végre jelent is valamit</span>
          <h2 id="demo-title">Előbb az érzés. Utána a nyelv.</h2>
        </div>
        <div className={styles.player}>
          <div className={styles.playerTop}>
            <div className={styles.coverPlaceholder} aria-hidden="true">
              ♪
            </div>
            <div>
              <strong>Sotto le stelle</strong>
              <span>példadal · olasz → magyar</span>
            </div>
            <span className={styles.nowPlaying}>REFRÉN</span>
          </div>
          <p className={styles.lyric} lang="it">
            Sotto le <mark>stelle<span>csillagok</span></mark> canto il tuo <mark>nome<span>neved</span></mark>
          </p>
          <p className={styles.translation}>A csillagok alatt a nevedet énekelem.</p>
          <div className={styles.wordChips} aria-label="Kiemelt olasz kifejezések">
            <span><b>stelle</b> · csillagok</span>
            <span><b>canto</b> · énekelek</span>
            <span><b>il tuo nome</b> · a neved</span>
          </div>
          <div className={styles.playerProgress} aria-label="Példa lejátszási folyamat">
            <span />
          </div>
          <div className={styles.playerTimes} aria-hidden="true">
            <span>1:18</span><span>3:42</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
