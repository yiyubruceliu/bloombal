# Landing Page Review Protocol

Operational protocol for iterative critical review of the Bloombal landing page. Follow exactly. Do not collapse roles, skip rounds, or treat polish nits as a full round.

**Standards source:** [`docs/landing-page-critical-review.md`](./landing-page-critical-review.md)  
**Design craft source:** Impeccable skill (`/impeccable`) — load and apply as review knowledge (modes, craft floor, Persuade-surface expectations, anti-patterns). Do not run a full Impeccable rebuild unless the findings explicitly require direction replacement.

---

## 1. Roles

| Role | Who | Responsibilities |
|---|---|---|
| **Main thread** | Developer / implementing agent | Owns the loop, spawns the reviewer subagent, implements accepted changes, measures LOC delta, manages iteration accounting, commits nothing unless asked |
| **Reviewer subagent** | Fresh subagent each round | Reads standards + Impeccable knowledge, critically reviews the **rendered** look and feel, writes findings MD, then **terminates** |

The main thread never reviews itself for the round it will implement. The subagent never edits product source. One reviewer subagent per iteration; kill it when the findings file is written.

---

## 2. Goals and stop condition

1. Complete **50 decent review rounds** (`decent_completed == 50`).
2. A round is **decent** only when the main thread’s implementation for that round changes **≥ 5 lines of code** across the landing surface files (see §6).
3. If a round’s implementation is **&lt; 5 LOC**, it still gets an iteration folder/number, but it **does not** increment `decent_completed`. Instead increment `attempt_index` and continue (`51`, `52`, …) until 50 decent rounds exist.
4. Stop only when `decent_completed == 50`, or when the human explicitly aborts.

Do not declare “page is done” early. Diligence means running the full quota of decent rounds even if later rounds shift from structural to craft refinement — but each decent round must still propose and land material change (≥ 5 LOC), not rubber-stamp.

---

## 3. Required artifacts

```
docs/
  landing-page-critical-review.md          # standards (input)
  landing-page-review-protocol.md          # this protocol
  reviews/
    STATE.md                               # live counters + pointers
    iteration-01/
      findings.md                          # subagent output
      implement.md                         # main thread: what was done + LOC proof
    iteration-02/
      ...
    iteration-NN/
      findings.md
      implement.md
```

Create `docs/reviews/` on first run. Never overwrite a prior iteration’s files; always open a new `iteration-NN` directory.

---

## 4. State file

Maintain `docs/reviews/STATE.md` after every round:

```markdown
# Review loop state

- attempt_index: N          # last iteration folder number used (01, 02, …)
- decent_completed: D       # count of rounds with ≥ 5 LOC implemented
- target_decent: 50
- last_status: decent | too_small | blocked | aborted
- last_iteration: iteration-NN
- notes: <one line>
```

Rules:

- `attempt_index` increments by 1 every time a findings file is written (every spawned review).
- `decent_completed` increments by 1 only when §6 LOC gate passes.
- Folder name is always `iteration-{attempt_index}` zero-padded to 2 digits until 99, then 3+ as needed (`iteration-01` … `iteration-50` … `iteration-51` …).

---

## 5. Iteration loop (main thread)

For each attempt until `decent_completed == 50`:

### 5.1 Prepare

1. Read `docs/reviews/STATE.md` (create if missing with zeros).
2. Set `N = attempt_index + 1`.
3. Ensure the local preview is serving current source (e.g. `http://localhost:8080/`).
4. Capture current visual truth if possible (desktop first viewport + one scrolled proof section). Prefer live render over memory.
5. Create `docs/reviews/iteration-{NN}/`.

### 5.2 Spawn reviewer subagent

Spawn a **new** subagent with the brief in §7. Pass:

- Absolute path to `docs/landing-page-critical-review.md`
- Instruction to use **Impeccable** skill knowledge (`/impeccable`) as part of evaluation criteria
- Paths to current landing sources (`src/index.html`, `src/css/styles.css`, `src/js/script.js`, and related assets as needed)
- Preview URL if available
- Output path: `docs/reviews/iteration-{NN}/findings.md`
- Prior iteration findings path (if `N > 1`) — reviewer must not repeat identical advice without new evidence; escalate or go deeper

Subagent model: use the session default unless the human specifies otherwise. Prefer a model suited to careful visual critique.

### 5.3 Wait for findings, then kill

1. Wait until `findings.md` exists and is complete (all sections in §8).
2. **Terminate / do not resume** that subagent. No follow-up chat with it. Next round = new spawn.
3. Main thread reads `findings.md` and plans implementation.

### 5.4 Implement (main thread only)

1. Implement **blocking** items first, then the highest-leverage polish items listed for this round.
2. Stay inside the committed visual world unless findings explicitly call for world replacement (then stop and ask the human before redesign).
3. Re-verify in the browser after changes (look at the rendered page; do not trust diff alone).
4. Write `docs/reviews/iteration-{NN}/implement.md` per §9.
5. Measure LOC (§6). Update `STATE.md`.

### 5.5 Account

- If LOC ≥ 5: `decent_completed += 1`, `last_status: decent`.
- If LOC &lt; 5: `decent_completed` unchanged, `last_status: too_small`. Still keep the iteration artifacts. Continue; the next folder will be `iteration-{N+1}` (e.g. 51, 52) so the project still accumulates **50 decent** rounds.
- If blocked on human input (copy claims, assets, direction flip): `last_status: blocked`, pause loop, do not fake a decent round.

Then loop to 5.1.

---

## 6. LOC gate (definition of a decent round)

**Measured files (landing surface):**

- `src/index.html`
- `src/css/styles.css`
- `src/js/script.js`
- Other files only if the findings explicitly required them (e.g. `webpack.config.js`, plate assets referenced by the page). List every counted file in `implement.md`.

**Measurement:**

```text
LOC_changed = number of lines added + number of lines deleted
              in the unified diff for this iteration’s implementation only
```

Use `git diff --numstat` (or equivalent) against the tree state recorded at the start of §5.4. Do not count:

- Pure markdown under `docs/reviews/`
- Lockfiles, build hashes, `dist/` output
- Whitespace-only reformatting of untouched regions (avoid drive-by reformat)
- Reverts that cancel themselves inside the same iteration

**Pass:** `LOC_changed >= 5` → decent.  
**Fail:** `LOC_changed < 5` → too_small; does not count toward 50.

If the reviewer proposed only trivial changes and implementation cannot honestly reach 5 LOC without inventing scope, the main thread must **send the next reviewer** with an explicit instruction: deepen into the next unpaid AIDA stage / texture / motion / type / brand gap from the standards doc. Do not pad diffs with noise to fake the gate.

---

## 7. Reviewer subagent brief (paste each spawn)

```text
You are a critical landing-page design reviewer. You do NOT edit product source.

Mandatory knowledge:
1. Read and apply: <repo>/docs/landing-page-critical-review.md
2. Load the Impeccable skill (/impeccable) and use it as craft knowledge for a Persuade-mode landing surface (hierarchy, craft floor bans, anti-patterns, motion discipline). Do not start a new Impeccable build-phase unless findings.md explicitly recommends a visual-world replacement and labels it BLOCKING-DIRECTION.

Task:
- Critically evaluate the current Bloombal landing page look and feel (rendered preview if available; otherwise source + existing screenshots).
- Walk AIDA, look/feel, colour, borders, type, branding, simplicity/complexity, placement/reading order, texture, and animation standards.
- Be harsh and specific. Cite section/selectors/components. No praise padding.
- Propose concrete changes for THIS iteration only (a focused batch the developer can implement now), ordered by leverage.
- If a previous findings.md is provided, do not rubber-stamp; find the next material gap.

Write output ONLY to:
<repo>/docs/reviews/iteration-NN/findings.md
using the template required by the protocol §8.

When findings.md is written and complete, stop. Do not implement. Do not open follow-ups.
```

