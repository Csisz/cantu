"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isLearningAnalysisV2, type LearningAnalysis } from "@/lib/analysis/schema";
import { persistLearningProgress, persistPhraseReference } from "@/lib/learning/client";
import {
  calculateRecallScore,
  lessonStageSequence,
  nextLessonStage,
  phraseSaveReference,
  previousLessonStage,
  resumeLessonStage,
  stagePercent,
  type LessonStage,
  type RecallAnswerState,
} from "@/lib/learning/player";
import styles from "../app.module.css";
import { ChunkCard } from "./ChunkCard";
import { AnnotatedSourceView } from "./AnnotatedSourceView";
import { CantuShortcutCard } from "./CantuShortcutCard";
import { CompletionCard } from "./CompletionCard";
import { GrammarCard } from "./GrammarCard";
import { LearningProgress } from "./LearningProgress";
import { MeaningCard } from "./MeaningCard";
import { RecallCard } from "./RecallCard";
import { SayCard } from "./SayCard";
import { RobotCoach } from "./RobotCoach";

type GuidePhase = "source" | "resume" | "shortcut" | null;

export type LearningPlayerProps = {
  sessionId: string;
  analysis: LearningAnalysis;
  initialProgress?: { stage: string; recallScore: number | null } | null;
  initialSavedChunkIndices?: number[];
  localPlaybackUrl?: string;
  activeSourceText?: string;
  feedbackAuthenticated?: boolean;
  onStartOver?: () => void;
};

