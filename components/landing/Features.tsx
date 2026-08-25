import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

const features = [
  ["LÉNYEG", "Miről szól?", "Rövid magyar összefoglaló, hogy már a következő hallgatásnál tudd, merre visz a dal."],
  ["REFRÉN", "A rész, ami veled marad", "A visszatérő sorokkal kezdünk: kevés, erős és újra meg újra hallható nyelv."],
  ["KIFEJEZÉS", "Használható olasz", "A dal legfontosabb szókapcsolatai természetes magyar magyarázattal, nem szótárlistaként."],
  ["NYELVI TRÜKK", "Érthető nyelvtan", "Rövid megfigyelések közvetlenül a dalból — csak annyi, amennyi segít meghallani a mintát."],
] as const;

export function Features() {
  return (
    <section className={styles.features} aria-labelledby="features-title">
      <div className={styles.featureBackdrop} aria-hidden="true" />
      <div className={styles.featurePanel}>
        <span className={styles.eyebrow}>Mit ad majd egy dal?</span>
        <h2 id="features-title">Nem egy falnyi dalszöveget.</h2>
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
