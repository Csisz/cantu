"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  initialPersistenceActionState,
  type PersistenceActionState,
} from "@/lib/domain/learning-session";
import styles from "./app.module.css";

type DeleteAction = (
  state: PersistenceActionState,
  formData: FormData,
) => Promise<PersistenceActionState>;

export function DeleteLearningControl({ sessionId, action }: { sessionId: string; action: DeleteAction }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialPersistenceActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      window.dispatchEvent(new CustomEvent("cantu:learning-session-deleted", { detail: { id: sessionId } }));
      router.refresh();
    }
  }, [router, sessionId, state.status]);

  if (!confirming) {
    return (
      <button className={styles.deleteButton} type="button" onClick={() => setConfirming(true)}>
        Törlés
      </button>
    );
  }

  return (
    <form className={styles.deleteConfirm} action={formAction}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <span>Biztosan törlöd?</span>
      <button type="submit" disabled={pending}>{pending ? "Törlés…" : "Igen, törlöm"}</button>
      <button type="button" onClick={() => setConfirming(false)} disabled={pending}>Mégse</button>
      {state.status === "error" ? <small role="alert">{state.message}</small> : null}
    </form>
  );
}
