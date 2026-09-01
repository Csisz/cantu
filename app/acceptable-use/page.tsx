import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
export const metadata: Metadata = { title: "Elfogadható használat — béta-tervezet" };
export default function AcceptableUsePage() { return <LegalShell eyebrow="Tartalmi szabályok" title="Elfogadható használat — tervezet" intro="Személyes nyelvtanulás, mások jogainak és a szolgáltatás biztonságának tiszteletben tartásával.">
  <h2>Megengedett</h2><p>Saját vagy jogszerűen hozzáférhető rövid olasz részlet megértése, tanulása, privát kifejezésmentése és gyakorlása.</p>
  <h2>Nem megengedett</h2><ul><li>teljes védett mű vagy hiányzó részeinek rekonstruálása;</li><li>automatizált tömeges kivonás vagy a korlátok megkerülése;</li><li>jogellenes, veszélyeztető vagy visszaélésszerű tartalom;</li><li>más felhasználó adatainak elérése vagy a fizetős API-határok megkerülése;</li><li>a privát eredmények nyilvános katalógussá alakítása.</li></ul>
  <h2>Jogérvényesítési kapcsolat</h2><p>A jogtulajdonosi és adatvédelmi bejelentési folyamat végleges kapcsolattartóját a nyilvános béta előtt meg kell adni.</p>
</LegalShell>; }
