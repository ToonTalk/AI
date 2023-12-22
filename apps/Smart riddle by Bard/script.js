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
{
  question: "I am full of holes, but I can still hold water. What am I?",
  hints: [
    "I absorb liquids but keep my shape.",
    "I'm often used in the kitchen or bathroom, and I come in many different shapes and sizes. Squeezing me releases the water I hold.",
    "I have countless tears, but never cry. Though riddled with gaps, I keep secrets inside.",
    "Though tiny my pores, I soak up more and more. I'm soft to the touch, but leave floors feeling squish."
  ],
  answer: "A sponge"
},
{
  question: "What has an eye but cannot see, a mouth but cannot speak, and a head but cannot think?",
  hints: [
    "I guide, but without sight or voice.",
    "I have a sharp tongue, but taste nothing. I guide through fabric, but never journey myself.",
    "I have a piercing gaze, but no vision to explore. My voice whispers directions, but my lips never move.",
    "With a point that's keen, I thread worlds unseen. I lead the way, silent and sly, through cloth and yarn as I fly."
  ],
  answer: "A needle"
},
{
    question: "I am taller than the tallest tree, but I have no roots. I am heavier than the heaviest elephant, but I have no weight. What am I?",
    hints: [
      "I cling to you, but have no form of my own.",
      "I dance with the sun, but never touch the ground. I stretch endlessly, but hold no substance.",
      "I'm a cloaked companion, always by your side. I mirror your form, but remain unseen at night.",
      "No branches I boast, just darkness I paint. I cling to your steps, a whispering faint. Though towering high, I weigh not a feather. Your elusive twin, in all shades of weather."
    ],
    answer: "Your shadow"
  },
  {
    question: "I am always hungry, but I never eat. I speak without a mouth, and hear without ears. What am I?",
    hints: [
      "My pages lie flat, but my chapters unfold.",
      "I come in many spines, but never feel a touch.",
      "Though silent on my own, I voice every sound.",
      "Hungry for minds, I feast on curiosity.",
      "Ink is my blood, and knowledge my soul."
    ],
    answer: "A book"
  },
  {
    question: "I am always coming, but never arrive. I am always present, but never here. I am always moving, but never travel. What am I?",
    hints: [
      "I tick and I tock, but own no clock. I sculpt moments, but carve no stone.",
      "I'm a relentless river, flowing but never reaching the sea. I paint the canvas of life, with brushstrokes of mystery.",
      "Ever approaching, yet ever away, I mark your footsteps, each passing day. Though swift in my stride, I leave no trace, Only memories whispered, in time's endless space."
    ],
    answer: "Time"
  },
  {
    question: "What has one head, one foot, and four legs?",
    hints: [
      "I offer slumber, but never close my eyes.",
      "I welcome dreams, both happy and wise.",
      "Though steadfast I stand, I never truly walk.",
      "With sheets and blankets, I provide comfort and talk."
    ],
    answer: "A bed"
  },
  {
    question: "I am born cold, I live hot, and I die wet. What am I?",
    hints: [
      "I transform through heat, but end in moisture.",
      "I rise from flames, but melt with a tear.",
      "Golden and crusty, a fluffy frontier.",
      "Nourishment I bring, young and old I please.",
      "But water's embrace seals my final release."
    ],
    answer: "Bread"
  },
];

document.getElementById("checkAnswerButton").disabled = true;
document.getElementById("checkAnswerButton").classList.add("disabled");

// Functions to display riddle, hint, and answer
const displayRiddle = () => {
  const randomIndex = Math.floor(Math.random() * riddles.length);
  const riddle = riddles[randomIndex];
  speakText(riddle.question); // Speak the riddle aloud
  document.getElementById("riddle").textContent = riddle.question;
  document.getElementById("hints").textContent = ""; // reset hints before displaying new ones
};

function speakText(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  } else {
    console.error('Text-to-speech not supported in this browser.');
  }
}

const displayHint = () => {
  const riddle = riddles.find((r) => r.question === document.getElementById("riddle").textContent);

  // Select a random hint that hasn't been displayed yet:
  const availableHints = riddle.hints.filter((hint) => !currentHints.includes(hint));
  const randomHintIndex = Math.floor(Math.random() * availableHints.length);
  const newHint = availableHints[randomHintIndex];

  // Update the hints display:
  document.getElementById("hints").textContent = currentHints + " " + newHint;
  speakText(newHint);

  // Mark the hint as displayed:
  currentHints = currentHints.concat(" ", newHint);
};

const displayAnswer = () => {
  const riddle = riddles.find((r) => r.question === document.getElementById("riddle").textContent);
  document.getElementById("hints").textContent = "The answer is: " + riddle.answer;
  speakText(riddle.answer);
};

// Add function for new riddle button
const getNewRiddle = () => {
  displayRiddle();
  document.getElementById("hints").textContent = ""; // reset hints for new riddle
};

// Declare the model variable outside of both functions
let model; // Declare model globally

async function loadModel() {
  try {
    model = await use.load();
    document.getElementById("checkAnswerButton").disabled = false; // Enable button
    document.getElementById("checkAnswerButton").classList.remove("disabled"); // Remove disabled class
  } catch (error) {
    console.log("failed to load model " + error);
  }
}

// Call the loadModel function to initiate model loading
loadModel();

async function checkAnswer() {
  try {
    await model; // Ensure model is loaded

    const userAnswer = document.getElementById("userAnswer").value.toLowerCase();
    const currentRiddle = riddles.find((r) => r.question === document.getElementById("riddle").textContent);

    const userAnswerEmbedding = await model.embed([userAnswer]);
    const correctAnswerEmbedding = await model.embed([currentRiddle.answer.toLowerCase()]);

    const similarity = await tf.losses.cosineDistance(userAnswerEmbedding, correctAnswerEmbedding);
    const similarityScore = 1 - similarity.dataSync()[0];

    if (similarityScore > 0.65) { // Threshold for "correct" answers
      document.getElementById("hints").textContent = "Correct!";
      speakText("Correct!");
    } else if (similarityScore > 0.5) { // Threshold for "close" answers
      document.getElementById("hints").textContent = "Close, but not quite. Try again!";
      speakText("Close, but not quite. Try again!");
    } else {
      document.getElementById("hints").textContent = "Not quite. Keep thinking!"; // Or provide more specific feedback
      speakText("Not quite. Keep thinking!");
    }
  } catch (error) {
    console.error('Error using the model:', error);
    speakText('Error using the model');
    // Display a user-friendly error message
  }
}

async function startListening() {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Listen for single utterances
    recognition.interimResults = false; // Wait for final transcript
    recognition.lang = 'en-US'; // Set language (adjust as needed)

    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      document.getElementById("userAnswer").value = transcript;
      // Check the answer immediately
      checkAnswer();
    };

    recognition.start();
  } else {
    console.error('Speech recognition not supported in this browser.');
  }
}

// Display a riddle on page load
displayRiddle();

// Add event listeners to buttons
document.getElementById("checkAnswerButton").addEventListener("click", checkAnswer);
document.getElementById("startListeningButton").addEventListener("click", startListening);
document.getElementById("hintButton").addEventListener("click", displayHint);
document.getElementById("answerButton").addEventListener("click", displayAnswer);
document.getElementById("newRiddleButton").addEventListener("click", getNewRiddle);