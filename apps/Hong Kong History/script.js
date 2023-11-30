// Get references to the input field and start button
const playerNameInput = document.getElementById("player-name");
const startButton = document.getElementById("start-button");

// Add an event listener to the start button
startButton.addEventListener("click", startGame);

// Define the startGame function
function startGame() {
  const playerName = playerNameInput.value;
  console.log("Starting the game!");

  // Present the player with a scenario
  const response = prompt("You wake up in a bustling street in 1950s Hong Kong. What do you do?");

  // Game logic based on the player's response
  let message;
  if (response === "explore") {
    message = "You decide to explore the street and discover a hidden alleyway.";
  } else if (response === "talk to locals") {
    message = "You strike up a conversation with a friendly local and learn about the city's history.";
  } else {
    message = "You stand there, unsure of what to do next.";
  }

  // Display the game's response
  const responseContainer = document.createElement("p");
  responseContainer.textContent = message;
  document.getElementById("game-container").appendChild(responseContainer);
}