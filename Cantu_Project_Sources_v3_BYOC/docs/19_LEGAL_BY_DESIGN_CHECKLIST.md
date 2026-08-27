# 19 — Legal-by-Design Checklist

> Engineering/product checklist, not a legal opinion.

## A. Product positioning

- [ ] Cantu is described as a private language-learning processor, not a protected-content catalogue.
- [ ] Marketing does not promise access to “any song lyrics”, scripts, books or other protected works.
- [ ] Marketing does not claim “30 seconds is legal”.
- [ ] User brings the source material.

## B. Audio architecture

- [ ] Full local audio remains on the user's device where feasible.
- [ ] Waveform is generated locally.
- [ ] Only user-selected short clip leaves the browser.
- [ ] Server validates actual duration/size/MIME.
- [ ] Raw clip is transient.
- [ ] Raw clip is deleted promptly after processing.
- [ ] Raw audio is excluded from analytics/logging.
- [ ] No background microphone capture.

## C. Text architecture

- [ ] Short-text limit enforced client and server side.
- [ ] No bulk document endpoint in MVP.
- [ ] Original source text is not persisted by default.
- [ ] No public source-text sharing/indexing.

## D. Copyright abuse controls

- [ ] No lyrics/site scraping.
- [ ] No protected-media download/ripping.
- [ ] No “next segment” automation for reconstructing a complete work.
- [ ] Rate/usage limits exist.
- [ ] Model is instructed not to continue or reconstruct source beyond supplied input.
- [ ] Terms prohibit infringing/bulk reconstruction use.

## E. User rights / Terms

Before public launch:

- [ ] user submission representation reviewed by counsel;
- [ ] content-processing licence limited to providing Cantu service;
- [ ] prohibited-use rules;
- [ ] account/content action rights;
- [ ] complaint/contact process;
- [ ] retention rules;
- [ ] governing-law/consumer terms review.

## F. Privacy / GDPR

- [ ] Privacy Notice describes audio/text processing.
- [ ] lawful bases reviewed for each processing purpose;
- [ ] purpose limitation documented;
- [ ] data minimisation documented;
- [ ] retention periods defined;
- [ ] deletion/account deletion works;
- [ ] providers/subprocessors listed as required;
- [ ] processor agreements reviewed;
- [ ] international transfer mechanism reviewed;
- [ ] no biometric identification/emotion inference;
- [ ] no source data used for unrelated training by Cantu.

## G. Third-party processors

For every STT/AI provider verify:

- [ ] API data retention terms;
- [ ] training/data-use terms;
- [ ] DPA availability;
- [ ] security certifications/materials appropriate to stage;
- [ ] region/data-transfer implications;
- [ ] incident terms;
- [ ] deletion behaviour;
- [ ] cost/usage limits.

## H. DSA / notice handling

Before public launch, obtain counsel view on whether the actual service is a hosting/intermediary service and which obligations apply.

If applicable:

- [ ] electronic notice mechanism;
- [ ] legal contact point;
- [ ] response workflow;
- [ ] recordkeeping/transparency obligations assessed.

## I. Age policy

- [ ] target age documented;
- [ ] under-age consent/privacy obligations reviewed before targeting children;
- [ ] marketing and UX match age policy.

## J. Public commercial launch gate

Do not mark “legal-ready” until:

- [ ] production flow is implemented and reviewed;
- [ ] Terms reviewed;
- [ ] Privacy Notice reviewed;
- [ ] processor contracts reviewed;
- [ ] copyright guardrails reviewed;
- [ ] retention/deletion tested;
- [ ] security/RLS tests pass;
- [ ] complaints/notice process exists where required.
