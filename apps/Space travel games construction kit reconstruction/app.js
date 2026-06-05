"use strict";
/* =====================================================================
   A Space Travel Games Construction Kit — application logic.
   Content (TEAM, STORY, GADGETS, DIALOGUE, GAMES, PHYS …) is in data.js,
   which is loaded first and shares this global scope.
   ===================================================================== */

const $ = (id) => document.getElementById(id);
const show = (el) => { el.hidden = false; };
const hide = (el) => { el.hidden = true; };

/* ------------------------------------------------------------------ */
/* STATE                                                              */
/* ------------------------------------------------------------------ */
function newGameState() {
  return { acquired: new Set(), backs: {}, flags: new Set(), settings: {}, seen: {} };
}
const state = {
  storyIndex: 0,
  game: "rescue",
  games: { rescue: newGameState(), lander: newGameState() },
  visit: { role: null, line: 0 },
  running: false, recording: false, autopilot: false,
  t: 0, x: 0, y: 0, vx: 0, vy: 0, rocks: 0, fuel: 0, outOfRocks: false,
  ended: false, reachedDuringRun: false,
  record: [], autoCode: "", autoSchedule: [], gaugeHist: [],
};

function initSettings(g) {
  const gs = state.games[g];
  Object.entries(GADGETS).forEach(([k, def]) => {
    if (def.game !== g) return;
    def.settings.forEach((s) => { if (gs.settings[`${k}.${s.key}`] === undefined) gs.settings[`${k}.${s.key}`] = s.value; });
  });
}
initSettings("rescue"); initSettings("lander");
const G = () => state.games[state.game];
const sv = (key, sk) => G().settings[`${key}.${sk}`];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function ensureStartPositions() {
  if (!state.startA) state.startA = { x: 20, y: 70 };
  if (!state.shipPos) state.shipPos = { x: 182, y: 70 };
  if (state.landerStartH === undefined) state.landerStartH = PHYS.landerStartHeight;
}

/* ------------------------------------------------------------------ */
/* CODE RENDERING                                                     */
/* ------------------------------------------------------------------ */
function renderCode(code) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(code)
    .replace(/§([^§]*)§/g, '<span class="red">$1</span>')
    .replace(/^(;.*)$/gm, '<span class="comment">$1</span>');
}

/* ==================================================================== */
/* STORY                                                                */
/* ==================================================================== */
function renderStory() {
  const p = STORY[state.storyIndex];
  const port = $("storyPortraits");
  port.innerHTML = "";
  port.className = "story-portraits" + (p.team ? " team-grid" : "");
  if (p.team) {
    TEAM_ORDER.forEach((r) => {
      const t = TEAM[r];
      const fig = document.createElement("figure");
      fig.innerHTML = `<img src="${t.a}" alt="${t.name}"><figcaption>${t.name}<br><small>${t.role}</small></figcaption>`;
      port.appendChild(fig);
    });
  } else if (p.who === "ceo") {
    port.innerHTML = `<img src="${CEO.a}" alt="CEO"><div class="caption">The Director (CEO)</div>`;
  }
  $("storyText").textContent = p.text;
  $("storyBack").disabled = state.storyIndex === 0;
  $("storyNext").textContent = state.storyIndex === STORY.length - 1 ? "Meet your team →" : "NEXT";
}
$("storyNext").addEventListener("click", () => {
  if (state.storyIndex < STORY.length - 1) { state.storyIndex++; renderStory(); }
  else enterWorkshop();
});
$("storyBack").addEventListener("click", () => { if (state.storyIndex > 0) { state.storyIndex--; renderStory(); } });

function enterWorkshop() {
  hide($("storyScreen"));
  show($("workshopScreen"));
  switchGame("rescue");
  openTeam();   // first thing: meet the team to collect behaviours
}

/* ==================================================================== */
/* GAME SWITCH                                                          */
/* ==================================================================== */
document.querySelectorAll(".game-switch .seg").forEach((b) =>
  b.addEventListener("click", () => switchGame(b.dataset.game)));

function switchGame(g) {
  state.game = g;
  state.running = false; state.recording = false; state.autopilot = false;
  document.querySelectorAll(".game-switch .seg").forEach((b) => b.classList.toggle("active", b.dataset.game === g));
  $("astronaut").hidden = g !== "rescue";
  $("ship").hidden = g !== "rescue";
  $("lander").hidden = g !== "lander";
  $("pad").hidden = true;
  $("stage").classList.toggle("moon", g === "lander");
  GAMES[g].objects.forEach((o) => { if (!G().backs[o.id]) G().backs[o.id] = new Set(); });
  $("recordBtn").hidden = !GAMES[g].throttle;
  $("recordBtn").textContent = "● Record";
  $("autopilotBtn").hidden = !GAMES[g].throttle;
  renderGadgets(); renderBacks(); renderThrowControls(); resetSim();
  const hint = G().acquired.size === 0
    ? 'You have no behaviour gadgets yet. Click "Visit with your Team" - especially Tist and Jammer - to get them.'
    : "Drag a gadget onto the back of the object it belongs to. Click FLIP to read its code, or SETTINGS to change its numbers.";
  $("gadgetHint").textContent = hint;
  if (!setupTip()) message(hint);
}

