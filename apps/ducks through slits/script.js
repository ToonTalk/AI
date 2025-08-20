// --- Canvas & state ---
const pond = document.getElementById('pond');
const ctx = pond.getContext('2d');
const over = document.getElementById('overlay').getContext('2d');
const hist = document.getElementById('hist').getContext('2d');
const sideHist = document.getElementById('sideHist') ? document.getElementById('sideHist').getContext('2d') : null;
let domDucks = [];
let isDuckGridCreated = false;

const caughtEl = document.getElementById('caught');

// Grid resolution (kept modest for speed)
const NX = 180, NY = 110;
const W = pond.width, H = pond.height;
const sx = W / NX, sy = H / NY;

// State arrays
let u = new Float32Array(NX*NY);
let v = new Float32Array(NX*NY);
let w = new Float32Array(NX*NY);
let obs = new Uint8ClampedArray(NX*NY);

let running = false;
let frameId = 0;
let tStep = 0;
let driveSteps = 0;
let showPhase = false;
let hasLaunched = false;
let hasCollapsed = false;
let hits = 0;
let histCounts = new Uint32Array(NY);
let lastSlitCentersPx = [];
let decoSegments = [];
let lastWallXCell = Math.floor(NX*0.45);
let slitSizeCells = 14;
let slitGapCells = 18;
let debugLogs = false;
let simSpeed = 1;
let inBatch = false;
let autoArm = -1;

// --- Absorbing sponge near the right edge to reduce reflections ---
const SPONGE_W = 16;
const SPONGE_MAX = 0.18;
let spongeDampX = new Float32Array(NX);
function buildSponge(){
  for(let x=0; x<NX; x++){
    const t = Math.max(0, (x - (NX - SPONGE_W)) / Math.max(1, (SPONGE_W-1)));
    const sCurve = t*t;
    spongeDampX[x] = SPONGE_MAX * sCurve;
  }
}
buildSponge();

function idx(x,y){ return y*NX + x; }

function resetField(){
  u.fill(0); v.fill(0); w.fill(0); tStep = 0; driveSteps = 0; running = false; cancelAnimationFrame(frameId);
  hasLaunched = false; hasCollapsed = false;
  over.clearRect(0,0,W,H);
  hist.clearRect(0,0,W,H);
  redrawHistogram();
}

function clearHistogram(){
  hist.clearRect(0,0,W,H);
  if (sideHist) sideHist.clearRect(0,0,sideHist.canvas.width, sideHist.canvas.height);
  histCounts.fill(0);
  if(duckLayer) duckLayer.textContent='';
  hits = 0; caughtEl.textContent = hits;
  redrawHistogram();
}

// --- Obstacles / slits ---
function buildObstacles(){
  obs.fill(0);
  const mode = document.getElementById('slits').value;
  if(mode === 'none'){ lastSlitCentersPx = []; return; }

  const sizeEl = document.getElementById('slitSize');
  slitSizeCells = Math.max(2, Math.min(40, parseInt(sizeEl ? sizeEl.value : slitSizeCells, 10) || 14));
  const gapEl = document.getElementById('slitGap');
  slitGapCells  = Math.max(6, Math.min(60, parseInt(gapEl ? gapEl.value : slitGapCells, 10) || 18));
  const slitHalf = Math.max(1, Math.min(Math.floor(slitSizeCells/2), Math.floor(NY/3)));

  const wallX = Math.floor(NX*0.45);
  for(let y=0;y<NY;y++) obs[idx(wallX,y)] = 1;
  const centerY = Math.floor(NY/2);

  if(mode === 'single'){
    for(let y=centerY-slitHalf; y<=centerY+slitHalf; y++) obs[idx(wallX,y)] = 0;
  } else if(mode === 'double'){
    const gap = slitGapCells;
    for(let y=centerY-gap-slitHalf; y<=centerY-gap+slitHalf; y++) obs[idx(wallX,y)] = 0;
    for(let y=centerY+gap-slitHalf; y<=centerY+gap+slitHalf; y++) obs[idx(wallX,y)] = 0;
  }

  lastWallXCell = wallX;
  lastSlitCentersPx = [];
  decoSegments = [];
  let inOpen = false, yStart = 0;
  for(let y=1;y<NY-1;y++){
    const isOpen = (obs[idx(wallX,y)]===0);
    if(isOpen && !inOpen){ inOpen = true; yStart = y; }
    if(inOpen && (!isOpen || y===NY-2)){
      const yEnd = isOpen ? y : (y-1);
      const yCenterPx = ((yStart + yEnd)/2 + 0.5) * sy;
      lastSlitCentersPx.push(yCenterPx);
      decoSegments.push({y0:yStart, y1:yEnd});
      inOpen = false;
    }
  }
}

