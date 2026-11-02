# Iteration 05 — Critical findings

- Date: 2026-11-01
- Preview URL: http://127.0.0.1:8080/ (**stale**: live HTML still has `student-exam-clay`, “By 2025”, no `.partner-strip` / `process-still`. Judgment uses **current `src/`** via inlined CSS/JS on ephemeral :8099; measured desktop 1280×720 + mobile 390×844; captures under `docs/reviews/iteration-05/capture-*.png` + `metrics.json`; process mp4 frames `frame-01..05.png`)
- Decent progress (from STATE): 4 / 50
- Impeccable knowledge applied: yes (skill `C:\Users\yiyub\.cursor\skills\impeccable\SKILL.md` v4.8.0 + `reference/craft-floor.md` + `reference/mode-persuade.md`; Persuade / Flagship Lookbook; no rebuild — not BLOCKING-DIRECTION)

## Verdict

Iteration 04 paid Validation contrast, process wiring, CTA count, mobile title steps, partners grammar, and index chrome — the funnel *sorts* and the ice-fill crime is gone. The next depth fails Persuade conversion craft, not order: Attention’s lede is silently crushed by `.look p` to **18.4px** (token `--r-lede-font: 29px` never computes); Desire’s “product proof” is a **white iconographic explainer** (Student → Factor 1/2 → Written/Oral → Your Knowledge) whose **poster is the emptiest opening frame**; Action then dumps into a **continuous navy slab** (`#context.look--ink` flush into `#contact`, gap **0**). Cover the mark: this is a lookbook spine with a broken Interest bridge, a whiteboard diagram sold as LMS validation, and an About that only exists to darken the page before Trial. Keep `luxury-fashion-flagship` — **not** BLOCKING-DIRECTION — but stop treating “process mp4 referenced + three CTAs” as finished Desire/Action.

## AIDA

- **Attention (`.look--hero`):** Claim + mark (52px) + desk + CTA clear of photo (CTA bottom 475 / desk top 533 / index-rule ends at desk — keep). Validation ink + 3px ice underline measures **13.57:1** — unpaid iter-04 contrast debt cleared — keep. New blocking: `.hero-lede` is a `<p>` inside `.look`, so `.look p { font-size: 1.15rem; color: var(--ink) }` (spec 0,1,1) beats `.hero-lede` (0,1,0). Computed lede **18.4px** while `--r-lede-font` remains `29px` unused; Interest bridge under the claim is body-copy scale. CTA area still **0.41×** Validation text area (14616 vs 35304); hero label **15.68px**, mobile hero CTA **13.6px**. Right ~59% empty bone remains OWN-WORLD. Pinned lede copy still category-agnostic (brief-locked — do not invent).
- **Interest (`#problem`):** First product-specific beat; title **45.6px** loudest non-hero — keep. Stage works; hero failed to hand off because lede was cascade-killed.
- **Desire (`#solution` → `#demo` → `#urgency` → `#partners`):** Order right; *evidence* still wrong species. Progressive titles compute desktop **40.8 → 35.8 → 32 → 28.2** and mobile **29.6 → 26.4 → 24.8 → 22.4 → 20** — keep. Demo is process mp4 + process-still (no clay) with max-height ~403px — structure keep — but paused state shows **Student + ghost Factor 1 on white** (frame-01 sparseness); full clip is a B/W icon flowchart, **not** LMS/product UI. Caption (“Real-time knowledge validation through your LMS”) **echoes** the mechanism paragraph under it. Urgency still three essays + italic `.em` costume. Partners H2 is generic (“Working with universities…”) while marks sit ~40px tall in a left orphan row with vast right bone.
- **Action:** Three Trial plaques (hero / post-demo / footer) — count keep. Path fails: partners proof → ink About (214px) → ink footer (477px) with **inkStackGap 0** = one ~690px navy close. About adds no new decision; it only restarts Action darkness. Privacy/Terms are `href="#"` dead anchors under the close.
- **Headline-only AIDA test:** Slogan → misconduct → Unlock… → (white Student diagram) → Cost too high → Working with universities → About → Trial. Spine OK; Desire shows a teaching graphic, not Two-Factor Knowledge Validation *in product*.

## Look and feel

Flagship Lookbook temperature intact (bone, hairline, monumental serif, rectangular ink plaque). Execution after iter 04 is a coherent lookbook *document* that then inserts a whiteboard animation and a double ink coda. Institutional buyers get prestige type and named schools, then a generic Factor diagram and an About that is only a navy prelude to Trial. Premium is still negative space plus one wrong *kind* of moving image.

## Colour balance

- Field `--bone` — correct.
- Validation fill is ink; ice is underline + focus + footer hover — scarce enough — keep underline strategy.
- CTA fill `var(--ink)` — keep; hover still hardcodes `#0e3a66`.
- Lede *intended* `#0a0b14` never applies; `.look p` forces `--ink` (accidentally better brand continuity, but only because specificity stole the rule).
- Squint: navy type + ice hairline under Validation + desk + small plaque. Action spark still secondary to display word area; Desire opens as a white sheet mass that fights bone.

## Borders / edges

