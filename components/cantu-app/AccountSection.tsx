import { signOutAction } from "@/app/app/actions";
import { deleteLearningSessionAction } from "@/app/app/learning-actions";
import { AuthPanel } from "@/components/auth/AuthPanel";
import type { AuthContext } from "@/lib/auth/types";
import type { LearningHistorySnapshot } from "@/lib/data/learning-sessions";
import { progressLabel } from "@/lib/domain/learning-progress";
import type { LearningHistoryItem } from "@/lib/domain/learning-session";
import { DeleteLearningControl } from "./DeleteLearningControl";
import styles from "./app.module.css";

type AccountSectionProps = {
  auth: AuthContext;
  history: LearningHistorySnapshot;
  notice?: string;
};

const inputLabels: Record<LearningHistoryItem["inputType"], string> = {
  microphone: "Hallgatott részlet",
  audio_file: "Hangrészlet",
  text: "Szöveg",
};

const statusLabels: Record<string, string> = {
  pending: "Feldolgozásra vár",
  transcribed: "Átirat kész",
  user_verified: "Forrás ellenőrizve",
  user_edited: "Forrás javítva",
  ready: "Tanulásra kész",
  failed: "Újrapróbálható",
};

function sessionMetadata(item: LearningHistoryItem) {
  if (item.inputType === "text") return `${item.sourceCharCount ?? 0} karakter`;
  if (item.inputType === "audio_file") return `${((item.sourceDurationMs ?? 0) / 1000).toFixed(1)} mp`;
  return "Mikrofonos forrás";
}

export function AccountSection({ auth, history, notice }: AccountSectionProps) {
  return (
    <section className={styles.accountSection} aria-labelledby="library-title">
      <div className={styles.accountHeading}>
        <div>
          <span className={styles.kicker}>Személyes tanulási tér</span>
          <h2 id="library-title">Saját tanulásaim</h2>
        </div>
        {auth.status === "authenticated" ? (
          <form action={signOutAction}>
            <button className={styles.signOutButton} type="submit">
              Kijelentkezés
            </button>
          </form>
        ) : null}
      </div>

      {notice ? <p className={styles.accountNotice} role="status">{notice}</p> : null}

      {auth.status === "unauthenticated" ? (
        <div className={styles.accountGrid}>
          <div className={styles.accountCopy}>
            <span aria-hidden="true">✦</span>
            <h3>A demó szabadon kipróbálható.</h3>
            <p>
              Fiókra csak a munkamenet adatainak mentéséhez és a későbbi haladáshoz
              van szükség. A helyi Input Studio belépés nélkül is használható.
            </p>
          </div>
          <AuthPanel configured={auth.configured} />
        </div>
      ) : null}

      {auth.status === "authenticated" && history.status === "error" ? (
        <div className={styles.libraryEmpty}>
          <span aria-hidden="true">!</span>
          <h3>Most nem érjük el a saját tanulásaidat.</h3>
          <p>{history.message}</p>
        </div>
      ) : null}

      {auth.status === "authenticated" && history.status === "ready" && history.items.length === 0 ? (
        <div className={styles.libraryEmpty}>
          <span aria-hidden="true">✦</span>
          <h3>Még nincs elmentett tanulásod.</h3>
          <p>A forrás tartalma nélküli mentéseid és a hozzájuk tartozó haladás itt jelenik majd meg.</p>
        </div>
      ) : null}

      {auth.status === "authenticated" && history.status === "ready" && history.items.length > 0 ? (
        <ul className={styles.libraryList}>
          {history.items.map((item) => (
            <li key={item.id}>
              <div className={styles.libraryArtwork}>
                <span aria-hidden="true">{item.inputType === "text" ? "Aa" : "◉"}</span>
              </div>
              <div>
                <strong>{inputLabels[item.inputType]}</strong>
                <small>
                  {sessionMetadata(item)} · {statusLabels[item.sourceStatus] ?? item.sourceStatus} ·{" "}
                  <time dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(item.createdAt))}
                  </time>
                </small>
              </div>
              <div className={styles.libraryProgress}>
                <span>{progressLabel(item.progress.percentComplete)}</span>
                <div aria-hidden="true">
                  <i style={{ width: progressLabel(item.progress.percentComplete) }} />
                </div>
                <DeleteLearningControl sessionId={item.id} action={deleteLearningSessionAction} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
