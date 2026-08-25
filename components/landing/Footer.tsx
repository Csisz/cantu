import Link from "next/link";
import styles from "./landing.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Link className={styles.brand} href="/" aria-label="Cantu kezdőlap">
        <span className={styles.brandDot} aria-hidden="true" />
        Cantu
      </Link>
      <p>© 2026 Cantu · Olasz dalok, magyar füleknek.</p>
      <nav aria-label="Lábléc navigáció">
        <Link href="/app?mode=listen">Hallgatás</Link>
        <Link href="/app?mode=upload">Feltöltés</Link>
      </nav>
    </footer>
  );
}
