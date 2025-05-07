const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Speed control UI elements
const speedControl = document.getElementById('speedControl');
const speedValueDisplay = document.getElementById('speedValue');
const resetSpeedButton = document.getElementById('resetSpeedButton');
const escalationModeButton = document.getElementById('escalationModeButton');

// --- Game Configuration ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// OUTER GAME ELEMENTS & SPEEDS
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 8;

const INNER_GAME_RADIUS = 40;
const INNER_GAME_DIAMETER = INNER_GAME_RADIUS * 2;
const OUTER_BALL_BASE_SPEED_X = 5;
const OUTER_BALL_BASE_SPEED_Y = 5;


// MINI GAME (INNER PONG) ELEMENTS & SPEEDS
const MINI_PADDLE_WIDTH = 7; // Increased from 5
const MINI_PADDLE_HEIGHT = Math.round((PADDLE_HEIGHT / CANVAS_HEIGHT) * INNER_GAME_DIAMETER);

const speedScaleFactorWidth = INNER_GAME_DIAMETER / CANVAS_WIDTH;
const speedScaleFactorHeight = INNER_GAME_DIAMETER / CANVAS_HEIGHT;

const MINI_PADDLE_SPEED = 3.0; // Significantly increased

const MINI_BALL_RADIUS = 4;
const MINI_BALL_SPEED_X_INITIAL = parseFloat((OUTER_BALL_BASE_SPEED_X * speedScaleFactorWidth).toFixed(2));
const MINI_BALL_SPEED_Y_INITIAL = parseFloat((OUTER_BALL_BASE_SPEED_Y * speedScaleFactorHeight).toFixed(2));
const MINI_BALL_MAX_SPEED_FACTOR = 2.0; // Reduced from 2.5

let outerPlayer1Score = 0;
let outerPlayer2Score = 0;
let gameSpeedMultiplier = 1.0;

// --- Escalation Mode Variables ---
let escalationModeActive = false;
let escalationInterval = 30000;
let escalationTimer = 0;
let lastTime = 0;

// --- Utility Functions ---
function drawRect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function drawCircle(x, y, r, color, strokeColor = null, lineWidth = 1) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}
function drawText(text, x, y, color, size = "20px", font = "Arial") { ctx.fillStyle = color; ctx.font = `${size} ${font}`; ctx.fillText(text, x, y); }

// --- Paddle Class ---
class Paddle {
    constructor(x, y, width, height, baseSpeed, color = '#fff', isInnerPaddle = false, parentInnerGame = null) {
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.baseSpeed = baseSpeed; this.color = color; this.dy = 0;
        this.isInnerPaddle = isInnerPaddle; this.parentInnerGame = parentInnerGame;
    }
    update(boundsHeight) {
        let currentSpeed = this.baseSpeed;
        if (!this.isInnerPaddle) {
            currentSpeed *= gameSpeedMultiplier;
        }
        if (gameSpeedMultiplier === 0 && !escalationModeActive) {
             currentSpeed = 0;
        }
        let newY = this.y + this.dy * currentSpeed;
        if (this.isInnerPaddle && this.parentInnerGame) {
            const centerX = this.parentInnerGame.width / 2;
            const centerY = this.parentInnerGame.height / 2;
            const radius = this.parentInnerGame.radius;
            let effectiveX = Math.abs(this.x + this.width / 2 - centerX);
            if (effectiveX >= radius) { newY = centerY - this.height / 2; }
            else {
                const sqrtArg = radius * radius - effectiveX * effectiveX;
                const maxYOffset = sqrtArg > 0 ? Math.sqrt(sqrtArg) : 0;
                const minYBoundary = centerY - maxYOffset;
                const maxYBoundary = centerY + maxYOffset;
                if (newY < minYBoundary) newY = minYBoundary;
                if (newY + this.height > maxYBoundary) newY = maxYBoundary - this.height;
            }
            this.y = newY;
        } else {
            this.y = newY;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > boundsHeight) this.y = boundsHeight - this.height;
        }
    }
    draw(offsetX = 0, offsetY = 0) { drawRect(offsetX + this.x, offsetY + this.y, this.width, this.height, this.color); }
}

