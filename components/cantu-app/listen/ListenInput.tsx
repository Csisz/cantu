"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioClipInput } from "@/lib/input/audio-clip";
import { formatAudioTime, MAX_AUDIO_SELECTION_MS } from "@/lib/input/audio-selection";
import {
  chooseMediaRecorderMimeType,
  microphoneErrorCode,
  type MicrophoneErrorCode,
} from "@/lib/input/media-recorder";
import type { InputMode } from "@/lib/input/types";
import styles from "../app.module.css";

type CaptureStatus = "idle" | "requesting" | "recording" | "recorded" | "error";

const errorCopy: Record<MicrophoneErrorCode, string> = {
  permission_denied: "A mikrofonengedélyt nem kaptuk meg. Engedélyezd a böngészőben, majd próbáld újra.",
  no_device: "Nem találunk használható mikrofont ezen az eszközön.",
  unsupported: "Ez a böngésző nem támogatja a rövid hangfelvételt.",
  interrupted: "A felvétel megszakadt. Ellenőrizd a mikrofont, majd próbáld újra.",
  empty_recording: "Nem érkezett hangadat. Próbáld újra, és beszélj közelebb a mikrofonhoz.",
  capture_failed: "A felvétel most nem sikerült. Próbáld újra, vagy válassz másik bemenetet.",
};

export function ListenInput({
  onTranscribe,
  onSelectMode,
}: {
  onTranscribe: (clip: AudioClipInput) => void;
  onSelectMode: (mode: InputMode) => void;
}) {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordedClip, setRecordedClip] = useState<AudioClipInput | null>(null);
  const [error, setError] = useState<MicrophoneErrorCode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);
  const cancelledRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    intervalRef.current = null;
    maxTimerRef.current = null;
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    durationRef.current = Math.min(MAX_AUDIO_SELECTION_MS, Math.max(1, Date.now() - startedAtRef.current));
    setElapsedMs(durationRef.current);
    clearTimers();
    recorder.stop();
  }, [clearTimers]);

  useEffect(() => () => {
    cancelledRef.current = true;
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopTracks();
  }, [clearTimers, stopTracks]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function failCapture(code: MicrophoneErrorCode) {
    cancelledRef.current = true;
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopTracks();
    recorderRef.current = null;
    setError(code);
    setStatus("error");
  }

  async function startRecording() {
    setError(null);
    setRecordedClip(null);
    setElapsedMs(0);
    cancelledRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      failCapture("unsupported");
      return;
    }

    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = chooseMediaRecorderMimeType(MediaRecorder);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("error", () => failCapture("interrupted"));
      recorder.addEventListener("stop", () => {
        clearTimers();
        stopTracks();
        recorderRef.current = null;
        if (cancelledRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || chunksRef.current[0]?.type });
        if (blob.size === 0) {
          failCapture("empty_recording");
          return;
        }
        const clip: AudioClipInput = {
          blob,
          mimeType: blob.type || "audio/webm",
          durationMs: durationRef.current,
          sourceType: "microphone",
        };
        setRecordedClip(clip);
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus("recorded");
      });

      stream.getTracks().forEach((track) => track.addEventListener("ended", () => {
        if (recorder.state === "recording") failCapture("interrupted");
      }, { once: true }));

      recorder.start(250);
      startedAtRef.current = Date.now();
      durationRef.current = 0;
      setStatus("recording");
      intervalRef.current = setInterval(() => {
        setElapsedMs(Math.min(MAX_AUDIO_SELECTION_MS, Date.now() - startedAtRef.current));
      }, 100);
      maxTimerRef.current = setTimeout(stopRecording, MAX_AUDIO_SELECTION_MS);
    } catch (captureError) {
      failCapture(microphoneErrorCode(captureError));
    }
  }

  function cancelRecording() {
    cancelledRef.current = true;
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stopTracks();
    recorderRef.current = null;
    chunksRef.current = [];
    setElapsedMs(0);
    setStatus("idle");
  }

  function retry() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedClip(null);
    setElapsedMs(0);
    setError(null);
    setStatus("idle");
  }

  return (
    <section id="input-panel-listen" className={styles.entryPanel} role="tabpanel" aria-labelledby="input-mode-listen listen-panel-title">
      <div className={`${styles.listenVisual} ${status === "recording" ? styles.isRecording : ""}`} aria-hidden="true">
        <span className={styles.listenRing} /><span className={styles.listenRing} />
        <Image src="/robot.png" alt="" fill sizes="180px" loading="eager" fetchPriority="high" />
      </div>
      <span className={styles.panelEyebrow}>Rövid, tudatos felvétel</span>
      <h2 id="listen-panel-title">Vegyél fel egy rövid olasz részletet</h2>
      <p className={styles.panelCopy}>Legfeljebb 30 másodperc. A mikrofon csak a gombnyomásod és a böngésző engedélye után indul.</p>

      <div className={styles.captureStatus} aria-live="polite">
        {status === "requesting" ? <p>Engedélyt kérek a mikrofonhoz…</p> : null}
        {status === "recording" ? <p><strong>Felvétel folyamatban</strong><span>{formatAudioTime(elapsedMs)} / 00:30.0</span></p> : null}
        {status === "recorded" ? <p><strong>A rövid felvétel elkészült.</strong><span>{formatAudioTime(elapsedMs)}</span></p> : null}
        {error ? <p className={styles.inlineError} role="alert">{errorCopy[error]}</p> : null}
      </div>

      {status === "idle" || status === "error" ? (
        <button className={styles.mainAction} type="button" onClick={startRecording}><span aria-hidden="true">🎙️</span> Felvétel indítása</button>
      ) : null}
      {status === "recording" ? (
        <div className={styles.captureActions}>
          <button className={styles.mainAction} type="button" onClick={stopRecording}>Felvétel leállítása</button>
          <button className={styles.secondaryAction} type="button" onClick={cancelRecording}>Mégse</button>
        </div>
      ) : null}
      {status === "recorded" && recordedClip ? (
        <div className={styles.captureActions}>
          {previewUrl ? <audio controls src={previewUrl} aria-label="A rögzített rövid részlet előnézete" /> : null}
          <button className={styles.mainAction} type="button" onClick={() => onTranscribe(recordedClip)}>Felvétel átírása</button>
          <button className={styles.secondaryAction} type="button" onClick={retry}>Újra felveszem</button>
        </div>
      ) : null}
      {status === "error" ? (
        <div className={styles.recoveryActions}>
          <button className={styles.secondaryAction} type="button" onClick={() => onSelectMode("audio")}>Hangfájlt választok</button>
          <button className={styles.secondaryAction} type="button" onClick={() => onSelectMode("text")}>Szöveget írok</button>
        </div>
      ) : null}

      <div className={styles.guidance}>
        <p><b>Te irányítasz:</b> a felvétel nem indul el automatikusan, és leállíthatod vagy elvetheted.</p>
        <p><b>Átmeneti feldolgozás:</b> csak ezt a rövid felvételt küldjük átírásra; hangot nem mentünk el.</p>
      </div>
    </section>
  );
}
