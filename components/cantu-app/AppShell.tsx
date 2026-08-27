import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { AuthContext } from "@/lib/auth/types";
import type { LibrarySnapshot } from "@/lib/data/library";
import type { InputMode } from "@/lib/input/types";
import { AccountSection } from "./AccountSection";
import { InputStudio } from "./InputStudio";
import styles from "./app.module.css";

type AppShellProps = {
  initialMode: InputMode;
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
          <span className={styles.kicker}>Cantu Input Studio</span>
          <h1 id="app-title">Hozd azt az olaszt, amit érteni szeretnél.</h1>
          <p>
            Hallgasd meg, nyiss meg egy helyi hangfájlt, vagy írd be a rövid szöveget.
            A pontos forrást mindig te erősíted meg.
          </p>
        </div>
        <InputStudio initialMode={initialMode} />
        <AccountSection auth={auth} library={library} notice={authNotice} />
      </section>
      <footer className={styles.appFooter}>
        <span><i aria-hidden="true" /> Helyi Input Studio · privát forráskezelés</span>
        <Link href="/">Vissza a bemutatóhoz</Link>
      </footer>
    </main>
  );
}
