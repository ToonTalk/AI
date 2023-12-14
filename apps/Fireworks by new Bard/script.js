const fireworksContainer = document.querySelector('.fireworks-container');

const createFirework = () => {
  const fireworkElement = document.createElement('div');
  fireworkElement.classList.add('firework');
  fireworksContainer.appendChild(fireworkElement);

  // Generate firework trail and sparks
  // Define and initialize trail element within createFirework function
  const trailElement = document.createElement('div');
  trailElement.classList.add('firework-trail');
  fireworkElement.appendChild(trailElement);

  for (let i = 0; i < 10; i++) {
    const sparkElement = document.createElement('div');
    sparkElement.classList.add('sparks');
    fireworkElement.appendChild(sparkElement);
  }

  // Update firework position and animation
  updateFireworkPosition(fireworkElement);
  animateFirework(fireworkElement);
};

const updateFireworkPosition = (fireworkElement) => {
  let fireworkOffset = 100;
  fireworkElement.style.top = `<span class="math-inline">\{fireworkOffset\}px\`;
fireworkElement\.style\.left \= \`</span>{fireworkOffset}px`;
  fireworkOffset -= 5;

  if (fireworkOffset <= 0) {
    fireworkElement.remove();
  }
};

const animateFirework = (fireworkElement) => {
  // Scale up and fade out the firework
  let fireworkScale = 1;
  let fireworkOpacity = 1;

  const animateFireworkInterval = setInterval(() => {
    if (fireworkScale < 0.1) {
      clearInterval(animateFireworkInterval);
      return;
    }

    fireworkScale -= 0.1;
    fireworkOpacity -= 0.05;

    fireworkElement.style.transform = `scale(${fireworkScale})`;
    fireworkElement.style.opacity = `${fireworkOpacity}`;
    trailElement.style.width = `${fireworkScale * 100}px`;

    // Update the positions of sparks
    for (let i = 0; i < 10; i++) {
      const sparkElement = fireworkElement.children[i];

      const sparkOffset = Math.random() * 100 - 50; // Random offset for sparks
      sparkElement.style.top = `${fireworkOffset + sparkOffset}px`;
      sparkElement.style.left = `${fireworkOffset + sparkOffset}px`;

      sparkElement.classList.add('animated'); // Add animation class
    }

    // Update firework position
    fireworkOffset -= 5;

    if (fireworkOffset <= 0) {
      fireworkElement.remove();
    }
  }, 50);
};
  
  // Start the fireworks animation
  const fireworksInterval = setInterval(() => {
    createFirework(); // Create a new firework every second
  }, 1000);
