"use client";

import { useEffect, useRef, useState } from "react";
import { requestLearningAnalysis } from "@/lib/analysis/client";
import type { LearningAnalysis } from "@/lib/analysis/schema";
import type { LearningSource } from "@/lib/input/types";
import { AnalysisError, type AnalysisErrorCode } from "@/lib/providers/analysis/types";
import styles from "./app.module.css";

type AnalysisView =
  | { status: "idle" }
  | { status: "auth_required" }
  | { status: "processing" }
  | { status: "ready"; analysis: LearningAnalysis; sessionId: string; cached: boolean }
  | { status: "error"; code: AnalysisErrorCode };

const errorCopy: Record<AnalysisErrorCode, string> = {
  invalid_source: "Ezt a forrást most nem tudjuk elemezni. Ellenőrizd a szöveget.",
  source_not_verified: "Az elemzés előtt erősítsd meg vagy javítsd az átiratot.",
  unauthenticated: "Az elemzéshez jelentkezz be.",
  not_configured: "A nyelvi elemzés nincs beállítva ezen a környezeten.",
  rate_limited: "Most elérted a rövid idejű elemzési korlátot. Próbáld később.",
  provider_unavailable: "Az elemzés átmenetileg nem érhető el. A forrásod megmaradt ezen az oldalon.",
  provider_timeout: "Az elemzés túl sokáig tartott. Próbáld újra.",
  invalid_provider_response: "Az elemzés nem adott biztonságosan használható eredményt. Próbáld újra.",
  analysis_invalid: "Az eredmény nem ment át a Cantu ellenőrzésén. Próbáld újra.",
  unsupported_language: "Ez valószínűleg nem olasz. A Cantu első verziója olaszhoz készült.",
  session_not_found: "A hangforrás munkamenete nem található. Készíts új átiratot.",
  source_context_mismatch: "Ehhez a munkamenethez más ellenőrzött forrás tartozik. Indíts új forrást.",
  analysis_in_progress: "Ehhez a forráshoz már fut egy elemzés. Várj egy pillanatot.",
};

function inputTypeFor(source: LearningSource) {
  return source.kind === "text" ? "text" : source.kind === "audio" ? "audio_file" : "microphone";
}

