"use client";

import { useEffect, useRef, useState } from "react";
import { formatAudioTime } from "@/lib/input/audio-selection";
import type { MicrophoneErrorCode } from "@/lib/input/media-recorder";
import { useTransientMediaRecorder } from "@/lib/input/use-transient-media-recorder";
import { requestPronunciationFeedback } from "@/lib/pronunciation/client";
import { MAX_SHADOWING_RECORDING_MS } from "@/lib/pronunciation/limits";
import {
  PronunciationFeedbackError,
  type PronunciationFeedback,
  type PronunciationFeedbackErrorCode,
} from "@/lib/pronunciation/types";
import styles from "../app.module.css";

type FeedbackView =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "auth_required" }
  | { status: "ready"; feedback: PronunciationFeedback }
  | { status: "error"; code: PronunciationFeedbackErrorCode };

const captureErrorCopy: Record<MicrophoneErrorCode, string> = {
  permission_denied: "A mikrofonengedélyt nem kaptuk meg. A gyakorlást most kihagyhatod, vagy az engedély módosítása után újrapróbálhatod.",
  no_device: "Nem találunk használható mikrofont ezen az eszközön.",
  unsupported: "Ez a böngésző nem támogatja a rövid gyakorlófelvételt.",
  interrupted: "A felvétel megszakadt. Ellenőrizd a mikrofont, majd próbáld újra.",
  empty_recording: "Nem érkezett hangadat. Beszélj közelebb a mikrofonhoz, majd próbáld újra.",
  capture_failed: "A felvétel most nem sikerült. A leckét ettől még folytathatod.",
};

const feedbackErrorCopy: Record<PronunciationFeedbackErrorCode, string> = {
  unauthenticated: "A szolgáltatói visszajelzéshez jelentkezz be. A saját felvételed addig is helyben visszahallgatható.",
  invalid_recording: "A rövid felvételt most nem tudtam feldolgozni. Vedd fel újra.",
  unsupported_format: "Ezt a böngésző által készített hangformátumot most nem tudjuk feldolgozni.",
  too_large: "A gyakorlófelvétel túl nagy. Készíts rövidebb próbát.",
  too_long: "A gyakorlófelvétel legfeljebb 12 másodperces lehet.",
  session_not_found: "Ez a privát tanulási munkamenet most nem érhető el.",
  feedback_rate_limited: "Most elérted a rövid idejű gyakorlási korlátot. Hallgasd vissza helyben, és próbáld később.",
  feedback_not_configured: "A kiejtési visszajelzés nincs beállítva ezen a környezeten.",
  feedback_timeout: "A visszajelzés túl sokáig tartott. A helyi felvételed megmaradt; próbáld újra.",
  feedback_failed: "A visszajelzés most nem sikerült. A helyi felvételed megmaradt; újrapróbálhatod.",
  no_speech_detected: "Most nem hallottam egyértelmű beszédet. Próbáld újra közelebb a mikrofonhoz.",
};

