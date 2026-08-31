"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "../app.module.css";

export function CompletionCard({
  chunkCount,
  recallScore,
  correctCount,
  recallCount,
  savedCount,
  onStartOver,
}: {
  chunkCount: number;
  recallScore: number | null;
  correctCount: number | null;
  recallCount: number;
  savedCount: number;
  onStartOver?: () => void;
}) {
  const [selfCheck, setSelfCheck] = useState<"Igen" | "Nagyjából" | "Még nem" | null>(null);
  return (
    <section className={`${styles.lessonCard} ${styles.completionCard}`} aria-labelledby="lesson-complete-title" aria-live="polite">
      <div className={styles.completionRobot} aria-hidden="true">
        <Image src="/robot.png" alt="" fill sizes="120px" />
      </div>
      <span className={styles.lessonEyebrow}>Kész</span>
      <h2 id="lesson-complete-title" tabIndex={-1}>Most már érted — és van belőle valami, amit te is tudsz használni.</h2>
      <dl className={styles.completionSummary}>
        <div><dt>Hasznos chunk</dt><dd>{chunkCount}</dd></div>
        <div><dt>Felidézés</dt><dd>{correctCount === null ? (recallScore === null ? "—" : `${recallScore}%`) : `${correctCount} / ${recallCount}`}</dd></div>
        <div><dt>Mentett kifejezés</dt><dd>{savedCount}</dd></div>
      </dl>
      <div className={styles.selfCheck}>
        <h3>Most már érted ezt a részletet?</h3>
        <div role="group" aria-label="Megértési önellenőrzés">
          {(["Igen", "Nagyjából", "Még nem"] as const).map((option) => (
            <button key={option} type="button" onClick={() => setSelfCheck(option)} aria-pressed={selfCheck === option}>{option}</button>
          ))}
        </div>
        <p>Ez az önellenőrzés csak ezen az oldalon marad.</p>
      </div>
      {onStartOver ? (
        <button className={styles.lessonPrimary} type="button" onClick={onStartOver}>Új dolgot értek meg</button>
      ) : (
        <a className={styles.lessonPrimaryLink} href="/app">Új dolgot értek meg</a>
      )}
      <a className={styles.lessonSecondaryLink} href="/app#library-title">Saját tanulásaim</a>
    </section>
  );
}
