import { Reveal } from "@/components/ui/Reveal";
import styles from "./landing.module.css";

export function ProblemStatement() {
  return (
    <section id="miert-cantu" className={styles.problem} aria-label="Miért segít a saját forrásból tanulás">
      <div className={styles.problemBackdrop} aria-hidden="true" />
      <div className={styles.problemLines}>
        <Reveal as="p">Egy mondat megakad a füledben.</Reveal>
        <Reveal as="p">Egy üzenet nem hagy nyugodni.</Reveal>
        <Reveal as="p">Most már tényleg megértheted.</Reveal>
      </div>
    </section>
  );
}
