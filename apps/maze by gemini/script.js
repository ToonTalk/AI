const ball = document.getElementById('ball');
let x = 0;
let y = 0;

// Device orientation event (for tilt)
window.addEventListener('deviceorientation', (event) => {
  const beta = event.beta;  // Tilt on x-axis
  const gamma = event.gamma; // Tilt on y-axis

  // Adjust speed (experiment with values)
  x += gamma * 0.1;
  y += beta * 0.1;

  // Boundaries (keep ball within the maze)
  x = Math.max(0, Math.min(x, 280)); // Assuming maze is 300px wide
  y = Math.max(0, Math.min(y, 280));

  ball.style.left = x + 'px';
  ball.style.top = y + 'px';

  // Collision detection (check if ball reached the goal)
  // ... (more code to implement this)
});
