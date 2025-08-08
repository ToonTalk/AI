(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const rows = 21; // must be odd
  const cols = 33; // must be odd
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;
  let maze = [];
  const bots = [];
  let useRightHand = true;

  // Modal handling
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  aboutBtn.addEventListener('click', () => (aboutModal.style.display = 'flex'));
  aboutClose.addEventListener('click', () => (aboutModal.style.display = 'none'));
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.style.display = 'none';
  });
  document.getElementById('toggleRule').addEventListener('click', () => {
    useRightHand = !useRightHand;
    document.getElementById('toggleRule').textContent = useRightHand ? 'Switch to Left‑Hand Rule' : 'Switch to Right‑Hand Rule';
  });

  // Maze generation using recursive backtracker
  function generateMaze() {
    maze = [];
    for (let r = 0; r < rows; r++) {
      maze[r] = [];
      for (let c = 0; c < cols; c++) {
        maze[r][c] = 1; // wall
      }
    }
    function carve(r, c) {
      maze[r][c] = 0;
      const dirs = [
        [0, 2],
        [0, -2],
        [2, 0],
        [-2, 0],
      ];
      // shuffle
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && maze[nr][nc] === 1) {
          maze[r + dr / 2][c + dc / 2] = 0;
          carve(nr, nc);
        }
      });
    }
    carve(1, 1);
    // ensure exit
    maze[rows - 2][cols - 2] = 0;
  }

  class Bot {
    constructor() {
      this.r = 1;
      this.c = 1;
      this.x = this.c * cellW + cellW / 2;
      this.y = this.r * cellH + cellH / 2;
      this.dir = 0; // 0 right, 1 down, 2 left, 3 up
      this.color = `hsl(${Math.random() * 360},70%,60%)`;
      this.path = [];
    }
    update() {
      // check if at cell centre
      const targetX = this.c * cellW + cellW / 2;
      const targetY = this.r * cellH + cellH / 2;
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        this.x += dx * 0.3;
        this.y += dy * 0.3;
      } else {
        // choose next cell by wall-following
        const order = useRightHand ? [1, 0, 3, 2] : [3, 0, 1, 2];
        // order is relative directions: right-turn, straight, left-turn, back
        let moved = false;
        for (const rel of order) {
          const ndir = (this.dir + rel) % 4;
          const [dr, dc] = directionVector(ndir);
          const nr = this.r + dr;
          const nc = this.c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0) {
            this.dir = ndir;
            this.r = nr;
            this.c = nc;
            this.path.push([this.x, this.y]);
            moved = true;
            break;
          }
        }
        if (!moved) {
          // stuck; random move to any open neighbour
          const candidates = [];
          for (let i = 0; i < 4; i++) {
            const [dr, dc] = directionVector(i);
            const nr = this.r + dr;
            const nc = this.c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0) {
              candidates.push({ nr, nc, dir: i });
            }
          }
          if (candidates.length > 0) {
            const choice = candidates[Math.floor(Math.random() * candidates.length)];
            this.dir = choice.dir;
            this.r = choice.nr;
            this.c = choice.nc;
          }
        }
      }
    }
    draw() {
      // draw trail faintly
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      let first = true;
      for (const [tx, ty] of this.path) {
        if (first) {
          ctx.moveTo(tx, ty);
          first = false;
        } else {
          ctx.lineTo(tx, ty);
        }
      }
      ctx.stroke();
      // draw bot
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, cellW * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function directionVector(dir) {
    switch (dir % 4) {
      case 0:
        return [0, 1]; // right
      case 1:
        return [1, 0]; // down
      case 2:
        return [0, -1]; // left
      case 3:
        return [-1, 0]; // up
    }
  }

  function drawMaze() {
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#263238';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (maze[r][c] === 1) {
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
    }
    // highlight exit
    ctx.fillStyle = '#a5d6a7';
    ctx.fillRect((cols - 2) * cellW, (rows - 2) * cellH, cellW, cellH);
  }

  function init() {
    generateMaze();
    bots.length = 0;
    for (let i = 0; i < 5; i++) {
      bots.push(new Bot());
    }
  }
  init();

  function animate() {
    drawMaze();
    bots.forEach((b) => {
      b.update();
      b.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();