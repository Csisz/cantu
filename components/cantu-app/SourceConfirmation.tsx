import type { TextLearningSource } from "@/lib/input/types";
import styles from "./app.module.css";

type SourceConfirmationProps = {
  source: TextLearningSource;
  onConfirm: () => void;
  onEdit: () => void;
};

export function SourceConfirmation({ source, onConfirm, onEdit }: SourceConfirmationProps) {
  return (
    <section className={styles.confirmationPanel} aria-labelledby="source-confirmation-title">
      <span className={styles.stepBadge}>2 / 3 · Ellenőrzés</span>
      <h2 id="source-confirmation-title">Ezt fogjuk elemezni</h2>
      <blockquote className={styles.sourceText} lang="it">{source.text}</blockquote>
      <div className={styles.confirmationActions}>
        <button className={styles.mainAction} type="button" onClick={onConfirm}>
          Rendben, tovább
        </button>
        <button className={styles.secondaryAction} type="button" onClick={onEdit}>
          Javítom
        </button>
      </div>
      <p className={styles.mockNotice}>
        A következő lépésben te indíthatod el az elemzést. Addig semmilyen fizetős AI-hívás nem történik.
      </p>
    </section>
  );
}
