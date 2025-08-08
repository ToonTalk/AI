(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const animals = [];
  const cues = [];

  // Modal handling
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  aboutBtn.addEventListener('click', () => (aboutModal.style.display = 'flex'));
  aboutClose.addEventListener('click', () => (aboutModal.style.display = 'none'));
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.style.display = 'none';
  });

  class Animal {
    constructor() {
      this.x = Math.random() * 50; // start near left
      this.y = Math.random() * canvas.height;
      const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
      this.vx = 1.5 + Math.random() * 0.5;
      this.vy = Math.sin(angle) * 0.5;
      this.speed = 1.5;
    }
    update() {
      // noise
      this.vx += (Math.random() - 0.5) * 0.05;
      this.vy += (Math.random() - 0.5) * 0.05;
      // attract to cues
      cues.forEach((cue) => {
        const dx = cue.x - this.x;
        const dy = cue.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < cue.radius) {
          const influence = 1 - dist / cue.radius;
          this.vx += (dx / dist) * influence * 0.1;
          this.vy += (dy / dist) * influence * 0.1;
        }
      });
      // separation: avoid other animals
      let sepX = 0;
      let sepY = 0;
      let count = 0;
      animals.forEach((other) => {
        if (other !== this) {
          const dx = this.x - other.x;
          const dy = this.y - other.y;
          const d = Math.hypot(dx, dy);
          if (d < 20 && d > 0) {
            sepX += dx / d;
            sepY += dy / d;
            count++;
          }
        }
      });
      if (count > 0) {
        this.vx += (sepX / count) * 0.05;
        this.vy += (sepY / count) * 0.05;
      }
      // limit speed
      const speed = Math.hypot(this.vx, this.vy);
      const max = 2.5;
      if (speed > max) {
        this.vx = (this.vx / speed) * max;
        this.vy = (this.vy / speed) * max;
      }
      this.x += this.vx;
      this.y += this.vy;
      // bounce top/bottom
      if (this.y < 0) {
        this.y = 0;
        this.vy *= -1;
      }
      if (this.y > canvas.height) {
        this.y = canvas.height;
        this.vy *= -1;
      }
      // wrap around horizontally
      if (this.x > canvas.width + 20) {
        this.x = -20;
        this.y = Math.random() * canvas.height;
      }
    }
    draw() {
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  class Cue {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 80;
      this.fade = 1.0;
    }
    update() {
      this.fade -= 0.002;
    }
    draw() {
      if (this.fade > 0) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(33,150,243,${this.fade * 0.3})`;
        ctx.strokeStyle = `rgba(33,150,243,${this.fade})`;
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.radius * this.fade, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // spawn animals
  for (let i = 0; i < 40; i++) animals.push(new Animal());

  // add cue on click
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cues.push(new Cue(x, y));
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // update and draw cues
    for (let i = cues.length - 1; i >= 0; i--) {
      const cue = cues[i];
      cue.update();
      if (cue.fade <= 0) {
        cues.splice(i, 1);
      } else {
        cue.draw();
      }
    }
    // update and draw animals
    animals.forEach((a) => {
      a.update();
      a.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();