import { signOutAction } from "@/app/app/actions";
import { AuthPanel } from "@/components/auth/AuthPanel";
import type { AuthContext } from "@/lib/auth/types";
import type { LibrarySnapshot } from "@/lib/data/library";
import { progressLabel } from "@/lib/domain/progress";
import styles from "./app.module.css";

type AccountSectionProps = {
  auth: AuthContext;
  library: LibrarySnapshot;
  notice?: string;
};

export function AccountSection({ auth, library, notice }: AccountSectionProps) {
  return (
    <section className={styles.accountSection} aria-labelledby="library-title">
      <div className={styles.accountHeading}>
        <div>
          <span className={styles.kicker}>Személyes tanulási tér</span>
          <h2 id="library-title">Saját dalaim</h2>
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
            <span aria-hidden="true">🎵</span>
            <h3>A demó szabadon kipróbálható.</h3>
            <p>
              Fiókra csak a későbbi mentéshez és haladáshoz lesz szükség. A Listen és
              Upload mock folyamat most belépés nélkül is teljes marad.
            </p>
          </div>
          <AuthPanel configured={auth.configured} />
        </div>
      ) : null}

      {auth.status === "authenticated" && library.status === "error" ? (
        <div className={styles.libraryEmpty}>
          <span aria-hidden="true">!</span>
          <h3>Most nem érjük el a saját dalaidat.</h3>
          <p>{library.message}</p>
        </div>
      ) : null}

      {auth.status === "authenticated" && library.status === "ready" && library.items.length === 0 ? (
        <div className={styles.libraryEmpty}>
          <span aria-hidden="true">♫</span>
          <h3>Még nincs elmentett dalod.</h3>
          <p>Az első megerősített dalad itt fog megjelenni.</p>
        </div>
      ) : null}

      {auth.status === "authenticated" && library.status === "ready" && library.items.length > 0 ? (
        <ul className={styles.libraryList}>
          {library.items.map((item) => (
            <li key={item.songId}>
              <div className={styles.libraryArtwork}>
                <span aria-hidden="true">♫</span>
              </div>
              <div>
                <strong>{item.title}</strong>
                <small>{item.artist}</small>
              </div>
              <div className={styles.libraryProgress}>
                <span>{progressLabel(item.progress.percentComplete)}</span>
                <div aria-hidden="true">
                  <i style={{ width: progressLabel(item.progress.percentComplete) }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
