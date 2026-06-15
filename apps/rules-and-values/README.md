# Civic rule debugger

A constructionist civics tool. A learner writes rules for a society; the tool
surfaces a specific person harmed by each rule; the learner debugs; over rounds
they extract transferable principles into a **field guide**. Built from the
`v0.html` seed per `SPEC.md` and `PLAN.md`.

Single file, no build step, BYO-key, multi-provider. **Open `index.html` in a
browser** — that's the whole app. `v0.html` is kept as the pinned seed/contract.

## Run it

- **Just open it:** double-click `index.html` (works offline with the canned
  case bank — no key needed).
- **Or serve it:** `node server.js 3001` → http://localhost:3001
- **Go live:** pick a provider, paste an API key (stored only in your browser's
  `localStorage`), Save. Without a key it runs fully offline.

## The loop

`specify → test → observe → debug → extract`. Write a rule in your own words →
**Test it** → a named citizen is harmed, with *how the tool read your rule* shown
→ revise, or **contest the reading**, or **name the pattern** when a fix bites
back. The named pattern lands in the field guide with your wording first and the
formal term attached after.

### The load-bearing decision (why this is civics, not persuasion)

- **Code owns direction.** After a move toward direction *D* on axis *A*, the
  next victim *must* be a casualty of *D* on *A*. This neutrality guarantee never
  moves into the model. (`requiredConstraint()`.)
- **The model owns the victim.** It reads the learner's literal wording and voices
  the sharpest real casualty *within* that code-chosen constraint.
- **Removable scaffold:** the **roam** checkbox drops the constraint on purpose
  (AI-literacy mode) so the model's tilt becomes the lesson.
- **Inviolable:** the model never invents a precedent. Cited cases come from a
  vetted allow-list; `sanitizeVictim()` strips anything else even if a model
  returns it.

## What was built (against `PLAN.md`)

| Milestone | Status | Where |
|---|---|---|
| **M1 — harden** | ✅ | `editLog` (collapsible history); same-direction guard (flags a pile-up, never flips the required side); **persistent cast** of six named citizens whose status (harmed / protected / untouched) follows the current ruleset; inline extraction gated on a real regression; typed provider errors with one retry + an explicit offline fallback (never a silent fail); tightened summon prompt against wrong-side victims, strawmanning, and fabricated precedent. |
| **M2 — contestability** | ✅ | `runContest()` is a real exchange — the tool **concedes** when the learner narrows the wording (and they keep the rule, the victim clears) or **defends** by pointing at the words that still open the edge. |
| **M3 — playground band** | ✅ | A second band (`playground`, ages 8+) is **config only** — recess-scale axes (`fairness-vs-freedom`, `safety-vs-fun`) and a kid-referent case bank. The engine never branches on band id; it reads `BANDS[S.band]`. Switch it in the header. |
| **M4 — Phase 2 (values) + bridge** | ✅ | The **Values** tab: state values, ask a question, see the tool's answer **with and without** your values (the diff). The same victim engine runs underneath ("who does a vague value strand?"). The **bridge** runs both ways: *compile a value down* → a concrete pass/fail test; *decompile your rules up* → the value beneath them. |
| **Later** (UK/US/SG contrast, cross-learner compare, justiciability ladder, Constitutional-AI capstone) | ⏳ | Not built — see `PLAN.md`. The ladder is intentionally left implicit (carried by the two `form` cases) pending Cindy's sign-off per the PLAN's open item. |

## Victory condition

Not a leak-free ruleset — there isn't one. You win by committing to a rule with
eyes open and **naming which errors you chose**. The field guide is the
scoreboard (surfaced in the right column).

## Tests (the pedagogical risks, not just rendering)

Playwright drives the **offline** engine and asserts on **state + DOM**, matching
`PLAN.md`'s harness section.

```bash
npm install
npx playwright install chromium   # one-time browser download
npm test
```

`tests/civics.spec.js` covers all five PLAN assertions plus the M2 exchange:

1. **Direction control** — the victim is always a casualty of the move just made;
   over several rounds it alternates and never piles on one side (+ a guard test).
2. **No fabricated precedent** — every cited case is on the allow-list; the
   sanitizer strips an invented one; the canned bank is clean by construction.
3. **Graceful degradation** — the full loop runs with no key; the regression
   property holds via the canned bank.
4. **Extract gating** — the concept card appears only on a genuine regression, and
   the field guide stores the learner's phrasing *before* the formal label.
5. **Band swap** — switching to playground changes axes + referents with the same
   engine functions (no per-band fork).
6. **Contest (M2)** — concedes a narrowed reading, defends an empty one.

## Files

- `index.html` — the app (engine + both bands + Phase 1/2 surfaces).
- `v0.html` — the original seed, kept as the pinned architecture contract.
- `SPEC.md`, `PLAN.md` — the spec and build sequence.
- `tests/civics.spec.js`, `playwright.config.js` — the harness.
- `server.js` — tiny zero-dep static server for local preview.
