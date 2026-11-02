# Iteration 03 — Critical findings

- Date: 2026-11-01
- Preview URL: http://127.0.0.1:8080/ (webpack overlay / **stale compile** still serves pre–iter-02 HTML: `#statistics`, `.benefit-list`, no `.partner-strip` / `.brand-mark`. Judgment uses **current `src/`** rendered with inlined `styles.css` + `script.js`; captures under `docs/reviews/iteration-03/capture-*.png` + `metrics.json`)
- Decent progress (from STATE): 2 / 50
- Impeccable knowledge applied: yes (skill `C:\Users\yiyub\.claude\skills\impeccable\SKILL.md` v4.8.0 + `reference/craft-floor.md`; Persuade / Flagship Lookbook; no new build-phase)

## Verdict

Iteration 02 fixed funnel order and ice hex on paper; the live Persuade surface still fails Desire craft and stage voice. Partners arrived as a grayscale logo cloud with white JPEG plates and a hedging headline; the clay demo still autoplays as an ink void with no editorial bridge; progressive `h2` sizing from iter 02 **never computes** because `.look:not(.look--hero) h2` out-specifies every quieter override (measured: problem/solution/urgency/partners/quiet all **38.4px** at 1280). Cover the mark: Attention still sells fashion “Validation,” Desire sells expired “By 2025” fear plus ChatGPT debate, and Action is a 14px plaque. Keep `luxury-fashion-flagship` — **not** BLOCKING-DIRECTION — but stop treating “partners wired + demo first” as finished Desire.

## AIDA

- **Attention (`.look--hero`):** Claim + mark + desk + CTA clear of photo (metrics: CTA bottom 472 / desk top 533). Ice `Validation` (`#77cafc`) remains the loudest mass; CTA fill is `#08183b` not bound `--ink` `#082848`, label ~14px in a 54×256 box. Right ~59% of the 1280 frame is empty bone (validationRight 524 / frameW 1280) — lookbook-legal, still zero product truth in viewport one. Pinned lede still category-agnostic (brief-locked — do not invent).
- **Interest (`#problem`):** First product-specific beat; type voice identical to every later poster (specificity bug). Fine as content; not differentiated as stage.
- **Desire (`#solution` → `#demo` → `#urgency` → `#partners` → `#context`):** Broken on craft, not order. Solution opens with 112px/112px padding around a lone `h2`, then a navy `demo-video` rectangle that often renders as empty ink (no poster; clay loop). Urgency leads with a **2025** prediction on a **2026** page — institutional trust fail. Partners exist but read as SaaS logo-wall costume (“Trusted by institutions starting with” + white-box logos + top rules). `#context` dual column reopens ChatGPT positives/risks after proof — Desire→Action regresses into debate.
- **Action:** Trial meaning stable; visual Action still loses to ice display and to mid-page silence (no trial after partners before the ink debate band).
- **Headline-only AIDA test:** Slogan → misconduct → Unlock… → (void/clay) → Cost too high (2025) → Trusted starting with → About + ChatGPT tradeoffs → Trial. Collage with a better sort key.

## Look and feel

Flagship Lookbook temperature intact (bone, hairline, monumental serif, rectangular plaque). Execution still lookbook *slides*: equal section padding (`7rem`), equal title voice, clay toy loop as the only “product” image, partner strip that belongs on a SaaS template. Institutional buyers get prestige type, then an empty/navy demo frame, then dated fear, then logo tiles — not a quiet editorial proof row.

## Colour balance

- Field `--bone` — correct.
- Ink: type uses `--ink` `#082848`; `.cta-trial` hardcodes `#08183b` / hover `#0e3a66` — plaque drifts off the brand navy contract.
- Accent: Validation ice correct (`rgb(119, 202, 252)`); footer/social hovers still spend `--ice` as generic link glitter; focus rings may keep ice (browser-surface theming OK).
- Squint: ice word + navy type + desk strip + small plaque. Action spark still secondary.

## Borders / edges

- Hero `.index-rule` hairline — keep; it still runs full frame height through the desk (editorial but busy on the photo).
- Partner cells: `border-top: 1px solid rgba(8,40,72,.14)` ×3 under a 3-column grid = equal card grammar craft-floor warns against. White logo plates vs bone field = accidental bordered tiles.
- `.demo-video` hard ink rectangle with no hairline/caption bridge from bone looks — world jump.

## Typography

