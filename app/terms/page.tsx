import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
export const metadata: Metadata = { title: "Felhasználási feltételek — béta-tervezet" };
export default function TermsPage() { return <LegalShell eyebrow="Feltételek" title="Felhasználási feltételek — tervezet" intro="A Cantu saját forrásból hozott, rövid olasz tartalom privát nyelvtanulási feldolgozására készült.">
  <h2>A szolgáltatás célja</h2><p>A Cantu nem védett tartalomkatalógus és nem nyilvános átirattár. A forrást te adod, a Cantu pedig rövid, privát tanulási anyagot készít belőle.</p>
  <h2>Amit tőled kérünk</h2><p>Csak olyan tartalmat küldj be, amelyet jogosult vagy ilyen célra használni. Ne használd teljes művek automatizált kivonására, hiányzó részek rekonstruálására, környező dalszöveg vagy párbeszéd megszerzésére, illetve jogsértő terjesztésre.</p>
  <h2>Szolgáltatási korlátok</h2><p>Szolgáltatói hiba, átmeneti elérhetetlenség és AI-pontatlanság előfordulhat. Az STT-jelöltet ezért te ellenőrzöd, a tanulási eredményt pedig oktatási segítségként kezeld.</p>
  <h2>Életkori feltételek</h2><p>A béta pontos korhatára és esetleges szülői hozzájárulási szabálya termék- és jogi döntést igényel.</p>
  <h2>Fiók megszüntetése</h2><p>A fiókot a személyes térben törölheted. A törlés a Cantu privát adataira kiterjed; az aktív, már továbbított szolgáltatói kérés elosztott megszakítása nem minden esetben lehetséges.</p>
</LegalShell>; }
