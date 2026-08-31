import type { LearningAnalysis } from "@/lib/analysis/schema";
import styles from "../app.module.css";

const kindLabels = {
  word: "Szó",
  phrase: "Kifejezés",
  idiom: "Idióma",
  construction: "Szerkezet",
} as const;

const registerLabels = {
  neutral: "semleges",
  formal: "formális",
  colloquial: "hétköznapi",
  slang: "szleng",
  poetic: "költői",
} as const;

export function ChunkCard({
  chunk,
  index,
  total,
  saved,
  saving,
  saveMessage,
  onSave,
  onNext,
}: {
  chunk: LearningAnalysis["chunks"][number];
  index: number;
  total: number;
  saved: boolean;
  saving: boolean;
  saveMessage: string;
  onSave: () => void;
  onNext: () => void;
}) {
  const metadata = [kindLabels[chunk.kind], chunk.register ? registerLabels[chunk.register] : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <section className={styles.lessonCard} aria-labelledby="lesson-chunk-title">
      <span className={styles.lessonEyebrow}>Chunk Lens · {index + 1} / {total}</span>
      <h2 id="lesson-chunk-title" tabIndex={-1}>Ezt érdemes megjegyezni</h2>
      <div className={styles.chunkHero}>
        <strong lang="it">{chunk.sourceText}</strong>
        <span>{chunk.meaningHu}</span>
      </div>
      <p className={styles.chunkMetadata}>{metadata}</p>
      {chunk.baseForm ? <p className={styles.chunkBase}><span>Alapalak</span> <b lang="it">{chunk.baseForm}</b></p> : null}
      {chunk.contextNoteHu ? <p className={styles.chunkContext}>{chunk.contextNoteHu}</p> : null}
      {"whyUsefulHu" in chunk ? (
        <div className={styles.chunkWhyUseful}>
          <strong>Miért viszed magaddal?</strong>
          <p>{chunk.whyUsefulHu}</p>
        </div>
      ) : null}
      {chunk.kind !== "word" ? <p className={styles.chunkLens}>Ezt így, egyben érdemes megjegyezni.</p> : null}
      <button
        className={styles.phraseSaveButton}
        type="button"
        onClick={onSave}
        disabled={saved || saving}
        aria-describedby={`phrase-save-status-${index}`}
      >
        {saved ? "Elmentve ✓" : saving ? "Mentés…" : "Mentem ezt"}
      </button>
      <p id={`phrase-save-status-${index}`} className={styles.mutationStatus} role="status">{saveMessage}</p>
      <button className={styles.lessonPrimary} type="button" onClick={onNext}>
        {index + 1 < total ? "Mutasd a következőt" : "Ezt értem"}
      </button>
    </section>
  );
}