function ResultPreview({ analysis }: { analysis: LearningAnalysis }) {
  if (analysis.analysisStatus === "not_italian") {
    return (
      <section className={styles.analysisMessage} aria-labelledby="not-italian-title">
        <span className={styles.stepBadge}>Nyelvi ellenőrzés</span>
        <h2 id="not-italian-title">Ez valószínűleg nem olasz.</h2>
        <p>A Cantu első verziója olaszhoz készült.</p>
        {analysis.languageAssessment.noteHu ? <p>{analysis.languageAssessment.noteHu}</p> : null}
      </section>
    );
  }

  if (analysis.analysisStatus === "insufficient_source") {
    return (
      <section className={styles.analysisMessage} aria-labelledby="short-source-title">
        <span className={styles.stepBadge}>Rövid forrás</span>
        <h2 id="short-source-title">Egy kicsit hosszabb mondatból többet tanulhatunk.</h2>
        <p>{analysis.languageAssessment.noteHu ?? "Próbálj meg egy teljes rövid olasz mondatot hozni."}</p>
      </section>
    );
  }

  return (
    <div className={styles.analysisResult}>
      <section className={styles.meaningCard} aria-labelledby="meaning-title">
        <span className={styles.sectionNumber}>01</span>
        <div>
          <h2 id="meaning-title">Mit jelent?</h2>
          <p className={styles.naturalMeaning}>{analysis.meaning?.naturalHu}</p>
          {analysis.meaning?.literalStructureHu ? (
            <div className={styles.literalMeaning}>
              <strong>Szó szerinti felépítés</strong>
              <p>{analysis.meaning.literalStructureHu}</p>
            </div>
          ) : null}
          {analysis.meaning?.toneHu ? <p className={styles.toneNote}>{analysis.meaning.toneHu}</p> : null}
        </div>
      </section>

      <section className={styles.analysisSection} aria-labelledby="chunks-title">
        <span className={styles.sectionNumber}>02</span>
        <div>
          <h2 id="chunks-title">Ezt érdemes megjegyezni</h2>
          <ul className={styles.chunkList}>
            {analysis.chunks.map((chunk) => (
              <li key={`${chunk.sourceText}-${chunk.meaningHu}`}>
                <div>
                  <strong lang="it">{chunk.sourceText}</strong>
                  {chunk.register ? <span>{chunk.register}</span> : null}
                </div>
                <p>{chunk.meaningHu}</p>
                {chunk.contextNoteHu ? <small>{chunk.contextNoteHu}</small> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {analysis.grammar.length > 0 ? (
        <section className={styles.analysisSection} aria-labelledby="grammar-title">
          <span className={styles.sectionNumber}>03</span>
          <div>
            <h2 id="grammar-title">Miért így mondják?</h2>
            <div className={styles.insightList}>
              {analysis.grammar.map((note) => (
                <article key={note.titleHu}>
                  <h3>{note.titleHu}</h3>
                  <p>{note.explanationHu}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {analysis.pronunciation ? (
        <section className={styles.compactInsight} aria-labelledby="pronunciation-title">
          <h2 id="pronunciation-title">Hallás- és kiejtési fókusz</h2>
          <p>{analysis.pronunciation.noteHu}</p>
          <ul>{analysis.pronunciation.focus.map((focus) => <li key={focus} lang="it">{focus}</li>)}</ul>
        </section>
      ) : null}

      <section className={styles.analysisSection} aria-labelledby="transfer-title">
        <span className={styles.sectionNumber}>04</span>
        <div>
          <h2 id="transfer-title">Használd máshol is</h2>
          <p className={styles.generatedLabel}>Új, Cantu által készített példák</p>
          <ul className={styles.transferList}>
            {analysis.transfer.map((example) => (
              <li key={example.italian}>
                <strong lang="it">{example.italian}</strong>
                <span>{example.meaningHu}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.analysisSection} aria-labelledby="recall-title">
        <span className={styles.sectionNumber}>05</span>
        <div>
          <h2 id="recall-title">Emlékszel?</h2>
          <p className={styles.generatedLabel}>A következő mérföldkőben ezekből interaktív gyakorlás lesz.</p>
          <ol className={styles.recallList}>
            {analysis.recall.map((item) => <li key={item.id}>{item.promptHu}</li>)}
          </ol>
        </div>
      </section>

      {analysis.warnings.length > 0 ? (
        <aside className={styles.analysisWarnings} aria-label="Elemzési megjegyzések">
          {analysis.warnings.map((warning) => <p key={warning.code}>{warning.messageHu}</p>)}
        </aside>
      ) : null}
    </div>
  );
}

export function LearningPreview({ source, onStartOver, authenticated }: {
  source: LearningSource;
  onStartOver: () => void;
  authenticated: boolean;
}) {
  const [view, setView] = useState<AnalysisView>({ status: "idle" });
  const requestRef = useRef<AbortController | null>(null);
  const analysisInFlightRef = useRef(false);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function analyze() {
    if (analysisInFlightRef.current || view.status === "processing") return;
    if (!authenticated) {
      setView({ status: "auth_required" });
      return;
    }
    const controller = new AbortController();
    analysisInFlightRef.current = true;
    requestRef.current = controller;
    setView({ status: "processing" });
    try {
      const result = await requestLearningAnalysis({
        text: source.text,
        sourceStatus: source.sourceStatus,
        inputType: inputTypeFor(source),
        ...(source.kind !== "text" ? { sessionId: source.sessionId } : {}),
      }, controller.signal);
      requestRef.current = null;
      analysisInFlightRef.current = false;
      setView({ status: "ready", analysis: result.analysis, sessionId: result.sessionId, cached: result.cached });
      window.dispatchEvent(new CustomEvent("cantu:learning-session-saved", {
        detail: {
          id: result.sessionId,
          inputType: inputTypeFor(source),
          sourceStatus: "ready",
          sourceDurationMs: source.kind === "text" ? null : source.durationMs,
          sourceCharCount: source.kind === "text" ? source.text.length : null,
          createdAt: new Date().toISOString(),
        },
      }));
    } catch (error) {
      if (controller.signal.aborted) return;
      requestRef.current = null;
      analysisInFlightRef.current = false;
      setView({ status: "error", code: error instanceof AnalysisError ? error.code : "provider_unavailable" });
    }
  }

  if (view.status === "processing") {
    return (
      <section className={styles.processingPanel} aria-live="polite" aria-labelledby="analysis-processing-title">
        <span className={styles.processingPulse} aria-hidden="true" />
        <span className={styles.panelEyebrow}>Értem a mondatot…</span>
        <h2 id="analysis-processing-title">Kiemelem, amit érdemes megtanulni…</h2>
        <p>Az ellenőrzött szöveg átmenetileg a nyelvi elemzőhöz kerül. A teljes hangfájlt nem küldjük újra.</p>
        <button className={styles.secondaryAction} type="button" onClick={() => { requestRef.current?.abort(); requestRef.current = null; analysisInFlightRef.current = false; setView({ status: "idle" }); }}>Mégse</button>
      </section>
    );
  }

  if (view.status === "auth_required") {
    return (
      <section className={styles.processingPanel} aria-labelledby="analysis-auth-title">
        <span className={styles.panelEyebrow}>Védett elemzés</span>
        <h2 id="analysis-auth-title">Az elemzéshez jelentkezz be</h2>
        <p>A helyi forrásod megmaradt. Fizetős nyelvi elemzés csak hitelesített felhasználónak indul.</p>
        <div className={styles.confirmationActions}>
          <a className={styles.mainAction} href="#library-title">Bejelentkezem</a>
          <button className={styles.secondaryAction} type="button" onClick={() => setView({ status: "idle" })}>Vissza</button>
        </div>
      </section>
    );
  }

  if (view.status === "error") {
    return (
      <section className={styles.processingPanel} aria-labelledby="analysis-error-title">
        <span className={styles.panelEyebrow}>Az elemzés megakadt</span>
        <h2 id="analysis-error-title">A forrásod nem veszett el.</h2>
        <p className={styles.inlineError} role="alert">{errorCopy[view.code]}</p>
        <div className={styles.confirmationActions}>
          <button className={styles.mainAction} type="button" onClick={analyze}>Újrapróbálom</button>
          <button className={styles.secondaryAction} type="button" onClick={onStartOver}>Másik forrást hozok</button>
        </div>
      </section>
    );
  }

  if (view.status === "ready") {
    return (
      <section className={styles.learningPreview} aria-labelledby="learning-preview-title">
        <span className={styles.stepBadge}>3 / 3 · Első tanulási kép</span>
        <h2 id="learning-preview-title">Most már érthetőbb.</h2>
        <p className={styles.previewLead}>{view.cached ? "A saját munkameneted ellenőrzött eredményét mutatjuk." : "Az elemzés elkészült és privát tanulási eredményként elmentve."}</p>
        <ResultPreview analysis={view.analysis} />
        <button className={styles.mainAction} type="button" onClick={onStartOver}>Új forrást hozok</button>
      </section>
    );
  }

  return (
    <section className={styles.confirmationPanel} aria-labelledby="analysis-start-title">
      <span className={styles.stepBadge}>3 / 3 · Ellenőrzött forrás</span>
      <h2 id="analysis-start-title">Készen áll a megértésre.</h2>
      <blockquote className={styles.sourceText} lang="it">{source.text}</blockquote>
      <p className={styles.previewLead}>Az elemzés csak a gomb megnyomásakor indul. A forrásszöveget nem mentjük el alapértelmezetten.</p>
      <div className={styles.confirmationActions}>
        <button className={styles.mainAction} type="button" onClick={analyze}>Értsük meg</button>
        <button className={styles.secondaryAction} type="button" onClick={onStartOver}>Másik forrást hozok</button>
      </div>
    </section>
  );
}