- Faces still match the world — keep.
- **Iter-02 progressive scale is dead on arrival:** `.look:not(.look--hero) h2` specificity `(0,2,1)` beats `.look--copy h2`, `.look--quiet h2`, and the mobile `.look h2` override. Measured desktop: all non-hero titles **38.4px**. Interest/Desire/Read never change voice.
- Hero CTA Inter ~0.88rem / computed **14.08px** still pinched vs monumental display.
- Urgency body leans on italic `.em` for “serious risk” / “90%…” — emphasis costume instead of hierarchy.

## Branding

- Mark 52px present — better than favicon; still small vs ~85–89px display; swap-logo nearly passes if ice Validation stays the hero.
- CTA navy hex drift weakens logo→plaque continuity.
- Product truth still absent from viewport one; Desire “product” is clay exam chrome against surface constraint “no ABE clay chrome.”

## Simplicity / complexity

- Hero budget OK on paper; indices brief-earned — keep 01/02/03.
- Below fold: solution title isolation + autoplay demo + three-paragraph urgency + logo grid + two-column debate = cognitive load without progressive disclosure.
- Partner strip is the earned Desire complexity — currently styled as the refused equal-card / logo-cloud habit.

## Placement / reading order

- Desktop hero stack fixed (CTA/process above desk) — keep.
- Solution reading order: headline (huge pad) → demo → mechanism → CTA. Title is orphaned above a void; mechanism arrives late relative to the visual.
- Partners headline hedges (“starting with”) then logos; no institutional names as type if logos fail (white boxes / grayscale).
- `#context` after partners forces a second decision narrative (AI tradeoffs) before footer Action.
- Mobile stack (390): brand/CTA above desk measured OK; partner logos become a tall 1-column bordered stack (scroll tax).

## Texture

- Bone plate + desk still the only photographic atmosphere.
- Partner JPGs introduce opaque white rectangles on bone — material break.
- Demo: fashion bone → flat ink → clay motion (when frames appear) with no paper/ink editorial bridge; empty navy when video hasn’t painted = deck void.
- Section `border-top` hairlines alone do not create look-to-look material variation.

## Animation

- Budget still correct: hero `.will-present`, demo `.will-reveal`, reduced-motion short-circuit. Keep; do not add section fades.
- Infinite `autoplay` + `loop` on clay is a third motion idea and fails “loops only for real product behaviour.” Prefer poster + explicit play, or play-once.

## Impeccable craft flags

- Persuade: Desire proof present as assets but styled as template logo wall; offer still not legible as real product UI in the demo band.
- Craft-floor: equal-weight bordered partner cells; section voice not progressive; clay/ABE chrome in the only mechanism visual; kicker-like hedge in partners headline tone.
- Absolute bans requiring world replacement: none.
- Surface ice `#77cafc` now correct on Validation — keep.
- Dev preview drift: `:8080` not reflecting `src/` — rebuild before trusting the overlay URL.
- **Not BLOCKING-DIRECTION:** do not replace `luxury-fashion-flagship` / Flagship Lookbook this round.

## Change set for this iteration

1. **Problem:** Progressive title scale from iter 02 does not render — `.look:not(.look--hero) h2` (spec 0,2,1) overrides `.look--copy h2`, `.look--quiet h2`, and mobile `.look h2`; all Desire/Read titles measure ~38.4px.  
   **Change:** In `styles.css`, fix cascade: e.g. `.look:not(.look--hero) h2` as base; raise problem with `.look--copy h2` at equal/higher specificity (`.look.look--copy h2`); set `.look.look--proof h2`, `.look.look--story h2`, `.look.look--quiet h2` to stepped quieter clamps; fix `@media (max-width: 900px)` with matching specificity so mobile does not flatten or accidentally enlarge. Do not add kickers.  
   **Severity:** Blocking (typography / AIDA stage voice — unpaid iter-02 debt).  
   **Acceptance:** Computed `font-size`: problem > solution ≈ urgency > partners ≥ quiet; mobile keeps the same order.

2. **Problem:** `#partners` reads as SaaS logo-cloud — hedge H2 “Trusted by institutions starting with,” white-box JPG plates, grayscale filter, three equal `border-top` cells; mobile stacks into a long bordered list.  
   **Change:** In `index.html` + `styles.css`: rewrite H2 to a finished editorial line using existing institutional names (e.g. name the three schools in the heading or as text labels — no new claims). Restyle `.partner-strip` as one quiet horizontal row (or name+mark pairs): remove per-cell card borders; kill visible white logo plates (CSS blend/`mix-blend-mode: multiply` on bone, or crop/mask, or prefer type-led names with small marks); drop heavy grayscale if it makes marks unreadable; on small screens keep a compact wrap, not three full-width bordered slabs.  
   **Severity:** Blocking (Desire / craft-floor).  
   **Acceptance:** Squint → institutions as editorial proof, not a three-up tile grid; no white rectangles on bone; headline does not hedge.

