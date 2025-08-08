(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  // Modal handling for About/Instructions
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

  // Simulation state
  const flowers = [];
  const bees = [];
  const spiders = [];
  const birds = [];
  const trails = [];
  const webs = [];

  const hive = { x: canvas.width / 2, y: canvas.height - 30 };
  let time = 0;
  const rain = { active: false, timer: 0 };

  // Queen influence constants
  const QUEEN_RADIUS = 120;
  const QUEEN_BOOST = 1.4;

  // Day/night helper
  function isNight() {
    return (time % 600) >= 300;
  }

  // Helper for colour interpolation based on trait (0.05–0.3)
  function traitToColor(trait) {
    const r1 = 255, g1 = 202, b1 = 40;
    const r2 = 66, g2 = 165, b2 = 245;
    const ratio = Math.min(1, Math.max(0, (trait - 0.05) / 0.25));
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
  }

  class Flower {
    constructor(x, y, trait) {
      this.x = x;
      this.y = y;
      this.trait = typeof trait === 'number' ? trait : 0.1 + Math.random() * 0.15;
      this.pollination = 0;
      this.nectar = 10;
    }
    update() {
      let regen = this.trait;
      if (rain.active) regen += 0.3;
      this.nectar = Math.min(this.nectar + regen, 10);
      if (this.pollination >= 5) {
        this.pollination = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 30;
        const nx = Math.max(10, Math.min(canvas.width - 10, this.x + Math.cos(angle) * dist));
        const ny = Math.max(10, Math.min(canvas.height - 10, this.y + Math.sin(angle) * dist));
        let newTrait = this.trait + (Math.random() - 0.5) * 0.05;
        newTrait = Math.max(0.05, Math.min(0.3, newTrait));
        flowers.push(new Flower(nx, ny, newTrait));
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = traitToColor(this.trait);
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#6d4c41';
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
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
          let nearest = null;
          let minDist = Infinity;
          flowers.forEach((f) => {
            if (f.nectar <= 0 || f === this.lastVisited) return;
            const dx = f.x - this.x;
            const dy = f.y - this.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
              minDist = dist;
              nearest = f;
            }
          });
          this.target = nearest;
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
      let speedMod = 1;
      if (isNight()) speedMod *= 0.5;
      if (rain.active) speedMod *= 0.7;
      this.vx *= speedMod;
      this.vy *= speedMod;
      // Queen influence: bees near hive get a boost
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

  // Initialize
  for (let i = 0; i < 6; i++) {
    flowers.push(new Flower(Math.random() * canvas.width, Math.random() * canvas.height));
  }
  for (let i = 0; i < 20; i++) {
    bees.push(new Bee());
  }
  for (let i = 0; i < 3; i++) {
    spiders.push(new Spider());
  }
  for (let i = 0; i < 2; i++) {
    birds.push(new Bird());
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flowers.push(new Flower(x, y));
  });

  function animate() {
    time++;
    if (!rain.active && time % 600 === 0 && Math.random() < 0.2) {
      rain.active = true;
      rain.timer = 400;
    }
    if (rain.active) {
      rain.timer--;
      if (rain.timer <= 0) rain.active = false;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isNight()) {
      ctx.fillStyle = 'rgba(20,20,40,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (rain.active) {
      ctx.fillStyle = 'rgba(120,170,255,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.beginPath();
    ctx.fillStyle = '#795548';
    ctx.arc(hive.x, hive.y, 10, 0, Math.PI * 2);
    ctx.fill();
    flowers.forEach((f) => {
      f.update();
      f.draw();
    });
    bees.forEach((b) => {
      b.update();
      b.draw();
    });
    spiders.forEach((s) => {
      s.update();
      s.draw();
    });
    birds.forEach((b) => {
      b.update();
      b.draw();
    });
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
    requestAnimationFrame(animate);
  }
  animate();
})();