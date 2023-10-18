const canvas = document.getElementById('carCanvas');
const ctx = canvas.getContext('2d');

// Car properties
const car = {
    x: (3 * canvas.width / 4) - 35, // Starting in the center of the right lane
    y: canvas.height - 150,
    width: 70,
    height: 110,
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.05,
    steering: 0,    // Updated to represent the steering angle, 0 means straight
    maxSteering: 0.02, // Maximum change of heading per frame
    rotation: 0,  // Represents the current rotation angle of the car
};

const computerCar = {
     x: 210 + ((canvas.width - 420) / 4), // center of the left lane
    y: 0,
    width: 70,
    height: 110,
    speed: 3,  // Constant speed for simplicity
    rotation: Math.PI  // Pointing downwards (180 degrees in radians)
};

const log = [];
let currentAction = null;
const gameStartTime = performance.now();  // time since game started

function drawRoad() {
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dual road with gray color
    ctx.fillStyle = 'gray';
    ctx.fillRect(200, 0, (canvas.width - 400) / 2, canvas.height); // Left lane
    ctx.fillRect((canvas.width / 2) + 10, 0, (canvas.width - 400) / 2, canvas.height); // Right lane

    // Dashed center line for the two-way traffic
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawCar() {
    ctx.save();

    // Translate to the car's center
    ctx.translate(car.x, car.y);

    // Rotate the canvas to the car's rotation angle
    ctx.rotate(car.rotation);

    // Draw the car. Note that we adjust the x and y to account for the new translation
    ctx.fillStyle = 'blue';
    ctx.fillRect(-car.width/2, -car.height/2, car.width, car.height);

    // Wheels
    ctx.fillStyle = 'black';
    ctx.fillRect(-car.width/2 + 5, -car.height/2 + 10, 15, 40);
    ctx.fillRect(car.width/2 - 20, -car.height/2 + 10, 15, 40);
    ctx.fillRect(-car.width/2 + 5, car.height/2 - 50, 15, 40);
    ctx.fillRect(car.width/2 - 20, car.height/2 - 50, 15, 40);

    ctx.restore();  // Restore the state
}

function drawComputerCar() {
    ctx.save();
    ctx.translate(computerCar.x, computerCar.y);
    ctx.rotate(computerCar.rotation);

    // Draw the computer-controlled car. It's colored red for distinction.
    ctx.fillStyle = 'red';
    ctx.fillRect(-computerCar.width/2, -computerCar.height/2, computerCar.width, computerCar.height);

    // Wheels
    ctx.fillStyle = 'black';
    ctx.fillRect(-computerCar.width/2 + 5, -computerCar.height/2 + 10, 15, 40);
    ctx.fillRect(computerCar.width/2 - 20, -computerCar.height/2 + 10, 15, 40);
    ctx.fillRect(-computerCar.width/2 + 5, computerCar.height/2 - 50, 15, 40);
    ctx.fillRect(computerCar.width/2 - 20, computerCar.height/2 - 50, 15, 40);

    ctx.restore();
}

function updateLog(action) {
    const currentTime = performance.now() - gameStartTime;

    if (currentAction) {
        if (currentAction.action !== action) {  // Only log when action changes
            currentAction.endTime = currentTime;
            log.push(currentAction);
            currentAction = null;
        }
    }

    if (action && !currentAction) {
        currentAction = {
            action,
            startTime: currentTime,
            endTime: null
        };
    }

    const logDiv = document.getElementById('actionLog');
    logDiv.innerHTML = '';
    log.forEach(entry => {
        logDiv.innerHTML += `${entry.action}: ${entry.startTime.toFixed(2)}ms - ${entry.endTime ? entry.endTime.toFixed(2) + "ms" : "ongoing"}<br>`;
    });
}

function update() {
    car.y -= car.speed * Math.cos(car.rotation);  // Use rotation for movement direction
    car.x += car.speed * Math.sin(car.rotation);

    // Update the car's rotation based on the steering
    car.rotation += car.steering;

    // Keep car within the road boundaries
    if(car.x < 210 + car.width/2) car.x = 210 + car.width/2;
    if(car.x > canvas.width - 210 - car.width/2) car.x = canvas.width - 210 - car.width/2;

    // Update computer-controlled car's position
    computerCar.y += computerCar.speed;  // It's moving downwards, so we're adding to the y coordinate
    if (computerCar.y > canvas.height) {
        computerCar.y = -computerCar.height;  // Reset its position to the top if it goes out of the canvas at the bottom
    }

    drawRoad();
    drawComputerCar();
    drawCar();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'ArrowUp':
            car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
            updateLog("Accelerated");
            break;
        case 'ArrowDown':
            car.speed = Math.max(car.speed - car.acceleration, 0);
            updateLog("Braked");
            break;
        case 'ArrowLeft':
            car.steering = -car.maxSteering * car.speed;  // Turn left based on speed
            updateLog("Steered Left");
            break;
        case 'ArrowRight':
            car.steering = car.maxSteering * car.speed;  // Turn right based on speed
            updateLog("Steered Right");
            break;
        }
});

// Update keyup event listener to stop turning
document.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            car.steering = 0;  // Stop changing the steering angle
            updateLog(null);
            break;
    }
});


update();
