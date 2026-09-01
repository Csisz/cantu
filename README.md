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
- `/app/review` — privát, legfeljebb tíz elemes „Mai ismétlés”;
- `/app/practice` — privát, 3–5 válaszos Real-Life Practice Lab a mentett kifejezésekből;
- `/api/transcribe` — hitelesített, kizárólag átmeneti rövidklip-feldolgozás;
- `/api/analyze` — hitelesített, ellenőrzött szöveg → validált tanulási objektum;
- `/api/pronunciation` — hitelesített, átmeneti gyakorlófelvétel → átlátható szófelismerési összehasonlítás;
- `/api/practice` — hitelesített, strukturált és körszámban korlátozott helyzetgyakorlás;
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

A verziózott `learning-analysis-v1` objektum természetes magyar jelentést, valóban a forrásban szereplő hasznos olasz chunkokat, legfeljebb két nyelvtani megfigyelést, szövegalapú kiejtési fókuszt, új tanítási példákat és determinisztikus recall-elemeket tartalmaz. Ezt a Milestone 6 progresszív tanulási lejátszója változtatja teljes tanulási körré.

A stabil providerutasítás külön marad a dinamikus forrástól. A forrás `untrusted_user_source` adatobjektumként kerül a kérés user-input részébe: a benne szereplő „SYSTEM”, „ignore”, webes keresési vagy titokkérő szöveg nyelvi adat, nem utasítás. A modellnek nincs retrieval- vagy forrásazonosító eszköze, és tilos környező/hiányzó művet rekonstruálnia.

## Milestone 6 — teljes első tanulási kör

A validált `ready` eredmény már nem egyszerre jelenik meg. A nyugodt, mobilbarát tanulási lejátszó egyetlen világos következő művelettel vezeti végig a tanulót:

```text
Mit jelent?
→ Ezt érdemes megjegyezni
→ Miért pont így mondják? + új transfer példa
→ Mondd ki te is
→ Emlékszel?
→ Kész
```

- A természetes magyar jelentés az első jutalom; a szó szerinti szerkezet csak kinyitható segítség.
- A chunkok egyenként jelennek meg, és hitelesített felhasználó kifejezetten elmentheti őket a privát `user_phrasebook` táblába.
- A phrasebook-művelet csak `sessionId` + chunk index hivatkozást kap. A szerver az owned, validált `learning_result` rekordból olvassa újra a kanonikus származtatott mezőket; teljes forrást nem fogad el.
- A feleletválasztós és kitöltős recall helyben, determinisztikus válaszmetaadatból értékelődik. Nincs új AI-hívás vagy AI-alapú pontozás.
- A `learning_progress` a központosított `meaning/chunks/grammar/say/recall/completed` lépéseket, egész százalékot és a végső recall pontszámot menti.
- A `/app/learning/[sessionId]` útvonal kizárólag saját, RLS-védett eredményt nyit meg, és a mentett lépéstől folytat. Az eredeti forrás vagy hang nem szükséges hozzá.
- Aktív audio/mikrofonos munkamenetben a rövid helyi Blob visszahallgatható, de nem kerül storage-ba, és frissítés után nem állítjuk vissza.
- A befejezés utáni megértési önellenőrzés jelenleg helyi UI-állapot; nem vezettünk be harmadik fél analitikát.

A Milestone 6 nem indít második nyelvi generálást. A már validált privát eredményt használja, így a lecke renderelésének és pontozásának AI-költsége nulla.

## Milestone 7 — kiejtésgyakorlás és shadowing

A **Mondd ki te is** lépésben a tanuló egy rövid, validált chunkot gyakorol. Aktív audio- vagy mikrofonos munkamenetben a helyi forrásrészlet referencia maradhat; folytatott leckében text + a meglévő kiejtési útmutató is elegendő. Nincs TTS és nincs tartós referenciahang-tár.

