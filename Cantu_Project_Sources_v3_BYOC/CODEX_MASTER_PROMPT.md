# Cantu — Codex Master Prompt v3

You are working on **Cantu**, a Bring Your Own Content language-learning web application.

Cantu v1 helps Hungarian speakers understand and learn Italian from short audio and text they encounter themselves.

Read the root `AGENTS.md` and the current v3 source pack before editing.

## Current product loop

`Listen / Audio file / Text → confirm source/transcript → understand → notice useful chunks → contextual grammar/register → say → recall`

## Non-negotiable legal/privacy architecture

- no copyrighted content catalogue;
- no lyrics scraping;
- no claim that 30 seconds is automatically copyright-safe;
- full local audio stays client-side where feasible;
- only selected short clip may later leave the browser;
- raw audio transient by default;
- private user content only;
- no public sharing/search/indexing in MVP;
- no automatic reconstruction of long protected works;
- source text/audio not used for unrelated model training;
- public commercial launch requires targeted legal review.

## Engineering discipline

Before changes:

1. inspect repository and git status;
2. identify pre-existing uncommitted work and preserve it;
3. read the relevant v3 docs;
4. inspect current Next.js 16 docs from the installed package where API conventions matter;
5. explain the smallest coherent plan internally and proceed.

During implementation:

- preserve the Cantu visual identity;
- keep strict TypeScript;
- keep Supabase server/client boundaries safe;
- keep providers replaceable;
- validate trust-boundary inputs;
- add tests appropriate to the milestone;
- do not jump ahead.

After implementation:

- run lint;
- run typecheck;
- run unit/component tests;
- run E2E tests;
- run production build;
- run `git diff --check`;
- report changed files, exact commands, remaining issues, and deferred work.
