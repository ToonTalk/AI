// ====== Utility helpers ======
const rand = (n)=>Math.floor(Math.random()*n);
const shuffle = (arr)=>arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);
const key = (x,y)=>`${x},${y}`;

// Emoji-friendly font stack for canvas
const EMOJI_FONT = "28px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',system-ui,sans-serif";
const SMALL_EMOJI_FONT = "22px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',system-ui,sans-serif";

// Mode & UI getters
const getModeMany = () => document.getElementById('modeMany')?.checked ?? true;
const getGhostsOn = () => document.getElementById('ghostToggle')?.checked ?? true;
const getMergeOn = () => document.getElementById('mergeToggle')?.checked ?? true;
const getMaxUniverses = () => +(document.getElementById('maxU')?.value ?? 24);
const getAnimOn = () => document.getElementById('animToggle')?.checked ?? true;

// ====== Color helpers ======
function parseHSL(c){
  const m = /hsl\((\d+(?:\.\d+)?)deg\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\)/.exec(c||'');
  if(!m) return {h:280,s:90,l:60};
  return {h:+m[1], s:+m[2], l:+m[3]};
}
function hslA(h,s,l,a=1){ return `hsl(${h}deg ${s}% ${l}% / ${a})`; }

// ====== Maze definition ======
// 0 empty, 1 wall, 2 crystal, 3 portal
const GRID = [
  "11111111111111111111",
  "10000020000100000003",
  "10111101110101111101",
  "10200101000201000001",
  "10110101111101011101",
  "10010100000101010001",
  "11110111110101110101",
  "10000000010100000101",
  "10111111010111110101",
  "10100001010000000101",
  "10101101011111110101",
  "10100101000002000101",
  "10111101111101111101",
  "10000000000001000001",
  "11111111111111111111"
].map(r=>r.split('').map(c=>+c));

const H = GRID.length;
const W = GRID[0].length;

let CELL = 32; // px (recalculated on resize)
const PADDING = 16;

const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

// Offscreen layer for base maze (faster + scalable for animation)
let mazeLayer = null, mazeCtx = null;
function buildMazeLayer(){
  mazeLayer = document.createElement('canvas');
  mazeLayer.width = canvas.width; mazeLayer.height = canvas.height;
  mazeCtx = mazeLayer.getContext('2d');
  const c = mazeCtx; c.clearRect(0,0,mazeLayer.width,mazeLayer.height);
  c.save(); c.translate(PADDING,PADDING);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const cx = x*CELL, cy = y*CELL;
      const t = GRID[y][x];
      if(t===1){ c.fillStyle = '#1c153a'; }
      else { c.fillStyle = (x+y)%2? '#151131':'#171236'; }
      c.fillRect(cx,cy,CELL-1,CELL-1);
      if(t===1){ drawEmojiTo(c,'🧱', cx+CELL/2, cy+CELL*0.62, SMALL_EMOJI_FONT); }
      else if(t===2){ drawEmojiTo(c,'💎', cx+CELL/2, cy+CELL*0.68, EMOJI_FONT); }
      else if(t===3){ drawEmojiTo(c,'🚪', cx+CELL/2, cy+CELL*0.7, EMOJI_FONT); }
    }
  }
  c.restore();
}

function resize(){
  const wrap = document.getElementById('mazeWrap') || canvas.parentElement || document.body;
  const usableW = Math.max(240, wrap.clientWidth - PADDING*2);
  const usableH = Math.max(240, Math.min(usableW*0.68, window.innerHeight*0.72) - PADDING*2);
  CELL = Math.max(18, Math.floor(Math.min(usableW/W, usableH/H)));
  canvas.width = Math.floor(W*CELL + PADDING*2);
  canvas.height = Math.floor(H*CELL + PADDING*2);
  buildMazeLayer();
  draw();
}
window.addEventListener('resize', resize);

// ====== Universe state ======
let universes = [];
let activeId = 0; // id of active universe
let nextId = 1;
let escapedCount = 0;
const history = [];

// Prevent test drawings from changing what the user sees
let SUSPEND_DRAW = false;

function pastel(i){
  const golden = 0.61803398875; // golden ratio conj to distribute hues
  const hue = (i*golden % 1)*360;
  return `hsl(${hue}deg 90% 65%)`;
}
function newUniverse(x,y){
  const id = nextId++;
  return { id, x, y, crystals:new Set(), escaped:false, stuck:false, steps:0, color:pastel(id), parent:null, gen:0 };
}

