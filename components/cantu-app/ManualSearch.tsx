"use client";

import { type FormEvent, useState } from "react";
import { createManualCandidate } from "@/lib/recognition/mock";
import type { RecognitionCandidate } from "@/lib/recognition/types";
import styles from "./app.module.css";

export function ManualSearch({
  onSubmit,
  onBack,
}: {
  onSubmit: (candidate: RecognitionCandidate) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    onSubmit(createManualCandidate(title, artist));
  }

  return (
    <section className={styles.manualState} aria-labelledby="manual-title">
      <span className={styles.panelEyebrow}>Kézi megadás</span>
      <h2 id="manual-title">Írd be, amit tudsz a dalról.</h2>
      <p>Ez most nem keres külső katalógusban. A megadott adatokból helyi jelöltet készítünk.</p>
      <form onSubmit={submit} className={styles.manualForm}>
        <label htmlFor="song-title">Dal címe</label>
        <input
          id="song-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="például: Volare"
          autoComplete="off"
          required
        />
        <label htmlFor="song-artist">Előadó</label>
        <input
          id="song-artist"
          name="artist"
          value={artist}
          onChange={(event) => setArtist(event.target.value)}
          placeholder="például: Domenico Modugno"
          autoComplete="off"
          required
        />
        <button className={styles.mainAction} type="submit">Jelölt létrehozása</button>
        <button className={styles.quietAction} type="button" onClick={onBack}>Vissza</button>
      </form>
    </section>
  );
}
