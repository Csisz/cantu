# Cantu

Cantu egy zene-központú nyelvtanuló alkalmazás magyar anyanyelvű olasztanulóknak.

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
- `/app` — mock dalfelismerés, fiókbelépés és a saját dalok alapja;
- `/auth/confirm` — Supabase e-mail-megerősítési végpont.

Supabase-konfiguráció nélkül a landing és a teljes mock Listen/Upload bemutató továbbra is működik. A fiók- és perzisztenciafelület ilyenkor biztonságos konfigurálatlan állapotot mutat.

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

## Milestone 1 határa

Ebben a mérföldkőben Supabase Auth, migrációk, RLS, valamint a saját dalok/haladás perzisztenciaalapja készült el. A dalfelismerés és a fájlfeltöltés továbbra is teljesen helyi mock. Nincs mikrofonrögzítés, audio Storage, felismerési provider, dalszöveg, AI, lesson generation vagy billing.
