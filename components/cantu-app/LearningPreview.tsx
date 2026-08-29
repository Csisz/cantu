import type { LearningSource } from "@/lib/input/types";
import { SaveLearningControl, type PersistenceAction } from "./SaveLearningControl";
import styles from "./app.module.css";

const previewSections = [
  ["Mit jelent?", "A természetes magyar jelentés helye."],
  ["Ezt érdemes megjegyezni", "Néhány valóban használható olasz kifejezés helye."],
  ["Miért így mondják?", "Egy rövid, ehhez a forráshoz kapcsolódó nyelvi megfigyelés helye."],
  ["Mondd ki te is", "A későbbi ismétlési és kiejtési lépés helye."],
  ["Emlékszel?", "Egy rövid visszaidéző kérdés helye."],
] as const;

export function LearningPreview({
  source,
  onStartOver,
  authenticated,
  saveAction,
}: {
  source: LearningSource;
  onStartOver: () => void;
  authenticated: boolean;
  saveAction: PersistenceAction;
}) {
  return (
    <section className={styles.learningPreview} aria-labelledby="learning-preview-title">
      <span className={styles.stepBadge}>3 / 3 · Tanulási vázlat</span>
      <h2 id="learning-preview-title">Innen épül majd fel a saját mini leckéd</h2>
      <p className={styles.previewLead}>Ez szerkezeti előnézet, nem elkészült AI-elemzés.</p>
      <p className={styles.previewSource} lang="it">{source.text}</p>
      <div className={styles.learningCards}>
        {previewSections.map(([title, copy], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{title}</h3><p>{copy}</p></div>
            <small>Hamarosan</small>
          </article>
        ))}
      </div>
      <SaveLearningControl source={source} authenticated={authenticated} action={saveAction} />
      <button className={styles.mainAction} type="button" onClick={onStartOver}>Új forrást hozok</button>
    </section>
  );
}