/* ==================================================================== */
/* BEHAVIOUR GADGET PANEL                                               */
/* ==================================================================== */
function renderGadgets() {
  const list = $("gadgetList");
  list.innerHTML = "";
  const acquired = [...G().acquired];
  if (acquired.length === 0) {
    list.innerHTML = '<p class="muted empty">Nothing here yet. Visit your team to get behaviour gadgets.</p>';
    return;
  }
  acquired.forEach((key) => {
    const g = GADGETS[key];
    const attachedTo = attachedObject(key);
    const box = document.createElement("div");
    box.className = "gadget" + (attachedTo ? " attached" : "");
    box.dataset.key = key;
    box.innerHTML =
      `<div class="gadget-title" draggable="true"><span class="grip">⠿</span> ${g.name}</div>
      <div class="gadget-body">
        <div class="gadget-tip">${g.tip}</div>
        ${attachedTo ? `<div class="attached-on">On the ${objLabel(attachedTo)}'s back.</div>` : ""}
        <div class="gadget-btns">
          ${g.settings.length ? '<button class="logo-btn" data-act="settings">SETTINGS</button>' : ""}
          <button class="logo-btn" data-act="help">HELP</button>
          <button class="logo-btn" data-act="flip">FLIP</button>
        </div>
      </div>`;
    list.appendChild(box);
    box.querySelectorAll("[data-act]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.dataset.act === "settings") openSettings(key);
        else if (btn.dataset.act === "help") openHelp(key);
        else if (btn.dataset.act === "flip") openCode(key);
      }));
    box.querySelector(".gadget-title").addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", key);
      e.dataTransfer.effectAllowed = "copy";
    });
  });
}
function attachedObject(key) {
  for (const [oid, set] of Object.entries(G().backs)) if (set.has(key)) return oid;
  return null;
}
function objLabel(oid) { return GAMES[state.game].objects.find((o) => o.id === oid)?.label || oid; }

/* ---- object backs (drop targets) ---- */
function renderBacks() {
  const wrap = $("objectBacks");
  wrap.innerHTML = "";
  GAMES[state.game].objects.forEach((o) => {
    const set = G().backs[o.id] || new Set();
    const panel = document.createElement("div");
    panel.className = "obj-back";
    panel.dataset.obj = o.id;
    const tags = [...set].map((k) => {
      const wrong = GADGETS[k].target !== o.id;
      return `<span class="back-tag ${wrong ? "wrong" : ""}" title="${wrong ? "This gadget doesn't belong here!" : ""}">${GADGETS[k].name}${wrong ? " ⚠" : ""} <button class="tag-x" data-remove="${k}" data-obj="${o.id}">×</button></span>`;
    }).join("");
    panel.innerHTML = `<div class="obj-back-head">Back of the ${o.label}</div>
      <div class="obj-back-body">${tags || '<span class="muted">empty — drag a behaviour gadget here</span>'}</div>`;
    wrap.appendChild(panel);
    ["dragenter", "dragover"].forEach((ev) => panel.addEventListener(ev, (e) => { e.preventDefault(); panel.classList.add("drag-over"); }));
    panel.addEventListener("dragleave", () => panel.classList.remove("drag-over"));
    panel.addEventListener("drop", (e) => { e.preventDefault(); panel.classList.remove("drag-over"); dropOn(o.id, e.dataTransfer.getData("text/plain")); });
    panel.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => { G().backs[b.dataset.obj].delete(b.dataset.remove); renderBacks(); renderGadgets(); updateGaugeVisibility(); renderThrowControls(); }));
  });
}
function wireSpriteDrop(elId, objId) {
  const el = $(elId);
  ["dragenter", "dragover"].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); el.classList.add("drop-target"); }));
  el.addEventListener("dragleave", () => el.classList.remove("drop-target"));
  el.addEventListener("drop", (e) => { e.preventDefault(); el.classList.remove("drop-target"); dropOn(objId, e.dataTransfer.getData("text/plain")); });
}
wireSpriteDrop("astronaut", "astronaut");
wireSpriteDrop("ship", "ship");
wireSpriteDrop("lander", "lander");

function dropOn(objId, key) {
  if (!key || !GADGETS[key] || !G().acquired.has(key)) return;
  Object.values(G().backs).forEach((s) => s.delete(key));
  G().backs[objId].add(key);
  renderBacks(); renderGadgets(); updateGaugeVisibility(); renderThrowControls();
  if (GADGETS[key].target === objId) { message(`Added the ${GADGETS[key].name} to the back of the ${objLabel(objId)}.`); setTimeout(setupTip, 1200); }
  else message(`Hmm — the ${GADGETS[key].name} is meant for the ${objLabel(GADGETS[key].target)}, not the ${objLabel(objId)}. You can leave it there, but the game won't work right. Drag the × off the tag to fix it.`, true);
}
function playerHas(key) {
  const pid = GAMES[state.game].player;
  return G().backs[pid] && G().backs[pid].has(key);
}