// --- Launch ---
function launchDuck(){
  if (!isDuckGridCreated) {
    createDomDuckGrid();
    isDuckGridCreated = true;
  }
  
  resetField();
  buildObstacles();
  showDuckBirth();
  const sxCell = Math.floor(NX*0.12);
  const syCell = Math.floor(NY*0.5);
  const radius = 6;
  for(let y=syCell-2*radius; y<=syCell+2*radius; y++){
    for(let x=sxCell-2*radius; x<=sxCell+2*radius; x++){
      if(x<1||x>=NX-1||y<1||y>=NY-1) continue;
      const dx=x-sxCell, dy=y-syCell; const r=Math.sqrt(dx*dx+dy*dy);
      if(r<=radius){ u[idx(x,y)] += Math.cos((r/radius)*Math.PI)*0.8; }
    }
  }
  v.set(u);
  driveSteps = 220;
  running = true; tStep = 0;
  hasLaunched = true; hasCollapsed = false;
  loop();
}

// --- Simulation step ---
function stepSim(sgn1 = 1, sgn2 = 1){
  const baseDamp = 0.006;
  const s = 0.22;

  // Update interior
  for(let y=1;y<NY-1;y++){
    for(let x=1;x<NX-1;x++){
      const i = idx(x,y);
      if(obs[i]){ w[i]=0; continue; }
      const lap = (u[idx(x-1,y)] + u[idx(x+1,y)] + u[idx(x,y-1)] + u[idx(x,y+1)] - 4*u[i]);
      const localD = baseDamp + spongeDampX[x];
      w[i] = (2 - localD)*u[i] - (1 - localD)*v[i] + s*lap;
    }
  }
  
  // Which‑path decoherence logic
  const whichOn = document.getElementById('which')?.checked;
  const modeNow = document.getElementById('slits')?.value;
  if (whichOn && modeNow === 'double' && decoSegments.length >= 2) {
      const x0 = Math.min(NX - 2, lastWallXCell + 1);
      const x1 = Math.min(NX - 2, lastWallXCell + 2);

      const seg1 = decoSegments[0];
      for (let x = x0; x <= x1; x++) {
          for (let y = seg1.y0; y <= seg1.y1; y++) {
              const i = idx(x, y);
              if (!obs[i]) w[i] *= sgn1;
          }
      }

      const seg2 = decoSegments[1];
      for (let x = x0; x <= x1; x++) {
          for (let y = seg2.y0; y <= seg2.y1; y++) {
              const i = idx(x, y);
              if (!obs[i]) w[i] *= sgn2;
          }
      }
  }

  // Edges = absorb
  for(let x=0;x<NX;x++){ w[idx(x,0)]=0; w[idx(x,NY-1)]=0; }
  for(let y=0;y<NY;y++){ w[idx(0,y)]=0; w[idx(NX-1,y)]=0; }

  // Source continues for a while
  if(tStep < driveSteps){
    const sxCell = Math.floor(NX*0.12);
    const syCell = Math.floor(NY*0.5);
    const radius = 6;
    for(let y=syCell-radius; y<=syCell+radius; y++){
      for(let x=sxCell-radius; x<=sxCell+radius; x++){
        const dx=x-sxCell, dy=y-syCell; const r=Math.hypot(dx,dy);
        if(r<=radius){ w[idx(x,y)] += Math.cos((r/radius)*Math.PI)*0.65; }
      }
    }
  }

  // Rotate buffers
  v = u; u = w; w = v;
  tStep++;
}


