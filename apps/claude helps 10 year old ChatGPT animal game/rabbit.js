let gameState = 0;

function startGame() {
  gameState = 0;
  showGameState();
}

function showGameState() {
  let text = "";
  let option1 = "";
  let option2 = "";

  if (gameState === 0) {
    text = "You are a hungry rabbit. You see two paths ahead. One leads to a garden full of carrots, the other leads to a fox's den. Which path do you choose?";
    option1 = "Path to the garden";
    option2 = "Path to the fox's den";
  } else if (gameState === 1) {
    text = "Great choice! You safely reach the garden and feast on delicious carrots. You win!";
    option1 = "Play again";
    option2 = "Go back to animal selection";
  } else if (gameState === 2) {
    text = "Oh no! You ran into the fox and had to flee. Better luck next time!";
    option1 = "Try again";
    option2 = "Go back to animal selection";
  }

  document.getElementById("gameText").innerHTML = text;
  document.getElementById("option1").innerHTML = option1;
  document.getElementById("option2").innerHTML = option2;
}

document.getElementById("option1").addEventListener("click", function() {
  if (gameState === 0) {
    gameState = 1;
  } else {
    startGame();
  }
  showGameState();
});

document.getElementById("option2").addEventListener("click", function() {
  if (gameState === 0) {
    gameState = 2;
  } else {
    location.href = "index.html";
  }
  showGameState();
});

startGame();