---

## 8. `findings.md` template (subagent)

```markdown
# Iteration NN — Critical findings

- Date:
- Preview URL:
- Decent progress (from STATE): D / 50
- Impeccable knowledge applied: yes/no (note version/skill path if known)

## Verdict
One paragraph: what the page currently communicates vs what it should; overall trust/craft temperature.

## AIDA
- Attention:
- Interest:
- Desire:
- Action:

## Look and feel
…

## Colour balance
…

## Borders / edges
…

## Typography
…

## Branding
…

## Simplicity / complexity
…

## Placement / reading order
…

## Texture
…

## Animation
…

## Impeccable craft flags
List craft-floor / Persuade violations in plain language (hero budget, cards-in-hero, generic template tells, motion noise, etc.).

## Change set for this iteration
Ordered list. Each item:
1. **Problem** — what fails and where
2. **Change** — exact implementation intent (files/selectors if known)
3. **Severity** — blocking | high | polish
4. **Acceptance** — how the main thread will know it worked

## Out of scope this round
What was noticed but deferred (so the next subagent can pick it up).

## Do not do
Anti-recommendations (e.g. do not add more card grids; do not introduce a new accent).
```

Incomplete templates are rejected; main thread re-spawns a new subagent for the same `NN` only if the file is missing required sections. Prefer re-spawn over repairing a weak findings file in the main thread.

---

## 9. `implement.md` template (main thread)

```markdown
# Iteration NN — Implementation

- Status: decent | too_small | blocked
- LOC_changed: <n>
- Files touched:
  - path — +A/−D
- Preview verified: yes/no (what was checked)

## Applied from findings
- [ ] item …
- [ ] item …

## Skipped (with reason)
…

## Diff summary
Short description of the actual UI effect.

## Gate
- decent_completed after this round: D / 50
- next attempt_index: …
```

---

## 10. Diligence rules (non-negotiable)

1. **Fifty decent rounds**, not fifty folders. Too-small rounds extend the attempt counter.
2. **Fresh subagent every review.** Kill after findings. No long-lived reviewer thread that goes soft over time.
3. **Standards + Impeccable every round.** The MD file is the rubric; Impeccable is craft law for Persuade surfaces.
4. **Rendered truth beats source intuition.** Look at the page.
5. **No fake LOC.** No junk comments, no reshuffling without visual intent.
6. **No silent redesign.** World replacement requires human confirmation.
7. **Carry forward debt.** Each new reviewer reads the previous `findings.md` + `implement.md` and attacks what is still weak.
8. **Main thread implements; subagent critiques.** Crossing that line invalidates the round; redo with correct roles.
9. **Important task bias:** when unsure between a timid polish and a structural hierarchy fix, prefer the structural fix if it still matches the committed brand/world.
10. **Human abort wins.** Record `last_status: aborted` in `STATE.md`.

---

## 11. First-run bootstrap

```text
1. Confirm docs/landing-page-critical-review.md exists.
2. Create docs/reviews/STATE.md with attempt_index: 0, decent_completed: 0.
3. Confirm preview server is up.
4. Enter §5 loop.
```

---

## 12. Completion

When `decent_completed == 50`:

1. Write `docs/reviews/SUMMARY.md` with: starting problems, major shifts by iteration bands (01–10, 11–20, …), remaining known debt, and whether DESIGN.md / product copy need a human pass.
2. Stop spawning reviewers.
3. Leave all `iteration-*` artifacts intact as the audit trail.

---

## 13. One-line contract

**Subagent judges against the critical-review MD and Impeccable; writes `findings.md`; dies. Main thread implements; proves ≥ 5 LOC for a decent round; repeats until 50 decent rounds exist — extending past 50 attempts when rounds are too small.**
