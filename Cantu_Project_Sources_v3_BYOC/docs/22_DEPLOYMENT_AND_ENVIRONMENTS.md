# 22 — Deployment & Environments

## Recommended model

### Local development

- local Next.js;
- local Supabase when database work is needed;
- mock/local Input Studio before external STT/AI integration;
- migrations stored in Git.

### Production

- GitHub `main`;
- Vercel production deployment;
- dedicated Supabase cloud project;
- server-side STT/AI secrets configured in Vercel environment variables.

## Do not

- perform routine schema experimentation directly against production;
- place production secrets in `.env.example`;
- use service-role keys in browser code;
- make Preview deployments silently point at production data without an explicit decision.

## Current sequence

Recommended after Milestone 2 pivot stabilises:

1. commit/push verified Milestone 1 + 2 work;
2. create/connect Vercel project;
3. create/link Supabase cloud project;
4. dry-run and apply migrations;
5. configure browser-safe Supabase variables;
6. configure Auth site/callback URLs;
7. smoke-test signup/signin/signout in production;
8. later add STT/AI server secrets only when those milestones begin.

## Environment classes

Longer-term:

- local;
- preview/staging;
- production.

Do not add paid branching infrastructure before the product needs it.

## Secret naming

Keep current Supabase browser variables and future provider credentials separated.

Future conceptual server-only names may include:

- `SPEECH_PROVIDER_API_KEY`
- `LANGUAGE_ANALYSIS_API_KEY`

Exact names should follow chosen adapters and current provider docs.
