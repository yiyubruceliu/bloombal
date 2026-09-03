---
name: Bloombal
description: Navy ink cut with ice-cyan facets — the integrity layer for AI-era assessment.
colors:
  primary: "#082848"
  navy-mid: "#0e3a66"
  steel: "#386491"
  ice: "#77cafc"
  frost: "#90d7f7"
  paper: "#eef5fa"
  paper-mist: "#f4f8fb"
  paper-deep: "#e4eef6"
  ink: "#0b2848"
  chrome-link: "#e8f4fb"
  white: "#ffffff"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "20px"
  full: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "32px"
  lg: "64px"
  nav-clearance: "70px"
typography:
  display:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "3.15rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "1.45rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Karla, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Karla, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.8rem 1.5rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.navy-mid}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.8rem 1.5rem"
  button-on-dark:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "0.8rem 1.5rem"
    typography: "{typography.label}"
  button-on-dark-hover:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "0.8rem 1.5rem"
  button-footer:
    backgroundColor: "rgba(119, 202, 252, 0.9)"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "0.8rem 1.5rem"
  nav-bar:
    backgroundColor: "rgba(8, 40, 72, 0.94)"
    textColor: "{colors.white}"
    height: "70px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.chrome-link}"
    rounded: "{rounded.md}"
    typography: "{typography.label}"
  nav-link-active:
    backgroundColor: "rgba(119, 202, 252, 0.16)"
    textColor: "{colors.ice}"
    rounded: "{rounded.md}"
  card-stat:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "2rem"
  card-stat-hover:
    backgroundColor: "rgba(255, 255, 255, 0.12)"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "2rem"
---

# Design System: Bloombal

## Overview

**Creative North Star: "Navy ink cut with ice-cyan facets"**

Bloombal reads as an integrity instrument, not a campus SaaS dashboard. The field is cool paper; the chrome is logo navy so the black-ground mark sits flush; ice cyan is the cut — hairlines, focus, trial actions on dark, the heading rule. Display type is EB Garamond; body is Karla. Photography appears only under a navy–steel wash.

The system is dense enough for institutional claims, but the first viewport stays one headline, one supporting line, one trial control, and a scroll cue. Light sections frost over paper; the statistics band and footer drop into full navy so ice type and glass cards can facet against ink.

**Key Characteristics:**
- Logo navy as chrome and ink field; ice cyan as the only bright cut
- Cool paper ground with a faint ice radial, never mint or warm cream
- Serif display / grotesque body; brand wordmark shares the display face
- Dark translucent chrome (navy glass) for bar and footer
- Ice hairlines and navy-tinted shadows instead of black drop shadows
- Hero photography locked under a navy–steel gradient wash

## Colors

Navy ink and ice cyan taken from the mark; steel bridges the hero wash; paper and ink carry long reading.

### Primary
- **Logo Navy**: Site chrome, primary trial button on paper, footer field, heading ink, and the dark end of every wash. The black-ground mark is meant to sit on this, not on white.
- **Navy Mid**: Darker stop inside the paper-field trial button gradient; hover deepen of the same family.
- **Steel**: Mid stop of the hero wash; the logo’s second plane, used as atmosphere, not as a fill for controls.

### Secondary
- **Ice Cyan**: Facet color. Hero and footer trial fills (or near-opaque ice on footer), focus rings, nav active/hover, stat numerals’ companion strokes, footer links, heading-rule highlight, scroll-wheel fill.

### Neutral
- **Cool Paper**: Page ground stop; body sits on a fixed vertical grade from mist through paper to paper-deep, with a faint ice radial in the upper corner.
- **Ink**: Default body text on paper (a hair cooler/darker than logo navy).
- **Chrome Link**: Default nav labels on navy glass.
- **Frost**: Hover fill for ice trial buttons on dark fields.
- **White**: Type and rules on navy bands; button label on paper-field navy CTAs.

### Named Rules
**The Facet Rule.** Ice cyan is a cut, not a field. Do not flood a screen with ice fill. Paper and navy carry area; ice is hairline, focus, active, and the trial control when the ground is already navy.

**The Dark Chrome Rule.** Bars, footers, and statistic bands use logo navy (opaque or 94% glass). Do not place the mark on a light or mint bar.

