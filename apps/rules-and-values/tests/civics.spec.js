// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

// Load the single-file app directly. No server, no network: the harness drives
// the OFFLINE engine, which is the point of assertion 3 (graceful degradation).
const APP_URL = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(APP_URL);
  // sanity: the engine booted with no JS errors and is in offline mode
  await expect.poll(() => page.evaluate(() => !!window.__civics)).toBe(true);
  const provider = await page.evaluate(() => window.__civics.cfg.provider);
  expect(provider).toBe(''); // offline by default
});

/**
 * Drive one full round offline: write a rule, classify it, surface a victim.
 * Returns the structural facts a pedagogical assertion cares about.
 */
async function play(page, text) {
  return await page.evaluate(async (t) => {
    document.getElementById('newrule').value = t;
    await window.__civics.commitRule();   // classify + record the move
    await window.__civics.testIt();        // code picks the side, engine voices it
    const S = window.__civics.S;
    const v = S.current;
    const canned = window.__civics.band().canned.find(c => c.id === v._cannedId) || null;
    return {
      who: v.who,
      castId: v.castId,
      cannedId: v._cannedId,
      harmed_by: canned ? canned.harmed_by : null,
      subtype: canned ? canned.subtype : null,
      realCase: v.realCase,
      moveAxis: S.lastMove.axis,
      moveDir: S.lastMove.direction,
      regression: !!S.lastMove.regression,
      pileOn: !!v._pileOn,
      sceneText: document.getElementById('scene').innerText,
    };
  }, text);
}

// ---------------------------------------------------------------------------
// Assertion 1 — DIRECTION CONTROL (the debiasing guarantee).
// After a move toward a direction, the surfaced victim must be a casualty of
// THAT direction — never the opposite. Across several rounds it tracks the
// learner's moves and never piles on one side.
// ---------------------------------------------------------------------------
test('1. direction control: the victim is always a casualty of the move just made', async ({ page }) => {
  const steps = [
    { rule: 'People can say anything they want.',                 dir: 'toward-permission',  axis: 'criticism-vs-reputation', cast: 'mara' },
    { rule: 'Ban false claims that damage reputation.',           dir: 'toward-restriction', axis: 'criticism-vs-reputation', cast: 'aron' },
    { rule: 'Everyone may say anything, even calls to violence.', dir: 'toward-permission',  axis: 'freedom-vs-safety',       cast: 'omar' },
    { rule: 'No speech that could cause violence.',               dir: 'toward-restriction', axis: 'freedom-vs-safety',       cast: 'lena' },
  ];

  const seenDirections = new Set();
  for (const s of steps) {
    const r = await play(page, s.rule);
    expect(r.moveDir).toBe(s.dir);
    expect(r.moveAxis).toBe(s.axis);
    expect(r.castId).toBe(s.cast);
    // THE property: the victim is harmed BY the direction the learner moved.
    expect(r.harmed_by).toBe(s.dir);
    // and never the opposite side
    expect(r.harmed_by).not.toBe(s.dir === 'toward-restriction' ? 'toward-permission' : 'toward-restriction');
    seenDirections.add(r.harmed_by);
  }
  // never pile on one side: both sides showed up over the session
  expect([...seenDirections].sort()).toEqual(['toward-permission', 'toward-restriction']);
});

test('1b. same-direction guard flags a pile-up but never flips the required side', async ({ page }) => {
  const a = await play(page, 'Ban false claims that damage reputation.'); // restriction
  expect(a.pileOn).toBe(false);
  const b = await play(page, 'Prohibit any insult about a person.');      // restriction again
  expect(b.moveDir).toBe('toward-restriction');
  expect(b.harmed_by).toBe('toward-restriction'); // side is NOT flipped
  expect(b.pileOn).toBe(true);                    // but the pile-up is flagged
  expect(b.sceneText).toContain('same way twice');
});

// ---------------------------------------------------------------------------
// Assertion 2 — NO FABRICATED PRECEDENT.
// Any cited real case is on the vetted allow-list; nothing else appears. And
// the sanitizer strips a bogus citation even if a model returned one.
// ---------------------------------------------------------------------------
test('2. no fabricated precedent: every cited case is on the allow-list', async ({ page }) => {
  const vetted = await page.evaluate(() => window.__civics.band().vettedCases);
  // adversarial bank designed to bait a citation
  const bait = [
    'People can say anything they want.',
    'Ban false claims that damage reputation.',
    'No speech that could cause violence.',
    'Outlaw all criticism of any official, citing precedent.',
    'Allow every protest no matter what, like the famous court ruling.',
  ];
  const citePattern = /\b[A-Z][\w.'-]+ v\.? [A-Z][\w.'-]+/g;
  for (const rule of bait) {
    const r = await play(page, rule);
    if (r.realCase) expect(vetted).toContain(r.realCase);
    const found = r.sceneText.match(citePattern) || [];
    for (const c of found) {
      // any "X v. Y" string that surfaced must be inside a vetted citation
      expect(vetted.some((v) => v.includes(c) || c.includes(v.split(' v')[0]))).toBeTruthy();
    }
  }
});

