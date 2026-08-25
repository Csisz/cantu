"use client";

import { useEffect, useReducer } from "react";
import { MOCK_RECOGNITION_DELAY_MS, mockRecognitionCandidate } from "@/lib/recognition/mock";
import { createInitialRecognitionState, recognitionReducer } from "@/lib/recognition/reducer";
import type { EntryMode } from "@/lib/recognition/types";
import { CandidateCard } from "./CandidateCard";
import { ConfirmedState } from "./ConfirmedState";
import { IdentifyingState } from "./IdentifyingState";
import { ListenPanel } from "./ListenPanel";
import { ListeningState } from "./ListeningState";
import { ManualSearch } from "./ManualSearch";
import { RecoveryState } from "./RecoveryState";
import { UploadPanel } from "./UploadPanel";
import styles from "./app.module.css";

export function SongRecognitionFlow({ initialMode }: { initialMode: EntryMode }) {
  const [state, dispatch] = useReducer(
    recognitionReducer,
    initialMode,
    createInitialRecognitionState,
  );

  useEffect(() => {
    if (state.type !== "listening") return;
    const timer = window.setTimeout(
      () => dispatch({ type: "START_IDENTIFYING", source: "listen" }),
      MOCK_RECOGNITION_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state.type]);

  useEffect(() => {
    if (state.type !== "identifying") return;
    const source = state.source;
    const timer = window.setTimeout(
      () => dispatch({ type: "CANDIDATE_FOUND", source, candidate: mockRecognitionCandidate }),
      MOCK_RECOGNITION_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  const activeMode = state.type === "entry" ? state.mode : undefined;

  return (
    <div className={styles.flowCard}>
      <div className={styles.modeTabs} role="tablist" aria-label="Dal behozási mód">
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "listen"}
          className={activeMode === "listen" ? styles.activeTab : ""}
          onClick={() => dispatch({ type: "SELECT_MODE", mode: "listen" })}
        >
          <span aria-hidden="true">🎧</span> Hallgasd meg
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "upload"}
          className={activeMode === "upload" ? styles.activeTab : ""}
          onClick={() => dispatch({ type: "SELECT_MODE", mode: "upload" })}
        >
          <span aria-hidden="true">⬆️</span> Feltöltöm a dalt
        </button>
      </div>

      <div className={styles.statusRegion} aria-live="polite" aria-atomic="true">
        {state.type === "entry" && state.mode === "listen" ? (
          <ListenPanel
            onStart={() => dispatch({ type: "START_LISTENING" })}
            onManual={() => dispatch({ type: "OPEN_MANUAL_SEARCH" })}
            onNoMatch={() => dispatch({ type: "SHOW_NO_MATCH", source: "listen" })}
          />
        ) : null}
        {state.type === "entry" && state.mode === "upload" ? (
          <UploadPanel
            onIdentify={() => dispatch({ type: "START_IDENTIFYING", source: "upload" })}
            onManual={() => dispatch({ type: "OPEN_MANUAL_SEARCH" })}
          />
        ) : null}
        {state.type === "listening" ? (
          <ListeningState onCancel={() => dispatch({ type: "CANCEL" })} />
        ) : null}
        {state.type === "identifying" ? (
          <IdentifyingState onCancel={() => dispatch({ type: "CANCEL" })} />
        ) : null}
        {state.type === "candidate" ? (
          <CandidateCard
            candidate={state.candidate}
            onConfirm={() => dispatch({ type: "CONFIRM_CANDIDATE" })}
            onReject={() => dispatch({ type: "REJECT_CANDIDATE" })}
            onRetry={() => dispatch({ type: "RETRY_LISTEN" })}
            onManual={() => dispatch({ type: "OPEN_MANUAL_SEARCH" })}
          />
        ) : null}
        {state.type === "confirmed" ? (
          <ConfirmedState
            candidate={state.candidate}
            onAnother={() => dispatch({ type: "SELECT_MODE", mode: "listen" })}
          />
        ) : null}
        {state.type === "rejected" ? (
          <RecoveryState
            kind="rejected"
            onListen={() => dispatch({ type: "SELECT_MODE", mode: "listen" })}
            onUpload={() => dispatch({ type: "SELECT_MODE", mode: "upload" })}
            onManual={() => dispatch({ type: "OPEN_MANUAL_SEARCH" })}
          />
        ) : null}
        {state.type === "no-match" ? (
          <RecoveryState
            kind="no-match"
            onListen={() => dispatch({ type: "SELECT_MODE", mode: "listen" })}
            onUpload={() => dispatch({ type: "SELECT_MODE", mode: "upload" })}
            onManual={() => dispatch({ type: "OPEN_MANUAL_SEARCH" })}
          />
        ) : null}
        {state.type === "manual-search" ? (
          <ManualSearch
            onSubmit={(candidate) =>
              dispatch({ type: "CANDIDATE_FOUND", source: "manual", candidate })
            }
            onBack={() => dispatch({ type: "SELECT_MODE", mode: "listen" })}
          />
        ) : null}
      </div>
    </div>
  );
}
