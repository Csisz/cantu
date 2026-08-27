# 20 — Migration from Song-Centric Cantu

## Why the pivot

The original product relied on obtaining and teaching from commercial song lyrics. That creates a difficult licensing dependency for a small commercial product.

The new direction preserves the strongest Cantu insight — authentic language is more memorable — while moving source selection to the user.

## What survives unchanged

- Cantu brand;
- robot;
- visual design;
- Next.js/App Router architecture;
- responsive/accessibility work;
- Supabase/Auth/RLS foundation;
- input/confirmation mental model;
- provider-adapter philosophy;
- Hungarian UI + Italian learning focus.

## Semantic replacements

| Old v2 concept | New v3 concept |
|---|---|
| Song | Learning source/session |
| Music recognition | Speech transcription / source input |
| Candidate song | Transcript/source candidate |
| Confirm song | Verify transcript/source |
| Lyrics | Verified user-provided source text |
| Song lesson | Learning analysis/result |
| Song library | Learning history / phrasebook |
| Full upload | Local audio + selected excerpt |

## Code migration principle

Do not rewrite everything in one destructive PR/task.

Sequence:

1. change user-facing product semantics;
2. build Input Studio locally;
3. introduce generalized database model;
4. migrate runtime reads/writes;
5. remove legacy song-specific tables/components only when no longer referenced.

## Legacy documentation

Older `Cantu_Project_Sources_v2` documents may remain archived for history, but coding agents must use v3 when instructions conflict.
