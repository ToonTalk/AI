// Array of riddles and their answers
const riddles = [
    {
        text: "What gets wetter the more it dries?",
        answer: "towel"
    },
    {
        text: "What can travel all around the world while staying in a corner?",
        answer: "stamp"
    },
    // Add more riddles here
];

let currentRiddleIndex = 0;
const riddleDisplay = document.getElementById("riddleDisplay");
const answerInput = document.getElementById("answerInput");
const submitButton = document.getElementById("submitButton");
const giveUpButton = document.getElementById("giveUpButton");
const feedbackDiv = document.getElementById("feedback");

// Display the first riddle
displayRiddle();

// Event listener for the submit button
submitButton.addEventListener("click", checkAnswer);

// Event listener for the give up button
giveUpButton.addEventListener("click", giveUpAnswer);

function displayRiddle() {
    try {
        const currentRiddle = riddles[currentRiddleIndex];
        if (!currentRiddle) {
            throw new Error("No more riddles available.");
        }
        riddleDisplay.textContent = currentRiddle.text;
        feedbackDiv.textContent = "";
        answerInput.value = "";
    } catch (error) {
        displayError(error.message);
    }
}

function checkAnswer() {
    try {
        const currentRiddle = riddles[currentRiddleIndex];
        const userAnswer = answerInput.value.trim().toLowerCase();

        if (userAnswer === currentRiddle.answer.toLowerCase()) {
            feedbackDiv.textContent = "Correct!";
            createFireworks();

            currentRiddleIndex++;
            if (currentRiddleIndex < riddles.length) {
                displayRiddle();
            } else {
                feedbackDiv.textContent = "Congratulations! You completed all the riddles.";
            }
        } else {
            feedbackDiv.textContent = "Incorrect. Try again!";
        }
    } catch (error) {
        displayError(error.message);
    }
}

function giveUpAnswer() {
    try {
        const currentRiddle = riddles[currentRiddleIndex];
        feedbackDiv.textContent = `The answer is: ${currentRiddle.answer}`;
    } catch (error) {
        displayError(error.message);
    }
}

function displayError(errorMessage) {
    feedbackDiv.textContent = `Error: ${errorMessage}`;
}

function createFireworks() {
    const fireworksContainer = document.createElement("div");
    fireworksContainer.style.position = "fixed";
    fireworksContainer.style.top = "0";
    fireworksContainer.style.left = "0";
    fireworksContainer.style.width = "100%";
    fireworksContainer.style.height = "100%";
    fireworksContainer.style.pointerEvents = "none";
    fireworksContainer.style.zIndex = "999";
    document.body.appendChild(fireworksContainer);

    const numParticles = 50;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement("div");
        particle.style.position = "absolute";
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.borderRadius = "50%";
        particle.style.width = "8px";
        particle.style.height = "8px";
        particle.style.opacity = "0";
        particle.style.transform = `translate(${Math.random() * window.innerWidth}px, ${window.innerHeight}px)`;
        fireworksContainer.appendChild(particle);
        particles.push(particle);
    }

    const animateFireworks = () => {
        particles.forEach((particle, index) => {
            const delay = index * 50;
            setTimeout(() => {
                particle.style.animation = `fireworks 2s ease-out forwards`;
                setTimeout(() => {
                    particle.style.opacity = "0";
                    particle.style.transform = `translate(${Math.random() * window.innerWidth}px, ${window.innerHeight}px)`;
                }, 2000);
            }, delay);
        });
    };

    animateFireworks();

    setTimeout(() => {
        fireworksContainer.remove();
    }, 2500);
}