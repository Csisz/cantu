# Vercel + Supabase public beta deployment runbook

## Környezeti változók

Browser-safe: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Server-only: `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `PRACTICE_STATE_SECRET`, provider/model változók, `APP_ORIGIN`, `PUBLIC_CONTACT_EMAIL`.

Development/test-only: `CANTU_E2E_*`; Higgsfield `HF_API_KEY_ID` / `HF_API_KEY_SECRET` kizárólag a helyi `generate_assets_v2.py` eszközhöz, nem Vercel runtime env.

## Adatbázis

1. `supabase link` (projektazonosítót ne commitolj).
2. `supabase db push --dry-run`.
3. Migrációlista ellenőrzése, majd `supabase db push`.
4. RLS/pgTAP, backup schedule és plan szerinti PITR ellenőrzése.

## Auth és e-mail

Állítsd be a production Site URL-t, szűk redirect allowlistet, confirmation viselkedést, jelszó- és Auth rate limiteket. A lokális Mailpit nem production. Publikus béta előtt egyedi SMTP/provider és kézbesítési monitoring szükséges.

## Hosting

Vercel env scope-ok, Deployment Protection, log retention, funkciórégió és DPA/subprocessors ellenőrzendők. Futás előtt: `npm run readiness:production`, majd teljes build/E2E. A repository nem jelent tényleges deploymentet vagy jogi jóváhagyást.