// --- Draw field ---
function drawField(){
  const image = ctx.createImageData(W, H);
  const data = image.data;
  let k=0;
  for(let py=0; py<H; py++){
    const y = Math.min(NY-1, Math.max(0, (py/sy)|0));
    for(let px=0; px<W; px++){
      const x = Math.min(NX-1, Math.max(0, (px/sx)|0));
      const i = idx(x,y);
      let a = u[i];
      if(obs[i]){
        data[k++] = 140; data[k++] = 110; data[k++] = 230; data[k++] = 255; continue;
      }
      const mag = Math.min(1, Math.abs(a));
      if(showPhase){
        const pos = a>=0 ? 1 : 0;
        const r = pos? 30 : 140; const g = pos? 220 : 50; const b = 255;
        data[k++] = r*mag; data[k++] = g*mag; data[k++] = b*mag; data[k++] = 255;
      } else {
        data[k++] = 20*mag; data[k++] = 200*mag; data[k++] = 255*mag; data[k++] = 255;
      }
    }
  }
  ctx.putImageData(image,0,0);
  over.clearRect(0,0,W,H);
  over.globalAlpha = 1;

  if(!hasCollapsed){
    over.strokeStyle = 'rgba(240,255,255,.35)';
    over.beginPath(); over.moveTo(W-14, 0); over.lineTo(W-14, H); over.stroke();
  }
}

function createDomDuckGrid() {
  const layer = document.getElementById('domDuckLayer');
  if (!layer) return;
  layer.innerHTML = '';
  domDucks = [];

  const DUCK_STRIDE_X = 12;
  const DUCK_STRIDE_Y = 8;

  for (let y = DUCK_STRIDE_Y / 2; y < NY; y += DUCK_STRIDE_Y) {
    for (let x = DUCK_STRIDE_X / 2; x < NX; x += DUCK_STRIDE_X) {
      const duckEl = document.createElement('div');
      duckEl.className = 'dom-duck';
      duckEl.textContent = '🦆';
      
      const px = (x - (2 * DUCK_STRIDE_X) + 0.5) * sx;
      const py = (y + 0.5) * sy;
      duckEl.style.left = `${px}px`;
      duckEl.style.top = `${py}px`;
      
      layer.appendChild(duckEl);
      domDucks.push({ x, y, el: duckEl });
    }
  }
}

function updateDomDucks() {
  const kid = document.getElementById('kidMode')?.checked;
  if (!kid || domDucks.length === 0) {
    if (domDucks.length > 0 && domDucks[0].el.style.opacity !== '0') {
       for (const duck of domDucks) {
         duck.el.style.opacity = 0;
       }
    }
    return;
  }

  const OPACITY_EXPONENT = 1.2; // Lowered for more visibility

  for (const duck of domDucks) {
    const i = idx(duck.x, duck.y);
    const mag = Math.min(1, Math.abs(u[i]));
    
    duck.el.style.opacity = Math.pow(mag, OPACITY_EXPONENT);
  }
}

