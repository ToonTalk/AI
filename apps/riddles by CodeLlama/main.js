const r = [
    "What is the name of the planet where all life begins?",
    "In what year did humans first set foot on the moon?",
    "Which famous scientist predicted that the universe would one day be dominated by robots?"
];
const riddles = [
    "What is the name of the planet where all life begins?",
    "In what year did humans first set foot on the moon?",
    "Which famous scientist predicted that the universe would one day be dominated by robots?"
];
let currentRiddleIndex = 0;

document.getElementById("nextRiddleButton").addEventListener("click", () => {
    const riddle = riddles[currentRiddleIndex];
    document.getElementById("riddleContainer").innerHTML = `<p>${riddle}</p>`;
    currentRiddleIndex++;
});

document.getElementById("showAnswersButton").addEventListener("click", () => {
    const answers = [
        "The answer is 'Earth'.",
        "The answer is '1969'.",
        "The answer is 'Grace Hopper'."
    ];
    document.getElementById("riddleContainer").innerHTML = `<p>${answers[currentRiddleIndex]}</p>`;
});