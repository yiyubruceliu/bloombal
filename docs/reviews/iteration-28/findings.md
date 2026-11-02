# Iteration 28 — Critical findings

- Date: 2026-11-01
- Preview URL: ephemeral inlined `src/` on :8661/:8663/:8665/:8667/:8671/:8673/:8681 (do **not** trust `:8080` alone — `liveLag.hasOverFooterLogicHint: false` still). Measured desktop 1280×720, mid 1120×720, mobile 390×844; captures under `docs/reviews/iteration-28/capture-*.png` + `metrics.json` / `probe.json` / `deep.json` / `extra.json` / `verify.json` / `claimprobe.json` / `accept.json`
- Decent progress (from STATE): 27 / 50
- Impeccable knowledge applied: yes (skill `C:\Users\yiyub\.claude\plugins\cache\impeccable\impeccable\4.0.4\skills\impeccable\SKILL.md` + `reference/craft-floor.md` + Persuade / Flagship Lookbook from `.impeccable/surfaces/src-index-html.md`; no rebuild — not BLOCKING-DIRECTION)
- Protocol focus: verify iter-27 acceptances (CTA→process ≥20 + claimShare prefer ≥40% + footer H2 ≤~solution with ownership) → **Desire prefer-40 PAID** (`claimShare` **40.2%** / `claimH` **289.6** / short **−1.6**); **footer soft-trim PAID** (`h2Fs` **39.2** ≤ solution **40.8**, `h2Vis` **82.3** > `ctaVis` **57.9**, 2-line wrap) → **Attention ctaProc still UNPAID** (**15.9** < 20; was 12.3) and **ledeCta NEW regression** (**16.3**, was **23.5**) → finish Attention dual-seam, then deepen Action email/social hierarchy + Interest texture (not pad wars)

## Verdict

Iteration 27 paid Desire prefer-40 and quieted Action display under solution scale, but the Attention CTA→process restore only half-landed: `ctaProc` rose **12.3 → 15.9** while `ledeCta` collapsed **23.5 → 16.3** under the same absolute nudge (`--r-cta-trial-y: 55.5%` / `--r-process-link-y: 66%`). Desk **172.8** and process→desk **39.6** stay green — the unpaid debt is the lede→Trial→process rhythm, not desk mass. Flagship Lookbook temperature holds. Cover the mark: do **not** reopen Desire prefer-40, footer type ownership, peeks, View process, Interest cascade, or process→desk; restore both Attention seams (≥20), then quiet Action contact meta under Trial and give Interest a material texture beat without inventing pads.

## AIDA

- **Attention (`.look--hero`):** At **1280**: brand + monumental claim + Validation ice + lede→CTA / process / desk hold. Desk visibleH **172.8** — ≥170 **still PAID**. process→desk **39.6** — keep ≥30 (≈9.6px headroom to spend). **ledeCta 16.3 — UNPAID regression** (was 23.5; floor ~**20**). **ctaProc 15.9 — UNPAID residual** (was 12.3; target ≥20; prefer ~22). Absolute grammar: CTA y **55.5%** / process y **66%** / desk y **76%** h **24%**. Hero budget intact; no cards. Fix = move process down more than CTA down so both gaps clear without clawing desk.
- **Interest (`#problem`):** Index-02 land optical **−44.9** (paid), empty-below **52**, field `#f8f6f1` — keep optical. Body **19.52px** / CSS `max-width` **52ch** (**623px**) — cascade **PAID**. Glyph measure ~**63.9ch** (near craft-floor 65–75). Field vs solution bone is barely distinct (`sharedBone: false` but successive near-flat fills) — **Interest texture unpaid deepen** after Attention; do not invent Interest pad wars.
- **Desire (`#solution` → demo → mid Trial):** Process land @1120: title **2 lines**, optical **−85.6** (±120 paid), scroll-margin **212px**, claimShare **40.2%** / claimH **289.6** — prefer ≥40% **PAID** (gate ≥38% already paid). Stack: titleH **75.3** + title→mech **39.2** + mechH **75.8** + mech→lms **31.2** + lmsH **68.2** = **289.6**; mech **25.6px** / lms **23.04px** / LMS ink fw **400**. 1280 land claimShare **42.5%** / optical **−61.4** — comfort keep. Peeks **0** desk+mob — **PAID**. View process clear — **PAID**. Genre honesty (diagram ≠ LMS product UI) remains asset debt — defer; do not reopen claim stack.
- **Action:** Three Trial plaques; footer bone-on-ink; sticky hide / `is-past` — keep. Footer H2 soft-trim **PAID**: `h2Fs` **39.2** ≤ solution **40.8**, 2-line wrap (`7.5ch`), `h2Vis` **82.3** > `ctaVis` **57.9**, pad-top **52**. Ladder now problem **45.6** → solution **40.8** → footer **39.2** → urgency **35.84** → partners **31.36** — quietness **PAID**. Residual: at footer-start, email (`t` **499**) + social (`t` **538**) + copyright sit in the same decision frame as H2+Trial; email/social share **0.9rem** / **0.85** opacity and **ice hover** — tertiary contact chrome competes with Persuade close. Deepen Action hierarchy next (not type clamp).
- **Headline-only AIDA test:** Slogan → misconduct → Unlock… → factors → LMS quiet → View process → Trial → Cost too high → partners → Trial Bloombal. Spine OK; Desire prefer + Action type paid; Attention dual-seam + Action contact meta + Interest texture are the unpaid deepen.

