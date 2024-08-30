let isMonitoring = false;
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
    window.addEventListener('devicemotion', detectBreathing);
}

function stopMonitoring() {
    window.removeEventListener('devicemotion', detectBreathing);
    calculateBreathingRate();
}

function detectBreathing(event) {
    const acceleration = event.acceleration.y;  // Assuming the phone is vertical in the pocket
    const threshold = 1.0;  // Increased threshold to reduce false positives
    const minTimeBetweenBreaths = 2000; // Minimum time in milliseconds between breaths (e.g., 2 seconds)

    const currentTime = Date.now();
    const timeDiff = currentTime - lastBreathTime;

    if (Math.abs(acceleration) > threshold && timeDiff > minTimeBetweenBreaths) {
        const timeDiffMinutes = timeDiff / 1000 / 60; // Convert time difference to minutes
        breathRates.push(1 / timeDiffMinutes);
        breathCount++;
        lastBreathTime = currentTime;
        calculateBreathingRate();
    }
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
