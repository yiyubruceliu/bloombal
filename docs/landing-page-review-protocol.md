# Landing Page Review Protocol — Major Patches

Operational protocol for critical redesign of the Bloombal landing page. **Micro-patch / metric-isolation loops are retired.** Prefer few large structural changes over many small acceptance-metric tweaks.

**Standards source:** [`docs/landing-page-critical-review.md`](./landing-page-critical-review.md)  
**Design craft sources (load when owning the work):**

| Skill | When it owns |
|---|---|
| **Impeccable** (`/impeccable`) | Persuade redesign, critique, distill, layout, typeset, animate, polish — primary craft skill. Prefer `shape` → `new-work` / `distill` / `bolder` over px pad wars. |
| **frontend-design** | Distinctive visual identity when replacing a dead look; anti-generic plan-before-build. |
| **ui-ux-implementer** | Production a11y/responsive implementation after direction is chosen. |
| **ui-ux-pro-max** | Palette/type/style search when exploring alternatives (not for 1px isolation). |
| **splyt-parallax** | Only if the brief explicitly wants Awwwards scroll / GSAP scrub — not default. |

Do **not** run a 50-round metric loop. Do **not** treat optical-Δ / padB / grain-opacity nits as a full round.

---

## 1. Roles

| Role | Who | Responsibilities |
|---|---|---|
| **Main thread** | Implementing agent | Owns direction with human, loads skills, implements **major** change sets, verifies rendered page, accounts iterations |
| **Reviewer (optional)** | Fresh subagent | Only for a **whole-composition** critique after a major ship — not for pixel isolation. Findings must propose ≤3 major moves. |

Main thread may also run Impeccable commands (`critique`, `distill`, `shape`) as the review step when that is sharper than a generic subagent.

---

## 2. Goals and stop condition

1. Land a landing page that **looks and feels intentional** at first viewport + Desire proof — judged by human eye, not by `lmsToDemo ∈ 40–48`.
2. A round is **decent** only when implementation is a **major patch** (see §6).
3. Stop when the human accepts the composition, or explicitly aborts. There is **no** fixed 50-round quota.

---

## 3. Artifacts

```
docs/
  landing-page-critical-review.md
  landing-page-review-protocol.md          # this file (major-patch mode)
  reviews/
    STATE.md
    major-NN/                              # not the old micro iteration-NN tree
      brief.md                             # what this major patch must achieve
      findings.md                          # optional whole-composition critique
      implement.md                         # what shipped + why
```

Keep `docs/reviews/iteration-*` as historical micro-loop archive. **Do not append** more micro iterations there unless the human reopens that mode.

---

## 4. STATE.md

```markdown
# Review loop state

- mode: major
- attempt_index: N          # last major-NN folder used
- decent_completed: D       # major patches landed
- target_decent: human-accept   # not a fixed number
- last_status: decent | too_small | blocked | aborted
- last_iteration: major-NN
- notes: <one line>
```

---

## 5. Loop (main thread)

### 5.1 Prepare

1. Read STATE.md.
2. Load Impeccable context (`impeccable context`) + craft-floor before UI edits.
3. Ensure preview serves **current** `src/` (hard refresh / rebuild if hashes drift).
4. Capture first viewport + Desire + mobile — **look**, don’t only measure.

### 5.2 Define the major patch (brief.md)

Write 3–7 sentences: one composition goal, what dies, what must stay (product truth, CTA URL, real claims only).  
**Banned as the primary goal of a round:** pad isolation px, optical Δ alone, grain opacity alone, dual-gate floor math.

Allowed major goals (examples):

- Replace absolute-positioned hero with a real one-composition layout
- Put **product truth** (real LMS UI / real workflow) in Desire — not a diagram-as-product
- Distill copy + kill costume chrome (indices, over-padding, fashion-doc theater)
- Rebuild type/layout hierarchy for edu B2B Persuade (not Flagship costume by default)
- Full responsive reflow that isn’t a desktop poster with bolted mobile

### 5.3 Review (optional)

If using a subagent or `/impeccable critique`: one whole-page verdict + **≤3 major moves**. No 6-item pad lists.

### 5.4 Implement

1. Ship the major move end-to-end (HTML/CSS/JS as needed). Prefer deleting dead CSS over stacking overrides.
2. Verify in the browser at 1280 and ~390.
3. Write `implement.md` with before/after intent and LOC (informational — gate is §6).

### 5.5 Account

- Major patch landed → `decent_completed += 1`, `last_status: decent`.
- Cosmetic-only / metric-only ship → `too_small`; do not count; next brief must enlarge scope.

---

## 6. Major-patch gate (decent round)

**Pass** if **any** of:

1. **Structural:** Reworks first-viewport composition, section order, or Desire media grammar (not just padding).
2. **LOC:** Changes ≥ **80** lines across landing surface files (`src/index.html`, `src/css/styles.css`, `src/js/script.js`, plus required assets) **and** the change is one coherent idea (not 40 unrelated nits).
3. **World:** Explicit redesign / distill / direction replacement approved by human (Impeccable new-work).

**Fail** if the round is only:

- Pad/scroll-margin/optical-Δ isolation
- Grain opacity / hairline / play font-size alone
- Specificity fixes without composition change
- “Prefer residual” metric theater

---

## 7. Reviewer brief (when used)

```text
You are a landing-page design director. You do NOT edit product source.

Load: docs/landing-page-critical-review.md + Impeccable Persuade craft floor.
Judge the RENDERED page as a whole composition.

Output ONLY docs/reviews/major-NN/findings.md with:
- Verdict (one paragraph, harsh)
- What is costume vs product truth
- At most THREE major moves for the next implement (Problem / Change / Severity / Acceptance)
- Explicit ban: no pad-isolation / optical-Δ / grain-opacity item lists

Stop when written.
```

---

## 8. Default next step after micro-loop failure

1. Human confirms: **refine Flagship** vs **replace the visual world**.
2. Main thread runs Impeccable `shape` / `new-work` (or `distill` if keeping brand but killing costume).
3. Open `docs/reviews/major-01/` and ship the first structural rebuild.
4. Only then optional whole-composition critique — not a 50-round meter.

---

## 9. Historical note

`docs/reviews/iteration-01` … `iteration-50` + `SUMMARY.md` document a completed **micro-patch** quota. That mode is closed. Lessons: metric gates ≠ taste; pad wars ≠ Persuade; diagram ≠ product proof.