// --- Measurement ---
function redrawHistogram(){
  if (sideHist){
    const c = sideHist; const cvs = c.canvas; const dpr = window.devicePixelRatio || 1;
    const ph = Math.round(pond.getBoundingClientRect().height);
    cvs.style.height = ph + 'px';
    const cssW = Math.round(cvs.getBoundingClientRect().width);
    cvs.width  = Math.max(100, Math.round(cssW * dpr));
    cvs.height = Math.max(50, Math.round(ph   * dpr));

    const CW = cvs.width, CH = cvs.height;
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,CW,CH);
    c.fillStyle = 'rgba(10,14,28,.85)';
    c.fillRect(0,0,CW,CH);
    const m = Math.round(12*dpr);
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
    c.strokeRect(m, m, CW-2*m, CH-2*m);
    const NBINS = Math.min(44, Math.floor(NY/2));
    const bins = new Uint32Array(NBINS);
    for(let y=1;y<NY-1;y++){
      const b = Math.floor((y-1) * NBINS / (NY-2));
      bins[b] += histCounts[y]||0;
    }
    let maxv = 1; for(let b=0;b<NBINS;b++) if(bins[b] > maxv) maxv = bins[b];
    const innerW = CW - 2*m - Math.round(10*dpr);
    const innerH = CH - 2*m;
    const binH = innerH / NBINS;
    const kid = document.getElementById('kidMode')?.checked;
    if (kid){
      const BASE_DUCKS_PER_ROW = 25;
      const MIN_SCALE = 0.2;
      let scale = 1.0;
      if (maxv > BASE_DUCKS_PER_ROW) {
          scale = BASE_DUCKS_PER_ROW / maxv;
      }
      scale = Math.max(MIN_SCALE, scale);

      const BASE_FONT_SIZE = Math.max(12, Math.round(12 * dpr));
      const BASE_STEP_X = Math.round(16 * dpr);

      const duckFont = Math.max(2, Math.round(BASE_FONT_SIZE * scale));
      const stepX = Math.max(3, Math.round(BASE_STEP_X * scale));

      c.save();
      c.textAlign = 'left'; c.textBaseline = 'middle';
      const x0 = m + 6;
      const availableWidth = innerW - Math.round(20 * dpr);
      const maxDucksThatFit = stepX > 0 ? Math.floor(availableWidth / stepX) : 0;

      for(let b=0; b<NBINS; b++){
        const v = bins[b]; if(!v) continue;
        const py = Math.round(m + (b+0.5)*binH);
        const ducksHere = Math.min(v, maxDucksThatFit);

        c.font = duckFont + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",system-ui,sans-serif';
        for(let j=0;j<ducksHere;j++){
          const xx = x0 + j*stepX;
          c.globalAlpha = 0.9;
          c.fillText('🦆', xx, py);
        }
        
        c.globalAlpha = 1;
        c.fillStyle = 'rgba(200,220,255,.9)';
        c.font = Math.max(11, Math.round(11*dpr)) + 'px system-ui,sans-serif';
        c.fillText(String(v), x0 + ducksHere*stepX + Math.round(6*dpr), py);
      }
      c.restore();
    } else {
      c.fillStyle = 'rgba(255,255,255,.95)';
      for(let b=0;b<NBINS;b++){
        const v = bins[b]; if(!v) continue;
        const wBar = Math.max(2*dpr, Math.round((v / maxv) * innerW));
        const py = Math.round(m + (b+0.5)*binH);
        c.fillRect(m+6, py-1, wBar, Math.max(2,Math.round(2*dpr)));
      }
    }return;
  }
  const sidebarW = 64;
  const sidebarX = W - (sidebarW + 12);
  hist.clearRect(0,0,W,H);
  hist.fillStyle = 'rgba(10,14,28,.65)';
  hist.fillRect(sidebarX, 0, sidebarW, H);
  let maxv2 = 1; for(let y=1;y<NY-1;y++) if(histCounts[y] > maxv2) maxv2 = histCounts[y];
  hist.fillStyle = 'rgba(255,255,255,.95)';
  for(let y=1;y<NY-1;y++){
    const v = histCounts[y]; if(!v) continue;
    const py = Math.round((y+0.5)*sy);
    const wBar = Math.max(2, Math.round((v / maxv2) * (sidebarW - 12)));
    hist.fillRect(sidebarX+6, py-1, wBar, 2);
  }
}

function detectorBandSum(){
  const bandX0 = NX-8, bandX1 = NX-6;
  let sum = 0;
  for(let y=1;y<NY-1;y++){
    for(let x=bandX0;x<=bandX1;x++){
      const a = u[idx(x,y)]; sum += a*a;
    }
  }
  return sum;
}

// ---- DOM duck helpers ----
const duckLayer = document.getElementById('duckLayer');
function clearDuckHTML(){ if(duckLayer) duckLayer.textContent=''; }
function htmlDuckAt(x, y){
  if(!duckLayer) return;
  const wrap = document.createElement('div');
  wrap.className = 'duck-wrap';
  wrap.style.left = (x / W * 100) + '%';
  wrap.style.top  = (y / H * 100) + '%';
  const em = document.createElement('div');
  em.className = 'duck-emoji';
  em.textContent = '🦆';
  wrap.appendChild(em);
  duckLayer.appendChild(wrap);
}