function startState(){
  universes = [ newUniverse(1,1) ];
  activeId = universes[0].id;
  nextId = universes[0].id+1;
  escapedCount = 0;
  history.length = 0;
  draw();
  renderUniverseList();
  updateStats();
}

const dirs = [ {dx:0,dy:-1,name:'up'}, {dx:1,dy:0,name:'right'}, {dx:0,dy:1,name:'down'}, {dx:-1,dy:0,name:'left'} ];
function openNeighbors(u){
  const res = [];
  for(const d of dirs){
    const nx = u.x + d.dx; const ny = u.y + d.dy;
    if(ny<0||ny>=H||nx<0||nx>=W) continue;
    if(GRID[ny][nx]!==1) res.push({nx,ny,dir:d.name});
  }
  return res;
}
function copyUniverse(u){
  return { id: nextId++, x:u.x, y:u.y, crystals:new Set([...u.crystals]), escaped:u.escaped, stuck:u.stuck, steps:u.steps, color:pastel(nextId), parent:u.id, gen:u.gen+1 };
}
function cellType(x,y){ return GRID[y][x]; }
function applyCellEffects(u){
  const t = cellType(u.x,u.y);
  if(t===2){ const k = key(u.x,u.y); if(!u.crystals.has(k)) u.crystals.add(k); }
  else if(t===3){ u.escaped = true; escapedCount++; }
}

function mergeUniversesIfNeeded(list){
  if(!getMergeOn()) return list;
  const map = new Map();
  for(const u of list){
    const k = `${u.x}|${u.y}|${[...u.crystals].sort().join(';')}|${u.escaped}`;
    const prev = map.get(k);
    if(!prev) map.set(k,u);
    else { prev.steps = Math.min(prev.steps, u.steps); prev.gen = Math.min(prev.gen, u.gen); }
  }
  return [...map.values()];
}
function clampUniverses(list){
  const max = getMaxUniverses();
  if(list.length<=max) return list;
  const portals = [];
  for(let y=0;y<H;y++){for(let x=0;x<W;x++){if(GRID[y][x]===3) portals.push({x,y});}}
  function nearestPortalDist(u){ let best=1e9; for(const p of portals){ const d=Math.abs(p.x-u.x)+Math.abs(p.y-u.y); if(d<best) best=d; } return best; }
  list.sort((a,b)=>{ const sa = (a.escaped?0:1)*1000 + a.crystals.size*10 - nearestPortalDist(a); const sb = (b.escaped?0:1)*1000 + b.crystals.size*10 - nearestPortalDist(b); return sb-sa; });
  return list.slice(0,max);
}
function pushHistory(){
  const snapshot = universes.map(u=>({ id:u.id,x:u.x,y:u.y,crystals:[...u.crystals],escaped:u.escaped,stuck:u.stuck,steps:u.steps,color:u.color,parent:u.parent,gen:u.gen }));
  history.push({activeId, escapedCount, nextId, snapshot});
  if(history.length>100) history.shift();
}
function popHistory(){
  const h = history.pop(); if(!h) return;
  activeId = h.activeId; escapedCount = h.escapedCount; nextId = h.nextId;
  universes = h.snapshot.map(o=>({ ...o, crystals:new Set(o.crystals) }));
  draw(); renderUniverseList(); updateStats();
}

// ====== Split animation ======
let isAnimating = false;
function drawEmojiTo(context, char, x, y, font){
  context.save();
  context.font = font; context.textAlign='center'; context.textBaseline='middle';
  context.fillText(char,x,y); context.restore();
}

// --- Hit testing (click a ghost to focus) ---
let hitDots = []; // {id,x,y,r,type:'ghost'|'active'} for last draw
function recordHit(u, ghost){
  const x = PADDING + u.x*CELL + CELL/2;
  const y = PADDING + u.y*CELL + CELL*0.72;
  const r = Math.min(CELL*0.5, 24);
  hitDots.push({id:u.id, x, y, r, type: ghost? 'ghost':'active'});
}
function toCanvasPoint(evt){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY };
}
function focusUniverseByPoint(x,y){
  let best=null; let bestD2=Infinity;
  for(const h of hitDots){
    const d2=(x-h.x)*(x-h.x)+(y-h.y)*(y-h.y);
    if(d2 <= h.r*h.r){
      const d2eff = h.type==='ghost' ? d2*0.5 : d2; // bias toward ghosts
      if(d2eff < bestD2){ bestD2=d2eff; best=h; }
    }
  }
  if(best && best.id!==activeId && best.type==='ghost'){
    activeId = best.id; draw(); renderUniverseList(); updateStats();
    return true;
  }
  return false;
}

