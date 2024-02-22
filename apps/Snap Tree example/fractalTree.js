// Get canvas element and context
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

// Set initial levels and oldLevels
let levels = 3;
let oldLevels = levels;

// Draw the tree initially
drawTree(canvas.width / 2, canvas.height, -90, 100, levels);

// Listen for mouse clicks to redraw the tree
canvas.addEventListener('click', function(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Check if the click is within the central vertical region
  if (Math.abs(x - canvas.width / 2) < 10 && y < (canvas.height - 47)) {
    levels = levels < 6 ? levels + 1 : 3; // Increase levels or reset
    if (levels !== oldLevels) {
      oldLevels = levels;
      clearAndDraw();
    }
  }
});

function drawTree(x, y, angle, length, depth) {
  if (depth === 0) return;

  // Calculate new branch position
  const x2 = x + length * Math.cos(angle * Math.PI / 180);
  const y2 = y + length * Math.sin(angle * Math.PI / 180);

  drawLine(x, y, x2, y2);

  // Recursively draw the next branches
  drawTree(x2, y2, angle - 20, length * 0.7, depth - 1);
  drawTree(x2, y2, angle + 20, length * 0.7, depth - 1);
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function clearAndDraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTree(canvas.width / 2, canvas.height, -90, 100, levels);
}