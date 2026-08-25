import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function ProblemStatement() {
  return (
    <section id="miert-dalok" className={styles.problem} aria-label="Miért érdemes dalból tanulni">
      <div className={styles.problemBackdrop} aria-hidden="true" />
      <div className={styles.problemLines}>
        <Reveal as="p">A szótárfüzet elfelejtődik.</Reveal>
        <Reveal as="p">A refrént úgyis dúdolod.</Reveal>
        <Reveal as="p">Miért ne értenéd is?</Reveal>
      </div>
    </section>
  );
}