export function LearningPlayer({
  sessionId,
  analysis,
  initialProgress,
  initialSavedChunkIndices = [],
  localPlaybackUrl,
  activeSourceText,
  feedbackAuthenticated = true,
  onStartOver,
}: LearningPlayerProps) {
  const stages = useMemo(() => lessonStageSequence(analysis), [analysis]);
  const initialStage = resumeLessonStage(initialProgress?.stage, stages) ?? "meaning";
  const [stage, setStage] = useState<LessonStage>(initialStage);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [recallIndex, setRecallIndex] = useState(0);
  const [answers, setAnswers] = useState<RecallAnswerState[]>([]);
  const [savedChunks, setSavedChunks] = useState(() => new Set(initialSavedChunkIndices));
  const [savingChunk, setSavingChunk] = useState<number | null>(null);
  const [saveMessages, setSaveMessages] = useState<Record<number, string>>({});
  const [persistenceMessage, setPersistenceMessage] = useState("");
  const [guidePhase, setGuidePhase] = useState<GuidePhase>(() => (
    isLearningAnalysisV2(analysis) ? (activeSourceText ? "source" : "resume") : null
  ));
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [stage, chunkIndex, recallIndex, guidePhase]);

  async function persistProgress(nextStage: LessonStage, recallScore: number | null = null) {
    const result = await persistLearningProgress({ sessionId, stage: nextStage, recallScore });
    setPersistenceMessage(result.status === "error" ? result.message : "");
    if (result.status === "success") {
      window.dispatchEvent(new CustomEvent("cantu:learning-progress-updated", {
        detail: { sessionId, stage: nextStage, percentComplete: stagePercent(nextStage), recallScore },
      }));
    }
  }

  function advanceStage() {
    const next = nextLessonStage(stage, stages);
    if (!next) return;
    const score = next === "completed" ? calculateRecallScore(answers) : null;
    setStage(next);
    void persistProgress(next, score);
  }

  function goBack() {
    const previous = previousLessonStage(stage, stages);
    if (previous) setStage(previous);
  }

  async function saveChunk(index: number) {
    if (savedChunks.has(index) || savingChunk !== null) return;
    setSavingChunk(index);
    setSaveMessages((current) => ({ ...current, [index]: "" }));
    const result = await persistPhraseReference(phraseSaveReference(sessionId, index));
    setSavingChunk(null);
    setSaveMessages((current) => ({ ...current, [index]: result.message }));
    if (result.status === "success") {
      setSavedChunks((current) => new Set(current).add(index));
      window.dispatchEvent(new CustomEvent("cantu:phrase-saved"));
    }
  }

  const currentRecall = analysis.recall[recallIndex];
  const currentAnswer = currentRecall
    ? answers.find((answer) => answer.itemId === currentRecall.id)
    : undefined;
  const finalScore = answers.length > 0
    ? calculateRecallScore(answers)
    : initialProgress?.recallScore ?? null;
  const correctCount = answers.length > 0
    ? answers.filter((answer) => answer.correct).length
    : null;

  if (isLearningAnalysisV2(analysis) && guidePhase) {
    return (
      <section className={styles.learningPlayer} aria-label="Cantu vezetett tanulási lecke">
        <div ref={cardRef} className={styles.lessonStage}>
          {guidePhase === "source" && activeSourceText ? (
            <AnnotatedSourceView
              sourceText={activeSourceText}
              analysis={analysis}
              sessionId={sessionId}
              authenticated={feedbackAuthenticated}
              savedChunks={savedChunks}
              savingChunk={savingChunk}
              saveMessages={saveMessages}
              onSaveChunk={(index) => void saveChunk(index)}
              onNext={() => setGuidePhase("shortcut")}
            />
          ) : null}
          {guidePhase === "resume" ? (
            <section className={`${styles.lessonCard} ${styles.sourceUnavailableCard}`} aria-labelledby="source-unavailable-title">
              <RobotCoach state="welcome" message="Folytassuk onnan, ahol abbahagytad." />
              <span className={styles.lessonEyebrow}>Privát folytatás</span>
              <h2 id="source-unavailable-title" tabIndex={-1}>Az eredeti forrást nem mentettük el.</h2>
              <p>Az eredeti forrást adatvédelmi okból nem mentettük el. A tanult részeket továbbra is eléred.</p>
              <button className={styles.lessonPrimary} type="button" onClick={() => setGuidePhase("shortcut")}>
                Mutasd a Cantu Shortcutot
              </button>
            </section>
          ) : null}
          {guidePhase === "shortcut" ? (
            <CantuShortcutCard analysis={analysis} onNext={() => setGuidePhase(null)} />
          ) : null}
        </div>
        <p className={styles.persistenceStatus} role="status">{persistenceMessage}</p>
      </section>
    );
  }

  return (
    <section className={styles.learningPlayer} aria-label="Cantu tanulási lecke">
      <LearningProgress stage={stage} stages={stages} />
      {stage !== "meaning" && stage !== "completed" ? (
        <button className={styles.lessonBack} type="button" onClick={goBack}>← Vissza</button>
      ) : null}
      <div ref={cardRef} className={styles.lessonStage}>
        {stage === "meaning" ? <MeaningCard analysis={analysis} onNext={advanceStage} /> : null}
        {stage === "chunks" ? (
          <ChunkCard
            chunk={analysis.chunks[chunkIndex]!}
            index={chunkIndex}
            total={analysis.chunks.length}
            saved={savedChunks.has(chunkIndex)}
            saving={savingChunk === chunkIndex}
            saveMessage={saveMessages[chunkIndex] ?? ""}
            onSave={() => void saveChunk(chunkIndex)}
            onNext={() => {
              if (chunkIndex + 1 < analysis.chunks.length) setChunkIndex((current) => current + 1);
              else advanceStage();
            }}
          />
        ) : null}
        {stage === "grammar" ? <GrammarCard analysis={analysis} onNext={advanceStage} /> : null}
        {stage === "say" ? (
          <SayCard
            analysis={analysis}
            sessionId={sessionId}
            authenticated={feedbackAuthenticated}
            localPlaybackUrl={localPlaybackUrl}
            onNext={advanceStage}
          />
        ) : null}
        {stage === "recall" && currentRecall ? (
          <RecallCard
            item={currentRecall}
            index={recallIndex}
            total={analysis.recall.length}
            answer={currentAnswer}
            onAnswer={(answer) => setAnswers((current) => current.some((item) => item.itemId === answer.itemId) ? current : [...current, answer])}
            onNext={() => {
              if (recallIndex + 1 < analysis.recall.length) setRecallIndex((current) => current + 1);
              else advanceStage();
            }}
          />
        ) : null}
        {stage === "completed" ? (
          <CompletionCard
            chunkCount={analysis.chunks.length}
            recallScore={finalScore}
            correctCount={correctCount}
            recallCount={analysis.recall.length}
            savedCount={savedChunks.size}
            onStartOver={onStartOver}
          />
        ) : null}
      </div>
      <p className={styles.persistenceStatus} role="status">{persistenceMessage}</p>
    </section>
  );
}
