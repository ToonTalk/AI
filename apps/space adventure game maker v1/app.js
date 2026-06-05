const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gaugeCanvases = {
  vy: document.getElementById("vyGauge"),
  height: document.getElementById("heightGauge"),
  fuel: document.getElementById("fuelGauge")
};

const ui = {
  scenarioButtons: [...document.querySelectorAll("[data-scenario]")],
  teamTabs: [...document.querySelectorAll("[data-role]")],
  startPause: document.getElementById("startPause"),
  resetGame: document.getElementById("resetGame"),
  recordAuto: document.getElementById("recordAuto"),
  playAuto: document.getElementById("playAuto"),
  nextPhase: document.getElementById("nextPhase"),
  helpButton: document.getElementById("helpButton"),
  openAllCode: document.getElementById("openAllCode"),
  gadgets: document.getElementById("gadgets"),
  codeBox: document.getElementById("codeBox"),
  phaseBadge: document.getElementById("phaseBadge"),
  teamName: document.getElementById("teamName"),
  teamLine: document.getElementById("teamLine"),
  goalText: document.getElementById("goalText"),
  resultText: document.getElementById("resultText"),
  timeReadout: document.getElementById("timeReadout"),
  fuelReadout: document.getElementById("fuelReadout"),
  speedReadout: document.getElementById("speedReadout"),
  vyValue: document.getElementById("vyValue"),
  heightValue: document.getElementById("heightValue"),
  fuelValue: document.getElementById("fuelValue")
};

const gadgetDefs = {
  horizontalVelocity: {
    title: "Horizontal velocity",
    scenarios: ["rescue", "lander"],
    phase: 1,
    settings: {
      damping: { label: "space drag", min: 0, max: 0.04, step: 0.002, value: 0 }
    },
    code: () => `; Horizontal Velocity Code
repeat_every 1/100
  [change_my_horizontal_position_by
    my_horizontal_velocity / 100]

; editable safety value
space_drag = ${fmt(gadgetDefs.horizontalVelocity.settings.damping.value)}`
  },
  verticalVelocity: {
    title: "Vertical velocity",
    scenarios: ["rescue", "lander"],
    phase: 2,
    settings: {
      shipSpeed: { label: "ship vertical speed", min: -60, max: 60, step: 1, value: 20 }
    },
    code: () => `; Vertical Velocity Code
repeat_every 1/100
  [change_my_vertical_position_by
    my_vertical_velocity / 100]

spaceship_vertical_velocity = ${fmt(gadgetDefs.verticalVelocity.settings.shipSpeed.value)}`
  },
  rockThrower: {
    title: "Rock thrower",
    scenarios: ["rescue"],
    phase: 1,
    settings: {
      rockMass: { label: "rock mass", min: 1, max: 12, step: 1, value: 4 },
      rockSpeed: { label: "rock speed", min: 60, max: 260, step: 5, value: 150 },
      fuel: { label: "total rock mass", min: 20, max: 180, step: 5, value: 80 }
    },
    code: () => `; Horizontal Rock Throwing Code
when_right_arrow_pressed
  [throw_rock_left
   change_my_horizontal_velocity_by
    rock_mass * rock_velocity / my_mass]

rock_mass = ${fmt(gadgetDefs.rockThrower.settings.rockMass.value)}
rock_velocity = ${fmt(gadgetDefs.rockThrower.settings.rockSpeed.value)}`
  },
  movingShip: {
    title: "Moving spaceship",
    scenarios: ["rescue"],
    phase: 2,
    settings: {
      amplitude: { label: "path height", min: 20, max: 180, step: 5, value: 90 }
    },
    code: () => `; Spaceship Motion Code
repeat_every 1/100
  [set_my_vertical_position
    starting_height + sine(time) * path_height]

path_height = ${fmt(gadgetDefs.movingShip.settings.amplitude.value)}`
  },
  airLimit: {
    title: "Air timer",
    scenarios: ["rescue"],
    phase: 2,
    settings: {
      seconds: { label: "air seconds", min: 20, max: 120, step: 5, value: 70 }
    },
    code: () => `; Running Out Of Air Code
repeat_every 1
  [decrease_air_by 1
   if air_left < 1 [game_over "out of air"]]

air_left = ${fmt(gadgetDefs.airLimit.settings.seconds.value)}`
  },
  gravity: {
    title: "Gravity",
    scenarios: ["lander"],
    phase: 3,
    settings: {
      gravity: { label: "moon gravity", min: 10, max: 120, step: 1, value: 52 }
    },
    code: () => `; Gravity Code
repeat_every 1/100
  [change_my_vertical_velocity_by
    moon_gravity / 100]

moon_gravity = ${fmt(gadgetDefs.gravity.settings.gravity.value)}`
  },
  landerThruster: {
    title: "Lander thrusters",
    scenarios: ["lander"],
    phase: 3,
    settings: {
      thrust: { label: "main thrust", min: 80, max: 320, step: 5, value: 210 },
      sideThrust: { label: "side thrust", min: 20, max: 140, step: 5, value: 65 },
      fuel: { label: "fuel", min: 120, max: 900, step: 20, value: 460 }
    },
    code: () => `; Lander Thruster Code
when_up_arrow_pressed
  [change_my_vertical_velocity_by
    -main_thrust / my_mass
   decrease_fuel_by fuel_used]

main_thrust = ${fmt(gadgetDefs.landerThruster.settings.thrust.value)}
side_thrust = ${fmt(gadgetDefs.landerThruster.settings.sideThrust.value)}`
  },
  gauges: {
    title: "Dynamic gauges",
    scenarios: ["rescue", "lander"],
    phase: 2,
    settings: {
      graphScale: { label: "graph scale", min: 0.5, max: 3, step: 0.1, value: 1.2 }
    },
    code: () => `; Gauge Code
repeat_every 1/10
  [plot vertical_velocity
   plot vertical_position
   plot remaining_fuel]

graph_scale = ${fmt(gadgetDefs.gauges.settings.graphScale.value)}`
  },
  autopilot: {
    title: "Autopilot recorder",
    scenarios: ["lander"],
    phase: 4,
    settings: {
      trim: { label: "replay trim", min: -25, max: 25, step: 1, value: 0 }
    },
    code: () => `; Autopilot Code
record_each_key_press
  [time key thrust_value]

replay_with_vertical_trim = ${fmt(gadgetDefs.autopilot.settings.trim.value)}`
  }
};

