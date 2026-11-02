# Iteration 01 — Critical findings

- Date: 2026-11-01
- Preview URL: http://127.0.0.1:8080/
- Decent progress (from STATE): 0 / 50
- Impeccable knowledge applied: yes

## Verdict

The Flagship Lookbook hero is a typed poster on bone, not a Persuade conversion surface. Attention stops on fashion display type and a thin desk ribbon; Interest collapses into ambivalent AI cheerleading stats; Desire never lands institutional proof; Action is a small navy plaque competing with ice-colored headline chrome. Keep the approved `luxury-fashion-flagship` world — do **not** replace it this round — but the page currently fails the stranger test: cover the wordmark and this could sell perfume, consulting, or any “integrity” SaaS. `docs/reviews/iteration-01/capture-hero.png` was missing; judgment uses live HTML (200), source, approved comp `.impeccable/mocks/flagship-comp-2.png`, and `.impeccable/review/hero-repro.png` / side-by-side (hero gate ~73% drift).

## AIDA

- **Attention (`.look--hero`):** One claim line exists (`Two-Factor Knowledge` / `Validation`), but the lede (`Making sure humans win the race`) is category-agnostic slogan, not mechanism. Dominant visual is a ~10%-tall `.hero-desk` crop — atmosphere scrap, not product truth. `.look-indices` (01–03) burn Attention budget on lookbook chrome that does not explain the offer.
- **Interest (`#problem`):** The ChatGPT-misconduct question is the first product-specific beat — and it arrives *after* a full fashion hero that never said what Two-Factor Knowledge Validation *does*.
- **Desire (`#statistics` → `#solution` → `#positiveNegative` → `#urgency` → `#about`):** Broken. `#statistics` (`look-num` “03”) leads with adoption/positivity metrics (60% educators integrated AI; 88% teachers report positive impact) that dilute the integrity crisis. Partner logos from PRODUCT evidence are absent from `index.html`. `#solution` dumps equal `.benefit-list` bullets before a demo. `#positiveNegative` reopens debate instead of closing desire. `#about` is generic passion copy.
- **Action (`.cta-trial`):** Meaning is stable (pre-release trial), but the control is visually subordinate to ice `Validation` and undersized vs the approved plaque. Secondary `.process-link` is fine in role; brown ink (`#665244`) makes it a third hue, not a quiet secondary.
- **Headline-only AIDA test:** Problem → ambivalent stats → feature list → ChatGPT essay → fear copy → About Us → How it works → Trial. That is a collage, not Attention→Interest→Desire→Action.

## Look and feel

Institutional temperature is fashion-house editorial, not education-integrity authority. That is the committed world (`OWN-WORLD` in `.impeccable/surfaces/src-index-html.md`) — acceptable as direction — but execution reads as a static lookbook slide: flat bone, hairline rule, oversized type, decorative plate at `opacity: 0.35`, desk strip as footer ornament. Peers in EdTech integrity would expect product demonstration and institutional proof earlier; this surface currently offers prestige posture without proof. Premium here is empty space performing as craft.

## Colour balance

- Field: `--bone` / bone plate — calm, correct for the world.
- Ink mass: navy type + `.cta-trial` (`#08183b`) — present but the CTA is not the darkest *largest* mass; the headline is.
- Accent: `.headline-validation` uses `#368de9` (comp ice), while tokens also define `--ice: #368de9` and `--ice-soft: #77cafc`. Ice is spent on the display word, so the trial plaque cannot read as the scarce action spark.
- Rogue hue: `.process-link { color: #665244 }` — warm brown absent from the navy/ice contract; pulls secondary CTA into stationery nostalgia instead of quiet stone/gray.
- Squint test: type blob + ice blob + tiny navy rectangle + thin photo strip. Four masses, unmanaged hierarchy.

## Borders / edges

- `.index-rule` hairline is the only honest editorial edge in the hero — keep.
- `.look--hero .cta-trial { border: 1px solid #f8f8f6 }` draws a light halo around the plaque (visible in region crop / build contradiction). Fashion rectangular CTAs should be solid ink blocks, not outlined cards.
- Down-page: `.proof-item` top rules and `.benefit-list li` bottom rules are consistent hairline grammar — fine — but they prop equal-weight columns instead of hierarchy. Deleting them would not change reading order; the layout is already a list of slides.

## Typography

