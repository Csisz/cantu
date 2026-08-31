import type { LearningAnalysis } from "@/lib/analysis/schema";
import { sayPracticeText } from "@/lib/learning/player";
import styles from "../app.module.css";

export function SayCard({
  analysis,
  localPlaybackUrl,
  onNext,
}: {
  analysis: LearningAnalysis;
  localPlaybackUrl?: string;
  onNext: () => void;
}) {
  const phrase = sayPracticeText(analysis)!;
  return (
    <section className={styles.lessonCard} aria-labelledby="lesson-say-title">
      <span className={styles.lessonEyebrow}>Saját gyakorlás · nincs automatikus pontozás</span>
      <h2 id="lesson-say-title" tabIndex={-1}>Mondd ki te is</h2>
      <blockquote className={styles.sayPhrase} lang="it">{phrase}</blockquote>
      {analysis.pronunciation ? (
        <div className={styles.sayGuidance}>
          <strong>Figyelj erre:</strong>
          <p>{analysis.pronunciation.noteHu}</p>
          <ul>{analysis.pronunciation.focus.map((focus) => <li key={focus} lang="it">{focus}</li>)}</ul>
        </div>
      ) : (
        <p className={styles.lessonLead}>Mondd ki lassan, majd még egyszer természetes ritmusban.</p>
      )}
      {localPlaybackUrl ? (
        <div className={styles.localReplay}>
          <span>Az aktív munkamenet helyi hangrészlete</span>
          <audio controls src={localPlaybackUrl} aria-label="A helyi forrásrészlet lejátszása" />
        </div>
      ) : null}
      <p className={styles.selfPracticeNote}>A Cantu most nem hallgat bele és nem értékeli a kiejtésedet.</p>
      <button className={styles.lessonPrimary} type="button" onClick={onNext}>Kimondtam</button>
    </section>
  );
}
