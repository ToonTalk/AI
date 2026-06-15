# SPEC — civic rule debugger

A constructionist civics tool. A learner writes rules for a society, the tool
shows a person harmed by each rule, the learner debugs, and over rounds they
extract transferable principles into a "field guide." v0 covers one issue
(free speech) for ages 13+. The whole engine is issue-agnostic; an issue is
just a config block (axes + a small case bank), so new issues and a younger
"playground" band are swaps, not rewrites.

`v0.html` is a runnable **seed**, not the finished v0. It pins the contracts
below so they aren't guessed at. Everything marked *minimal* is for you to build.

---

## The loop (both future surfaces run this)

`specify` → `test` → `observe` → `debug` → `extract` → repeat.

1. **specify** — learner writes/edits a rule in their own words (free text — this
   is the constructionist core; never reduce it to a menu).
2. **test** — the engine surfaces a person harmed by the rule.
3. **observe** — the person, their harm, and **how the tool read the rule** to
   get there. The learner can *contest the reading* (ambiguity is itself a bug)
   or revise.
4. **debug** — narrow/rewrite the rule, or push back on the reading.
5. **extract** — when a fix breaks something else, the learner **names the
   pattern in their own words**; the tool attaches the formal term; it lands in
   the field guide. Experience first, label second — never the reverse.

---

## The load-bearing decision: competence vs neutrality

Who picks the harmed person splits into two questions that must be answered
differently:

- **Competence** (can it find a sharp, rule-specific victim?) → the **LLM**.
  It reads the learner's literal wording and finds the real edge that wording
  opens. A fixed bank can't anticipate every rule a kid writes.
- **Neutrality** (which *side* does the victim come from?) → **code**.
  Turned loose, an LLM doesn't draw victims from a neutral distribution — its
  training and tuning tilt it toward whichever harms are most available. A
  learner who ratchets in response to that tilt absorbs a political conclusion
  the tool never meant to teach. So **code decides the required axis and
  direction**; the LLM only chooses and voices a victim *within* that
  constraint.

The rule that produces this:

> **After a move toward direction D on axis A, the next victim must be a
> casualty of D on A** — i.e. a victim of the move the learner just made.

This is what makes the dialectic balanced and turns "every rule leaks" into a
specification trap rather than a one-sided morality play. It is the property
that makes this civics, not persuasion. Do not move direction-selection into
the model.

### Two deliberate exceptions
- **Extreme stance, no prior move** (e.g. a first rule of "all speech, no
  limits"): there's nothing to counter — fire the strongest victim of that
  stance, freely. No neutrality problem. (In the seed, `test` requires ≥1 rule,
  so a first move always exists; handle the genuine no-move case if you add
  preloaded constitutions.)
- **Older students / AI-literacy mode**: *drop* the constraint on purpose, let
  the model roam, then make its tilt the lesson ("notice it keeps showing you
  one kind of victim — why might an AI do that?"). So the constraint is a
  **removable scaffold**: default-on for the young and for v0, switchable off.

### Inviolable in every mode
The model must **never invent a precedent**. Real cases come from a small vetted
allow-list it may cite; everything else is presented as hypothetical. No
invented case names, citations, or attributions to real people.

---

## State shape (current seed)

```
rules:       [{ id, text, axis, direction }]
fieldGuide:  [{ phrasing, concept, def }]
surfaced:    Set<conceptName>     // taught already; bias new concepts away from these
fired:       Set<caseId>          // canned mode: don't repeat a case
lastMove:    { axis, direction, subtype? }   // the learner's most recent edit
current:     victim on screen
```

## Issue config (free speech)

- **axes**: `criticism-vs-reputation`, `freedom-vs-safety`, and `form` (the rule
  is too vague / too specific — this is the specification trap on the *form* of
  the rule, roughly orthogonal to the two value axes).
- **direction**: `toward-restriction` | `toward-permission` (of speech).
- **vetted real cases** (citable): Singh v. BCA (2008), Brandenburg v. Ohio
  (1969), NYT v. Sullivan (1964).
- **canned bank**: ≥1 case per (axis, direction) plus the two `form` cases, each
  tagged `harmed_by` (or `subtype`) so offline selection reproduces regressions
  structurally.

A complete issue must include both "jaws" of the specification trap: the
**too-vague** rule that strands whoever enforces it, and the **too-specific**
rule whose letter misses an obvious case. One-sided issues don't teach the trap.

---

## LLM contracts (provider-agnostic; return JSON only)

**A. classify edit** → `{ axis, direction, subtype? }`
Classifies the learner's new/edited rule as one move. Drives `lastMove`.

**B. summon victim** (given the code-chosen constraint) →
`{ who, harm, reading, realCase | null, concept, def }`
System prompt must carry, every call: the hard axis+direction constraint and
why it exists; "read the rule literally, don't strawman"; the vetted-cases
allow-list and the no-fabrication rule; "explain your reading"; prefer an
un-surfaced concept.

Both calls degrade gracefully: no key → offline mode using the canned bank and a
crude keyword classifier, so the harness runs with no network.

---

## Victory condition (don't lose this in the UI)

Not a leak-free ruleset — there isn't one. The learner "wins" by committing to a
rule with eyes open and **naming which errors they chose**. The field guide is
the scoreboard; surface that framing explicitly.

---

## Intentionally minimal in the seed (yours to build)

- Visual design is plain on purpose. Make it good; keep the constructionist
  feel (their artifact, wrestled with — not a quiz).
- `contest` is a stub (re-runs the summon). Make it a real exchange where the
  model defends or concedes its reading, and a concession lets the learner keep
  the rule.
- No recurring **cast** yet: victims are one-off. Add a small persistent cast
  whose status updates as rules change, so it's community stewardship, not
  whack-a-mole.
- `extract` uses `prompt()`. Replace with inline UI; only offer the concept card
  when a genuine regression fired (the constraint guarantees it did).
- `editLog`, the "no two same-direction victims in a row" guard, and per-rule
  edit history are not implemented — add them.
