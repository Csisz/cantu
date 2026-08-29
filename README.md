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
- `/auth/confirm` — Supabase e-mail-megerősítés.

Supabase-konfiguráció nélkül a landing és a helyi Input Studio használható, de a valós STT és a mentés hitelesített fiókot igényel.

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

Az átirat nem erősítődik meg automatikusan. Az eredeti jelölt és a kézzel javított szöveg is legfeljebb 2 000 karakter. Magyar fordítás, nyelvtani elemzés és tanulási AI még nincs; ezek a Milestone 5 határán túl vannak.

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
- `learning_results` — későbbi validált származtatott eredmény;
- `user_phrasebook` — privát, kifejezetten mentett kifejezések; session törlésekor a hivatkozás `SET NULL`;
- `learning_progress` — tulajdonos- és session-konzisztens haladás.

Az M4 migráció tulajdonoshoz kötött, validált RPC-kkel kezeli az STT-életciklust, és privát-alfa 20 kísérlet/óra korlátot alkalmaz. Minden alkalmazástábla RLS-védett. A `songs`, `recognition_attempts`, `lyrics_versions`, `lessons`, `user_songs` és `user_song_progress` legacy struktúraként megmarad, de az aktív BYOC runtime nem használja.

## Környezeti változók

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
SPEECH_TO_TEXT_PROVIDER=openai
```

Az `OPENAI_API_KEY` kizárólag szerveroldali változó; soha ne kapjon `NEXT_PUBLIC_` prefixet. Service-role kulcs nem szükséges és nem szerepel a kliensben.

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

A unit/component/E2E tesztek determinisztikus `SpeechToTextProvider` implementációt és generált hangot használnak, ezért nem költenek OpenAI-kreditet. A Playwright mock csak nem-production környezetben, `CANTU_E2E_STT_MOCK=1` mellett aktiválható.

Valós smoke teszthez állíts be saját, ignorált `.env.local` fájlban `OPENAI_API_KEY` értéket, indítsd az alkalmazást és egy hitelesített fiókkal küldj kifejezetten erre készített saját olasz beszédfelvételt. Ne használj kereskedelmi zenét; a kulcsot és a felvételt ne commitold.

## Kifejezetten halasztva

Nincs LanguageAnalysisProvider, magyar fordítás, szókincs- vagy nyelvtani AI, kiejtésértékelés, TTS, automatikus phrasebook-generálás, nyilvános megosztás, billing, lyrics API, zeneazonosítás vagy teljes fájlos/szekvenciális transzkripció.
