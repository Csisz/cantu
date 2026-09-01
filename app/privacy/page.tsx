import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
export const metadata: Metadata = { title: "Adatvédelmi tájékoztató — béta-tervezet" };
export default function PrivacyPage() { return <LegalShell eyebrow="Adatvédelem" title="Adatvédelmi tájékoztató — tervezet" intro="A Cantu forráskímélő módon kezeli a saját olasz szöveget és hangot, amelyet tanulásra hozol.">
  <h2>Milyen adatokat kezelünk?</h2><h3>Fiókadatok</h3><p>E-mail-cím, megjelenítési név, felhasználói azonosító és hitelesítési munkamenet-metaadatok.</p>
  <h3>Átmeneti forrásfeldolgozás</h3><p>Hangfájlnál csak a böngészőben kijelölt, legfeljebb 30 másodperces részlet kerül átírásra; a teljes fájl a készülékeden marad. Mikrofonos felvételnél a rövid felvétel, elemzésnél az általad ellenőrzött szöveg jut el a beállított szolgáltatóhoz.</p>
  <h3>Privát, származtatott tanulási adatok</h3><p>Tanulási eredmények, mentett kifejezések, haladás, ismétlési ütemezés és forrástartalom nélküli gyakorlási metaadatok.</p>
  <h3>Működési metaadatok</h3><p>Szolgáltató, modell, késleltetés, normalizált hibakód, időbélyeg és forrástartalom nélküli használati számláló.</p>
  <h2>Mit nem mentünk szándékosan?</h2><p>A teljes feltöltött hangot, rövid nyers hangrészletet, kiejtési felvételt, hullámformát, teljes forrásszöveget alapértelmezetten, teljes szerepjáték-beszélgetést, promptot, nyers szolgáltatói választ és API-kulcsot.</p>
  <h2>Megőrzés és törlés</h2><p>A fiókhoz kötött származtatott tanulási adatokat addig őrizzük, amíg te nem törlöd őket vagy a fiókodat. A rövid működési usage-események legfeljebb 24 órás technikai ablakot szolgálnak. Külső szolgáltatók megőrzését a nyilvános indulás előtt szerződésesen ellenőrizni kell.</p>
  <h2>Adataid kezelése</h2><p>Bejelentkezés után exportálhatod származtatott adataidat, külön törölheted tanulásaidat és kifejezéseidet, vagy végleg törölheted a teljes Cantu-fiókot.</p>
</LegalShell>; }