```text
célkifejezés
→ kifejezett helyi gyakorlófelvétel (legfeljebb 12 mp)
→ saját felvétel helyi visszahallgatása
→ külön „Nézzük meg” művelet
→ átmeneti STT
→ determinisztikus, szavanként magyarázható összehasonlítás
```

- A `PronunciationFeedbackProvider` első implementációja a meglévő `SpeechToTextProvider` eredményét hasonlítja össze a célkifejezéssel. Nem kér új nyelvi elemzést.
- A böngésző csak `sessionId`, chunk index, időtartam és a rövid tanulói felvétel mezőket küldi. A szerver az owned, privát `learning_result` rekordból tölti vissza a kanonikus célt; kliens által megadott tetszőleges célszöveget vagy `user_id`-t nem fogad el.
- A visszajelzés azt mutatja, mit értett az STT, mely célszavak hiányoztak, volt-e plusz szó vagy sorrendkülönbség. Ez nem tudományos kiejtéspontszám és nem fonéma-diagnózis.
- A mikrofon csak gombnyomásra indul, a tanuló leállíthatja vagy elvetheti a felvételt, és a saját felvételét a providerhívás előtt helyben visszahallgathatja.
- A felvétel átmeneti: nincs Supabase Storage, fájlrendszeres mentés, nyilvános URL vagy hangelőzmény. Nincs voiceprint, személyazonosítás, életkor-/nem-/nemzetiség-/akcentus-, érzelem- vagy személyiségkövetkeztetés.
- A fizetős visszajelzés hitelesítést, külön explicit műveletet, 12 másodperces/1 MB-os korlátot és privát-alfa 15 próbálkozás/óra guardot használ. A gyakorlás kihagyható, ezért provider- vagy mikrofonhiba nem zárja le a leckét.

Az OpenAI completed-file STT adaptere változatlanul a `gpt-transcribe` modellt használja. A kiejtési réteg providerfüggetlen, így később gazdagabb, bizonyítékalapú megfigyelések adhatók hozzá a React komponensek providerhez kötése nélkül. Külső szolgáltatói adatmegőrzésről a Cantu nem tesz általános ígéretet; nyilvános indulás előtt szerződéses és adatkezelési felülvizsgálat szükséges.

## Milestone 8 — vezetett tanulás és Annotated Source

Az új `learning-analysis-v2` eredmény az aktív, ellenőrzött forrást és a leckét láthatóan összeköti:

```text
Innen tanulunk (átmeneti teljes forrás + pontos kiemelések)
→ Cantu Shortcut (1–3 központi elem)
→ jelentés / chunkok / Why Here?
→ shadowing
→ okos, determinisztikus recall
→ kis siker
```

- Az `AnnotatedSourceView` kizárólag az aktív React-állapotban lévő, felhasználó által hozott vagy ellenőrzött teljes szöveget mutatja. A kiemelések Unicode-, aposztróf- és whitespace-normalizálás mellett is pontos forrás-előforduláshoz kötöttek; átfedésük determinisztikusan rendezett.
- A kiemelések szemantikus gombok. A kontextuspanel megmutatja a helyi jelentést, a használhatóságot és egy külön jelölt új tanítási példát; innen a kanonikus chunk menthető, illetve a meglévő M7 shadowing indítható.
- A **Cantu Shortcut** a legkisebb, nagy pedagógiai értékű központi halmazt emeli ki. Ez 80/20 ihletésű heurisztika, nem matematikai megértési garancia.
- A `RobotCoach` állapot-, copy- és assetleképezése központi. A robot csak fontos átmeneteknél jelenik meg; a jelenlegi statikus asset a dokumentált későbbi animációslotok biztonságos fallbackje, csökkentett mozgásnál nincs szükséges animáció.
- A v2 recall már az eredeti elemzőhívásban kap célzott hibavisszajelzést, nehézségi ritmust és opcionális új megerősítő példát. Hibás válasz után nincs új AI-hívás; a pontozás változatlanul determinisztikus.
- A régi `learning-analysis-v1` eredmények változtatás nélkül megnyithatók az M7 lejátszóval. A v2 eredmények külön schema- és promptverzióval cache-elődnek, ezért nincs csendes átértelmezés.
- Folytatott leckénél a teljes forrást nem rekonstruáljuk chunkokból. A felület jelzi, hogy az eredetit adatvédelmi okból nem mentettük, majd a privát származtatott Shortcutból és leckéből folytatja.

