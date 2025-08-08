(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const nodeCount = 40;
  const nodes = [];
  const edges = [];
  const radius = 120; // influence radius for bombs

  // Modal handling
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');
  aboutBtn.addEventListener('click', () => (aboutModal.style.display = 'flex'));
  aboutClose.addEventListener('click', () => (aboutModal.style.display = 'none'));
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.style.display = 'none';
  });

  class Node {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.belief = Math.random();
      this.nextBelief = this.belief;
    }
    draw() {
      const r = Math.floor(this.belief * 255);
      const b = 255 - r;
      ctx.beginPath();
      ctx.fillStyle = `rgb(${r},0,${b})`;
      ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // create random nodes
  for (let i = 0; i < nodeCount; i++) {
    const x = 40 + Math.random() * (canvas.width - 80);
    const y = 40 + Math.random() * (canvas.height - 80);
    nodes.push(new Node(x, y));
  }
  // create random edges based on distance
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < 150) {
        edges.push([i, j]);
      }
    }
  }
  function updateBeliefs() {
    nodes.forEach((n, i) => {
      // compute average belief of neighbours
      let sum = n.belief;
      let count = 1;
      edges.forEach(([a, b]) => {
        if (a === i) {
          sum += nodes[b].belief;
          count++;
        } else if (b === i) {
          sum += nodes[a].belief;
          count++;
        }
      });
      n.nextBelief = sum / count;
    });
    nodes.forEach((n) => {
      // ease toward next belief
      n.belief += (n.nextBelief - n.belief) * 0.1;
    });
  }
  function drawEdges() {
    ctx.strokeStyle = 'rgba(150,150,150,0.4)';
    edges.forEach(([a, b]) => {
      const n1 = nodes[a];
      const n2 = nodes[b];
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    });
  }
  // bombs
  function dropBomb(x, y, value) {
    nodes.forEach((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      const d = Math.hypot(dx, dy);
      if (d < radius) {
        // adjust belief toward value depending on distance
        const influence = 1 - d / radius;
        n.belief = n.belief * (1 - influence) + value * influence;
      }
    });
  }
  // left click fact bomb (value 0), right click rumour bomb (value 1)
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    dropBomb(e.clientX - rect.left, e.clientY - rect.top, 0);
  });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    dropBomb(e.clientX - rect.left, e.clientY - rect.top, 1);
    return false;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEdges();
    updateBeliefs();
    nodes.forEach((n) => n.draw());
    requestAnimationFrame(animate);
  }
  animate();
})();