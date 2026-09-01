"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSavedPhrase } from "@/lib/review/client";
import { reviewStrengthLabel } from "@/lib/review/scheduler";
import type { PhrasebookSnapshot, ReviewPhrase } from "@/lib/review/types";
import styles from "./app.module.css";

function dueLabel(item: ReviewPhrase, now = new Date()) {
  const due = new Date(item.review.nextReviewAt);
  if (due.getTime() <= now.getTime()) return "Ismétlésre vár";
  return `Következő: ${new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(due)}`;
}

export function PhrasebookSection({ snapshot }: { snapshot: PhrasebookSnapshot }) {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const items = snapshot.status === "ready"
    ? snapshot.items.filter((item) => !removedIds.includes(item.id))
    : [];

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("cantu:phrase-saved", refresh);
    return () => window.removeEventListener("cantu:phrase-saved", refresh);
  }, [router]);

  async function remove(phraseId: string) {
    if (deletingId) return;
    setDeletingId(phraseId);
    setMessage("");
    const result = await deleteSavedPhrase(phraseId);
    setDeletingId(null);
    setMessage(result.message);
    if (result.status === "success") {
      setRemovedIds((current) => [...current, phraseId]);
      setConfirmId(null);
    }
  }

  return (
    <section className={styles.phrasebookSection} aria-labelledby="phrasebook-title">
      <div className={styles.phrasebookHeading}>
        <div>
          <span className={styles.kicker}>Hosszú távú memória</span>
          <h3 id="phrasebook-title">Mentett kifejezéseim</h3>
        </div>
        {snapshot.status === "ready" && snapshot.dueCount > 0 ? (
          <Link className={styles.reviewCta} href="/app/review">{snapshot.dueCount} kifejezés vár rád · Ismétlek</Link>
        ) : snapshot.status === "ready" && snapshot.items.length > 0 ? (
          <Link className={styles.reviewCta} href="/app/practice">Gyakorold valódi helyzetben</Link>
        ) : null}
      </div>

      {snapshot.status === "error" ? <p className={styles.accountNotice} role="status">{snapshot.message}</p> : null}
      {snapshot.status === "ready" && items.length === 0 ? (
        <div className={styles.phrasebookEmpty}>
          <p>A leckékből külön elmentett hasznos kifejezések itt válnak később ismételhetővé.</p>
        </div>
      ) : null}
      {snapshot.status === "ready" && items.length > 0 ? (
        <ul className={styles.phrasebookList}>
          {items.map((item) => (
            <li key={item.id}>
              <div className={styles.phraseCopy}>
                <strong lang="it">{item.italianChunk}</strong>
                <span>{item.meaningHu}</span>
                {item.noteHu ? <small>{item.noteHu}</small> : null}
              </div>
              <div className={styles.phraseMemory}>
                <span className={styles.strengthBadge}>{reviewStrengthLabel(item.review.state)}</span>
                <small>{dueLabel(item)}</small>
                <Link href={`/app/review?phrase=${item.id}`}>Gyakorlom most</Link>
                {confirmId === item.id ? (
                  <div className={styles.phraseDeleteConfirm}>
                    <span>Biztosan törlöd?</span>
                    <button type="button" onClick={() => void remove(item.id)} disabled={deletingId === item.id}>Igen, törlöm</button>
                    <button type="button" onClick={() => setConfirmId(null)}>Mégse</button>
                  </div>
                ) : (
                  <button className={styles.phraseDeleteButton} type="button" onClick={() => setConfirmId(item.id)}>Törlés</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <p className={styles.persistenceStatus} role="status">{message}</p>
      {snapshot.status === "ready" && items.length > 0 && snapshot.dueCount === 0 ? (
        <div className={styles.phrasebookDone}>
          <strong>Mára kész vagy.</strong>
          <span>A következő esedékes kifejezést időben visszahozzuk.</span>
        </div>
      ) : null}
      {snapshot.status === "ready" && items.length > 0 ? (
        <Link className={styles.practiceEntryLink} href="/app/practice">Használd azt, amit már megtanultál →</Link>
      ) : null}
    </section>
  );
}
