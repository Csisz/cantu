"use client";

import { useState } from "react";
import { TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/limits";
import type { TranscriptResult } from "@/lib/providers/speech/types";
import styles from "./app.module.css";

export function TranscriptConfirmation({
  transcript,
  busy,
  error,
  onConfirm,
  onRetry,
}: {
  transcript: TranscriptResult;
  busy: boolean;
  error?: string;
  onConfirm: (text: string, status: "user_verified" | "user_edited") => void;
  onRetry: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(transcript.text);
  const normalized = text.trim();
  const isEdited = normalized !== transcript.text.trim();
  const probablyNotItalian = Boolean(
    transcript.detectedLanguage && !transcript.detectedLanguage.toLowerCase().startsWith("it"),
  );

  return (
    <section className={styles.confirmationPanel} aria-labelledby="transcript-title">
      <span className={styles.stepBadge}>2 / 3 · Ellenőrzés</span>
      <h2 id="transcript-title">Ezt hallottam</h2>
      {probablyNotItalian ? (
        <p className={styles.languageWarning} role="status">
          Ez valószínűleg nem olasz. A Cantu első verziója olaszhoz készült.
        </p>
      ) : null}

      {editing ? (
        <div className={styles.transcriptEditor}>
          <label htmlFor="transcript-correction">Javított olasz szöveg</label>
          <textarea
            id="transcript-correction"
            value={text}
            maxLength={TEXT_INPUT_MAX_CHARACTERS}
            onChange={(event) => setText(event.currentTarget.value)}
            rows={6}
            lang="it"
            autoFocus
          />
          <small>{text.length} / {TEXT_INPUT_MAX_CHARACTERS} karakter</small>
        </div>
      ) : (
        <blockquote className={styles.sourceText} lang="it">{transcript.text}</blockquote>
      )}

      <div className={styles.confirmationActions}>
        <button
          className={styles.mainAction}
          type="button"
          disabled={busy || !normalized}
          onClick={() => onConfirm(normalized, isEdited ? "user_edited" : "user_verified")}
        >
          {busy ? "Rögzítem…" : editing ? "Javítás megerősítése" : "Igen, pontos"}
        </button>
        {!editing ? (
          <button className={styles.secondaryAction} type="button" disabled={busy} onClick={() => setEditing(true)}>
            Javítom
          </button>
        ) : (
          <button className={styles.secondaryAction} type="button" disabled={busy} onClick={() => { setText(transcript.text); setEditing(false); }}>
            Mégse
          </button>
        )}
        <button className={styles.secondaryAction} type="button" disabled={busy} onClick={onRetry}>
          Újra
        </button>
      </div>
      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
      <p className={styles.mockNotice}>Az átirat csak jelölt: mindig te erősíted meg vagy javítod a továbblépés előtt.</p>
    </section>
  );
}
