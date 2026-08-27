# 21 — STT & Language-AI Provider Evaluation

## Principle

Choose providers based on real Cantu benchmark data and current contractual/privacy terms, not brand familiarity.

## Speech-to-text benchmark

Build an Italian test set across:

- clean native speech;
- conversational speed;
- regional accents;
- background music;
- noisy room;
- phone/video playback;
- 5s / 15s / 30s excerpts;
- colloquial language;
- names/foreign words.

Track:

- word/transcript accuracy;
- meaning-critical errors;
- latency;
- confidence/segment metadata usefulness;
- supported audio formats;
- cost/request;
- max request limits;
- EU/data-transfer implications.

## Language-analysis benchmark

Evaluate on verified Italian snippets for:

- natural Hungarian meaning;
- idiom accuracy;
- chunk usefulness;
- grammar relevance;
- register/slang accuracy;
- hallucination rate;
- ability to obey “do not continue/reconstruct source” constraint;
- structured-output reliability;
- cost;
- latency.

## Privacy/contract gate

Before production use of any provider, verify current terms for:

- API input retention;
- training/model-improvement use;
- opt-out/data controls;
- DPA;
- subprocessors;
- data location/transfers;
- deletion;
- security incident commitments;
- commercial rights to generated output;
- rate limits/pricing.

Do not copy provider marketing claims into Cantu privacy copy without validating the applicable API product/contract.

## Adapter requirement

UI/domain code must remain provider-independent so a provider can be swapped without redesigning the product.
