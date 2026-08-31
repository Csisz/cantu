"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { AudioClipInput } from "@/lib/input/audio-clip";
import { createInitialInputStudioState, inputStudioReducer } from "@/lib/input/studio-reducer";
import type { InputMode } from "@/lib/input/types";
import { TranscriptionError, type TranscriptResult, type TranscriptionErrorCode } from "@/lib/providers/speech/types";
import { transcribeAudioClip, verifyTranscript } from "@/lib/transcription/client";
import { AudioFileInput } from "./audio/AudioFileInput";
import { InputModeTabs } from "./InputModeTabs";
import { LearningPreview } from "./LearningPreview";
import { ListenInput } from "./listen/ListenInput";
import { SourceConfirmation } from "./SourceConfirmation";
import { TextInput } from "./text/TextInput";
import { TranscriptConfirmation } from "./TranscriptConfirmation";
import styles from "./app.module.css";

type TranscriptionView =
  | { status: "idle" }
  | { status: "auth_required"; clip: AudioClipInput }
  | { status: "processing"; clip: AudioClipInput }
  | { status: "candidate"; clip: AudioClipInput; sessionId: string; transcript: TranscriptResult }
  | { status: "error"; clip: AudioClipInput; code: TranscriptionErrorCode };

const transcriptionErrorCopy: Record<TranscriptionErrorCode, string> = {
  invalid_audio: "A rövid hangrészlet nem olvasható. Készíts vagy jelölj ki egy másikat.",
  too_large: "A rövid hangrészlet túl nagy a feldolgozáshoz. Válassz rövidebb részletet.",
  too_long: "A részlet legfeljebb 30 másodperces lehet.",
  unsupported_format: "Ezt a hangformátumot most nem tudjuk feldolgozni.",
  transcription_failed: "Az átírás most nem sikerült. Próbáld újra.",
  provider_unavailable: "Az átíró szolgáltatás átmenetileg nem elérhető. Próbáld később.",
  rate_limited: "Most elérted a rövid idejű átírási korlátot. Próbáld később.",
  not_configured: "Az átírás nincs beállítva ezen a környezeten.",
  unauthenticated: "Az átíráshoz jelentkezz be.",
};

