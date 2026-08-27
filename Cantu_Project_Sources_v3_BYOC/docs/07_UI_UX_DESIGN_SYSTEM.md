# 07 — UI/UX Design System

## Design character

Cantu should remain:

- musical;
- warm;
- optimistic;
- intelligent;
- youthful without feeling childish;
- calm during learning;
- expressive on the landing page.

## Robot role

Keep the robot as a guide.

Use it purposefully:

- hero: personality;
- listening: attentive;
- source confirmation: reassuring;
- learning success: small celebration;
- pronunciation: coach.

Do not place it in every card.

## New landing positioning

Primary headline direction:

**Értsd meg az olaszt, amivel találkozol.**

Primary promise:

**Hallgasd. Olvasd. Értsd meg. Mondd ki.**

Primary actions:

- `🎧 Hallgasd`
- `🎵 Hangfájl`
- `📝 Szöveg`

Supporting copy:

> Egy mondat a videóból, egy üzenet, egy hangrészlet vagy egy kifejezés, amit nem értesz — Cantu tanulnivalóvá alakítja.

## Input Studio

The `/app` home should feel like a studio, not a dashboard.

Three input cards/tabs should be obvious but not overwhelming.

### Audio waveform screen

Signature interaction:

- large waveform;
- selected region visually distinct;
- draggable handles;
- keyboard alternatives;
- start/end timestamps;
- selection duration;
- max 30-second note;
- local play/pause;
- `Ezt a részt értsük meg` primary action.

Do not present the 30-second limit as a legal guarantee.

### Text screen

- generous textarea;
- friendly character counter;
- sample placeholder that is original/generic, not copyrighted lyrics;
- clear privacy/source microcopy;
- `Ezt értsük meg` action.

## Verification screen

For STT:

**Ezt hallottam**

- transcript in an editable surface;
- uncertainty visually marked where possible;
- primary: `Igen, pontos`;
- secondary: `Javítom`;
- retry available.

For text:

**Ezt fogjuk elemezni**

Show exact submitted passage.

## Learning result visual hierarchy

1. **Mit jelent?**
2. **Ezt érdemes megjegyezni**
3. **Miért így mondják?**
4. **Mondd ki te is**
5. **Emlékszel?**

One obvious next action per card.

## Accessibility

- semantic range/slider controls for selection;
- keyboard selection adjustments;
- waveform must have a text/time representation;
- recording status via `aria-live`;
- focus visible;
- reduced motion respected;
- no essential information encoded only by colour;
- touch targets appropriate on mobile.