/* ==================================================================== */
/* SETTINGS / HELP / CODE                                               */
/* ==================================================================== */
function openSettings(key) {
  const g = GADGETS[key];
  $("settingsTitle").textContent = g.name + " — Settings";
  const body = $("settingsBody");
  body.innerHTML = g.settings.length ? "" : '<p class="muted">This gadget has no adjustable settings.</p>';
  g.settings.forEach((s) => {
    const id = `set_${key}_${s.key}`;
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `<label for="${id}">${s.label}</label>
      <span class="val" id="${id}_val">${sv(key, s.key)}</span>
      <input type="range" id="${id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${sv(key, s.key)}">
      <span class="note">${s.note || ""}</span>`;
    body.appendChild(row);
    row.querySelector("input").addEventListener("input", (e) => {
      G().settings[`${key}.${s.key}`] = Number(e.target.value);
      $(`${id}_val`).textContent = e.target.value;
    });
  });
  show($("settingsOverlay"));
}
function openHelp(key) {
  const g = GADGETS[key];
  $("helpTitle").textContent = g.name + " — Help";
  $("helpWho").textContent = g.helpFrom ? `${TEAM[g.helpFrom].name} the ${TEAM[g.helpFrom].role} explains:` : "";
  $("helpText").textContent = g.help;
  const codeEl = $("helpCode");
  if (g.code) { codeEl.hidden = false; codeEl.innerHTML = renderCode(g.code); } else codeEl.hidden = true;
  show($("helpOverlay"));
}
function openCode(key) {
  const g = GADGETS[key];
  $("codeTitle").textContent = g.name + " — Code (flipped over)";
  const body = $("codeBody");
  body.innerHTML = "";
  if (g.fourBoxes) {
    g.codeBoxes.forEach((cb) => {
      const h = document.createElement("h3"); h.className = "codebox-title"; h.textContent = cb.title;
      const pre = document.createElement("pre"); pre.className = "code-box"; pre.innerHTML = renderCode(cb.code);
      body.appendChild(h); body.appendChild(pre);
    });
  } else {
    const pre = document.createElement("pre"); pre.className = "code-box"; pre.innerHTML = renderCode(g.code || "; (no code)");
    body.appendChild(pre);
  }
  show($("codeOverlay"));
}
$("slidersBtn").addEventListener("click", () => {
  const key = state.game === "rescue" ? "horizontalRockThrowing" : "verticalThruster";
  if (G().acquired.has(key)) openSettings(key);
  else message("You don't have any gadgets with sliders yet. Visit Jammer the Programmer.");
});

