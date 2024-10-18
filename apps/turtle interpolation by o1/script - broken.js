// Get references to DOM elements
const program1Textarea = document.getElementById('program1');
const program2Textarea = document.getElementById('program2');
const parameterInput = document.getElementById('parameter');
const parameterValueSpan = document.getElementById('parameterValue');
const drawButton = document.getElementById('drawButton');
const animateButton = document.getElementById('animateButton');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const interpolatedProgramTextarea = document.getElementById('interpolatedProgram');
const minParameterInput = document.getElementById('minParameter');
const maxParameterInput = document.getElementById('maxParameter');

// Update parameter display
parameterInput.addEventListener('input', () => {
    parameterValueSpan.textContent = parameterInput.value;
    draw(); // Redraw whenever the parameter changes
});

// Update slider min and max when inputs change
minParameterInput.addEventListener('input', () => {
    parameterInput.min = minParameterInput.value;
});

maxParameterInput.addEventListener('input', () => {
    parameterInput.max = maxParameterInput.value;
});

// Define the Turtle class
class Turtle {
    constructor(ctx) {
        this.ctx = ctx;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.angle = 0; // Degrees
        this.isPenDown = true;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
    }

    forward(distance) {
        const rad = (Math.PI / 180) * this.angle;
        const newX = this.x + distance * Math.cos(rad);
        const newY = this.y + distance * Math.sin(rad);
        if (this.isPenDown) {
            this.ctx.lineTo(newX, newY);
        } else {
            this.ctx.moveTo(newX, newY);
        }
        this.x = newX;
        this.y = newY;
    }

    right(angle) {
        this.angle += angle;
    }

    left(angle) {
        this.angle -= angle;
    }

    penUp() {
        this.isPenDown = false;
    }

    penDown() {
        this.isPenDown = true;
    }
}

// Parsing functions
function parseProgram(programText) {
    const tokens = tokenize(programText);
    const { commands } = parseTokens(tokens);
    return { commands };
}

function tokenize(programText) {
    const regex = /\s*(repeat|\[|\]|forward|right|left|penUp|penDown|penwidth|pencolor|[\d\.]+)\s*/g;
    let tokens = [];
    let match;
    while ((match = regex.exec(programText)) !== null) {
        tokens.push(match[1]);
    }
    return tokens;
}

function parseTokens(tokens) {
    let commands = [];
    while (tokens.length > 0) {
        const token = tokens.shift();
        if (token === 'repeat') {
            const count = parseInt(tokens.shift());
            tokens.shift(); // Remove '['
            const { commands: repeatCommands } = parseTokens(tokens);
            commands.push({ command: 'repeat', count, commands: repeatCommands });
        } else if (token === ']') {
            break;
        } else if (['forward', 'right', 'left', 'penwidth'].includes(token)) {
            const value = parseFloat(tokens.shift());
            commands.push({ command: token, value });
        } else if (token === 'pencolor') {
            const r = parseFloat(tokens.shift());
            const g = parseFloat(tokens.shift());
            const b = parseFloat(tokens.shift());
            commands.push({ command: token, value: [r, g, b] });
        } else if (token === 'penUp' || token === 'penDown') {
            commands.push({ command: token });
        }
    }
    return { commands };
}

function unfoldRepeats(commands) {
    let unfolded = [];
    commands.forEach(cmd => {
        if (cmd.command === 'repeat') {
            for (let i = 0; i < cmd.count; i++) {
                unfolded = unfolded.concat(unfoldRepeats(cmd.commands));
            }
        } else {
            unfolded.push(cmd);
        }
    });
    return unfolded;
}

// Helper functions
function calculateCumulativeWork(commands) {
    let cumulativeWork = [];
    let totalWork = 0;
    commands.forEach(cmd => {
        let work = 0;
        if (cmd.command === 'forward') {
            work = Math.abs(cmd.value);
        } else if (cmd.command === 'right' || cmd.command === 'left') {
            work = Math.abs(cmd.value); // You can adjust this if needed
        } else {
            work = 0.1; // Small work value for other commands
        }
        totalWork += work;
        cumulativeWork.push(totalWork);
        cmd.work = work;
    });
    return { cumulativeWork, totalWork };
}

