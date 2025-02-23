const video = document.getElementById('webcam');

let currentColor = 'black'; // Default color

async function setupWebcam() {
    try {
        // First list available devices to help with debugging
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices:', videoDevices);

        const constraints = {
            video: {
                width: 640,
                height: 480
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
    } catch (err) {
        console.error('Webcam setup error:', err.name, err.message);
        switch (err.name) {
            case 'NotAllowedError':
                alert('Camera access was denied. Please check your browser permissions.');
                break;
            case 'NotFoundError':
                alert('No camera device was found. Please check your camera connection.');
                break;
            case 'NotReadableError':
                alert('Camera is in use by another application.');
                break;
            default:
                alert('Error accessing camera: ' + err.message);
        }
        throw err;
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
let offCounter = 0; // Counts frames where the finger is not in drawing position

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

async function mainLoop(model) {
    const predictions = await model.estimateHands(video);
    const directionVector = await detectFingerDirection(predictions);

    if (directionVector && predictions.length > 0) {
        const indexFingerTip = predictions[0].landmarks[8];
        const x = indexFingerTip[0];
        const y = indexFingerTip[1];

        // Define thresholds: lower threshold to start drawing and a higher threshold to stop drawing
        const thresholdStart = -10;  // More negative means finger clearly pointing up
        const thresholdStop = -5;    // Less negative means less upward

        // If not already drawing, check if we should start
        if (!drawing && directionVector.y < thresholdStart) {
            drawing = true;
            offCounter = 0;
        }

        // If drawing, check if we should continue or eventually stop
        if (drawing) {
            if (directionVector.y > thresholdStop) {
                offCounter++; // Increase counter if finger isn’t clearly pointing up
            } else {
                offCounter = 0; // Reset counter when finger is in proper position
            }

            // Only stop drawing if the condition persists for a few frames
            if (offCounter > 3) {
                drawing = false;
                ctx.beginPath();
            } else {
                draw(x, y, currentColor);
            }
        } else {
            ctx.beginPath();
        }
    }
    requestAnimationFrame(() => mainLoop(model));
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
        
            document.getElementById('last-spoken').textContent = `Last spoken: ${transcript}`;
            document.getElementById('current-color').textContent = `Current color: ${currentColor}`;
        };
        recognition.start();
    }
    await setupWebcam();
    mainLoop(model);
});
