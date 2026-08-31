# Cantu

Cantu egy Bring Your Own Content nyelvtanuló alkalmazás magyar anyanyelvű olasztanulóknak. Rövid, valós olasz hang- vagy szövegforrásból épít majd megértési és gyakorlási útvonalat.

> **Hallgasd. Olvasd. Értsd meg. Mondd ki.**

A `Cantu_Project_Sources_v3_BYOC` forráscsomag felülírja a régebbi, dal- és dalszöveg-központú dokumentációt, ahol a két irány ütközik.

## Előfeltételek és indítás

- Node.js 22+
- npm
- Docker Desktop vagy kompatibilis konténerkörnyezet a helyi Supabase-hez

```bash
npm install
copy .env.example .env.local
npm run dev
```

Fő útvonalak:

- `/` — marketingoldal;
- `/app` — Input Studio, autentikáció és a „Saját tanulásaim”;
- `/api/transcribe` — hitelesített, kizárólag átmeneti rövidklip-feldolgozás;
- `/api/analyze` — hitelesített, ellenőrzött szöveg → validált tanulási objektum;
- `/auth/confirm` — Supabase e-mail-megerősítés.

Supabase-konfiguráció nélkül a landing és a helyi Input Studio használható, de a valós STT, a strukturált nyelvi elemzés és a mentés hitelesített fiókot igényel.

## Milestone 4 — Speech-to-Text vertikális szelet

### Hangfájl

A teljes fájl a böngészőben marad. A Web Audio API helyben dekódolja, a felhasználó legfeljebb 30 másodpercet jelöl ki, majd a kliens kizárólag ezt a tartományt kódolja mono PCM WAV klippé. Csak ez az új, kivágott Blob kerül a hitelesített transzkripciós kérésbe; az eredeti `File`, fájlnév, teljes időtartam és hullámforma nem.

### Hallgasd

A mikrofon csak kifejezett gombnyomás után kér engedélyt. A `MediaRecorder` legfeljebb 30 másodpercet rögzít, kézzel leállítható vagy elvethető, és a streamek trackjeit leállítja. Az elkészült rövid felvétel előnézhető, újravehető, majd külön gombbal küldhető átírásra.

### STT és ellenőrzés

Az UI a providerfüggetlen `SpeechToTextProvider` határt használja. Az első adapter a jelenlegi OpenAI completed-file transcription végpontot és a `gpt-transcribe` modellt használja közvetlen multipart kéréssel. Nem használ generic Files API-t, és a böngésző soha nem kap OpenAI-kulcsot.

Az STT-eredmény csak jelölt:

```text
hang → Ezt hallottam → Igen, pontos / Javítom → ellenőrzött helyi forrás
```

Az átirat nem erősítődik meg automatikusan. Az eredeti jelölt és a kézzel javított szöveg is legfeljebb 2 000 karakter. Nyelvi elemzés csak az explicit ellenőrzés és egy külön felhasználói művelet után indul.

## Milestone 5 — strukturált tanulási elemzés

Az ellenőrzött `text_direct`, `user_verified` vagy `user_edited` forrás a külön **Értsük meg** gombbal léphet a hitelesített `/api/analyze` határra. `stt_unverified` átirat nem elemezhető. A szöveg ekkor átmenetileg a szerveren keresztül a `LanguageAnalysisProvider` implementációhoz kerül; oldalbetöltés, gépelés, STT vagy megerősítés önmagában nem indít fizetős hívást.

Az első adapter az OpenAI Responses API-t és alapértelmezetten a `gpt-5.6-terra` modellt használja `low` reasoninggel. A válasz:

- `store: false` beállítással készül;
- nem kap web-, file-search-, MCP- vagy más toolt;
- strict JSON Schema Structured Outputs formátumot használ;
- Cantu-oldalon Zod-séma és külön szemantikai ellenőrzés után válik eredménnyé;
- hibás forrásidézet esetén legfeljebb egy célzott javító próbát enged.

A verziózott `learning-analysis-v1` objektum természetes magyar jelentést, valóban a forrásban szereplő hasznos olasz chunkokat, legfeljebb két nyelvtani megfigyelést, szövegalapú kiejtési fókuszt, új tanítási példákat és determinisztikus recall-elemeket tartalmaz. A jelenlegi képernyő ezek nyugodt, mobilbarát előnézete; a teljes progresszív kártyajáték és pontozás Milestone 6.

A stabil providerutasítás külön marad a dinamikus forrástól. A forrás `untrusted_user_source` adatobjektumként kerül a kérés user-input részébe: a benne szereplő „SYSTEM”, „ignore”, webes keresési vagy titokkérő szöveg nyelvi adat, nem utasítás. A modellnek nincs retrieval- vagy forrásazonosító eszköze, és tilos környező/hiányzó művet rekonstruálnia.

## Adatvédelem és perzisztencia