// --- MiniBall Class ---
class MiniBall {
    constructor(parentRadius, radius, initialSpeedX, initialSpeedY, color = '#ff0') {
        this.parentRadius = parentRadius; this.radius = radius; this.color = color;
        this.baseInitialSpeedX = initialSpeedX;
        this.baseInitialSpeedY = initialSpeedY;
        this.reset();
    }
    reset() {
        this.x = 0; this.y = 0;
        this.dx = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedX;
        this.dy = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedY;
    }
    update(paddle1, paddle2) {
        if (gameSpeedMultiplier === 0 && !escalationModeActive) {
            return null;
        }
        this.x += this.dx; this.y += this.dy;
        let wallHitData = null;
        const distSq = this.x * this.x + this.y * this.y;
        const maxDist = this.parentRadius - this.radius;
        if (distSq > maxDist * maxDist) {
            const distanceFromCenter = Math.sqrt(distSq);
            const normX = this.x / distanceFromCenter; const normY = this.y / distanceFromCenter;
            wallHitData = { wallHit: true, impactX: this.x, impactY: this.y };
            const dotProduct = this.dx * normX + this.dy * normY;
            this.dx -= 2 * dotProduct * normX; this.dy -= 2 * dotProduct * normY;
            this.dx *= 1.01; this.dy *= 1.01;
            this.dx = Math.max(-this.baseInitialSpeedX * MINI_BALL_MAX_SPEED_FACTOR, Math.min(this.baseInitialSpeedX * MINI_BALL_MAX_SPEED_FACTOR, this.dx));
            this.dy = Math.max(-this.baseInitialSpeedY * MINI_BALL_MAX_SPEED_FACTOR, Math.min(this.baseInitialSpeedY * MINI_BALL_MAX_SPEED_FACTOR, this.dy));
            this.x = normX * maxDist; this.y = normY * maxDist;
        }
        const p1TopRel = paddle1.y - this.parentRadius; const p1BotRel = paddle1.y + paddle1.height - this.parentRadius;
        const p1FrontRel = paddle1.x + paddle1.width - this.parentRadius; const p1BackRel = paddle1.x - this.parentRadius;
        if (this.dx < 0 && this.x - this.radius < p1FrontRel && this.x + this.radius > p1BackRel && this.y > p1TopRel && this.y < p1BotRel) {
            this.dx *= -1.1;
            this.dx = Math.max(-this.baseInitialSpeedX * MINI_BALL_MAX_SPEED_FACTOR, Math.min(this.baseInitialSpeedX * MINI_BALL_MAX_SPEED_FACTOR, this.dx));
            this.x = p1FrontRel + this.radius; wallHitData = null;
        }
        const p2TopRel = paddle2.y - this.parentRadius; const p2BotRel = paddle2.y + paddle2.height - this.parentRadius;
        const p2FrontRel = paddle2.x - this.parentRadius; const p2BackRel = paddle2.x + paddle2.width - this.parentRadius;
        if (this.dx > 0 && this.x + this.radius > p2FrontRel && this.x - this.radius < p2BackRel && this.y > p2TopRel && this.y < p2BotRel) {
            this.dx *= -1.1;
            this.dx = Math.max(-this.baseInitialSpeedX * MINI_BALL_MAX_SPEED_FACTOR, Math.min(this.baseInitialSpeedX * MINI_BALL_MAX_SPEED_FACTOR, this.dx));
            this.x = p2FrontRel - this.radius; wallHitData = null;
        }
        return wallHitData;
    }
    draw(parentCX, parentCY) { drawCircle(parentCX + this.x, parentCY + this.y, this.radius, this.color); }
}

// --- InnerGame Class ---
class InnerGame {
    constructor(centerX, centerY, radius, outerBallSpeedX, outerBallSpeedY) {
        this.centerX = centerX; this.centerY = centerY; this.radius = radius;
        this.width = radius * 2; this.height = radius * 2;
        this.baseInitialSpeedX = outerBallSpeedX;
        this.baseInitialSpeedY = outerBallSpeedY;
        this.dx = outerBallSpeedX; this.dy = outerBallSpeedY;
        this.color = '#333'; this.borderColor = '#888';
        const paddleMargin = 12; // Moved paddles slightly more inward
        this.innerPaddle1 = new Paddle(paddleMargin, this.height / 2 - MINI_PADDLE_HEIGHT / 2, MINI_PADDLE_WIDTH, MINI_PADDLE_HEIGHT, MINI_PADDLE_SPEED, '#0f0', true, this);
        this.innerPaddle2 = new Paddle(this.width - MINI_PADDLE_WIDTH - paddleMargin, this.height / 2 - MINI_PADDLE_HEIGHT / 2, MINI_PADDLE_WIDTH, MINI_PADDLE_HEIGHT, MINI_PADDLE_SPEED, '#0f0', true, this);
        this.miniBall = new MiniBall(this.radius, MINI_BALL_RADIUS, MINI_BALL_SPEED_X_INITIAL, MINI_BALL_SPEED_Y_INITIAL);
        this.innerScore1 = 0; this.innerScore2 = 0;
    }
    get boundingBox() { return { x: this.centerX - this.radius, y: this.centerY - this.radius, width: this.radius * 2, height: this.radius * 2 }; }

