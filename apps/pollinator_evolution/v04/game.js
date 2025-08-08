(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const flowers = [];
  const bees = [];
  const spiders = [];

  class Flower {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.pollination = 0;
      this.nectar = 10;
    }
    update() {
      // faster nectar regeneration
      this.nectar = Math.min(this.nectar + 0.2, 10);
      if (this.pollination >= 5) {
        this.pollination = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 30;
        const nx = Math.max(10, Math.min(canvas.width - 10, this.x + Math.cos(angle) * dist));
        const ny = Math.max(10, Math.min(canvas.height - 10, this.y + Math.sin(angle) * dist));
        flowers.push(new Flower(nx, ny));
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = '#ffca28';
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
    }
    update() {
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
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > 2.5) {
        this.vx = (this.vx / speed) * 2.5;
        this.vy = (this.vy / speed) * 2.5;
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
      if (this.target) {
        const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (d < 8) {
          this.target.pollination++;
          this.target.nectar = Math.max(0, this.target.nectar - 1);
          this.lastVisited = this.target;
          this.target = null;
        }
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = '#ffc107';
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
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
        if (d > 1) {
          this.x += (dx / d) * 1.5;
          this.y += (dy / d) * 1.5;
        }
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

  for (let i = 0; i < 6; i++) flowers.push(new Flower(Math.random() * canvas.width, Math.random() * canvas.height));
  for (let i = 0; i < 20; i++) bees.push(new Bee());
  for (let i = 0; i < 3; i++) spiders.push(new Spider());

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    flowers.push(new Flower(e.clientX - rect.left, e.clientY - rect.top));
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    requestAnimationFrame(animate);
  }
  animate();
})();
