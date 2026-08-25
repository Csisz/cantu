import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { AuthContext } from "@/lib/auth/types";
import type { LibrarySnapshot } from "@/lib/data/library";
import type { EntryMode } from "@/lib/recognition/types";
import { AccountSection } from "./AccountSection";
import { SongRecognitionFlow } from "./SongRecognitionFlow";
import styles from "./app.module.css";

type AppShellProps = {
  initialMode: EntryMode;
  auth: AuthContext;
  library: LibrarySnapshot;
  authNotice?: string;
};

export function AppShell({ initialMode, auth, library, authNotice }: AppShellProps) {
  return (
    <main className={styles.appPage}>
      <header className={styles.appHeader}>
        <Link className={styles.brand} href="/" aria-label="Vissza a Cantu kezdőlapjára">
          <span aria-hidden="true" />
          Cantu
        </Link>
        <div className={styles.headerMeta}>
          <span>
            {auth.status === "authenticated"
              ? auth.user.displayName ?? auth.user.email
              : "Olasz → magyar"}
          </span>
          <ThemeToggle />
        </div>
      </header>
      <div className={styles.appBackdrop} aria-hidden="true" />
      <section className={styles.appMain} aria-labelledby="app-title">
        <div className={styles.intro}>
          <span className={styles.kicker}>Új dal</span>
          <h1 id="app-title">Hozd a zenét. A találatot te döntöd el.</h1>
          <p>
            Ebben a bemutatóban minden felismerési lépés helyben, szimulálva történik.
          </p>
        </div>
        <SongRecognitionFlow initialMode={initialMode} />
        <AccountSection auth={auth} library={library} notice={authNotice} />
      </section>
      <footer className={styles.appFooter}>
        <span><i aria-hidden="true" /> Mock felismerés · biztonságos fiókalap</span>
        <Link href="/">Vissza a bemutatóhoz</Link>
      </footer>
    </main>
  );
}
