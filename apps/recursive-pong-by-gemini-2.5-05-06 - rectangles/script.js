const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Speed control UI elements
const speedControl = document.getElementById('speedControl');
const speedValueDisplay = document.getElementById('speedValue');
const resetSpeedButton = document.getElementById('resetSpeedButton');

// --- Game Configuration ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 8; // Base speed

const INNER_GAME_WIDTH = 100;
const INNER_GAME_HEIGHT = 60;
const INNER_GAME_SPEED_X_INITIAL = 5; // Base speed
const INNER_GAME_SPEED_Y_INITIAL = 5; // Base speed

const MINI_PADDLE_WIDTH = 5;
const MINI_PADDLE_HEIGHT = 20;
const MINI_PADDLE_SPEED = 2.5; // Base speed

const MINI_BALL_RADIUS = 4;
const MINI_BALL_SPEED_X_INITIAL = 2.5; // Base speed
const MINI_BALL_SPEED_Y_INITIAL = 2.5; // Base speed

let outerPlayer1Score = 0;
let outerPlayer2Score = 0;

let gameSpeedMultiplier = 1.0; // Global speed multiplier

// --- Utility Functions ---
function drawRect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function drawCircle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 2, false); ctx.fill(); }
function drawText(text, x, y, color, size = "20px", font = "Arial") { ctx.fillStyle = color; ctx.font = `${size} ${font}`; ctx.fillText(text, x, y); }

// --- Paddle Class ---
class Paddle {
    constructor(x, y, width, height, baseSpeed, color = '#fff') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.baseSpeed = baseSpeed;
        this.color = color;
        this.dy = 0; // Direction: -1 for up, 1 for down, 0 for still
    }

    update(boundsHeight) {
        this.y += this.dy * this.baseSpeed * gameSpeedMultiplier;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > boundsHeight) this.y = boundsHeight - this.height;
    }

    draw() { drawRect(this.x, this.y, this.width, this.height, this.color); }
}

// --- MiniBall Class ---
class MiniBall {
    constructor(parentWidth, parentHeight, radius, initialSpeedX, initialSpeedY, color = '#ff0') {
        this.parentWidth = parentWidth;
        this.parentHeight = parentHeight;
        this.radius = radius;
        this.color = color;
        this.baseInitialSpeedX = initialSpeedX;
        this.baseInitialSpeedY = initialSpeedY;
        this.reset();
    }

    reset() {
        this.x = this.parentWidth / 2;
        this.y = this.parentHeight / 2;
        this.dx = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedX;
        this.dy = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedY;
    }

    update(paddle1, paddle2) {
        if (gameSpeedMultiplier === 0) return;

        this.x += this.dx * gameSpeedMultiplier;
        this.y += this.dy * gameSpeedMultiplier;

        if (this.y - this.radius < 0) { this.y = this.radius; this.dy *= -1; }
        if (this.y + this.radius > this.parentHeight) { this.y = this.parentHeight - this.radius; this.dy *= -1; }

        if (this.dx < 0 && this.x - this.radius < paddle1.x + paddle1.width && this.x + this.radius > paddle1.x && this.y > paddle1.y && this.y < paddle1.y + paddle1.height) {
            this.dx *= -1.1; this.x = paddle1.x + paddle1.width + this.radius;
        }
        if (this.dx > 0 && this.x + this.radius > paddle2.x && this.x - this.radius < paddle2.x + paddle2.width && this.y > paddle2.y && this.y < paddle2.y + paddle2.height) {
            this.dx *= -1.1; this.x = paddle2.x - this.radius;
        }
    }
    draw(parentGlobalX, parentGlobalY) { drawCircle(parentGlobalX + this.x, parentGlobalY + this.y, this.radius, this.color); }
}

