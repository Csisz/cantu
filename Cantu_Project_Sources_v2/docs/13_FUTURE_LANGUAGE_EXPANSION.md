# 13 — Future Language Expansion

## v1 rule

Hard-focus the product on Italian → Hungarian in UI and QA, while representing language pair as data internally.

## Future pairs

Potential learning languages:

- English;
- German;
- French;
- Spanish;
- additional languages based on demand/licensing coverage.

Potential explanation languages can also expand beyond Hungarian later.

## Automatic source-language recognition

Future flow:

1. identify song;
2. fetch lyrics;
3. detect language with confidence;
4. tell user what was detected;
5. generate a lesson if the pair is supported;
6. otherwise offer waitlist/unsupported message.

Do not silently guess when confidence is low or songs contain mixed languages.

## Localization boundary

Keep UI localization separate from lesson language pair. Example:

- UI language: Hungarian
- explanation language: Hungarian
- song language: Italian

This prevents later architectural confusion.
