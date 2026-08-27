import { formatAudioTime } from "@/lib/input/audio-selection";
import type { LearningSource } from "@/lib/input/types";
import styles from "./app.module.css";

type SourceConfirmationProps = {
  source: LearningSource;
  onConfirm: () => void;
  onEdit: () => void;
};

export function SourceConfirmation({ source, onConfirm, onEdit }: SourceConfirmationProps) {
  return (
    <section className={styles.confirmationPanel} aria-labelledby="source-confirmation-title">
      <span className={styles.stepBadge}>2 / 3 · Ellenőrzés</span>
      <h2 id="source-confirmation-title">
        {source.kind === "text" ? "Ezt fogjuk elemezni" : "Ezt a forrást választottad"}
      </h2>

      {source.kind === "text" ? (
        <blockquote className={styles.sourceText} lang="it">{source.text}</blockquote>
      ) : null}

      {source.kind === "audio" ? (
        <div className={styles.audioConfirmation}>
          <span aria-hidden="true">♪</span>
          <div>
            <strong>{source.fileName}</strong>
            <p>{formatAudioTime(source.startMs)}–{formatAudioTime(source.endMs)} · {formatAudioTime(source.endMs - source.startMs)}</p>
          </div>
          <div className={styles.futureTranscript}>
            <small>Átirat a következő mérföldkőben</small>
            <p>A Cantu később csak ezt a kijelölt részletet írja át, majd megmutatja az „Ezt hallottam” ellenőrző lépést.</p>
          </div>
        </div>
      ) : null}

      {source.kind === "listen" ? (
        <div className={styles.futureTranscript}>
          <small>Interakciós előnézet · nincs felvétel</small>
          <p>A valódi felvétel után itt jelenik majd meg az „Ezt hallottam” átirat. Ebben a mérföldkőben nem kapcsoltuk be a mikrofont.</p>
        </div>
      ) : null}

      <div className={styles.confirmationActions}>
        <button className={styles.mainAction} type="button" onClick={onConfirm}>
          Rendben, tovább
        </button>
        <button className={styles.secondaryAction} type="button" onClick={onEdit}>
          {source.kind === "text" ? "Javítom" : "Másik forrást választok"}
        </button>
      </div>
      <p className={styles.mockNotice}>Most csak a tanulási út felépítését mutatjuk meg; AI-elemzés nem indul.</p>
    </section>
  );
}
