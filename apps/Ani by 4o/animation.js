const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

const C = { x: 100, y: 300, radius: 20, color: '#3498db', speed: 1, pause: false }; // Circle
const S = { x: 400, y: 300, size: 40, color: '#e74c3c', speed: 0.5, moving: true }; // Triangle
const P = { x: 700, y: 300, width: 30, height: 60, color: '#f1c40f' }; // Rectangle

function drawCircle(c) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.closePath();
}

function drawTriangle(s) {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - s.size / 2);
    ctx.lineTo(s.x - s.size / 2, s.y + s.size / 2);
    ctx.lineTo(s.x + s.size / 2, s.y + s.size / 2);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.closePath();
}

function drawRectangle(p) {
    ctx.beginPath();
    ctx.rect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.closePath();
}

function updatePositions() {
    if (!C.pause) {
        if (C.x < S.x - 50) {
            C.x += C.speed; // C moves towards the right
        } else if (C.x >= S.x - 50 && S.x <= P.x - 50) {
            S.x -= S.speed; // S moves towards the left to block C
            if (S.x - C.x < 50) {
                C.x -= 2; // C is pushed back
                C.pause = true;
                setTimeout(() => C.pause = false, 1000); // Pause C for 1 second
            }
        } else if (S.x < P.x - 50) {
            S.moving = false; // S stops moving when near P
        }
    }

    // Reset positions for continuous loop
    if (C.x >= canvas.width) {
        C.x = 0;
    }
    if (S.x <= 0) {
        S.x = canvas.width;
    }
}

function drawObjects() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw objects that C interacts with
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(200, 290, 20, 20); // Example object

    drawCircle(C);
    drawTriangle(S);
    drawRectangle(P);
    updatePositions();
}

function animate() {
    drawObjects();
    requestAnimationFrame(animate);
}

animate();
