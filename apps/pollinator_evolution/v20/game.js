(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  // Modal handlers
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => (aboutModal.style.display = 'flex'));
    aboutClose.addEventListener('click', () => (aboutModal.style.display = 'none'));
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) aboutModal.style.display = 'none';
    });
  }
  // Entities and state
  const flowers = [];
  const bees = [];
  const spiders = [];
  const birds = [];
  const trails = [];
  const webs = [];
  const hive = { x: canvas.width / 2, y: canvas.height - 30 };
  let time = 0;
  const rain = { active: false, timer: 0 };
  const QUEEN_RADIUS = 120;
  const QUEEN_BOOST = 1.4;
  let viewMode = 'all';
  let freezeSpiders = 0;
  // Emergent goal variables
  let balanceCounter = 0;
  let goalReached = false;
  // Utility functions
  function isNight() { return (time % 600) >= 300; }
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
    if (y < 50) return 3;
    const third = canvas.width / 3;
    if (x < third) return 1;
    if (x < 2 * third) return 0;
    return 2;
  }
  // Keyboard for view and powers
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
    }
  });
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
          bees.push(new Bee());
        }
      } else {
        if (!this.target || Math.random() < 0.01 || this.target.nectar <= 0) {
          let best = null;
          let bestScore = Infinity;
          flowers.forEach((f) => {
            if (f.nectar <= 0 || f === this.lastVisited) return;
            const dx = f.x - this.x;
            const dy = f.y - this.y;
            const dist2 = dx * dx + dy * dy;
            let crowd = 0;
            for (let i = 0; i < bees.length; i++) {
              const b = bees[i];
              const ddx = b.x - f.x;
              const ddy = b.y - f.y;
              if (ddx * ddx + ddy * ddy < 900) crowd++;
            }
            const score = dist2 * (1 + crowd * 0.3);
            if (score < bestScore) {
              bestScore = score;
              best = f;
            }
          });
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
      // environmental modifiers
      let speedMod = 1;
      if (isNight()) speedMod *= 0.5;
      if (rain.active) speedMod *= 0.7;
      const zone = zoneAt(this.x, this.y);
      if (zone === 2) speedMod *= 0.8;
      if (zone === 1) speedMod *= 1.2;
      this.vx *= speedMod;
      this.vy *= speedMod;
      if (!this.returning) {
        const distH = Math.hypot(hive.x - this.x, hive.y - this.y);
        if (distH < QUEEN_RADIUS) {
          this.vx *= QUEEN_BOOST;
          this.vy *= QUEEN_BOOST;
        }
      }
      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = 2.5;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
      if (zoneAt(this.x, this.y) === 3) {
        this.x = hive.x;
        this.y = hive.y;
      }
      if (!this.returning && this.target) {
        const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (d < 8) {
          this.target.pollination++;
          this.target.nectar = Math.max(0, this.target.nectar - 1);
          this.lastVisited = this.target;
          this.target = null;
        }
      }
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
      if (zoneAt(this.x, this.y) === 3) {
        const idx = spiders.indexOf(this);
        if (idx >= 0) spiders.splice(idx, 1);
        return;
      }
      let nearest = null;
      let minDist = Infinity;
      bees.forEach((b) => {
        const dx = b.x - this.x;
        const dy = b.y - this.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = b;
        }
      });
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
    }
    update() {
      let nearest = null;
      let minDist = Infinity;
      spiders.forEach((s) => {
        const dx = s.x - this.x;
        const dy = s.y - this.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = s;
        }
      });
      if (nearest) {
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 1) {
          this.vx += (dx / d) * 0.05;
          this.vy += (dy / d) * 0.05;
        } else {
          const idx = spiders.indexOf(nearest);
          if (idx >= 0) spiders.splice(idx, 1);
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
  // Initialise population
  for (let i = 0; i < 6; i++) flowers.push(new Flower(Math.random() * canvas.width, Math.random() * canvas.height));
  for (let i = 0; i < 20; i++) bees.push(new Bee());
  for (let i = 0; i < 3; i++) spiders.push(new Spider());
  for (let i = 0; i < 2; i++) birds.push(new Bird());
  // Add flowers on click
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flowers.push(new Flower(x, y));
  });
  // Draw zones backgrounds
  function drawZones() {
    const third = canvas.width / 3;
    ctx.fillStyle = 'rgba(0,255,0,0.05)';
    ctx.fillRect(0, 0, third, canvas.height);
    ctx.fillStyle = 'rgba(165, 42, 42,0.05)';
    ctx.fillRect(2 * third, 0, third, canvas.height);
    ctx.fillStyle = 'rgba(255,0,0,0.08)';
    ctx.fillRect(0, 0, canvas.width, 50);
  }
  function animate() {
    time++;
    // Rain logic
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
    // Hive
    ctx.beginPath();
    ctx.fillStyle = '#795548';
    ctx.arc(hive.x, hive.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // Update and draw groups
    ctx.globalAlpha = alphaFor('flowers');
    flowers.forEach((f) => {
      f.update();
      f.draw();
    });
    ctx.globalAlpha = alphaFor('bees');
    bees.forEach((b) => {
      b.update();
      b.draw();
    });
    ctx.globalAlpha = alphaFor('spiders');
    spiders.forEach((s) => {
      s.update();
      s.draw();
    });
    ctx.globalAlpha = alphaFor('birds');
    birds.forEach((b) => {
      b.update();
      b.draw();
    });
    ctx.globalAlpha = 1;
    // Webs
    for (let i = webs.length - 1; i >= 0; i--) {
      const web = webs[i];
      web.life--;
      if (web.life <= 0) {
        webs.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = 'rgba(120,120,120,0.4)';
      ctx.lineWidth = 1;
      for (let r = 4; r <= 12; r += 4) {
        ctx.beginPath();
        ctx.arc(web.x, web.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Trails
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.alpha -= 0.01;
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
    // Balance meter and goal
    const countBees = bees.length;
    const countSpiders = spiders.length;
    const countBirds = birds.length;
    const countFlowers = flowers.length;
    const withinRange = (
      countBees >= 15 && countBees <= 40 &&
      countFlowers >= 10 && countFlowers <= 60 &&
      countSpiders >= 1 && countSpiders <= 12 &&
      countBirds >= 1 && countBirds <= 5
    );
    if (withinRange) balanceCounter++;
    else balanceCounter = 0;
    if (balanceCounter >= 900) goalReached = true;
    const meterWidth = 180;
    const meterHeight = goalReached ? 100 : 80;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, meterWidth, meterHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Bees: ${countBees}`, 18, 30);
    ctx.fillText(`Flowers: ${countFlowers}`, 18, 45);
    ctx.fillText(`Spiders: ${countSpiders}`, 18, 60);
    ctx.fillText(`Birds: ${countBirds}`, 18, 75);
    if (goalReached) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = '16px sans-serif';
      ctx.fillText('Balanced Ecosystem!', 18, 93);
    }
    requestAnimationFrame(animate);
  }
  animate();
})();