## Look and feel

Flagship Lookbook temperature intact (bone, hairline, Gideon display, rectangular Trial, desk plate). Quiet “View process” matches lookbook paper. Consequence isolation clear (peeks **0**). Residual failures: Attention lede↔CTA↔process crush from iter-27 absolute nudge; Action contact meta equal-weight under Trial; Interest near-flat successive fills.

## Colour balance

- Field `--bone` — correct.
- Validation ice underline — scarce — keep; do not ice-fill CTAs or View process.
- Hero/mid CTA ink-on-bone; footer bone-on-ink — keep.
- `.demo-play` `rgb(246,244,239)` vs Trial `rgb(8,40,72)` — scarcity keep.
- `.look--story` `#f1efe9` ≠ solution — keep.
- `.look--proof` `--bone-deep` — keep.
- `.look--copy` `#f8f6f1` ≠ solution — keep hue family; deepen material, not a third saturated field.
- Partner grayscale+multiply — keep.
- Sticky indices stone; `is-past` at Consequence — keep.
- `.mechanism-lms` colour `rgb(8,40,72)` — ink weight **paid**.
- **Ice on `.footer-email:hover` / `.social-links a:hover`** burns scarce accent on tertiary Action chrome — quiet in change set item 2.

## Borders / edges

- Index-rule fixed short — keep.
- `.demo-frame` bone-deep + 1px ink hairline; View process bone + stronger hairline — keep.
- Story→proof, solution→story, copy→solution hairlines dropped — keep.
- `.look--copy` `border-top: 1px solid rgba(8,40,72,0.08)` under hero — acceptable Interest entry; may reinforce lightly with texture, not a new card border.
- Partners: no per-cell borders — keep; FH Wien plate denser (asset debt).
- View process clear of video box — **paid** (`overlapsVideo: false`, `fromVideoTop: −38.4`).

## Typography

- Faces match the world (Gideon / Gelasio / Inter chrome) — keep.
- Desktop ladder measured: problem **45.6** → solution **40.8** → footer **39.2** → urgency **35.84** → partners **31.36** — footer ≤ solution **PAID**; do not reopen clamp.
- **≤1279 Desire measure keep:** `.look.look--solution h2` / mobile `min(28ch,100%)` → 1120 **2 lines / 511.6px / h 75.3**.
- 1120 optical **−85.6** — paid vs ±120; do not claw back measure.
- Claim stack @1120: **289.6** (**40.2%**) — prefer ≥40% **PAID**.
- Interest: `.look.look--copy p` **1.22rem** / **52ch** wins cascade — **PAID**.
- Footer email/social **0.9rem** Inter equal weight — quiet toward copyright scale without killing tap targets.

## Branding