- Display stack (Gideon Roman / Bodoni Moda) + Gelasio body + Inter chrome matches the lookbook thesis and is doing brand work — keep the faces.
- Failures are hierarchy and measure, not font choice:
  - `.hero-lede` at `40px` fights poster type; Impeccable hero diffs still flag lede as **missing** (cap-height / box drift vs comp). Support text is either too small in-render or wrongly boxed — either way it does not land as a readable Interest bridge.
  - `.headline-main` / `.headline-validation` use `white-space: nowrap` inside absolute boxes — fragile; overflow is a trust failure on real viewports.
  - Section `h2` scale (`clamp(2.4rem…4rem)`, `max-width: 18ch`) stays in Attention voice deep into Desire/Read sections — every scroll beat feels like another poster, not progressive disclosure.
  - CTA label is Inter regular ~0.8rem in a short plaque — lettering looks pinched vs approved plaque crop.

## Branding

- Wordmark is Inter text (`.wordmark`); `img/logo.png` (nib/hex mark required by PRODUCT) never appears in the hero composition. Branding is a string, not a mark.
- Swap-logo test fails: replace “Bloombal” with any serif-capable brand name and the first viewport still “works.”
- Product truth is missing from viewport one: no LMS, no validation step, no institutional context — only abstract “Validation” in ice.
- Naming hierarchy is OK (Bloombal + Two-Factor Knowledge Validation); presence hierarchy is not.

## Simplicity / complexity

- Hero budget is *almost* right on paper (brand, one headline, lede, CTA group, one image) but the image is not dominant and look-indices add non-essential chrome (craft-floor: section numbers only when the sequence itself is information — here 01–03 map to three looks while the page has ~eight sections, so the sequence lies).
- Below the fold: equal visual weight across `.look--copy`, `.look--proof`, `.look--solution`, `.look--balance`, `.look--story` ×3. Cardless, yes — still a deck of same-temperature essays.
- Complexity that would earn its place (partner proof, legible product UI, one clear mechanism diagram) is either missing or delayed behind the clay demo and ChatGPT pros/cons.

## Placement / reading order

- Absolute 1280×720 scaffold (CSS vars `--r-*`) locks a left-rail Z: indices → wordmark → headline → lede → CTA → process → desk. Optical centre is empty bone; claim sits mid-frame; media is bottom scrap. Eye path is claim → slogan → small button → underline → notebook crop — never “see the product.”
- `#statistics` is visually Look 03 (`look-num`) while nav `03` jumps to `#solution` — index vs content mismatch; scan path and chrome disagree.
- Sticky indices die with `.hero-frame`; later sections lose the lookbook spine that justified 01/02/03 in the first place.
- Footer trial repeats Action correctly; mid-page Desire never earns that click.

## Texture

- Page is mostly flat `--bone` fills. `.hero-bone-plate` at 20%×20%, `opacity: 0.35` is a ghost, not a material ground.
- `.hero-desk` is real photography and the only atmospheric win — then starved to `height: 10%` (`--r-desk-still-h`).
- Subsequent looks add no material bridge (no paper plate, no ink field until `#about.look--ink`, no institutional imagery). Result: slide-deck flatness after one editorial gesture.
- Autoplaying `.demo-video` (clay exam) introduces a second visual world mid-page without a transition — fashion bone → clay motion is a texture break.

## Animation

- `script.js` applies `.will-fade` (opacity + `translateY(18px)` + **`blur(4px)`**, 700ms) to **every** `.look:not(.look--hero) .look-inner`. That is the banned PowerPoint build: identical entrance on every section, delays comprehension, uses blur as costume.
- Count of motion ideas: (1) scroll-linked index active state, (2) universal section fade-blur, (3) looping demo video. Item (2) fails craft-floor (“one authored moment, not identical entrance on every section”) and landing-page animation standards (2–3 purposeful beats max; fade-up-every-card banned).
- No first-viewport presence motion; hero pops static.
- `prefers-reduced-motion` correctly skips fades — keep that branch when rewriting motion.

## Impeccable craft flags

- Persuade mode: offer/action not demonstrated in working form in viewport one; world reduced toward accent-on-neutral-template (bone + type + ice word) rather than material coverage.
- Craft-floor refuse: repeated section-number chrome with weak informational value; blur entrance family on all sections.
- Absolute bans hit: none requiring world replacement.
- Stale `DESIGN.md` still documents ABE clay / Fredoka / orange CTA — contradicts surface brief and shipping CSS. Sync later; **not** a reason to restart comps this iteration.
- Hero gate still open (~73% drift): `lede` missing, `cta-trial` contradicted, `look-indices` missing detail — treat as craft debt inside the approved world, not BLOCKING-DIRECTION for a new visual world.
- **Not BLOCKING-DIRECTION:** do not replace `luxury-fashion-flagship` / Flagship Lookbook this round.

## Change set for this iteration

