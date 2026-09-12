---
name: Bloombal
description: ABE clay craft painted in logo navy and ice — integrity with sister-product warmth.
colors:
  primary: "#082848"
  navy-mid: "#0e3a66"
  steel: "#386491"
  ice: "#77cafc"
  cta: "#ff8a3d"
  cta-hover: "#f07322"
  cta-soft: "#ffe8d6"
  paper: "#e8f0fb"
  paper-deep: "#d4e3f7"
  surface: "#fffdf9"
  surface-raised: "#ffffff"
  ink: "#1a2240"
  ink-line: "#082848"
  text-muted: "#5a6480"
  chrome-link: "#e8f4fb"
  white: "#ffffff"
rounded:
  sm: "10px"
  md: "16px"
  lg: "22px"
  xl: "28px"
  pill: "999px"
  full: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "32px"
  lg: "64px"
  nav-clearance: "70px"
typography:
  display:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "3.15rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "0.01em"
  cinematic-display:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.2vw, 3.35rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  title:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "0.85rem 1.6rem"
    typography: "{typography.label}"
  button-cta:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.85rem 1.6rem"
    typography: "{typography.label}"
  button-cta-hover:
    backgroundColor: "{colors.cta-hover}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.85rem 1.6rem"
  nav-bar:
    backgroundColor: "rgba(8, 40, 72, 0.96)"
    textColor: "{colors.white}"
    height: "64px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.chrome-link}"
    rounded: "{rounded.sm}"
    typography: "{typography.body}"
  nav-link-active:
    backgroundColor: "rgba(119, 202, 252, 0.18)"
    textColor: "{colors.ice}"
    rounded: "{rounded.sm}"
  card-stat:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "2rem"
---

# Design System: Bloombal

## Overview

**Creative North Star: "ABE clay, Bloombal ink"**

Bloombal’s landing shares ABE’s soft-clay teaching-game craft — thick ink borders, cream panels, Fredoka/Nunito, orange trial punch — while the mark’s navy and ice stay the brand field. The black-ground logo still sits on navy chrome. Ice is focus and active; orange is reserved for trial CTAs.

**Key Characteristics:**
- Logo navy chrome so the mark sits flush; cream clay panels for content depth
- 3px navy ink borders and soft bottom-edge shadows (ABE clay grammar)
- Fredoka display / Nunito body
- Orange trial CTA only; ice for focus, nav active, and secondary accents
- Sky atmosphere + coach/education icons from ABE under a navy–steel wash

## Colors

### Primary
- **Logo Navy**: Nav, footer, statistics field, primary fills, ink borders.
- **Navy Mid**: Primary button hover.
- **Steel**: Mid stop of the hero wash.

### Secondary / Punch
- **Ice Cyan**: Focus rings, nav active/hover, secondary links, mark edge.
- **CTA Orange**: Trial buttons on hero, solution, and footer only. Do not flood sections with orange.

### Neutral
- **Paper / Paper Deep**: Page sky wash stops.
- **Surface / Surface Raised**: Clay panel fills (`#fffdf9` / white).
- **Ink / Ink Line**: Body text and the 3px game border color.
- **Text Muted**: Stat descriptions and secondary copy on cream.

### Named Rules
**The Dark Chrome Rule.** The bar and footer stay logo navy so the mark sits flush — never cream nav.

**The Orange Punch Rule.** Orange is the trial CTA only. Ice remains focus/active.

**The Clay Border Rule.** Interactive panels, buttons, media frames, and stats use a 3px navy ink border — not 1px glass hairlines.

## Typography

**Display Font:** Fredoka  
**Body Font:** Nunito

### Hierarchy
- **Display** (700, clamp ~2.1–3.35rem): Hero and cinematic message titles — expressive but viewport-fit.
- **Headline** (700, ~1.65–2.25rem): Section h2 / benefit heading.
- **Title** (700, 1.35rem): Navbar wordmark; clip-path benefit cards ~1.05–1.4rem.
- **Body** (400–700, 1–1.125rem, 1.55–1.6): Nunito; nav links at 700.
- **Label** (600, Fredoka): Trial buttons.

### Named Rules
**The Two-Voice Rule.** Fredoka for wordmark, headings, and buttons. Nunito for running copy and nav labels.

## Layout

Fixed navy clay bar (~64px). Sections clear it with ~70px scroll margin. First viewport: one Fredoka headline, one Nunito lede, one orange trial CTA, scroll cue. Partner strip stays hidden in the hero.

## Elevation & Depth

ABE clay shadows: bottom edge (`0 2px 0` / `0 4px 0`) plus soft bloom; inset lip on buttons and stat tiles. Press active sinks 2px and clears the shadow.

## Motion

**Thesis:** Splyt-grade cinematic scroll in JS (GSAP ScrollSmoother + ScrollTrigger + SplitText) — full-viewport typographic beats, horizontal proof pin, clip-path benefit titles, video circle expand.

- **Shell:** ScrollSmoother `smooth: 3`, `effects: true`, `pinType: transform`.
- **Reduced motion:** Does **not** kill scroll cinema (Splyt reference also animates with OS reduce on). Only pauses decorative CSS loops / optional autoplay pause; GSAP transforms stay live.
- **Hero / message / proof / benefits / demo:** Same recipes as prior — enter, scrub fold, word paint, horizontal pin, clip titles, circle expand.
- **Balance / story / partners / footer:** Nutrition-style title plate + twin clay columns; full-bleed story beats with scrubbed titles and rising media; partners pin with rising logo cards; tall dark footer mega CTA.

## Shapes

- Nav links / skip: 10px
- Buttons / partner frames: 16px
- Video, media, stats, coach well: 22px
- Mark in bar: 12px with ice edge
- Border: 3px solid navy ink
- Focus: 3px ice outline, 3px offset

## Components

### Buttons
Fredoka, 16px corners, 3px navy border, inset lip, 150ms game ease.

- **Primary:** Navy fill, white label (rare on this page).
- **CTA (trial):** Orange fill, ink label — hero, solution, footer.
- **Active:** translateY(2px), shadow cleared.

### Panels
Cream clay (`#fffdf9`) with 3px navy border and soft clay shadow. Statistics tiles are cream on the navy band (not glass). Media frames and coach figure match.

### Navigation
Navy bar, thick ice-tinted bottom border, clay shadow. Fredoka wordmark. Nunito links with 2px ice well on hover/active. Mark: 12px radius, ice edge.

### Signature: Hero
ABE `bg-sky` under navy–steel wash; orange trial; orange scroll-wheel accent.

### Sister-product imagery (ABE)
`src/img/abe/` — sky, coach, guide-icon, training, scorecard, overview. Proof pin panels use `src/img/abe/panels/` (ABE coach/training plus generated clay heroes and element sheets). Provenance in `ATTRIBUTION.md`.

## Do's and Don'ts

### Do:
- **Do** keep the mark on navy chrome.
- **Do** use thick clay borders and Fredoka/Nunito like ABE.
- **Do** reserve orange for trial CTAs.
- **Do** use ice for focus and nav active states.

### Don't:
- **Don't** put the mark on a cream or white bar.
- **Don't** restyle to ABE indigo as the brand field.
- **Don't** flood the page with orange or ice fills.
- **Don't** return to glass/blur facets as the default panel language.