function drawBranch(u, scale, dx, dy, alpha, posOverride){
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(dx,dy);
  ctx.scale(scale, scale);
  ctx.drawImage(mazeLayer, 0, 0); // base maze
  const gx = posOverride?.x ?? u.x;
  const gy = posOverride?.y ?? u.y;
  const x = PADDING + gx*CELL + CELL/2;
  const y = PADDING + gy*CELL + CELL*0.72;
  drawEmojiTo(ctx, '🦊', x, y, EMOJI_FONT);
  ctx.restore();
}

function pickFocus(parent, childrenAfterMove){
  // 1) Prefer stepping onto a crystal tile immediately
  let idx = childrenAfterMove.findIndex(c => cellType(c.x, c.y) === 2);
  if(idx >= 0) return idx;
  // 2) Then prefer stepping onto a portal
  idx = childrenAfterMove.findIndex(c => cellType(c.x, c.y) === 3);
  if(idx >= 0) return idx;
  // 3) Then any move that increases crystal count vs parent
  const parentCount = parent.crystals ? parent.crystals.size : 0;
  idx = childrenAfterMove.findIndex(c => c.crystals.size > parentCount);
  if(idx >= 0) return idx;
  // 4) Fallback: choose the one closest (Manhattan) to any portal
  const portals = [];
  for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ if(GRID[y][x]===3) portals.push({x,y}); } }
  function nearestPortalDist(x,y){ let best=1e9; for(const p of portals){ const d=Math.abs(p.x-x)+Math.abs(p.y-y); if(d<best) best=d; } return best; }
  let bestI = 0; let bestD = 1e9;
  for(let i=0;i<childrenAfterMove.length;i++){
    const c = childrenAfterMove[i];
    const d = nearestPortalDist(c.x, c.y);
    if(d < bestD){ bestD = d; bestI = i; }
  }
  return bestI;
}


function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function dropTrailCluster(x, y, sizePx, baseColor){
  const {h,s,l} = parseHSL(baseColor);
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  const d = Math.max(14, sizePx*1.0);
  dot.style.width = `${d}px`; dot.style.height = `${d}px`;
  dot.style.opacity = '0.98';
  dot.style.background = `radial-gradient(circle, ${hslA(h, s, Math.min(100,l+30), 0.95)} 0%, ${hslA(h, s, l, 0.9)} 45%, ${hslA(h, s, Math.max(0,l-10), 0.7)} 100%)`;
  dot.style.boxShadow = `0 0 24px ${hslA(h,s,l,0.95)}, 0 0 48px ${hslA(h,s,Math.max(0,l-5),0.85)}`;
  dot.style.transform = `translate(${x}px, ${y}px) scale(1)`;
  document.body.appendChild(dot);
  requestAnimationFrame(()=>{
    dot.style.opacity = '0';
    dot.style.transform = `translate(${x}px, ${y}px) scale(0.4)`;
  });
  setTimeout(()=>dot.remove(), 1100);

  ['✨','💫'].forEach((char)=>{
    const pip = document.createElement('div');
    pip.className = 'trail';
    pip.textContent = char;
    pip.style.fontSize = `${Math.max(22, sizePx*1.2)}px`;
    pip.style.opacity = '0.95';
    pip.style.textShadow = `0 0 14px ${hslA(h,s,l,0.95)}, 0 0 28px ${hslA(h,s,Math.max(0,l-5),0.85)}`;
    const jitter = (r)=> (Math.random()*2-1)*r;
    pip.style.transform = `translate(${x + jitter(22)}px, ${y + jitter(22)}px) scale(1)`;
    document.body.appendChild(pip);
    requestAnimationFrame(()=>{
      pip.style.opacity = '0';
      pip.style.transform = `translate(${x}px, ${y}px) scale(0.6)`;
    });
    setTimeout(()=>pip.remove(), 1100);
  });
}

