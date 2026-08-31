"use client";

import { useMemo, useRef, useState } from "react";
import { segmentAnnotatedSource } from "@/lib/analysis/annotations";
import type { LearningAnalysisV2 } from "@/lib/analysis/schema";
import styles from "../app.module.css";
import { RobotCoach } from "./RobotCoach";
import { ShadowingPractice } from "./ShadowingPractice";

const categoryLabels = {
  core: "A lényeg",
  useful_phrase: "Hasznos kifejezés",
  grammar: "Szerkezet",
  pronunciation: "Kiejtés",
  tone: "Hangnem",
} as const;

export function AnnotatedSourceView({
  sourceText,
  analysis,
  sessionId,
  authenticated,
  savedChunks,
  savingChunk,
  saveMessages,
  onSaveChunk,
  onNext,
}: {
  sourceText: string;
  analysis: LearningAnalysisV2;
  sessionId: string;
  authenticated: boolean;
  savedChunks: ReadonlySet<number>;
  savingChunk: number | null;
  saveMessages: Record<number, string>;
  onSaveChunk: (index: number) => void;
  onNext: () => void;
}) {
  const segments = useMemo(
    () => segmentAnnotatedSource(sourceText, analysis.annotations),
    [analysis.annotations, sourceText],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shadowingChunk, setShadowingChunk] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const selected = analysis.annotations.find((item) => item.id === selectedId) ?? null;
  const chunk = selected?.chunkIndex === null || selected?.chunkIndex === undefined
    ? null
    : analysis.chunks[selected.chunkIndex] ?? null;
  const transfer = analysis.transfer[0] ?? null;

  function openInsight(id: string) {
    setShadowingChunk(null);
    setSelectedId(id);
    requestAnimationFrame(() => panelRef.current?.focus());
  }

  function closeInsight() {
    const closingId = selectedId;
    setSelectedId(null);
    setShadowingChunk(null);
    requestAnimationFrame(() => closingId && triggerRefs.current.get(closingId)?.focus());
  }

  return (
    <section className={`${styles.lessonCard} ${styles.annotatedSourceCard}`} aria-labelledby="annotated-source-title">
      <RobotCoach state="source" />
      <span className={styles.lessonEyebrow}>A te forrásod · csak ebben az aktív munkamenetben</span>
      <h2 id="annotated-source-title" tabIndex={-1}>Innen tanulunk</h2>
      <p className={styles.annotatedSourceLead}>A kiemelt részeket nyisd meg: megmutatják, miért érdemes rájuk figyelni.</p>
      <blockquote className={styles.annotatedSourceText} lang="it">
        {segments.map((segment, index) => segment.kind === "text" ? (
          <span key={`text-${index}`}>{segment.text}</span>
        ) : (
          <button
            key={segment.annotation.id}
            ref={(element) => {
              if (element) triggerRefs.current.set(segment.annotation.id, element);
              else triggerRefs.current.delete(segment.annotation.id);
            }}
            className={styles.sourceHighlight}
            data-category={segment.annotation.category}
            type="button"
            onClick={() => openInsight(segment.annotation.id)}
            aria-label={`${segment.text}. ${categoryLabels[segment.annotation.category]}: ${segment.annotation.titleHu}`}
            aria-expanded={selectedId === segment.annotation.id}
          >
            <span>{segment.text}</span>
            <small>{categoryLabels[segment.annotation.category]}</small>
          </button>
        ))}
      </blockquote>
      {selected ? (
        <div ref={panelRef} className={styles.sourceInsight} tabIndex={-1} aria-labelledby="source-insight-title">
          <div className={styles.insightHeading}>
            <div>
              <span>{categoryLabels[selected.category]}</span>
              <h3 id="source-insight-title">{selected.titleHu}</h3>
            </div>
            <button type="button" onClick={closeInsight} aria-label="Magyarázat bezárása">×</button>
          </div>
          <p>{selected.explanationHu}</p>
          {chunk ? (
            <div className={styles.insightMeaning}>
              <strong lang="it">{chunk.sourceText}</strong>
              <span>Mit jelent itt?</span>
              <p>{chunk.meaningHu}</p>
              <span>Miért érdemes megjegyezni?</span>
              <p>{chunk.whyUsefulHu}</p>
            </div>
          ) : null}
          {transfer ? (
            <div className={styles.insightExample}>
              <span>Új tanítási példa · nem a forrás része</span>
              <strong lang="it">{transfer.italian}</strong>
              <p>{transfer.meaningHu}</p>
            </div>
          ) : null}
          {chunk && selected.chunkIndex !== null ? (
            <div className={styles.insightActions}>
              <button
                className={styles.phraseSaveButton}
                type="button"
                onClick={() => onSaveChunk(selected.chunkIndex!)}
                disabled={savedChunks.has(selected.chunkIndex) || savingChunk !== null}
              >
                {savedChunks.has(selected.chunkIndex) ? "Elmentve ✓" : savingChunk === selected.chunkIndex ? "Mentés…" : "Mentem ezt"}
              </button>
              <button className={styles.insightShadowButton} type="button" onClick={() => setShadowingChunk(selected.chunkIndex)}>
                Mondd ki ezt
              </button>
              <p role="status">{saveMessages[selected.chunkIndex] ?? ""}</p>
            </div>
          ) : null}
          {shadowingChunk !== null ? (
            <div className={styles.insightShadowing}>
              <h4>Mondd ki ezt</h4>
              <ShadowingPractice
                sessionId={sessionId}
                chunkIndex={shadowingChunk}
                authenticated={authenticated}
                onNext={() => setShadowingChunk(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <button className={styles.lessonPrimary} type="button" onClick={onNext}>Mutasd a Cantu Shortcutot</button>
    </section>
  );
}
