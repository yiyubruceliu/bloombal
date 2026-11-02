# Iteration 10 — Critical findings

- Date: 2026-11-01
- Preview URL: http://127.0.0.1:8080/ (**stale**: live still `#statistics` / `#about` / no `#partners` / no `mechanism-lms`. Judgment uses **current `src/`** via inlined CSS/JS on ephemeral :8112/:8113; measured desktop 1280×720, mid 1120×720, wide 1440×900, mobile 390×844; captures under `docs/reviews/iteration-10/capture-*.png` + `metrics.json` + `deep-s8.json`)
- Decent progress (from STATE): 9 / 50
- Impeccable knowledge applied: yes (skill `C:\Users\yiyub\.claude\plugins\cache\impeccable\impeccable\4.0.4\skills\impeccable\SKILL.md` + `reference/craft-floor.md` + `C:\Users\yiyub\.cursor\skills\impeccable\reference\mode-persuade.md`; Persuade / Flagship Lookbook; no rebuild — not BLOCKING-DIRECTION)
- Protocol focus: **§8 Placement, Reading Order, and Scan Paths**

## Verdict

Iteration 09 paid stacked hero paint order, process/CTA/desk clearance, partner distribution, urgency/after-demo pad, and hero presence without opacity blank — Attention is readable again under 1280, and the 1280 poster keeps CTA mass (**0.56×** Validation) with process gap **33.9px**. The next unpaid failure is deeper and mostly §8: the Attention secondary **“View the process” → `#demo`** drops the visitor onto Desire media with **solution title + mechanism above the fold (0 visible px)** and Interest never entered — hash land and click both measured. On the same scaffold, lede→CTA gap collapses to **1.9px** (stack **0px**), Desire reading column **zigzags** (look-inner **920@180** → demo **1100@90** → Trial back left), partners `space-between` opens **~223px** voids (strip occupancy **27.8%**), muted LMS still wedges Action under the demo, and demo `.will-reveal` still blanks from opacity ~0 (hero fixed; demo unpaid). Cover the mark: a lookbook that finally shows its hero, then breaks its own Z-path the moment someone follows the secondary CTA. Keep `luxury-fashion-flagship` — **not** BLOCKING-DIRECTION — but stop treating “stack z-index + pad cuts” as finished scan-path craft.

## AIDA

- **Attention (`.look--hero`):** At **1280**: claim + mark + desk + ink Validation + lede 29px + CTA mass **0.56×** Validation — iter-09 mass/gap keep (process gap **33.9**, process–desk **21.6**, CTA–desk **87.9**). Right ~**59.1%** empty bone — OWN-WORLD. **New blocking (§8):** lede bottom **397.7** / CTA top **399.6** → gap **1.9px** — support fused to Action; stack 1120 ledeCtaGap **0**. Secondary `.process-link` → `#demo` is a funnel skip (see Desire). Stack ≤1279: `position: relative; z-index: 5` — unpaid paint burial cleared — keep.
- **Interest (`#problem`):** First product-specific beat; title ladder keep. Entire look is bypassed when visitors use “View the process.”
- **Desire (`#solution` → `#demo` → `#urgency` → `#partners`):** Diagram-true mechanism above media + LMS secondary under demo — honesty keep. **§8 fails:** (1) process/hash to `#demo` lands with `#solution-title` at **t≈−242** and `.mechanism` at **t≈−85** (both above); measured after click `problemVisible: false`. (2) Horizontal restart: title center **402** / demo center **640** / mid CTA center **309**; `deltaTitleDemoLeft −90`. (3) After-demo order still LMS (**55px**) then Trial — quiet copy before Action. (4) Partners marks-only keep voice, but `justify-content: space-between` yields gaps **222.9 / 224.7** and occupancy **27.8%** — proof as three islands. Urgency pad ratio **0.37** / **258px** — improved; still sits *before* logos so institutional Desire arrives as a coda. Genre debt (icon flowchart ≠ LMS UI) remains deferred.
- **Action:** Three Trial plaques; footer bone-on-ink — keep. Order H2 → CTA → email → social → copyright — keep. Mid Trial only after LMS line under a skipped headline when arriving via process.
- **Headline-only AIDA test:** Slogan → misconduct → Unlock… → factors → (icon sheet) → LMS quiet → Cost too high → mute logos → Trial. Spine OK on linear scroll; **broken for the hero’s own secondary path**.

## Look and feel

Flagship Lookbook temperature intact (bone, hairline, monumental serif, rectangular plaques). Premium restraint still reads; the failure is path grammar — a fashion poster whose secondary link teleports into a floating video without the Desire claim that makes the video mean something. Institutional temperature survives linear scroll; it does not survive the process shortcut.

## Colour balance

- Field `--bone` — correct.
- Validation ink + 3px ice underline — scarce — keep.
- Hero/mid CTA ink-on-bone; footer bone-on-ink — keep; do not ice-fill.
- Partner grayscale+multiply — keep; sparseness is placement, not chroma.
- `.mechanism-lms` muted on bone ~**5.35:1** — readable; scarcity OK if it stops blocking the Trial Z.
- Squint Desire: bone-matted diagram keep; native control gradient still eats lower Oral row (genre/chrome debt).

