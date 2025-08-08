(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const laneCount = 5;
  const laneHeight = canvas.height / laneCount;
  const cars = [];
  const obstacles = [];

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
    if (e.target === aboutModal) aboutModal.style.display = 'none';
  });

  // Car class
  class Car {
    constructor(lane) {
      this.lane = lane;
      this.y = lane * laneHeight + laneHeight * 0.5;
      this.x = Math.random() * canvas.width;
      this.speed = 1 + Math.random() * 2;
      this.width = 20;
      this.height = laneHeight * 0.6;
      this.color = `hsl(${Math.random() * 360}, 60%, 60%)`;
    }
    update() {
      // Determine if path ahead is blocked
      const aheadX = this.x + this.speed;
      let blocked = false;
      // check obstacles
      for (const obs of obstacles) {
        if (obs.lane === this.lane) {
          if (aheadX + this.width > obs.x && this.x < obs.x + obs.w) {
            blocked = true;
            break;
          }
        }
      }
      // check other cars
      if (!blocked) {
        for (const other of cars) {
          if (other !== this && other.lane === this.lane) {
            if (other.x > this.x && other.x - (this.x + this.width) < 30) {
              blocked = true;
              break;
            }
          }
        }
      }
      if (blocked) {
        // try to change lane upward then downward
        const tryLanes = [this.lane - 1, this.lane + 1];
        let moved = false;
        for (const nl of tryLanes) {
          if (nl >= 0 && nl < laneCount) {
            // check if lane is clear
            let laneClear = true;
            for (const obs of obstacles) {
              if (obs.lane === nl) {
                if (this.x + this.width > obs.x - 10 && this.x < obs.x + obs.w + 10) {
                  laneClear = false;
                  break;
                }
              }
            }
            if (laneClear) {
              for (const other of cars) {
                if (other.lane === nl) {
                  if (Math.abs(other.x - this.x) < 30) {
                    laneClear = false;
                    break;
                  }
                }
              }
            }
            if (laneClear) {
              this.lane = nl;
              this.y = this.lane * laneHeight + laneHeight * 0.5;
              moved = true;
              break;
            }
          }
        }
        if (!moved) {
          // slow down
          this.x += this.speed * 0.2;
        }
      } else {
        this.x += this.speed;
      }
      if (this.x > canvas.width + 50) {
        this.x = -50;
        this.speed = 1 + Math.random() * 2;
      }
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
    }
  }

  // Initialize cars
  for (let lane = 0; lane < laneCount; lane++) {
    for (let i = 0; i < 6; i++) {
      cars.push(new Car(lane));
    }
  }

  // Handle clicks to place obstacles
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lane = Math.floor(y / laneHeight);
    obstacles.push({ x: x, lane: lane, w: 20, h: laneHeight });
  });

  function drawLanes() {
    ctx.strokeStyle = '#bbb';
    for (let i = 1; i < laneCount; i++) {
      const y = i * laneHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLanes();
    // draw obstacles
    for (const obs of obstacles) {
      ctx.fillStyle = '#9c27b0';
      ctx.fillRect(obs.x, obs.lane * laneHeight + laneHeight * 0.1, obs.w, laneHeight * 0.8);
    }
    cars.forEach((car) => {
      car.update();
      car.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();