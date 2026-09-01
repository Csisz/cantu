# Cantu adatvédelmi tájékoztató — béta-tervezet

> MÉRNÖKI/TERMÉKTERVEZET. REQUIRES LEGAL COUNSEL: magyar és EU adatvédelmi felülvizsgálat a publikus indulás előtt.

Az alkalmazásban megjelenő magyar tervezet: `/privacy`. A tényleges adatfolyam négy csoportja:

| Kategória | Példák | Megőrzés |
|---|---|---|
| Fiók | e-mail, név, Auth ID/session metaadat | fióktörlésig |
| Átmeneti forrás | kijelölt hangrészlet, mikrofonfelvétel, ellenőrzött szöveg | csak a kérés ideje alatt a Cantunál; szolgáltatói megőrzés külön ellenőrzendő |
| Származtatott tanulás | privát eredmény, kifejezés, haladás, review | felhasználói vagy fióktörlésig |
| Működés | szolgáltató/modell, latency, hibakód, usage nonce | processing metaadat a termékadattal együtt; usage event legfeljebb 24 órás technikai ablak |

Szándékosan nincs: teljes audio, klip, shadowing-hang, waveform, teljes forrásszöveg alapértelmezetten, teljes Practice Lab-beszélgetés, prompt, nyers provider payload, titok vagy auth token. Nincs analytics szolgáltató.

Kapcsolat: `[CONTACT_EMAIL_REQUIRED]` — publikus béta előtt kötelező feloldani.