export function ShadowingPractice({
  sessionId,
  chunkIndex,
  authenticated,
  onNext,
}: {
  sessionId: string;
  chunkIndex: number;
  authenticated: boolean;
  onNext: () => void;
}) {
  const recorder = useTransientMediaRecorder(MAX_SHADOWING_RECORDING_MS);
  const [view, setView] = useState<FeedbackView>({ status: "idle" });
  const requestRef = useRef<AbortController | null>(null);
  const requestInFlightRef = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const recordButtonRef = useRef<HTMLButtonElement>(null);
  const focusRecordAfterRetryRef = useRef(false);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (["ready", "error", "auth_required"].includes(view.status)) resultHeadingRef.current?.focus();
  }, [view.status]);
  useEffect(() => {
    if (view.status === "idle" && recorder.status === "idle" && focusRecordAfterRetryRef.current) {
      focusRecordAfterRetryRef.current = false;
      recordButtonRef.current?.focus();
    }
  }, [recorder.status, view.status]);

  async function requestFeedback() {
    if (!recorder.recording || requestInFlightRef.current) return;
    if (!authenticated) {
      setView({ status: "auth_required" });
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    requestInFlightRef.current = true;
    setView({ status: "processing" });
    try {
      const feedback = await requestPronunciationFeedback({
        recording: recorder.recording.blob,
        durationMs: recorder.recording.durationMs,
        sessionId,
        chunkIndex,
      }, controller.signal);
      requestRef.current = null;
      requestInFlightRef.current = false;
      setView({ status: "ready", feedback });
    } catch (error) {
      if (controller.signal.aborted) return;
      requestRef.current = null;
      requestInFlightRef.current = false;
      setView({
        status: "error",
        code: error instanceof PronunciationFeedbackError ? error.code : "feedback_failed",
      });
    }
  }

  function retryRecording() {
    requestRef.current?.abort();
    requestRef.current = null;
    requestInFlightRef.current = false;
    setView({ status: "idle" });
    focusRecordAfterRetryRef.current = true;
    recorder.reset();
  }

  if (view.status === "ready") {
    return (
      <div className={styles.shadowingResult} aria-live="polite">
        <h3 ref={resultHeadingRef} tabIndex={-1}>Ezt értettem:</h3>
        <blockquote lang="it">{view.feedback.understoodText ?? "—"}</blockquote>
        <ul className={styles.shadowingObservations}>
          {view.feedback.observations.map((observation) => (
            <li key={`${observation.code}-${observation.messageHu}`}>{observation.messageHu}</li>
          ))}
        </ul>
        <p className={styles.shadowingTiming}>A felvételed hossza: {formatAudioTime(view.feedback.timing.learnerDurationMs)}</p>
        <p className={styles.shadowingCaution}>Ez szófelismerési összehasonlítás, nem akcentus- vagy fonémapontszám.</p>
        <button className={styles.lessonPrimary} type="button" onClick={onNext}>Tovább</button>
        <button className={styles.lessonSecondaryButton} type="button" onClick={retryRecording}>Újra megpróbálom</button>
      </div>
    );
  }

  if (view.status === "processing") {
    return (
      <div className={styles.shadowingStatus} aria-live="polite">
        <strong>Figyelek a szavakra…</strong>
        <p>A rövid gyakorlófelvétel átmenetileg az STT-szolgáltatóhoz kerül. Nem mentjük el.</p>
        <button className={styles.lessonSecondaryButton} type="button" onClick={() => {
          requestRef.current?.abort();
          requestRef.current = null;
          requestInFlightRef.current = false;
          setView({ status: "idle" });
        }}>Mégse</button>
      </div>
    );
  }

  if (view.status === "auth_required" || view.status === "error") {
    const message = view.status === "auth_required"
      ? feedbackErrorCopy.unauthenticated
      : feedbackErrorCopy[view.code];
    return (
      <div className={styles.shadowingStatus}>
        <h3 ref={resultHeadingRef} tabIndex={-1}>{view.status === "auth_required" ? "A visszajelzéshez jelentkezz be" : "A visszajelzés megakadt"}</h3>
        <p role="alert">{message}</p>
        {recorder.recording ? <audio controls src={recorder.recording.previewUrl} aria-label="Saját gyakorlófelvételem visszahallgatása" /> : null}
        {view.status === "auth_required" ? <a className={styles.lessonSecondaryLink} href="/app?auth=required#library-title">Bejelentkezem</a> : (
          <button className={styles.lessonPrimary} type="button" onClick={() => void requestFeedback()}>Újrapróbálom a visszajelzést</button>
        )}
        <button className={styles.lessonSecondaryButton} type="button" onClick={retryRecording}>Újra felveszem</button>
        <button className={styles.lessonSkipButton} type="button" onClick={onNext}>Most kihagyom</button>
      </div>
    );
  }

  return (
    <div className={styles.shadowingPractice}>
      <p className={styles.shadowingPrivacy}>A gyakorlófelvétel rövid és átmeneti. Csak külön kérésedre küldjük szófelismerési visszajelzésre.</p>
      <div className={styles.shadowingLive} aria-live="polite">
        {recorder.status === "requesting" ? <p>Engedélyt kérek a mikrofonhoz…</p> : null}
        {recorder.status === "recording" ? (
          <p><strong><span aria-hidden="true">●</span> Felvétel</strong><span>{formatAudioTime(recorder.elapsedMs)} / 00:12.0</span></p>
        ) : null}
        {recorder.status === "recorded" ? <p><strong>A saját felvételed elkészült.</strong><span>{formatAudioTime(recorder.recording?.durationMs ?? 0)}</span></p> : null}
        {recorder.error ? <p className={styles.inlineError} role="alert">{captureErrorCopy[recorder.error]}</p> : null}
      </div>

      {recorder.status === "idle" ? (
        <button ref={recordButtonRef} className={styles.lessonPrimary} type="button" onClick={() => void recorder.start()}>Felveszem</button>
      ) : null}
      {recorder.status === "requesting" ? <button className={styles.lessonSecondaryButton} type="button" onClick={recorder.cancel}>Mégse</button> : null}
      {recorder.status === "recording" ? (
        <div className={styles.shadowingActions}>
          <button className={styles.lessonPrimary} type="button" onClick={recorder.stop}>Leállítom</button>
          <button className={styles.lessonSecondaryButton} type="button" onClick={recorder.cancel}>Mégse</button>
        </div>
      ) : null}
      {recorder.status === "recorded" && recorder.recording ? (
        <div className={styles.shadowingRecorded}>
          <span>Hallgasd vissza</span>
          <audio controls src={recorder.recording.previewUrl} aria-label="Saját gyakorlófelvételem visszahallgatása" />
          <button className={styles.lessonPrimary} type="button" onClick={() => void requestFeedback()}>Nézzük meg</button>
          <button className={styles.lessonSecondaryButton} type="button" onClick={retryRecording}>Újra felveszem</button>
        </div>
      ) : null}
      {recorder.status === "error" ? (
        <button className={styles.lessonSecondaryButton} type="button" onClick={() => void recorder.start()}>Újra próbálom</button>
      ) : null}
      {recorder.status !== "recording" && recorder.status !== "requesting" ? (
        <button className={styles.lessonSkipButton} type="button" onClick={onNext}>Most kihagyom</button>
      ) : null}
    </div>
  );
}
