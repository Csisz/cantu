# 05 — Technical Architecture

## Recommended web stack

- **Next.js 16 / App Router**
- **TypeScript**
- **React**
- **Tailwind CSS** or the existing CSS design translated carefully
- **Supabase** for PostgreSQL, Auth and Storage
- **Vercel** for the web deployment
- **OpenAI** for structured pedagogical generation and optional audio processing
- **Music recognition adapter**: AudD first spike, ACRCloud alternative
- **Lyrics adapter**: licensed provider, e.g. Musixmatch subject to commercial terms

## High-level architecture

```text
Browser
  ├─ Marketing Landing
  └─ /app
      ├─ Listen (MediaRecorder)
      ├─ Upload
      ├─ Confirmation
      ├─ Lesson Player
      └─ Library / Progress

Next.js Server/API
  ├─ Auth/session
  ├─ Recognition orchestration
  ├─ Song canonicalization
  ├─ Lyrics orchestration
  ├─ AI lesson generation
  ├─ Progress APIs
  └─ provider adapters

Supabase
  ├─ Postgres
  ├─ Private storage
  └─ Auth

External
  ├─ Music Recognition Provider
  ├─ Lyrics Provider
  └─ OpenAI
```

## Recognition request flow

1. Browser records a short Blob.
2. Browser posts it to a Cantu server endpoint or short-lived private object.
3. Server holds provider secret.
4. Server sends clip to recognition provider.
5. Server validates response with schema.
6. Server returns normalized candidate only.
7. Raw recording is discarded.

For small recognition snippets, direct server multipart processing is acceptable. Large full-song uploads should use direct private storage upload rather than routing the entire file through a serverless function.

## Full audio upload

For larger files use resumable/direct-to-storage upload with signed access. Keep storage private. Do not expose public bucket URLs for user audio.

## Background processing

Initial MVP can use a database job state + server actions/API polling if processing completes comfortably. If tasks become long or unreliable, introduce a proper durable queue/workflow system rather than chaining fragile serverless requests.

Suggested state machine:

`created → identifying → awaiting_confirmation → fetching_lyrics → generating → ready | failed`

## Provider modules

```text
src/lib/providers/
  recognition/
    types.ts
    audd.ts
    acrcloud.ts        # optional later
  lyrics/
    types.ts
    musixmatch.ts      # if selected
  ai/
    lesson.ts
```

## Environment variables

Never expose provider tokens to the browser.

Examples:

- `SUPABASE_SERVICE_ROLE_KEY`
- `AUDD_API_TOKEN`
- `ACRCLOUD_*` only if used
- `LYRICS_PROVIDER_API_KEY`
- `OPENAI_API_KEY`

Only public Supabase browser keys intended for frontend use may have `NEXT_PUBLIC_` prefixes.

## Caching

Separate user ownership/progress from canonical song processing.

If 100 users choose the same track, Cantu should avoid paying for 100 identical metadata/lesson jobs when licensing/product rules allow reuse.

Use:

- canonical songs table;
- lyrics version/hash;
- generated lesson version;
- prompt/schema version;
- language-pair key.
