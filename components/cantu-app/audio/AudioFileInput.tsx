"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  createAudioSelection,
  updateAudioSelection,
  type AudioSelection,
  type SelectionHandle,
} from "@/lib/input/audio-selection";
import type { AudioLearningSource } from "@/lib/input/types";
import { createWaveformPeaks } from "@/lib/input/waveform";
import { AudioPreviewControls } from "./AudioPreviewControls";
import { AudioRangeSelector } from "./AudioRangeSelector";
import { Waveform } from "./Waveform";
import styles from "../app.module.css";

const supportedExtensions = new Set(["mp3", "wav", "m4a"]);

function isSupportedAudioFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && supportedExtensions.has(extension));
}

type LoadedAudio = {
  file: File;
  objectUrl: string;
  durationMs: number;
  peaks: number[];
};

export function AudioFileInput({
  onContinue,
}: {
  onContinue: (source: AudioLearningSource) => void;
}) {
  const [loadedAudio, setLoadedAudio] = useState<LoadedAudio | null>(null);
  const [selection, setSelection] = useState<AudioSelection>({ startMs: 0, endMs: 0 });
  const [status, setStatus] = useState<"empty" | "decoding" | "ready" | "error">("empty");
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const decodeSequence = useRef(0);

  useEffect(() => {
    const objectUrl = loadedAudio?.objectUrl;
    const audio = audioRef.current;
    return () => {
      if (audio && !audio.paused) audio.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loadedAudio?.objectUrl]);

  useEffect(() => {
    return () => {
      decodeSequence.current += 1;
    };
  }, []);

  function stopPlayback(reset = true) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (reset) audio.currentTime = selection.startMs / 1_000;
    setIsPlaying(false);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    stopPlayback(false);
    const sequence = decodeSequence.current + 1;
    decodeSequence.current = sequence;
    setError("");

    if (!isSupportedAudioFile(file)) {
      setLoadedAudio(null);
      setSelection({ startMs: 0, endMs: 0 });
      setStatus("error");
      setError("Ezt a fájltípust most nem tudjuk megnyitni. Válassz MP3, WAV vagy M4A fájlt.");
      return;
    }

    setStatus("decoding");
    const objectUrl = URL.createObjectURL(file);
    let audioContext: AudioContext | null = null;

    try {
      const bytes = await file.arrayBuffer();
      // The decoded buffer is used only for visual peaks; a low sample rate keeps
      // waveform generation light while the original object URL powers playback.
      audioContext = new AudioContext({ sampleRate: 8_000 });
      const buffer = await audioContext.decodeAudioData(bytes.slice(0));
      if (sequence !== decodeSequence.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      const durationMs = Math.round(buffer.duration * 1_000);
      if (durationMs <= 0) throw new Error("empty audio");
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
        buffer.getChannelData(index),
      );
      const peaks = createWaveformPeaks(channels);
      setLoadedAudio({ file, objectUrl, durationMs, peaks });
      setSelection(createAudioSelection(durationMs));
      setStatus("ready");
    } catch {
      URL.revokeObjectURL(objectUrl);
      if (sequence !== decodeSequence.current) return;
      setLoadedAudio(null);
      setSelection({ startMs: 0, endMs: 0 });
      setStatus("error");
      setError("A böngésző nem tudta dekódolni ezt a hangfájlt. Próbálj másik támogatott fájlt.");
    } finally {
      await audioContext?.close();
    }
  }

  function changeSelection(handle: SelectionHandle, requestedMs: number) {
    if (!loadedAudio) return;
    stopPlayback(false);
    setSelection((current) =>
      updateAudioSelection(current, loadedAudio.durationMs, handle, requestedMs),
    );
  }

  async function playSelection() {
    const audio = audioRef.current;
    if (!audio || !loadedAudio) return;
    if (audio.currentTime < selection.startMs / 1_000 || audio.currentTime >= selection.endMs / 1_000) {
      audio.currentTime = selection.startMs / 1_000;
    }
    try {
      await audio.play();
      setIsPlaying(true);
      setError("");
    } catch {
      setIsPlaying(false);
      setError("A kijelölt részlet lejátszása nem indult el. Próbáld újra.");
    }
  }

  async function replaySelection() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = selection.startMs / 1_000;
    await playSelection();
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime >= selection.endMs / 1_000) stopPlayback();
  }

  return (
    <section
      id="input-panel-audio"
      className={`${styles.entryPanel} ${styles.audioPanel}`}
      role="tabpanel"
      aria-labelledby="input-mode-audio audio-panel-title"
    >
      <span className={styles.panelEyebrow}>Helyi részletkijelölés</span>
      <h2 id="audio-panel-title">Válaszd ki pontosan, mit szeretnél érteni</h2>
      <p className={styles.panelCopy}>
        Nyiss meg egy hangfájlt, majd jelölj ki belőle legfeljebb 30 másodpercet.
      </p>

      <div className={styles.filePicker}>
        <label className={styles.fileButton} htmlFor="audio-source-file">
          <span aria-hidden="true">＋</span> Hangfájl kiválasztása
        </label>
        <input
          id="audio-source-file"
          className="srOnly"
          type="file"
          aria-label="Hangfájl kiválasztása"
          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac"
          onChange={chooseFile}
        />
        <p>MP3, WAV vagy böngészőben támogatott M4A</p>
      </div>

      <div className={styles.audioStatus} aria-live="polite">
        {status === "decoding" ? <p>Helyi hullámforma készül…</p> : null}
        {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
      </div>

      {loadedAudio && status === "ready" ? (
        <div className={styles.audioWorkspace}>
          <div className={styles.fileMeta}>
            <span aria-hidden="true">♪</span>
            <div><strong>{loadedAudio.file.name}</strong><small>{(loadedAudio.file.size / 1_048_576).toFixed(2)} MB · helyben megnyitva</small></div>
          </div>
          <Waveform
            peaks={loadedAudio.peaks}
            durationMs={loadedAudio.durationMs}
            selection={selection}
            onChange={changeSelection}
          />
          <AudioRangeSelector
            durationMs={loadedAudio.durationMs}
            selection={selection}
            onChange={changeSelection}
          />
          <audio
            ref={audioRef}
            src={loadedAudio.objectUrl}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          <AudioPreviewControls
            isPlaying={isPlaying}
            onPlay={playSelection}
            onPause={() => stopPlayback(false)}
            onStop={() => stopPlayback()}
            onReplay={replaySelection}
          />
          <button
            className={styles.mainAction}
            type="button"
            onClick={() =>
              onContinue({
                kind: "audio",
                fileName: loadedAudio.file.name,
                fileType: loadedAudio.file.type || "audio/unknown",
                durationMs: loadedAudio.durationMs,
                startMs: selection.startMs,
                endMs: selection.endMs,
              })
            }
          >
            Ezt a részt értsük meg
          </button>
        </div>
      ) : null}

      <div className={styles.privacyCard}>
        <strong>A teljes fájl a készülékeden marad.</strong>
        <p>Ebben a mérföldkőben a kijelölt részlet sem kerül elküldésre. Később is csak ezt a rövid kijelölést dolgozza majd fel a Cantu.</p>
        <small>Csak olyan tartalmat használj, amelyet jogosult vagy feldolgozni.</small>
      </div>
    </section>
  );
}