function interpolateCommand(cmd1, cmd2, t) {
    if (cmd1.command === cmd2.command) {
        if (['forward', 'right', 'left', 'penwidth'].includes(cmd1.command)) {
            const value1 = cmd1.value || 0;
            const value2 = cmd2.value || 0;
            const interpolatedValue = value1 * (1 - t) + value2 * t;
            return { command: cmd1.command, value: interpolatedValue, originalValues: [value1, value2] };
        } else if (cmd1.command === 'pencolor') {
            const color1 = cmd1.value || [0, 0, 0];
            const color2 = cmd2.value || [0, 0, 0];
            const interpolatedColor = color1.map((c1, idx) => c1 * (1 - t) + color2[idx] * t);
            return { command: 'pencolor', value: interpolatedColor, originalValues: [color1, color2] };
        } else {
            // For 'penUp', 'penDown', etc.
            return cmd1;
        }
    } else {
        // Handle mismatched commands
        const commandsSet = new Set([cmd1.command, cmd2.command]);
        if (commandsSet.has('penwidth')) {
            const value1 = cmd1.command === 'penwidth' ? cmd1.value : 1;
            const value2 = cmd2.command === 'penwidth' ? cmd2.value : 1;
            const interpolatedValue = value1 * (1 - t) + value2 * t;
            return { command: 'penwidth', value: interpolatedValue, originalValues: [value1, value2] };
        } else if (commandsSet.has('pencolor')) {
            const color1 = cmd1.command === 'pencolor' ? cmd1.value : [0, 0, 0];
            const color2 = cmd2.command === 'pencolor' ? cmd2.value : [0, 0, 0];
            const interpolatedColor = color1.map((c1, idx) => c1 * (1 - t) + color2[idx] * t);
            return { command: 'pencolor', value: interpolatedColor, originalValues: [color1, color2] };
        } else if (['forward', 'right', 'left'].some(cmd => commandsSet.has(cmd))) {
            const command = cmd1.command !== 'noop' ? cmd1.command : cmd2.command;
            const value1 = cmd1.value || 0;
            const value2 = cmd2.value || 0;
            const interpolatedValue = value1 * (1 - t) + value2 * t;
            return { command, value: interpolatedValue, originalValues: [value1, value2] };
        } else {
            // For 'penUp', 'penDown', etc.
            return cmd1.command !== 'noop' ? cmd1 : cmd2;
        }
    }
}

function buildInterpolatedCommands(commands1, commands2, t) {
    const { cumulativeWork: work1, totalWork: totalWork1 } = calculateCumulativeWork(commands1);
    const { cumulativeWork: work2, totalWork: totalWork2 } = calculateCumulativeWork(commands2);

    const totalWork = Math.max(totalWork1, totalWork2);
    const steps = 100; // Number of interpolation steps

    let interpolatedCommands = [];

    let i1 = 0;
    let i2 = 0;

    for (let s = 0; s < steps; s++) {
        const progress = (s / steps) * totalWork;
        const targetWork1 = progress * (1 - t);
        const targetWork2 = progress * t;

        // Find the index in commands1 corresponding to targetWork1
        while (i1 < work1.length - 1 && work1[i1] < targetWork1) {
            i1++;
        }
        // Find the index in commands2 corresponding to targetWork2
        while (i2 < work2.length - 1 && work2[i2] < targetWork2) {
            i2++;
        }

        const cmd1 = commands1[i1];
        const cmd2 = commands2[i2];

        const interpolatedCmd = interpolateCommand(cmd1, cmd2, t);
        interpolatedCommands.push(interpolatedCmd);
    }

    return interpolatedCommands;
}

