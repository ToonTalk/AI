function createFirework() {
  const firework = document.createElement('div');
  firework.classList.add('firework');
  firework.style.left = `${Math.random() * 100}vw`;
  document.querySelector('.firework-container').appendChild(firework);
  setTimeout(() => {
    firework.remove();
  }, 1000);
}

setInterval(createFirework, 800);