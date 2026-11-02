# Iteration 06 — Critical findings

- Date: 2026-11-01
- Preview URL: http://127.0.0.1:8080/ (**stale**: live still has clay source, “By 2025”, `.look--ink`, no `.partner-strip` / `process-still`, lede **18.4px**. Judgment uses **current `src/`** via inlined CSS/JS on ephemeral :8106; measured desktop 1280×720 + mobile 390×844; captures under `docs/reviews/iteration-06/capture-*.png` + `metrics.json`)
- Decent progress (from STATE): 5 / 50
- Impeccable knowledge applied: yes (skill `C:\Users\yiyub\.claude\plugins\cache\impeccable\impeccable\4.0.4\skills\impeccable\SKILL.md` + `reference/craft-floor.md` + `C:\Users\yiyub\.cursor\skills\impeccable\reference\mode-persuade.md`; Persuade / Flagship Lookbook; no rebuild — not BLOCKING-DIRECTION)

## Verdict

Iteration 05 paid the lede cascade, denser poster + contain, bone About, CTA mass, urgency distill, named partners H2, and dead `#` legal — the funnel *crafts* at the previous depth. The next unpaid failures are conversion grammar, not missing sections: Action’s closing row puts the Trial plaque **beside** `info@bloombal.com` on one line; Attention’s secondary “View the process” computes **16.8px** against a **16px** primary plaque with a **2px** gap; Desire still sells a **white B/W icon flowchart** (sampled mid RGB 255,255,255) while the mechanism sentence claims LMS integration; partners then **double-print** schools as a 32px H2 *and* a mute ~48px logo row under 112px pad. Cover the mark: this is a finished lookbook *document* that still cannot prove product UI, and that trips over its own Action chrome at the close. Keep `luxury-fashion-flagship` — **not** BLOCKING-DIRECTION — but stop treating “process still denser + three CTAs” as finished Desire/Action.

## AIDA

- **Attention (`.look--hero`):** Claim + mark (52px) + desk + ink Validation (13.57:1) + lede **29px** / `--ink` — unpaid iter-05 cascade debt cleared — keep. CTA clear of desk (CTA bottom 476.8 / desk top 532.8) — keep. New depth: `.process-link` font-size **16.8px** vs hero `.cta-trial` **16px**; gap CTA→process **2px** — secondary CTA optically equals/outranks the plaque and crowds the Z-path. CTA area still **0.44×** Validation text (15384 vs 35304). Right ~59% empty bone remains OWN-WORLD. Pinned lede still category-agnostic (brief-locked — do not invent).
- **Interest (`#problem`):** First product-specific beat; title **45.6px** — keep. 112px vertical pad makes this look a full slide before Desire.
- **Desire (`#solution` → `#demo` → `#urgency` → `#partners`):** Order and title ladder (**40.8 → 35.8 → 32 → 28.2** desktop; mobile **29.6 → 26.4 → 24.8 → 22.4 → 20**) — keep. Demo structure (process mp4, process-still, contain, bone frame, no loop) — keep. Content species still fails Persuade: paused poster mid-sample is pure white; diagram is Student → Factor 1 / Written → “Your Knowledge” iconography, **not** an LMS surface; mechanism under it asserts “Integrates with your university LMS…”. Urgency is one beat — keep content — but lives in a **386px** look with **112px** pad. Partners H2 names schools once (good) then a left orphan strip of ~50–72×48 marks repeats the same institutions without type; mobile stacks that strip to **~181px** under the named H2.
- **Action:** Three Trial plaques (hero / post-demo / footer) — count keep. Footer close fails placement: `.cta-trial` is `inline-flex` and `.footer-email` is `inline-block`, so on 1280 the email sits at **y≈3346** beside the plaque (**y≈3329**, x≈442) — Trial and contact share one optical row. About on bone (214px) still inserts a mission restatement between proof and the ink close.
- **Headline-only AIDA test:** Slogan → misconduct → Unlock… → (white Factor diagram) → Cost too high → School names → About → Trial. Spine OK; Desire shows a teaching graphic; Action’s last plaque shares the line with email.