**The Wash Rule.** Full-bleed photography only appears under a navy-to-steel gradient. Do not show classroom or product photos as raw color fields.

## Typography

**Display Font:** EB Garamond (Georgia, serif)
**Body Font:** Karla (system-ui, sans-serif)

**Character:** Editorial serif for the institution’s voice; a clear grotesque for proof and procedure. The pairing should feel like a university instrument, not a startup wordmark stacked on Inter.

### Hierarchy
- **Display** (600, 3.15rem / 2.1rem at 768px, 1.15): Hero headline only, white on the wash, with a navy text-shadow.
- **Headline** (600, section h2, ~2rem, 1.2): Section titles in logo navy on paper; white on the statistics band.
- **Title** (600, 1.45rem): Navbar wordmark “Bloombal” in Garamond, white.
- **Body** (400, 1rem, 1.6): Karla on ink. Hero supporting line is 1.2rem at ~95% white. Stat descriptions 1.4 line-height at 90% white.
- **Label** (500–600, 1rem): Nav links, trial buttons. Active nav is 700. Hero trial is 600.

Emphasis inside body copy uses logo navy at bold, not ice and not a second display size.

### Named Rules
**The Two-Voice Rule.** EB Garamond is reserved for the wordmark and headings (h1–h3). All UI, buttons, nav, and running copy stay in Karla.

**The Ice Rule Under the Title.** Headings carry an 80×3px centered underline: ice-only fade on the hero; navy-to-ice on paper sections. Do not underline with a solid black bar or an accent block on the left.

## Layout

Fixed navy glass bar; sections clear it with 70px padding, margin, and scroll-margin. Desktop sections are tall (hero 100vh, content bands targeting ~80vh) with 4rem vertical padding and 2rem horizontal padding, centered Bootstrap containers, and 12-column rows with empty 1-column gutters on several narrative bands.

Content is two-up (image or video beside copy) on large screens; below 991px columns stack, media caps at 300px, and section heights go auto. At 768px, horizontal padding collapses toward 1rem, headings center, body justifies. At 576px, section padding tightens to 3rem / 0.5rem.

Rhythm is 8-based: 8px, 16px, 32px (2rem), 64px (4rem). The first viewport is a centered column: headline, one line, one trial control, scroll cue at the bottom of the viewport.

### Named Rules
**The First Viewport Rule.** Hero contains one Garamond headline, one supporting sentence, one trial CTA, and a scroll cue. Partner rows do not occupy the first screen (the header logo row is hidden).

## Elevation & Depth

Depth is tonal glass and navy-tinted bloom, not hard offset black shadows. Paper bands that need separation use white at 50–60% plus blur and an ice hairline. Navy bands use white at 8–12% plus blur. Motion is a 2px lift on controls and logos; statistic cards lift 10px.

### Shadow Vocabulary
- **Chrome bar** (`0 4px 24px rgba(8, 40, 72, 0.28)`): Fixed nav.
- **Navy bloom** (`0 4px 20px rgba(8, 40, 72, 0.35)` resting; `0 8px 28px rgba(8, 40, 72, 0.45)` hover): Paper-field trial button.
- **Ice bloom** (`0 4px 24px rgba(119, 202, 252, 0.35)`): Hero trial button.
- **Glass** (`0 8px 32px rgba(8, 40, 72, 0.16)`): Framed media and frosted tiles.
- **Stat glass** (`0 8px 32px rgba(0, 0, 0, 0.15)`): Statistic cards on the navy band.
- **Hero type** (`0 2px 20px rgba(8, 40, 72, 0.4)` headline; `0 1px 10px rgba(8, 40, 72, 0.3)` lede): Legibility on the photograph.
- **Mark glow** (footer only): `drop-shadow(0 0 12px rgba(119, 202, 252, 0.6))` plus a wider 24px ice glow on the large mark.

### Named Rules
**The Navy Shadow Rule.** Shadows are navy or ice, matching the object’s field. Do not use hard black offsets.

**The Glass Facet Rule.** Frosted surfaces always combine a translucent fill, an ice hairline (cyan at ~25–40% alpha), and blur (8–20px). A frosted card without the ice edge is incomplete.

## Shapes