Az M8 egyetlen strukturált nyelvi elemzőhívást használ forrásonként: az annotáció, Shortcut, robot-copy, hibatámogatás és kártyák nem indítanak külön providerhívást.

## Milestone 9 — tanulási memória és adaptív ismétlés

Az explicit módon mentett, privát származtatott kifejezésekhez a Cantu külön review-állapotot tart fenn. A phrasebook továbbra is csak az olasz chunkot, magyar jelentést és rövid, származtatott tanulási jegyzetet őrzi; a `user_phrase_review` kizárólag az ütemezéshez szükséges állapotot és számlálókat tartalmazza.

```text
mentett kifejezés
→ aktív felidézés
→ determinisztikus értékelés
→ Nehéz volt / Ment / Könnyű volt
→ következő UTC időpont
```

- Az első rendes ismétlés a mentés után 24 órára kerül. A régebbi, M9 előtti phrasebook-elemek a migráció után biztonságosan ismételhetővé válnak.
- A kis, SM-2 ihletésű scheduler az `again/hard/good/easy` kimenetekből 1–365 nap közötti intervallumot számol. Ez átlátható termékheurisztika, nem tudományosan optimális memóriaígéret.
- Hibás válasz automatikusan `again`; helyes válasz után a tanuló jelzi, mennyire volt nehéz. A szerver újra betölti a saját phrasebook-elemet, újraértékeli a választ, és maga számolja a következő dátumot. A böngésző nem írhat tetszőleges `next_review_at` értéket.
- A queue előre veszi a legrégebben esedékes és a többször elrontott kifejezéseket, de egy alkalom legfeljebb tíz elemes, így rövid marad.
- Az olasz→magyar, magyar→olasz és hiánykitöltős feladatok a már mentett mezőkből készülnek. Megnyitás, válasz, értékelés és újraütemezés közben nincs OpenAI- vagy más providerhívás.
- A „Mentett kifejezéseim” megmutatja az egyszerű `Új / Gyakorlom / Megy / Stabil` állapotot, az esedékességet, kézi gyakorlást és törlést. A kézi gyakorlás nem tolja el agresszíven a rendes ütemezést.
- Duplikált mentés nem hoz létre új review-sort és nem nullázza a történetet. A phrasebook-elem törlése kaszkádosan törli a review-állapotot; a forrás-session törlése után a származtatott kifejezés és review folytatható.

Az ismétlés nem tárol teljes forrást, transcriptet, hangot, waveformot, promptot vagy raw provider-választ. Nem rekonstruál eredeti művet a mentett chunkokból, és nem használ globális vagy nyilvános kifejezéstárat.

## Milestone 10 — Real-Life Practice Lab és animált Robot Coach

A privát `/app/practice` rövid, célhoz kötött hétköznapi helyzetekben aktiválja a tanuló saját mentett nyelvét:

```text
mentett / gyenge kifejezés
→ helyzet és cél
→ tanulói olasz válasz
→ kontextuális, magyar javítás
→ legfeljebb öt válasz
→ kompakt lezárás
```