## Look and feel

Flagship Lookbook temperature intact (bone, hairline, monumental serif, rectangular ink plaque). After iter 05 the page reads as a coherent lookbook *document* through Interest, then a whiteboard animation for Desire, then an over-padded name+logo coda, then a footer where Trial is not allowed to stand alone. Institutional temperature is type + desk photo; product temperature is still a B/W explainer. Premium remains negative space plus one wrong *kind* of proof image.

## Colour balance

- Field `--bone` — correct.
- Validation ink + 3px ice underline — scarce — keep.
- CTA fill `var(--ink)` / hover `var(--ink-deep)` — keep.
- Demo content mass is white paper inside bone-deep letterbox (corners sample bone-deep 234,232,227; mid 255,255,255) — white sheet still wins the Desire squint over bone.
- Footer social hover still spends `--ice` as link glitter — secondary; acceptable if scarce elsewhere.
- Squint Attention: navy type + ice hairline + desk + plaque; process underline competes with plaque mass. Squint Desire: large white diagram rectangle. Squint Action: navy footer with plaque+email as a split dark/light pair.

## Borders / edges

- Index-rule clipped to desk top — keep.
- `.demo-frame` bone-deep + 1px ink hairline — correct chrome — keep; interior white sheet is the edge break.
- Partner row: no per-cell borders — keep.
- Section `border-top` hairlines under equal 7rem pads read as slide separators, not material changes.
- Footer: no structural error in rules; the CTA/email inline adjacency is the edge grammar failure (two actions one row).

## Typography

- Faces match the world — keep.
- Desktop + mobile progressive ladder — keep.
- Hero lede **29px** cascade — unpaid debt cleared — keep.
- **Secondary > primary:** process-link **16.8px** Gelasio underline vs CTA Inter **16px** — Action hierarchy inverted at the type level.
- Partners H2 **32px** outweighs mute 48px marks — proof voice still inverted (names loud, marks apologetic).
- About / footer titles share **28.16px** — fine; About body **16px** is quiet correctly but the section still exists.
- Dead rules remain for unused `.em`, `.look h3`, `.look--ink*` — stylesheet costume after HTML cleanup.

## Branding

- Mark 52px + word + ink Validation — swap-logo harder than early iters — keep.
- Product truth still absent from viewport one (OWN-WORLD + pinned lede — accepted debt).
- Desire still fails Persuade (“demonstrate something only this product can prove”): icon flowchart ≠ Bloombal-in-LMS; mechanism copy cannot rescue the media species.
- Partner marks carry institutional colour (blue/red/teal) on bone via multiply — small but real; they fight the monochrome lookbook less than they fail as proof scale.

## Simplicity / complexity

- Hero budget OK; indices brief-earned — keep 01/02/03.
- Desire complexity that should earn place (process media, partner names) is half-paid: names in H2 once, then logos re-tax the beat; media denser but still wrong genre.
- Urgency one paragraph inside a 386px padded look = emptiness sold as prestige.
- About after partners = Action prelude without new decision information.
- Dead CSS (`.em`, `.look--ink`, `.look h3`) is leftover complexity.

## Placement / reading order

- Desktop hero stack (CTA/process above desk) — keep clearance; fix process crowding (**2px** gap).
- Solution: title → white diagram → LMS mechanism → CTA. Support sentence arrives under a non-LMS visual — reading order teaches “flowchart” then claims “LMS.”
- Partners: named H2 → tiny mark row with vast right bone → About → footer. Eye never rests on scaled institutional proof.
- Footer: Trial should lead the close alone; email currently sits mid-row as a sibling action.
- Mobile: brand/CTA above desk OK (process bottom 463 / desk top 625); partners strip stacks ~181px of small logos under the already-named H2.

