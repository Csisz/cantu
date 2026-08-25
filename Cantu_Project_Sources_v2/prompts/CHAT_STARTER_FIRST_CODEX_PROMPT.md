# Első Cantu fejlesztési beszélgetés — indító prompt

Az alábbi szöveget másold be egy új Cantu Project beszélgetésbe, miután ezt a forráscsomagot és a jelenlegi Cantu projektet is elérhetővé tetted:

---

A Cantu fejlesztését szeretném most elkezdeni Codex CLI-vel.

A projekt forrásai között megtalálod a Cantu jelenlegi weboldalát és a `Cantu_Project_Sources_v2` dokumentációs csomagot. Először olvasd át a dokumentációból legalább az alábbiakat:

- `AGENTS.md`
- `README.md`
- `docs/00_PRODUCT_BRIEF.md`
- `docs/01_MVP_SCOPE.md`
- `docs/03_SONG_INGEST_AND_RECOGNITION.md`
- `docs/07_UI_UX_DESIGN_SYSTEM.md`
- `docs/09_EXISTING_SITE_REVIEW.md`
- `docs/12_IMPLEMENTATION_ROADMAP.md`

A mostani cél kizárólag **Milestone 0 — Foundation & visual migration**.

Kérlek:

1. vizsgáld meg a jelenlegi Cantu projektstruktúrát és az `index.html` oldalt;
2. vesd össze a projektet a forrásdokumentációval;
3. ne módosíts még fájlt;
4. készíts nekem **egyetlen, részletes, bemásolható Codex CLI promptot**, amellyel a Codex meg tudja valósítani a teljes Milestone 0-t;
5. a prompt utasítsa a Codexet arra is, hogy először inspectálja a repót, őrizze meg a mostani látványvilágot, nevezze át a LyricLingo elemeket Cantura, készítse el a Next.js/TypeScript alapot és a `/app` shellt, valamint építse meg a **Listen / Upload / song recognition confirmation mock UI-t** valódi AudD/Supabase/OpenAI integráció nélkül;
6. tartalmazzon pontos acceptance criteria-t, kötelező build/lint/test ellenőrzéseket és a végén elvárt riportformátumot;
7. úgy írd meg, hogy a Codex a feladatot lehetőleg önállóan végig tudja vinni, és csak valódi blokkoló probléma esetén álljon meg.

Fontos: most **ne te implementáld** a Milestone 0-t, és ne adj több külön Codex promptot. Elsőként csak a végleges, egyben bemásolható Codex CLI promptot kérem.

---