Corners are softened instruments, not pills (except the circular icon well and the scroll-mouse capsule).

- Mark in the bar: 6px
- Nav links: 8px
- Trial buttons and rectangular partner frames: 12px
- Video frame and statistic cards: 16px
- Scroll mouse: 20px capsule
- Statistic icon well: circle, 80px, 2px ice stroke

Hairlines are 1px ice on chrome and glass; the heading rule is 3px and 2px-radiused. Focus is a 2px ice outline with 3px offset. The mark itself is a faceted hexagon; UI does not repeat hex clipping.

## Components

### Buttons
Trial control, Karla, 12px corners, 0.8rem × 1.5rem, 1px pale edge, 0.2s ease lift.

- **Shape:** Gently curved (12px)
- **Primary (on paper):** Navy-to-navy-mid diagonal gradient, white label, navy bloom. Hover: lift 2px, stronger bloom, ice border.
- **On dark (hero):** Ice fill, navy label, weight 600, ice bloom. Hover: frost fill, navy label held.
- **Footer:** Ice at 90% alpha, navy label; hover to full ice.
- **Focus:** 2px ice outline, 3px offset, on all trial, nav, stat, and footer links.
- **Copy:** Desktop “Trial the App in Pre-release”; at 768px “Try Pre-release”.

### Cards / Containers
- **Statistic tile:** 16px corners, white 8% on navy, 16px blur, ice 25% hairline, 2rem padding. Hover: 12% white, ice 45% edge, lift 10px. Icon sits in an 80px ice ring; number is 2.5rem bold white (2rem on small screens).
- **Light narrative bands:** Even sections and the solution band use white 50–60% with 10–12px blur and ice top/bottom hairlines. Alternate paper stays on the page grade.
- **Tinted paper bands** (balancing / about): ice at 10–12% with 8px blur and ice hairlines.
- **Video:** 16px corners, ice hairline, glass shadow; contrast slightly raised. Do not treat a raw Bootstrap black border as the frame.

### Inputs / Fields
No marketing-page fields. When a field is added, match chrome: paper or navy glass fill, 8–12px corners, 1px ice hairline, ice focus ring as on buttons.

### Navigation
Fixed full-bleed navy glass (94% navy, 20px blur, ice 28% bottom hairline, navy bloom). Brand: 40px mark at 6px corners, then Garamond “Bloombal” at 1.45rem / 600, white. Links: Karla 500, chrome-link color, 8px corners; ice icons beside labels. Hover and focus-visible: ice 18% well, ice type. Active: ice type at 700, ice 16% well. Toggler edge is ice at 50%. Brand inset ~2rem from the left; link cluster ~2rem from the right.

### Signature: Hero wash and scroll cue
Full-viewport header, classroom photograph, 160deg navy-to-steel wash, 40% grayscale on the inherited plate. Centered white Garamond headline with ice underline; one lede; ice trial button. Scroll cue at 30px from the bottom: 30×50px white-stroke capsule, ice wheel animating 1.5s, ice chevron. Honor `prefers-reduced-motion` by dropping animation and control transitions.

### Signature: Heading rule
80×3px centered gradient bar under h1/h2. Hero: transparent–ice–transparent. Elsewhere: navy–ice.

## Do's and Don'ts

### Do:
- **Do** build chrome, footers, and dark bands from logo navy so the black-ground mark sits flush.
- **Do** use ice cyan for cuts: trial on dark, focus, active nav, hairlines, heading rules, and link accents.
- **Do** set headings in EB Garamond and everything else in Karla.
- **Do** frost light bands with ice hairlines and navy-tinted bloom, not black material shadows.
- **Do** keep the first viewport to one headline, one line, one trial CTA, and a scroll cue.
- **Do** wash photography in navy–steel before it meets the page.

### Don't:
- **Don't** skin the product as mint, teal-glass, or warm edu-SaaS. No green “trust” fills.
- **Don't** put the mark on a white, gray, or ice-flooded bar.
- **Don't** set body or buttons in the display serif, or headings in Karla.
- **Don't** use ice as a full-section background.
- **Don't** introduce a third chromatic family (gold, coral, purple) for status or decoration.
- **Don't** treat Bootstrap glyph icons or a hidden circular partner row as identity to copy onto new surfaces.
