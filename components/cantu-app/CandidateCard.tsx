import Image from "next/image";
import type { RecognitionCandidate } from "@/lib/recognition/types";
import styles from "./app.module.css";

type CandidateCardProps = {
  candidate: RecognitionCandidate;
  onConfirm: () => void;
  onReject: () => void;
  onRetry: () => void;
  onManual: () => void;
};

export function CandidateCard({ candidate, onConfirm, onReject, onRetry, onManual }: CandidateCardProps) {
  return (
    <section className={styles.candidateState} aria-labelledby="candidate-title">
      <div className={styles.candidateIntro}>
        <span className={styles.panelEyebrow}>Lehetséges találat</span>
        <h2 id="candidate-title">Szerintem ezt a dalt hallottam.</h2>
        <p>Nézd meg, és erősítsd meg. Innen semmi nem indul tovább magától.</p>
      </div>
      <div className={styles.candidateCard}>
        <div className={styles.artwork}>
          <Image
            src={candidate.artworkUrl ?? "/assets/bg_italy.png"}
            alt={`${candidate.title} mintaborítója`}
            fill
            sizes="(max-width: 620px) 86vw, 260px"
          />
          <span>MOCK</span>
        </div>
        <div className={styles.trackMeta}>
          <span>FELISMERÉSI JELÖLT</span>
          <h3>{candidate.title}</h3>
          <p>{candidate.artist}</p>
          {candidate.album ? <small>{candidate.album}</small> : null}
          <div className={styles.candidateActions}>
            <button className={styles.mainAction} type="button" onClick={onConfirm}>Igen, ez az</button>
            <button className={styles.secondaryAction} type="button" onClick={onReject}>Nem ez</button>
          </div>
        </div>
      </div>
      <div className={styles.textActions}>
        <button type="button" onClick={onRetry}>Újra meghallgatom</button>
        <button type="button" onClick={onManual}>Keresés kézzel</button>
      </div>
    </section>
  );
}
