import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { AuthUserDTO } from "@/lib/auth/types";
import type { PracticeProviderTarget } from "@/lib/practice/types";
import styles from "../app.module.css";
import { PracticeLab } from "./PracticeLab";

export function PracticeShell({ user, suggestedTargets }: { user: AuthUserDTO; suggestedTargets: PracticeProviderTarget[] }) {
  return (
    <main className={styles.appPage}>
      <header className={styles.appHeader}>
        <Link className={styles.brand} href="/" aria-label="Vissza a Cantu kezdőlapjára"><span aria-hidden="true" />Cantu</Link>
        <div className={styles.headerMeta}><span>{user.displayName ?? user.email}</span><ThemeToggle /></div>
      </header>
      <div className={styles.appBackdrop} aria-hidden="true" />
      <section className={styles.practiceRouteMain}>
        <PracticeLab suggestedTargets={suggestedTargets} />
        <Link className={styles.backToStudio} href="/app#phrasebook-title">← Vissza a mentett kifejezésekhez</Link>
      </section>
    </main>
  );
}