1. **Problem:** Identical `.will-fade` + blur on every non-hero `.look-inner` (`script.js` + `.will-fade` in `styles.css`) is decorative PowerPoint motion.  
   **Change:** Remove the universal observer/class. Ship at most two motions: (a) one quiet hero presence (opacity/y only, ≤600ms, no blur), (b) one scroll-triggered reveal for `#demo .demo-band` only. Keep reduced-motion short-circuit.  
   **Severity:** Blocking (motion / craft-floor).  
   **Acceptance:** Disable animation → page still complete; scrolling quickly shows ≤2 authored motion ideas; no blur filters on copy sections.

2. **Problem:** AIDA Desire is poisoned by `#statistics` positivity metrics and a dead mid-funnel (balance / about) before proof of mechanism.  
   **Change:** In `index.html` only this round: (a) move `#statistics` below `#solution`/`#demo` or replace its four items with integrity-risk framing already present in `#urgency` (do not invent new claims); (b) demote or collapse `#positiveNegative` and `#about` into a single quieter band (visually secondary: smaller type / tighter `.look-inner` padding / shared `look--ink` or hairline-only); (c) fix index honesty — either map 01/02/03 to home/problem/solution only and stop labeling statistics as `03`, or drop `.look-num` labels that disagree with `.look-indices`.  
   **Severity:** Blocking (conversion spine).  
   **Acceptance:** Cover nav; remaining section titles read Attention → problem Interest → solution/demo Desire → trial Action without an ambivalent stats billboard in between.

3. **Problem:** Hero visual under-delivers; desk is a 10% ribbon; bone plate is invisible.  
   **Change:** In `.look--hero` / measured vars: raise `.hero-desk` to a dominant lower plane (roughly 22–32% of frame height, full bleed width, stronger `object-position`), and either increase `.hero-bone-plate` coverage/opacity into a readable paper field or drop it if it stays decorative. Preserve left type column legibility (contrast ≥4.5:1 over photo).  
   **Severity:** Blocking (Attention / texture).  
   **Acceptance:** Squint test shows one clear image mass in viewport one; desk is no longer a footer stub; type remains readable.

4. **Problem:** `.cta-trial` plaque contradicted vs approved control (white border halo, pinched height/lettering); ice headline steals action colour.  
   **Change:** Restyle hero `.look--hero .cta-trial` to solid navy plaque matching comp box height/padding (remove `#f8f8f6` border); keep label Inter regular, size so full string fits without clipping; set `.process-link` to stone/muted navy-gray (`--stone` / `--muted`), not `#665244`. Do not introduce orange. Optionally tighten `.headline-validation` so ice remains seasonal accent without overpowering the plaque mass (weight/size already fixed — adjust only if plaque still loses the squint test).  
   **Severity:** Blocking (Action / colour).  
   **Acceptance:** Squint → one dark rectangular action mass; secondary link quiet; region no longer reads as outlined card.

5. **Problem:** Brand mark absent; wordmark-only fails PRODUCT and swap-logo test.  
   **Change:** Add `img/logo.png` mark into `.hero-frame` at hero-level presence (beside or directly integrated with `.wordmark`), sized to compete with display type as identity — not favicon scale. Keep “Bloombal” word.  
   **Severity:** Blocking (branding).  
   **Acceptance:** Remove nav/word string alone and the mark still identifies Bloombal; competitor logo on this composition looks wrong.

6. **Problem:** `.hero-lede` fails as Interest bridge (comp “missing”, wrong optical weight).  
   **Change:** Re-derive lede from measured `--r-lede-*` / font-match (Gelasio ~29px cap-height target per build advisories): correct top offset under `Validation`, set font-size so rendered cap-height matches comp (~22px cap), keep copy unless a one-line product-specific substitute is already approved — do not invent claims. Ensure `z-index` and no overflow clipping.  
   **Severity:** High (Attention → Interest).  
   **Acceptance:** Lede clearly secondary to headline, fully legible, vertically paced like approved comp; hero diff no longer flags lede as missing for box emptiness.

## Out of scope this round

- New Impeccable comps / visual-world replacement / reopening `comps` phase.
- Rewriting `DESIGN.md` to match Flagship Lookbook (schedule after hero gate closes).
- Full responsive pass (`@media` overhaul) and motion phase polish beyond killing the universal fade.
- New partner logo strip implementation details beyond leaving room in Desire (assets exist under `src/img/partners/` — wiring can be next iteration once spine is fixed).
- Demo video re-grade / non-clay replacement asset.
- Copy invention beyond reordering/demoting existing sections.

## Do not do

- Do not label a world replacement **BLOCKING-DIRECTION** or restart fashion → clay/ABE.
- Do not reintroduce ABE clay chrome, Fredoka/Nunito, or orange CTA punch against the surface brief.
- Do not add fade-up staggers, icon rows, stat-card grids, or pill clusters to “fix” emptiness.
- Do not add floating badges, kicker/eyebrow labels, or more section numbers.
- Do not implement product source changes in the review pass — findings only.
