"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gradeReviewAnswer } from "@/lib/review/grading";
import { persistReviewSubmission } from "@/lib/review/client";
import type { ReviewItem, ReviewRating, ReviewSnapshot } from "@/lib/review/types";
import { RobotCoach } from "../learning/RobotCoach";
import styles from "../app.module.css";

type ReviewResult = { phraseId: string; correct: boolean; rating: ReviewRating };

function ratingLabel(rating: Exclude<ReviewRating, "again">) {
  return ({ hard: "Nehéz volt", good: "Ment", easy: "Könnyű volt" } as const)[rating];
}

export function ReviewSession({ snapshot }: { snapshot: ReviewSnapshot }) {
  const [phase, setPhase] = useState<"home" | "active" | "completed">(
    snapshot.mode === "manual" && snapshot.items.length > 0 ? "active" : "home",
  );
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState<{ value: string; correct: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaveFailed, setLastSaveFailed] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const item = snapshot.items[index];
  const total = snapshot.items.length;

  useEffect(() => {
    if (answer) feedbackRef.current?.focus();
    else headingRef.current?.focus();
  }, [answer, index, phase]);

  const summary = useMemo(() => ({
    firstTry: results.filter((result) => result.correct).length,
    strengthened: results.filter((result) => result.correct && result.rating !== "hard").length,
    soonAgain: results.filter((result) => !result.correct).length,
  }), [results]);

  async function saveResult(rating: Exclude<ReviewRating, "again"> | undefined) {
    if (!item || !answer || saving) return false;
    setSaving(true);
    setMessage("");
    setLastSaveFailed(false);
    const response = await persistReviewSubmission({
      phraseId: item.phraseId,
      activityType: item.activityType,
      answer: answer.value,
      rating,
      manual: snapshot.mode === "manual",
    });
    setSaving(false);
    setMessage(response.message);
    if (response.status !== "success") {
      setLastSaveFailed(true);
      return false;
    }
    const effectiveRating = response.effectiveRating ?? (answer.correct ? rating ?? "good" : "again");
    setResults((current) => current.some((result) => result.phraseId === item.phraseId)
      ? current
      : [...current, { phraseId: item.phraseId, correct: answer.correct, rating: effectiveRating }]);
    return true;
  }

  async function submitAnswer() {
    if (!item || !draft.trim() || answer) return;
    const correct = gradeReviewAnswer(item, draft);
    setAnswer({ value: draft, correct });
    if (!correct || snapshot.mode === "manual") await saveResultAfterState(item, draft, correct);
  }

  async function saveResultAfterState(currentItem: ReviewItem, value: string, correct: boolean) {
    setSaving(true);
    setMessage("");
    setLastSaveFailed(false);
    const response = await persistReviewSubmission({
      phraseId: currentItem.phraseId,
      activityType: currentItem.activityType,
      answer: value,
      manual: snapshot.mode === "manual",
    });
    setSaving(false);
    setMessage(response.message);
    if (response.status === "success") {
      setResults((current) => current.some((result) => result.phraseId === currentItem.phraseId)
        ? current
        : [...current, {
            phraseId: currentItem.phraseId,
            correct,
            rating: response.effectiveRating ?? (correct ? "good" : "again"),
          }]);
    } else setLastSaveFailed(true);
  }

  async function rate(rating: Exclude<ReviewRating, "again">) {
    const saved = await saveResult(rating);
    if (saved) advance();
  }

  function advance() {
    if (index + 1 >= total) {
      setPhase("completed");
      return;
    }
    setIndex((current) => current + 1);
    setDraft("");
    setAnswer(null);
    setMessage("");
    setLastSaveFailed(false);
  }

  if (phase === "home") {
    if (total === 0) {
      return (
        <section className={styles.reviewWelcome} aria-labelledby="review-empty-title">
          <RobotCoach state="completion" message="Mára kész vagy." />
          <span className={styles.kicker}>Mai ismétlés</span>
          <h1 id="review-empty-title" ref={headingRef} tabIndex={-1}>Mára kész vagy.</h1>
          <p>Most nincs esedékes kifejezés. A mentett elemek akkor térnek vissza, amikor érdemes újra elővenni őket.</p>
          <Link className={styles.lessonPrimary} href="/app?mode=text">Tanulok valami újat</Link>
        </section>
      );
    }
    return (
      <section className={styles.reviewWelcome} aria-labelledby="review-home-title">
        <RobotCoach state="welcome" message="Van pár kifejezés, amit érdemes elővenni." />
        <span className={styles.kicker}>Mai ismétlés</span>
        <h1 id="review-home-title" ref={headingRef} tabIndex={-1}>{total} kifejezés vár rád.</h1>
        <p>Kb. {Math.max(1, Math.ceil(total / 2))} perc. Először felidézed, csak utána mutatjuk a választ.</p>
        <button className={styles.lessonPrimary} type="button" onClick={() => setPhase("active")}>Kezdem</button>
      </section>
    );
  }

  if (phase === "completed") {
    return (
      <section className={styles.reviewCompletion} aria-labelledby="review-complete-title" aria-live="polite">
        <RobotCoach state="completion" message="Mára kész vagy." />
        <span className={styles.kicker}>Mai ismétlés kész</span>
        <h1 id="review-complete-title" ref={headingRef} tabIndex={-1}>Mai ismétlés kész</h1>
        <div className={styles.reviewSummary}>
          <p><strong>{summary.firstTry} / {total}</strong><span>elsőre sikerült</span></p>
          <p><strong>{summary.strengthened}</strong><span>kifejezés erősödött</span></p>
          <p><strong>{summary.soonAgain}</strong><span>hamarosan újra jön</span></p>
        </div>
        <Link className={styles.lessonPrimary} href="/app/practice">Gyakorold valódi helyzetben</Link>
        <Link className={styles.lessonSecondaryLink} href="/app#phrasebook-title">Mentett kifejezéseim</Link>
      </section>
    );
  }

  if (!item) return null;
  const canAdvanceAfterAutomaticSave = answer && (!answer.correct || snapshot.mode === "manual")
    && results.some((result) => result.phraseId === item.phraseId);

  return (
    <section className={styles.reviewSession} aria-label="Cantu ismétlés">
      <div className={styles.reviewProgress} aria-label={`${index + 1} / ${total} ismétlési kérdés`}>
        <span>{index + 1} / {total}</span>
        <div aria-hidden="true"><i style={{ width: `${Math.round(((index + 1) / total) * 100)}%` }} /></div>
      </div>
      <article className={styles.reviewCard} aria-labelledby="review-question-title">
        {!answer ? <RobotCoach state="challenge" message="Nézzük, megmaradt-e." /> : null}
        <span className={styles.lessonEyebrow}>
          {item.activityType === "it_to_hu" ? "Jelentés" : item.activityType === "fill_chunk" ? "Egészítsd ki" : "Aktív felidézés"}
        </span>
        <h1 id="review-question-title" ref={headingRef} tabIndex={-1} lang={item.promptLanguage}>{item.prompt}</h1>
        {!answer ? (
          <>
            {item.activityType === "it_to_hu" ? (
              <fieldset className={styles.recallChoices}>
                <legend>{item.answerLabel}</legend>
                {item.options.map((option) => (
                  <label key={option.id}>
                    <input type="radio" name={`review-${item.phraseId}`} value={option.id} checked={draft === option.id} onChange={() => setDraft(option.id)} />
                    <span>{option.text}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <label className={styles.fillAnswer}>
                <span>{item.answerLabel}</span>
                <input value={draft} onChange={(event) => setDraft(event.target.value)} autoComplete="off" lang="it" />
              </label>
            )}
            <button className={styles.lessonPrimary} type="button" onClick={() => void submitAnswer()} disabled={!draft.trim() || saving}>Ellenőrzöm</button>
          </>
        ) : (
          <>
            <div ref={feedbackRef} className={`${styles.recallFeedback} ${answer.correct ? styles.correctFeedback : styles.incorrectFeedback}`} role="status" tabIndex={-1}>
              <RobotCoach state={answer.correct ? "success" : "retry"} message={answer.correct ? "Ez már jól megy." : "Semmi gond. Most már újra ismerős lesz."} />
              <strong>{answer.correct ? "Pontosan." : "Nézzük meg."}</strong>
              {!answer.correct ? <p>A helyes válasz: <b lang="it">{item.revealedAnswer}</b></p> : null}
              {item.noteHu ? <p>{item.noteHu}</p> : null}
            </div>
            {answer.correct && snapshot.mode === "scheduled" ? (
              <fieldset className={styles.reviewRatings} disabled={saving}>
                <legend>Mennyire ment a felidézés?</legend>
                {(["hard", "good", "easy"] as const).map((rating) => (
                  <button key={rating} type="button" onClick={() => void rate(rating)}>{ratingLabel(rating)}</button>
                ))}
              </fieldset>
            ) : null}
            {canAdvanceAfterAutomaticSave ? (
              <button className={styles.lessonPrimary} type="button" onClick={advance}>
                {index + 1 < total ? "Következő" : "Befejezem"}
              </button>
            ) : null}
            {lastSaveFailed && (!answer.correct || snapshot.mode === "manual") ? (
              <button className={styles.lessonSecondaryButton} type="button" onClick={() => void saveResultAfterState(item, answer.value, answer.correct)} disabled={saving}>
                Mentés újra
              </button>
            ) : null}
          </>
        )}
        <p className={styles.persistenceStatus} role="status">{saving ? "Mentem az ismétlést…" : message}</p>
      </article>
    </section>
  );
}