## Borders / edges

- Index-rule clipped to desk top — keep.
- `.demo-frame` bone-deep + 1px ink hairline — keep.
- Footer bone plaque edge — keep.
- Partners: no per-cell borders — keep; voids are the grammar fail.

## Typography

- Faces match the world — keep.
- Desktop ladder **45.6 → 40.8 → 35.8 → …** — keep.
- Process **0.95rem** under CTA **1.02rem** at 1280; mobile process **14.08 &lt; CTA 15.2** — keep.
- Solution H2 `max-width: 20ch` → **443.9×137.1** three-line left column beside a **1100px** media band — type measure fights media measure (§8 zigzag).
- Lede optically collides with plaque — Attention hierarchy debt from CTA growth without retiming lede/CTA tokens.

## Branding

- Mark 52px + word visible on stack — unpaid burial cleared — keep.
- Product truth still absent from viewport one (OWN-WORLD + pinned lede).
- Desire diagram ≠ Bloombal-in-LMS — accepted asset debt.
- Institutional marks exist but under-clustered (space-between islands) — Desire proof underweight as a *group*.

## Simplicity / complexity

- Hero budget OK at 1280; indices brief-earned 01/02/03 — keep count (still omit urgency/partners/contact — OWN-WORLD).
- Process shortcut adds a second, dishonest Desire entry — complexity that deletes Interest.
- LMS line earned as honesty; placement as Action wedge is unpaid simplicity debt.
- Partner strip over-distributes three marks across 920px — emptiness without new content.

## Placement / reading order (§8)

- **First-viewport Z (1280):** brand → claim → Validation → lede → CTA → process → desk — order correct; **lede→CTA spacing fails** (1.9px).
- **Secondary CTA:** must land the eye on Desire *entry* (title → mechanism → media), not mid-band `#demo`. Current hash/click: media + LMS + Trial with claim off-screen.
- **Desire column:** essay measure (920) → wider demo (1100, −90px left) → left Trial — forces re-acquisition twice. Prefer one reading left edge through title/mechanism/demo/CTA.
- **After-demo:** Trial should continue the demo’s Z; LMS as caption under Trial or already-covered above-media claim — not a muted paragraph between proof and Action.
- **Partners:** three marks should read as one institutional beat (tight group), not space-between across the full measure; then ink footer.
- **Urgency → partners → footer:** proof after consequence is a soft Desire coda; acceptable if marks cluster; currently thin + sparse.
- Indices JS still only `#home|#problem|#solution` and live only inside the hero frame — OWN-WORLD unless extended; not sticky, so “stuck on 03” off-screen is secondary to the process skip.
- Stack 390: copy above desk (process clear **168.8**); partners single row nowrap — iter-09 orphan wrap cleared — keep.

## Texture

- Bone plate + desk — Attention atmosphere keep; copy must stay clear of CTA collision.
- Demo: bone matte keep; native chrome gradient still masks Oral — deferred chrome debt.
- Urgency/partners hairline bone — partners emptier as *horizontal* texture (223px gaps) than as pad.
- Ink footer material correct — keep.

## Animation

- Budget still two beats + click-to-play — keep; do not add section fades.
- Hero presence: transform-only, opacity 1 — unpaid blanking cleared — keep.
- **Demo unpaid:** `.will-reveal { opacity: 0 }` still injects; measured early opacity **~0.87** before `is-in`. Combined with process→`#demo`, the shortcut can land on a fading plate. Match hero: already-visible default; transform/filter only; reduced-motion static.

## Impeccable craft flags

- Persuade: secondary path skips the offer sentence that makes the demo intelligible; Desire still cannot show only-this-product LMS UI (deferred).
- Craft-floor: lede/CTA collision; responsive composition zigzag; partner proof under-clustered; demo motion blanking; body/section measure disagreement (920 vs 1100).
- Absolute bans requiring world replacement: none.
- Surface ice `#77cafc` as scarce underline — keep; do not ice-fill Validation or CTA.
- Dev preview drift: `:8080` still statistics/about — rebuild before trusting that URL.
- **Not BLOCKING-DIRECTION:** do not replace `luxury-fashion-flagship` / Flagship Lookbook this round.

## Change set for this iteration

1. **Problem:** `.process-link` href `#demo` (and direct `#demo` hash) scroll so `#solution-title` and `.mechanism` sit above the viewport (**visiblePx 0**); Interest `#problem` also skipped. §8 scan path claim → support → evidence breaks on the hero’s own secondary CTA.  
   **Change:** In `index.html`: point `.process-link` to `#solution` (Desire entry). In `styles.css`: add modest `scroll-margin-top` on `#solution` (e.g. ~1–2rem) so title lands in the optical centre after smooth scroll. Do not invent copy; do not remove the secondary CTA.  
   **Severity:** Blocking (Attention→Desire placement / AIDA / §8).  
   **Acceptance:** Click “View the process” at 1280×720 → solution H2 and mechanism have visible pixels in-viewport above or with the demo; `#problem` may still be above (acceptable if Desire entry is intact); mid CTA not the first readable Desire node.

