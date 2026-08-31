import { useEffect, useRef, useState } from "react";
import type { LearningAnalysis } from "@/lib/analysis/schema";
import { gradeRecallAnswer, type RecallAnswerState } from "@/lib/learning/player";
import styles from "../app.module.css";

function correctAnswerText(item: LearningAnalysis["recall"][number]) {
  if (item.correctText) return item.correctText;
  return item.options.find((option) => option.id === item.correctOptionId)?.text ?? "";
}

export function RecallCard({
  item,
  index,
  total,
  answer,
  onAnswer,
  onNext,
}: {
  item: LearningAnalysis["recall"][number];
  index: number;
  total: number;
  answer?: RecallAnswerState;
  onAnswer: (answer: RecallAnswerState) => void;
  onNext: () => void;
}) {
  const [draft, setDraft] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const isFill = item.type === "fill_chunk";

  useEffect(() => {
    if (answer) feedbackRef.current?.focus();
  }, [answer]);

  function submit() {
    if (!draft || answer) return;
    onAnswer({ itemId: item.id, answer: draft, correct: gradeRecallAnswer(item, draft) });
  }

  return (
    <section className={styles.lessonCard} aria-labelledby="lesson-recall-title">
      <span className={styles.lessonEyebrow}>Aktív felidézés · {index + 1} / {total}</span>
      <h2 id="lesson-recall-title" tabIndex={-1}>Emlékszel?</h2>
      <p className={styles.recallPrompt}>{item.promptHu}</p>
      {isFill ? (
        <label className={styles.fillAnswer}>
          <span>Olasz válasz</span>
          <input
            value={answer?.answer ?? draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={Boolean(answer)}
            autoComplete="off"
          />
        </label>
      ) : (
        <fieldset className={styles.recallChoices} disabled={Boolean(answer)}>
          <legend>Válassz egy választ</legend>
          {item.options.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name={`recall-${item.id}`}
                value={option.id}
                checked={(answer?.answer ?? draft) === option.id}
                onChange={() => setDraft(option.id)}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
      )}
      {!answer ? (
        <button className={styles.lessonPrimary} type="button" onClick={submit} disabled={!draft.trim()}>
          Ellenőrzöm
        </button>
      ) : (
        <>
          <div
            ref={feedbackRef}
            className={`${styles.recallFeedback} ${answer.correct ? styles.correctFeedback : styles.incorrectFeedback}`}
            role="status"
            tabIndex={-1}
          >
            <strong>{answer.correct ? "Pontosan." : "Nézzük meg."}</strong>
            {!answer.correct ? <p>A helyes válasz: <b lang="it">{correctAnswerText(item)}</b></p> : null}
            <p>{item.explanationHu}</p>
          </div>
          <button className={styles.lessonPrimary} type="button" onClick={onNext}>
            {index + 1 < total ? "Következő kérdés" : "Befejezem"}
          </button>
        </>
      )}
    </section>
  );
}