/* ==================================================================== */
/* TEAM VISITS + ACQUISITION                                            */
/* ==================================================================== */
$("teamBtn").addEventListener("click", openTeam);
function openTeam() {
  const chooser = $("teamChooser");
  chooser.innerHTML = "";
  TEAM_ORDER.forEach((role) => {
    const t = TEAM[role];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<img src="${t.a}" alt=""><strong>${t.name}</strong><span>${t.role}</span>`;
    btn.addEventListener("click", () => visit(role));
    chooser.appendChild(btn);
  });
  hide($("teamVisit")); show($("teamChooser")); show($("teamOverlay"));
}
function visit(role) {
  if (G().seen[role] === undefined) G().seen[role] = 0;
  state.visit = { role, line: G().seen[role] };
  hide($("teamChooser")); show($("teamVisit"));
  showVisitLine();
}
function currentLines() { return (DIALOGUE[state.game][state.visit.role]) || []; }
function lineAvailable(line) { return !line.needs || G().flags.has(line.needs); }
function fallbackText(role, gatedLine) {
  if (gatedLine && gatedLine.needs) {
    if (gatedLine.needs === "physicsKnown") return "First go and see Tist the Scientist so I know the physics to program. Then come back.";
    if (gatedLine.needs === "testedIncomplete") return "Build the simple game with what you have and try it out first. Then come back and we'll make it better.";
    if (gatedLine.needs === "designedEnding") return "Talk it over with Signer, your game designer, first. Then come back.";
    if (gatedLine.needs === "wantsVertical") return "We haven't decided to add up-and-down movement yet. Talk to Signer about making the game less one-dimensional.";
  }
  return "I don't have anything new for you just now. Maybe talk to the others, or come back after you've made some more progress.";
}
function showVisitLine() {
  const role = state.visit.role, t = TEAM[role], lines = currentLines();
  const idx = state.visit.line;
  $("visitName").textContent = `${t.name} the ${t.role}`;
  const note = $("visitGrant"); note.hidden = true; note.innerHTML = "";
  const cur = lines[idx];
  if (cur && lineAvailable(cur)) {
    $("visitPortrait").src = idx % 2 === 0 ? t.a : t.b;
    $("visitText").textContent = cur.text;
    applyLine(cur, note);
    G().seen[role] = Math.max(G().seen[role] || 0, idx + 1);
    const next = lines[idx + 1];
    const hasNext = next && lineAvailable(next);
    $("visitMore").textContent = hasNext ? "Tell me more" : "That's all for now";
    $("visitMore").disabled = !hasNext;
  } else {
    // no new available line: gentle fallback, end the visit
    $("visitPortrait").src = t.a;
    $("visitText").textContent = fallbackText(role, cur);
    $("visitMore").textContent = "That's all for now";
    $("visitMore").disabled = true;
  }
}
function applyLine(line, noteEl) {
  if (line.sets) G().flags.add(line.sets);
  if (line.grants) {
    const newly = line.grants.filter((k) => !G().acquired.has(k));
    line.grants.forEach((k) => G().acquired.add(k));
    if (newly.length) {
      noteEl.hidden = false; noteEl.className = "grant-note";
      noteEl.innerHTML = "★ You received: " + newly.map((k) => GADGETS[k].name).join(", ") +
        '. <span class="muted">Find them in the Behaviour Gadgets panel.</span>';
      renderGadgets();
      $("gadgetHint").textContent = "Drag a gadget onto the back of the object it belongs to.";
    }
  }
}
$("visitMore").addEventListener("click", () => {
  const lines = currentLines();
  const next = lines[state.visit.line + 1];
  if (next && lineAvailable(next)) { state.visit.line += 1; showVisitLine(); }
});
$("visitBackToTeam").addEventListener("click", () => { hide($("teamVisit")); show($("teamChooser")); });

/* ==================================================================== */
/* OVERLAYS / MESSAGES                                                  */
/* ==================================================================== */
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => hide($(b.dataset.close))));
document.querySelectorAll(".overlay").forEach((ov) => ov.addEventListener("click", (e) => { if (e.target === ov) hide(ov); }));

let messageTimer = null;
function message(text, sticky) {
  const b = $("messageBubble");
  b.textContent = text; show(b);
  if (messageTimer) clearTimeout(messageTimer);
  if (!sticky) messageTimer = setTimeout(() => hide(b), 7000);
}
function bigMessage(text, actionLabel, actionFn) {
  $("bigMessageText").textContent = text;
  const act = $("bigMessageAction");
  if (actionLabel) { act.hidden = false; act.textContent = actionLabel; act.onclick = () => { hide($("bigMessage")); actionFn(); }; }
  else act.hidden = true;
  show($("bigMessage"));
}
$("bigMessageClose").addEventListener("click", () => hide($("bigMessage")));

/* ==================================================================== */
/* THROW / THROTTLE CONTROLS                                            */
/* ==================================================================== */
function renderThrowControls() {
  const box = $("throwControls");
  box.hidden = false;
  if (state.game === "rescue") {
    const vMove = G().acquired.has("verticalRockThrowing");
    box.innerHTML = `<span class="ctrl-label">Throw a rock:</span>
      <button class="logo-btn" data-throw="left">◄ left (move right)</button>
      <button class="logo-btn" data-throw="right">right (move left) ►</button>`
      + (vMove ? `<button class="logo-btn" data-vmove="up">▲ down (move up)</button>
      <button class="logo-btn" data-vmove="down">▼ up (move down)</button>` : ``)
      + `<span class="ctrl-hint">or use the arrow keys &nbsp;\u00b7&nbsp; drag the astronaut or ship to reposition them before you start</span>`;
    box.querySelectorAll("[data-throw]").forEach((b) => b.addEventListener("click", () => throwRock(b.dataset.throw)));
    box.querySelectorAll("[data-vmove]").forEach((b) => b.addEventListener("click", () => throwRockVertical(b.dataset.vmove)));
  } else {
    box.innerHTML = `<span class="ctrl-label">Throttle:</span>
      <button class="logo-btn" data-throttle="up">▲ More (W / ↑)</button>
      <button class="logo-btn" data-throttle="down">▼ Less (S / ↓)</button>
      <span class="ctrl-hint">fire the thruster to slow your fall</span>`;
    box.querySelectorAll("[data-throttle]").forEach((b) => b.addEventListener("click", () => adjustThrottle(b.dataset.throttle === "up" ? 10 : -10)));
  }
}

/* ==================================================================== */
/* SIMULATION                                                           */
/* ==================================================================== */
$("startBtn").addEventListener("click", startGame);
$("stopBtn").addEventListener("click", () => stopGame(true));
$("recordBtn").addEventListener("click", toggleRecord);
$("autopilotBtn").addEventListener("click", openAutopilot);

function resetSim() {
  state.running = false; state.ended = false; state.reachedDuringRun = false; state.autopilot = false;
  state.t = 0; state.vx = 0; state.vy = 0; state.gaugeHist = []; state.outOfRocks = false; state._fireAcc = 0;
  ensureStartPositions();
  if (state.game === "rescue") {
    state.ax = state.startA.x; state.ay = state.startA.y;
    state.shipX = state.shipPos.x; state.shipY = state.shipPos.y;
    state.rocks = sv("horizontalRockThrowing", "initialRocks") ?? 42;
  } else {
    state.y = state.landerStartH; state.vy = 0;
    state.fuel = sv("verticalThruster", "fuel") ?? 80;
    if (G().acquired.has("verticalThruster")) G().settings["verticalThruster.throttle"] = 0;
  }
  updateGaugeVisibility(); layout(); updateReadouts(); drawGauge();
}

function movementMissing() {
  return state.game === "rescue"
    ? (!playerHas("horizontalRockThrowing") || !playerHas("horizontalVelocity"))
    : (!playerHas("verticalVelocity") || !playerHas("verticalThruster"));
}
function missingDiag() {
  if (state.game === "rescue") {
    if (!playerHas("horizontalRockThrowing")) return "Your astronaut can't do anything yet. Drag the Horizontal Rock Throwing Gadget onto her back so she can move by throwing rocks.";
    if (!playerHas("horizontalVelocity")) return "Your astronaut can throw rocks, but the picture won't move because she hasn't got the Horizontal Velocity Gadget. That program defines what it means to move left or right.";
  } else {
    if (!playerHas("verticalVelocity")) return "Your lander has no Vertical Velocity Gadget, so it can't move up or down. Drag it onto the lander's back.";
    if (!playerHas("verticalThruster")) return "All your lander can do is fall, because it has no Thruster Gadget to push it back up.";
  }
  return null;
}

function setupTip() {
  if (state.running) return false;
  if (state.game === "rescue" && playerHas("horizontalRockThrowing") && playerHas("horizontalVelocity")) {
    message("Ready! Press Start Game, then tap \u2190 / \u2192 (or the buttons) to throw rocks. You can drag the astronaut or the ship to reposition them first.", true);
    return true;
  }
  if (state.game === "lander" && playerHas("verticalVelocity") && playerHas("verticalThruster")) {
    message("Ready! Press Start Game, then use \u2191 / \u2193 to set the throttle. Keep your descent speed low and watch the Descent dial. You can drag the lander to set its start height first.", true);
    return true;
  }
  return false;
}
function startGame() {
  if (movementMissing()) { bigMessage(missingDiag(), "Visit your team", openTeam); return; }
  resetSim();
  state.running = true;
  hide($("bigMessage"));
  hide($("messageBubble"));          // the setup tip disappears once the game starts
  if (state.recording) state.record = [];
  lastFrame = performance.now();
  requestAnimationFrame(loop);
}
function stopGame(byUser) {
  if (!state.running) { evaluateIncomplete(); return; }
  state.running = false;
  if (byUser) { message("Stopped everything."); evaluateIncomplete(); }
}
function evaluateIncomplete() {
  if (state.ended) return;
  const endKey = state.game === "rescue" ? "reachedShip" : "landingAction";
  const reachedGoal = state.game === "rescue" ? state.reachedDuringRun : (state.y <= 0.5);
  if (reachedGoal && !playerHas(endKey)) {
    G().flags.add("testedIncomplete");
    const msg = state.game === "rescue"
      ? "Your astronaut reached the ship — but nothing happened! You haven't decided what should happen when she gets there, so she just slides past. Visit your team to figure out the ending."
      : "Your lander reached the surface — but nothing happened! You haven't decided what counts as a safe landing. Visit your team to add a Landing Action.";
    bigMessage(msg, "Visit your team", openTeam);
  }
}

let lastFrame = 0;
function loop(now) {
  if (!state.running) return;
  let dt = (now - lastFrame) / 1000; lastFrame = now;
  if (dt > 0.05) dt = 0.05;
  if (state.game === "rescue") stepRescue(dt); else stepLander(dt);
  if (state.autopilot) applyAutopilot();
  layout(); updateReadouts(); pushGauge(); drawGauge();
  if (state.running) requestAnimationFrame(loop);
}

/* ---- Rescue ---- */
function throwRock(dir) {
  if (!state.running || state.game !== "rescue" || !playerHas("horizontalRockThrowing")) return;
  const mass = sv("horizontalRockThrowing", "rockMass");
  const speed = sv("horizontalRockThrowing", "rockSpeed");
  if (state.rocks < mass) { if (!state.outOfRocks) { state.outOfRocks = true; message("You are out of rocks!", true); } return; }
  state.rocks -= mass;
  const total = PHYS.massWithoutRocks + state.rocks;
  const sign = dir === "left" ? +1 : -1;       // throw left -> move right (+x)
  state.vx += sign * mass * speed / total;
  animateProjectile("astronaut", dir === "left" ? -1 : +1, 0);
}
function throwRockVertical(dir) {
  if (!state.running || state.game !== "rescue" || !playerHas("verticalRockThrowing")) return;
  const mass = sv("horizontalRockThrowing", "rockMass");
  const speed = sv("horizontalRockThrowing", "rockSpeed");
  if (state.rocks < mass) { if (!state.outOfRocks) { state.outOfRocks = true; message("You are out of rocks!", true); } return; }
  state.rocks -= mass;
  const total = PHYS.massWithoutRocks + state.rocks;
  const sign = dir === "up" ? -1 : +1;                 // screen y: up = negative
  state.vy += sign * mass * speed / total;
  animateProjectile("astronaut", 0, dir === "up" ? +1 : -1);
}
function stepRescue(dt) {
  state.t += dt;
  if (playerHas("horizontalVelocity")) state.ax += state.vx * dt;
  if (playerHas("verticalVelocityRescue")) state.ay += state.vy * dt;
  state.ax = clamp(state.ax, -10, PHYS.worldW + 10);
  state.ay = clamp(state.ay, 0, PHYS.worldH);
  const dist = Math.hypot(state.shipX - state.ax, state.shipY - state.ay);
  if (dist <= PHYS.dockRadius) {
    state.reachedDuringRun = true;
    if (playerHas("reachedShip")) {
      const speed = Math.hypot(state.vx, state.vy), safe = sv("reachedShip", "safeSpeed");
      if (speed <= safe) endGame(true, "Good job! You reached your ship.", `Docking speed ${speed.toFixed(1)} m/s \u00b7 time ${state.t.toFixed(1)} s`);
      else endGame(false, "You reached your ship but you were moving too fast.", `Your speed was ${speed.toFixed(1)} m/s (safe is ${safe} m/s)`);
      return;
    }
  }
  if (playerHas("reachedShip") && state.t > sv("reachedShip", "airSeconds"))
    endGame(false, "You are out of air! Too bad.", `The astronaut ran out of oxygen after ${sv("reachedShip", "airSeconds")} seconds.`);
}


/* ---- Lander ---- */
function adjustThrottle(delta) {
  if (state.game !== "lander" || !G().acquired.has("verticalThruster")) return;
  const cur = G().settings["verticalThruster.throttle"] || 0;
  const next = Math.max(0, Math.min(100, cur + delta));
  G().settings["verticalThruster.throttle"] = next;
  if (state.running && state.recording) state.record.push([Number(state.t.toFixed(2)), next]);
}
function stepLander(dt) {
  state.t += dt;
  if (playerHas("gravity")) state.vy += sv("gravity", "gravity") * dt;   // gravity negative
  if (playerHas("verticalThruster")) {
    const throttle = G().settings["verticalThruster.throttle"] || 0;
    if (throttle > 0 && state.fuel > 0) {
      const pMass = sv("verticalThruster", "projectileMass");
      const pSpeed = sv("verticalThruster", "projectileSpeed");
      state._fireAcc += dt * (throttle / 100) * PHYS.landerFireRate;
      while (state._fireAcc >= 1 && state.fuel >= pMass) {
        state._fireAcc -= 1; state.fuel -= pMass;
        state.vy += pSpeed * pMass / PHYS.landerMass;
        animateProjectile("lander", 0, +1);
      }
    }
  }
  if (playerHas("verticalVelocity")) state.y += state.vy * dt;
  if (state.y <= 0) {
    state.y = 0; state.reachedDuringRun = true;
    if (playerHas("landingAction")) {
      const speed = Math.abs(state.vy), safe = sv("landingAction", "safeLandingSpeed");
      if (speed <= safe) endGame(true, "The Eagle has landed!", `Touchdown ${speed.toFixed(2)} m/s \u00b7 fuel left ${Math.max(0, state.fuel).toFixed(0)} kg`);
      else endGame(false, "Too bad. You crashed!", `Touchdown ${speed.toFixed(2)} m/s (safe is ${safe} m/s)`);
      return;
    }
    state.vy = 0; state.running = false; evaluateIncomplete();
  }
}

function endGame(win, headline, detail) {
  state.running = false; state.ended = true;
  if (state.recording) { state.recording = false; $("recordBtn").textContent = "● Record"; }
  const icon = win ? "\u2714" : "\u2716";
  $("bigMessageText").innerHTML = `<div class="bm-title ${win ? "win" : "lose"}">${icon} ${headline}</div>`
    + (detail ? `<div class="bm-sub">${detail}</div>` : "");
  $("bigMessageAction").hidden = true;
  show($("bigMessage"));
  if (win) playPhut();
}

/* ---- record / autopilot ---- */
function toggleRecord() {
  state.recording = !state.recording;
  $("recordBtn").textContent = state.recording ? "● Recording…" : "● Record";
  if (state.recording) { state.record = []; message("Recording is on. Click Start and fly - your throttle changes are recorded. Then Stop and open Auto-pilot Code.", true); }
}
function buildAutopilotCode() {
  const lines = state.record.length ? state.record : [[0, 0]];
  let out = "; AUTOPILOT CODE\n; Created by recording the throttle changes from your last flight.\n; The first number is when (seconds) to set the throttle; the second is the value.\n";
  lines.forEach(([t, v]) => { out += `schedule ${t} [set_throttle ${v}]\n`; });
  return out;
}
function openAutopilot() {
  if (state.game !== "lander") return;
  if (!state.record.length && !state.autoCode) message("Record a flight first: click ● Record, then Start, fly the lander, and Stop. Then open Auto-pilot Code.", true);
  $("autopilotCode").value = state.record.length ? buildAutopilotCode() : (state.autoCode || buildAutopilotCode());
  $("autopilotStatus").textContent = "";
  show($("autopilotOverlay"));
}
$("runAutopilot").addEventListener("click", () => {
  state.autoCode = $("autopilotCode").value;
  state.autoSchedule = parseAutopilot(state.autoCode);
  hide($("autopilotOverlay"));
  if (!playerHas("verticalThruster") || !playerHas("verticalVelocity")) { bigMessage("Put the lander's behaviour gadgets back on before running the auto-pilot.", "Visit your team", openTeam); return; }
  resetSim();
  state.running = true; state.autopilot = true; state._autoIdx = 0;
  hide($("bigMessage")); hide($("messageBubble"));
  lastFrame = performance.now(); requestAnimationFrame(loop);
});
function parseAutopilot(text) {
  const out = [];
  text.split("\n").forEach((l) => {
    const m = l.match(/schedule\s+([\d.]+)\s*\[\s*set_throttle\s+([\d.]+)/i);
    if (m) out.push([parseFloat(m[1]), parseFloat(m[2])]);
  });
  return out.sort((a, b) => a[0] - b[0]);
}
function applyAutopilot() {
  const sch = state.autoSchedule || [];
  while (state._autoIdx < sch.length && sch[state._autoIdx][0] <= state.t) {
    G().settings["verticalThruster.throttle"] = sch[state._autoIdx][1]; state._autoIdx++;
  }
}

/* ==================================================================== */
/* RENDER                                                               */
/* ==================================================================== */
function stageW() { return $("stage").clientWidth || 700; }
function stageH() { return $("stage").clientHeight || 420; }
function layout() {
  const W = stageW(), H = stageH();
  if (state.game === "rescue") {
    if (state.ax === undefined) { ensureStartPositions(); state.ax = state.startA.x; state.ay = state.startA.y; state.shipX = state.shipPos.x; state.shipY = state.shipPos.y; }
    const sX = W / PHYS.worldW, sY = H / PHYS.worldH;
    const a = $("astronaut"); a.style.right = "auto";
    a.style.left = (state.ax * sX - 32) + "px"; a.style.top = (state.ay * sY - 32) + "px";
    const sh = $("ship"); sh.style.right = "auto";
    sh.style.left = (state.shipX * sX - 35) + "px"; sh.style.top = (state.shipY * sY - 35) + "px";
  } else {
    const surfaceY = H - 14, scaleYL = (surfaceY - 12) / PHYS.landerWorldH;
    const yv = (state.y === undefined ? state.landerStartH : state.y);
    const l = $("lander"); l.style.right = "auto"; l.style.left = (W / 2 - 32) + "px";
    l.style.top = Math.max(2, surfaceY - 64 - yv * scaleYL) + "px";
  }
}
function updateGaugeVisibility() {
  const key = state.game === "rescue" ? "gaugesRescue" : "gaugesLander";
  $("gaugePanel").hidden = !playerHas(key);
}
function updateReadouts() {
  const r = $("readouts");
  if (state.game === "rescue") {
    const dist = Math.hypot(state.shipX - state.ax, state.shipY - state.ay);
    const air = playerHas("reachedShip") ? Math.max(0, sv("reachedShip", "airSeconds") - state.t) : null;
    r.innerHTML = `<span>Time <strong>${state.t.toFixed(1)}</strong> s</span>
      <span>Speed <strong>${Math.hypot(state.vx, state.vy).toFixed(1)}</strong> m/s</span>
      <span>Rocks <strong>${Math.max(0, state.rocks).toFixed(0)}</strong> kg</span>
      <span>Distance <strong>${dist.toFixed(0)}</strong> m</span>`
      + (air !== null ? `<span>Air <strong>${air.toFixed(0)}</strong> s</span>` : "");
  } else {
    r.innerHTML = `<span>Time <strong>${state.t.toFixed(1)}</strong> s</span>
      <span>Height <strong>${Math.max(0, state.y).toFixed(0)}</strong> m</span>
      <span>Vert. speed <strong>${state.vy.toFixed(1)}</strong> m/s</span>
      <span>Throttle <strong>${(G().settings["verticalThruster.throttle"] || 0).toFixed(0)}</strong>%</span>
      <span>Fuel <strong>${Math.max(0, state.fuel).toFixed(0)}</strong> kg</span>`;
  }
  $("statusLeft").textContent = G().acquired.size === 0 ? "No behaviours yet — visit your team."
    : (playerBackEmpty() ? "This object has no behaviours. Drag gadgets onto its back." : "");
}
function playerBackEmpty() {
  const pid = GAMES[state.game].player;
  return !G().backs[pid] || G().backs[pid].size === 0;
}
function pushGauge() {
  const v = state.game === "rescue" ? Math.abs(state.vx) : state.vy;
  state.gaugeHist.push(v); if (state.gaugeHist.length > 200) state.gaugeHist.shift();
}
function drawGauge() {
  const c = $("gaugeCanvas"); if (!c || $("gaugePanel").hidden) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#f7f4ea"; ctx.fillRect(0, 0, c.width, c.height);
  let dials;
  if (state.game === "rescue") {
    const initRocks = sv("horizontalRockThrowing", "initialRocks") || 42;
    const dist = Math.hypot((state.shipX ?? 182) - (state.ax ?? 20), (state.shipY ?? 70) - (state.ay ?? 70));
    dials = [
      ["Speed", Math.hypot(state.vx, state.vy), 30, "m/s"],
      ["Distance", dist, 200, "m"],
      ["Rocks", Math.max(0, state.rocks), initRocks, "kg"],
    ];
    if (playerHas("reachedShip")) {
      const airMax = sv("reachedShip", "airSeconds");
      dials.push(["Air", Math.max(0, airMax - state.t), airMax, "s"]);
    }
  } else {
    const fuel0 = sv("verticalThruster", "fuel") || 100;
    dials = [
      ["Descent", Math.max(0, -state.vy), 20, "m/s"],
      ["Height", Math.max(0, state.y), PHYS.landerStartHeight, "m"],
      ["Thrust", (G().settings["verticalThruster.throttle"] || 0), 100, "%"],
      ["Fuel", Math.max(0, state.fuel), fuel0, "kg"],
    ];
  }
  const n = dials.length, w = c.width / n;
  dials.forEach((d, i) => dial(ctx, w * i + w / 2, 74, 30, d, i === 0));
}
function dial(ctx, cx, cy, r, spec, hot) {
  const label = spec[0], val = spec[1], max = spec[2], unit = spec[3];
  const a0 = Math.PI, a1 = 2 * Math.PI;            // top semicircle
  const frac = Math.max(0, Math.min(1, val / max));
  ctx.lineCap = "round";
  ctx.lineWidth = 6; ctx.strokeStyle = "#d8d4c8";
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
  ctx.strokeStyle = (hot && frac > 0.8) ? "#c0392b" : "#1f6fb2";
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * frac); ctx.stroke();
  const ang = a0 + (a1 - a0) * frac;
  ctx.strokeStyle = "#333"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * r * 0.85, cy + Math.sin(ang) * r * 0.85); ctx.stroke();
  ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "#222"; ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillText(val.toFixed(unit === "m/s" ? 1 : 0), cx, cy - 7);
  ctx.fillStyle = "#555"; ctx.font = "10px Arial";
  ctx.fillText(label + " (" + unit + ")", cx, cy + 13);
  ctx.textAlign = "left";
}
function animateProjectile(objId, dx, dy) {
  const a = $(objId), stage = $("stage");
  const rock = document.createElement("img");
  rock.src = state.game === "rescue" ? "assets/rock1.gif" : "assets/rock2.gif";
  rock.style.cssText = "position:absolute;width:16px;z-index:5;pointer-events:none;";
  let x = a.offsetLeft + a.offsetWidth / 2, y = a.offsetTop + a.offsetHeight / 2;
  rock.style.left = x + "px"; rock.style.top = y + "px"; stage.appendChild(rock);
  let life = 0;
  const iv = setInterval(() => {
    life += 0.05; x += dx * 7; y += dy * 7;
    rock.style.left = x + "px"; rock.style.top = y + "px"; rock.style.opacity = String(Math.max(0, 1 - life));
    if (life >= 1) { clearInterval(iv); rock.remove(); }
  }, 40);
}
let phut;
function playPhut() { try { phut = phut || new Audio("assets/Phut.wav"); phut.currentTime = 0; phut.play().catch(() => {}); } catch (e) {} }

/* ==================================================================== */
/* KEYBOARD                                                             */
/* ==================================================================== */
window.addEventListener("keydown", (e) => {
  if ($("workshopScreen").hidden) return;
  if (state.game === "rescue") {
    if (e.key === "ArrowRight" || e.key === "d") { throwRock("left"); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "a") { throwRock("right"); e.preventDefault(); }
    else if (e.key === "ArrowUp" || e.key === "w") { throwRockVertical("up"); e.preventDefault(); }
    else if (e.key === "ArrowDown" || e.key === "s") { throwRockVertical("down"); e.preventDefault(); }
  } else {
    if (e.key === "ArrowUp" || e.key === "w") { adjustThrottle(10); e.preventDefault(); }
    else if (e.key === "ArrowDown" || e.key === "s") { adjustThrottle(-10); e.preventDefault(); }
  }
});

/* ==================================================================== */
/* DRAG INITIAL POSITIONS (only when the game is not running)           */
/* ==================================================================== */
function makeDraggable(elId, onMove) {
  const el = $(elId); if (!el) return;
  let dragging = false;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", (e) => {
    if (state.running) return;
    dragging = true;
    try { el.setPointerCapture(e.pointerId); } catch (x) {}
    el.classList.add("grabbing"); e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging || state.running) return;
    const r = $("stage").getBoundingClientRect();
    onMove(e.clientX - r.left, e.clientY - r.top, r.width || stageW(), r.height || stageH());
  });
  const end = () => { dragging = false; el.classList.remove("grabbing"); };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}
function setupDragging() {
  makeDraggable("astronaut", (px, py, W, H) => {
    const x = clamp(px / (W / PHYS.worldW), 0, PHYS.worldW), y = clamp(py / (H / PHYS.worldH), 0, PHYS.worldH);
    state.startA = { x, y }; state.ax = x; state.ay = y; layout(); updateReadouts(); drawGauge();
  });
  makeDraggable("ship", (px, py, W, H) => {
    const x = clamp(px / (W / PHYS.worldW), 0, PHYS.worldW), y = clamp(py / (H / PHYS.worldH), 0, PHYS.worldH);
    state.shipPos = { x, y }; state.shipX = x; state.shipY = y; layout(); updateReadouts(); drawGauge();
  });
  makeDraggable("lander", (px, py, W, H) => {
    const surfaceY = H - 14, scaleYL = (surfaceY - 12) / PHYS.landerWorldH;
    const y = clamp((surfaceY - 32 - py) / scaleYL, 2, PHYS.landerWorldH);
    state.landerStartH = y; state.y = y; layout(); updateReadouts(); drawGauge();
  });
}

/* ==================================================================== */
/* BOOT                                                                 */
/* ==================================================================== */
ensureStartPositions();
setupDragging();
renderStory();
window.addEventListener("resize", () => { if (!$("workshopScreen").hidden) layout(); });
