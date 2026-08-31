import type { LearningAnalysisV2 } from "@/lib/analysis/schema";
import styles from "../app.module.css";
import { RobotCoach } from "./RobotCoach";

export function CantuShortcutCard({ analysis, onNext }: {
  analysis: LearningAnalysisV2;
  onNext: () => void;
}) {
  const shortcut = analysis.shortcut!;
  return (
    <section className={`${styles.lessonCard} ${styles.shortcutCard}`} aria-labelledby="cantu-shortcut-title">
      <RobotCoach state="shortcut" />
      <span className={styles.lessonEyebrow}>A legkisebb hasznos csomag</span>
      <h2 id="cantu-shortcut-title" tabIndex={-1}>Cantu Shortcut</h2>
      <p className={styles.shortcutPromise}>
        Ha csak ezt a {shortcut.coreChunkIndexes.length === 1 ? "dolgot" : `${shortcut.coreChunkIndexes.length} dolgot`} viszed
        magaddal, már sokkal többet értesz ebből a részből.
      </p>
      <p className={styles.shortcutTakeaway}>{shortcut.takeawayHu}</p>
      <ol className={styles.shortcutChunks}>
        {shortcut.coreChunkIndexes.map((index) => {
          const chunk = analysis.chunks[index]!;
          return (
            <li key={index}>
              <strong lang="it">{chunk.sourceText}</strong>
              <span>{chunk.meaningHu}</span>
              <p>{chunk.whyUsefulHu}</p>
            </li>
          );
        })}
      </ol>
      <button className={styles.lessonPrimary} type="button" onClick={onNext}>Megvan a Shortcut</button>
    </section>
  );
}