function executeCommands(turtle, commands) {
    const ctx = turtle.ctx;
    let penwidth = 1;
    let pencolor = [0, 0, 0];

    commands.forEach(cmd => {
        switch (cmd.command) {
            case 'forward':
                turtle.forward(cmd.value);
                break;
            case 'right':
                turtle.right(cmd.value);
                break;
            case 'left':
                turtle.left(cmd.value);
                break;
            case 'penUp':
                turtle.penUp();
                break;
            case 'penDown':
                turtle.penDown();
                break;
            case 'penwidth':
                penwidth = cmd.value;
                ctx.lineWidth = penwidth;
                break;
            case 'pencolor':
                pencolor = cmd.value;
                ctx.strokeStyle = `rgb(${pencolor[0]}, ${pencolor[1]}, ${pencolor[2]})`;
                break;
            default:
                // 'noop' and others
                break;
        }
    });
}

function displayInterpolatedProgram(commands, t) {
    const programText = commands.map(cmd => {
        if (cmd.command === 'pencolor') {
            const [color1, color2] = cmd.originalValues;
            const valueStr = color1.map((v, idx) => `from ${v.toFixed(2)} to ${color2[idx].toFixed(2)}`).join(', ');
            return `Pencolor interpolate t=${t.toFixed(2)} ${valueStr}`;
        } else if (cmd.command === 'penwidth') {
            const [value1, value2] = cmd.originalValues.map(v => v.toFixed(2));
            return `Penwidth interpolate t=${t.toFixed(2)} from ${value1} to ${value2}`;
        } else if (cmd.originalValues) {
            const [value1, value2] = cmd.originalValues.map(v => v.toFixed(2));
            return `${cmd.command.charAt(0).toUpperCase() + cmd.command.slice(1)} interpolate t=${t.toFixed(2)} from ${value1} to ${value2}`;
        } else if (cmd.command === 'noop') {
            return `Noop`;
        } else {
            return `${cmd.command.charAt(0).toUpperCase() + cmd.command.slice(1)}`;
        }
    }).join('\n');
    interpolatedProgramTextarea.value = programText;
}

// Draw function
function draw() {
    const programText1 = program1Textarea.value;
    const programText2 = program2Textarea.value;
    const t = parseFloat(parameterInput.value);

    // Parse and unfold programs
    const { commands: commands1 } = parseProgram(programText1);
    const { commands: commands2 } = parseProgram(programText2);

    const unfoldedCommands1 = unfoldRepeats(commands1);
    const unfoldedCommands2 = unfoldRepeats(commands2);

    // Build interpolated commands using the cumulative work approach
    const interpolatedCommands = buildInterpolatedCommands(unfoldedCommands1, unfoldedCommands2, t);

    // Display interpolated program
    displayInterpolatedProgram(interpolatedCommands, t);

    // Execute interpolated commands
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const turtle = new Turtle(ctx);
    executeCommands(turtle, interpolatedCommands);
    ctx.stroke();
}

// Draw button event listener
drawButton.addEventListener('click', draw);

// Animate button functionality
let animationFrameId;
let isAnimating = false;

function animate() {
    if (isAnimating) {
        cancelAnimationFrame(animationFrameId);
        isAnimating = false;
        animateButton.textContent = 'Animate';
    } else {
        isAnimating = true;
        animateButton.textContent = 'Stop';
        let startTime = null;
        const minT = parseFloat(minParameterInput.value);
        const maxT = parseFloat(maxParameterInput.value);

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const duration = 5000; // 5 seconds for a full cycle
            const t = minT + ((maxT - minT) * ((elapsed % duration) / duration));
            parameterInput.value = t.toFixed(2);
            parameterValueSpan.textContent = parameterInput.value;
            draw();
            animationFrameId = requestAnimationFrame(step);
        }

        animationFrameId = requestAnimationFrame(step);
    }
}

animateButton.addEventListener('click', animate);
