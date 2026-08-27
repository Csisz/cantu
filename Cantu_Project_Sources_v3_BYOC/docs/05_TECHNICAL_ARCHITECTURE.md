# 05 — Technical Architecture

## Recommended stack

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- existing Cantu CSS/design system
- Supabase for PostgreSQL/Auth
- Vercel for deployment
- replaceable Speech-to-Text provider
- replaceable Language Analysis provider

## High-level architecture

```text
Browser
  ├─ Marketing landing
  └─ /app
      ├─ Listen
      ├─ Audio file Input Studio
      │   ├─ local file
      │   ├─ local waveform
      │   └─ local <=30s selection
      ├─ Text input
      ├─ Source verification
      ├─ Learning result
      └─ Phrasebook / progress

Next.js Server
  ├─ Auth/session
  ├─ transient audio processing endpoint
  ├─ STT orchestration
  ├─ verified-source analysis orchestration
  ├─ persistence-safe derived learning data
  └─ provider adapters

Supabase
  ├─ Auth
  ├─ Postgres
  └─ no default raw-audio archive

External
  ├─ Speech-to-Text provider
  └─ Language Analysis provider
```

## Important architecture change from v2

Global song identity, lyrics retrieval and song canonicalization are no longer the core pipeline.

The core identity is a **user-owned learning session based on a short verified source**.

## Audio-file flow

```text
Local file
  ↓
Browser-only decode/waveform
  ↓
User selects <=30 seconds
  ↓
Browser extracts clip
  ↓
POST selected clip only
  ↓
Server validates duration/MIME/size
  ↓
STT provider
  ↓
Normalized transcript candidate
  ↓
Raw clip discarded
```

## Text flow

```text
Typed/pasted text
  ↓
Client/server length validation
  ↓
User confirmation
  ↓
Italian validation
  ↓
Language analysis provider
```

## Server endpoints — future sketch

```text
POST /api/transcriptions
POST /api/learning/analyze
POST /api/learning/:sessionId/save
POST /api/learning/:sessionId/progress
```

Do not expose provider secrets client-side.

## Provider modules

Conceptually:

```text
lib/providers/
  speech/
    types.ts
    provider-a.ts
  analysis/
    types.ts
    provider-a.ts
```

UI must depend only on normalized types.

## Browser audio processing

Use browser APIs/libraries only as needed for:

- duration inspection;
- waveform peaks;
- local playback;
- range selection;
- extracting selected clip.

Avoid uploading a full audio file to generate a waveform.

## Background processing

For short <=30s STT and compact text analysis, request/response orchestration may be enough initially.

If processing becomes slow/unreliable, introduce durable jobs later rather than fragile chained serverless calls.

## Deployment model

Recommended:

```text
Local development
  ├─ Next.js dev
  └─ local Supabase
       ↓ migrations
GitHub main
       ↓
Vercel production + Supabase cloud
```

Do not develop day-to-day directly against production data.