- nincs Supabase Storage, audio bucket, fájlrendszeres mentés vagy nyilvános audio URL;
- a szerver a rövid klipet memóriában adja tovább az STT-szolgáltatónak, majd a kérés életciklusával elengedi;
- nyers audio, waveform, teljes fájl és provider raw payload nem kerül adatbázisba vagy logba;
- `learning_sessions` csak inputtípust, kiválasztott időtartamot, státuszt és időbélyegeket kap;
- `processing_attempts` csak stage/provider/status/latency/normalizált hibakód adatot kap;
- a transcript jelölt és az ellenőrzött/javított forrásszöveg helyi, átmeneti állapot marad; `verified_source_text` továbbra is `null`;
- `save_source=false` és `source_retention_status=not_stored` az alapértelmezés;
- 30 másodperc termék-, adatvédelmi-, költség- és kockázati korlát, nem jogi safe harbour.

Az OpenAI oldali adatkezelésre nem teszünk általános megőrzésmentességi ígéretet. Nyilvános indulás előtt az adott szerződés, projektbeállítás és aktuális szolgáltatói adatmegőrzési feltételek külön felülvizsgálata szükséges.

## Általánosított adatmodell

- `learning_sessions` — privát, minimalizált munkamenet-metaadat;
- `processing_attempts` — transzkripciós és későbbi feldolgozási operatív metaadat;
- `learning_results` — privát, validált és verziózott származtatott tanulási eredmény;
- `user_phrasebook` — privát, kifejezetten mentett kifejezések; session törlésekor a hivatkozás `SET NULL`;
- `learning_progress` — tulajdonos- és session-konzisztens haladás.

Az M4 migráció tulajdonoshoz kötött, validált RPC-kkel kezeli az STT-életciklust, és privát-alfa 20 kísérlet/óra korlátot alkalmaz. Az M5 additív migráció külön, 10 elemzés/óra guardot, futó-kérés deduplikációt és session/fingerprint/schema/prompt/model kötésű privát cache-t ad. A böngésző nem írhat `processing_attempts` vagy `learning_results` rekordot; az elemzési RPC-k kizárólag a szerveroldali Supabase secret szerepkörének elérhetők. Minden alkalmazástábla RLS-védett. A `songs`, `recognition_attempts`, `lyrics_versions`, `lessons`, `user_songs` és `user_song_progress` legacy struktúraként megmarad, de az aktív BYOC runtime nem használja.

## Környezeti változók

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
SPEECH_TO_TEXT_PROVIDER=openai
LANGUAGE_ANALYSIS_PROVIDER=openai
LANGUAGE_ANALYSIS_MODEL=gpt-5.6-terra
```

Az `OPENAI_API_KEY` és a `SUPABASE_SECRET_KEY` kizárólag szerveroldali változó; soha ne kapjanak `NEXT_PUBLIC_` prefixet. A Supabase secret csak az ellenőrzött eredményíró RPC-khez kell, a kliensben nem szerepel. Ugyanaz az OpenAI-kulcs szolgálja ki az STT- és elemzőadaptert; nincs második providersecret.

## Helyi Supabase

```bash
npm run db:start
npm run db:reset
npm run db:test
npx supabase db lint --local --level warning
npx supabase migration list --local
npm run db:types
npm run db:stop
```

A migrációk a `supabase/migrations/`, a pgTAP tesztek a `supabase/tests/database/` alatt vannak. A generált típus a `lib/supabase/database.types.ts` fájlba kerül.

## Tesztelés és provider smoke

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

A unit/component/E2E tesztek determinisztikus `SpeechToTextProvider` és `LanguageAnalysisProvider` implementációt, valamint generált hangot használnak, ezért nem költenek OpenAI-kreditet. A Playwright mockok csak nem-production környezetben, `CANTU_E2E_STT_MOCK=1` és `CANTU_E2E_ANALYSIS_MOCK=1` mellett aktiválhatók. A tesztek külön ellenőrzik a strict sémát, forrásidézet-előfordulást, egyszeri szemantikai retryt, prompt-injekciós elválasztást, toolmentességet és az RLS/service-role írási határt.

Valós elemzési smoke teszthez állíts be saját, ignorált `.env.local` fájlban `OPENAI_API_KEY` értéket, valamint a helyi vagy felhős Supabase publikus és szerver-secret változóit. Egy hitelesített fiókkal elemezz egy saját, rövid olasz mondatot pontosan egyszer. Ne használj dalszöveget, könyv- vagy filmidézetet; kulcsot, nyers provider-választ vagy promptot ne írj logba és ne commitolj.

Egy már futó, teszt-auth-tal indított helyi szerver ellen a reprodukálható böngészős smoke parancs:

```bash
CANTU_SMOKE_BASE_URL=http://localhost:3011 npm run smoke:analysis
```

A script kizárólag biztonságos modell/latencia/token- és strukturális darabszámot ír ki; forrást, promptot, kulcsot vagy raw választ nem.

## Kifejezetten halasztva

Nincs teljes Milestone 6 progresszív tanulási lejátszó, quizpontozás, spaced repetition, automatikus phrasebook-mentés, kiejtésértékelés, TTS, további nyelvpár, nyilvános megosztás, billing, lyrics API, zeneazonosítás vagy teljes fájlos/szekvenciális transzkripció.
