# 08 — Copyright, Privacy & Rights

> Product/engineering risk notes, not legal advice. Public commercial launch requires review by qualified Hungarian/EU counsel against the final production flow, contracts, Terms and Privacy Notice.

## Core principle

Cantu is designed as a **private user-initiated processing tool**, not as a service that supplies a catalogue of copyrighted works.

This architecture reduces risk but does **not** make every possible user input lawful automatically.

## Copyright rules for product design

### No numeric safe harbour assumption

Do not state or imply that:

- “30 seconds is always legal”;
- “a short excerpt is automatically free to use”;
- “speech-to-text removes copyright”.

The duration limit is a product, cost, privacy and risk-control decision.

### User-provided source model

The user brings the source. Cantu should not fetch the complete copyrighted source for them.

Examples of permitted product behaviour to design around:

- user records a short excerpt;
- user selects a short excerpt from a local audio file;
- user pastes a short text passage;
- Cantu privately processes that input for that user.

### Do not build

- a searchable lyrics database;
- a subtitle/script archive;
- a song/movie/book reconstruction feature;
- scraping of copyrighted-content websites;
- protected-media ripping/downloading;
- public sharing of source uploads;
- bulk sequential “next segment” extraction designed to reproduce a whole work.

### Translation and derivative output

Translation can implicate adaptation rights. Do not assume that changing the acquisition path from a lyrics API to STT removes this issue.

The product should therefore:

- keep processing private;
- focus on short learner-selected passages;
- avoid republishing whole works;
- avoid building a public derivative-content catalogue;
- require user rights/permission representations in Terms;
- obtain targeted legal review before commercial launch.

## Relevant EU/Hungarian legal anchors

### Reproduction rights

EU Directive 2001/29/EC Article 2 covers direct/indirect, temporary/permanent reproduction in whole or in part.

Official source:
https://eur-lex.europa.eu/eli/dir/2001/29/oj

### Temporary technical copies

Article 5(1) of Directive 2001/29/EC provides a narrow exception for transient/incidental technical copies that meet its conditions, including enabling a lawful use and having no independent economic significance.

Do not treat this as a blanket exemption for Cantu's complete commercial processing flow.

### Quotation / Hungarian law

Hungarian Copyright Act (1999. évi LXXVI. törvény) 34. § allows quotation of a work excerpt under specified conditions and to the extent justified by the purpose. The free-use provisions are not to be interpreted expansively (33. §).

Official source:
https://njt.hu/jogszabaly/1999-76-00-00

### Private copying is not the product's commercial legal basis

Hungarian private-copying rules concern natural-person private use and include limitations. Cantu should not market itself on the assumption that a user's private-copy exception automatically authorises a commercial service provider's processing.

### TDM

Directive (EU) 2019/790 Article 4 provides a text-and-data-mining exception for lawfully accessible works subject to conditions including rights reservation. Cantu should not rely on TDM alone as a complete legal basis for public translation/learning output.

Official source:
https://eur-lex.europa.eu/eli/dir/2019/790/oj

### Hosting / DSA

If Cantu stores user-provided information, the Digital Services Act hosting rules and notice-and-action obligations may become relevant depending on the service's legal classification and actual operation.

Official source:
https://eur-lex.europa.eu/eli/reg/2022/2065/oj

Do not claim hosting safe-harbour status in product documentation without legal review.

## User Terms requirements — launch gate

Before public beta, Terms should address at minimum:

- user must have the right or lawful basis to submit/process the input;
- prohibited unlawful/infringing use;
- no bulk reconstruction of protected works;
- no attempt to defeat limits;
- Cantu may remove/disable content or accounts when legally required;
- content-processing licence limited to providing the requested service;
- retention/deletion rules;
- complaint/contact procedure.

A Terms checkbox does not itself legalise otherwise unlawful processing.

## Privacy / GDPR

Audio and text may contain personal data, including data about third parties.

Design around GDPR principles such as:

- purpose limitation;
- data minimisation;
- storage limitation;
- integrity/confidentiality;
- transparency.

Official GDPR:
https://eur-lex.europa.eu/eli/reg/2016/679/oj

### Voice

Do not use voice/audio for biometric identification, identity inference, emotion inference or unrelated profiling.

Voice data is not automatically special-category biometric data merely because it is audio; biometric-data restrictions become especially relevant when processed for unique identification. Avoid this use case entirely.

### Third-party speech/messages

The product should warn users not to upload sensitive/private conversations or personal information they are not entitled to process.

Raw input should be minimised and transient.

## Retention defaults

### Raw audio

- ephemeral;
- deleted promptly after STT/processing;
- not placed in general analytics/logs;
- no long-term Supabase Storage bucket by default.

### Text

- process transiently;
- do not persist original source by default;
- if future “save source” functionality is introduced, require explicit user choice and a reviewed retention basis.

### Derived learning data

May be retained privately where needed for the user's learning service, subject to Privacy Notice and deletion controls.

## Public-content prohibition for MVP

No:

- public profiles containing source excerpts;
- public lessons generated from user source content;
- shared searchable library;
- public links exposing source audio/text.

## Compliance launch gate

Before charging public users, obtain review of:

1. actual audio/text ingestion flow;
2. client-side clipping design;
3. Terms of Service;
4. Privacy Notice and lawful bases;
5. STT/AI processor contracts and retention;
6. international data transfers;
7. DSA applicability/notice mechanism;
8. copyright guardrails and anti-reconstruction rules;
9. age policy;
10. deletion/account-rights implementation.