const teammates = {
  designer: {
    name: "Designer",
    rescue: [
      "Start with a crisp rescue: drifting astronaut, visible ship, one meaningful risk. The game becomes interesting when the ship is reachable but not trivial.",
      "Now give the ship a vertical path and add a limit. The learner has to compose horizontal and vertical motion instead of just waiting.",
      "A finished rescue game should invite tuning: safe arrival speed, amount of rock mass, and a route that feels just barely possible.",
      "You can now compare designs: fastest rescue, least rock mass, or most graceful final speed."
    ],
    lander: [
      "The Lunar Lander version is about judging a changing situation. Make the landing pad clear and let the gauges carry the drama.",
      "A safe landing rule turns motion into a game. It is no longer enough to arrive; you have to arrive gently.",
      "Recording an expert landing gives players a thing to improve. The first autopilot is rarely the best one.",
      "A good challenge is economical: safe speed, short time, and very little fuel left unused."
    ]
  },
  scientist: {
    name: "Scientist",
    rescue: [
      "In deep space, throwing a rock changes the astronaut's momentum in the opposite direction. Larger rocks or faster rocks create larger velocity changes.",
      "Diagonal travel is just horizontal and vertical velocity happening together. The screen shows the composition directly.",
      "The mass tradeoff matters: carrying more rocks gives more attempts, but each throw has less effect on a heavier astronaut.",
      "The gauges make invisible quantities negotiable. Watch velocity near the ship, not just position."
    ],
    lander: [
      "Moon gravity steadily increases downward velocity. A thruster does the opposite by changing momentum upward.",
      "A soft landing means low vertical speed near the surface. Fuel use is the price paid for reducing that speed.",
      "A recorded landing is a physics experiment: replay, change one parameter, and watch the graph shift.",
      "The best run usually uses thrust early enough to avoid panic, then trims the final velocity close to the safe threshold."
    ]
  },
  programmer: {
    name: "Programmer",
    rescue: [
      "The gadgets are small concurrent processes. Horizontal velocity updates x. The rock thrower edits velocity when a key is pressed.",
      "The vertical gadget is separate on purpose. Combining two small processes is easier to inspect than one large hidden formula.",
      "Code boxes expose the editable constants. Sliders are the first layer; code reading is the next layer down.",
      "Try changing only one gadget at a time. It keeps cause and effect legible."
    ],
    lander: [
      "Gravity is a repeating change to vertical velocity. Thrusters are conditional changes triggered by player input.",
      "Autopilot stores input frames, then feeds them back into the same physics. It is not magic; it is a recorded controller.",
      "Replay trim is deliberately crude. It nudges the recorded program and shows how brittle or robust a strategy is.",
      "The simplest programs are the best teaching objects: short, inspectable, and easy to recombine."
    ]
  },
  historian: {
    name: "Historian",
    rescue: [
      "This reconstruction follows the paper's first phase: an astronaut adrift, rock throwing, constraints, then a moving target.",
      "The original kit used Imagine Logo fragments and behaviour gadgets that could be attached to pictures.",
      "The metagame framed learners as game developers, supported by a fictional team with different kinds of expertise.",
      "The important historical idea is layered access: play first, tune next, inspect code when ready."
    ],
    lander: [
      "Lunar Lander was a classic way to make Newtonian motion playable. The SGCK used it as a construction challenge.",
      "The paper notes gauges, fuel tradeoffs, safe landing thresholds, and two-player competitions as motivating constraints.",
      "Recording and editing a landing was the route into autopilot programming.",
      "A web reconstruction can preserve the spirit by keeping the physics visible and the behaviours recombinable."
    ]
  }
};