    resetInitialState() {
        this.centerX = CANVAS_WIDTH / 2;
        this.centerY = CANVAS_HEIGHT / 2;
        this.dx = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedX * (Math.random() * 0.5 + 0.75);
        this.dy = (Math.random() > 0.5 ? 1 : -1) * this.baseInitialSpeedY * (Math.random() * 0.5 + 0.75);
    }

    updateInnerGame() {
        this.innerPaddle1.update(this.height);
        this.innerPaddle2.update(this.height);
        const miniBallHitData = this.miniBall.update(this.innerPaddle1, this.innerPaddle2);
        if (miniBallHitData && miniBallHitData.wallHit) {
            if (miniBallHitData.impactX < 0) { this.innerScore2++; }
            else if (miniBallHitData.impactX > 0) { this.innerScore1++; }
        }
    }

    updateOuterMovement(outerP1, outerP2, cW, cH) {
        let canMoveOuter = gameSpeedMultiplier > 0;
        if (canMoveOuter) {
            this.centerX += this.dx * gameSpeedMultiplier;
            this.centerY += this.dy * gameSpeedMultiplier;
        }
        const currentBb = this.boundingBox;
        if (currentBb.y < 0) {
            this.centerY = this.radius; this.dy *= -1;
        } else if (currentBb.y + currentBb.height > cH) {
            this.centerY = cH - this.radius; this.dy *= -1;
        }
        if (currentBb.x < 0) {
            outerPlayer2Score++; this.dx *= -1; this.centerX = this.radius;
        } else if (currentBb.x + currentBb.width > cW) {
            outerPlayer1Score++; this.dx *= -1; this.centerX = cW - this.radius;
        }
        if (this.dx < 0 && this.centerX - this.radius < outerP1.x + outerP1.width && this.centerX + this.radius > outerP1.x && this.centerY - this.radius < outerP1.y + outerP1.height && this.centerY + this.radius > outerP1.y) {
            if(this.centerX - this.radius - (this.dx * gameSpeedMultiplier) >= outerP1.x + outerP1.width){
                this.dx *= -1.05;
                this.centerX = outerP1.x + outerP1.width + this.radius;
                this.dy += (this.centerY - (outerP1.y + outerP1.height / 2)) * 0.05;
            }
        } else if (this.dx > 0 && this.centerX + this.radius > outerP2.x && this.centerX - this.radius < outerP2.x + outerP2.width && this.centerY - this.radius < outerP2.y + outerP2.height && this.centerY + this.radius > outerP2.y) {
             if(this.centerX + this.radius - (this.dx * gameSpeedMultiplier) <= outerP2.x){
                this.dx *= -1.05;
                this.centerX = outerP2.x - this.radius;
                this.dy += (this.centerY - (outerP2.y + outerP2.height / 2)) * 0.05;
            }
        }
        this.dx = Math.max(-this.baseInitialSpeedX * 3, Math.min(this.baseInitialSpeedX * 3, this.dx));
        this.dy = Math.max(-this.baseInitialSpeedY * 3, Math.min(this.baseInitialSpeedY * 3, this.dy));
        this.updateInnerGame();
    }
    draw() {
        drawCircle(this.centerX, this.centerY, this.radius, this.color, this.borderColor);
        const bbTLX = this.centerX - this.radius; const bbTLY = this.centerY - this.radius;
        this.innerPaddle1.draw(bbTLX, bbTLY); this.innerPaddle2.draw(bbTLX, bbTLY);
        this.miniBall.draw(this.centerX, this.centerY);
        drawText(this.innerScore1, this.centerX - this.radius*0.5, this.centerY - this.radius*0.7, '#cfc', "10px");
        drawText(this.innerScore2, this.centerX + this.radius*0.3, this.centerY - this.radius*0.7, '#cfc', "10px");
    }
}

// --- Speed Control Logic ---
function updateSpeedUI() {
    speedValueDisplay.textContent = gameSpeedMultiplier.toFixed(1);
    speedControl.value = gameSpeedMultiplier;
}
speedControl.addEventListener('input', (e) => {
    gameSpeedMultiplier = parseFloat(e.target.value);
    updateSpeedUI(); escalationModeActive = false;
});
resetSpeedButton.addEventListener('click', () => {
    gameSpeedMultiplier = 1.0; updateSpeedUI(); escalationModeActive = false;
});
escalationModeButton.addEventListener('click', () => {
    escalationModeActive = true; gameSpeedMultiplier = 0.1;
    updateSpeedUI(); escalationTimer = 0; lastTime = performance.now();
    console.log("Escalation Mode Activated. Speed: 0.1x");
});

