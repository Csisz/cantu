# Cantu

Cantu egy Bring Your Own Content nyelvtanuló alkalmazás magyar anyanyelvű olasztanulóknak. Rövid, valódi olasz hang- vagy szövegforrásból épít majd megértési és gyakorlási útvonalat.

> **Hallgasd. Olvasd. Értsd meg. Mondd ki.**

A `Cantu_Project_Sources_v3_BYOC` forráscsomag felülírja a régebbi, dal- és dalszöveg-központú dokumentációt, ahol a két irány ütközik.

## Előfeltételek

- Node.js 22+
- npm
- Docker Desktop vagy más Docker-kompatibilis konténerkörnyezet a helyi Supabase-hez

## Alkalmazás indítása

```bash
npm install
copy .env.example .env.local
npm run dev
```

Az alkalmazás fő útvonalai:

- `/` — marketingoldal;
- `/app` — helyi Input Studio (Listen / Hangfájl / Szöveg), fiókbelépés és a személyes tanulási tér alapja;
- `/auth/confirm` — Supabase e-mail-megerősítési végpont.

Supabase-konfiguráció nélkül a landing és a teljes helyi Input Studio továbbra is működik. A fiók- és perzisztenciafelület ilyenkor biztonságos konfigurálatlan állapotot mutat.

## Milestone 2 működési határa

- A hangfájl dekódolása, hullámformája, legfeljebb 30 másodperces kijelölése és előnézete kizárólag a böngészőben történik.
- A teljes hangfájlt az Input Studio nem tölti fel, és a kijelölt részletet sem küldi el ebben a mérföldkőben.
- A szöveges forrás legfeljebb 2 000 karakter; a megerősítési és tanulási vázlat UI-helyi, nincs AI-elemzés vagy automatikus mentés.
- A Listen mód egy biztonságos interakciós előnézet: valós mikrofonrögzítés még nincs.
- Valós STT, LLM-alapú tanulási elemzés, audio Storage és általánosított perzisztencia későbbi mérföldkő feladata.

## Környezeti változók

Az `.env.local` fájlban add meg:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Mindkét változó browser-safe Supabase projektadat. Titkos vagy service-role kulcsot ne adj `NEXT_PUBLIC_` nevű változóhoz. A Milestone 1 alkalmazáskódja nem igényel service-role kulcsot.

## Helyi Supabase

```bash
npm run db:start
npm run db:reset
npm run db:test
npm run db:types
```

A `db:start` kimenetéből a helyi API URL-t és publishable kulcsot másold az ignorált `.env.local` megfelelő változóiba. A migrációk a `supabase/migrations/`, az RLS-tesztek a `supabase/tests/database/` alatt találhatók. A `db:types` az alkalmazott helyi sémából frissíti a checked-in `lib/supabase/database.types.ts` fájlt.

## Cloud Supabase bekötése

1. Hozz létre egy Supabase projektet.
2. Futtasd a `npx supabase login`, majd a `npx supabase link --project-ref <project-ref>` parancsot.
3. Ellenőrizd a migrációkat: `npx supabase db push --dry-run`, majd alkalmazd: `npx supabase db push`.
4. A projekt Connect paneljéből add meg a Project URL-t és a publishable kulcsot a deployment környezetben.
5. Állítsd be a production Site URL-t és engedélyezd a `/auth/confirm` redirectet.
6. Az e-mailes regisztráció Confirm signup sablonjában használd a szerveroldali linket: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

Valódi projektkulcsot vagy adatbázis-jelszót ne commitolj.

## Ellenőrzés

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run db:test
```

Az E2E auth-forgatókönyv kizárólag a Playwright fejlesztői szerverén engedélyezett, szerveroldali teszt-cookie-t használ. Nem kapcsolódik cloud projekthez és production buildben nem aktiválható.

## Megőrzött Milestone 1 alap

A Supabase Auth, migrációk, RLS és a korábbi könyvtár/haladás perzisztenciaalapja változatlanul megmarad. A látható felület már „Saját tanulásaim” néven hivatkozik rá, de a dal-központú adatbázisséma migrációja szándékosan a következő mérföldkőre marad. Nincs mikrofonrögzítés, audio Storage, STT provider, AI-elemzés, nyilvános megosztás vagy billing.
