import type { LearningAnalysis } from "@/lib/analysis/schema";
import { sayPracticeTarget } from "@/lib/learning/player";
import styles from "../app.module.css";
import { ShadowingPractice } from "./ShadowingPractice";

export function SayCard({
  analysis,
  sessionId,
  authenticated,
  localPlaybackUrl,
  onNext,
}: {
  analysis: LearningAnalysis;
  sessionId: string;
  authenticated: boolean;
  localPlaybackUrl?: string;
  onNext: () => void;
}) {
  const target = sayPracticeTarget(analysis)!;
  return (
    <section className={styles.lessonCard} aria-labelledby="lesson-say-title">
      <span className={styles.lessonEyebrow}>Shadowing · érthetőség és magabiztos használat</span>
      <h2 id="lesson-say-title" tabIndex={-1}>Mondd ki te is</h2>
      <blockquote className={styles.sayPhrase} lang="it">{target.text}</blockquote>
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
          <span>Eredeti helyi referencia · csak ebben a böngészőmunkamenetben</span>
          <audio controls src={localPlaybackUrl} aria-label="A helyi forrásrészlet lejátszása" />
        </div>
      ) : null}
      <ShadowingPractice
        sessionId={sessionId}
        chunkIndex={target.chunkIndex}
        authenticated={authenticated}
        onNext={onNext}
      />
    </section>
  );
}
