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

  // Simulation entities
  const flowers = [];
  const bees = [];
  const spiders = [];
  const trails = [];
  const webs = [];
  const hive = { x: canvas.width / 2, y: canvas.height - 30 };
  let time = 0;

  function isNight() {
    return (time % 600) >= 300;
  }

  class Flower {
    constructor(x, y, type = null) {
      this.x = x;
      this.y = y;
      this.type = type !== null ? type : Math.random() < 0.5 ? 0 : 1;
      this.pollination = 0;
      this.nectar = 10;
    }
    update() {
      const baseRegen = this.type === 0 ? 0.2 : 0.05;
      this.nectar = Math.min(this.nectar + baseRegen, 10);
      if (this.pollination >= 5) {
        this.pollination = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 30;
        const nx = Math.max(10, Math.min(canvas.width - 10, this.x + Math.cos(angle) * dist));
        const ny = Math.max(10, Math.min(canvas.height - 10, this.y + Math.sin(angle) * dist));
        let newType = this.type;
        if (Math.random() < 0.1) newType = this.type === 0 ? 1 : 0;
        flowers.push(new Flower(nx, ny, newType));
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = this.type === 0 ? '#ffca28' : '#42a5f5';
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
      if (isNight()) {
        this.vx *= 0.5;
        this.vy *= 0.5;
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
      // Check collision with webs; if stuck, relocate bee and remove web
      for (let i = 0; i < webs.length; i++) {
        const web = webs[i];
        const dist = Math.hypot(web.x - this.x, web.y - this.y);
        if (dist < 12) {
          // bee gets trapped; relocate randomly and remove web
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          webs.splice(i, 1);
          break;
        }
      }
      // Leave pollen trail
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
        const speedFactor = isNight() ? 2.0 : 1.5;
        if (d > 1) {
          this.x += (dx / d) * speedFactor;
          this.y += (dy / d) * speedFactor;
        }
        if (d < 6) {
          nearest.x = Math.random() * canvas.width;
          nearest.y = Math.random() * canvas.height;
        }
      }
      // Occasionally spin a web
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

  // Initialize ecosystem
  for (let i = 0; i < 6; i++) {
    flowers.push(new Flower(Math.random() * canvas.width, Math.random() * canvas.height));
  }
  for (let i = 0; i < 20; i++) {
    bees.push(new Bee());
  }
  for (let i = 0; i < 3; i++) {
    spiders.push(new Spider());
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flowers.push(new Flower(x, y));
  });

  function animate() {
    time++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isNight()) {
      ctx.fillStyle = 'rgba(20,20,40,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw hive
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
    // Update and draw webs
    for (let i = webs.length - 1; i >= 0; i--) {
      const web = webs[i];
      web.life--;
      if (web.life <= 0) {
        webs.splice(i, 1);
        continue;
      }
      // Draw web as concentric circles
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(120,120,120,0.4)';
      ctx.lineWidth = 1;
      for (let r = 4; r <= 12; r += 4) {
        ctx.beginPath();
        ctx.arc(web.x, web.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Draw pollen trails
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