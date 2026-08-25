import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function LanguagePositioning() {
  return (
    <section className={styles.language} aria-labelledby="language-title">
      <div className={styles.languageImage} aria-hidden="true" />
      <Reveal className={styles.languageCard}>
        <span className={styles.eyebrow}>Egyetlen párosítás, jól megcsinálva</span>
        <h2 id="language-title">Olasz dal. Magyar magyarázat.</h2>
        <p>
          A Cantu első változata kifejezetten magyar anyanyelvű olasztanulóknak készül. Nincs
          nyelvválasztó útvesztő: a kedvenc olasz dalod az indulópont.
        </p>
        <div className={styles.languagePair} aria-label="Olasz tanulási nyelv, magyar magyarázat">
          <span><b>IT</b> olasz</span>
          <i aria-hidden="true">→</i>
          <span><b>HU</b> magyar</span>
        </div>
      </Reveal>
    </section>
  );
}
