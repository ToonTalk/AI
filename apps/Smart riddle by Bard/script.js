const riddles = [
  {
    question: "What has to be broken before you can use it?",
    hints: ["It's often seen in breakfast", "It's often white or brown"],
    answer: "An egg",
  },
  {
    question: "What is always coming, but never arrives?",
    hints: ["It's related to time", "You can't catch it"],
    answer: "Tomorrow",
  },
  {
    question: "What has a neck without a head, a body without a leg?",
    hints: ["It's typically made of glass", "It holds liquids"],
    answer: "A bottle",
  },
];

// Functions to display riddle, hint, and answer
const displayRiddle = () => {
  const randomIndex = Math.floor(Math.random() * riddles.length);
  const riddle = riddles[randomIndex];
  document.getElementById("riddle").textContent = riddle.question;
  document.getElementById("hints").textContent = ""; // reset hints before displaying new ones
};

const displayHint = () => {
  const riddle = riddles.find((r) => r.question === document.getElementById("riddle").textContent);
  const randomHintIndex = Math.floor(Math.random() * riddle.hints.length);
  const currentHints = document.getElementById("hints").textContent;
  document.getElementById("hints").textContent = currentHints + " " + riddle.hints[randomHintIndex];
};

const displayAnswer = () => {
  const riddle = riddles.find((r) => r.question === document.getElementById("riddle").textContent);
  document.getElementById("hints").textContent = "The answer is: " + riddle.answer;
};

// Add function for new riddle button
const getNewRiddle = () => {
  displayRiddle();
  document.getElementById("hints").textContent = ""; // reset hints for new riddle
};

// Load model asynchronously
async function loadModel() {
  model = await tf.loadGraphModel('https://tfhub.dev/google/universal-sentence-encoder/4');
}

// Call the loadModel function to initiate model loading
loadModel();

async function checkAnswer() {
  // Wait for the model to load before proceeding
  await model; // Ensure model is loaded before use

  const userAnswer = document.getElementById("userAnswer").value.toLowerCase();
  const currentRiddle = riddles.find((r) => r.question === document.getElementById("riddle").textContent);

  // Encode user answer and correct answer
  const userAnswerEmbedding = await model.executeAsync(tf.expandDims([userAnswer]));
  const correctAnswerEmbedding = await model.executeAsync(tf.expandDims([currentRiddle.answer.toLowerCase()]));

  // Calculate cosine similarity
  const similarity = await tf.losses.cosineDistance(userAnswerEmbedding, correctAnswerEmbedding);
  const similarityScore = 1 - similarity.dataSync()[0]; // Convert to similarity score

  if (similarityScore > 0.75) { // Adjust threshold as needed
    document.getElementById("hints").textContent = "Correct!";
  } else {
    document.getElementById("hints").textContent = "Close, but not quite. Try again!";
  }
}

// Display a riddle on page load
displayRiddle();

// Add event listeners to buttons
document.getElementById("checkAnswerButton").addEventListener("click", checkAnswer);
document.getElementById("hintButton").addEventListener("click", displayHint);
document.getElementById("answerButton").addEventListener("click", displayAnswer);
document.getElementById("newRiddleButton").addEventListener("click", getNewRiddle);