function launchFlyers(childrenAnim, focusIdx, sQuad){
  const listEl = document.getElementById('universes');
  const rectC = canvas.getBoundingClientRect();
  const flyers = [];
  childrenAnim.forEach((child,i)=>{
    if(i===focusIdx) return;
    const startCorner = child._corner ?? i;
    const xOff = (canvas.width - canvas.width*sQuad);
    const yOff = (canvas.height - canvas.height*sQuad);
    const cornerMap = [ [0,0], [xOff,0], [0,yOff], [xOff,yOff] ];
    const [dx,dy] = cornerMap[startCorner%4];
    const startLeft = rectC.left + dx;
    const startTop = rectC.top + dy;

    const fly = document.createElement('canvas');
    fly.className = 'flyer';
    fly.width = Math.floor(canvas.width * sQuad);
    fly.height = Math.floor(canvas.height * sQuad);
    fly.style.left = `${startLeft}px`;
    fly.style.top = `${startTop}px`;
    fly.style.transform = 'scale(1)';
    fly.style.opacity = '0.95';
    document.body.appendChild(fly);
    const fctx = fly.getContext('2d');
    fctx.save();
    fctx.scale(sQuad, sQuad);
    fctx.drawImage(mazeLayer, 0, 0);
    const fx = PADDING + child.animStart.x*CELL + CELL/2;
    const fy = PADDING + child.animStart.y*CELL + CELL*0.72;
    drawEmojiTo(fctx, '🦊', fx, fy, EMOJI_FONT);
    fctx.restore();
    flyers.push({fly, child, startLeft, startTop});
  });

  requestAnimationFrame(()=>{
    flyers.forEach(({fly, child, startLeft, startTop})=>{
      const row = document.getElementById(`u-${child.id}`);
      const destRect = row ? row.getBoundingClientRect() : listEl.getBoundingClientRect();
      const destX = destRect.left + Math.min(60, destRect.width*0.18);
      const destY = destRect.top + destRect.height/2 - fly.height*0.12;
      const D4 = 950; // ms
      const start = performance.now();
      let lastTrail = start;
      function step(now){
        const t = Math.min(1, (now - start)/D4);
        const e = easeOutCubic(t);
        const x = startLeft + (destX - startLeft)*e;
        const y = startTop + (destY - startTop)*e;
        const s = 1 - 0.6*e;
        const a = 0.95 * (1 - e);
        fly.style.left = `${x}px`;
        fly.style.top = `${y}px`;
        fly.style.transform = `scale(${s})`;
        fly.style.opacity = `${a}`;
        if(now - lastTrail > 28){
          dropTrailCluster(x + fly.width*0.5, y + fly.height*0.5, 26*s, child.color);
          lastTrail = now;
        }
        if(t<1) requestAnimationFrame(step);
        else {
          fly.remove();
          const rowNow = document.getElementById(`u-${child.id}`);
          if(rowNow){ rowNow.classList.add('flash'); setTimeout(()=>rowNow.classList.remove('flash'), 900); }
        }
      }
      requestAnimationFrame(step);
    });
  });
}

