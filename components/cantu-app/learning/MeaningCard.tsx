import { isLearningAnalysisV2, type LearningAnalysis } from "@/lib/analysis/schema";
import styles from "../app.module.css";

export function MeaningCard({ analysis, onNext }: { analysis: LearningAnalysis; onNext: () => void }) {
  const meaning = analysis.meaning!;
  return (
    <section className={styles.lessonCard} aria-labelledby="lesson-meaning-title">
      {isLearningAnalysisV2(analysis) ? <p className={styles.microSuccess} role="status">Shortcut megvan ✓</p> : null}
      <span className={styles.lessonEyebrow}>Természetes jelentés</span>
      <h2 id="lesson-meaning-title" tabIndex={-1}>Mit jelent?</h2>
      <p className={styles.lessonMeaning}>{meaning.naturalHu}</p>
      {meaning.literalStructureHu ? (
        <details className={styles.meaningDetails}>
          <summary>Szó szerint hogy áll össze?</summary>
          <p>{meaning.literalStructureHu}</p>
        </details>
      ) : null}
      {meaning.toneHu ? (
        <div className={styles.meaningTone}>
          <span>Hangnem / használat</span>
          <p>{meaning.toneHu}</p>
        </div>
      ) : null}
      {analysis.warnings.length > 0 ? (
        <aside className={styles.lessonNote} aria-label="Elemzési megjegyzés">
          {analysis.warnings.map((warning) => <p key={warning.code}>{warning.messageHu}</p>)}
        </aside>
      ) : null}
      <button className={styles.lessonPrimary} type="button" onClick={onNext}>Tovább</button>
    </section>
  );
}
