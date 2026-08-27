"use client";

import { useState } from "react";
import { TEXT_INPUT_MAX_CHARACTERS } from "@/lib/input/studio-reducer";
import styles from "../app.module.css";

type TextInputProps = {
  initialText?: string;
  onContinue: (text: string) => void;
};

export function TextInput({ initialText = "", onContinue }: TextInputProps) {
  const [text, setText] = useState(initialText.slice(0, TEXT_INPUT_MAX_CHARACTERS));
  const remaining = TEXT_INPUT_MAX_CHARACTERS - text.length;
  const canContinue = text.trim().length > 0;

  return (
    <section
      id="input-panel-text"
      className={`${styles.entryPanel} ${styles.textPanel}`}
      role="tabpanel"
      aria-labelledby="input-mode-text text-panel-title"
    >
      <span className={styles.panelEyebrow}>Saját rövid szöveg</span>
      <h2 id="text-panel-title">Mit szeretnél megérteni?</h2>
      <p className={styles.panelCopy}>
        Írj vagy illessz be egy rövid olasz mondatot, üzenetet vagy részletet.
      </p>
      <div className={styles.textInputWrap}>
        <label htmlFor="italian-source-text">Olasz szöveg</label>
        <textarea
          id="italian-source-text"
          value={text}
          maxLength={TEXT_INPUT_MAX_CHARACTERS}
          rows={9}
          placeholder="Például: Ci vediamo domani mattina?"
          onChange={(event) =>
            setText(event.currentTarget.value.slice(0, TEXT_INPUT_MAX_CHARACTERS))
          }
        />
        <div className={styles.characterCount} role="status" aria-live="polite">
          <span>{text.length} / {TEXT_INPUT_MAX_CHARACTERS} karakter</span>
          <span>{remaining} maradt</span>
        </div>
      </div>
      <button
        className={styles.mainAction}
        type="button"
        disabled={!canContinue}
        onClick={() => onContinue(text)}
      >
        Ezt értsük meg
      </button>
      <p className={styles.privacyLine}>
        A beírás önmagában nem menti és nem küldi el a szöveget. Csak olyan tartalmat
        használj, amelyet jogosult vagy feldolgozni.
      </p>
    </section>
  );
}