const stars = Array.from({ length: 140 }, (_, i) => ({
  x: (i * 73 + 19) % canvas.width,
  y: (i * 41 + 37) % canvas.height,
  r: 0.6 + ((i * 13) % 10) / 12
}));

const state = {
  scenario: "rescue",
  phase: 1,
  role: "designer",
  selectedGadget: "horizontalVelocity",
  running: false,
  recording: false,
  replaying: false,
  replayIndex: 0,
  autoFrames: [],
  controls: new Set(),
  history: { vy: [], height: [], fuel: [] },
  last: performance.now(),
  throwCooldown: 0,
  message: "Ready"
};

const attached = {
  rescue: {
    horizontalVelocity: true,
    verticalVelocity: false,
    rockThrower: true,
    movingShip: false,
    airLimit: false,
    gauges: true
  },
  lander: {
    horizontalVelocity: true,
    verticalVelocity: true,
    gravity: true,
    landerThruster: true,
    gauges: true,
    autopilot: false
  }
};

let world = {};
resetWorld();
renderAll();
requestAnimationFrame(loop);

ui.scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.scenario = button.dataset.scenario;
    state.phase = state.scenario === "rescue" ? 1 : 3;
    state.selectedGadget = state.scenario === "rescue" ? "horizontalVelocity" : "gravity";
    resetWorld();
    renderAll();
  });
});

ui.teamTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.role = button.dataset.role;
    renderTeam();
  });
});

ui.startPause.addEventListener("click", () => {
  state.running = !state.running;
  ui.startPause.textContent = state.running ? "Pause" : "Start";
  state.message = state.running ? "Running" : "Paused";
  renderStatus();
});

ui.resetGame.addEventListener("click", () => {
  resetWorld();
  renderAll();
});

ui.recordAuto.addEventListener("click", () => {
  state.recording = !state.recording;
  state.replaying = false;
  if (state.recording) {
    state.autoFrames = [];
    state.message = "Recording";
  } else {
    state.message = `${state.autoFrames.length} frames recorded`;
  }
  renderStatus();
});

ui.playAuto.addEventListener("click", () => {
  if (!state.autoFrames.length) {
    state.message = "Record a landing first";
  } else {
    resetWorld();
    state.replaying = true;
    state.recording = false;
    state.running = true;
    state.replayIndex = 0;
    state.message = "Autopilot replay";
  }
  renderAll();
});

