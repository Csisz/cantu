# 14 — Decisions & Open Questions

## Decisions made

- Product name remains **Cantu**.
- First learner: Hungarian speaker learning Italian.
- New core: Bring Your Own Content.
- Primary inputs: Listen, Audio file, Text.
- Audio-file full content stays client-side where feasible.
- Only selected <=30s clip is intended for later server processing.
- Text input is first-class; initial limit 2,000 characters.
- Audio transcript must be confirmable/editable before teaching.
- Cantu teaches through meaning + chunks + contextual grammar + active use.
- No lyrics catalogue dependency.
- No scraping protected text sites.
- No public user-content sharing in MVP.
- Raw audio transient by default.
- Original source text not persistently stored by default.
- No claim that short duration is automatically copyright-safe.
- Existing visual identity and Supabase foundation are preserved.

## Open product questions

1. Should anonymous users receive one complete analysis before account creation?
2. Which STT provider best handles Italian speech plus music/noisy backgrounds?
3. Which language-analysis provider gives the best HU↔IT pedagogical quality/cost?
4. Is 30 seconds the best UX/cost limit, or should production alpha use 20 seconds?
5. Should text input remain 2,000 characters or be lower for public beta?
6. Which derived learning data should be saved automatically vs only on user action?
7. Should the user be allowed to save the verified source text privately? Default recommendation: no for MVP.
8. How should same-source sequential requests be rate-limited without excessive tracking?
9. Minimum public age policy: recommendation is to avoid targeting young children in the first public beta until the privacy/consent design is reviewed.
10. What commercial price covers STT + analysis costs while keeping free trial useful?

## Legal launch questions for counsel

1. Copyright characterization of private user-supplied audio/text processing.
2. Treatment of short protected excerpts and translations in the final UX.
3. Whether/how intermediary/hosting rules apply to actual retained data.
4. Appropriate Terms user representation/licence language.
5. Notice-and-action/contact obligations.
6. GDPR lawful bases and processor arrangements for audio/text/AI providers.
7. International transfers and provider retention.
8. Age/child-consent requirements for target market.
9. Source-retention and deletion periods.
10. Whether anti-reconstruction controls are sufficient for public launch.

None of these legal questions should be silently answered by engineering assumptions.
