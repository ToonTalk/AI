const funButton = document.getElementById('fun-button');
const catImage = document.getElementById('cat-image');
const meowSound = document.getElementById('meow-sound');

let clicked = false;

funButton.addEventListener('click', () => {
  meowSound.play();

  if (!clicked) {
    catImage.style.transform = 'rotate(360deg) scale(1.5)';
    catImage.style.transition = 'transform 1s';
    funButton.style.backgroundColor = '#FF5722';
    funButton.textContent = 'Click me again!';
    clicked = true;
  } else {
    catImage.style.transform = 'rotate(0deg) scale(1)';
    funButton.style.backgroundColor = '#007BFF';
    funButton.textContent = 'Click me for fun!';
    clicked = false;
  }
});