export function InputStudio({
  initialMode,
  authenticated,
}: {
  initialMode: InputMode;
  authenticated: boolean;
}) {
  const [state, dispatch] = useReducer(inputStudioReducer, initialMode, createInitialInputStudioState);
  const [transcription, setTranscription] = useState<TranscriptionView>({ status: "idle" });
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const requestRef = useRef<{ controller: AbortController; sequence: number } | null>(null);
  const requestSequence = useRef(0);
  const localPlaybackUrlRef = useRef<string | null>(null);

  function clearLocalPlayback() {
    if (localPlaybackUrlRef.current) URL.revokeObjectURL(localPlaybackUrlRef.current);
    localPlaybackUrlRef.current = null;
  }

  useEffect(() => () => clearLocalPlayback(), []);

  function cancelRequest() {
    requestSequence.current += 1;
    requestRef.current?.controller.abort();
    requestRef.current = null;
  }

  function selectMode(mode: InputMode) {
    cancelRequest();
    clearLocalPlayback();
    setTranscription({ status: "idle" });
    setVerifyError("");
    dispatch({ type: "SELECT_MODE", mode });
    window.history.replaceState(null, "", `/app?mode=${mode}`);
  }

  async function processClip(clip: AudioClipInput) {
    if (!authenticated) {
      setTranscription({ status: "auth_required", clip });
      return;
    }

    cancelRequest();
    const controller = new AbortController();
    const sequence = requestSequence.current;
    requestRef.current = { controller, sequence };
    setTranscription({ status: "processing", clip });
    setVerifyError("");

    try {
      const candidate = await transcribeAudioClip(clip, controller.signal);
      if (requestSequence.current !== sequence) return;
      requestRef.current = null;
      setTranscription({ status: "candidate", clip, ...candidate });
    } catch (error) {
      if (controller.signal.aborted || requestSequence.current !== sequence) return;
      requestRef.current = null;
      const code = error instanceof TranscriptionError ? error.code : "transcription_failed";
      setTranscription({ status: "error", clip, code });
    }
  }

  async function confirmTranscript(text: string, sourceStatus: "user_verified" | "user_edited") {
    if (transcription.status !== "candidate" || verifyBusy) return;
    setVerifyBusy(true);
    setVerifyError("");
    try {
      await verifyTranscript(transcription.sessionId, sourceStatus);
      clearLocalPlayback();
      const localPlaybackUrl = URL.createObjectURL(transcription.clip.blob);
      localPlaybackUrlRef.current = localPlaybackUrl;
      dispatch({
        type: "COMPLETE_TRANSCRIPT",
        source: {
          kind: transcription.clip.sourceType === "audio_file" ? "audio" : "listen",
          text,
          sourceStatus,
          sessionId: transcription.sessionId,
          durationMs: transcription.clip.durationMs,
          localPlaybackUrl,
        },
      });
      window.dispatchEvent(new CustomEvent("cantu:learning-session-saved", {
        detail: {
          id: transcription.sessionId,
          inputType: transcription.clip.sourceType,
          sourceStatus,
          sourceDurationMs: transcription.clip.durationMs,
          createdAt: new Date().toISOString(),
        },
      }));
      setTranscription({ status: "idle" });
    } catch {
      setVerifyError("Az ellenőrzést most nem sikerült rögzíteni. A szöveged megmaradt; próbáld újra.");
    } finally {
      setVerifyBusy(false);
    }
  }

  function renderEntryPanel(mode: InputMode) {
    if (transcription.status === "processing") {
      return (
        <section className={styles.processingPanel} aria-live="polite" aria-labelledby="processing-title">
          <span className={styles.processingPulse} aria-hidden="true" />
          <span className={styles.panelEyebrow}>Figyelek…</span>
          <h2 id="processing-title">Leírom, amit hallok…</h2>
          <p>Csak a rövid részlet van átmeneti feldolgozás alatt. Nem készül automatikus lecke.</p>
          <button className={styles.secondaryAction} type="button" onClick={() => { cancelRequest(); setTranscription({ status: "idle" }); }}>Mégse</button>
        </section>
      );
    }

    if (transcription.status === "auth_required") {
      return (
        <section className={styles.processingPanel} aria-labelledby="auth-required-title">
          <span className={styles.panelEyebrow}>Védett feldolgozás</span>
          <h2 id="auth-required-title">Az átíráshoz jelentkezz be</h2>
          <p>A helyi kijelölés és felvétel fiók nélkül is használható. A fizetős STT-hívás csak hitelesített felhasználónak indul.</p>
          <div className={styles.confirmationActions}>
            <a className={styles.mainAction} href="#library-title">Bejelentkezem</a>
            <button className={styles.secondaryAction} type="button" onClick={() => setTranscription({ status: "idle" })}>Vissza a forráshoz</button>
          </div>
        </section>
      );
    }

    if (transcription.status === "error") {
      return (
        <section className={styles.processingPanel} aria-labelledby="transcription-error-title">
          <span className={styles.panelEyebrow}>Az átírás megakadt</span>
          <h2 id="transcription-error-title">Próbáljuk meg újra?</h2>
          <p className={styles.inlineError} role="alert">{transcriptionErrorCopy[transcription.code]}</p>
          <div className={styles.confirmationActions}>
            <button className={styles.mainAction} type="button" onClick={() => processClip(transcription.clip)}>Újrapróbálom</button>
            <button className={styles.secondaryAction} type="button" onClick={() => setTranscription({ status: "idle" })}>Másik részletet választok</button>
          </div>
        </section>
      );
    }

    if (transcription.status === "candidate") {
      return (
        <TranscriptConfirmation
          transcript={transcription.transcript}
          busy={verifyBusy}
          error={verifyError}
          onConfirm={confirmTranscript}
          onRetry={() => setTranscription({ status: "idle" })}
        />
      );
    }

    if (mode === "listen") return <ListenInput onTranscribe={processClip} onSelectMode={selectMode} />;
    if (mode === "audio") return <AudioFileInput onTranscribe={processClip} />;
    return <TextInput initialText={state.status === "entry" ? state.draftText : undefined} onContinue={(text) => dispatch({ type: "SUBMIT_TEXT", text })} />;
  }

  return (
    <div className={styles.flowCard}>
      {state.status === "entry" ? (
        <>
          <InputModeTabs activeMode={state.mode} onSelect={selectMode} />
          <div className={styles.statusRegion} aria-live="polite">{renderEntryPanel(state.mode)}</div>
        </>
      ) : null}

      {state.status === "source_confirmation" ? (
        <SourceConfirmation source={state.source} onConfirm={() => dispatch({ type: "CONFIRM_SOURCE" })} onEdit={() => dispatch({ type: "EDIT_SOURCE" })} />
      ) : null}

      {state.status === "analysis_ready" ? (
        <LearningPreview
          source={state.source}
          onStartOver={() => { clearLocalPlayback(); setTranscription({ status: "idle" }); dispatch({ type: "START_OVER" }); }}
          authenticated={authenticated}
        />
      ) : null}
    </div>
  );
}
