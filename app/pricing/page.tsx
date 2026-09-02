import type { Metadata } from "next";
import Link from "next/link";
import { BillingActionButton } from "@/components/billing/BillingActionButton";
import { getBillingSnapshot } from "@/lib/data/billing";
import { getAuthContext } from "@/lib/data/auth";
import styles from "./pricing.module.css";

export const metadata: Metadata = { title: "Csomagok" };

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ billing?: string | string[] }> }) {
  const auth = await getAuthContext();
  const snapshot = await getBillingSnapshot(auth);
  const params = await searchParams;
  const billing = Array.isArray(params.billing) ? params.billing[0] : params.billing;
  return <main className={styles.page}>
    <nav><Link href="/">Cantu</Link><Link href="/app">Alkalmazás</Link></nav>
    <header><span>Csomagok</span><h1>A tanulásod marad. Az AI-keret igazodik hozzád.</h1><p>A Free valódi Cantu-élményt ad; a Plus nagyobb havi keretet nyit az új, szolgáltatói feldolgozásokhoz.</p></header>
    {billing === "cancelled" ? <p className={styles.notice} role="status">A fizetési folyamatot megszakítottad. Semmi nem változott.</p> : null}
    <div className={styles.plans}>
      <article><span>Free</span><h2>Ingyenes</h2><ul><li>Korlátozott havi AI-feldolgozás</li><li>Privát mentett tanulások</li><li>Kifejezéstár és ismétlés</li><li>Korábbi eredmények korlátlan megnyitása</li></ul>{auth.status === "authenticated" ? <Link className={styles.secondary} href="/app">Folytatom Free csomaggal</Link> : <Link className={styles.secondary} href="/app">Kipróbálom</Link>}</article>
      <article className={styles.plus}><span>Cantu Plus</span><h2>{snapshot.priceLabel ?? "Az ár még nincs beállítva"}</h2><ul><li>Nagyobb havi elemzési és STT-keret</li><li>Nagyobb Practice Lab-keret</li><li>Nagyobb kiejtési visszajelzési keret</li><li>Ugyanaz a forráskímélő adatkezelés</li></ul>{snapshot.active ? <BillingActionButton action="portal" className={styles.primary}>Előfizetés kezelése</BillingActionButton> : auth.status !== "authenticated" ? <Link className={styles.primary} href="/app">Belépek a váltáshoz</Link> : snapshot.billingMode === "disabled" || !snapshot.priceLabel ? <p className={styles.unavailable}>A Plus ebben a fejlesztői környezetben még nem vásárolható meg.</p> : <BillingActionButton action="checkout" className={styles.primary}>Cantu Plusra váltok</BillingActionButton>}</article>
    </div>
    <aside>Az itt látható keretek és ármegjelenítés kereskedelmi konfigurációk; a végleges ajánlatot indulás előtt külön validálni kell. Nincs „korlátlan” ígéret.</aside>
    <footer><Link href="/privacy">Adatvédelem</Link> · <Link href="/terms">Feltételek</Link></footer>
  </main>;
}