// --- Escalation Logic ---
function handleEscalation(deltaTime) {
    if (!escalationModeActive) return;
    escalationTimer += deltaTime;
    if (escalationTimer >= escalationInterval) {
        escalationTimer -= escalationInterval;
        const maxSpeed = parseFloat(speedControl.max);
        if (gameSpeedMultiplier < maxSpeed) {
            gameSpeedMultiplier = Math.max(0.1, parseFloat((gameSpeedMultiplier + 0.1).toFixed(1)));
            gameSpeedMultiplier = Math.min(maxSpeed, gameSpeedMultiplier);
            updateSpeedUI();
            console.log(`Escalation: Speed increased to ${gameSpeedMultiplier.toFixed(1)}x`);
        } else {
            console.log("Escalation: Max speed reached."); escalationModeActive = false;
        }
    }
}

// --- Game Objects ---
const player1 = new Paddle(20, CANVAS_HEIGHT/2 - PADDLE_HEIGHT/2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED, '#fff', false);
const player2 = new Paddle(CANVAS_WIDTH - PADDLE_WIDTH - 20, CANVAS_HEIGHT/2 - PADDLE_HEIGHT/2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED, '#fff', false);
const pongCeptionBall = new InnerGame(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, INNER_GAME_RADIUS, OUTER_BALL_BASE_SPEED_X, OUTER_BALL_BASE_SPEED_Y);

// --- Input Handling ---
const keysPressed = {};
window.addEventListener('keydown', (e) => keysPressed[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keysPressed[e.key.toLowerCase()] = false);
function handleInput() {
    player1.dy = 0; player2.dy = 0;
    if (keysPressed['w']) player1.dy = -1; if (keysPressed['s']) player1.dy = 1;
    if (keysPressed['arrowup']) player2.dy = -1; if (keysPressed['arrowdown']) player2.dy = 1;
    pongCeptionBall.innerPaddle1.dy = 0; pongCeptionBall.innerPaddle2.dy = 0;
    if (keysPressed['e']) pongCeptionBall.innerPaddle1.dy = -1; if (keysPressed['d']) pongCeptionBall.innerPaddle1.dy = 1;
    if (keysPressed['o']) pongCeptionBall.innerPaddle2.dy = -1; if (keysPressed['l']) pongCeptionBall.innerPaddle2.dy = 1;
}

// --- Game Loop ---
function update(currentTime) {
    if (!lastTime) { lastTime = currentTime; }
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    handleInput(); handleEscalation(deltaTime);
    player1.update(CANVAS_HEIGHT); player2.update(CANVAS_HEIGHT);
    pongCeptionBall.updateOuterMovement(player1, player2, CANVAS_WIDTH, CANVAS_HEIGHT);
}
function draw() {
    drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000');
    for (let i = 0; i < CANVAS_HEIGHT; i += 30) drawRect(CANVAS_WIDTH/2 - 2.5, i, 5, 20, '#333');
    player1.draw(); player2.draw(); pongCeptionBall.draw();
    drawText(outerPlayer1Score, CANVAS_WIDTH/4, 50, '#fff', "40px");
    drawText(outerPlayer2Score, (CANVAS_WIDTH/4)*3 - 20, 50, '#fff', "40px");
    if (gameSpeedMultiplier === 0 && !escalationModeActive) {
        drawText("PAUSED", CANVAS_WIDTH/2 - 60, CANVAS_HEIGHT/2, "#fff", "30px", "Arial Black");
    }
}
function gameLoop(currentTime) { update(currentTime); draw(); requestAnimationFrame(gameLoop); }

// Initialize
updateSpeedUI();
pongCeptionBall.resetInitialState();
requestAnimationFrame(gameLoop);

console.log("Outer Ball Base Speed X:", OUTER_BALL_BASE_SPEED_X.toFixed(2), "Y:", OUTER_BALL_BASE_SPEED_Y.toFixed(2));
console.log("Inner Ball Calculated Speed X:", MINI_BALL_SPEED_X_INITIAL.toFixed(2), "Y:", MINI_BALL_SPEED_Y_INITIAL.toFixed(2));
console.log("Inner Ball Max Speed Y (approx):", (MINI_BALL_SPEED_Y_INITIAL * MINI_BALL_MAX_SPEED_FACTOR).toFixed(2));
console.log("Outer Paddle Speed:", PADDLE_SPEED.toFixed(2));
console.log("Inner Paddle Set Speed:", MINI_PADDLE_SPEED.toFixed(2));
console.log("Speed Scale Factor Width:", speedScaleFactorWidth.toFixed(3), "Height:", speedScaleFactorHeight.toFixed(3));
console.log("Inner Play Area Diameter:", INNER_GAME_DIAMETER);
console.log("Outer Play Area Width:", CANVAS_WIDTH, "Height:", CANVAS_HEIGHT);