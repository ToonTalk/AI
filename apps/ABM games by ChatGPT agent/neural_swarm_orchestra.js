(() => {
  const canvas = document.getElementById('simCanvas');
  const ctx = canvas.getContext('2d');
  const nodeCount = 12;
  const nodes = [];
  const edges = new Map(); // adjacency list: node index -> array of indices
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Modal
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
      this.potential = Math.random();
      this.threshold = 1;
      this.refractory = 0;
    }
    update(dt) {
      if (this.refractory > 0) {
        this.refractory -= dt;
        return;
      }
      // accumulate baseline charge
      this.potential += dt * 0.2;
      if (this.potential >= this.threshold) {
        this.fire();
      }
    }
    fire() {
      this.potential = 0;
      this.refractory = 0.2;
      // send pulses
      const neighbours = edges.get(this);
      if (neighbours) {
        neighbours.forEach((nbr) => {
          nbr.potential += 0.3;
        });
      }
      // play tone
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 200 + Math.random() * 800;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
    draw() {
      // Node colour depends on potential
      const intensity = Math.min(1, this.potential / this.threshold);
      const col = Math.floor(intensity * 255);
      ctx.beginPath();
      ctx.fillStyle = `rgb(${col},${100},${255 - col})`;
      ctx.strokeStyle = '#333';
      ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Initialize nodes positioned in a circle
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const r = 180;
    const x = canvas.width / 2 + r * Math.cos(angle);
    const y = canvas.height / 2 + r * Math.sin(angle);
    const node = new Node(x, y);
    nodes.push(node);
    edges.set(node, []);
  }
  // Create initial random connections
  function addConnection(a, b) {
    const listA = edges.get(a);
    if (!listA.includes(b)) listA.push(b);
  }
  // connect each node to two random neighbours
  nodes.forEach((node) => {
    for (let i = 0; i < 2; i++) {
      const other = nodes[Math.floor(Math.random() * nodes.length)];
      if (other !== node) addConnection(node, other);
    }
  });

  // On click: find nearest node and randomly rewire one connection
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let nearest = null;
    let minDist = Infinity;
    nodes.forEach((node) => {
      const dx = node.x - mx;
      const dy = node.y - my;
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearest = node;
      }
    });
    if (nearest) {
      const neighbours = edges.get(nearest);
      if (neighbours.length > 0 && Math.random() < 0.5) {
        // remove a random connection
        neighbours.splice(Math.floor(Math.random() * neighbours.length), 1);
      } else {
        // add connection to random node
        let target;
        do {
          target = nodes[Math.floor(Math.random() * nodes.length)];
        } while (target === nearest || edges.get(nearest).includes(target));
        addConnection(nearest, target);
      }
    }
  });

  function drawEdges() {
    ctx.strokeStyle = '#999';
    edges.forEach((nbrs, node) => {
      nbrs.forEach((nbr) => {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(nbr.x, nbr.y);
        ctx.stroke();
      });
    });
  }

  let lastTime = null;
  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEdges();
    nodes.forEach((node) => node.update(dt));
    nodes.forEach((node) => node.draw());
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();