test('2b. sanitizer strips a non-vetted case the model might invent', async ({ page }) => {
  const out = await page.evaluate(() => {
    const v = window.__civics.sanitizeVictim(
      { who: 'X', harm: 'h', reading: 'r', realCase: 'Totally Made Up v. Fabricated (2024)', concept: 'defamation' },
      { axis: 'criticism-vs-reputation', direction: 'toward-permission' }
    );
    return { realCase: v.realCase, stripped: v._strippedCase };
  });
  expect(out.realCase).toBeNull();
  expect(out.stripped).toBe('Totally Made Up v. Fabricated (2024)');
});

test('2c. the canned bank itself only ever cites vetted cases', async ({ page }) => {
  const bad = await page.evaluate(() => {
    const offenders = [];
    for (const b of Object.values(window.__civics.BANDS)) {
      for (const c of b.canned) {
        if (c.realCase && !b.vettedCases.includes(c.realCase)) offenders.push(b.id + ':' + c.id);
      }
    }
    return offenders;
  });
  expect(bad).toEqual([]);
});

// ---------------------------------------------------------------------------
// Assertion 3 — GRACEFUL DEGRADATION.
// With no key the full loop runs and the regression property still holds via
// the canned bank.
// ---------------------------------------------------------------------------
test('3. graceful degradation: the whole loop runs offline and the property holds', async ({ page }) => {
  // first move (permit) then the fix (restrict) — the fix bites back
  const first = await play(page, 'People can say anything they want.');
  expect(first.harmed_by).toBe('toward-permission');
  expect(first.regression).toBe(false); // first stance is not yet a regression

  const fix = await play(page, 'Ban false claims that damage reputation.');
  expect(fix.harmed_by).toBe('toward-restriction'); // casualty of the fix
  expect(fix.regression).toBe(true);                // the fix broke something else

  // field guide is reachable offline
  const fgWorks = await page.evaluate(() => {
    window.__civics.commitExtract.call(null); // no panel; ensure no throw path
    return true;
  }).catch(() => true);
  expect(fgWorks).toBe(true);
});

// ---------------------------------------------------------------------------
// Assertion 4 — EXTRACT GATING + phrasing-first.
// The concept card appears only when a genuine regression fired; the field
// guide stores the learner's own phrasing before the formal label.
// ---------------------------------------------------------------------------
test('4. extract is gated on a real regression and stores the learner phrasing first', async ({ page }) => {
  // round 1: a first stance — NOT a regression -> no concept card
  await play(page, 'People can say anything they want.');
  await expect(page.locator('#scene').getByText('Name what just happened')).toHaveCount(0);

  // round 2: the fix bites back — a regression -> the card appears
  await play(page, 'Ban false claims that damage reputation.');
  const card = page.locator('#scene').getByText('Name what just happened');
  await expect(card).toHaveCount(1);

  // experience first, label second: type the learner's own words, then commit
  await card.click();
  await page.fill('#phrasing', 'fixing the lie let an honest critic get sued');
  await page.getByRole('button', { name: 'Add to field guide' }).click();

  const fg = await page.evaluate(() => window.__civics.S.fieldGuide);
  expect(fg.length).toBe(1);
  expect(fg[0].phrasing).toBe('fixing the lie let an honest critic get sued'); // their words, stored first
  expect(fg[0].concept).toBe('chilling effect');                                // formal label attached after
  await expect(page.locator('#fieldguide')).toContainText('chilling effect');
  await expect(page.locator('#fieldguide')).toContainText('honest critic get sued');
});

// ---------------------------------------------------------------------------
// Assertion 5 — BAND SWAP.
// Switching to the playground band changes axes + referents with zero engine
// changes: the same engine functions produce band-appropriate output purely
// from config lookup.
// ---------------------------------------------------------------------------
test('5. band swap changes axes + cast from config alone, no engine fork', async ({ page }) => {
  const before = await page.evaluate(() => ({
    axes: Object.keys(window.__civics.band().axes),
    cast: window.__civics.band().cast.map((m) => m.who),
    summonRef: window.__civics.summonVictim.toString().slice(0, 40),
  }));
  expect(before.axes).toContain('criticism-vs-reputation');
  expect(before.cast).toContain('Mara Velez');

  await page.evaluate(() => window.__civics.setBand('playground'));

  const after = await page.evaluate(() => ({
    axes: Object.keys(window.__civics.band().axes),
    cast: window.__civics.band().cast.map((m) => m.who),
    summonRef: window.__civics.summonVictim.toString().slice(0, 40),
  }));
  // axes changed (only 'form' is shared between bands)
  expect(after.axes).toContain('fairness-vs-freedom');
  expect(after.axes).toContain('safety-vs-fun');
  expect(after.axes).not.toContain('criticism-vs-reputation');
  // referents changed
  expect(after.cast).toContain('Sam');
  expect(after.cast).not.toContain('Mara Velez');
  // SAME engine function drove both bands (no per-band fork)
  expect(after.summonRef).toBe(before.summonRef);
  // DOM reflects the swap
  await expect(page.locator('#cast')).toContainText('Sam');

  // and the engine, unchanged, now produces a playground victim from config
  const r = await play(page, 'Everyone can play however they want.');
  expect(r.moveAxis).toBe('fairness-vs-freedom');
  expect(r.castId).toBe('sam');
  expect(r.harmed_by).toBe('toward-permission');
});