- Index-rule clipped to desk top — keep.
- `.demo-frame` bone-deep + 1px ink hairline — correct editorial chrome — keep; content inside is the problem.
- Partner row: no per-cell borders — keep.
- About→footer: no divider between two identical ink fields — edge grammar collapses into one void (delete the About ink plate or put a hairline/bone break).

## Typography

- Faces match the world — keep.
- Desktop + mobile progressive ladder — unpaid debt cleared — keep.
- **Cascade bug (new measurement):** `.look p` overrides `.hero-lede` → **18.4px** vs token **29px**. Attention→Interest type bridge is broken in CSS, not in the brief.
- Hero CTA Inter **15.68px** / mobile **13.6px** still pinched vs monumental display; mid-page plaques ~15.2px with healthier padding.
- Urgency `.em` italic-only emphasis — costume, not hierarchy.
- Partners H2 (32px) outweighs the institutional names (Inter ~0.82rem muted) — proof voice inverted.

## Branding

- Mark 52px + word present; Validation no longer washed ice — swap-logo harder than iter 03 — keep.
- Product truth still absent from viewport one (OWN-WORLD + pinned lede — accepted debt).
- Desire “product” is a category explainer graphic, not Bloombal-in-LMS; Persuade mode (“demonstrate something only this product can prove”) still unmet by media *content*, even though clay is gone.
- Dead legal links under the brand close undermine institutional trust more than missing polish.

## Simplicity / complexity

- Hero budget OK; indices brief-earned — keep 01/02/03.
- Desire complexity that should earn place (process media, partner names) is half-right: names exist but underweighted; media is the wrong genre (icon flowchart vs product surface).
- Caption + mechanism = same claim twice.
- About as its own ink look after partners = Action complexity without new information.
- Dead CSS still ships (`.look-num`, `.partners-lede`, `.partners-cta`, `.balance-grid`, `.look--balance`, `.stat-link` focus) — complexity in the stylesheet after HTML cleanup.

## Placement / reading order

- Desktop hero stack (CTA/process above desk) — keep.
- Solution: title → oversized white diagram → mechanism (same claim as caption) → CTA. Mechanism/support arrives only after the empty poster; denser mid-clip frames exist in the same mp4 (full two-factor diagram ~frame-05) but are not the default still.
- Partners: generic H2 → tiny name+mark row → immediately ink About. Eye never rests on proof before Action darkens.
- Mobile: brand/CTA above desk OK (process bottom 494 / desk top 625); CTA type regresses to 13.6px.

## Texture

- Bone plate + desk still the only photographic atmosphere in Attention — keep.
- Demo poster/video: fashion bone → **flat white diagram world** (third material: paper lookbook → notebook photo → whiteboard icons). Bone-deep frame cannot disguise a white void poster.
- Double ink About+footer removes the last bone texture before close — page ends as a navy slide.
- Section hairlines alone do not vary look-to-look atmosphere once Desire goes whiteboard-white.

## Animation

- Budget still correct: hero `.will-present`, demo `.will-reveal`, reduced-motion short-circuit. Keep; do not add section fades.
- Click-to-play / no loop — keep. Do not reintroduce autoplay.
- Replacing poster frame + `object-fit` is media truth / framing, not a new motion idea.

## Impeccable craft flags

- Persuade: opening still does not make the offer *intelligible as product* in viewport one (accepted OWN-WORLD debt); Desire still fails “demonstrate something only this product can prove” — icon flowchart ≠ LMS validation surface.
- Craft-floor: body/large text hierarchy broken on hero lede via cascade; identical ink regions stacked; dead `#` controls; italic costume emphasis; no kicker/card-grid relapse.
- Absolute bans requiring world replacement: none.
- Surface ice `#77cafc` as scarce underline — keep; do not restore ice-fill Validation.
- Dev preview drift: `:8080` still clay/2025 — rebuild before trusting that URL.
- **Not BLOCKING-DIRECTION:** do not replace `luxury-fashion-flagship` / Flagship Lookbook this round.

## Change set for this iteration

1. **Problem:** `.hero-lede` computes **18.4px** / `--ink` because `.look p` (0,1,1) overrides `.hero-lede` (0,1,0); token `--r-lede-font: 29px` never applies — Attention→Interest bridge is cascade-dead.  
   **Change:** In `styles.css`: raise specificity to `.look--hero p.hero-lede` (or `.look--hero .hero-lede`) and set `font-size: var(--r-lede-font)` (+ keep line-height ~1.2). Bind `color` to `var(--ink)` explicitly (drop orphan `#0a0b14`). Do not invent new lede copy.  
   **Severity:** Blocking (Attention / typography cascade).  
   **Acceptance:** At 1280×720, computed `.hero-lede` `font-size` ≈ **29px**; clearly secondary to 85–89px display but above body 1.15rem; colour is `--ink`.

