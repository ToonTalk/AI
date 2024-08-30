let isMonitoring = false;
let audioContext, microphone, analyser, dataArray;
let breathCount = 0;
let lastBreathTime = Date.now();
let breathRates = [];

const startStopBtn = document.getElementById('startStopBtn');
const rateDisplay = document.getElementById('rate');
const adviceDisplay = document.getElementById('advice');

function startMonitoring() {
    breathCount = 0;
    breathRates = [];
    lastBreathTime = Date.now();

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            monitorBreathing();
        })
        .catch(err => {
            console.error('Error accessing the microphone: ', err);
        });
}

function stopMonitoring() {
    if (microphone) {
        microphone.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }
    calculateBreathingRate();
}

function monitorBreathing() {
    if (!isMonitoring) return;

    analyser.getByteTimeDomainData(dataArray);
    const threshold = 150;  // Adjust this based on your testing
    const currentTime = Date.now();
    const timeDiff = currentTime - lastBreathTime;

    const maxAmplitude = Math.max(...dataArray);

    if (maxAmplitude > threshold && timeDiff > 2000) {  // Detect peaks that are above the threshold
        const timeDiffMinutes = timeDiff / 1000 / 60;
        breathRates.push(1 / timeDiffMinutes);
        breathCount++;
        lastBreathTime = currentTime;
        calculateBreathingRate();
    }

    requestAnimationFrame(monitorBreathing);
}

function calculateBreathingRate() {
    if (breathRates.length > 0) {
        const averageBreathingRate = breathRates.reduce((a, b) => a + b, 0) / breathRates.length;
        rateDisplay.textContent = `Breaths per Minute: ${Math.round(averageBreathingRate)}`;
        giveAdvice(averageBreathingRate);
    }
}

function giveAdvice(breathingRate) {
    let advice = "";
    if (breathingRate > 20) {
        advice = "Your breathing seems rapid. Try taking deep, slow breaths.";
    } else if (breathingRate < 12) {
        advice = "Your breathing is quite slow. Consider taking deeper breaths.";
    } else {
        advice = "Your breathing rate is normal.";
    }
    adviceDisplay.textContent = advice;
}

startStopBtn.addEventListener('click', () => {
    isMonitoring = !isMonitoring;
    startStopBtn.textContent = isMonitoring ? "Stop" : "Start";
    if (isMonitoring) {
        startMonitoring();
    } else {
        stopMonitoring();
    }
});