- Mark + word on stack — keep.
- Product truth still absent from viewport one (OWN-WORLD + pinned lede).
- Desire diagram ≠ Bloombal-in-LMS — accepted asset debt; LMS sentence precedes media; “View process” honesty **paid**.
- Partners institutional sentence present — keep.

## Simplicity / complexity

- Hero budget OK at 1280; indices brief-earned 01/02/03 — keep count.
- Desktop mid-CTA / after-demo / partners-centred isolation vs urgency/contact — **paid**.
- Urgency-centred desktop: partners H2 **0**; partners section **0** — Consequence isolation **PAID**.
- Mobile urgency-centred: mid Trial **0**, partners H2 **0**, contact H2 **0**, partners section **0** — **PAID**.
- Do not invent new pad fronts on paid frames. Finish Attention dual-seam, then Action contact meta + Interest texture — not pad wars.

## Placement / reading order

- **First-viewport Z (1280):** brand → claim → Validation → lede → CTA → process → desk — keep; process→desk **39.6** paid; desk **172.8** paid ≥170; **ledeCta 16.3 unpaid**; **ctaProc 15.9 unpaid** (eye path compresses lede → Trial → View process).
- **Interest landing:** optical Δ **−44.9** — **paid**.
- **Sticky look nav:** footer hide paid; **`is-past` at Consequence paid**.
- **Stack rail vs copy:** clearance **8**, overlapX **0** — **paid**.
- **Mid CTA / after-demo block centre (1280):** urgency **0**, Δcx **0**, `needExtra 0` — **paid**.
- **Partners strip / section centre:** urgH2 **0**, contactH2 **0** — isolation **paid**.
- **Urgency centre (1280):** urgOptical **−94.9**; partners H2 **0**; **partners section peek 0** (`storyBottom`/`proofTop` **744.9**) — **PAID**.
- **Secondary CTA / process land @1120:** title **2 lines**, optical **−85.6**, scroll-margin **212px**, claimShareOfVh **40.2%** — prefer ≥40% **PAID**.
- **Desktop process land @1280:** optical **−61.4** / demoVis **~126** / claimShare **42.5%** — comfort keep.
- **Mobile 390 urgency centre:** mid Trial **0**, partners H2 **0**, contact H2 **0**, partners section **0** — **PAID**.
- **View process:** top-left, oral overlap **0**, quiet vs Trial, `overlapsVideo: false` — **paid**.
- **Footer start (1280):** footerTopVp **~267**; H2 vis **82.3** (2-line 39.2/82.3); CTA vis **57.9** — Action H2 ownership **PAID**; email+social+copyright co-present in frame — hierarchy residual.

## Texture

- Hero: bone plate + desk photography — Attention atmosphere present; desk **172.8** paid ≥170; lede/CTA/process crush is spacing debt, not texture.
- Demo: bone-deep matte + hairline; quiet View process — Desire chrome **paid**.
- Proof settle motion — keep; do not add section-fade stacks.
- Interest field successive near-flat fills (`#f8f6f1` → bone → `#f1efe9` → bone-deep) — acceptable hue ladder but **Interest material still slide-like**; deepen with quiet paper grain / vignette / soft plate — not new section padding.
- Ink footer material correct; Action type quietness paid; contact meta weight residual.

## Animation

- Proof settle third hierarchy beat — **shipped**; keep count at three; no PowerPoint card staggers; do not add a fourth idea this round.
- Hero + demo presence: transform-only — keep.
- Reduced-motion: control remains; demo not blanked; proof settle forced static — keep.
- Measure `motionIdeaCount: 2` is stale instrumentation — ignore as product truth.

## Impeccable craft flags

