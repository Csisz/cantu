"use client";

import { useActionState, useState } from "react";
import { signInAction, signUpAction } from "@/app/app/actions";
import { initialAuthActionState } from "@/lib/auth/types";
import styles from "@/components/cantu-app/app.module.css";

type AuthMode = "signin" | "signup";

export function AuthPanel({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialAuthActionState,
  );
  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialAuthActionState,
  );
  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className={styles.authPanel}>
      <div className={styles.authMode} aria-label="Fiókművelet">
        <button
          type="button"
          aria-pressed={mode === "signin"}
          onClick={() => setMode("signin")}
        >
          Belépés
        </button>
        <button
          type="button"
          aria-pressed={mode === "signup"}
          onClick={() => setMode("signup")}
        >
          Regisztráció
        </button>
      </div>

      <form action={mode === "signin" ? signInFormAction : signUpFormAction}>
        {mode === "signup" ? (
          <label>
            Megjelenített név <span>(nem kötelező)</span>
            <input
              name="displayName"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              disabled={!configured || pending}
            />
            {state.fieldErrors?.displayName ? (
              <small className={styles.authFieldError}>{state.fieldErrors.displayName[0]}</small>
            ) : null}
          </label>
        ) : null}

        <label>
          E-mail-cím
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={!configured || pending}
          />
          {state.fieldErrors?.email ? (
            <small className={styles.authFieldError}>{state.fieldErrors.email[0]}</small>
          ) : null}
        </label>

        <label>
          Jelszó
          <input
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            maxLength={128}
            disabled={!configured || pending}
          />
          {state.fieldErrors?.password ? (
            <small className={styles.authFieldError}>{state.fieldErrors.password[0]}</small>
          ) : null}
        </label>

        {!configured ? (
          <p className={styles.authNotice} role="status">
            A fiókok helyi vagy cloud Supabase konfiguráció után kapcsolhatók be.
            A fenti dalbemutató ettől függetlenül használható.
          </p>
        ) : null}

        {state.message ? (
          <p
            className={state.status === "error" ? styles.authError : styles.authSuccess}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <button className={styles.authSubmit} type="submit" disabled={!configured || pending}>
          {pending
            ? "Egy pillanat…"
            : mode === "signin"
              ? "Bejelentkezés"
              : "Fiók létrehozása"}
        </button>
      </form>
    </div>
  );
}
