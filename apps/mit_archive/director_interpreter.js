// Director Language Interpreter & Animator
// A custom implementation of Ken Kahn's 1970s Actor-based animation language

class DirectorInterpreter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.actors = {};
    this.activeTasks = [];
    this.animationFrameId = null;
    this.isPaused = false;
    this.drawHistory = []; // Stores drawn lines: {x1, y1, x2, y2, color, size}
    this.frameCount = 0; // Frame counter for animating shape properties
    
    // Bind methods
    this.update = this.update.bind(this);
  }

  reset() {
    this.stop();
    this.actors = {};
    this.activeTasks = [];
    this.drawHistory = [];
    this.frameCount = 0;
    this.clearCanvas();
  }

  clearCanvas() {
    this.ctx.fillStyle = '#0a0d0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw subtle grid
    this.ctx.strokeStyle = '#141c14';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  createActor(name, x = 300, y = 200, color = '#39ff14') {
    this.actors[name] = {
      name: name,
      x: x,
      y: y,
      heading: 0, // 0 is UP, clockwise
      penDown: true,
      color: color,
      size: 10,
      visible: true,
      shape: 'turtle' // default shape
    };
    return this.actors[name];
  }

  start() {
    if (!this.animationFrameId) {
      this.isPaused = false;
      this.animationFrameId = requestAnimationFrame(this.update);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Parse Lisp S-expression into nested arrays
  static parse(code) {
    // Standard Lisp tokenizer
    const tokens = code
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .split(/\s+/)
      .filter(t => t.trim() !== '');

    let cursor = 0;

    function parseExpression() {
      if (cursor >= tokens.length) return null;
      
      const token = tokens[cursor++];
      if (token === '(') {
        const list = [];
        while (cursor < tokens.length && tokens[cursor] !== ')') {
          const expr = parseExpression();
          if (expr !== null) list.push(expr);
        }
        cursor++; // skip ')'
        return list;
      } else if (token === ')') {
        // Unmatched closing paren
        return null;
      } else {
        // Try to parse numbers
        const num = Number(token);
        if (!isNaN(num)) return num;
        // Strings/symbols
        return token;
      }
    }

    const expressions = [];
    while (cursor < tokens.length) {
      const expr = parseExpression();
      if (expr !== null) expressions.push(expr);
    }
    return expressions;
  }

  // Compile Lisp array structure into executable animation tasks
  compile(expr) {
    if (!Array.isArray(expr)) return null;
    
    const cmd = expr[0].toLowerCase();
    
    if (cmd === 'ask') {
      const actorName = expr[1];
      const message = expr[2];
      
      // Ensure actor exists
      if (!this.actors[actorName]) {
        this.createActor(actorName);
      }
      
      return this.compileMessage(actorName, message);
    } else if (cmd === 'simultaneously') {
      const tasks = expr.slice(1).map(e => this.compile(e)).filter(t => t !== null);
      return new SimultaneousTask(tasks);
    } else if (cmd === 'sequentially') {
      const tasks = expr.slice(1).map(e => this.compile(e)).filter(t => t !== null);
      return new SequentialTask(tasks);
    } else if (cmd === 'repeat') {
      const count = Number(expr[1]);
      const message = expr[2];
      
      // If it's a list containing ask, compile it directly
      if (Array.isArray(message) && message[0].toLowerCase() === 'ask') {
        const taskCreator = () => this.compile(message);
        return new RepeatTask(count, taskCreator);
      }
      return null;
    }
    
    return null;
  }

  compileMessage(actorName, message) {
    if (!Array.isArray(message)) {
      const action = String(message).toLowerCase();
      if (action === 'wipe') return new WipeTask(this);
      if (action === 'hide' || action === 'hideturtle') {
        return new InstantTask(() => { this.actors[actorName].visible = false; });
      }
      if (action === 'show' || action === 'showturtle') {
        return new InstantTask(() => { this.actors[actorName].visible = true; });
      }
      return null;
    }
    
    const cmd = message[0].toLowerCase();
    const actor = this.actors[actorName];
    
    if (cmd === 'move' || cmd === 'forward' || cmd === 'backward') {
      let dir = 1;
      let dist = 0;
      if (cmd === 'move') {
        const direction = message[1].toLowerCase();
        dist = Number(message[2]);
        if (direction === 'backward' || direction === 'back') dir = -1;
      } else {
        dist = Number(message[1]);
        if (cmd === 'backward') dir = -1;
      }
      return new MoveTask(actor, dist * dir, this);
    } 
    
    else if (cmd === 'turn' || cmd === 'right' || cmd === 'left') {
      let dir = 1;
      let angle = 0;
      if (cmd === 'turn') {
        const direction = message[1].toLowerCase();
        angle = Number(message[2]);
        if (direction === 'left') dir = -1;
      } else {
        angle = Number(message[1]);
        if (cmd === 'left') dir = -1;
      }
      return new TurnTask(actor, angle * dir);
    } 
    
    else if (cmd === 'pen' || cmd === 'penup' || cmd === 'pendown') {
      let down = true;
      if (cmd === 'pen') {
        const state = message[1].toLowerCase();
        down = (state === 'down');
      } else {
        down = (cmd === 'pendown');
      }
      return new InstantTask(() => { actor.penDown = down; });
    }

    else if (cmd === 'arc') {
      const radius = Number(message[1]);
      const degrees = Number(message[2]);
      return new ArcTask(actor, radius, degrees, this);
    }
    
    else if (cmd === 'set') {
      const prop = message[1].toLowerCase();
      const val = message[2];
      return new InstantTask(() => {
        if (prop === 'color') actor.color = String(val).replace(/'/g, '');
        else if (prop === 'size') actor.size = Number(val);
        else if (prop === 'heading') actor.heading = Number(val);
        else if (prop === 'x') actor.x = Number(val);
        else if (prop === 'y') actor.y = Number(val);
        else if (prop === 'shape') actor.shape = String(val).replace(/'/g, '').toLowerCase();
      });
    }

    else if (cmd === 'hide' || cmd === 'hideturtle') {
      return new InstantTask(() => { actor.visible = false; });
    }

    else if (cmd === 'show' || cmd === 'showturtle') {
      return new InstantTask(() => { actor.visible = true; });
    }
    
    else if (cmd === 'wait') {
      const ticks = Number(message[1]);
      return new WaitTask(ticks);
    }
    
    else if (cmd === 'repeat') {
      const count = Number(message[1]);
      const subMsg = message[2];
      const taskCreator = () => this.compileMessage(actorName, subMsg);
      return new RepeatTask(count, taskCreator);
    }
    
    else if (cmd === 'sequentially') {
      const tasks = message.slice(1).map(m => this.compileMessage(actorName, m)).filter(t => t !== null);
      return new SequentialTask(tasks);
    }
    
    else if (cmd === 'simultaneously') {
      const tasks = message.slice(1).map(m => this.compileMessage(actorName, m)).filter(t => t !== null);
      return new SimultaneousTask(tasks);
    }
    
    return null;
  }

  // Execute a compiled S-expression task
  runTask(task) {
    if (task) {
      this.activeTasks.push(task);
      this.start();
    }
  }

  // Run plain code text
  run(code) {
    try {
      const expressions = DirectorInterpreter.parse(code);
      for (const expr of expressions) {
        const task = this.compile(expr);
        if (task) {
          this.runTask(task);
        } else {
          console.warn("Could not compile expression:", expr);
        }
      }
    } catch (e) {
      console.error("Interpreter execution error:", e);
      throw e;
    }
  }

  update() {
    if (this.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.update);
      return;
    }

    this.frameCount++;

    // 1. Clear Canvas and draw grid/history
    this.clearCanvas();
    
    // Draw line history
    this.ctx.lineCap = 'round';
    for (const line of this.drawHistory) {
      this.ctx.strokeStyle = line.color;
      this.ctx.lineWidth = line.size;
      this.ctx.beginPath();
      this.ctx.moveTo(line.x1, line.y1);
      this.ctx.lineTo(line.x2, line.y2);
      this.ctx.stroke();
    }

    // 2. Update active tasks
    this.activeTasks = this.activeTasks.filter(task => {
      task.update();
      return !task.isFinished();
    });

    // 3. Draw active actors
    for (const name in this.actors) {
      const actor = this.actors[name];
      if (!actor.visible) continue;

      this.ctx.save();
      this.ctx.translate(actor.x, actor.y);
      this.ctx.rotate((actor.heading * Math.PI) / 180);

      this.ctx.strokeStyle = '#050505';
      this.ctx.lineWidth = 2;

      const shape = actor.shape || 'turtle';
      if (shape === 'cinderella') {
        this.drawCinderella(this.ctx, actor.size, actor.color);
      } else if (shape === 'stepmother') {
        this.drawStepmother(this.ctx, actor.size, actor.color);
      } else if (shape === 'prince') {
        this.drawPrince(this.ctx, actor.size, actor.color);
      } else if (shape === 'fairy_godmother') {
        this.drawFairyGodmother(this.ctx, actor.size, actor.color);
      } else if (shape === 'block') {
        this.drawBlock(this.ctx, actor.size, actor.color, actor.name);
      } else if (shape === 'table') {
        this.drawTable(this.ctx, actor.size, actor.color);
      } else if (shape === 'rocket') {
        this.drawRocket(this.ctx, actor.size, actor.color, this.frameCount);
      } else if (shape === 'missile') {
        this.drawMissile(this.ctx, actor.size, actor.color);
      } else if (shape === 'flower') {
        this.drawFlower(this.ctx, actor.size, actor.color, this.frameCount);
      } else if (shape === 'seed') {
        this.drawSeed(this.ctx, actor.size, actor.color);
      } else {
        // Default turtle triangle
        this.ctx.fillStyle = actor.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -actor.size * 1.5);
        this.ctx.lineTo(-actor.size, actor.size);
        this.ctx.lineTo(actor.size, actor.size);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw internal eye/dot to indicate direction
        this.ctx.fillStyle = '#050505';
        this.ctx.beginPath();
        this.ctx.arc(0, -actor.size * 0.4, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();

      // Draw actor name label (unless it's a structural element like block or table)
      if (shape !== 'block' && shape !== 'table' && shape !== 'missile' && shape !== 'seed') {
        this.ctx.fillStyle = '#688868';
        this.ctx.font = '10px "Fira Code", monospace';
        this.ctx.fillText(actor.name, actor.x + actor.size + 4, actor.y + 3);
      }
    }

    // Keep animating if there are active tasks
    if (this.activeTasks.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.update);
    } else {
      this.animationFrameId = null;
    }
  }

  // ==========================================
  // VECTOR SHAPE DRAWING HELPERS
  // ==========================================

  drawCinderella(ctx, size, color) {
    // Cinderella is a solid Star as in the PDF (AITR-540)
    let rot = Math.PI / 2 * 3;
    let x = 0;
    let y = 0;
    let spikes = 5;
    let outerRadius = size * 1.4;
    let innerRadius = size * 0.6;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = Math.cos(rot) * outerRadius;
      y = Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = Math.cos(rot) * innerRadius;
      y = Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(0, -outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawStepmother(ctx, size, color) {
    // Stepmother is a solid Square as in the PDF (AITR-540)
    ctx.fillStyle = color || '#7c3aed';
    ctx.fillRect(-size * 1.1, -size * 1.1, size * 2.2, size * 2.2);
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 1.1, -size * 1.1, size * 2.2, size * 2.2);
  }

  drawPrince(ctx, size, color) {
    // Prince is a solid Triangle as in the PDF (AITR-540)
    ctx.fillStyle = color || '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.4);
    ctx.lineTo(-size * 1.2, size * 1.0);
    ctx.lineTo(size * 1.2, size * 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawFairyGodmother(ctx, size, color) {
    // Fairy Godmother is a solid Circle as in the PDF (AITR-540)
    ctx.fillStyle = color || '#a855f7';
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawBlock(ctx, size, color, name) {
    ctx.fillStyle = color;
    ctx.fillRect(-size * 1.5, -size * 1.5, size * 3, size * 3);
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 3;
    ctx.strokeRect(-size * 1.5, -size * 1.5, size * 3, size * 3);

    // Retro bevel edge
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size * 1.35, -size * 1.35, size * 2.7, size * 2.7);

    // Lettering (Block Label)
    ctx.fillStyle = '#050505';
    ctx.font = `bold ${Math.round(size * 1.8)}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.substring(0, 2).toUpperCase(), 0, 0);
  }

  drawTable(ctx, size, color) {
    ctx.fillStyle = '#78350f'; // rich brown
    ctx.fillRect(-size * 8, -size * 0.5, size * 16, size * 1.2);
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 3;
    ctx.strokeRect(-size * 8, -size * 0.5, size * 16, size * 1.2);
    
    // Wooden texture line
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 7.5, size * 0.1);
    ctx.lineTo(size * 7.5, size * 0.1);
    ctx.stroke();
  }

  drawRocket(ctx, size, color, frameCount) {
    // Rocket Body Cylinder
    ctx.fillStyle = color || '#cbd5e1'; // light steel blue
    ctx.fillRect(-size * 0.4, -size * 1.2, size * 0.8, size * 2.0);
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 0.4, -size * 1.2, size * 0.8, size * 2.0);

    // Red Nose Cone (Equilateral / Pointy)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 1.2);
    ctx.lineTo(0, -size * 1.95);
    ctx.lineTo(size * 0.4, -size * 1.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Fin (Right Triangle)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, size * 0.25);
    ctx.lineTo(-size * 0.85, size * 0.9);
    ctx.lineTo(-size * 0.4, size * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Fin (Right Triangle)
    ctx.beginPath();
    ctx.moveTo(size * 0.4, size * 0.25);
    ctx.lineTo(size * 0.85, size * 0.9);
    ctx.lineTo(size * 0.4, size * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Porthole Window
    ctx.fillStyle = '#bae6fd'; // sky blue
    ctx.beginPath();
    ctx.arc(0, -size * 0.35, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Animated Thruster Fire
    const scale = 0.7 + 0.3 * Math.sin(frameCount * 0.6);
    ctx.fillStyle = '#f97316'; // orange flame
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, size * 0.8);
    ctx.lineTo(0, size * (0.8 + 0.9 * scale));
    ctx.lineTo(size * 0.25, size * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15'; // yellow inner core
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, size * 0.8);
    ctx.lineTo(0, size * (0.8 + 0.5 * scale));
    ctx.lineTo(size * 0.15, size * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  drawMissile(ctx, size, color) {
    ctx.fillStyle = '#ef4444'; // glowing red
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fef08a'; // yellow tip
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  drawFlower(ctx, size, color, frameCount) {
    // Curved stem representing wind sway animation
    const sway = 10 * Math.sin(frameCount * 0.04);
    
    // Draw green stem
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, size * 1.5);
    ctx.quadraticCurveTo(sway * 0.4, size * 0.5, sway, -size * 0.4);
    ctx.stroke();

    // Left Leaf (drawn via arcs)
    ctx.fillStyle = '#047857';
    ctx.save();
    ctx.translate(sway * 0.25, size * 0.85);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Leaf
    ctx.save();
    ctx.translate(sway * 0.55, size * 0.35);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Render flower head at swayed top
    ctx.save();
    ctx.translate(sway, -size * 0.4);

    // Rotate flower petals over time
    ctx.rotate((frameCount * 1.2 * Math.PI) / 180);

    // Draw 8 petals (standard Anima flower)
    ctx.fillStyle = color || '#ec4899'; // pink
    const numPetals = 8;
    for (let i = 0; i < numPetals; i++) {
      ctx.rotate((2 * Math.PI) / numPetals);
      ctx.beginPath();
      // Draw circular petal overlapping center
      ctx.arc(size * 0.58, 0, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Yellow center core
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  drawSeed(ctx, size, color) {
    ctx.fillStyle = color || '#34d399'; // light emerald green
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sprout tail
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.quadraticCurveTo(size * 0.45, size * 0.7, size * 0.15, size * 1.0);
    ctx.stroke();
  }
}

// ==========================================
// TASK INTERFACE & SPECIFIC TASK CLASS COROUTINES
// ==========================================

class Task {
  constructor() {
    this.finished = false;
  }
  update() {}
  isFinished() { return this.finished; }
}

class InstantTask extends Task {
  constructor(fn) {
    super();
    this.fn = fn;
  }
  update() {
    this.fn();
    this.finished = true;
  }
}

class WipeTask extends Task {
  constructor(interpreter) {
    super();
    this.interpreter = interpreter;
  }
  update() {
    this.interpreter.drawHistory = [];
    this.finished = true;
  }
}

class WaitTask extends Task {
  constructor(ticks) {
    super();
    this.ticksRemaining = ticks;
  }
  update() {
    this.ticksRemaining--;
    if (this.ticksRemaining <= 0) {
      this.finished = true;
    }
  }
}

class MoveTask extends Task {
  constructor(actor, distance, interpreter) {
    super();
    this.actor = actor;
    this.distance = distance;
    this.interpreter = interpreter;
    this.moved = 0;
    this.speed = 4; // pixels per frame
  }

  update() {
    const remaining = Math.abs(this.distance) - this.moved;
    if (remaining <= 0) {
      this.finished = true;
      return;
    }

    const step = Math.min(this.speed, remaining);
    const rad = (this.actor.heading * Math.PI) / 180;
    
    // Moving in direction of heading (0 is UP, clockwise)
    const dir = this.distance >= 0 ? 1 : -1;
    const dx = step * Math.sin(rad) * dir;
    const dy = -step * Math.cos(rad) * dir;

    const oldX = this.actor.x;
    const oldY = this.actor.y;

    this.actor.x += dx;
    this.actor.y += dy;
    this.moved += step;

    if (this.actor.penDown) {
      this.interpreter.drawHistory.push({
        x1: oldX,
        y1: oldY,
        x2: this.actor.x,
        y2: this.actor.y,
        color: this.actor.color,
        size: 2
      });
    }

    if (this.moved >= Math.abs(this.distance)) {
      this.finished = true;
    }
  }
}

class TurnTask extends Task {
  constructor(actor, angle) {
    super();
    this.actor = actor;
    this.angle = angle;
    this.turned = 0;
    this.speed = 4; // degrees per frame
  }

  update() {
    const remaining = Math.abs(this.angle) - this.turned;
    if (remaining <= 0) {
      this.finished = true;
      return;
    }

    const step = Math.min(this.speed, remaining);
    const dir = this.angle >= 0 ? 1 : -1;
    
    this.actor.heading = (this.actor.heading + step * dir) % 360;
    if (this.actor.heading < 0) this.actor.heading += 360;
    
    this.turned += step;

    if (this.turned >= Math.abs(this.angle)) {
      this.finished = true;
    }
  }
}

class ArcTask extends Task {
  constructor(actor, radius, degrees, interpreter) {
    super();
    this.actor = actor;
    this.radius = radius;
    this.degrees = degrees;
    this.interpreter = interpreter;
    
    // Capture center at the start of the task
    this.centerX = actor.x;
    this.centerY = actor.y;
    this.startHeading = actor.heading;
    
    this.swept = 0;
    this.speed = 4; // degrees per frame
  }

  update() {
    const remaining = Math.abs(this.degrees) - this.swept;
    if (remaining <= 0) {
      this.finished = true;
      return;
    }

    const step = Math.min(this.speed, remaining);
    const dir = this.degrees >= 0 ? 1 : -1;
    
    const startAngleDeg = this.startHeading - 90 + this.swept * dir;
    const endAngleDeg = startAngleDeg + step * dir;
    
    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = (endAngleDeg * Math.PI) / 180;
    
    const x1 = this.centerX + this.radius * Math.cos(startRad);
    const y1 = this.centerY + this.radius * Math.sin(startRad);
    const x2 = this.centerX + this.radius * Math.cos(endRad);
    const y2 = this.centerY + this.radius * Math.sin(endRad);
    
    // Arcs are always drawn as visible shapes (independent of penDown, or using default green line)
    this.interpreter.drawHistory.push({
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      color: this.actor.color,
      size: 2
    });
    
    this.swept += step;

    if (this.swept >= Math.abs(this.degrees)) {
      this.finished = true;
    }
  }
}

class SequentialTask extends Task {
  constructor(tasks = []) {
    super();
    this.tasks = tasks;
    this.currentIndex = 0;
  }

  update() {
    if (this.currentIndex >= this.tasks.length) {
      this.finished = true;
      return;
    }

    const currentTask = this.tasks[this.currentIndex];
    currentTask.update();

    if (currentTask.isFinished()) {
      this.currentIndex++;
      if (this.currentIndex >= this.tasks.length) {
        this.finished = true;
      }
    }
  }
}

class SimultaneousTask extends Task {
  constructor(tasks = []) {
    super();
    this.tasks = tasks;
  }

  update() {
    let allDone = true;
    for (const task of this.tasks) {
      if (!task.isFinished()) {
        task.update();
        if (!task.isFinished()) {
          allDone = false;
        }
      }
    }
    if (allDone) {
      this.finished = true;
    }
  }
}

class RepeatTask extends Task {
  constructor(count, taskCreator) {
    super();
    this.count = count;
    this.taskCreator = taskCreator;
    this.currentIteration = 0;
    this.currentTask = null;
  }

  update() {
    if (this.currentIteration >= this.count) {
      this.finished = true;
      return;
    }

    if (this.currentTask === null || this.currentTask.isFinished()) {
      if (this.currentTask !== null) {
        this.currentIteration++;
      }
      
      if (this.currentIteration < this.count) {
        this.currentTask = this.taskCreator();
        if (!this.currentTask) {
          this.finished = true;
          return;
        }
      } else {
        this.finished = true;
        return;
      }
    }

    this.currentTask.update();
  }
}

// Attach to window object for access in single page HTML app
window.DirectorInterpreter = DirectorInterpreter;
