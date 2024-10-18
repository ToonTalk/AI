const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Firework {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetX = Math.random() * canvas.width;
        this.targetY = Math.random() * canvas.height / 2;
        this.speed = 2 + Math.random() * 3;
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.distanceToTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        this.distanceTraveled = 0;
        this.brightness = Math.random() * 50 + 50;
        this.alpha = 1;
        this.exploded = false;
    }

    update() {
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        this.x += vx;
        this.y += vy;
        this.distanceTraveled = Math.hypot(this.x - this.targetX, this.y - this.targetY);
        if (this.distanceTraveled >= this.distanceToTarget) {
            this.exploded = true;
        }
        this.alpha -= 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, ${this.brightness}%)`;
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = Math.random() * 5 + 2;
        this.angle = Math.random() * Math.PI * 2;
        this.friction = 0.95;
        this.gravity = 1;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.brightness = Math.random() * 50 + 50;
    }

    update() {
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, ${this.brightness}%)`;
        ctx.fill();
        ctx.restore();
    }
}

const fireworks = [];
const particles = [];

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.05) {
        fireworks.push(new Firework());
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
        const firework = fireworks[i];
        firework.update();
        firework.draw();
        if (firework.exploded) {
            fireworks.splice(i, 1);
            for (let j = 0; j < 100; j++) {
                particles.push(new Particle(firework.x, firework.y));
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        particle.draw();
        if (particle.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

animate();