2. **Problem:** Desire proof still fails Persuade — poster is sparsest opening frame (Student + faint Factor 1 on white); mp4 is a B/W icon explainer, not LMS UI; white sheet fights bone; caption duplicates mechanism.  
   **Change:** In assets + CSS/HTML: regenerate `img/plates/process-still.png` from a **mid/late** frame of `two-factor-knowledge-validation-process.mp4` where Factor 1 + Factor 2 + Written/Oral + “Your Knowledge” are all visible (≈frame-05 density — ffmpeg still). Set `.demo-video { object-fit: contain; background: var(--bone-deep); }` so white diagram letterboxes on bone instead of `cover`-cropping emptiness. Keep controls / no loop / bone `.demo-frame`. Collapse caption↔mechanism: either delete `.demo-caption` or shorten mechanism to one clause that does not repeat the caption — **no new claims**. Do not reintroduce clay.  
   **Severity:** Blocking (Desire / Persuade proof / texture).  
   **Acceptance:** Paused demo shows the full two-factor diagram, not a lone Student glyph; white field does not read as an empty viewport; LMS claim appears once under the band.

3. **Problem:** `#context.look--ink` (≈214px) flush against `#contact.look--footer` (≈477px), `inkStackGap: 0` — one continuous navy Action void; About earns no separate look.  
   **Change:** In `index.html` + light CSS: keep About copy, but **remove `look--ink`** from `#context` (stay on bone with existing hairline) *or* fold the single About sentence into the footer under “Trial Bloombal” and delete `#context`. Prefer bone About → footer Trial so Desire proof stays on paper until the final plaque. Do not invent mission copy.  
   **Severity:** Blocking (AIDA Action path / texture).  
   **Acceptance:** After partners, page stays bone (or goes quiet) then one ink footer close; no back-to-back navy sections; ≤3 Trial CTAs preserved.

4. **Problem:** Hero Action still loses the squint — CTA area **0.41×** Validation text; mobile hero CTA **13.6px** in a short plaque.  
   **Change:** In `styles.css`: bump `.look--hero .cta-trial` mass — allow width beyond rigid `20%` when needed (`width: max(var(--r-cta-trial-w), max-content)` or ~22–24% / min-width in px), `font-size` ~1rem desktop, mobile override ≥0.9rem with healthier padding; keep solid `--ink` fill, no ice fill, no white border. Optionally nudge `--r-cta-trial-h` slightly if still clear of desk (CTA bottom must stay &lt; desk top).  
   **Severity:** High (Action / colour hierarchy).  
   **Acceptance:** Squint → darker rectangular plaque closer in optical weight to the display word; mobile hero CTA ≥15px computed; still clear of desk photo.

5. **Problem:** `#urgency` burns Desire on a three-paragraph essay + italic `.em` costume; partners proof underweights names under a generic H2.  
   **Change:** In `index.html` (+ light CSS): distill urgency to **one** headline + **one** short support paragraph (reuse existing risk language only — strip the third catch-up paragraph and remove `.em` wrapper; use weight/size if emphasis needed). For partners: either put the three short names into the H2 once *or* enlarge strip labels toward body ink and drop redundant generic H2 hedging — names once, no new schools/stats.  
   **Severity:** High (Desire / typography / simplicity).  
   **Acceptance:** Urgency is one beat; no italic-only emphasis; partners read as institutional proof without a poster-sized empty claim above tiny marks.

6. **Problem:** Footer Privacy/Terms are `href="#"`; stylesheet still carries dead look grammar (`.look-num`, `.partners-lede`, `.partners-cta`, `.balance-grid`, `.look--balance`, `.stat-link`).  
   **Change:** In `index.html`: remove the legal pair **or** point to real routes if they exist in the repo — do not leave `#` stubs under the Trial close. In `styles.css`: delete unused dead rules listed above; unify `.cta-trial:hover` to an ink-deep token if touched.  
   **Severity:** High (trust / borders cleanup).  
   **Acceptance:** No `#` legal anchors in footer; grep shows no orphaned partners-cta/look-num/balance-grid rules; hover still navy-family.

## Out of scope this round

- BLOCKING-DIRECTION / new comps / world replacement.
- Inventing new lede copy (brief-pinned) or new partner/statistic claims.
- Shooting real LMS product UI footage (this round: denser poster + contain framing of existing process asset only).
- Full DESIGN.md sync / PRODUCT ABE-orange reconciliation.
- Fixing webpack-dev-server staleness beyond noting: main thread must rebuild/`webpack serve` so `:8080` matches `src/` before the next review trusts that URL.
- Hero right-field composition redesign (vast bone is OWN-WORLD).
- Extra motion beyond existing two beats + click-to-play.
- Re-grading the process animation’s creative direction beyond poster frame + object-fit.

## Do not do

- Do not label world replacement **BLOCKING-DIRECTION** or revive ABE clay chrome / Fredoka / orange CTA against the surface brief.
- Do not restore ice-fill on Validation or universal section fade/blur.
- Do not “fix” Desire with card grids, icon rows, pill clusters, metric billboards, or a fourth Trial CTA.
- Do not add section numbers beyond brief-earned 01/02/03 or eyebrow/kicker labels.
- Do not invent new percentages, testimonials, or school relationships.
- Do not keep the sparsest opening frame as `process-still.png`.
- Do not implement product source in this review pass — findings only.
