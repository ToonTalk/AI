function createFirework(x, y) {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = x + 'px';
    firework.style.top = y + 'px';
    document.getElementById('fireworks').appendChild(firework);
    setTimeout(() => firework.remove(), 1000);
}

setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    createFirework(x, y);
}, 500);