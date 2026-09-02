# Adatmegőrzési mátrix

| Adat | Perzisztens? | Cél | Törlés |
|---|---:|---|---|
| teljes helyi fájl / waveform | nem | böngészőbeli kijelölés | oldal/session vége |
| kijelölt klip / mikrofon / shadowing hang | nem | tranziensek STT/feedback | kérés memória-életciklusa |
| ellenőrzött forrásszöveg | alapból nem | tranziensek elemzés | kérés/session vége |
| learning session meta | igen | tulajdon, resume | session- vagy fióktörlés |
| learning result | igen | privát lecke | session- vagy fióktörlés |
| saved phrase + review | igen | memória | phrase- vagy fióktörlés |
| Practice Lab válasz/beszélgetés | nem | egy turnus | kérés/token lejárta; token nem tartalmaz learner textet |
| processing attempt | igen | hibakeresési metaadat | session-/fióktörlés; önálló retention policy publikus indulás előtt véglegesítendő |
| private usage event | igen, gördülő havi technikai ablak | órás rate guard és havi csomagkeret | opportunista, legfeljebb két havi ablakot megtartó takarítás vagy fióktörlés |
| Stripe customer/subscription tükör | igen | csomagjogosultság és biztonságos fióktörlés | fióktörlés; Stripe-oldali megőrzés külön szerződéses/jogi felülvizsgálat tárgya |
| Stripe webhook raw body / kártyaadat | nem | aláírás-ellenőrzés után csak esemény-ID és minimális állapot marad | kérés vége |

Supabase backupból történő végleges eltűnés ideje plan/backup-konfiguráció függő; indulás előtt dokumentálandó.