- A nyolc konfigurált helyzet kávézótól és vásárlástól az utazáson, útbaigazításon és üzenetváltáson át munkáig/iskoláig terjed. Egy gyakorlás normálisan 3–5 tanulói válasz, nem végtelen chatbot.
- A célkifejezést a szerver determinisztikusan a saját phrasebookból választja: a recent lapse/gyenge elemeket az új, majd stabil elemek előtt hozza. A böngésző nem adhat tetszőleges `user_id`-t vagy kanonikus célszöveget.
- A `ConversationPracticeProvider` első adaptere a Responses API-t, strict Structured Outputs sémát, `store: false` beállítást és üres tools listát használ. Az alapmodell `gpt-5.6-terra`, low reasoninggel. A tanulói szöveg elkülönített, nem megbízható adat; maximum egy célzott sémajavító retry engedett.
- A visszajelzés megkülönbözteti a természetes, az érthető és a valóban javítandó választ. Érthető mondatot nem ír át pusztán stíluspreferencia miatt; hibánál rövid magyar magyarázatot és természetes olasz változatot ad.
- A segítség a már mentett chunkból készül, providerhívás nélkül. Egy elküldés pontosan egy normál providerhívás. Kliensoldali dupla küldés tiltott, a szerver aláírt, 30 percig élő, forrásszöveget nem tartalmazó állapottal védi a körszámot és a targeteket.
- A tanulói válasz és a teljes beszélgetés nem kerül adatbázisba vagy logba. A gyakorlat csak rövid életű böngésző-/kérésállapot; legfeljebb egy ismétlési dátumot hoz előrébb szerveroldalon, ha ugyanazzal a mentett kifejezéssel ismételten gond van.
- A szerepjáték teljes értékűen szöveges. M10 nem ad TTS-t, külön hangos szerepjáték-archívumot vagy új STT-rendszert.

A `RobotCoach` a központi assetmappingből használja a `public/robot/coach-*.mp4` fájlokat. A videók némák, inline játszanak, a siker/lezárás nem loopol, csökkentett mozgás vagy médiahiba esetén `/robot.png` a fallback. A Higgsfield csak fejlesztési, build-time generátor: nem fut felhasználói kéréskor és kulcsai nem részei a Cantu runtime-nak. Biztonságos előnézet:

```powershell
python generate_assets_v2.py --coach --dry-run
python generate_assets_v2.py --coach --only welcome,challenge,success --dry-run
```

Valós generálás helyi `HF_API_KEY_ID` / `HF_API_KEY_SECRET` változókat igényel és kreditet használ; ezek értékét tilos commitolni.

## Milestone 11 — public beta hardening

A `/privacy`, `/terms` és `/acceptable-use` útvonalak magyar, jogi felülvizsgálatra váró béta-tervezetek. A személyes térből a felhasználó forráskímélő JSON-exportot kérhet, illetve `TÖRLÉS` megerősítéssel végleg törölheti Cantu-fiókját és a hozzá tartozó privát alkalmazásadatokat. A paid/mutating route-ok same-origin, méret-, auth-, timeout- és normalizált hibahatárral működnek; a Practice Lab használati/replay guardja atomikus PostgreSQL-határ.

Telepítés előtt futtasd:

```bash
npm run readiness:production
```

A parancs külön `PASS`, `WARN`, `BLOCK` állapotot ad a policy route-okra, production mockokra, Practice signing secretre, kapcsolati adatra és env-alakra. Nem jelent jogi jóváhagyást és nem hív élő szolgáltatót. A részletes retention, provider-, biztonsági és deployment anyag a [`docs/public-beta`](docs/public-beta) mappában van. Production env-ek: browser-safe Supabase URL/publishable key; server-only Supabase secret, OpenAI key és külön `PRACTICE_STATE_SECRET`; a `CANTU_E2E_*` és Higgsfield kulcsok kizárólag fejlesztésiek. Tényleges deployment és M12 billing nincs implementálva.

## Adatvédelem és perzisztencia

- nincs Supabase Storage, audio bucket, fájlrendszeres mentés vagy nyilvános audio URL;
- a szerver a rövid klipet memóriában adja tovább az STT-szolgáltatónak, majd a kérés életciklusával elengedi;
- nyers audio, waveform, teljes fájl és provider raw payload nem kerül adatbázisba vagy logba;
- a tanulói shadowing-felvétel is kizárólag a pillanatnyi böngésző/server/STT kérés-életciklusban létezik, és nem kerül tartós tárba;
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

