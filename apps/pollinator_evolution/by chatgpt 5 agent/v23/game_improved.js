(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  // Modal handlers
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  const restartBtn = document.getElementById('restartBtn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      aboutModal.style.display = 'flex';
    });
    aboutClose.addEventListener('click', () => {
      aboutModal.style.display = 'none';
    });
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) aboutModal.style.display = 'none';
    });
  }
  // Entity arrays and state
  const flowers = [];
  const bees = [];
  const spiders = [];
  const birds = [];
  const trails = [];
  const webs = [];
  const hive = { x: canvas.width / 2, y: canvas.height - 30 };
  // Limits and thresholds
  const MAX_FLOWERS = 80;
  const MAX_BEES = 40;
  const MIN_SPIDERS = 2;
  const GOAL_FRAMES = 600; // frames required for balanced goal
  // Environmental state
  let time = 0;
  const rain = { active: false, timer: 0 };
  let freezeSpiders = 0;
  let viewMode = 'all';
  let balanceCounter = 0;
  let goalReached = false;

  // -------------------------------------------------------------------------
  // Extended feature state
  //
  // The original game did not include pause/resume, adjustable speed,
  // raindrop particles or toggles for zone and trail display. To support
  // these improvements we define a handful of additional global variables.  
  // They are declared here so that they exist before any of the simulation
  // functions run and can be reset in restartSimulation().
  //
  // `paused` tracks whether the simulation is currently paused via the
  // spacebar. `speedMultiplier` controls how many simulation steps run per
  // animation frame (between 0.25× and 4×). `speedAccumulator` is used by
  // animate() to accumulate fractional steps. `beepPlayed` prevents the
  // victory sound from playing repeatedly once the goal is reached.  
  // `showZones` and `showTrails` allow the player to toggle background
  // zones and pollen trails on and off. `raindrops` holds an array of
  // raindrop particles that are drawn while rain is active. `audioCtx` is
  // a reference to the Web Audio API context used by playBeep().
  let paused = false;
  let speedMultiplier = 1;
  let speedAccumulator = 0;
  let beepPlayed = false;
  let showZones = true;
  let showTrails = true;
  let raindrops = [];
  let audioCtx = null;
  // History for graph
  const historyLength = 120;
  const histBees = [];
  const histFlowers = [];
  const histSpiders = [];
  const histBirds = [];
  // Utility functions
  function isNight() {
    return (time % 600) >= 300;
  }
  function traitToColor(trait) {
    const r1 = 255, g1 = 202, b1 = 40;
    const r2 = 66, g2 = 165, b2 = 245;
    const ratio = Math.min(1, Math.max(0, (trait - 0.05) / 0.25));
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  }
  function alphaFor(type) {
    if (viewMode === 'all') return 1;
    return viewMode === type ? 1 : 0.15;
  }
  function zoneAt(x, y) {
    // 0 normal, 1 fertile, 2 dry, 3 toxic
    if (y < 50) return 3;
    const third = canvas.width / 3;
    if (x < third) return 1;
    if (x < 2 * third) return 0;
    return 2;
  }
  // Draw environmental zones backgrounds
  function drawZones() {
    const third = canvas.width / 3;
    // fertile zone: soft green tint
    ctx.fillStyle = 'rgba(76, 175, 80, 0.06)';
    ctx.fillRect(0, 0, third, canvas.height);
    // dry zone: warm amber tint
    ctx.fillStyle = 'rgba(255, 193, 7, 0.06)';
    ctx.fillRect(2 * third, 0, third, canvas.height);
    // toxic zone at top: light red tint
    ctx.fillStyle = 'rgba(244, 67, 54, 0.08)';
    ctx.fillRect(0, 0, canvas.width, 50);
  }
  // Legend for zones
  function drawLegend() {
    // Slightly larger legend with improved colours and spacing
    const w = 130;
    const h = 72;
    const x = canvas.width - w - 12;
    const y = 12;
    ctx.fillStyle = 'rgba(33, 33, 33, 0.7)';
    ctx.fillRect(x, y, w, h);
    const labels = [
      { color: 'rgba(76,175,80,0.3)', text: 'Fertile' },
      { color: 'rgba(200,200,200,0.2)', text: 'Normal' },
      { color: 'rgba(255,193,7,0.3)', text: 'Dry' },
      { color: 'rgba(244,67,54,0.3)', text: 'Toxic' }
    ];
    for (let i = 0; i < labels.length; i++) {
      // coloured swatch
      ctx.fillStyle = labels[i].color;
      ctx.fillRect(x + 8, y + 8 + i * 16, 12, 12);
      // label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(labels[i].text, x + 26, y + 18 + i * 16);
    }
  }
  // Graph of population histories
  function drawGraph() {
    // Determine position based on overlay height so the graph sits below the info panel
    const overlayH = goalReached ? 180 : 160;
    const x = 12;
    const y = overlayH + 24;
    const w = 240;
    const h = 60;
    // background panel for the graph
    ctx.fillStyle = 'rgba(33, 33, 33, 0.75)';
    ctx.fillRect(x, y, w, h);
    // border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(x, y, w, h);
    const maxVal = Math.max(1, ...histBees, ...histFlowers, ...histSpiders, ...histBirds);
    function drawSeries(arr, color) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const vx = x + (i / (historyLength - 1)) * w;
        const vy = y + h - (arr[i] / maxVal) * (h - 6) - 3;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
    drawSeries(histBees, '#ffc107');
    drawSeries(histFlowers, '#8bc34a');
    drawSeries(histSpiders, '#795548');
    drawSeries(histBirds, '#ab47bc');
  }
  // Restart simulation
  function restartSimulation() {
    flowers.length = 0;
    bees.length = 0;
    spiders.length = 0;
    birds.length = 0;
    trails.length = 0;
    webs.length = 0;
    histBees.length = 0;
    histFlowers.length = 0;
    histSpiders.length = 0;
    histBirds.length = 0;
    balanceCounter = 0;
    goalReached = false;
    time = 0;
    freezeSpiders = 0;
    // reset extended feature state
    paused = false;
    speedMultiplier = 1;
    speedAccumulator = 0;
    beepPlayed = false;
    showZones = true;
    showTrails = true;
    raindrops.length = 0;
    // initial population (reduced bees to promote balance)
    for (let i = 0; i < 6; i++) {
      flowers.push(new Flower(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    for (let i = 0; i < 15; i++) {
      bees.push(new Bee());
    }
    for (let i = 0; i < 3; i++) {
      spiders.push(new Spider());
    }
    for (let i = 0; i < 2; i++) {
      birds.push(new Bird());
    }
  }
  if (restartBtn) {
    restartBtn.addEventListener('click', restartSimulation);
  }
  // Classes
  class Flower {
    constructor(x, y, trait, size) {
      this.x = x;
      this.y = y;
      this.trait = typeof trait === 'number' ? trait : 0.1 + Math.random() * 0.15;
      this.size = typeof size === 'number' ? size : 5 + Math.random() * 2;
      this.pollination = 0;
      this.nectar = 10;
    }
    update() {
      let regen = this.trait;
      if (rain.active) regen += 0.3;
      const zone = zoneAt(this.x, this.y);
      if (zone === 1) regen *= 1.5;
      if (zone === 2) regen *= 0.5;
      this.nectar = Math.min(this.nectar + regen, 10);
      if (this.pollination >= 5) {
        this.pollination = 0;
        if (flowers.length < MAX_FLOWERS) {
          // local density check: count flowers within 30px
          let nearby = 0;
          for (let i = 0; i < flowers.length; i++) {
            const f = flowers[i];
            const dx = f.x - this.x;
            const dy = f.y - this.y;
            if (dx * dx + dy * dy < 900) nearby++;
          }
          if (nearby < 6) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 30;
            const nx = Math.max(10, Math.min(canvas.width - 10, this.x + Math.cos(angle) * dist));
            const ny = Math.max(10, Math.min(canvas.height - 10, this.y + Math.sin(angle) * dist));
            let newTrait = this.trait + (Math.random() - 0.5) * 0.05;
            newTrait = Math.max(0.05, Math.min(0.3, newTrait));
            let newSize = this.size + (Math.random() - 0.5) * 1.5;
            newSize = Math.max(4, Math.min(8, newSize));
            flowers.push(new Flower(nx, ny, newTrait, newSize));
          }
        }
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = traitToColor(this.trait);
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#6d4c41';
      ctx.arc(this.x, this.y, this.size * 0.33, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  class Bee {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.target = null;
      this.lastVisited = null;
      this.age = 0;
      this.returning = false;
    }
    update() {
      this.age++;
      // decide to return every 600 frames
      if (!this.returning && this.age % 600 === 0) {
        this.returning = true;
      }
      if (this.returning) {
        const dx = hive.x - this.x;
        const dy = hive.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 1) {
          this.vx += (dx / d) * 0.05;
          this.vy += (dy / d) * 0.05;
        } else {
          this.returning = false;
          this.age = 0;
          if (bees.length < MAX_BEES) {
            bees.push(new Bee());
          }
        }
      } else {
        // choose a target flower based on distance and crowding
        if (!this.target || Math.random() < 0.01 || this.target.nectar <= 0) {
          let best = null;
          let bestScore = Infinity;
          for (let i = 0; i < flowers.length; i++) {
            const f = flowers[i];
            if (f.nectar <= 0 || f === this.lastVisited) continue;
            const dx = f.x - this.x;
            const dy = f.y - this.y;
            const dist2 = dx * dx + dy * dy;
            let crowd = 0;
            for (let j = 0; j < bees.length; j++) {
              const b = bees[j];
              const ddx = b.x - f.x;
              const ddy = b.y - f.y;
              if (ddx * ddx + ddy * ddy < 900) crowd++;
            }
            const score = dist2 * (1 + crowd * 0.3);
            if (score < bestScore) {
              bestScore = score;
              best = f;
            }
          }
          this.target = best;
        }
        if (this.target) {
          const dx = this.target.x - this.x;
          const dy = this.target.y - this.y;
          const d = Math.hypot(dx, dy);
          if (d > 1) {
            this.vx += (dx / d) * 0.05;
            this.vy += (dy / d) * 0.05;
          }
        }
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
      }
      // apply environmental modifiers
      let speedMod = 1;
      if (isNight()) speedMod *= 0.5;
      if (rain.active) speedMod *= 0.7;
      const zone = zoneAt(this.x, this.y);
      if (zone === 2) speedMod *= 0.8;
      if (zone === 1) speedMod *= 1.2;
      this.vx *= speedMod;
      this.vy *= speedMod;
      // queen boost
      if (!this.returning) {
        const distH = Math.hypot(hive.x - this.x, hive.y - this.y);
        if (distH < 120) {
          this.vx *= 1.4;
          this.vy *= 1.4;
        }
      }
      // limit speed
      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = 2.5;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
      this.x += this.vx;
      this.y += this.vy;
      // wrap around
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
      // toxic zone resets bees to hive
      if (zoneAt(this.x, this.y) === 3) {
        this.x = hive.x;
        this.y = hive.y;
      }
      // pollination
      if (!this.returning && this.target) {
        const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (d < 8) {
          this.target.pollination++;
          this.target.nectar = Math.max(0, this.target.nectar - 1);
          this.lastVisited = this.target;
          this.target = null;
        }
      }
      // webs trap bees
      for (let i = 0; i < webs.length; i++) {
        const web = webs[i];
        const dist = Math.hypot(web.x - this.x, web.y - this.y);
        if (dist < 12) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          webs.splice(i, 1);
          break;
        }
      }
      // leave a pollen trail only if trails are enabled
      if (showTrails) {
        trails.push({ x: this.x, y: this.y, alpha: 1 });
      }
    }
    draw() {
      // Draw a more bee‑like body using an oval, stripes and wings
      const bodyW = 5;
      const bodyH = 3.5;
      // wings (semi‑transparent ellipses)
      ctx.fillStyle = 'rgba(200,220,255,0.6)';
      ctx.beginPath();
      ctx.ellipse(this.x - bodyW * 0.4, this.y - bodyH * 0.8, bodyW * 0.6, bodyH * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.x + bodyW * 0.4, this.y - bodyH * 0.8, bodyW * 0.6, bodyH * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, bodyW, bodyH, 0, 0, Math.PI * 2);
      ctx.fill();
      // stripes on the body
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) {
        const stripeX = this.x - bodyW + (i * bodyW * 1.0);
        ctx.beginPath();
        ctx.moveTo(stripeX, this.y - bodyH);
        ctx.lineTo(stripeX, this.y + bodyH);
        ctx.stroke();
      }
      // head as a small dark circle
      ctx.fillStyle = '#424242';
      ctx.beginPath();
      ctx.arc(this.x + bodyW * 0.9, this.y, bodyH * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  class Spider {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }
    update() {
      if (freezeSpiders > 0) return;
      // remove if in toxic zone
      if (zoneAt(this.x, this.y) === 3) {
        const idx = spiders.indexOf(this);
        if (idx >= 0) spiders.splice(idx, 1);
        return;
      }
      let nearest = null;
      let minDist = Infinity;
      for (let i = 0; i < bees.length; i++) {
        const b = bees[i];
        const dx = b.x - this.x;
        const dy = b.y - this.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = b;
        }
      }
      if (nearest) {
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const d = Math.hypot(dx, dy);
        let speedFactor = isNight() ? 2.0 : 1.5;
        if (rain.active) speedFactor *= 0.7;
        const zone = zoneAt(this.x, this.y);
        if (zone === 2) speedFactor *= 0.8;
        if (zone === 1) speedFactor *= 1.2;
        if (d > 1) {
          this.x += (dx / d) * speedFactor;
          this.y += (dy / d) * speedFactor;
        }
        if (d < 6) {
          nearest.x = Math.random() * canvas.width;
          nearest.y = Math.random() * canvas.height;
        }
      }
      // occasionally drop webs
      if (Math.random() < 0.005) {
        webs.push({ x: this.x, y: this.y, life: 600 });
      }
    }
    draw() {
      // Draw the spider as a body with eight legs
      const bodyR = 4;
      // body
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.arc(this.x, this.y, bodyR, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const inner = bodyR;
        const outer = bodyR + 6;
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(angle) * inner, this.y + Math.sin(angle) * inner);
        ctx.lineTo(this.x + Math.cos(angle) * outer, this.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    }
  }
  class Bird {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.cooldown = 0;
    }
    update() {
      if (this.cooldown > 0) this.cooldown--;
      let nearest = null;
      let minDist = Infinity;
      for (let i = 0; i < spiders.length; i++) {
        const s = spiders[i];
        const dx = s.x - this.x;
        const dy = s.y - this.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = s;
        }
      }
      if (nearest) {
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 1) {
          this.vx += (dx / d) * 0.05;
          this.vy += (dy / d) * 0.05;
        } else if (this.cooldown === 0) {
          const idx = spiders.indexOf(nearest);
          if (idx >= 0) spiders.splice(idx, 1);
          this.cooldown = 100; // wait before next kill
        }
      }
      this.vx += (Math.random() - 0.5) * 0.05;
      this.vy += (Math.random() - 0.5) * 0.05;
      const speed = Math.hypot(this.vx, this.vy);
      const max = 2;
      if (speed > max) {
        this.vx = (this.vx / speed) * max;
        this.vy = (this.vy / speed) * max;
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    draw() {
      // Draw a stylised bird with body, wing and beak
      const bodyR = 5;
      // main body as an oval
      ctx.fillStyle = '#ab47bc';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, bodyR, bodyR * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // wing as a lighter triangle on the left
      ctx.fillStyle = '#ba68c8';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - bodyR, this.y);
      ctx.lineTo(this.x - bodyR * 0.5, this.y - bodyR);
      ctx.closePath();
      ctx.fill();
      // beak as a small yellow triangle on the right
      ctx.fillStyle = '#ffca28';
      ctx.beginPath();
      ctx.moveTo(this.x + bodyR, this.y);
      ctx.lineTo(this.x + bodyR + 3, this.y - 2);
      ctx.lineTo(this.x + bodyR + 3, this.y + 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Plant flowers by clicking
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // If shift is held, plant a cluster of flowers around the click
    if (e.shiftKey) {
      const clusterCount = 5;
      for (let i = 0; i < clusterCount && flowers.length < MAX_FLOWERS; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 30;
        const nx = Math.max(10, Math.min(canvas.width - 10, x + Math.cos(angle) * dist));
        const ny = Math.max(10, Math.min(canvas.height - 10, y + Math.sin(angle) * dist));
        flowers.push(new Flower(nx, ny));
      }
    } else {
      // normal single flower planting
      if (flowers.length < MAX_FLOWERS) {
        flowers.push(new Flower(x, y));
      }
    }
  });
  // Remove flowers by right‑clicking near them
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let closestIndex = -1;
    let minDistSq = Infinity;
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];
      const dx = f.x - x;
      const dy = f.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq && distSq < 400) {
        minDistSq = distSq;
        closestIndex = i;
      }
    }
    if (closestIndex >= 0) {
      flowers.splice(closestIndex, 1);
    }
  });
  // Key controls
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'v') {
      // cycle through view modes
      if (viewMode === 'all') viewMode = 'bees';
      else if (viewMode === 'bees') viewMode = 'spiders';
      else if (viewMode === 'spiders') viewMode = 'flowers';
      else if (viewMode === 'flowers') viewMode = 'birds';
      else viewMode = 'all';
    } else if (key === 'f') {
      // freeze spiders and play feedback beep
      freezeSpiders = 300;
      playBeep(550, 0.25, 0.3);
    } else if (key === 'p') {
      // fertilise all flowers
      flowers.forEach((f) => {
        f.nectar = 10;
        f.pollination += 1;
      });
    } else if (key === 'b') {
      // scatter bees randomly
      bees.forEach((b) => {
        b.x = Math.random() * canvas.width;
        b.y = Math.random() * canvas.height;
      });
    } else if (key === 'r') {
      // restart simulation
      restartSimulation();
    } else if (key === ' ') {
      // pause or resume simulation
      paused = !paused;
    } else if (key === '+' || key === '=') {
      // increase simulation speed up to 4x
      speedMultiplier = Math.min(4, speedMultiplier * 2);
    } else if (key === '-' || key === '_') {
      // decrease simulation speed down to 0.25x
      speedMultiplier = Math.max(0.25, speedMultiplier / 2);
    } else if (key === 'z') {
      // toggle zone overlay
      showZones = !showZones;
    } else if (key === 't') {
      // toggle trails rendering
      showTrails = !showTrails;
    } else if (key === 'w') {
      // manually trigger rain
      rain.active = true;
      rain.timer = 400;
    }
  });
  // Web life update
  function updateWebs() {
    for (let i = webs.length - 1; i >= 0; i--) {
      const web = webs[i];
      web.life--;
      if (web.life <= 0) {
        webs.splice(i, 1);
      }
    }
  }
  // Draw webs
  function drawWebs() {
    for (let i = webs.length - 1; i >= 0; i--) {
      const web = webs[i];
      ctx.strokeStyle = 'rgba(120,120,120,0.4)';
      ctx.lineWidth = 1;
      for (let r = 4; r <= 12; r += 4) {
        ctx.beginPath();
        ctx.arc(web.x, web.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  // Update and draw trails
  function drawTrails() {
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.alpha -= 0.02;
      if (t.alpha <= 0) {
        trails.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = '#fff59d';
      ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // limit total trail segments
    const MAX_TRAIL_SEGMENTS = 4000;
    if (trails.length > MAX_TRAIL_SEGMENTS) {
      trails.splice(0, trails.length - MAX_TRAIL_SEGMENTS);
    }
  }
  // Draw control legend
  function drawControls() {
    const text = 'Space Pause | +/- Speed | Z Zones | T Trails | W Rain | V Views | F Freeze | P Fertilise | B Scatter | R Restart';
    // Precalculate text width based on chosen font
    ctx.font = '12px sans-serif';
    const width = ctx.measureText(text).width + 16;
    const height = 20;
    const x = 12;
    const y = canvas.height - 24;
    // semi-transparent dark background
    ctx.fillStyle = 'rgba(33, 33, 33, 0.7)';
    ctx.fillRect(x, y - height + 6, width, height);
    // white text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x + 8, y + 2);
  }

  // Generate a simple beep using the Web Audio API. Called for events like freeze and reaching the goal.
  function playBeep(freq = 660, duration = 0.2, volume = 0.2) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      // ignore errors (for example, autoplay restrictions)
    }
  }

  // Perform one tick of simulation (update all entities and timers)
  function simulationStep() {
    // advance time
    time++;
    // periodic rain: 20% chance every 600 frames
    if (!rain.active && time % 600 === 0 && Math.random() < 0.2) {
      rain.active = true;
      rain.timer = 400;
    }
    // decrement rain timer
    if (rain.active) {
      rain.timer--;
      if (rain.timer <= 0) {
        rain.active = false;
      }
    }
    // update raindrop particles
    if (rain.active) {
      if (Math.random() < 0.5) {
        raindrops.push({ x: Math.random() * canvas.width, y: -10, len: 10 + Math.random() * 10, speed: 4 + Math.random() * 3 });
      }
      for (let i = raindrops.length - 1; i >= 0; i--) {
        const drop = raindrops[i];
        drop.y += drop.speed;
        if (drop.y > canvas.height + 20) {
          raindrops.splice(i, 1);
        }
      }
    } else {
      raindrops.length = 0;
    }
    // decrease spider freeze timer
    if (freezeSpiders > 0) freezeSpiders--;
    // update flowers
    for (let i = 0; i < flowers.length; i++) {
      flowers[i].update();
    }
    // spawn spiders if below minimum
    if (spiders.length < MIN_SPIDERS && Math.random() < 0.01) {
      spiders.push(new Spider());
    }
    // update bees
    for (let i = 0; i < bees.length; i++) {
      bees[i].update();
    }
    // update spiders
    for (let i = 0; i < spiders.length; i++) {
      spiders[i].update();
    }
    // update birds
    for (let i = 0; i < birds.length; i++) {
      birds[i].update();
    }
    // update webs life
    updateWebs();
    // fade trails and trim
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.alpha -= 0.02;
      if (t.alpha <= 0) {
        trails.splice(i, 1);
      }
    }
    const MAX_TRAIL_SEGMENTS = 4000;
    if (trails.length > MAX_TRAIL_SEGMENTS) {
      trails.splice(0, trails.length - MAX_TRAIL_SEGMENTS);
    }
    // record history
    histBees.push(bees.length);
    histFlowers.push(flowers.length);
    histSpiders.push(spiders.length);
    histBirds.push(birds.length);
    if (histBees.length > historyLength) {
      histBees.shift();
      histFlowers.shift();
      histSpiders.shift();
      histBirds.shift();
    }
    // update goal progress
    const withinRange = (
      bees.length >= 10 && bees.length <= MAX_BEES &&
      flowers.length >= 5 && flowers.length <= MAX_FLOWERS &&
      spiders.length >= 2 && spiders.length <= 8 &&
      birds.length >= 1 && birds.length <= 4
    );
    if (withinRange) {
      balanceCounter++;
    } else {
      balanceCounter = 0;
    }
    if (balanceCounter >= GOAL_FRAMES) {
      if (!goalReached) {
        goalReached = true;
        if (!beepPlayed) {
          playBeep(880, 0.4, 0.25);
          beepPlayed = true;
        }
      }
    } else {
      goalReached = false;
    }
  }

  // Render the current frame (draw entities, raindrops, overlays)
  function renderScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // zones
    if (showZones) {
      drawZones();
    }
    // night and rain overlays
    if (isNight()) {
      ctx.fillStyle = 'rgba(20,20,40,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (rain.active) {
      ctx.fillStyle = 'rgba(120,170,255,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // raindrops
    if (rain.active) {
      ctx.strokeStyle = 'rgba(100,150,255,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < raindrops.length; i++) {
        const d = raindrops[i];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.len);
        ctx.stroke();
      }
    }
    // hive
    ctx.beginPath();
    ctx.fillStyle = '#795548';
    ctx.arc(hive.x, hive.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // flowers
    ctx.globalAlpha = alphaFor('flowers');
    for (let i = 0; i < flowers.length; i++) {
      flowers[i].draw();
    }
    // bees
    ctx.globalAlpha = alphaFor('bees');
    for (let i = 0; i < bees.length; i++) {
      bees[i].draw();
    }
    // spiders
    ctx.globalAlpha = alphaFor('spiders');
    for (let i = 0; i < spiders.length; i++) {
      spiders[i].draw();
    }
    // birds
    ctx.globalAlpha = alphaFor('birds');
    for (let i = 0; i < birds.length; i++) {
      birds[i].draw();
    }
    ctx.globalAlpha = 1;
    // webs
    drawWebs();
    // trails
    if (showTrails) {
      for (let i = 0; i < trails.length; i++) {
        const t = trails[i];
        ctx.beginPath();
        ctx.globalAlpha = t.alpha;
        ctx.fillStyle = '#fff59d';
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // overlay: dark card summarising counts and progress
    const overlayWidth = 240;
    const overlayHeight = goalReached ? 180 : 160;
    // semi-transparent dark background for the overlay panel
    ctx.fillStyle = 'rgba(33, 33, 33, 0.75)';
    ctx.fillRect(12, 12, overlayWidth, overlayHeight);
    // counts with larger font
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    let yOff = 32;
    ctx.fillText(`Bees: ${bees.length}`, 20, yOff);
    yOff += 20;
    ctx.fillText(`Flowers: ${flowers.length}`, 20, yOff);
    yOff += 20;
    ctx.fillText(`Spiders: ${spiders.length}`, 20, yOff);
    yOff += 20;
    ctx.fillText(`Birds: ${birds.length}`, 20, yOff);
    yOff += 20;
    ctx.fillText(`Webs: ${webs.length}`, 20, yOff);
    yOff += 20;
    ctx.fillText(`Speed: ${speedMultiplier.toFixed(2)}x`, 20, yOff);
    // progress label and bar
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Goal progress', 20, yOff + 24);
    const barX = 20;
    const barY = yOff + 28;
    const barW = 200;
    const barH = 10;
    // bar border
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    const ratio = Math.min(balanceCounter / GOAL_FRAMES, 1);
    // filled portion
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * ratio, barH - 2);
    // balanced message
    if (goalReached) {
      ctx.fillStyle = '#ffd54f';
      ctx.font = '18px sans-serif';
      ctx.fillText('Balanced Ecosystem!', 20, overlayHeight - 12);
    }
    // legend and graph
    if (showZones) {
      drawLegend();
    }
    drawGraph();
    // controls legend
    drawControls();
  }
  // Main animation loop
  function animate() {
    // advance simulation according to speed multiplier unless paused
    if (!paused) {
      speedAccumulator += speedMultiplier;
      while (speedAccumulator >= 1) {
        simulationStep();
        speedAccumulator -= 1;
      }
    }
    // render the current state every frame
    renderScene();
    requestAnimationFrame(animate);
  }
  // Start simulation
  restartSimulation();
  animate();
})();