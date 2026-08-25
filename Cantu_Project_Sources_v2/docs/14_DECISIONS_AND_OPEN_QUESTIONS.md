# 14 — Decisions & Open Questions

## Decisions already made

- Product name: **Cantu**.
- First learner: Hungarian speaker learning Italian.
- Music-first, progressive learning rather than full-song memorization by default.
- Existing landing visual direction is retained/evolved.
- Actual learning app separated from marketing route.
- Listen/Shazam-like identification is a first-class feature.
- User must confirm recognized song before downstream processing.
- Licensed/approved lyrics source preferred over scraping.
- Provider-independent architecture.
- Do not download protected Spotify/YouTube audio.

## Recommended technical decisions

- Next.js + TypeScript + Supabase + Vercel.
- AudD as first recognition spike, behind adapter.
- ACRCloud kept as alternative benchmark.
- ShazamKit reserved for future native app evaluation.

## Open questions to decide during implementation/business validation

1. Which commercial lyrics provider/contract supports our exact educational display and translation model?
2. Does Cantu require account creation before the first free song, or after the first preview?
3. How many free song lessons should an alpha user receive?
4. What uploaded-audio retention period is necessary?
5. Do we allow manual title/artist search in the very first public MVP?
6. Should Deep Dive be free or become the first paid boundary?
7. Which recognition provider wins on Italian catalogue accuracy/cost after a benchmark set?
8. Should a previously generated lesson be globally reusable, or user-specific because of future proficiency levels?

None of these questions should block Milestone 0.
