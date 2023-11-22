const video = document.getElementById('webcam');

let currentColor = 'black'; // Default color

async function setupWebcam() {
    try {
        const constraints = { video: { width: 640, height: 480 } };
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

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser.');
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    return recognition;
}

function extractColor(transcript) {
    // Define a list of supported colors
    const colors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'black', 'white'];

    const words = transcript.toLowerCase().split(' ');
    for (const word of words) {
        if (colors.includes(word)) {
            return word;
        }
    }

    return null;
}

document.addEventListener('DOMContentLoaded', async () => {
    const model = await loadHandposeModel();
    const recognition = setupSpeechRecognition();
    if (recognition) {
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            const extractedColor = extractColor(transcript);
        
            if (extractedColor) {
                currentColor = extractedColor;
            }
        
            // Update the content of the last spoken and current color elements
            document.getElementById('last-spoken').textContent = `Last spoken: ${transcript}`;
            document.getElementById('current-color').textContent = `Current color: ${currentColor}`;
        };
        recognition.start();
    }
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
        speed: 2 // Speed of falling
    };
    balloons.push(balloon);
}

setInterval(createBalloon, 2000); // Create a new balloon every 2000 milliseconds (2 seconds)

function updateAndDrawBalloons(ctx) {
    for (let i = 0; i < balloons.length; i++) {
        let balloon = balloons[i];
        balloon.y += balloon.speed; // Move the balloon down
        drawBalloon(ctx, balloon.x, balloon.y, balloon.radius, balloon.color); // Draw the balloon

        // Remove balloon if it goes off the bottom of the canvas
        if (balloon.y - balloon.radius > canvas.height) {
            balloons.splice(i, 1);
            i--; // Adjust the index since we removed an element
        }
    }
}

function popBalloon(indexFingerX, indexFingerY) {
    for (let i = 0; i < balloons.length; i++) {
        let balloon = balloons[i];
        let dx = indexFingerX - balloon.x;
        let dy = indexFingerY - balloon.y;
        // Check if the distance between the finger and the balloon is less than the radius; if so, it's a pop!
        if (Math.sqrt(dx * dx + dy * dy) < balloon.radius) {
            // Balloon is popped, remove it from the array
            balloons.splice(i, 1);
            // Here you can increase the score or play a sound
            // For example: score++;
            // Play sound: new Audio('pop_sound.mp3').play();
            break; // Break the loop after popping to avoid skipping checks
        }
    }
}

async function mainLoop(model) { 
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const predictions = await model.estimateHands(video);

     if (predictions.length > 0) {
        const indexFingerTip = predictions[0].landmarks[8]; // Assuming this is the position of the index finger
        popBalloon(indexFingerTip[0], indexFingerTip[1]); // Check for pops
    }

    updateAndDrawBalloons(ctx);

    requestAnimationFrame(() => mainLoop(model));
}