ui.nextPhase.addEventListener("click", () => {
  state.phase = Math.min(4, state.phase + 1);
  if (state.phase >= 2) {
    attached.rescue.verticalVelocity = true;
    attached.rescue.movingShip = true;
    attached.rescue.airLimit = true;
  }
  if (state.phase >= 4) {
    attached.lander.autopilot = true;
  }
  renderAll();
});

ui.helpButton.addEventListener("click", () => {
  const order = ["designer", "scientist", "programmer", "historian"];
  const current = order.indexOf(state.role);
  state.role = order[(current + 1) % order.length];
  renderTeam();
});

ui.openAllCode.addEventListener("click", () => {
  ui.codeBox.textContent = Object.entries(gadgetDefs)
    .filter(([, def]) => def.scenarios.includes(state.scenario) && def.phase <= state.phase)
    .map(([key, def]) => `${def.title.toUpperCase()}\n${def.code(key)}`)
    .join("\n\n------------------------------\n\n");
});

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "].includes(event.key)) {
    event.preventDefault();
    state.controls.add(event.key.toLowerCase());
  }
});

window.addEventListener("keyup", (event) => {
  state.controls.delete(event.key.toLowerCase());
});

function loop(now) {
  const dt = Math.min(0.04, (now - state.last) / 1000);
  state.last = now;
  if (state.running) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  world.time += dt;
  state.throwCooldown = Math.max(0, state.throwCooldown - dt);
  const controls = state.replaying ? replayControls() : state.controls;
  if (state.recording) {
    state.autoFrames.push([...state.controls]);
  }
  if (state.scenario === "rescue") updateRescue(dt, controls);
  if (state.scenario === "lander") updateLander(dt, controls);
  collectGaugeSamples();
  renderStatus();
}

function updateRescue(dt, controls) {
  const astronaut = world.player;
  const ship = world.ship;
  if (isAttached("rockThrower") && state.throwCooldown === 0) {
    const dir = controlVector(controls);
    if ((dir.x || dir.y) && astronaut.fuel >= setting("rockThrower", "rockMass")) {
      const mass = setting("rockThrower", "rockMass");
      const speed = setting("rockThrower", "rockSpeed");
      const impulse = mass * speed / astronaut.mass;
      astronaut.vx += dir.x * impulse;
      astronaut.vy += dir.y * impulse;
      astronaut.fuel -= mass;
      state.throwCooldown = 0.18;
    }
  }
  if (isAttached("horizontalVelocity")) {
    astronaut.x += astronaut.vx * dt;
    astronaut.vx *= 1 - setting("horizontalVelocity", "damping");
  }
  if (isAttached("verticalVelocity")) {
    astronaut.y += astronaut.vy * dt;
  }
  if (isAttached("movingShip")) {
    const amp = setting("movingShip", "amplitude");
    ship.y = 280 + Math.sin(world.time * 0.9) * amp;
  } else if (isAttached("verticalVelocity")) {
    ship.y += setting("verticalVelocity", "shipSpeed") * dt;
    if (ship.y < 90 || ship.y > 470) {
      gadgetDefs.verticalVelocity.settings.shipSpeed.value *= -1;
    }
  }
  if (isAttached("airLimit")) {
    astronaut.air -= dt;
    if (astronaut.air <= 0) finish("Out of air", false);
  }
  wrapPlayer(astronaut);
  const dx = astronaut.x - ship.x;
  const dy = astronaut.y - ship.y;
  const speed = Math.hypot(astronaut.vx, astronaut.vy);
  if (Math.hypot(dx, dy) < 42) {
    finish(speed < 55 ? "Docked safely" : "Hit the ship too fast", speed < 55);
  }
}

