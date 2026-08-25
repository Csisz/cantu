"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import styles from "./app.module.css";

type UploadPanelProps = {
  onIdentify: () => void;
  onManual: () => void;
};

const supportedExtensions = ["mp3", "m4a", "wav"];

function isSupported(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? supportedExtensions.includes(extension) : false;
}

export function UploadPanel({ onIdentify, onManual }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function selectFile(file?: File) {
    if (!file) return;
    if (!isSupported(file)) {
      setSelectedFile(null);
      setError("Válassz MP3, M4A vagy WAV fájlt.");
      return;
    }
    setSelectedFile(file);
    setError("");
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <section className={styles.entryPanel} role="tabpanel" aria-labelledby="upload-panel-title">
      <span className={styles.panelEyebrow}>Helyi hangfájl</span>
      <h2 id="upload-panel-title">Válassz egy dalt erről az eszközről.</h2>
      <p className={styles.panelCopy}>
        A fájl csak ebben a böngészőfülben jelenik meg. Nem töltjük fel, nem olvassuk be és nem küldjük el sehova.
      </p>
      <div
        className={`${styles.dropArea} ${dragging ? styles.dragging : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className={styles.uploadIcon} aria-hidden="true">♪</span>
        <p><b>Húzd ide a hangfájlt</b><span>vagy válaszd ki kézzel</span></p>
        <button className={styles.fileButton} type="button" onClick={() => inputRef.current?.click()}>
          Fájl kiválasztása
        </button>
        <input
          ref={inputRef}
          className="srOnly"
          type="file"
          accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav"
          onChange={handleChange}
          aria-label="Hangfájl kiválasztása"
        />
        <small>MP3 · M4A · WAV</small>
      </div>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      {selectedFile ? (
        <div className={styles.selectedFile}>
          <span aria-hidden="true">♫</span>
          <div><b>{selectedFile.name}</b><small>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB · csak helyben</small></div>
          <button type="button" onClick={() => setSelectedFile(null)} aria-label={`${selectedFile.name} eltávolítása`}>×</button>
        </div>
      ) : null}
      <button className={styles.mainAction} type="button" onClick={onIdentify} disabled={!selectedFile}>
        Mock felismerés indítása
      </button>
      <div className={styles.textActions}>
        <button type="button" onClick={onManual}>Keresés cím és előadó alapján</button>
      </div>
    </section>
  );
}
