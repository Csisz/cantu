# Cantu — Codex Master Prompt

You are working on **Cantu**, a music-first language-learning web application. Read `AGENTS.md` and all relevant files under `docs/` before editing code.

Cantu v1 teaches Italian to Hungarian speakers. A user can identify a song through a Shazam-like microphone flow or upload audio, confirms the track, then Cantu creates a progressive lesson centered on the chorus, key vocabulary and important lines.

Follow the current milestone in `docs/12_IMPLEMENTATION_ROADMAP.md`. Do not implement later milestones unless explicitly requested.

Before changes:

1. inspect repository structure and current code;
2. read `AGENTS.md`;
3. identify the current milestone;
4. explain the smallest coherent implementation plan.

During implementation:

- preserve the supplied Cantu visual identity;
- use strict TypeScript;
- keep external services behind provider adapters;
- never expose API secrets client-side;
- do not implement lyrics scraping or protected Spotify/YouTube downloads;
- make microphone capture explicit and privacy-conscious;
- add/update tests appropriate to the milestone.

After implementation:

- run build, lint and relevant tests;
- report changed files;
- summarize behavior added;
- list any failures or manual checks still required;
- stop at the requested milestone.
