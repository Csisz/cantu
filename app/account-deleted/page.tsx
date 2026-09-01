import Link from "next/link";
import styles from "../legal.module.css";

export default function AccountDeletedPage() {
  return <main className={styles.legalPage}><article><span className={styles.kicker}>Fiók törölve</span><h1>A Cantu-adataidat töröltük.</h1><p>A munkameneted lezárult. Ha később visszatérsz, új fiókkal kezdhetsz.</p><Link href="/">Vissza a kezdőlapra</Link></article></main>;
}
