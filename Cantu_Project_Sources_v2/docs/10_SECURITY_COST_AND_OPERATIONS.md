# 10 — Security, Cost & Operations

## External API secrets

Recognition, lyrics and OpenAI credentials are server-only. Never ship them in browser bundles.

## Abuse risks

Protect paid endpoints against:

- anonymous recognition spam;
- repeated regeneration of the same lesson;
- huge uploads;
- unsupported file types;
- malicious multipart payloads;
- rapid automated retries.

## Suggested limits

During private alpha:

- short recognition clip max duration/size;
- audio upload max size and supported MIME allowlist;
- per-user recognition attempts/hour;
- per-user generated songs/day;
- idempotency on lesson generation;
- timeout/retry budgets for providers.

## Cost sequence

Cheap validation should happen before expensive work:

1. capture/input validation;
2. music recognition;
3. user confirmation;
4. canonical song cache lookup;
5. lyrics lookup;
6. lesson cache lookup;
7. AI generation;
8. optional transcription/alignment.

## Observability

Track operational metrics without storing sensitive audio:

- recognition provider latency;
- match/no-match/reject rate;
- processing stage latency;
- provider errors;
- AI token/cost estimate;
- cached vs newly generated lessons;
- failure category.

## User-facing recovery

Each failure should map to an action:

- `Nem hallottam elég tisztán` → retry;
- provider unavailable → upload/manual fallback;
- non-Italian song → explain current language limitation;
- lyrics unavailable → offer another song / controlled fallback;
- generation failed → safe retry without double-charging.