function showDuckBirth(){
  if(!duckLayer) return;
  const x = Math.floor(NX*0.12) * sx;
  const y = Math.floor(NY*0.5) * sy;
  const seed = document.createElement('div');
  seed.className = 'duck-birth';
  seed.textContent = '🦆';
  seed.style.left = (x / W * 100) + '%';
  seed.style.top  = (y / H * 100) + '%';
  duckLayer.appendChild(seed);
  const mkRipple = (delay)=>{
    const r = document.createElement('div');
    r.className = 'duck-ripple';
    r.style.left = (x / W * 100) + '%';
    r.style.top  = (y / H * 100) + '%';
    duckLayer.appendChild(r);
    setTimeout(()=> r.classList.add('go'), 10+delay);
    setTimeout(()=> r.remove(), 1000+delay);
  };
  mkRipple(0); mkRipple(180);
  requestAnimationFrame(()=> seed.classList.add('go'));
  setTimeout(()=> seed.remove(), 800);
}



function plotHit(yCell){
  const y = (yCell+0.5)*sy;
  const xDuck = W-20;

  histCounts[yCell] = (histCounts[yCell]||0) + 1;
  redrawHistogram();
  htmlDuckAt(xDuck, y);

  hits++; caughtEl.textContent = hits;
  hasCollapsed = true;
  running = false;
  try{ cancelAnimationFrame(frameId); }catch(e){}
}

function measureDuck(source='manual'){
  if(!hasLaunched || hasCollapsed) return;
  const bandX0 = NX-8, bandX1 = NX-6;
  let weights = new Float32Array(NY);
  let sum = 0;
  for(let y=1;y<NY-1;y++){
    let s=0;
    for(let x=bandX0;x<=bandX1;x++){
      const a = u[idx(x,y)]; s += a*a;
    }
    weights[y] = s; sum += s;
  }
  if(sum <= 1e-8){
    let sum2 = 0;
    const bx0 = NX-12, bx1 = NX-10;
    for(let y=1;y<NY-1;y++){
      let s=0; for(let x=bx0;x<=bx1;x++){ const a=u[idx(x,y)]; s+=a*a; }
      weights[y]=s; sum2+=s;
    }
    sum = sum2;
  }
  if(sum <= 1e-10){
    const yy = (Math.random()*(NY-2)|0)+1;
    plotHit(yy);
    return;
  }
  let r = Math.random()*sum;
  let ySel = 1;
  for(let y=1;y<NY-1;y++){ r -= weights[y]; if(r<=0){ ySel=y; break; } }
  plotHit(ySel);
}

// --- Loop & helpers ---
function loop(){
  if(!running) return;
  const stepsThisFrame = Math.max(1, Math.round(2 * simSpeed));

  // For which-path detector, choose random signs ONCE per frame to prevent instability
  const whichOn = document.getElementById('which')?.checked;
  const modeNow = document.getElementById('slits')?.value;
  let sgn1 = 1, sgn2 = 1; // Default to no phase shift

  if (whichOn && modeNow === 'double' && decoSegments.length >= 2) {
    sgn1 = (Math.random() < 0.5) ? -1 : 1;
    sgn2 = (Math.random() < 0.5) ? -1 : 1;
  }
  
  for(let s=0; s<stepsThisFrame; s++) {
    stepSim(sgn1, sgn2); // Pass the same signs for all steps in this frame
  }

  drawField();
  updateDomDucks();

  const auto = document.getElementById('autoNet')?.checked;
  const sig = detectorBandSum();
  if (debugLogs && tStep % 30 === 0) console.info('loop t', tStep, {sig: sig.toFixed(4), driveSteps});
  if (auto && !inBatch && !hasCollapsed){
    const ARRIVAL_THRESH = 5e-4;
    if (sig >= ARRIVAL_THRESH){
      if (autoArm < 0) autoArm = Math.max(1, Math.round(2 / Math.max(1, simSpeed)));
      autoArm--;
      if (autoArm <= 0){
        measureDuck('auto-fast');
        running = false;
        autoArm = -1;
      }
    } else {
      autoArm = -1;
    }
  }
  frameId = requestAnimationFrame(loop);
}

