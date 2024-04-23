// Array of riddles with hints
// Array of science fiction-themed riddles with hints
const riddles = [
  {
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    answer: "map",
    hint: "It's a representation of a place."
  },
  {
    question: "I'm always hungry, I must be fed, the finger of God points my way ahead. What am I?",
    answer: "black hole",
    hint: "I'm a celestial phenomenon."
  },
  {
    question: "I travel all the time, but stay in one place. I keep things in order and measure space. What am I?",
    answer: "coordinate system",
    hint: "I'm used for navigation and mapping."
  },
  {
    question: "I have a heart that never beats, I have a head but never weeps. I have arms but no hands. What am I?",
    answer: "robot",
    hint: "I'm an artificial being."
  },
  {
    question: "I can take you to other worlds, but I'm still just a book. What am I?",
    answer: "science fiction novel",
    hint: "I explore imaginative stories."
  }
];

let currentRiddleIndex = 0;
let score = 0;

// ... (rest of the code remains the same) ...
// Function to display the current riddle
function displayRiddle() {
  const riddleDisplay = document.getElementById('riddle-display');
  riddleDisplay.textContent = riddles[currentRiddleIndex].question;
}

// Function to display the hint
function displayHint() {
  const hintDisplay = document.getElementById('hint-display');
  hintDisplay.textContent = riddles[currentRiddleIndex].hint;
}

// Function to check the answer
function checkAnswer() {
  const answerInput = document.getElementById('answer-input');
  const resultDisplay = document.getElementById('result-display');
  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = riddles[currentRiddleIndex].answer.toLowerCase();

  if (userAnswer === correctAnswer) {
    resultDisplay.textContent = 'Correct!';
    score++;
    updateScoreDisplay();
    answerInput.value = '';
    nextRiddle();
  } else {
    resultDisplay.textContent = 'Incorrect. Try again.';
  }
}

// Function to update the score display
function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('score-display');
  scoreDisplay.textContent = `Score: ${score}`;
}

// Function to move to the next riddle
function nextRiddle() {
  currentRiddleIndex++;
  if (currentRiddleIndex < riddles.length) {
    displayRiddle();
    clearHint();
  } else {
    alert('Congratulations! You have completed all the riddles.');
  }
}

// Function to clear the hint display
function clearHint() {
  const hintDisplay = document.getElementById('hint-display');
  hintDisplay.textContent = '';
}

// Event listener for the submit button
const submitBtn = document.getElementById('submit-btn');
submitBtn.addEventListener('click', checkAnswer);

// Event listener for the hint button
const hintBtn = document.getElementById('hint-btn');
hintBtn.addEventListener('click', displayHint);

// Display the first riddle
displayRiddle();