function updateLander(dt, controls) {
  const lander = world.player;
  if (isAttached("gravity")) {
    lander.vy += setting("gravity", "gravity") * dt;
  }
  if (isAttached("landerThruster") && lander.fuel > 0) {
    const main = setting("landerThruster", "thrust");
    const side = setting("landerThruster", "sideThrust");
    const trim = state.replaying && isAttached("autopilot") ? setting("autopilot", "trim") : 0;
    let fuelUse = 0;
    if (controls.has("arrowup") || controls.has("w") || controls.has(" ")) {
      lander.vy -= (main + trim) * dt;
      fuelUse += main * 0.35 * dt;
    }
    if (controls.has("arrowleft") || controls.has("a")) {
      lander.vx -= side * dt;
      fuelUse += side * 0.2 * dt;
    }
    if (controls.has("arrowright") || controls.has("d")) {
      lander.vx += side * dt;
      fuelUse += side * 0.2 * dt;
    }
    lander.fuel = Math.max(0, lander.fuel - fuelUse);
  }
  if (isAttached("horizontalVelocity")) {
    lander.x += lander.vx * dt;
  }
  if (isAttached("verticalVelocity")) {
    lander.y += lander.vy * dt;
  }
  lander.x = clamp(lander.x, 30, canvas.width - 30);
  const ground = canvas.height - 64;
  if (lander.y >= ground) {
    lander.y = ground;
    const safe = Math.abs(lander.vy) < 42 && Math.abs(lander.vx) < 35 && Math.abs(lander.x - world.pad.x) < 84;
    finish(safe ? "Soft landing" : "Crash landing", safe);
  }
  if (lander.y < -60) finish("Lost above the screen", false);
}

function replayControls() {
  if (state.replayIndex >= state.autoFrames.length) {
    state.replaying = false;
    return new Set();
  }
  const frame = new Set(state.autoFrames[state.replayIndex]);
  state.replayIndex += 1;
  return frame;
}

function finish(message, success) {
  state.running = false;
  state.recording = false;
  state.replaying = false;
  state.message = success ? `${message}` : `${message}`;
  world.finished = true;
  renderStatus();
}

function controlVector(controls) {
  let x = 0;
  let y = 0;
  if (controls.has("arrowright") || controls.has("d")) x += 1;
  if (controls.has("arrowleft") || controls.has("a")) x -= 1;
  if (controls.has("arrowdown") || controls.has("s")) y += 1;
  if (controls.has("arrowup") || controls.has("w") || controls.has(" ")) y -= 1;
  const mag = Math.hypot(x, y) || 1;
  return { x: x / mag, y: y / mag };
}

function resetWorld() {
  state.running = false;
  state.recording = false;
  state.replaying = false;
  state.controls.clear();
  state.history = { vy: [], height: [], fuel: [] };
  state.message = "Ready";
  if (state.scenario === "rescue") {
    world = {
      time: 0,
      finished: false,
      player: {
        x: 130,
        y: 282,
        vx: 0,
        vy: 0,
        mass: 80 + setting("rockThrower", "fuel"),
        fuel: setting("rockThrower", "fuel"),
        air: setting("airLimit", "seconds")
      },
      ship: { x: 810, y: 282 }
    };
  } else {
    world = {
      time: 0,
      finished: false,
      player: {
        x: 500,
        y: 72,
        vx: 0,
        vy: 0,
        mass: 1500,
        fuel: setting("landerThruster", "fuel")
      },
      pad: { x: 500, y: canvas.height - 54 }
    };
  }
  ui.startPause.textContent = "Start";
}

function renderAll() {
  ui.scenarioButtons.forEach((button) => button.classList.toggle("active", button.dataset.scenario === state.scenario));
  renderGadgets();
  renderCode();
  renderTeam();
  renderStatus();
}

function renderGadgets() {
  ui.gadgets.innerHTML = "";
  Object.entries(gadgetDefs)
    .filter(([, def]) => def.scenarios.includes(state.scenario) && def.phase <= state.phase)
    .forEach(([key, def]) => {
      const card = document.createElement("section");
      card.className = `gadget ${isAttached(key) ? "attached" : ""}`;
      const title = document.createElement("div");
      title.className = "gadget-title";
      title.innerHTML = `<strong>${def.title}</strong>`;
      const attachButton = document.createElement("button");
      attachButton.className = "attach";
      attachButton.type = "button";
      attachButton.textContent = isAttached(key) ? "attached" : "attach";
      attachButton.addEventListener("click", () => {
        attached[state.scenario][key] = !isAttached(key);
        state.selectedGadget = key;
        resetWorld();
        renderAll();
      });
      title.append(attachButton);
      card.append(title);
      Object.entries(def.settings).forEach(([settingKey, settingDef]) => {
        const label = document.createElement("label");
        const valueId = `${key}-${settingKey}-value`;
        label.innerHTML = `<div class="row"><span>${settingDef.label}</span><strong id="${valueId}">${fmt(settingDef.value)}</strong></div>`;
        const input = document.createElement("input");
        input.type = "range";
        input.min = settingDef.min;
        input.max = settingDef.max;
        input.step = settingDef.step;
        input.value = settingDef.value;
        input.addEventListener("input", () => {
          settingDef.value = Number(input.value);
          document.getElementById(valueId).textContent = fmt(settingDef.value);
          state.selectedGadget = key;
          if (["fuel", "seconds"].includes(settingKey)) resetWorld();
          renderCode();
        });
        label.append(input);
        card.append(label);
      });
      card.addEventListener("click", () => {
        state.selectedGadget = key;
        renderCode();
      });
      ui.gadgets.append(card);
    });
}

