import {
  LESSON_STAGE_LABELS,
  stagePercent,
  type LessonStage,
} from "@/lib/learning/player";
import styles from "../app.module.css";

export function LearningProgress({ stage, stages }: { stage: LessonStage; stages: LessonStage[] }) {
  const index = Math.max(0, stages.indexOf(stage));
  const percent = stagePercent(stage);
  return (
    <header className={styles.lessonProgress} aria-label="Tanulási haladás">
      <div>
        <span>{index + 1} / {stages.length}</span>
        <strong>{LESSON_STAGE_LABELS[stage]}</strong>
        <span>{percent}%</span>
      </div>
      <div
        className={styles.lessonProgressTrack}
        role="progressbar"
        aria-label={`Tanulási haladás: ${LESSON_STAGE_LABELS[stage]}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${index + 1}. lépés a(z) ${stages.length} közül: ${LESSON_STAGE_LABELS[stage]}`}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
    </header>
  );
}