function renderUniverseListFrom(list, focusId, asPreview=false){
  const el = document.getElementById('universes'); if(!el) return;
  el.innerHTML = '';
  const arr = [...list].sort((a,b)=> (b.id===focusId)-(a.id===focusId) || b.crystals.size - a.crystals.size || a.steps-b.steps);
  for(const u of arr){
    const row = document.createElement('div'); row.className = 'u'+(u.id===focusId?' active':'')+(asPreview?' preview':''); row.role='listitem';
    row.id = `u-${u.id}`;
    row.innerHTML = `
      <div class="chip" style="background:${u.color}"></div>
      <div>
        <div><b>#${u.id}</b> ${u.escaped?'<span style=\"color: var(--good)\">escaped</span>':u.stuck?'<span style=\"color: var(--warn)\">stuck</span>':''}</div>
        <div class="meta">steps ${u.steps} • crystals ${u.crystals.size}${u.parent?` • from #${u.parent}`:''}</div>
      </div>
    `;
    el.appendChild(row);
  }
}

function animateActiveSplit(parentU, childrenAnim, childrenAfterMove, done, previewList){
  isAnimating = true;
  const focusIdx = pickFocus(parentU, childrenAfterMove);
  const start = performance.now();
  const D1 = 520, D2 = 520, Dmove = 900, Dgrow = 900; // ms
  const sFull = 1.0, sMid = 0.65, sQuad = 0.5;
  const centerDX = (canvas.width - canvas.width*sMid)/2;
  const centerDY = (canvas.height - canvas.height*sMid)/2;
  let launched = false;
  function cornerDX(scale, corner){
    const x = (canvas.width - canvas.width*scale);
    const y = (canvas.height - canvas.height*scale);
    if(corner===0) return [0,0]; if(corner===1) return [x,0]; if(corner===2) return [0,y]; return [x,y];
  }
  function frame(now){
    const t = now - start;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(t < D1){
      const p = t/D1; const s = sFull + (sMid - sFull)*p;
      const dx = (canvas.width - canvas.width*s)/2;
      const dy = (canvas.height - canvas.height*s)/2;
      drawBranch(parentU, s, dx, dy, 1);
    } else if(t < D1 + D2){
      const q = (t - D1)/D2;
      childrenAnim.forEach((child,i)=>{
        const [tx,ty] = cornerDX(sQuad, i);
        const dx = centerDX + (tx - centerDX)*q;
        const dy = centerDY + (ty - centerDY)*q;
        const s = sMid + (sQuad - sMid)*q;
        drawBranch(child, s, dx, dy, 1, child.animStart);
      });
    } else if(t < D1 + D2 + Dmove){
      const r = (t - D1 - D2)/Dmove;
      childrenAnim.forEach((child,i)=>{
        const [tx,ty] = cornerDX(sQuad, i);
        const gx = child.animStart.x + (child.animTarget.x - child.animStart.x)*r;
        const gy = child.animStart.y + (child.animTarget.y - child.animStart.y)*r;
        drawBranch(child, sQuad, tx, ty, 1, {x:gx, y:gy});
      });
    } else if(t < D1 + D2 + Dmove + Dgrow){
      if(!launched){
        const chosen = childrenAfterMove[focusIdx]?.id;
        if(previewList){ renderUniverseListFrom(previewList, chosen, true); }
        launchFlyers(childrenAnim, focusIdx, sQuad);
        launched = true;
      }
      const r2 = (t - D1 - D2 - Dmove)/Dgrow;
      childrenAnim.forEach((child,i)=>{
        const [tx,ty] = cornerDX(sQuad, i);
        if(i===focusIdx){
          const s = sQuad + (sFull - sQuad)*r2;
          const dx = tx + (0 - tx)*r2;
          const dy = ty + (0 - ty)*r2;
          drawBranch(child, s, dx, dy, 1, child.animTarget);
        } else {
          const s = sQuad * (1 - 0.5*r2);
          const dx = tx + (canvas.width*0.04 - tx)*r2;
          const dy = ty + (canvas.height*0.04 - ty)*r2;
          const a = 1 - r2;
          drawBranch(child, s, dx, dy, a, child.animTarget);
        }
      });
    } else {
      isAnimating = false;
      done(focusIdx, sQuad);
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ====== Actions ======
function decaySplit(){
  if(isAnimating) return;
  const modeMany = getModeMany();
  pushHistory();
  let next = [];
  let parentForAnim = null, childrenAnim = null, childrenAfterMove = null;
  for(const u of universes){
    if(u.escaped){ next.push(u); continue; }
    const neigh = openNeighbors(u);
    if(neigh.length===0){ u.stuck=true; next.push(u); continue; }
    if(modeMany){
      const order = shuffle(neigh);
      const kidsReal = []; const kidsAnimTmp = [];
      order.forEach(({nx,ny}, i)=>{
        const nu = copyUniverse(u); nu.x = nx; nu.y = ny; nu.steps++; applyCellEffects(nu); nu._corner = i; kidsReal.push(nu); next.push(nu);
        const na = { ...nu, x:u.x, y:u.y };
        na.animStart = {x:u.x, y:u.y};
        na.animTarget = {x:nx, y:ny};
        kidsAnimTmp.push(na);
      });
      if(u.id===activeId){ parentForAnim = {...u}; childrenAnim = kidsAnimTmp.slice(0,4); childrenAfterMove = kidsReal.slice(0,4); }
    } else {
      if(u.id!==activeId){ next.push(u); continue; }
      const {nx,ny} = neigh[rand(neigh.length)];
      u.x=nx; u.y=ny; u.steps++; applyCellEffects(u); next.push(u);
    }
  }
  if(modeMany){
    next = next.filter(u=>u.parent!==null || u.escaped || u.stuck);
  }
  const previewMerged = clampUniverses(mergeUniversesIfNeeded(next));

  const finalize = (focusIdx, sQuad)=>{
    let merged = mergeUniversesIfNeeded(next);
    merged = clampUniverses(merged);
    universes = merged;
    if(childrenAfterMove && typeof focusIdx==='number'){
      const chosenId = childrenAfterMove[focusIdx]?.id;
      if(chosenId && universes.some(u=>u.id===chosenId)) activeId = chosenId;
      else if(!universes.find(u=>u.id===activeId)){
        universes.sort((a,b)=>b.crystals.size-a.crystals.size);
        if(universes[0]) activeId = universes[0].id;
      }
    }
    draw(); renderUniverseList(); updateStats();
  };
  if(modeMany && getAnimOn() && parentForAnim && childrenAnim && childrenAfterMove){
    animateActiveSplit(parentForAnim, childrenAnim, childrenAfterMove, finalize, previewMerged);
  } else if (modeMany && parentForAnim && childrenAfterMove) { const f = pickFocus(parentForAnim, childrenAfterMove); finalize(f, 0.5); } else { finalize(0, 0.5); }
}

function stepActive(){
  if(isAnimating) return;
  pushHistory();
  const u = universes.find(v=>v.id===activeId);
  if(!u || u.escaped) return;
  const neigh = openNeighbors(u);
  if(neigh.length===0){ u.stuck=true; draw(); renderUniverseList(); return; }
  const {nx,ny} = neigh[rand(neigh.length)];
  u.x=nx; u.y=ny; u.steps++; applyCellEffects(u);
  draw(); renderUniverseList(); updateStats();
}

// ====== Rendering ======
function draw(){
  if(SUSPEND_DRAW) return;
  const showGhosts = getGhostsOn();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  hitDots.length = 0;
  ctx.drawImage(mazeLayer, 0, 0);
  if(showGhosts){ for(const u of universes){ if(u.id!==activeId){ drawExplorer(u,true); recordHit(u,true); } } }
  const active = universes.find(u=>u.id===activeId); if(active){ drawExplorer(active,false); recordHit(active,false); }
}

function drawExplorer(u, ghost){
  const x = PADDING + u.x*CELL + CELL/2, y = PADDING + u.y*CELL + CELL*0.72;
  ctx.save(); ctx.globalAlpha = ghost? 0.72 : 1; drawEmojiTo(ctx, ghost? '👻' : '🦊', x, y, EMOJI_FONT); ctx.restore();
}

// ====== UI: universe list ======
function renderUniverseList(){
  if(SUSPEND_DRAW) return;
  const el = document.getElementById('universes'); if(!el) return;
  el.innerHTML = '';
  universes.sort((a,b)=> (b.id===activeId)-(a.id===activeId) || b.crystals.size - a.crystals.size || a.steps-b.steps);
  for(const u of universes){
    const row = document.createElement('div'); row.className = 'u'+(u.id===activeId?' active':''); row.role='listitem';
    row.id = `u-${u.id}`;
    row.innerHTML = `
      <div class=\"chip\" style=\"background:${u.color}\"></div>
      <div>
        <div><b>#${u.id}</b> ${u.escaped?'<span style=\\"color: var(--good)\\">escaped</span>':u.stuck?'<span style=\\"color: var(--warn)\\">stuck</span>':''}</div>
        <div class=\"meta\">steps ${u.steps} • crystals ${u.crystals.size}${u.parent?` • from #${u.parent}`:''}</div>
      </div>
      <div style=\"margin-left:auto;display:flex;gap:6px\">
        <button class=\"btn ghost\" data-act=\"focus\" data-id=\"${u.id}\">Focus</button>
        <button class=\"btn ghost\" data-act=\"prune\" data-id=\"${u.id}\">Prune</button>
      </div>
    `;
    el.appendChild(row);
  }
  el.onclick = (ev)=>{
    const b = ev.target.closest('button'); if(!b) return;
    const id = +b.dataset.id; const act = b.dataset.act;
    if(act==='focus'){ activeId = id; draw(); renderUniverseList(); updateStats(); }
    if(act==='prune'){
      pushHistory(); universes = universes.filter(u=>u.id!==id);
      if(activeId===id && universes[0]) activeId = universes[0].id;
      draw(); renderUniverseList(); updateStats();
    }
  };
}

function updateStats(){
  if(SUSPEND_DRAW) return;
  const uEl = document.getElementById('statUniverses'); if(uEl) uEl.textContent = String(universes.length);
  const active = universes.find(u=>u.id===activeId);
  const cEl = document.getElementById('statCrystals'); if(cEl) cEl.textContent = active? active.crystals.size : 0;
  const eEl = document.getElementById('statEscaped'); if(eEl) eEl.textContent = String(universes.filter(u=>u.escaped).length);
}

// ====== Canvas hit interactions ======
canvas.addEventListener('pointermove', (e)=>{
  if(isAnimating || !getGhostsOn()) { canvas.style.cursor='default'; return; }
  const p = toCanvasPoint(e);
  let overGhost = false;
  for(const h of hitDots){
    if(h.type!=='ghost') continue;
    const d2=(p.x-h.x)*(p.x-h.x)+(p.y-h.y)*(p.y-h.y);
    if(d2 <= h.r*h.r){ overGhost = true; break; }
  }
  canvas.style.cursor = overGhost ? 'pointer' : 'default';
});
canvas.addEventListener('pointerdown', (e)=>{
  if(isAnimating || !getGhostsOn()) return;
  const p = toCanvasPoint(e);
  focusUniverseByPoint(p.x, p.y);
});

// ====== Controls ======
document.getElementById('decayBtn')?.addEventListener('click', decaySplit);
document.getElementById('stepBtn')?.addEventListener('click', stepActive);
document.getElementById('rewindBtn')?.addEventListener('click', popHistory);
document.getElementById('resetBtn')?.addEventListener('click', ()=>{ if(isAnimating) return; startState(); });
document.getElementById('ghostToggle')?.addEventListener('change', draw);
document.getElementById('mergeToggle')?.addEventListener('change', draw);
// --- Ensure and sync MaxU bubble ---
function ensureMaxUBubble(){
  const slider = document.getElementById('maxU');
  if(!slider) return;
  let out = document.getElementById('maxUOut');
  if(!out){
    out = document.createElement('output');
    out.id = 'maxUOut';
    out.className = 'bubble';
    out.setAttribute('for','maxU');
    slider.insertAdjacentElement('afterend', out);
  }
}
function updateMaxUDisplay(){
  const s=document.getElementById('maxU');
  const o=document.getElementById('maxUOut');
  if(s&&o){ o.textContent = s.value; }
}
document.getElementById('maxU')?.addEventListener('input', ()=>{ ensureMaxUBubble(); updateMaxUDisplay(); draw(); });
document.getElementById('animToggle')?.addEventListener('change', ()=>{});
document.getElementById('showStoryBtn')?.addEventListener('click', ()=>showStory(true));
document.getElementById('resetStoryBtn')?.addEventListener('click', ()=>{ sessionStorage.removeItem('mwm_skip_story'); alert('Story will show on next reload.'); });
// initialize bubble now
ensureMaxUBubble();
updateMaxUDisplay();

// Diagnostics
const runBtn = document.getElementById('runTestsBtn');
if(runBtn){ runBtn.addEventListener('click', ()=>{ const logEl = document.getElementById('testLog'); if(logEl) logEl.textContent = 'Running…'; runTests(); }); }
const diag = document.getElementById('diagnostics');
if(diag){ diag.addEventListener('toggle', (e)=>{ if(e.target.open && !e.target.dataset.ran){ e.target.dataset.ran='1'; const logEl = document.getElementById('testLog'); if(logEl) logEl.textContent = 'Running…'; runTests(); } }); }

window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); decaySplit(); }
  if(e.key==='u' || e.key==='U'){ if(!isAnimating) popHistory(); }
  if(e.key==='r' || e.key==='R'){ if(!isAnimating) startState(); }
  if(e.key==='g' || e.key==='G'){ const t=document.getElementById('ghostToggle'); if(t){ t.checked=!t.checked; } draw(); }
});

// ====== Story overlay logic ======
function showStory(show){
  const el = document.getElementById('story');
  if(!el) return;
  el.style.display = show ? 'grid' : 'none';
}
document.getElementById('startBtn')?.addEventListener('click', ()=>{ showStory(false); startState(); });
document.getElementById('skipOnce')?.addEventListener('click', ()=>{
  sessionStorage.setItem('mwm_skip_story', '1');
  const msg = document.getElementById('skipOnce'); if(msg) { msg.textContent = 'Will skip next time (this tab).'; msg.style.pointerEvents='none'; }
});

// ====== Test sandbox helpers ======
function snapshotState(){
  return {
    activeId,
    nextId,
    escapedCount,
    universes: universes.map(u=>({ ...u, crystals:[...u.crystals] })),
    controls: {
      modeMany: !!document.getElementById('modeMany')?.checked,
      anim: !!document.getElementById('animToggle')?.checked,
      ghosts: !!document.getElementById('ghostToggle')?.checked,
      merge: !!document.getElementById('mergeToggle')?.checked,
      maxU: +(document.getElementById('maxU')?.value ?? 24)
    }
  };
}
function restoreState(snap){
  activeId = snap.activeId; nextId = snap.nextId; escapedCount = snap.escapedCount;
  universes = snap.universes.map(o=>({ ...o, crystals:new Set(o.crystals) }));
  const cm = document.getElementById('modeMany'); if(cm) cm.checked = snap.controls.modeMany;
  const ca = document.getElementById('animToggle'); if(ca) ca.checked = snap.controls.anim;
  const cg = document.getElementById('ghostToggle'); if(cg) cg.checked = snap.controls.ghosts;
  const cmerge = document.getElementById('mergeToggle'); if(cmerge) cmerge.checked = snap.controls.merge;
  const cmax = document.getElementById('maxU'); if(cmax) cmax.value = snap.controls.maxU;
  ensureMaxUBubble();
  updateMaxUDisplay();
  draw(); renderUniverseList(); updateStats();
}

// ====== Tests ======
function runTests(){
  const logEl = document.getElementById('testLog');
  const out = [];
  const setAnim = (v)=>{ const cb=document.getElementById('animToggle'); if(cb) cb.checked=v; };

  const snap = snapshotState();
  SUSPEND_DRAW = true;
  ensureMaxUBubble();
  function t(name, fn){ try{ fn(); out.push(`<div class='pass'>✔ ${name}</div>`); } catch(e){ out.push(`<div class='fail'>✘ ${name}: ${e.message}</div>`); console.error(name, e); } }

  try{
    t('DOM: #mazeCanvas exists', ()=>{ if(!canvas) throw new Error('canvas null'); });
    t('DOM: #mazeWrap exists', ()=>{ const w = document.getElementById('mazeWrap'); if(!w) throw new Error('mazeWrap missing'); });
    t('resize() sets positive size', ()=>{ resize(); if(canvas.width<=0||canvas.height<=0) throw new Error('canvas not sized'); });
    t('startState() initializes one universe', ()=>{ startState(); if(universes.length!==1) throw new Error('expected 1'); });
    t('stepActive() moves or marks stuck', ()=>{ const before = {...universes[0]}; stepActive(); const u = universes.find(v=>v.id===activeId); if(u.steps===before.steps && !u.stuck) throw new Error('no change'); });
    t('decaySplit() in Many‑Worlds increases count (animation OFF)', ()=>{ setAnim(false); document.getElementById('modeMany').checked = true; startState(); decaySplit(); if(universes.length<=1) throw new Error('did not branch'); setAnim(true); });
    t('rewind restores previous count', ()=>{ const n = universes.length; decaySplit(); popHistory(); if(universes.length!==n) throw new Error('rewind failed'); });
    t('clamp respects Max universes', ()=>{ const slider = document.getElementById('maxU'); slider.value = 4; slider.dispatchEvent(new Event('input')); startState(); for(let i=0;i<3;i++) decaySplit(); if(universes.length>4) throw new Error('clamp failed: '+universes.length); });
    t('MaxU output mirrors slider', ()=>{ const slider=document.getElementById('maxU'); const outEl=document.getElementById('maxUOut'); slider.value='17'; slider.dispatchEvent(new Event('input')); if(outEl.textContent!=='17') throw new Error('output not synced'); });
    t('focus prefers crystal branch', ()=>{
      const oldAnim = document.getElementById('animToggle').checked; setAnim(false); document.getElementById('modeMany').checked = true; startState();
      universes[0].x = 5; universes[0].y = 1; activeId = universes[0].id;
      decaySplit();
      const active = universes.find(u=>u.id===activeId);
      if(!(active.x===6 && active.y===1)) throw new Error(`active not on crystal branch: at (${active.x},${active.y})`);
      setAnim(oldAnim);
    });
  } finally {
    SUSPEND_DRAW = false;
    restoreState(snap);
    if(logEl) logEl.innerHTML = out.join('');
  }
}

// ====== Init ======
resize();
const skip = sessionStorage.getItem('mwm_skip_story') === '1';
if(skip){ showStory(false); startState(); }
else { showStory(true); draw(); }
updateMaxUDisplay();