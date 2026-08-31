"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  chooseMediaRecorderMimeType,
  microphoneErrorCode,
  type MicrophoneErrorCode,
} from "./media-recorder";

export type TransientRecording = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  previewUrl: string;
};

export type TransientRecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error";

export function useTransientMediaRecorder(maxDurationMs: number) {
  const [status, setStatus] = useState<TransientRecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recording, setRecording] = useState<TransientRecording | null>(null);
  const [error, setError] = useState<MicrophoneErrorCode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);
  const cancelledRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const captureSequenceRef = useRef(0);

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

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setRecording(null);
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    durationRef.current = Math.min(maxDurationMs, Math.max(1, Date.now() - startedAtRef.current));
    setElapsedMs(durationRef.current);
    clearTimers();
    recorder.stop();
  }, [clearTimers, maxDurationMs]);

  const fail = useCallback((code: MicrophoneErrorCode) => {
    cancelledRef.current = true;
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
    stopTracks();
    setError(code);
    setStatus("error");
  }, [clearTimers, stopTracks]);

  const reset = useCallback(() => {
    captureSequenceRef.current += 1;
    cancelledRef.current = true;
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
    stopTracks();
    chunksRef.current = [];
    clearPreview();
    setElapsedMs(0);
    setError(null);
    setStatus("idle");
  }, [clearPreview, clearTimers, stopTracks]);

  const start = useCallback(async () => {
    reset();
    cancelledRef.current = false;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      fail("unsupported");
      return;
    }

    setStatus("requesting");
    const captureSequence = captureSequenceRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelledRef.current || captureSequenceRef.current !== captureSequence) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = chooseMediaRecorderMimeType(MediaRecorder);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("error", () => fail("interrupted"));
      recorder.addEventListener("stop", () => {
        clearTimers();
        stopTracks();
        recorderRef.current = null;
        if (cancelledRef.current || captureSequenceRef.current !== captureSequence) return;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || chunksRef.current[0]?.type || "audio/webm",
        });
        if (blob.size === 0) {
          fail("empty_recording");
          return;
        }
        const previewUrl = URL.createObjectURL(blob);
        previewUrlRef.current = previewUrl;
        setRecording({
          blob,
          mimeType: blob.type || "audio/webm",
          durationMs: durationRef.current,
          previewUrl,
        });
        setStatus("recorded");
      });
      stream.getTracks().forEach((track) => track.addEventListener("ended", () => {
        if (recorder.state === "recording") fail("interrupted");
      }, { once: true }));

      recorder.start(250);
      startedAtRef.current = Date.now();
      durationRef.current = 0;
      setStatus("recording");
      intervalRef.current = setInterval(() => {
        setElapsedMs(Math.min(maxDurationMs, Date.now() - startedAtRef.current));
      }, 100);
      maxTimerRef.current = setTimeout(stop, maxDurationMs);
    } catch (captureError) {
      fail(microphoneErrorCode(captureError));
    }
  }, [clearTimers, fail, maxDurationMs, reset, stop, stopTracks]);

  const cancel = useCallback(() => reset(), [reset]);

  useEffect(() => () => {
    cancelledRef.current = true;
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
    stopTracks();
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, [clearTimers, stopTracks]);

  return { status, elapsedMs, recording, error, start, stop, cancel, reset };
}