// --- InnerGame Class (The "Ball" of the Outer Game) ---
class InnerGame {
    constructor(x, y, width, height, initialSpeedX, initialSpeedY) {
        this.x = x; this.y = y;
        this.width = width; this.height = height;
        this.baseInitialSpeedX = initialSpeedX;
        this.baseInitialSpeedY = initialSpeedY;
        this.dx = initialSpeedX; this.dy = initialSpeedY;
        this.color = '#555';

        this.innerPaddle1 = new Paddle(5, height / 2 - MINI_PADDLE_HEIGHT / 2, MINI_PADDLE_WIDTH, MINI_PADDLE_HEIGHT, MINI_PADDLE_SPEED, '#0f0');
        this.innerPaddle2 = new Paddle(width - MINI_PADDLE_WIDTH - 5, height / 2 - MINI_PADDLE_HEIGHT / 2, MINI_PADDLE_WIDTH, MINI_PADDLE_HEIGHT, MINI_PADDLE_SPEED, '#0f0');
        this.miniBall = new MiniBall(this.width, this.height, MINI_BALL_RADIUS, MINI_BALL_SPEED_X_INITIAL, MINI_BALL_SPEED_Y_INITIAL);
        this.innerScore1 = 0; this.innerScore2 = 0;
    }

    reset(isServingLeft) {
        // Reset outer "ball" (InnerGame) position and speed
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CANVAS_HEIGHT / 2 - this.height / 2;
        this.dx = (isServingLeft ? 1 : -1) * this.baseInitialSpeedX * (Math.random() * 0.5 + 0.75);
        this.dy = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedY * (Math.random() * 0.5 + 0.75);

        // Do NOT reset the miniBall or innerScores here - let the inner game persist.
        // Reset inner paddles to center and stop their motion from previous input
        this.innerPaddle1.y = this.height / 2 - this.innerPaddle1.height / 2;
        this.innerPaddle2.y = this.height / 2 - this.innerPaddle2.height / 2;
        this.innerPaddle1.dy = 0;
        this.innerPaddle2.dy = 0;
    }

    updateInnerGame() {
        this.innerPaddle1.update(this.height);
        this.innerPaddle2.update(this.height);
        this.miniBall.update(this.innerPaddle1, this.innerPaddle2);

        if (gameSpeedMultiplier === 0) return;

        // Inner game scoring still happens, and miniBall resets on inner score
        if (this.miniBall.x - this.miniBall.radius < 0) {
            this.innerScore2++;
            this.miniBall.reset(); // Reset only miniBall, not entire inner game state
        }
        if (this.miniBall.x + this.miniBall.radius > this.width) {
            this.innerScore1++;
            this.miniBall.reset(); // Reset only miniBall
        }
    }

    updateOuterMovement(outerPaddle1, outerPaddle2, canvasWidth, canvasHeight) {
        if (gameSpeedMultiplier > 0) {
            this.x += this.dx * gameSpeedMultiplier;
            this.y += this.dy * gameSpeedMultiplier;

            if (this.y < 0) { this.y = 0; this.dy *= -1; }
            if (this.y + this.height > canvasHeight) { this.y = canvasHeight - this.height; this.dy *= -1; }

            // Outer Paddle Collision Logic
            if (this.dx < 0 && this.x < outerPaddle1.x + outerPaddle1.width && this.x + this.width > outerPaddle1.x && this.y < outerPaddle1.y + outerPaddle1.height && this.y + this.height > outerPaddle1.y) {
                this.dx *= -1.05; this.x = outerPaddle1.x + outerPaddle1.width;
                let hitPos = (this.y + this.height / 2) - (outerPaddle1.y + outerPaddle1.height / 2);
                this.dy += hitPos * 0.05;
            }
            if (this.dx > 0 && this.x + this.width > outerPaddle2.x && this.x < outerPaddle2.x + outerPaddle2.width && this.y < outerPaddle2.y + outerPaddle2.height && this.y + this.height > outerPaddle2.y) {
                this.dx *= -1.05; this.x = outerPaddle2.x - this.width;
                let hitPos = (this.y + this.height / 2) - (outerPaddle2.y + outerPaddle2.height / 2);
                this.dy += hitPos * 0.05;
            }

            // Outer Scoring
            if (this.x < 0) {
                outerPlayer2Score++;
                this.reset(false); // Call the modified reset
            }
            if (this.x + this.width > canvasWidth) {
                outerPlayer1Score++;
                this.reset(true); // Call the modified reset
            }

            this.dx = Math.max(-15, Math.min(15, this.dx));
            this.dy = Math.max(-10, Math.min(10, this.dy));
        }
        this.updateInnerGame(); // Inner game updates its components, which respect multiplier
    }

