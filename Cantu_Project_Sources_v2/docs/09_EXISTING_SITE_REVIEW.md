# 09 — Existing Site Review

## Supplied project reviewed

The original Cantu ZIP contains:

- `index.html`
- `robot.png`
- `robot_meadow.png`
- background PNG assets;
- hero/upload/dance MP4 assets;
- asset metadata/generation helper.

The `index.html` is a polished single-page marketing prototype (~624 lines) with GSAP-style scroll/motion concepts, a robot hero, “how it works”, karaoke demo, feature list, language section and CTA.

## What is strong

- the robot gives the product a recognizable character;
- the hero immediately connects music and learning;
- the karaoke demo makes the idea understandable;
- large typography and animation create a premium feel;
- Italian-first positioning is already visible;
- the site has a coherent story rather than a generic SaaS grid.

## What should change

### 1. Rename `LyricLingo` → `Cantu`

Current HTML contains the old name in title, brand, alt/ARIA text and footer. Replace consistently.

### 2. Replace “Válassz nyelvet” in the main 3-step story

For v1 there is no meaningful language choice.

Suggested steps:

1. **Hallgasd meg vagy töltsd fel**
2. **Cantu felismeri a dalt**
3. **Tanuld meg a refrént és a fontos sorokat**

### 3. Add Shazam-like recognition to the hero

The hero must no longer imply that a file is mandatory.

Primary CTA recommendation:

- `Hallgasd meg`

Secondary:

- `Feltöltöm a dalt`

### 4. Separate marketing and application

Preserve the landing style at `/` but build the actual product under `/app`.

### 5. Video aspect ratio mismatch

The HTML comments describe hero videos as 16:9, but the supplied assets include 1660×1244 files (approximately 4:3) for `hero_idle`, `hero_sing`, and `wave_upload`. With a 16:9 cover container, crop behavior can cut off parts of the robot.

`dance_learn.mp4` is approximately 16:9 (1916×1080).

Fix by either:

- re-rendering hero/upload media in true wide format; or
- designing containers/object positioning around their real ratio.

Do not “fix” this by stretching the video.

### 6. App accessibility/performance

When migrating to Next.js:

- lazy-load noncritical media;
- provide poster/fallback images;
- respect reduced motion;
- keep keyboard focus visible;
- ensure CTA/buttons are actual interactive elements;
- reduce animation intensity in `/app`.

## Recommendation

Do **not** discard this page. Use it as the visual foundation for the Cantu landing experience, but rebuild it as maintainable components before layering in real product state.
