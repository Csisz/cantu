"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { startPracticeScenario, submitPracticeResponse } from "@/lib/practice/client";
import { PRACTICE_SCENARIOS, type PracticeScenarioId } from "@/lib/practice/scenarios";
import type { PracticeClientResult, PracticeProviderTarget } from "@/lib/practice/types";
import { RobotCoach } from "../learning/RobotCoach";
import styles from "../app.module.css";

type PracticePhase = "choose" | "starting" | "answer" | "sending" | "feedback" | "completed";

type PracticeOutcome = {
  status: "good" | "understandable" | "needs_fix";
  targetReference: string | null;
  usedSuccessfully: boolean;
  correction: string | null;
};

export function PracticeLab({ suggestedTargets }: { suggestedTargets: PracticeProviderTarget[] }) {
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenarioId>("restaurant");
  const [phase, setPhase] = useState<PracticePhase>("choose");
  const [session, setSession] = useState<PracticeClientResult | null>(null);
  const [draft, setDraft] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [outcomes, setOutcomes] = useState<PracticeOutcome[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "feedback") feedbackRef.current?.focus();
    else headingRef.current?.focus();
  }, [phase, session?.turnCount]);

  const summary = useMemo(() => ({
    successfulTargets: new Set(outcomes.filter((item) => item.usedSuccessfully && item.targetReference).map((item) => item.targetReference)).size,
    corrections: outcomes.filter((item) => item.status === "needs_fix" && item.correction).map((item) => item.correction!),
  }), [outcomes]);

  async function start() {
    if (phase === "starting") return;
    setPhase("starting");
    setMessage("");
    setQuotaExhausted(false);
    const response = await startPracticeScenario(selectedScenario);
    if (response.status === "error") {
      setMessage(response.message);
      setQuotaExhausted(response.code === "quota_exceeded");
      setPhase("choose");
      return;
    }
    setSession(response.data);
    setOutcomes([]);
    setDraft("");
    setHintOpen(false);
    setPhase("answer");
  }

  async function submit() {
    if (!session?.stateToken || !draft.trim() || phase === "sending") return;
    setPhase("sending");
    setMessage("");
    setQuotaExhausted(false);
    const response = await submitPracticeResponse(session.stateToken, draft);
    if (response.status === "error") {
      setMessage(response.message);
      setQuotaExhausted(response.code === "quota_exceeded");
      setPhase("answer");
      return;
    }
    const feedback = response.data.turn.learnerFeedback;
    if (feedback) {
      setOutcomes((current) => [...current, {
        status: feedback.status,
        targetReference: response.data.turn.targetUsage.targetPhraseId,
        usedSuccessfully: response.data.turn.targetUsage.usedSuccessfully,
        correction: feedback.correctedItalian,
      }]);
    }
    setSession(response.data);
    setDraft("");
    setHintOpen(false);
    setPhase("feedback");
  }

  function continueAfterFeedback() {
    if (session?.turn.scenarioState === "complete") setPhase("completed");
    else setPhase("answer");
  }

  if (phase === "choose" || phase === "starting") {
    return (
      <section className={styles.practiceWelcome} aria-labelledby="practice-title">
        <RobotCoach state="welcome" message="Próbáljuk ki egy valódi helyzetben." />
        <span className={styles.kicker}>Real-Life Practice Lab</span>
        <h1 id="practice-title" ref={headingRef} tabIndex={-1}>Használd azt, amit már megtanultál.</h1>
        <p>Válassz egy rövid helyzetet. Cantu a saját mentett kifejezéseidből ad célt, és legfeljebb öt válasz után lezárja a gyakorlást.</p>
        <div className={styles.practiceTargetPreview} aria-label="A gyakorlás célkifejezései">
          <span>Ezeket erősítjük</span>
          {suggestedTargets.map((target) => <strong key={target.referenceId} lang="it">{target.italianChunk}</strong>)}
        </div>
        <fieldset className={styles.scenarioGrid}>
          <legend>Válassz helyzetet</legend>
          {PRACTICE_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={selectedScenario === scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <span aria-hidden="true">{scenario.icon}</span>
              <strong>{scenario.titleHu}</strong>
              <small>{scenario.settingHu}</small>
            </button>
          ))}
        </fieldset>
        <button className={styles.lessonPrimary} type="button" onClick={() => void start()} disabled={phase === "starting"}>
          {phase === "starting" ? "Előkészítem a helyzetet…" : "Kezdem a gyakorlást"}
        </button>
        <p className={styles.persistenceStatus} role="status">{message}</p>
        {quotaExhausted ? <Link className={styles.lessonSecondaryLink} href="/pricing">Cantu Plus</Link> : null}
      </section>
    );
  }

  if (phase === "completed" && session) {
    return (
      <section className={styles.practiceCompletion} aria-labelledby="practice-complete-title" aria-live="polite">
        <RobotCoach state="completion" message="Ezt már nem csak felismered — használod is." />
        <span className={styles.kicker}>Szituáció kész</span>
        <h1 id="practice-complete-title" ref={headingRef} tabIndex={-1}>Szituáció kész</h1>
        <div className={styles.practiceSummary}>
          <p><strong>{session.turnCount}</strong><span>saját válasz</span></p>
          <p><strong>{summary.successfulTargets}</strong><span>mentett kifejezés természetesen használva</span></p>
        </div>
        {summary.corrections.at(-1) ? (
          <div className={styles.practiceCorrectionMemory}>
            <span>Egy javítás, amit érdemes elvinni</span>
            <strong lang="it">{summary.corrections.at(-1)}</strong>
          </div>
        ) : null}
        <Link className={styles.lessonPrimary} href="/app#phrasebook-title">Mentett kifejezéseim</Link>
        <button className={styles.lessonSecondaryButton} type="button" onClick={() => { setSession(null); setPhase("choose"); }}>Másik helyzet</button>
      </section>
    );
  }

  if (!session) return null;
  const feedback = session.turn.learnerFeedback;
  const target = session.targets.find((item) => item.referenceId === session.turn.targetUsage.targetPhraseId);

  return (
    <section className={styles.practiceSession} aria-label="Valódi helyzet gyakorlása">
      <div className={styles.practiceProgress} aria-label={`${session.turnCount} / ${session.maxTurns} válasz, legfeljebb`}>
        <span>{session.turnCount} / {session.maxTurns}</span>
        <div aria-hidden="true"><i style={{ width: `${Math.max(8, (session.turnCount / session.maxTurns) * 100)}%` }} /></div>
      </div>
      <article className={styles.practiceCard}>
        {phase === "answer" || phase === "sending" ? <RobotCoach state="challenge" message="Most te jössz." /> : null}
        <span className={styles.lessonEyebrow}>{session.scenario.titleHu} · {session.scenario.partnerRoleHu}</span>
        <h1 ref={headingRef} tabIndex={-1} lang="it">{session.turn.partnerReplyIt}</h1>
        {session.turn.partnerReplyHuHint ? <p className={styles.practicePartnerHint}>{session.turn.partnerReplyHuHint}</p> : null}

        {(phase === "answer" || phase === "sending") ? (
          <>
            {session.turn.nextGoalHu ? <p className={styles.practiceGoal}><span>A célod</span>{session.turn.nextGoalHu}</p> : null}
            <button className={styles.practiceHintButton} type="button" aria-expanded={hintOpen} onClick={() => setHintOpen((open) => !open)}>
              {hintOpen ? "Elrejtem a segítséget" : "Segíts egy kicsit"}
            </button>
            {hintOpen ? (
              <div className={styles.practiceHint}>
                <span>Használhatod ezt</span>
                {session.targets.map((item) => (
                  <p key={item.referenceId}><strong lang="it">{item.italianChunk}</strong><small>{item.meaningHu}</small></p>
                ))}
              </div>
            ) : null}
            <label className={styles.practiceResponse} htmlFor="practice-response">
              <span>A válaszod olaszul</span>
              <textarea id="practice-response" aria-label="A válaszod olaszul" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={600} rows={4} disabled={phase === "sending"} />
              <small>{draft.length} / 600</small>
            </label>
            <button className={styles.lessonPrimary} type="button" onClick={() => void submit()} disabled={!draft.trim() || phase === "sending"}>
              {phase === "sending" ? "Figyelek…" : "Elküldöm"}
            </button>
          </>
        ) : null}

        {phase === "feedback" && feedback ? (
          <div ref={feedbackRef} className={styles.practiceFeedback} role="status" tabIndex={-1} data-status={feedback.status}>
            <RobotCoach
              state={feedback.status === "good" ? "success" : feedback.status === "needs_fix" ? "retry" : "encourage"}
              message={feedback.status === "good" ? "Ez természetesen hangzott." : feedback.status === "needs_fix" ? "Érthető volt. Egy apró dolgot javítsunk." : "Ez érthető és a helyzetbe illik."}
            />
            <strong>{feedback.status === "good" ? "Jól használtad." : feedback.status === "needs_fix" ? "Ezt finomítsuk." : "Érthető válasz."}</strong>
            {feedback.explanationHu ? <p>{feedback.explanationHu}</p> : null}
            {feedback.correctedItalian ? <p className={styles.practiceCorrection}><span>Javítva</span><b lang="it">{feedback.correctedItalian}</b></p> : null}
            {feedback.naturalAlternativeIt ? <p className={styles.practiceAlternative}><span>Természetesebb változat</span><b lang="it">{feedback.naturalAlternativeIt}</b></p> : null}
            {target && session.turn.targetUsage.usedSuccessfully ? <p className={styles.microSuccess}>✓ A(z) „{target.italianChunk}” kifejezést valódi helyzetben használtad.</p> : null}
            {session.reviewBroughtForward ? <p className={styles.practiceReviewSignal}>Ezt a kifejezést hamarabb visszahozzuk az ismétlésben.</p> : null}
            <button className={styles.lessonPrimary} type="button" onClick={continueAfterFeedback}>
              {session.turn.scenarioState === "complete" ? "Lezárom a szituációt" : "Jöhet a következő"}
            </button>
          </div>
        ) : null}
        <p className={styles.persistenceStatus} role="status">{message}</p>
        {quotaExhausted ? <Link className={styles.lessonSecondaryLink} href="/pricing">Cantu Plus</Link> : null}
      </article>
    </section>
  );
}
