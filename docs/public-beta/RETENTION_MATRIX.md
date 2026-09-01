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
| private usage event | igen, max. technikai ablak | rate/replay guard | opportunista 24 órás takarítás vagy fióktörlés |

Supabase backupból történő végleges eltűnés ideje plan/backup-konfiguráció függő; indulás előtt dokumentálandó.
