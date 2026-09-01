import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/app/legal.module.css";

export function LegalShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  const contact = process.env.PUBLIC_CONTACT_EMAIL?.trim() || "[CONTACT_EMAIL_REQUIRED]";
  return <main className={styles.legalPage}><article>
    <nav aria-label="Jogi oldalak"><Link href="/">Cantu</Link><Link href="/privacy">Adatvédelem</Link><Link href="/terms">Feltételek</Link><Link href="/acceptable-use">Elfogadható használat</Link></nav>
    <span className={styles.kicker}>{eyebrow}</span><h1>{title}</h1><p className={styles.lead}>{intro}</p>
    <aside><strong>Béta-tervezet.</strong> Mérnöki és termék-előkészítő dokumentum; a nyilvános indulás előtt magyar/EU jogi felülvizsgálat szükséges.</aside>
    {children}
    <footer><p>Adatvédelmi, szerzői jogi és támogatási kapcsolat: <code>{contact}</code></p><Link href="/app">Vissza a Cantuhoz</Link></footer>
  </article></main>;
}