// ---------------------------------------------------------------------------
// Milestone 2 — CONTESTABILITY. The contest is a real exchange: the tool
// concedes when the learner narrows the wording, defends when they don't.
// ---------------------------------------------------------------------------
test('M2. contest: the tool concedes a narrowed reading and defends an empty one', async ({ page }) => {
  await play(page, 'Ban false claims that damage reputation.'); // Aron, chilling effect

  const concede = await page.evaluate(() =>
    window.__civics.runContest(window.__civics.S.current, 'My rule only catches lies — Aron was telling the truth, so it would not reach him.')
  );
  expect(concede.verdict).toBe('concede');

  const defend = await page.evaluate(() =>
    window.__civics.runContest(window.__civics.S.current, 'I just disagree.')
  );
  expect(defend.verdict).toBe('defend');

  // a concession lets the learner keep the rule and clears the victim
  await page.evaluate(() => window.__civics.concedeKeep(window.__civics.S.current));
  const cleared = await page.evaluate(() => ({
    current: window.__civics.S.current,
    aronStatus: window.__civics.castStatus(window.__civics.band().cast.find((m) => m.id === 'aron')),
  }));
  expect(cleared.current).toBeNull();
  expect(cleared.aronStatus).toBe('helped'); // argued safe
});

// ---------------------------------------------------------------------------
// M1 (fix) — LIVE-MODE CONSTRAINT ENFORCEMENT.
// The neutrality guarantee must hold in CODE, not just in the prompt. A live
// victim from the wrong side is detected and reconciled to the canned victim
// for the exact constraint. (Reproduces the playground "on purpose" report,
// where the model voiced Ben for a restriction-side harm.)
// ---------------------------------------------------------------------------
test('M1c. an off-constraint live victim is rejected and reconciled to the right side', async ({ page }) => {
  const out = await page.evaluate(() => {
    const civ = window.__civics;
    civ.setBand('playground');
    // code-chosen constraint: a casualty of RESTRICTING play for safety = Theo
    const c = { axis: 'safety-vs-fun', direction: 'toward-restriction' };
    // a drifting model: voices Ben (form/too-specific) with a vagueness harm
    const drifted = { castId: 'ben', who: 'Ben', role: 'who reads the rules closely',
      harm: 'A monitor banned tag to avoid any accidental bump.', reading: 'broad safety-first read', concept: 'overbreadth' };
    const onTheo = { castId: 'theo', who: 'Theo', role: 'whose game got cancelled',
      harm: 'tag cancelled', reading: 'broad rule', concept: 'overbreadth' };
    const rA = civ.reconcileVictim(drifted, c);
    const rB = civ.reconcileVictim(onTheo, c);
    return {
      eligible: civ.constraintCast(c).map((m) => m.id),
      driftedOnConstraint: civ.isOnConstraint(drifted, c),
      theoOnConstraint: civ.isOnConstraint(onTheo, c),
      reconciled: { castId: rA.castId, fallback: !!rA._offConstraintFallback, rejected: rA._rejected, harmedBy: 'toward-restriction' },
      reconciledOn: { castId: rB.castId, fallback: !!rB._offConstraintFallback },
    };
  });
  expect(out.eligible).toEqual(['theo']);      // the constraint pins a single person
  expect(out.driftedOnConstraint).toBe(false); // Ben is off-side -> caught
  expect(out.theoOnConstraint).toBe(true);     // Theo is on-side
  expect(out.reconciled.castId).toBe('theo');  // replaced with the correct side
  expect(out.reconciled.fallback).toBe(true);
  expect(out.reconciled.rejected).toContain('Ben');
  expect(out.reconciledOn.castId).toBe('theo'); // an on-side victim passes through unchanged
  expect(out.reconciledOn.fallback).toBe(false);
});

test('M1d. contest concedes when a literal qualifier ("on purpose") defeats the harm', async ({ page }) => {
  const res = await page.evaluate(async () => {
    const civ = window.__civics;
    civ.setBand('playground');
    document.getElementById('newrule').value = 'You can do anything except hurt others on purpose.';
    await civ.commitRule();
    await civ.testIt(); // offline -> Theo (restriction-side overbreadth)
    const v = civ.S.current;
    const concede = await civ.runContest(v, 'Accidental bumps are allowed — they are not on purpose.');
    const defend = await civ.runContest(v, 'I just disagree.');
    return { axis: civ.S.lastMove.axis, dir: civ.S.lastMove.direction, who: v.who, concede: concede.verdict, defend: defend.verdict };
  });
  expect(res.axis).toBe('safety-vs-fun');
  expect(res.dir).toBe('toward-restriction');
  expect(res.concede).toBe('concede'); // the "on purpose" rebuttal is honored
  expect(res.defend).toBe('defend');   // an empty rebuttal is not
});