3. **Problem:** `#demo .demo-video` is an autoplaying looping clay void on flat ink — texture break vs Flagship Lookbook; surface brief forbids ABE clay chrome; often paints as empty navy (no poster).  
   **Change:** In `index.html` / `styles.css` / minimal `script.js`: add a `poster` (desk still or first-frame still already in `img/plates/` if usable) so the band never reads as empty ink; remove `loop` (and prefer click-to-play or play-once — keep muted if autoplay retained for one pass only); wrap/frame the band with editorial treatment (bone field, hairline, optional short caption reused from existing mechanism sentence — no new claims). Do not replace the mp4 asset this round.  
   **Severity:** Blocking (Desire / texture / motion discipline).  
   **Acceptance:** Demo band always shows a still before/without motion; no infinite clay loop; bone→demo no longer feels like a second product world; motion ideas remain ≤2 authored + optional one-shot playback.

4. **Problem:** `#urgency` cites “By 2025…” on a November 2026 page — dated claim destroys institutional trust mid-Desire.  
   **Change:** In `index.html` only: remove or rephrase that sentence **without inventing new statistics** — keep the other urgency paragraphs / “serious risk” / proactive-vs-reactive framing already present; if a percent claim must stay, strip the expired year so it is not anchored to 2025. Do not add new sources.  
   **Severity:** Blocking (trust / Desire).  
   **Acceptance:** No “2025” prediction visible; urgency still states risk in product language already on the page.

5. **Problem:** `#context` dual `.quiet-grid` (About + ChatGPT positives/risks) reopens debate after partners and before footer Action.  
   **Change:** In `index.html` (+ quiet CSS cleanup): keep a single About column; delete or collapse the ChatGPT positives/risks column (content already spent its ambivalence earlier in prior page versions). Optionally place one mid-page `.cta-trial` after partners if Action feels distant — same label/URL, not a new meaning.  
   **Severity:** High (AIDA Action path).  
   **Acceptance:** Cover nav; after partners the page goes quiet About → Trial, with no second pros/cons poster.

6. **Problem:** Solution title band wastes Desire entry — `#solution > .look-inner` padding 112px top and bottom around only an `h2` before the demo; CTA navy/hex and plaque mass still lose to ice Validation.  
   **Change:** In `styles.css` (and light HTML if needed): compress `.look--solution > .look-inner:first-child` padding (tight top, minimal bottom) so title sits as a caption to the demo; ensure mechanism+CTA `.look-inner--after-demo` stays readable. Unify `.cta-trial` fill to `var(--ink)` / `#082848`; bump hero plaque height/padding/label size toward comp mass (no white border, no ice fill).  
   **Severity:** High (placement / Action colour).  
   **Acceptance:** Less empty bone between “Unlock…” and video; squint → one dark rectangular action mass closer to ink brand; Validation remains seasonal accent only.

## Out of scope this round

- BLOCKING-DIRECTION / new comps / world replacement.
- Replacing `student-exam-clay.mp4` with non-clay product footage (frame/poster/playback only this round).
- Inventing new lede copy (brief-pinned) or new partner/statistic claims.
- Full DESIGN.md sync / PRODUCT ABE-orange reconciliation.
- Fixing webpack-dev-server staleness beyond noting: main thread must rebuild/`webpack serve` so `:8080` matches `src/` before the next review trusts that URL.
- Hero right-field composition redesign (vast bone is OWN-WORLD; only revisit if Action still fails after plaque mass fix).
- Extra motion beyond demo playback control.

## Do not do

- Do not label world replacement **BLOCKING-DIRECTION** or revive ABE clay chrome / Fredoka / orange CTA against the surface brief.
- Do not restore universal section fade/blur or add staggered builds.
- Do not “fix” partners with more cards, icon rows, pill clusters, or metric grids.
- Do not add section numbers beyond brief-earned 01/02/03 or eyebrow/kicker labels.
- Do not invent new percentages, testimonials, or school relationships.
- Do not implement product source in this review pass — findings only.
