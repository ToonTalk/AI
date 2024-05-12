// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 300;
canvas.height = 400;

// Game variables
let ballX = 50;
let ballY = 50;
let ballRadius = 10;
let ballSpeedX = 0;
let ballSpeedY = 0;

const mazeWidth = 300;
const mazeHeight = 400;
const mazeWallThickness = 5;

// Maze wall positions
const walls = [
  { x: 0, y: 0, width: mazeWidth, height: mazeWallThickness }, // Top wall
  { x: 0, y: 0, width: mazeWallThickness, height: mazeHeight }, // Left wall
  { x: mazeWidth - mazeWallThickness, y: 0, width: mazeWallThickness, height: 200 }, // Right wall part 1
  { x: mazeWidth - mazeWallThickness, y: 300, width: mazeWallThickness, height: 100 }, // Right wall part 2
  { x: 200, y: mazeHeight - mazeWallThickness, width: 100, height: mazeWallThickness }, // Bottom wall
  { x: 100, y: 150, width: mazeWallThickness, height: 100 } // Middle vertical wall
];

// Device tilt variables
let tiltLR = 0;
let tiltFB = 0;

// Listen for device orientation changes
window.addEventListener('deviceorientation', handleOrientation);

function handleOrientation(event) {
  // Get tilt angles
  tiltLR = Math.round(event.gamma);
  tiltFB = Math.round(event.beta);
}

// Draw the maze
function drawMaze() {
  ctx.fillStyle = 'black';
  
  // Draw maze walls
  for (let i = 0; i < walls.length; i++) {
    ctx.fillRect(walls[i].x, walls[i].y, walls[i].width, walls[i].height);
  }
  
  // Draw goal
  ctx.fillRect(200, mazeHeight - 30, 100, 30);
}

// Draw the ball
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI*2);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.closePath();
}

// Update ball position based on tilt
function updateBall() {
  ballSpeedX = tiltLR / 3;
  ballSpeedY = tiltFB / 3;
  
  ballX += ballSpeedX;
  ballY += ballSpeedY;
}

// Check for collisions with walls
function checkCollisions() {
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    
    if (ballX + ballRadius > wall.x && 
        ballX - ballRadius < wall.x + wall.width &&
        ballY + ballRadius > wall.y && 
        ballY - ballRadius < wall.y + wall.height) {
      
      // Collision detected, adjust ball position
      if (ballX < wall.x + wall.width / 2) {
        ballX = wall.x - ballRadius;
      } else {
        ballX = wall.x + wall.width + ballRadius;
      }
      
      if (ballY < wall.y + wall.height / 2) {
        ballY = wall.y - ballRadius;
      } else {
        ballY = wall.y + wall.height + ballRadius;
      }
    }
  }
}

// Check if ball reached goal
function checkGoal() {
  if (ballX > mazeWidth - 30 && ballY > mazeHeight - 30) {
    alert('You win!');
    resetBall();
  }
}

// Reset ball to starting position
function resetBall() {
  ballX = 50;
  ballY = 50;
  ballSpeedX = 0;
  ballSpeedY = 0;
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawMaze();
  updateBall();
  checkCollisions();
  drawBall();
  checkGoal();
  
  requestAnimationFrame(gameLoop);
}

gameLoop();