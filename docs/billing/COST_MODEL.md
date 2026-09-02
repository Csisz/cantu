# Provider cost model — verification worksheet

Do not treat this file as current pricing. Re-check official provider pricing and configured models immediately before commercial launch.

| Product operation | Cost driver | User accounting |
|---|---|---|
| Transcription | short selected audio duration / configured STT model | one reserved transcription operation after validation |
| Learning analysis | one structured Responses API generation, with one bounded semantic correction only when needed | one operation; cache hits cost zero |
| Pronunciation feedback | one short learner-audio STT request | one operation after explicit feedback request |
| Practice Lab | one Responses API call per explicit turn, max five | one operation per turn |
| Review / phrasebook / saved lesson | deterministic local/server logic | zero AI operations |

Hourly abuse limits and monthly plan quotas are separate. Commercial limits are provisional and must be tuned against measured latency, failure rate and provider invoices. Cantu does not expose token accounting as a customer billing unit.
