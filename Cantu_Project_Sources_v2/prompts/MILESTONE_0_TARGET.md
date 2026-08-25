# Milestone 0 — Target for Prompt Authors

Use this file when producing the first Codex CLI implementation prompt.

## Required outcome

A maintainable Next.js/TypeScript Cantu frontend that preserves the visual spirit of the supplied single-file prototype and prepares the actual app structure.

## Must include

- inspect current repository first;
- preserve original files/assets safely during migration;
- Cantu branding everywhere;
- landing route `/`;
- application shell `/app`;
- hero CTA: Listen + Upload;
- mock Listen state using microphone-looking UI but **without requesting real permission yet if the migration strategy prefers mocked state**;
- mock identifying state;
- mock candidate confirmation card;
- wrong/no-match states represented in component/state design;
- upload entry UI;
- responsive/mobile behavior;
- correct video aspect handling;
- reduced-motion behavior;
- accessibility baseline;
- componentized structure;
- no real API keys/provider integrations;
- no Supabase/OpenAI/AudD calls.

## Do not include yet

- database migrations;
- auth;
- real microphone recording;
- real recognition;
- lyrics API;
- LLM calls;
- billing.

## Completion checks

- app installs/builds;
- lint passes;
- tests appropriate to repo pass;
- no unresolved runtime console errors in primary routes;
- report exact commands executed.
