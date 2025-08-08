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
    // fertile
    ctx.fillStyle = 'rgba(0,255,0,0.05)';
    ctx.fillRect(0, 0, third, canvas.height);
    // dry
    ctx.fillStyle = 'rgba(165, 42, 42,0.05)';
    ctx.fillRect(2 * third, 0, third, canvas.height);
    // toxic top
    ctx.fillStyle = 'rgba(255,0,0,0.08)';
    ctx.fillRect(0, 0, canvas.width, 50);
  }
  // Legend for zones
  function drawLegend() {
    const w = 110;
    const h = 60;
    const x = canvas.width - w - 10;
    const y = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, w, h);
    const labels = [
      { color: 'rgba(0,255,0,0.3)', text: 'Fertile' },
      { color: 'rgba(255,255,255,0.2)', text: 'Normal' },
      { color: 'rgba(165,42,42,0.3)', text: 'Dry' },
      { color: 'rgba(255,0,0,0.3)', text: 'Toxic' }
    ];
    for (let i = 0; i < labels.length; i++) {
      ctx.fillStyle = labels[i].color;
      ctx.fillRect(x + 6, y + 6 + i * 12, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(labels[i].text, x + 20, y + 15 + i * 12);
    }
  }
  // Graph of population histories
  function drawGraph() {
    const w = 180;
    const h = 50;
    const x = 10;
    const y = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, w, h);
    const maxVal = Math.max(1, ...histBees, ...histFlowers, ...histSpiders, ...histBirds);
    function drawSeries(arr, color) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const vx = x + (i / (historyLength - 1)) * w;
        const vy = y + h - (arr[i] / maxVal) * (h - 4) - 2;
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
      trails.push({ x: this.x, y: this.y, alpha: 1 });
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = '#ffc107';
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#000';
      ctx.arc(this.x - 1, this.y - 1, 1, 0, Math.PI * 2);
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
      ctx.beginPath();
      ctx.fillStyle = '#8d6e63';
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * 10, this.y + Math.sin(angle) * 10);
        ctx.strokeStyle = '#5d4037';
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
      ctx.beginPath();
      ctx.fillStyle = '#ab47bc';
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Plant flowers by clicking
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (flowers.length < MAX_FLOWERS) {
      flowers.push(new Flower(x, y));
    }
  });
  // Key controls
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'v') {
      if (viewMode === 'all') viewMode = 'bees';
      else if (viewMode === 'bees') viewMode = 'spiders';
      else if (viewMode === 'spiders') viewMode = 'flowers';
      else if (viewMode === 'flowers') viewMode = 'birds';
      else viewMode = 'all';
    } else if (key === 'f') {
      freezeSpiders = 300;
    } else if (key === 'p') {
      flowers.forEach((f) => {
        f.nectar = 10;
        f.pollination += 1;
      });
    } else if (key === 'b') {
      bees.forEach((b) => {
        b.x = Math.random() * canvas.width;
        b.y = Math.random() * canvas.height;
      });
    } else if (key === 'r') {
      restartSimulation();
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
    const text = 'Controls: F=Freeze spiders, P=Fertilise, B=Scatter, V=Views, R=Restart';
    const height = 16;
    const width = ctx.measureText(text).width + 10;
    const x = 10;
    const y = canvas.height - 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y - height + 4, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText(text, x + 5, y + 1);
  }
  // Main animation loop
  function animate() {
    time++;
    // Rain logic: periodic showers
    if (!rain.active && time % 600 === 0 && Math.random() < 0.2) {
      rain.active = true;
      rain.timer = 400;
    }
    if (rain.active) {
      rain.timer--;
      if (rain.timer <= 0) rain.active = false;
    }
    if (freezeSpiders > 0) freezeSpiders--;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawZones();
    if (isNight()) {
      ctx.fillStyle = 'rgba(20,20,40,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (rain.active) {
      ctx.fillStyle = 'rgba(120,170,255,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw hive
    ctx.beginPath();
    ctx.fillStyle = '#795548';
    ctx.arc(hive.x, hive.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // Update and draw flowers
    ctx.globalAlpha = alphaFor('flowers');
    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i];
      f.update();
      f.draw();
    }
    // Spawn spiders if below minimum
    if (spiders.length < MIN_SPIDERS && Math.random() < 0.01) {
      spiders.push(new Spider());
    }
    // Update and draw bees
    ctx.globalAlpha = alphaFor('bees');
    for (let i = 0; i < bees.length; i++) {
      const b = bees[i];
      b.update();
      b.draw();
    }
    // Update and draw spiders
    ctx.globalAlpha = alphaFor('spiders');
    for (let i = 0; i < spiders.length; i++) {
      const s = spiders[i];
      s.update();
      s.draw();
    }
    // Update and draw birds
    ctx.globalAlpha = alphaFor('birds');
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      b.update();
      b.draw();
    }
    ctx.globalAlpha = 1;
    // Update webs
    updateWebs();
    // Draw webs
    drawWebs();
    // Draw trails
    drawTrails();
    // Record history for graph
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
    // Compute balance conditions
    const withinRange = (
      bees.length >= 10 && bees.length <= MAX_BEES &&
      flowers.length >= 5 && flowers.length <= MAX_FLOWERS &&
      spiders.length >= 2 && spiders.length <= 8 &&
      birds.length >= 1 && birds.length <= 4
    );
    if (withinRange) balanceCounter++;
    else balanceCounter = 0;
    if (balanceCounter >= GOAL_FRAMES) goalReached = true;
    // Draw overlay with counts
    const overlayWidth = 220;
    const overlayHeight = goalReached ? 130 : 110;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, 10, overlayWidth, overlayHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Bees: ${bees.length}`, 18, 30);
    ctx.fillText(`Flowers: ${flowers.length}`, 18, 45);
    ctx.fillText(`Spiders: ${spiders.length}`, 18, 60);
    ctx.fillText(`Birds: ${birds.length}`, 18, 75);
    // Progress bar
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText('Goal progress', 18, 90);
    const barX = 18;
    const barY = 95;
    const barWidth = 180;
    const barHeight = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    const progressRatio = Math.min(balanceCounter / GOAL_FRAMES, 1);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * progressRatio, barHeight - 2);
    if (goalReached) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = '16px sans-serif';
      ctx.fillText('Balanced Ecosystem!', 18, overlayHeight - 10);
    }
    // Draw legend and graph
    drawLegend();
    drawGraph();
    // Draw control legend
    drawControls();
    requestAnimationFrame(animate);
  }
  // Start simulation
  restartSimulation();
  animate();
})();