// Array of riddles
const riddles = [
  {
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answer: "echo"
  },
  {
    question: "I have keys but no locks. I have space but no room. You can enter, but you can't go outside. What am I?",
    answer: "keyboard"
  }
];

// Get DOM elements
const riddleText = document.getElementById("riddle-text");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-button");
const treasureContainer = document.getElementById("treasure-container");

// Randomly select a riddle from the array
const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];

// Set the riddle text
riddleText.textContent = randomRiddle.question;

// Event listener for submit button
submitButton.addEventListener("click", checkAnswer);

// Function to check if the answer is correct
function checkAnswer() {
  const userAnswer = answerInput.value.toLowerCase();
  if (userAnswer === randomRiddle.answer) {
    showTreasure();
  } else {
    alert("Oops! That's not the correct answer. Try again!");
  }
}

// Function to show the treasure container
function showTreasure() {
  riddleText.style.display = "none";
  answerInput.style.display = "none";
  submitButton.style.display = "none";
  treasureContainer.style.display = "block";
}