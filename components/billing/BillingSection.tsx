import Link from "next/link";
import type { BillingSnapshot } from "@/lib/billing/types";
import { BillingActionButton } from "./BillingActionButton";
import styles from "@/components/cantu-app/app.module.css";

const operationLabels = { transcription: "hangfelismerés", analysis: "elemzés", pronunciation: "kiejtési visszajelzés", practice: "Practice Lab forduló" } as const;

export function BillingSection({ snapshot }: { snapshot: BillingSnapshot }) {
  const paymentIssue = snapshot.subscriptionStatus === "past_due" || snapshot.subscriptionStatus === "unpaid" || snapshot.subscriptionStatus === "incomplete";
  return <section className={styles.billingSection} aria-labelledby="billing-title">
    <span className={styles.kicker}>Csomag és AI-keret</span>
    <div className={styles.billingHeading}><h3 id="billing-title">{snapshot.plan === "plus" ? "Cantu Plus" : "Free"}</h3><Link href="/pricing">Csomagok</Link></div>
    {snapshot.cancelAtPeriodEnd && snapshot.currentPeriodEnd ? <p role="status">Az előfizetés az időszak végén, <time dateTime={snapshot.currentPeriodEnd}>{new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(snapshot.currentPeriodEnd))}</time> megszűnik. Addig a Plus keret használható.</p> : null}
    {paymentIssue ? <p role="alert">Az előfizetésed rendezést igényel.</p> : null}
    <ul className={styles.usageList} aria-label="Havi AI-használat">
      {snapshot.usage.map((line) => <li key={line.operation}><span>{operationLabels[line.operation]}</span><strong>{line.remaining} maradt</strong><small>{line.used} / {line.limit}</small></li>)}
    </ul>
    {snapshot.plan === "plus" || paymentIssue ? <BillingActionButton action="portal" className={styles.continueLearningLink}>Előfizetés kezelése</BillingActionButton> : snapshot.billingMode === "disabled" ? <p>A fizetős csomag ebben a környezetben nincs bekapcsolva.</p> : <BillingActionButton action="checkout" className={styles.continueLearningLink}>Cantu Plus</BillingActionButton>}
    <p className={styles.billingFootnote}>A mentett tanulások, a kifejezéstár és az ismétlés nem fogyaszt AI-keretet.</p>
  </section>;
}
