const canvas = document.getElementById('turtleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 400;

let x = 200;
let y = 200;
let angle = 0;

ctx.lineJoin = 'round'; // Set line join to round
ctx.lineCap = 'round'; // Set line cap to round

function forward(length) {
    const newX = x + length * Math.cos(angle);
    const newY = y + length * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(newX, newY);
    ctx.stroke();
    x = newX;
    y = newY;
}

function right(degrees) {
    angle += degrees * Math.PI / 180;
}

function setHeading(degrees) {
    angle = degrees * Math.PI / 180;
}

function setColor(color) {
    ctx.strokeStyle = color;
}

function setPenSize(size) {
    ctx.lineWidth = size;
}

function repeat(times, action) {
    for (let i = 0; i < times; i++) {
        action();
    }
}

// Draw eight squares rotated around the center with specified color and pen size
function drawRotatedSquares(color, penSize) {
    setColor(color);
    setPenSize(penSize);
    for (let i = 0; i < 8; i++) {
        setHeading(i * 45);
        repeat(4, () => {
            forward(100);
            right(90);
        });
    }
}

// Draw two sets of squares
drawRotatedSquares("blue", 30); // First set: blue color, 30 pixels wide pen
drawRotatedSquares("yellow", 5); // Second set: yellow color, 5 pixels wide pen