async function waitForWaveArrival() {
  const ARRIVAL_THRESH = 5e-4;
  // Poll every frame until the signal at the detector crosses the threshold
  while (detectorBandSum() < ARRIVAL_THRESH) {
    // Wait for the next animation frame to check again
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}

async function runTrials(n){
  n = Math.max(1, Math.min(2000, (parseInt(n,10)||0)));
  const btn = document.getElementById('runN');
  const trialsEl = document.getElementById('trialsN');
  const whichOn = document.getElementById('which')?.checked;
  const originalSpeed = simSpeed;
  let speedWasReset = false;

  // Check for the problematic condition
  if (whichOn && simSpeed > 1) {
    speedWasReset = true;
    // Temporarily set speed to 1
    simSpeed = 1;
    speedEl.value = 1;
    speedVal.textContent = '1.0×';
  }

  inBatch = true; btn.disabled = true; if(trialsEl) trialsEl.disabled = true;
  try{
    for(let i=0;i<n;i++){
      launchDuck();
      await waitForWaveArrival(); // Wait for the wave to hit the sensor

      // Wait a small, random additional time before measuring
      const randomDelay = 20 + Math.random() * 100; // 20ms to 120ms
      await new Promise(resolve => setTimeout(resolve, randomDelay));

      measureDuck('batch');
      
      // A single frame delay to allow UI to update before the next trial
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  } finally {
    // Restore original speed if it was changed
    if (speedWasReset) {
      simSpeed = originalSpeed;
      speedEl.value = originalSpeed;
      speedVal.textContent = originalSpeed.toFixed(1)+'×';
    }
    inBatch = false; btn.disabled = false; if(trialsEl) trialsEl.disabled = false;
  }
}


// --- UI wiring ---
function alignSideHistTop(){
  const wrap = document.getElementById('sideHistWrap');
  const canvasEl = document.getElementById('sideHist');
  if(!wrap || !canvasEl) return;
  wrap.style.marginTop = '0px';
  const pondTop = pond.getBoundingClientRect().top;
  const canvasTop = canvasEl.getBoundingClientRect().top;
  const delta = Math.round(pondTop - canvasTop);
  wrap.style.marginTop = delta + 'px';
}

function syncSideHist(){ try{ redrawHistogram(); alignSideHistTop(); } catch(e){} }

function updateSpeedWarning() {
  const whichOn = document.getElementById('which')?.checked;
  const speed = parseFloat(document.getElementById('speed').value) || 1;
  const warningEl = document.getElementById('speedWarning');
  if (warningEl) {
    warningEl.style.display = (whichOn && speed > 1) ? 'inline' : 'none';
  }
}

// Start app overlay
const startBtn = document.getElementById('startApp');
startBtn?.addEventListener('click', ()=>{
  document.getElementById('intro').style.display = 'none';
  document.getElementById('appMain').style.display = 'grid';
  buildObstacles();
  redrawHistogram();
  alignSideHistTop();
  updateSpeedWarning();
});

// Controls
const slitsSel = document.getElementById('slits');
slitsSel?.addEventListener('change', ()=>{ buildObstacles(); drawField(); });

const slitSizeEl = document.getElementById('slitSize');
const slitSizeVal = document.getElementById('slitSizeVal');
slitSizeEl?.addEventListener('input', ()=>{ slitSizeVal.textContent = slitSizeEl.value; buildObstacles(); drawField(); });

const slitGapEl = document.getElementById('slitGap');
const slitGapVal = document.getElementById('slitGapVal');
slitGapEl?.addEventListener('input', ()=>{ slitGapVal.textContent = slitGapEl.value; buildObstacles(); drawField(); });

const speedEl = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
speedEl?.addEventListener('input', ()=>{
  simSpeed = parseFloat(speedEl.value)||1;
  speedVal.textContent = simSpeed.toFixed(1)+'×';
  updateSpeedWarning();
});
document.getElementById('which')?.addEventListener('change', updateSpeedWarning);


// Buttons
document.getElementById('launch')?.addEventListener('click', launchDuck);
document.getElementById('net')?.addEventListener('click', ()=>measureDuck('manual'));
document.getElementById('reset')?.addEventListener('click', ()=>{ resetField(); buildObstacles(); drawField(); });
document.getElementById('clearHits')?.addEventListener('click', clearHistogram);
document.getElementById('togglePhase')?.addEventListener('click', ()=>{ showPhase = !showPhase; drawField(); });
document.getElementById('runN')?.addEventListener('click', ()=>{ const n = document.getElementById('trialsN').value; runTrials(n); });

// Resize sync
window.addEventListener('resize', syncSideHist);