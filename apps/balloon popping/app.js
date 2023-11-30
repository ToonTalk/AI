const video = document.getElementById('webcam');

let currentColor = 'black'; // Default color

async function setupWebcam() {
    try {
        const constraints = { video: { width: 640, height: 480 }, audio: false };
        video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
    } catch (err) {
        console.error(err);
    }
}

setupWebcam();

async function loadHandposeModel() {
    const model = await handpose.load();
    return model;
}

async function detectFingerDirection(predictions) {
    if (predictions.length > 0) {
        const keypoints = predictions[0].landmarks;
        const indexFingerTip = keypoints[8];
        const indexFingerBase = keypoints[5];

        const directionVector = {
            x: indexFingerTip[0] - indexFingerBase[0],
            y: indexFingerTip[1] - indexFingerBase[1],
        };

        return directionVector;
    }

    return null;
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let drawing = false;

function draw(x, y, color) {
    if (!drawing) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}


document.addEventListener('DOMContentLoaded', async () => {
    const model = await loadHandposeModel();
    await setupWebcam();
    mainLoop(model);
});

function drawBalloon(ctx, x, y, radius, color) {
    // Draw the balloon
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw the curly string
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    for (let i = 0; i < 5; i++) {
        let dx = (i % 2 === 0 ? 1 : -1) * 5; // Alternate direction
        let dy = 10; // Length of each curl
        ctx.quadraticCurveTo(x + dx, y + radius + dy * i, x, y + radius + dy * (i + 1));
    }
    ctx.strokeStyle = color;
    ctx.stroke();
}

let balloons = [];

function createBalloon() {
    // Define an array of possible colors
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];

    // Select a random color from the array
    const color = colors[Math.floor(Math.random() * colors.length)];

    let balloon = {
        x: Math.random() * canvas.width, // Random horizontal position
        y: 0, // Start at the top of the canvas
        radius: 20, // Fixed radius, can be randomized
        color: color, // Use the random color
        speed: balloonSpeed // Use the variable Speed of falling
    };
    balloons.push(balloon);
}

setInterval(createBalloon, 2000); // Create a new balloon every 2000 milliseconds (2 seconds)

// Load the missed balloon sound
const missSound = new Audio('air-escape.mp3'); // Replace with the correct path to your sound file

function updateAndDrawBalloons(ctx) {
    for (let i = 0; i < balloons.length; i++) {
        let balloon = balloons[i];
        balloon.y += balloon.speed; // Move the balloon down
        drawBalloon(ctx, balloon.x, balloon.y, balloon.radius, balloon.color); // Draw the balloon

        // Check if the balloon is off the screen (missed)
        if (balloon.y - balloon.radius > canvas.height) {
            balloons.splice(i, 1);
            balloonsMissed++; // Increment missed counter
            updateCountsDisplay();

            // Play the missed sound
            missSound.play();

            i--; // Adjust the index since we removed an element
        }
    }
}

function updateCountsDisplay() {
    document.getElementById('popped').textContent = 'Popped: ' + balloonsPopped;
    document.getElementById('missed').textContent = 'Misses Left: ' + (MAX_MISSES - balloonsMissed);
}

let balloonsPopped = 0;
let balloonsMissed = 0;

// Load the pop sound
const popSound = new Audio('pop.wav'); 

function popBalloon(indexFingerX, indexFingerY) {
    for (let i = 0; i < balloons.length; i++) {
        let balloon = balloons[i];
        let dx = indexFingerX - balloon.x;
        let dy = indexFingerY - balloon.y;

        if (Math.sqrt(dx * dx + dy * dy) < balloon.radius) {
            balloons.splice(i, 1);
            balloonsPopped++;
            updateCountsDisplay();

            // Play the pop sound
            popSound.play();

            break;
        }
    }
}

const MAX_MISSES = 5; // Maximum allowed misses

function checkGameOver() {
    if (balloonsMissed >= MAX_MISSES) {
        alert("Game Over! You missed too many balloons.");
        resetGame();
    }
}

function resetGame() {
    balloonsPopped = 0;
    balloonsMissed = 0;
    balloons = []; // Clear the array of balloons

    updateCountsDisplay(); // Update the display to show reset counts

    // Optionally, restart the game loop or provide an option to start a new game
    // For example, if you have a startGame function: startGame();
}

let spawnRate = 2000; // Initial spawn rate in milliseconds (2 seconds)
let balloonSpeed = 2; // Initial speed of falling

function increaseDifficulty() {
    spawnRate *= 0.95; // Decrease spawn rate by 5%
    balloonSpeed *= 1.05; // Increase speed by 5%

    // Make sure the spawn rate doesn't get too fast
    if (spawnRate < 500) spawnRate = 500;
}

// Adjust spawn rate in your game loop or a separate timer
setInterval(createBalloon, spawnRate); // Use a variable spawn rate
setInterval(increaseDifficulty, 10000); // Increase difficulty every 10 seconds


async function mainLoop(model) { 
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const predictions = await model.estimateHands(video);

     if (predictions.length > 0) {
        const indexFingerTip = predictions[0].landmarks[8]; // Assuming this is the position of the index finger
        popBalloon(indexFingerTip[0], indexFingerTip[1]); // Check for pops
    }

    updateAndDrawBalloons(ctx);

    checkGameOver();

    requestAnimationFrame(() => mainLoop(model));
}