## Texture

- Bone plate + desk still the only photographic atmosphere in Attention — keep.
- Demo: fashion bone → **flat white diagram paper** (contain letterbox shows bone-deep sides, but the product plane is white). Frame cannot disguise a whiteboard sheet.
- Urgency / partners / About are identical bone voids separated only by hairlines — deck mode returns as equal pads, not equal cards.
- Single ink footer is the right Action material — undermined when Trial shares the opening footer band with email.

## Animation

- Budget still correct: hero `.will-present`, demo `.will-reveal`, reduced-motion short-circuit in JS. Keep; do not add section fades.
- Click-to-play / no loop — keep.
- `html { scroll-behavior: smooth }` still applies under `prefers-reduced-motion` (CSS never gates it) — quiet craft-floor miss; fix without a new motion idea.
- Poster/frame treatments are media truth, not a fourth motion beat.

## Impeccable craft flags

- Persuade: Desire still does not demonstrate something only this product can prove — icon explainer + LMS claim mismatch.
- Craft-floor: secondary control type larger than primary; dual actions on one footer row; equal padded looks reading as slides; dead unused emphasis/ink/h3 rules; smooth-scroll not reduced-motion aware.
- Absolute bans requiring world replacement: none.
- Surface ice `#77cafc` as scarce underline — keep; do not restore ice-fill Validation.
- Dev preview drift: `:8080` still clay/2025/ink About — rebuild before trusting that URL.
- **Not BLOCKING-DIRECTION:** do not replace `luxury-fashion-flagship` / Flagship Lookbook this round.

## Change set for this iteration

1. **Problem:** Footer Action row places Trial plaque and `info@bloombal.com` on one horizontal band (CTA `inline-flex` + email `inline-block`; measured email x≈442 beside plaque) — close loses a single primary action.  
   **Change:** In `styles.css` (footer block): force `.look--footer .cta-trial { display: flex; width: max-content; }` (or `display: block` + fit-content) and `.footer-email { display: block; }` so the stack is Trial → email → social → copyright. Do not add a fourth Trial or change the label/URL.  
   **Severity:** Blocking (AIDA Action / placement).  
   **Acceptance:** At 1280×720, footer email `top` ≥ CTA `bottom`; no side-by-side Trial/email; ≤3 Trial CTAs preserved.

2. **Problem:** Hero secondary `.process-link` computes **16.8px** vs primary CTA **16px**, with only **2px** gap — secondary outranks and crowds Action.  
   **Change:** In `styles.css`: drop `.process-link` to ~0.95rem (≤ CTA), increase `--r-process-link-y` or add margin-top so gap ≥12–16px; keep muted underline, no plaque styling, no ice fill. Optionally nudge `--r-cta-trial-y` slightly up only if still clear of desk (CTA bottom &lt; desk top).  
   **Severity:** Blocking (Attention Action hierarchy).  
   **Acceptance:** Computed process font-size &lt; hero CTA font-size; visible gap under plaque; CTA still clear of desk photo.

3. **Problem:** Desire proof still fails Persuade/texture — poster mid-sample is white RGB(255,255,255); diagram is B/W icon flowchart while `.mechanism` claims LMS; white sheet fights bone despite contain letterbox.  
   **Change:** In assets + light CSS: (a) regenerate `img/plates/process-still.png` from a frame that shows **both** Factor paths (Written *and* Oral / Factor 1+2) at readable density if the mp4 has it — not a single-factor crop; (b) warm the white paper toward the lookbook: e.g. `.demo-video { background: var(--bone-deep); }` already present — add a restrained bone wash (`filter` subtle sepia/contrast *or* a `::after` bone veil at low opacity on `.demo-frame` that does not block controls) so the diagram plane does not read as a third white world. Do not invent LMS UI screenshots; do not reintroduce clay. Keep controls / no loop.  
   **Severity:** Blocking (Desire / Persuade proof / texture).  
   **Acceptance:** Paused demo shows full two-factor density; white field no longer dominates squint vs bone; mechanism LMS claim appears once and is not contradicted by an emptier single-factor still.