Az M4 migráció tulajdonoshoz kötött, validált RPC-kkel kezeli az STT-életciklust, és privát-alfa 20 kísérlet/óra korlátot alkalmaz. Az M5 additív migráció külön, 10 elemzés/óra guardot, futó-kérés deduplikációt és session/fingerprint/schema/prompt/model kötésű privát cache-t ad. Az M7 migráció ugyanebben a metaadat-táblában külön `pronunciation` stage-et és 15 próbálkozás/óra guardot ad; csak provider-, állapot-, latencia- és normalizált hibakód kerül bele, hang vagy összehasonlított szöveg nem. A böngésző nem írhat `processing_attempts` vagy `learning_results` rekordot; az elemzési RPC-k kizárólag a szerveroldali Supabase secret szerepkörének elérhetők. Minden alkalmazástábla RLS-védett. A `songs`, `recognition_attempts`, `lyrics_versions`, `lessons`, `user_songs` és `user_song_progress` legacy struktúraként megmarad, de az aktív BYOC runtime nem használja.

## Környezeti változók

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
SPEECH_TO_TEXT_PROVIDER=openai
LANGUAGE_ANALYSIS_PROVIDER=openai
LANGUAGE_ANALYSIS_MODEL=gpt-5.6-terra
CONVERSATION_PRACTICE_PROVIDER=openai
CONVERSATION_PRACTICE_MODEL=gpt-5.6-terra
```

Az `OPENAI_API_KEY` és a `SUPABASE_SECRET_KEY` kizárólag szerveroldali változó; soha ne kapjanak `NEXT_PUBLIC_` prefixet. A Supabase secret csak az ellenőrzött eredményíró RPC-khez és az aláírt gyakorlóállapothoz kell, a kliensben nem szerepel. Ugyanaz az OpenAI-kulcs szolgálja ki az STT-, elemző- és gyakorlóadaptert; nincs második providersecret.

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

A unit/component/E2E tesztek determinisztikus `SpeechToTextProvider`, `LanguageAnalysisProvider`, `PronunciationFeedbackProvider` és `ConversationPracticeProvider` implementációt, valamint generált hangot használnak, ezért nem költenek OpenAI-kreditet. A Playwright mockok csak nem-production környezetben, `CANTU_E2E_STT_MOCK=1`, `CANTU_E2E_ANALYSIS_MOCK=1` és `CANTU_E2E_PRACTICE_MOCK=1` mellett aktiválhatók. A tesztek külön ellenőrzik a strict sémát, forrásidézet-előfordulást, egyszeri szemantikai retryt, prompt-injekciós elválasztást, toolmentességet, owned targeteket és az RLS/service-role írási határt.

Valós elemzési smoke teszthez állíts be saját, ignorált `.env.local` fájlban `OPENAI_API_KEY` értéket, valamint a helyi vagy felhős Supabase publikus és szerver-secret változóit. Egy hitelesített fiókkal elemezz egy saját, rövid olasz mondatot pontosan egyszer. Ne használj dalszöveget, könyv- vagy filmidézetet; kulcsot, nyers provider-választ vagy promptot ne írj logba és ne commitolj.

Egy már futó, teszt-auth-tal indított helyi szerver ellen a reprodukálható böngészős smoke parancs:

```bash
CANTU_SMOKE_BASE_URL=http://localhost:3011 npm run smoke:analysis
```

A script kizárólag biztonságos modell/latencia/token- és strukturális darabszámot ír ki; forrást, promptot, kulcsot vagy raw választ nem.

## Kifejezetten halasztva

Nincs TTS, új fonéma- vagy native-likeness pontozás, biometrikus beszélőazonosítás, érzelem-/személyiségkövetkeztetés, automatikus phrasebook-mentés, végtelen általános beszélgetős tutor, további nyelvpár, nyilvános megosztás, social feature, XP/streak/gamifikációs gazdaság, billing, lyrics API, zeneazonosítás vagy teljes fájlos/szekvenciális transzkripció. A public-beta deployment/compliance hardening M11-re marad.
