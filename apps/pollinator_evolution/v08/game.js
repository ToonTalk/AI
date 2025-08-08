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
  const hive = { x: canvas.width / 2, y: canvas.height - 30 };
  let time = 0;

  // Determine if it is currently night based on time
  function isNight() {
    return (time % 600) >= 300;
  }

  // Flower class with two types and nectar regeneration
  class Flower {
    constructor(x, y, type = null) {
      this.x = x;
      this.y = y;
      // Two flower types with different nectar regeneration rates
      this.type = type !== null ? type : Math.random() < 0.5 ? 0 : 1;
      this.pollination = 0;
      this.nectar = 10;
    }
    update() {
      // Type 0 regenerates faster than type 1
      const baseRegen = this.type === 0 ? 0.2 : 0.05;
      this.nectar = Math.min(this.nectar + baseRegen, 10);
      // When sufficiently pollinated, spawn a new flower nearby
      if (this.pollination >= 5) {
        this.pollination = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 30;
        const nx = Math.max(10, Math.min(canvas.width - 10, this.x + Math.cos(angle) * dist));
        const ny = Math.max(10, Math.min(canvas.height - 10, this.y + Math.sin(angle) * dist));
        // Small chance of mutating type during reproduction
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

  // Bee agents with memory, hive spawning and pollen trails
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
      // Periodically return to hive to spawn a new bee
      if (!this.returning && this.age % 600 === 0) {
        this.returning = true;
      }
      if (this.returning) {
        // Move towards the hive
        const dx = hive.x - this.x;
        const dy = hive.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 1) {
          this.vx += (dx / d) * 0.05;
          this.vy += (dy / d) * 0.05;
        } else {
          // Arrived at hive: spawn new bee and reset state
          this.returning = false;
          this.age = 0;
          bees.push(new Bee());
        }
      } else {
        // Seek nearest flower that still has nectar and is not the last visited
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
        // Move toward selected flower
        if (this.target) {
          const dx = this.target.x - this.x;
          const dy = this.target.y - this.y;
          const d = Math.hypot(dx, dy);
          if (d > 1) {
            this.vx += (dx / d) * 0.05;
            this.vy += (dy / d) * 0.05;
          }
        }
        // Random jitter to simulate erratic movement
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
      }
      // Bees move more slowly at night
      if (isNight()) {
        this.vx *= 0.5;
        this.vy *= 0.5;
      }
      // Limit speed to avoid runaway velocity
      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = 2.5;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
      this.x += this.vx;
      this.y += this.vy;
      // Wrap around canvas edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
      // Pollination upon reaching target flower
      if (!this.returning && this.target) {
        const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (d < 8) {
          this.target.pollination++;
          this.target.nectar = Math.max(0, this.target.nectar - 1);
          this.lastVisited = this.target;
          this.target = null;
        }
      }
      // Leave a pollen trail at current position
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

  // Spider predators
  class Spider {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }
    update() {
      // Seek nearest bee
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
        // Spiders move faster at night
        const speedFactor = isNight() ? 2.0 : 1.5;
        if (d > 1) {
          this.x += (dx / d) * speedFactor;
          this.y += (dy / d) * speedFactor;
        }
        // If spider catches a bee, relocate the bee elsewhere
        if (d < 6) {
          nearest.x = Math.random() * canvas.width;
          nearest.y = Math.random() * canvas.height;
        }
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

  // Initialize the ecosystem
  for (let i = 0; i < 6; i++) {
    flowers.push(new Flower(Math.random() * canvas.width, Math.random() * canvas.height));
  }
  for (let i = 0; i < 20; i++) {
    bees.push(new Bee());
  }
  for (let i = 0; i < 3; i++) {
    spiders.push(new Spider());
  }

  // Plant a flower on click
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    flowers.push(new Flower(x, y));
  });

  function animate() {
    time++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Night overlay
    if (isNight()) {
      ctx.fillStyle = 'rgba(20,20,40,0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw hive
    ctx.beginPath();
    ctx.fillStyle = '#795548';
    ctx.arc(hive.x, hive.y, 10, 0, Math.PI * 2);
    ctx.fill();
    // Update and draw flowers
    flowers.forEach((f) => {
      f.update();
      f.draw();
    });
    // Update bees and accumulate trails
    bees.forEach((b) => {
      b.update();
      b.draw();
    });
    // Update and draw spiders
    spiders.forEach((s) => {
      s.update();
      s.draw();
    });
    // Draw pollen trails: fade over time
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