4. **Problem:** `#partners` double-prints institutions (32px named H2 + mute ~48px logo row) and burns Desire on **112px** pad around a 48px strip; mobile stacks ~181px of logos under the same names.  
   **Change:** In `index.html` + `styles.css`: pick **one** proof voice — prefer keep the named H2 and **remove the logo strip** *or* drop the H2 to a short proof line and enlarge marks (~64–72px) with optional short Inter labels once. Compress `.look--proof .look-inner` padding (e.g. ~4–5rem, not 7rem). No new schools/stats.  
   **Severity:** High (Desire / simplicity / placement).  
   **Acceptance:** Institutions appear once; partners look is one quiet proof beat; mobile does not pay a tall mute logo stack after the names.

5. **Problem:** `#urgency` (and sibling bone looks) keep **7rem** pad — one-sentence Desire beat sits in a **386px** slide; page returns to equal look rhythm (deck mode without cards).  
   **Change:** In `styles.css`: tighten `.look--story .look-inner` (and optionally `.look--copy` if still 112px with little content) to ~4–5rem vertical; keep solution title/demo relationship; do not flatten the progressive `h2` ladder.  
   **Severity:** High (simplicity / texture / placement).  
   **Acceptance:** Urgency reads as a short beat, not a near-viewport empty poster; hairline still separates looks; title sizes unchanged in order.

6. **Problem:** `#context` About still restates Two-Factor Knowledge Validation between partners and Trial; dead CSS (`.em`, `.look h3`, `.look--ink*`) and ungated `scroll-behavior: smooth` remain craft debt.  
   **Change:** In `index.html`: fold the About sentence into the footer (under Trial / above email) and delete `#context`, *or* keep one quiet line without a competing “About Bloombal” poster H2. In `styles.css`: delete unused `.em` / `.look h3` / `.look--ink` rules; wrap `html { scroll-behavior: smooth }` in `@media (prefers-reduced-motion: no-preference)`.  
   **Severity:** High (Action path / craft-floor cleanup).  
   **Acceptance:** No separate About look before ink close (or About is visibly subordinate); grep shows no orphaned `.look--ink`/`.em`/`.look h3` rules; reduced-motion users get auto scroll-behavior.

## Out of scope this round

- BLOCKING-DIRECTION / new comps / world replacement.
- Inventing new lede copy (brief-pinned) or new partner/statistic claims.
- Shooting real LMS product UI footage (this round: denser two-factor still + bone wash of existing process asset only).
- Full DESIGN.md sync / PRODUCT ABE-orange reconciliation.
- Fixing webpack-dev-server staleness beyond noting: main thread must rebuild/`webpack serve` so `:8080` matches `src/` before the next review trusts that URL.
- Hero right-field composition redesign (vast bone is OWN-WORLD).
- Extra motion beyond existing two beats + click-to-play.
- Re-grading the process animation’s creative direction beyond still density + bone wash.

## Do not do

- Do not label world replacement **BLOCKING-DIRECTION** or revive ABE clay chrome / Fredoka / orange CTA against the surface brief.
- Do not restore ice-fill on Validation or universal section fade/blur.
- Do not “fix” Desire with card grids, icon rows, pill clusters, metric billboards, or a fourth Trial CTA.
- Do not add section numbers beyond brief-earned 01/02/03 or eyebrow/kicker labels.
- Do not invent new percentages, testimonials, or school relationships.
- Do not keep a single-factor / emptiest white sheet as the default poster if a fuller two-factor frame exists in the same mp4.
- Do not leave Trial and email as siblings on one footer row.
- Do not implement product source in this review pass — findings only.