function renderCode() {
  const def = gadgetDefs[state.selectedGadget];
  ui.codeBox.textContent = def ? def.code(state.selectedGadget) : "";
}

function renderTeam() {
  ui.teamTabs.forEach((button) => button.classList.toggle("active", button.dataset.role === state.role));
  const teammate = teammates[state.role];
  ui.teamName.textContent = teammate.name;
  ui.teamLine.textContent = teammate[state.scenario][Math.max(0, Math.min(3, state.phase - 1))];
  ui.phaseBadge.textContent = `Phase ${state.phase}`;
  ui.goalText.textContent = state.scenario === "rescue"
    ? rescueGoal()
    : landerGoal();
}

function renderStatus() {
  const p = world.player || { vx: 0, vy: 0, fuel: 0, y: 0 };
  const speed = Math.hypot(p.vx, p.vy);
  ui.resultText.textContent = state.message;
  ui.timeReadout.textContent = fmt(world.time || 0);
  ui.fuelReadout.textContent = fmt(p.fuel || 0);
  ui.speedReadout.textContent = fmt(speed);
  ui.vyValue.textContent = fmt(p.vy || 0);
  ui.heightValue.textContent = fmt(heightValue());
  ui.fuelValue.textContent = fmt(p.fuel || 0);
  ui.recordAuto.textContent = state.recording ? "Stop" : "Record";
  ui.playAuto.disabled = !state.autoFrames.length;
  ui.nextPhase.disabled = state.phase >= 4;
  drawGauges();
}

function collectGaugeSamples() {
  if (!isAttached("gauges")) return;
  const p = world.player;
  pushHistory("vy", p.vy);
  pushHistory("height", heightValue());
  pushHistory("fuel", p.fuel);
}

function pushHistory(name, value) {
  state.history[name].push(value);
  if (state.history[name].length > 90) state.history[name].shift();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpace();
  if (state.scenario === "rescue") drawRescue();
  if (state.scenario === "lander") drawLander();
  drawOverlay();
}

function drawSpace() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#061016");
  gradient.addColorStop(1, "#111615");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  stars.forEach((star) => {
    ctx.fillStyle = star.r > 1.1 ? "#d8f1ff" : "#74909a";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRescue() {
  const p = world.player;
  const ship = world.ship;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.fillStyle = "#ccd5d7";
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(-18, -24);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-18, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6fd1ff";
  ctx.fillRect(-10, -8, 20, 16);
  ctx.restore();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(p.vy, p.vx || 0.01) * 0.15);
  ctx.strokeStyle = "#eef3f7";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -17, 9, 0, Math.PI * 2);
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 16);
  ctx.moveTo(-17, 1);
  ctx.lineTo(17, 1);
  ctx.moveTo(0, 15);
  ctx.lineTo(-12, 29);
  ctx.moveTo(0, 15);
  ctx.lineTo(13, 29);
  ctx.stroke();
  ctx.fillStyle = "#f2c94c";
  ctx.fillRect(-5, -23, 10, 4);
  ctx.restore();

  drawVelocityArrow(p.x, p.y, p.vx, p.vy);
}

