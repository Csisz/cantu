import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import styles from "./landing.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Cantu kezdőlap">
        <span className={styles.brandDot} aria-hidden="true" />
        Cantu
      </Link>
      <nav className={styles.nav} aria-label="Fő navigáció">
        <a className={styles.navLink} href="#hogyan-mukodik">
          Hogyan működik?
        </a>
        <a className={styles.navLink} href="#forrasbol-tanulas">
          Mit kapsz?
        </a>
        <Link className={styles.navLink} href="/pricing">Csomagok</Link>
        <Link className={styles.navCta} href="/app?mode=listen">
          Kezdés
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