2. **Problem:** Hero lede→CTA gap **1.9px** at 1280 (stack 1120 **0px**) after CTA mass growth — support fused to Action on the Z-path.  
   **Change:** In `styles.css` hero tokens: nudge `--r-cta-trial-y` down (and `--r-process-link-y` with it) and/or tighten lede block padding so lede→CTA gap ≥12px while keeping process→CTA ≥12px and process/CTA clear of desk (≥12px). On ≤1279 stack, ensure `.hero-lede` margin-bottom restores ≥12px before `.cta-trial` (currently margin collapses into 0 gap). No ice fill; no fourth CTA.  
   **Severity:** High (Attention placement / hierarchy).  
   **Acceptance:** At 1280 and 1120, measured lede bottom → CTA top ≥12px; process/desk clearances hold; CTA mass stays ≥~0.5× Validation.

3. **Problem:** Desire horizontal zigzag — `.look--solution > .look-inner` **920px @ left 180** vs `#demo` **1100px @ left 90** vs mid Trial left-aligned in the narrow column (centers **402 / 640 / 309**). Eye restarts twice in one look.  
   **Change:** In `styles.css`: align Desire measures — prefer set `.demo-band` width to the same `min(920px, calc(100% - 4rem))` (and matching horizontal inset) as `.look-inner`, *or* widen only the solution title/mechanism inner to the demo band’s width so left edges agree. Keep bone frame; no card grid.  
   **Severity:** High (Desire placement / §8).  
   **Acceptance:** At 1280, solution title left edge within ~8px of demo-band left edge (or shared center); mid CTA shares that column; no −90px jump.

4. **Problem:** `#partners` `justify-content: space-between` opens **~223px** gaps; mark occupancy **27.8%** of strip — institutional proof reads as three stranded marks, not one Desire beat.  
   **Change:** In `styles.css`: cluster the row (`justify-content: center` + `gap: ~2–2.75rem`, drop `flex: 1 1 0` stretch) so three grayscale marks sit as one group; keep max-height ~72–96px; nowrap on mobile. No name-line double-print; no new schools.  
   **Severity:** High (Desire / branding / §8).  
   **Acceptance:** Inter-mark gaps ≪ 100px on 920px measure; strip no longer looks half-empty between marks; single row at 390.

5. **Problem:** `.look-inner--after-demo` still orders muted `.mechanism-lms` **before** mid `.cta-trial` — proof → quiet LMS → Action; §8 wants CTA in the continuation path under evidence.  
   **Change:** In `index.html`: swap so Trial plaque sits immediately under the demo band; keep LMS as one quiet line *under* the plaque (or fold LMS into a single caption already covered by the above-media mechanism — prefer under-CTA if LMS must remain once). No fourth CTA; no new claims.  
   **Severity:** High (Action placement / Desire→Action §8).  
   **Acceptance:** Reading order under demo is Trial then optional LMS (or LMS absent if redundant); measured `cta.top` &lt; `lms.top` if both remain.

6. **Problem:** Demo presence still uses `.will-reveal { opacity: 0 }` (measured ~0.87 mid-transition); hero was fixed to visible-default, demo was not — craft-floor miss compounded by process→demo landings.  
   **Change:** In `styles.css` + `script.js`: mirror hero — keep demo opacity 1; animate only `transform` (small Y) into `.is-in`; reduced-motion short-circuit unchanged. Do not add section fades.  
   **Severity:** High (animation / Desire reliability / §8 arrival).  
   **Acceptance:** Disable JS → demo poster visible; with JS → no post-paint full hide; process/#solution arrival never shows an empty bone hole where the frame is.

## Out of scope this round

- BLOCKING-DIRECTION / new comps / world replacement.
- Inventing new lede copy (brief-pinned) or new partner/statistic claims.
- Shooting real LMS product UI footage (Desire genre debt remains).
- Full DESIGN.md sync / PRODUCT ABE-orange reconciliation.
- Fixing webpack-dev-server staleness beyond noting: main thread must rebuild/`webpack serve` so `:8080` matches `src/` before the next review trusts that URL.
- Hero right-field composition redesign (vast bone is OWN-WORLD).
- Extending look-indices past brief-earned 01/02/03 or making them sticky.
- Extra motion beyond repairing the demo presence beat.
- Replacing the process diagram’s creative direction / killing native video chrome gradient.

## Do not do

- Do not label world replacement **BLOCKING-DIRECTION** or revive ABE clay chrome / Fredoka / orange CTA against the surface brief.
- Do not restore ice-fill on Validation or universal section fade/blur.
- Do not “fix” Desire with card grids, icon rows, pill clusters, metric billboards, or a fourth Trial CTA.
- Do not add section numbers beyond brief-earned 01/02/03 or eyebrow/kicker labels.
- Do not invent new percentages, testimonials, or school relationships.
- Do not leave `.process-link` pointed at `#demo` while solution claim sits above the fold.
- Do not keep lede–CTA optical collision under 12px after CTA mass work.
- Do not implement product source in this review pass — findings only.