    draw() {
        drawRect(this.x, this.y, this.width, this.height, this.color);
        ctx.strokeStyle = '#888'; ctx.strokeRect(this.x, this.y, this.width, this.height);
        drawRect(this.x + this.innerPaddle1.x, this.y + this.innerPaddle1.y, this.innerPaddle1.width, this.innerPaddle1.height, this.innerPaddle1.color);
        drawRect(this.x + this.innerPaddle2.x, this.y + this.innerPaddle2.y, this.innerPaddle2.width, this.innerPaddle2.height, this.innerPaddle2.color);
        this.miniBall.draw(this.x, this.y);
        drawText(this.innerScore1, this.x + this.width * 0.25, this.y + 15, '#cfc', "10px");
        drawText(this.innerScore2, this.x + this.width * 0.75 - 5, this.y + 15, '#cfc', "10px");
    }
}

// --- Game Objects ---
const player1 = new Paddle(20, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
const player2 = new Paddle(CANVAS_WIDTH - PADDLE_WIDTH - 20, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
const pongCeptionBall = new InnerGame(
    CANVAS_WIDTH / 2 - INNER_GAME_WIDTH / 2,
    CANVAS_HEIGHT / 2 - INNER_GAME_HEIGHT / 2,
    INNER_GAME_WIDTH, INNER_GAME_HEIGHT,
    INNER_GAME_SPEED_X_INITIAL, INNER_GAME_SPEED_Y_INITIAL
);

// --- Input Handling ---
const keysPressed = {};
window.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    // Optional: Prevent default for arrow keys if they scroll the page
    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
        // e.preventDefault(); // Uncomment if arrow keys cause page scrolling during gameplay
    }
});
window.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

function handleInput() {
    // Outer Paddles
    player1.dy = 0;
    player2.dy = 0;
    if (keysPressed['w']) player1.dy = -1;
    if (keysPressed['s']) player1.dy = 1;
    if (keysPressed['arrowup']) player2.dy = -1;
    if (keysPressed['arrowdown']) player2.dy = 1;

    // Inner Paddles
    pongCeptionBall.innerPaddle1.dy = 0;
    pongCeptionBall.innerPaddle2.dy = 0;

    // Player 1 Inner Paddle (Left paddle of inner game)
    if (keysPressed['a']) pongCeptionBall.innerPaddle1.dy = -1; // A for Up
    if (keysPressed['d']) pongCeptionBall.innerPaddle1.dy = 1;  // D for Down

    // Player 2 Inner Paddle (Right paddle of inner game)
    if (keysPressed['o']) pongCeptionBall.innerPaddle2.dy = -1; // O for Up
    if (keysPressed['l']) pongCeptionBall.innerPaddle2.dy = 1;  // L for Down
}

// --- Speed Control Logic ---
speedControl.addEventListener('input', (e) => {
    gameSpeedMultiplier = parseFloat(e.target.value);
    speedValueDisplay.textContent = gameSpeedMultiplier.toFixed(1);
});

resetSpeedButton.addEventListener('click', () => {
    gameSpeedMultiplier = 1.0;
    speedControl.value = gameSpeedMultiplier;
    speedValueDisplay.textContent = gameSpeedMultiplier.toFixed(1);
});

// --- Game Loop ---
function update() {
    handleInput(); // Process input regardless of pause

    // Game logic updates will now internally use gameSpeedMultiplier
    player1.update(CANVAS_HEIGHT);
    player2.update(CANVAS_HEIGHT);
    pongCeptionBall.updateOuterMovement(player1, player2, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function draw() {
    drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000'); // Clear
    for (let i = 0; i < CANVAS_HEIGHT; i += 30) { // Center line
        drawRect(CANVAS_WIDTH / 2 - 2.5, i, 5, 20, '#333');
    }
    player1.draw();
    player2.draw();
    pongCeptionBall.draw();
    drawText(outerPlayer1Score, CANVAS_WIDTH / 4, 50, '#fff', "40px");
    drawText(outerPlayer2Score, (CANVAS_WIDTH / 4) * 3 - 20, 50, '#fff', "40px");

    if (gameSpeedMultiplier === 0) {
        drawText("PAUSED", CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2, "#fff", "30px", "Arial Black");
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize speed display
speedValueDisplay.textContent = gameSpeedMultiplier.toFixed(1);
speedControl.value = gameSpeedMultiplier;

// Start
pongCeptionBall.reset(true); // Initial serve
gameLoop();