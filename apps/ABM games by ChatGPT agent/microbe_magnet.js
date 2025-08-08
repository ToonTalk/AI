(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');

  // Modal handling
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  aboutBtn.addEventListener('click', () => {
    aboutModal.style.display = 'flex';
  });
  aboutClose.addEventListener('click', () => {
    aboutModal.style.display = 'none';
  });
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      aboutModal.style.display = 'none';
    }
  });

  // Simulation variables
  const microbes = [];
  const maxMicrobes = 120;
  const magnet = { x: 0, y: 0, active: false };

  class Microbe {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      // random initial velocity
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = (Math.random() - 0.5) * 1;
      // reproduction timer in seconds
      this.timer = 5 + Math.random() * 5;
    }
    update(dt) {
      // attraction to magnet when active
      if (magnet.active) {
        const dx = magnet.x - this.x;
        const dy = magnet.y - this.y;
        this.vx += dx * 0.002;
        this.vy += dy * 0.002;
      }
      // friction
      this.vx *= 0.99;
      this.vy *= 0.99;
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;
      // bounce off walls
      if (this.x < 0) {
        this.x = 0;
        this.vx *= -1;
      }
      if (this.x > canvas.width) {
        this.x = canvas.width;
        this.vx *= -1;
      }
      if (this.y < 0) {
        this.y = 0;
        this.vy *= -1;
      }
      if (this.y > canvas.height) {
        this.y = canvas.height;
        this.vy *= -1;
      }
      // reproduction
      this.timer -= dt;
      if (this.timer <= 0 && microbes.length < maxMicrobes) {
        const offset = (Math.random() - 0.5) * 10;
        microbes.push(new Microbe(this.x + offset, this.y + offset));
        this.timer = 5 + Math.random() * 5;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.fillStyle = '#4caf50';
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize microbes
  for (let i = 0; i < 30; i++) {
    microbes.push(new Microbe(Math.random() * canvas.width, Math.random() * canvas.height));
  }

  // Mouse interaction
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    magnet.x = e.clientX - rect.left;
    magnet.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', () => {
    magnet.active = true;
  });
  window.addEventListener('mouseup', () => {
    magnet.active = false;
  });

  let lastTime = null;
  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    // update
    microbes.forEach((m) => m.update(dt));
    // draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    microbes.forEach((m) => m.draw());
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();