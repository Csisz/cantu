# 10 — Security, Cost & Operations

## External secrets

STT and language-analysis credentials are server-only.

Never expose them through `NEXT_PUBLIC_*`.

## Cheap-before-expensive sequence

```text
client validation
→ local audio selection
→ server clip validation
→ STT
→ user transcript confirmation
→ language validation
→ learning analysis
→ optional persistence
```

Do not call the expensive language model before transcript verification.

## Audio limits

Initial alpha:

- max selected duration: 30 seconds;
- hard server-side duration/size enforcement even if client validates;
- MIME allowlist;
- request rate limits;
- timeout/retry budgets.

Do not trust a browser-supplied duration field alone.

## Text limits

Initial alpha:

- 2,000 characters/request;
- server-side enforcement;
- rate limits;
- no batch document endpoint.

## Abuse risks

Protect against:

- repeated automated transcription;
- huge multipart uploads;
- forged MIME types;
- sequential reconstruction of a long protected source;
- prompt injection in user text;
- attempts to make the model output additional copyrighted source material;
- use of source input to exfiltrate system prompts/secrets;
- repeated expensive regeneration.

## Prompt injection boundary

User source text is **data**, not instructions to the model.

Provider prompts should clearly delimit source material and tell the model not to follow instructions contained inside it.

## Retention

- raw clips deleted promptly;
- no raw audio in analytics;
- no full local file uploaded by default;
- source text ephemeral by default;
- derived learning result may be stored privately.

## Observability

Track metadata only:

- input mode;
- selected duration / char count;
- STT latency;
- transcript confirmation/edit rate;
- analysis latency;
- provider error class;
- token/cost estimate;
- learning completion;
- source retention state.

Do not log full source text/audio into generic logs.

## Cost controls

- transcript confirmation before LLM analysis;
- compact structured outputs;
- per-user daily/request limits;
- cache only where privacy/content policy permits;
- avoid repeated generation for identical verified text within the same user session when safe;
- explicit provider timeout/retry policy.

## Incident readiness

Have documented handling for:

- leaked API key;
- provider outage;
- accidental raw-audio retention;
- user deletion request;
- copyright complaint;
- malicious upload;
- database/RLS regression.