- Persuade: Desire prefer-40 **paid** (**40.2%**); Action footer type quiet + ownership **paid** (`39.2` ≤ `40.8`, `h2Vis` **82.3** > `ctaVis` **57.9`); Attention ledeCta **16.3** + ctaProc **15.9** **unpaid**; Action email/social equal-weight + ice hover under Trial **unpaid**.
- Craft-floor: Interest body size cascade **paid**; continuous glyph measure ~64 near 65–75; Interest material texture thin; View process/media clear **paid**; LMS ink **paid**; Consequence isolation **paid**; process→desk seam **paid**; demo genre still diagram-as-product (asset debt); ice accent used on footer tertiary hover.
- Absolute bans requiring world replacement: none.
- Surface ice `#77cafc` as scarce underline / focus / selection — keep; strip from footer email/social hover.
- Dev preview drift: `:8080` still missing over-footer hint — rebuild/`webpack serve` before trusting that URL.
- **Not BLOCKING-DIRECTION:** do not replace `luxury-fashion-flagship` / Flagship Lookbook this round.
- **Gate status:** peeks **0** **PAID**; process→desk **PAID**; claimShareOfVh @1120 **40.2%** **PAID** vs prefer ≥40%; Action ownership + type quiet **PAID**; desk ≥170 **PAID**. Dual Attention seams unpaid — restore first; then Action contact meta + Interest texture (not pad wars).

## Change set for this iteration

1. **Problem:** Attention dual-seam unpaid after iter-27 absolute nudge: at 1280 first viewport `ledeCta` **16.3** (was **23.5**; floor ~**20**) and `ctaProc` **15.9** (was **12.3**; target ≥**20**) while desk **172.8** / process→desk **39.6** / Desire prefer-40 / Action footer stay green. Lede → Trial → “View the process” read cramped — Persuade Attention rhythm fails claim→support→secondary path. Absolute vars: `--r-cta-trial-y: 55.5%`, `--r-process-link-y: 66%`, `--r-desk-still-y: 76%` / `h: 24%`.  
   **Change:** In `styles.css` hero Flagship grammar: restore **both** `ledeCta` ≥20 and `ctaProc` ≥20 (prefer ~22 each). Move process down **more** than any CTA down so growing lede→CTA does not re-crush CTA→process; spend process→desk headroom (now **39.6**, floor **30**) before touching desk. Keep desk visibleH **≥170**, process→desk **≥30**. Do not claw desk under 170; do not collapse process into desk; do not raise lede. No hero cards / badges / ice-filled CTA.  
   **Severity:** High (Persuade Attention / §8 scan path — required unpaid deepen; iter-27 residual + regression).  
   **Acceptance:** At 1280 first viewport: `ledeCta` ≥20; `ctaProc` ≥20; deskVis ≥170; procDesk ≥30; brand+claim+lede+CTA+process+desk still in frame; no hero cards; peeks+claimShare≥40%+Action h2Vis>ctaVis+footer≤solution still green.

2. **Problem:** Action H2 ownership + type quiet paid, but at footer-start 1280 the contact stack (email `t` **499**, social `t` **538**, copyright) shares the decision frame with Trial; `.footer-email` / `.social-links a` share **0.9rem** / **rgba(…,0.85)** and **ice hover** — tertiary chrome equals secondary and burns scarce accent. Persuade close should read H2 → Trial, with contact as quiet afterthought.  
   **Change:** **Only after item 1 acceptance is green in-preview (may ship with 1).** In `styles.css` (footer block): (a) increase separation after `.look--footer .cta-trial` so email sits further from the plaque; (b) quiet email+social toward copyright weight (smaller rem and/or lower opacity ~0.55–0.7); (c) replace ice hover with bone opacity lift (keep ice for Validation/focus/selection only). Keep left editorial column ≤520; bone-on-ink Trial; 2-line H2; no fourth Trial; do not enlarge footer H2. Optional: group email+social as one quieter meta row without new cards.  
   **Severity:** High polish (Persuade Action hierarchy — next unpaid AIDA after type paid).  
   **Acceptance:** Footer-start 1280: `h2Vis` still > `ctaVis`; footer font-size still ≤ solution; email/social visibly quieter than Trial and not ice-hover; sticky indices hidden; partners isolation 0; item 1 still green.

3. **Problem:** Interest optical/cascade paid, but `.look--copy` `#f8f6f1` → solution bone → story `#f1efe9` still reads as successive flat slides — craft-floor / standards §9 texture debt on the Interest beat (not a pad problem).  
   **Change:** **Only after items 1–2 green (may ship with 2).** Add one quiet material cue on `.look--copy` only — e.g. soft paper grain/noise pseudo-plate, or a restrained vignette/inner wash that keeps type ≥4.5:1 — without changing Interest padding, optical land, or inventing section-fade motion. Do not add cards, icon rows, or a new accent hue. Keep `#f8f6f1` family (or equivalent bone-adjacent paper).  
   **Severity:** Polish (Interest texture deepen — listed unpaid craft gap; not pad wars).  
   **Acceptance:** Interest land @1280 optical still within paid band (~−45 ± tolerance); body cascade size/measure unchanged; texture readable as material not decoration; items 1–2 still green; no new hero/Desire pad wars; peeks still 0.

## Out of scope this round

- BLOCKING-DIRECTION / new comps / world replacement.
- Inventing new lede copy (brief-pinned) or new partner/statistic claims.
- Shooting real LMS product UI footage (Desire genre debt remains beyond copy honesty) — defer genre art direction.
- Full DESIGN.md sync / PRODUCT ABE-orange reconciliation.
- Fixing webpack-dev-server staleness beyond noting: main thread must rebuild/`webpack serve` so `:8080` matches `src/` before the next review trusts that URL.
- Hero right-field composition redesign that abandons full-bleed desk (OWN-WORLD).
- Extending look-indices past brief-earned 01/02/03.
- Re-grading the process diagram’s creative direction (genre art direction).
- FH Wien logo plate density vs siblings (asset).
- Re-inking `.demo-play` to match `.cta-trial`.
- Opening new pad wars on already-clear mid-CTA / after-demo / partners-centred / Interest land / View process / urgency→partners section / process→desk / Action ownership / Desire prefer-40 frames.
- Raising proof look-inner `padding-top` or clawing story `min-height` enough to reintroduce partners section peek.
- Declaring Desire prefer-40 unpaid — **40.2%** is paid; do not reopen claim stack.
- Declaring Action type unpaid — footer **39.2** ≤ solution **40.8** with `h2Vis` > `ctaVis` is paid; do not reopen clamp as primary work.
- Re-litigating Interest cascade size (19.52 paid) as the texture vehicle.
- Adding a fourth motion idea now that proof settle exists.
- Reverting claimShare below 40% or desk below 170 while chasing Attention seams.
- Declaring Attention paid at ledeCta **16.3** / ctaProc **15.9**.

## Do not do

- Do not label world replacement **BLOCKING-DIRECTION** or revive ABE clay chrome / Fredoka / orange CTA against the surface brief.
- Do not restore ice-fill on Validation or universal section fade/blur.
- Do not “fix” Desire/Action with card grids, icon rows, pill clusters, metric billboards, or a fourth Trial CTA.
- Do not add section numbers beyond brief-earned 01/02/03 or eyebrow/kicker labels.
- Do not invent new percentages, testimonials, or school relationships.
- Do not declare Attention paid while either `ledeCta` or `ctaProc` is under **20**; do not claw desk under **170** or process→desk under **30** to fake the gaps.
- Do not declare Desire prefer-40 unpaid at **40.2%** / reopen mech/lms type.
- Do not invent pad wars on paid frames (mid-CTA, after-demo block, partners-centred, Interest optical, View process clear, urgency→partners section **0**, process→desk seam, claimShare ≥40%, Action h2Vis>ctaVis, desk ≥170, footer ≤ solution).
- Do not claw back stack rail clearance below **8px**.
- Do not re-ink `.demo-play` to match `.cta-trial`.
- Do not revert sticky `is-past` honesty at Consequence, proof `--bone-deep`, story `#f1efe9`, Interest `#f8f6f1` family, View process top-left oral clear + video clear, after-demo/mobile Trial clears, solution `scroll-margin-top: 13.25rem`, solution `min(28ch,100%)` at ≤1279, partners H2 clamp band (~31.36), story `min-height` clear, “View process” label/aria, footer column ≤520 left, Interest `.look.look--copy p` cascade, footer 2-line `7.5ch` wrap + soft-trim clamp that paid quiet ownership, or proof settle reduced-motion path.
- Do not deepen Action contact meta / Interest texture **instead of** restoring both Attention seams — dual-seam restore is **required first**.
- Do not keep ice hover on footer email/social while calling accent scarce.
- Do not implement product source in this review pass — findings only.
