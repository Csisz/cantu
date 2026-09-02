"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/app/app/account-actions";
import { initialAccountActionState } from "@/lib/account/validation";
import styles from "./app.module.css";

export function AccountPrivacyControls({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccountAction, initialAccountActionState);
  return (
    <section className={styles.accountPrivacy} aria-labelledby="account-privacy-title">
      <span className={styles.kicker}>Fiók és adatvédelem</span>
      <h3 id="account-privacy-title">Adataim kezelése</h3>
      <p>Bejelentkezve: <strong>{email}</strong></p>
      <a className={styles.continueLearningLink} href="/api/account/export">Adatok exportálása</a>
      {!open ? (
        <button className={styles.phraseDeleteButton} type="button" onClick={() => setOpen(true)}>Cantu-fiók törlése</button>
      ) : (
        <form action={action} className={styles.accountDeleteForm}>
          <p><strong>Ez végleges.</strong> Minden Cantu-tanulásod, mentett kifejezésed és ismétlési állapotod törlődik. Aktív Plus esetén előbb biztonságosan megszüntetjük a Stripe-előfizetést; ha ez nem sikerül, a fiókot sem töröljük.</p>
          <label htmlFor="delete-confirmation">Megerősítésként írd be: <strong>TÖRLÉS</strong></label>
          <input id="delete-confirmation" name="confirmation" autoComplete="off" required />
          {state.message ? <p role="alert">{state.message}</p> : null}
          <div>
            <button className={styles.phraseDeleteButton} type="submit" disabled={pending}>{pending ? "Törlés…" : "Végleg törlöm a fiókom"}</button>
            <button type="button" onClick={() => setOpen(false)} disabled={pending}>Mégse</button>
          </div>
        </form>
      )}
    </section>
  );
}