function drawLander() {
  const p = world.player;
  const ground = canvas.height - 54;
  ctx.fillStyle = "#273026";
  ctx.fillRect(0, ground, canvas.width, 54);
  ctx.fillStyle = "#77906a";
  for (let x = 0; x < canvas.width; x += 34) {
    ctx.fillRect(x, ground + ((x / 34) % 3) * 4, 20, 2);
  }
  ctx.fillStyle = "#f2c94c";
  ctx.fillRect(world.pad.x - 70, ground - 3, 140, 6);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "#d6dee0";
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(24, 10);
  ctx.lineTo(14, 28);
  ctx.lineTo(-14, 28);
  ctx.lineTo(-24, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6fd1ff";
  ctx.fillRect(-9, -8, 18, 14);
  ctx.strokeStyle = "#eef3f7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-13, 24);
  ctx.lineTo(-28, 36);
  ctx.moveTo(13, 24);
  ctx.lineTo(28, 36);
  ctx.stroke();
  if (state.controls.has("arrowup") || state.controls.has("w") || state.controls.has(" ")) {
    ctx.fillStyle = "#ff7b6e";
    ctx.beginPath();
    ctx.moveTo(-8, 28);
    ctx.lineTo(0, 46 + Math.sin(world.time * 20) * 5);
    ctx.lineTo(8, 28);
    ctx.fill();
  }
  ctx.restore();

  drawVelocityArrow(p.x, p.y, p.vx, p.vy);
}

function drawVelocityArrow(x, y, vx, vy) {
  const mag = Math.hypot(vx, vy);
  if (mag < 4) return;
  const scale = clamp(mag / 4, 10, 70) / mag;
  ctx.strokeStyle = "#66d19e";
  ctx.fillStyle = "#66d19e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + vx * scale, y + vy * scale);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + vx * scale, y + vy * scale, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawOverlay() {
  ctx.fillStyle = "rgba(7, 16, 19, 0.72)";
  ctx.fillRect(18, 18, 280, 72);
  ctx.fillStyle = "#eef3f7";
  ctx.font = "700 18px Segoe UI, Arial";
  ctx.fillText(state.scenario === "rescue" ? "Astronaut rescue" : "Lunar lander", 34, 45);
  ctx.font = "13px Segoe UI, Arial";
  ctx.fillStyle = "#b9c9ce";
  const text = state.scenario === "rescue"
    ? "Arrows/WASD throw rocks for thrust"
    : "Up/WASD fires thrusters";
  ctx.fillText(text, 34, 68);
}

function drawGauges() {
  drawGauge(gaugeCanvases.vy, state.history.vy, "#6fd1ff");
  drawGauge(gaugeCanvases.height, state.history.height, "#f2c94c");
  drawGauge(gaugeCanvases.fuel, state.history.fuel, "#66d19e");
}

function drawGauge(gauge, values, color) {
  const g = gauge.getContext("2d");
  const w = gauge.width;
  const h = gauge.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#071013";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#243238";
  g.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    g.beginPath();
    g.moveTo(0, (h / 4) * i);
    g.lineTo(w, (h / 4) * i);
    g.stroke();
  }
  if (values.length < 2) return;
  const scale = setting("gauges", "graphScale");
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, (max - min) / scale);
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  values.forEach((value, i) => {
    const x = (i / 89) * w;
    const y = h - ((value - min) / span) * h;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  g.stroke();
}

function rescueGoal() {
  if (state.phase === 1) return "Reach the ship by throwing rocks.";
  if (state.phase === 2) return "Reach a moving ship before air runs out.";
  if (state.phase === 3) return "Tune rock mass, speed, and safe arrival.";
  return "Make the most economical rescue path.";
}

function landerGoal() {
  if (state.phase === 1) return "Inspect motion with the basic velocity gadgets.";
  if (state.phase === 2) return "Use gauges to read position and speed.";
  if (state.phase === 3) return "Land softly on the moon pad.";
  return "Record, replay, and trim an autopilot landing.";
}

function heightValue() {
  if (!world.player) return 0;
  return state.scenario === "lander"
    ? Math.max(0, canvas.height - 64 - world.player.y)
    : canvas.height - world.player.y;
}

function wrapPlayer(player) {
  player.x = clamp(player.x, 20, canvas.width - 20);
  player.y = clamp(player.y, 30, canvas.height - 30);
}

function isAttached(key) {
  return Boolean(attached[state.scenario][key]);
}

function setting(gadget, key) {
  return gadgetDefs[gadget].settings[key].value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fmt(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}
