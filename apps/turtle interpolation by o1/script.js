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

// Parsing functions (parseProgram, tokenize, parseTokens, unfoldRepeats)
function parseProgram(programText) {
    const tokens = tokenize(programText);
    const { commands, properties } = parseTokens(tokens);
    return { commands, properties };
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
    let properties = { penwidth: 1, pencolor: [0, 0, 0] };
    while (tokens.length > 0) {
        const token = tokens.shift();
        if (token === 'repeat') {
            const count = parseInt(tokens.shift());
            tokens.shift(); // Remove '['
            const { commands: repeatCommands } = parseTokens(tokens);
            commands.push({ command: 'repeat', count, commands: repeatCommands });
        } else if (token === ']') {
            break;
        } else if (['forward', 'right', 'left'].includes(token)) {
            const value = parseFloat(tokens.shift());
            commands.push({ command: token, value });
        } else if (token === 'penwidth') {
            const value = parseFloat(tokens.shift());
            properties.penwidth = value;
        } else if (token === 'pencolor') {
            const r = parseFloat(tokens.shift());
            const g = parseFloat(tokens.shift());
            const b = parseFloat(tokens.shift());
            properties.pencolor = [r, g, b];
        } else if (token === 'penUp' || token === 'penDown') {
            commands.push({ command: token });
        }
    }
    return { commands, properties };
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

// Helper functions (gcd, lcm)
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
    return a * b / gcd(a, b);
}

// Splitting and aligning functions
function splitCommands(commands, splitFactor) {
    let splitCommands = [];
    commands.forEach(cmd => {
        if (cmd.command === 'forward' || cmd.command === 'right' || cmd.command === 'left') {
            const splitValue = cmd.value / splitFactor;
            for (let i = 0; i < splitFactor; i++) {
                splitCommands.push({ command: cmd.command, value: splitValue });
            }
        } else {
            splitCommands.push(cmd);
        }
    });
    return splitCommands;
}

function interleaveCommands(commands) {
    let interleavedCommands = [];
    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        if (cmd.command === 'forward') {
            interleavedCommands.push(cmd);
            if (i + 1 < commands.length && (commands[i + 1].command === 'right' || commands[i + 1].command === 'left')) {
                i++;
                interleavedCommands.push(commands[i]);
            } else {
                interleavedCommands.push({ command: 'right', value: 0 });
            }
        } else if (cmd.command === 'right' || cmd.command === 'left') {
            interleavedCommands.push({ command: 'forward', value: 0 });
            interleavedCommands.push(cmd);
        } else {
            interleavedCommands.push(cmd);
        }
    }
    return interleavedCommands;
}

function alignCommands(commands1, commands2) {
    const maxLength = Math.max(commands1.length, commands2.length);
    const aligned1 = padCommands(commands1, maxLength);
    const aligned2 = padCommands(commands2, maxLength);
    return { aligned1, aligned2 };
}

function padCommands(commands, length) {
    const paddedCommands = [...commands];
    while (paddedCommands.length < length) {
        paddedCommands.push({ command: 'forward', value: 0 });
        paddedCommands.push({ command: 'right', value: 0 });
    }
    return paddedCommands;
}

// Interpolation function
function interpolateCommands(commands1, commands2, t) {
    const interpolatedCommands = [];
    for (let i = 0; i < commands1.length; i++) {
        const cmd1 = commands1[i] || { command: 'forward', value: 0 };
        const cmd2 = commands2[i] || { command: 'forward', value: 0 };
        if (cmd1.command === cmd2.command) {
            const value1 = cmd1.value || 0;
            const value2 = cmd2.value || 0;
            const interpolatedValue = value1 * (1 - t) + value2 * t;
            interpolatedCommands.push({
                command: cmd1.command,
                value: interpolatedValue,
                originalValues: [value1, value2],
            });
        } else {
            interpolatedCommands.push({ command: cmd1.command, value: 0, originalValues: [cmd1.value || 0, 0] });
        }
    }
    return interpolatedCommands;
}

function executeCommands(turtle, commands) {
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
            // penwidth and pencolor are applied globally before drawing
        }
    });
}

function displayInterpolatedProgram(commands, t, penwidth, pencolor) {
    let programText = `Penwidth interpolate t=${t.toFixed(2)} to ${penwidth.toFixed(2)}\n`;
    programText += `Pencolor interpolate t=${t.toFixed(2)} to ${pencolor.map(c => c.toFixed(2)).join(', ')}\n`;
    programText += commands.map(cmd => {
        const [value1, value2] = cmd.originalValues ? cmd.originalValues.map(v => v.toFixed(2)) : [0, 0];
        return `${cmd.command.charAt(0).toUpperCase() + cmd.command.slice(1)} interpolate t=${t.toFixed(2)} from ${value1} to ${value2}`;
    }).join('\n');
    interpolatedProgramTextarea.value = programText;
}

// Draw function
function draw() {
    const programText1 = program1Textarea.value;
    const programText2 = program2Textarea.value;
    const t = parseFloat(parameterInput.value);

    // Parse and unfold programs
    const { commands: commands1, properties: properties1 } = parseProgram(programText1);
    const { commands: commands2, properties: properties2 } = parseProgram(programText2);

    const unfoldedCommands1 = unfoldRepeats(commands1);
    const unfoldedCommands2 = unfoldRepeats(commands2);

    // Calculate the split factor
    const movements1 = unfoldedCommands1.filter(cmd => cmd.command === 'forward' || cmd.command === 'right' || cmd.command === 'left');
    const movements2 = unfoldedCommands2.filter(cmd => cmd.command === 'forward' || cmd.command === 'right' || cmd.command === 'left');
    const totalMovements = lcm(movements1.length, movements2.length);

    const splitFactor1 = totalMovements / movements1.length;
    const splitFactor2 = totalMovements / movements2.length;

    // Split and interleave commands
    const splitCommands1 = interleaveCommands(splitCommands(unfoldedCommands1, splitFactor1));
    const splitCommands2 = interleaveCommands(splitCommands(unfoldedCommands2, splitFactor2));

    // Align commands
    const { aligned1, aligned2 } = alignCommands(splitCommands1, splitCommands2);

    // Interpolate penwidth and pencolor
    const penwidth1 = properties1.penwidth || 1;
    const penwidth2 = properties2.penwidth || 1;
    const interpolatedPenwidth = penwidth1 * (1 - t) + penwidth2 * t;

    const pencolor1 = properties1.pencolor || [0, 0, 0];
    const pencolor2 = properties2.pencolor || [0, 0, 0];
    const interpolatedPencolor = pencolor1.map((c1, idx) => c1 * (1 - t) + pencolor2[idx] * t);

    // Interpolate commands
    const interpolatedCommands = interpolateCommands(aligned1, aligned2, t);

    // Display interpolated program
    displayInterpolatedProgram(interpolatedCommands, t, interpolatedPenwidth, interpolatedPencolor);

    // Execute interpolated commands
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = interpolatedPenwidth;
    ctx.strokeStyle = `rgb(${interpolatedPencolor[0]}, ${interpolatedPencolor[1]}, ${interpolatedPencolor[2]})`;
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
            const t = minT + ((maxT - minT) * (0.5 + 0.5 * Math.sin((2 * Math.PI * elapsed) / duration)));
            parameterInput.value = t.toFixed(2);
            parameterValueSpan.textContent = parameterInput.value;
            draw();
            animationFrameId = requestAnimationFrame(step);
        }

        animationFrameId = requestAnimationFrame(step);
    }
}

animateButton.addEventListener('click', animate);
