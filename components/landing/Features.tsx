import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

const features = [
  ["JELENTÉS", "Mit jelent valójában?", "Természetes magyar magyarázat, amely megőrzi a rövid forrás hangját és szándékát."],
  ["KIFEJEZÉS", "Amit érdemes megjegyezni", "Néhány újra használható olasz szókapcsolat, nem hosszú szótárlista."],
  ["MIÉRT ÍGY?", "Pont elég nyelvtan", "Egy-két rövid megfigyelés csak arról, ami ezt a mondatot érthetőbbé teszi."],
  ["AKTÍV LÉPÉS", "Mondd ki, idézd fel", "Egy apró gyakorlás, hogy ne csak lefordítsd, hanem használni is kezdd."],
] as const;

export function Features() {
  return (
    <section className={styles.features} aria-labelledby="features-title">
      <div className={styles.featureBackdrop} aria-hidden="true" />
      <div className={styles.featurePanel}>
        <span className={styles.eyebrow}>Mit ad majd egy rövid forrás?</span>
        <h2 id="features-title">Nem csak egy fordítást.</h2>
        <div className={styles.featureRows}>
          {features.map(([label, title, copy]) => (
            <Reveal className={styles.featureRow} key={label}>
              <span>{label}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
