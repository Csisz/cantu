"use client";

import { useEffect, useRef, useState } from "react";
import { requestLearningAnalysis } from "@/lib/analysis/client";
import type { LearningAnalysis } from "@/lib/analysis/schema";
import type { LearningSource } from "@/lib/input/types";
import { AnalysisError, type AnalysisErrorCode } from "@/lib/providers/analysis/types";
import { LearningPlayer } from "./learning/LearningPlayer";
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

function DegradedResult({ analysis, onStartOver }: { analysis: LearningAnalysis; onStartOver: () => void }) {
  const notItalian = analysis.analysisStatus === "not_italian";
  return (
    <section className={styles.analysisMessage} aria-labelledby="degraded-analysis-title">
      <span className={styles.stepBadge}>{notItalian ? "Nyelvi ellenőrzés" : "Rövid forrás"}</span>
      <h2 id="degraded-analysis-title">
        {notItalian ? "Ez valószínűleg nem olasz." : "Egy kicsit hosszabb mondatból többet tanulhatunk."}
      </h2>
      <p>{analysis.languageAssessment.noteHu ?? (notItalian
        ? "A Cantu első verziója olaszhoz készült."
        : "Próbálj meg egy teljes rövid olasz mondatot hozni.")}</p>
      <button className={styles.mainAction} type="button" onClick={onStartOver}>Másik forrást hozok</button>
    </section>
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
        <button className={styles.secondaryAction} type="button" onClick={() => {
          requestRef.current?.abort();
          requestRef.current = null;
          analysisInFlightRef.current = false;
          setView({ status: "idle" });
        }}>Mégse</button>
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
    return view.analysis.analysisStatus === "ready" ? (
      <LearningPlayer
        sessionId={view.sessionId}
        analysis={view.analysis}
        localPlaybackUrl={source.kind === "text" ? undefined : source.localPlaybackUrl}
        onStartOver={onStartOver}
      />
    ) : <DegradedResult analysis={view.analysis} onStartOver={onStartOver} />;
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
