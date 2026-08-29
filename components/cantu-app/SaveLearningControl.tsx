"use client";

import { useActionState } from "react";
import {
  initialPersistenceActionState,
  toLearningSessionMetadata,
  type PersistenceActionState,
} from "@/lib/domain/learning-session";
import type { LearningSource } from "@/lib/input/types";
import styles from "./app.module.css";

export type PersistenceAction = (
  state: PersistenceActionState,
  formData: FormData,
) => Promise<PersistenceActionState>;

export function SaveLearningControl({
  source,
  authenticated,
  action,
}: {
  source: LearningSource;
  authenticated: boolean;
  action: PersistenceAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialPersistenceActionState);
  const metadata = toLearningSessionMetadata(source);

  if (!metadata) {
    return (
      <div className={styles.savePanel}>
        <strong>A Hallgasd mód még bemutató.</strong>
        <p>Valódi felvétel nélkül nem mentünk félrevezető mikrofonos munkamenetet.</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={styles.savePanel}>
        <strong>A forrásod továbbra is csak ebben a böngészőben van.</strong>
        <p>Jelentkezz be, ha a forrás tartalma nélkül szeretnéd elmenteni a munkamenet adatait.</p>
        <a className={styles.secondaryAction} href="#library-title">Mentéshez jelentkezz be</a>
      </div>
    );
  }

  return (
    <form className={styles.savePanel} action={formAction}>
      <input type="hidden" name="inputType" value={metadata.inputType} />
      {metadata.inputType === "text" ? (
        <input type="hidden" name="sourceCharCount" value={metadata.sourceCharCount} />
      ) : (
        <input type="hidden" name="sourceDurationMs" value={metadata.sourceDurationMs} />
      )}
      <strong>Csak a munkamenet adatait mentjük.</strong>
      <p>A beillesztett szöveg, a hang, a fájlnév és a hullámforma nem kerül a mentésbe.</p>
      <button className={styles.mainAction} type="submit" disabled={pending || state.status === "success"}>
        {pending ? "Mentés…" : state.status === "success" ? "Elmentve" : "Mentés a tanulásaim közé"}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? styles.authError : styles.authSuccess} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
