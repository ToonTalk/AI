# PLAN — build sequence

Start from `v0.html` and `SPEC.md`. Single file, no build step, BYO-key,
multi-provider. Harden first, then add bands and surfaces.

## Milestone 1 — harden v0 (the loop must be solid)
- Implement `editLog` and the "no two same-direction victims in a row" guard.
- Add the **persistent cast**: a handful of named citizens; reuse them across
  rounds; show each one's current status (helped / harmed / untouched) so a rule
  change visibly moves specific people.
- Replace `prompt()` extraction with inline UI; gate the concept card so it
  appears only on a real regression.
- Real provider error handling (bad key, rate limit, malformed JSON → one clear
  retry, never a silent fail). Offline mode must stay fully functional.
- Tighten the summon prompt against three failure modes you should test for
  (below): wrong-side victims, strawmanning, fabricated precedent.

## Milestone 2 — contestability
Turn `contest` into a genuine exchange: the model defends or concedes its
reading of the rule; on a concession the learner keeps the rule and the round
advances. This is where "ambiguity is a bug" actually gets felt.

## Milestone 3 — the playground band (proves the toggle)
Same engine, swapped config: recess-scale axes (fairness-vs-freedom-to-play,
safety-vs-fun) and a case bank with kid referents (turn-taking, name-calling,
who gets the ball). A band switch that swaps config + the referents in the
copy — *nothing in the engine changes*. If the engine needs editing to make the
playground work, the abstraction is wrong; fix the engine, not the band.

## Milestone 4 — Phase 2 (values) + the bridge
- Second surface: learner gives the tool **values** instead of rules and sees
  the tool's answer to a question **with and without** their values (the diff —
  this reuses the proven mechanic from the prior contemplative-prompt app). Keep
  the victim engine under it: a vague value strands an enforcer exactly as a
  vague rule does.
- The **bridge** (both directions): "compile this value down" → forces a
  concrete *test*, not a vague rule; "decompile these rules up" → the animating
  value. The reframe at the wall (rulebook sprawls → stop saying what to *do*,
  say what to *care about*) is what hands the learner from Phase 1 to Phase 2.

## Later
UK/US/Singapore contrast on the same issue; compare constitutions across
learners; the explicit justiciability ladder UI; a Constitutional-AI capstone
(toggle/after significant progress — "the thing you just did has a name").

---

## Harness assertions (Playwright)
The novel risks are pedagogical, so test those, not just rendering:
1. **Direction control.** After a `toward-restriction` move, the surfaced victim
   is a casualty of restriction — never of permission. Run several rounds; it
   must alternate with the learner's moves, never pile on one side.
2. **No fabricated precedent.** Any cited real case is in the vetted allow-list;
   no other case names or real-person attributions appear. (Assert against a
   bank of adversarial rules designed to bait a citation.)
3. **Graceful degradation.** With no key, the full loop runs offline and the
   regression property still holds via the canned bank.
4. **Extract gating.** The concept card appears only when a genuine regression
   fired; the field guide stores the learner's own phrasing first.
5. **Band swap.** Switching to the playground band changes axes/referents with
   zero engine changes (no code path forks on band except config lookup).

Note the existing screenshot caveat: scenes are text, not animation, so standard
DOM-ready screenshots are fine here — but keep the harness asserting on **state
and DOM**, not pixels, for the pedagogical checks above.

---

## Open item — for Cindy, before the ladder UI (Milestone "Later")
The justiciability ladder is deliberately kept *implicit* in v0 (carried by the
two `form` cases — too-vague and too-specific). Before building it as visible
rungs, confirm the mapping with Cindy: is `value → right → test → holding` how
she'd stage the descent, and where exactly does the justiciability "snap" fall?
Don't freeze the rungs until she's weighed in.
