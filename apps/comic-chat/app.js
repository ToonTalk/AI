"use strict";

/* ============================== art registry ============================== */
let HAVE_ORIGINAL = (typeof CC_ORIGINAL_ART !== "undefined") && CC_ORIGINAL_ART &&
                    Object.keys(CC_ORIGINAL_ART).length > 0;
const STYLES = {
  modern:   {label:"Modern (drawn)",       art: MODERN_ART},
  original: {label:"Original (Microsoft)", art: HAVE_ORIGINAL ? CC_ORIGINAL_ART : null}
};
/* The artifact build ships without the 2 MB artwork; an artpack file loaded at
   runtime installs it through here. */
function installOriginalArt(art, backdrops){
  if(!art || !Object.keys(art).length) return;
  STYLES.original.art = art;
  HAVE_ORIGINAL = true;
  if(backdrops) for(const k of Object.keys(backdrops)) CC_BACKDROPS[k] = backdrops[k];
  const opt = document.querySelector('#artsel option[value="original"]');
  if(opt) opt.disabled = false;
  refreshScenes();
  document.getElementById("artsel").value = "original";
  document.getElementById("artsel").onchange();
  updateStatusNote();
}
function artset(){ const s = STYLES[state.style]; return (s && s.art) ? s.art : MODERN_ART; }
function getArt(id){ const a = artset(); return a[id] || a[Object.keys(a)[0]]; }
function castIds(){ return Object.keys(artset()); }

/* ================================= state ================================= */
const DEFAULT_STYLE = HAVE_ORIGINAL ? "original" : "modern";
// backID 0 (no backdrop, white paper) is what the original shipped with
let state = { msgs:[], bg:"none", style:DEFAULT_STYLE, wide:3, title:true };
try{
  const s = JSON.parse(localStorage.getItem("comicchat-v2"));
  if(s && s.msgs) state = Object.assign(state, s);
}catch(e){}
if(!STYLES[state.style] || (state.style === "original" && !HAVE_ORIGINAL)) state.style = DEFAULT_STYLE;
if(state.bg !== "none" && !CC_BACKDROPS[state.bg]) state.bg = "none";   // e.g. saved pre-.bgb names
function persist(){ try{ localStorage.setItem("comicchat-v2", JSON.stringify(state)); }catch(e){} }

let curChar = null;
let curMode = "say";
const wheelState = {};   // charId -> {emotion, intensity, touched}

function ensureCast(){
  const ids = castIds();
  if(!curChar || ids.indexOf(curChar) === -1) curChar = ids[0];
  for(const id of ids) if(!wheelState[id]) wheelState[id] = {emotion:EM.HAPPY, intensity:0, touched:false};
}

/* ============================ balloon geometry ============================ */
function edgePoints(x0,y0,x1,y1,nx,ny,phase){
  const pts = [], len = Math.hypot(x1-x0, y1-y0);
  const n = Math.max(2, Math.round(len / WAVE_INTERVAL));
  for(let i=0;i<n;i++){
    const t = i/n;
    const s = ((i + phase) % 2) ? -1 : 1;
    pts.push({x: x0+(x1-x0)*t + nx*WAVE_H*s, y: y0+(y1-y0)*t + ny*WAVE_H*s});
  }
  return pts;
}
/* Closed uniform cubic B-spline through the wavy control points — the
   original's CBeta spline (balloon.cpp CreateBalloonSpline). An approximating
   spline rounds the bumps into Woodring's soft cloud lobes; the interpolating
   scallops used before read sharp and angular. */
function bsplineClosed(pts){
  const n = pts.length;
  if(n < 3) return "";
  const f = v=>v.toFixed(1);
  const P = i=>pts[(i+n)%n];
  let d = "";
  for(let i=0;i<n;i++){
    const p0=P(i-1), p1=P(i), p2=P(i+1), p3=P(i+2);
    const b0={x:(p0.x+4*p1.x+p2.x)/6, y:(p0.y+4*p1.y+p2.y)/6};
    const b1={x:(2*p1.x+p2.x)/3,      y:(2*p1.y+p2.y)/3};
    const b2={x:(p1.x+2*p2.x)/3,      y:(p1.y+2*p2.y)/3};
    const b3={x:(p1.x+4*p2.x+p3.x)/6, y:(p1.y+4*p2.y+p3.y)/6};
    d += (i ? "" : `M ${f(b0.x)} ${f(b0.y)}`) +
         ` C ${f(b1.x)} ${f(b1.y)} ${f(b2.x)} ${f(b2.y)} ${f(b3.x)} ${f(b3.y)}`;
  }
  return d + " Z";
}
function cloudPath(r){
  const top    = edgePoints(r.left, r.top, r.right, r.top, 0, -1, 0);
  const right  = edgePoints(r.right, r.top, r.right, r.bottom, 1, 0, 1);
  const bottom = edgePoints(r.right, r.bottom, r.left, r.bottom, 0, 1, 0);
  const left   = edgePoints(r.left, r.bottom, r.left, r.top, -1, 0, 1);
  return bsplineClosed(top.concat(right, bottom, left));
}
/* The tail: two opposing arcs (CArc bulge = 5% of tail length), drawn OVER the
   cloud so its white fill opens the balloon border at the mouth. The apex
   stays AT the speaker — the 45-degree clamp moves the MOUTH along the
   balloon's bottom edge (balloon.cpp:1466), never the apex; swinging the apex
   sideways is what made tails wander across neighboring balloons. */
function tailPath(b, body, dashed, others){
  if(!body) return "";
  const c = b.cloud;
  const ax = body.arrowX;
  let ay = body.top - 200;
  if(ay - c.bottom < MIN_TAIL_H) ay = c.bottom + MIN_TAIL_H;
  const heightDelta = ay - c.bottom;
  const mouthY = c.bottom - 40;                              // tucked inside the border
  const clampMouth = x => Math.max(c.left + TAIL_MOUTH + 40, Math.min(c.right - TAIL_MOUTH - 40, x));
  let xbreak = (b.routeRgn.left + b.routeRgn.right)/2;
  if(Math.abs(ax - xbreak) > heightDelta)                    // 45° from vertical
    xbreak = ax - Math.sign(ax - xbreak) * heightDelta;
  xbreak = clampMouth(xbreak);

  const q = (P, Q, bulge)=>{
    const mx=(P.x+Q.x)/2, my=(P.y+Q.y)/2;
    const dx=Q.x-P.x, dy=Q.y-P.y, len=Math.hypot(dx,dy)||1;
    return {x: mx - dy/len*2*bulge, y: my + dx/len*2*bulge};
  };
  // The clamps above can still route a tail alongside (or across) a sibling
  // balloon. Sample the arcs against the siblings' clouds (inflated for the
  // spline wobble) and escalate: normal bulge -> straight -> mouth moved as
  // close under the speaker as the cloud allows.
  const rects = (others||[]).filter(o=>o!==b && o.cloud && o.msg.mode!=="action")
    .map(o=>({l:o.cloud.left-84, t:o.cloud.top-84, r:o.cloud.right+84, b:o.cloud.bottom+84}));
  const hits = (L, A, R, c1, c2)=>{
    if(!rects.length) return false;
    const probe = (P, C, Q)=>{
      for(let t=0.05; t<1; t+=0.09){
        const x=(1-t)*(1-t)*P.x + 2*(1-t)*t*C.x + t*t*Q.x;
        const y=(1-t)*(1-t)*P.y + 2*(1-t)*t*C.y + t*t*Q.y;
        for(const rc of rects) if(x>rc.l && x<rc.r && y>rc.t && y<rc.b) return true;
      }
      return false;
    };
    return probe(L,c1,A) || probe(A,c2,R);
  };
  const build = (mx, bulgeScale)=>{
    const L = {x: mx - TAIL_MOUTH, y: mouthY};
    const R = {x: mx + TAIL_MOUTH, y: mouthY};
    const A = {x: ax, y: ay};
    const alt = Math.min(0.05 * Math.hypot(ax - mx, ay - mouthY), 120) * bulgeScale;
    const sign = ax > mx ? 1 : -1;
    return {L, R, A, c1: q(L, A, sign*alt), c2: q(A, R, -sign*alt)};
  };
  let g = build(xbreak, 1);
  if(hits(g.L, g.A, g.R, g.c1, g.c2)){
    g = build(xbreak, 0);                                    // straighten
    if(hits(g.L, g.A, g.R, g.c1, g.c2)) g = build(clampMouth(ax), 0);  // drop from under the speaker
  }
  const f = v=>v.toFixed(1);
  const d = `M ${f(g.L.x)} ${f(g.L.y)} Q ${f(g.c1.x)} ${f(g.c1.y)} ${f(g.A.x)} ${f(g.A.y)}`+
            ` Q ${f(g.c2.x)} ${f(g.c2.y)} ${f(g.R.x)} ${f(g.R.y)}`;
  const stroke = dashed ? ` stroke-dasharray="150 90" stroke="#777"` : ` stroke="#000"`;
  return `<path class="tail" d="${d}" fill="#fff"${stroke} stroke-width="28" stroke-linejoin="round"/>`;
}
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function balloonSvg(b, body, siblings){
  const m = b.msg, c = b.cloud, pad = b.pad;
  const italic = m.mode === "whisper";
  const lines = b.text.lines;
  const parts = [];

  if(m.mode === "action"){
    parts.push(`<rect x="${c.left}" y="${c.top}" width="${c.right-c.left}" height="${c.bottom-c.top}" fill="#fff" stroke="#000" stroke-width="28"/>`);
  } else {
    const dash = italic ? ` stroke-dasharray="150 90"` : "";
    const stroke = italic ? "#777" : "#000";
    if(italic) parts.push(`<path d="${cloudPath(c)}" fill="#fff" stroke="#fff" stroke-width="100"/>`);
    parts.push(`<path d="${cloudPath(c)}" fill="#fff" stroke="${stroke}" stroke-width="28"${dash}/>`);
    if(m.mode !== "think") parts.push(tailPath(b, body, italic, siblings));
    if(m.mode === "think" && body){
      // chain of ellipses growing toward the balloon (balloon.cpp:1826)
      const ex = (b.routeRgn.left + b.routeRgn.right)/2, ey = c.bottom;
      const tx = body.arrowX, ty = Math.max(body.top - 200, ey + MIN_TAIL_H);
      const dy = ty - ey;
      const n = Math.max(1, Math.floor((dy + INTERBUBBLE) / (BUBBLE_H + INTERBUBBLE)));
      const wd = n > 1 ? (ENDBUBBLE_W - BUBBLE_H) / (2*(n-1)) : 0;
      for(let i=0;i<n;i++){
        const t = n === 1 ? 0 : i/(n-1);
        const cx = tx + (ex-tx)*(1-t), cy = ty + (ey-ty)*t;
        const rx = (BUBBLE_H + 2*wd*i)/2, ry = BUBBLE_H/2;
        parts.push(`<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="#fff" stroke="#000" stroke-width="28"/>`);
      }
    }
  }

  const leftJust = m.mode === "action";
  const tx = leftJust ? c.left + pad.x : (c.left + c.right)/2;
  const anchor = leftJust ? "start" : "middle";
  const y0 = c.top + pad.y + LINE_HEIGHT*0.78;
  lines.forEach((ln,i)=>{
    parts.push(`<text x="${tx.toFixed(0)}" y="${(y0 + i*LINE_HEIGHT).toFixed(0)}" text-anchor="${anchor}" `+
      `font-family="Comic Sans MS, Comic Sans, cursive" font-size="${FONT_TWIPS}" font-weight="700"`+
      `${italic?' font-style="italic"':''} fill="#000">${esc(ln)}</text>`);
  });
  return parts.join("");
}

/* ============================== panel render ============================== */
function backdropSvg(panel){
  const bd = CC_BACKDROPS[state.bg];
  if(!bd) return `<rect width="${S}" height="${S}" fill="#fff"/>`;
  const z = panel.zoom || 1;
  // crop follows the character zoom, anchored at the left edge and sliding down
  const w = S*z, h = S*z;
  const y = -BACKDROP_ANCHOR * (1 - 1/z) * S * z;
  return `<image href="data:image/png;base64,${bd.png}" x="0" y="${y.toFixed(0)}" `+
         `width="${w.toFixed(0)}" height="${h.toFixed(0)}" preserveAspectRatio="none"/>`;
}
/* The artwork is drawn ~480px tall and displayed smaller. Smooth downscaling is
   area-averaging, so it conserves ink almost exactly: Anna measures 40.4% black
   natively and still 35.9% at a 5x reduction. An earlier gamma curve here was
   over-inking by 5-13 points and turning the cast into silhouettes; plain
   smooth scaling is the faithful choice. */
function bodySvg(panel, body){
  const art = getArt(body.charId);
  const dm = body.dm || art.nat;      // per-pose composite box from the engine
  const scale = body.height / dm.h;
  const tx = body.left - dm.x*scale;
  const ty = body.top  - dm.y*scale;
  const inner = art.draw(body.pose.face, body.pose.torso);
  const cx = (body.left + body.right)/2;
  const wrap = body.flip ? ` transform="translate(${(2*cx).toFixed(0)},0) scale(-1,1)"` : "";
  return `<g${wrap}><g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${inner}</g></g>`;
}
function titlePanelSvg(){
  const ids = [];
  for(const m of state.msgs) if(ids.indexOf(m.charId) === -1) ids.push(m.charId);
  const show = ids.slice(0,5);
  const parts = [`<rect width="${S}" height="${S}" fill="#fff"/>`];
  parts.push(`<text x="${S/2}" y="640" text-anchor="middle" font-family="Comic Sans MS, cursive" `+
             `font-size="520" font-weight="700" fill="#000">STARRING</text>`);
  if(show.length){
    const casts = show.map(id=>{
      const art = getArt(id);
      const pose = bodyFromEmotion(art, EM.HAPPY, 0, -1);
      const dm = art.dim ? art.dim(pose.face, pose.torso) : art.nat;
      return {art, pose, dm};
    });
    let h = S*0.44;
    let widths = casts.map(c=>h*c.dm.w/c.dm.h);
    let sum = widths.reduce((s,w)=>s+w, 0);
    const maxRow = S*0.90;                       // leave room for gutters
    if(sum > maxRow){ const k = maxRow/sum; h *= k; widths = widths.map(w=>w*k); sum = maxRow; }
    const margin = (S - sum) / (show.length + 1);
    const baseline = S*0.86;
    let x = margin;
    casts.forEach((c,i)=>{
      const w = widths[i], scale = h / c.dm.h;
      parts.push(`<g transform="translate(${(x - c.dm.x*scale).toFixed(1)},${(baseline - h - c.dm.y*scale).toFixed(1)}) scale(${scale.toFixed(4)})">${c.art.draw(c.pose.face,c.pose.torso)}</g>`);
      const nm = c.art.name.toUpperCase();
      const fs = Math.min(230, FONT_TWIPS * (w*0.98) / Math.max(1, textWidth(nm, false)));
      parts.push(`<text x="${(x + w/2).toFixed(0)}" y="${(S*0.95).toFixed(0)}" text-anchor="middle" `+
                 `font-family="Comic Sans MS, cursive" font-size="${fs.toFixed(0)}" font-weight="700" fill="#000">${esc(nm)}</text>`);
      x += w + margin;
    });
  }
  parts.push(`<rect x="${BORDER_W}" y="${BORDER_W}" width="${S-2*BORDER_W}" height="${S-2*BORDER_W}" fill="none" stroke="#000" stroke-width="${2*BORDER_W}"/>`);
  return parts.join("");
}
function panelSvg(panel, px){
  let inner;
  if(panel.title){
    inner = titlePanelSvg();
  } else {
    const parts = [backdropSvg(panel)];
    for(const b of panel.bodies) parts.push(bodySvg(panel, b));
    // drawn tail-to-head so the FIRST balloon ends up on top (panel.cpp:695)
    for(let i=panel.balloons.length-1;i>=0;i--){
      const b = panel.balloons[i];
      if(b.cloud) parts.push(balloonSvg(b, b.speaker, panel.balloons));
    }
    parts.push(`<rect x="${BORDER_W}" y="${BORDER_W}" width="${S-2*BORDER_W}" height="${S-2*BORDER_W}" fill="none" stroke="#000" stroke-width="${2*BORDER_W}"/>`);
    inner = parts.join("");
  }
  return `<svg class="panel" width="${px}" height="${px}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">`+
         `<rect width="${S}" height="${S}" fill="#fff"/>${inner}</svg>`;
}

/* ================================ strip ================================== */
function panelPx(){
  const avail = Math.min(1100, document.getElementById("page").clientWidth - 40);
  const gap = 6;
  return Math.max(150, Math.floor((avail - gap*(state.wide+1)) / state.wide));
}
function renderAll(){
  ensureCast();
  const strip = document.getElementById("strip");
  const px = panelPx();
  strip.style.maxWidth = (state.wide*px + 6*(state.wide+1) + 8) + "px";
  if(!state.msgs.length){
    strip.innerHTML = `<div class="hint">Pick a character, set an emotion on the wheel, and say something…</div>`;
    if(typeof updateThinkingPanels === "function") updateThinkingPanels();
    return;
  }
  const panels = layoutStrip(state.msgs, getArt, {title: state.title});
  strip.innerHTML = panels.map(p=>panelSvg(p, px)).join("");
  if(typeof updateThinkingPanels === "function") updateThinkingPanels();
  const page = document.getElementById("page");
  page.scrollTop = page.scrollHeight;
}

/* =============================== sending ================================= */
function detectTalkTos(text, fromId){
  const out = [];
  const low = text.toLowerCase();
  for(const id of castIds()){
    if(id === fromId) continue;
    const nm = getArt(id).name.toLowerCase();
    if(checkWord(low, nm)) out.push(id);
  }
  return out;
}
function send(raw, charId, modeOverride, flags){
  let text = (raw||"").trim();
  if(!text) return;
  let mode = modeOverride || curMode;
  if(/^\/me\s+/i.test(text)){ mode = "action"; text = text.replace(/^\/me\s+/i,""); }
  else if(/^\/think\s+/i.test(text)){ mode = "think"; text = text.replace(/^\/think\s+/i,""); }
  else if(/^\/(w|whisper)\s+/i.test(text)){ mode = "whisper"; text = text.replace(/^\/(w|whisper)\s+/i,""); }

  const id = charId || curChar;
  const w = wheelState[id];
  // An explicit wheel setting wins for exactly one message; otherwise the text
  // rules apply. They never blend. (textpose.cpp:119 + AF_TEMPFROZEN)
  const msg = {
    charId: id,
    text,
    display: (mode === "action" ? getArt(id).name + " " + text : text).toUpperCase(),
    mode,
    talkTos: detectTalkTos(text, id),
    wheel: (w && w.touched) ? {emotion:w.emotion, intensity:w.intensity} : null,
    ai: !!(flags && flags.ai),
    replyTo: (flags && flags.replyTo) || null
  };
  if(w){ w.touched = false; w.emotion = EM.HAPPY; w.intensity = 0; }   // ResetAvatar
  // In a room the HOST owns message order, so everyone's strip lays out
  // identically; a guest's own line comes back via the host's broadcast.
  if(typeof netDispatch === "function" && netActive() && netDispatch(msg)) return;
  applyNetMsg(msg);
}

/* every message — local or from the network — lands here */
function applyNetMsg(msg){
  state.msgs.push(msg);
  persist();
  renderAll(); renderRoster(); renderWheel();
  if(typeof aiObserve === "function") aiObserve(msg);
}

/* ================================== UI =================================== */
function portrait(id){
  const art = getArt(id);
  const w = wheelState[id] || {emotion:EM.HAPPY, intensity:0};
  const pose = bodyFromEmotion(art, w.emotion, w.intensity, -1);
  const n = art.dim ? art.dim(pose.face, pose.torso) : art.nat;
  return `<svg viewBox="${n.x} ${n.y} ${n.w} ${n.h*0.62}" xmlns="http://www.w3.org/2000/svg">${art.draw(pose.face,pose.torso)}</svg>`;
}
let rosterExpanded = false;
function renderRoster(){
  ensureCast();
  const ids = castIds();
  const el = document.getElementById("roster");
  el.innerHTML = ids.map(id=>
    `<div class="porta${id===curChar?" sel":""}" data-id="${id}">${portrait(id)}${esc(getArt(id).name)}</div>`).join("");
  el.querySelectorAll(".porta").forEach(d=> d.onclick = ()=>{ curChar = d.dataset.id; renderRoster(); renderWheel(); });
  const more = document.getElementById("rostermore");
  const overflows = ids.length > 12;                 // two collapsed rows
  more.hidden = !overflows;
  el.classList.toggle("collapsed", overflows && !rosterExpanded);
  if(overflows) more.textContent = rosterExpanded ? "▴ Fewer characters" : `▾ Show all ${ids.length} characters`;
}
document.getElementById("rostermore").onclick = ()=>{ rosterExpanded = !rosterExpanded; renderRoster(); };

const WHEEL_ICON_KEY = {happy:"hap", coy:"coy", bored:"bor", scared:"sca", sad:"sad", angry:"ang", shout:"sho", laugh:"laf"};
const WR = 52, WSZ = 132, WC = WSZ/2;
function renderWheel(){
  ensureCast();
  const w = wheelState[curChar];
  const parts = [`<circle cx="${WC}" cy="${WC}" r="${WR+12}" fill="#e8e8e8" stroke="#808080" stroke-width="2"/>`];
  for(let i=0;i<8;i++){
    const a = i*2*Math.PI/8;                        // screen space: y grows down
    const x = WC + Math.cos(a)*(WR+2), y = WC + Math.sin(a)*(WR+2);
    const icon = CC_WHEEL_ICONS[WHEEL_ICON_KEY[WHEEL[i].key]];
    parts.push(`<image href="data:image/png;base64,${icon}" x="${x-10}" y="${y-13}" width="20" height="26"/>`);
  }
  parts.push(`<circle cx="${WC}" cy="${WC}" r="13" fill="#fff" stroke="#808080" stroke-width="2"/>`);
  parts.push(`<image href="data:image/png;base64,${CC_WHEEL_ICONS.neu}" x="${WC-10}" y="${WC-13}" width="20" height="26"/>`);
  const r = w.intensity * WR;
  const px = WC + Math.cos(w.emotion)*r, py = WC + Math.sin(w.emotion)*r;
  parts.push(`<line x1="${WC}" y1="${WC}" x2="${px}" y2="${py}" stroke="#000080" stroke-width="2"/>`);
  parts.push(`<circle cx="${px}" cy="${py}" r="5" fill="#000080" stroke="#fff" stroke-width="1.5"/>`);
  document.getElementById("wheel").innerHTML = parts.join("");
  const key = emotionKeyFromAngle(w.emotion, w.intensity);
  document.getElementById("wheellabel").textContent =
    w.intensity === 0 ? "neutral" : `${key} ${Math.round(w.intensity*100)}%`;
  renderBodyCam();
}
/* ---- BodyCam: live preview of the pose that will actually be sent ----
   The original packs this into the same widget as the wheel (CBodyCam::
   GetBodyRect = client rect minus the wheel's square), drawn on white with
   drawNimbus FALSE and sized so the character keeps a fixed HEIGHT and is
   clipped to width. Here it sits beside the wheel to keep the composer bar
   short, but the sizing rule is the original's. */
function renderBodyCam(){
  const el = document.getElementById("bodycam");
  if(!el) return;
  ensureCast();
  const art = getArt(curChar);
  const w = wheelState[curChar] || {emotion:EM.HAPPY, intensity:0, touched:false};
  const inp = document.getElementById("msg");
  const raw = inp ? inp.value : "";
  // wheel wins for one message; otherwise the text rules decide (send() logic)
  let pose;
  if(w.touched){
    pose = bodyFromEmotion(art, w.emotion, w.intensity, -1);
  } else {
    const opts = raw ? getEmotionsFromString(raw) : [];
    pose = opts.length ? bodyFromOpts(art, opts, -1)
                       : bodyFromEmotion(art, EM.HAPPY, 0, -1);
  }
  const dm = art.dim ? art.dim(pose.face, pose.torso) : art.nat;
  const bw = +el.getAttribute("width"), bh = +el.getAttribute("height");
  const vbH = dm.h * 1.06;                       // a little headroom
  const vbW = vbH * (bw / bh);                   // fixed height, clipped to width
  const cx = dm.x + dm.w/2;
  el.setAttribute("viewBox",
    `${(cx - vbW/2).toFixed(1)} ${(dm.y - dm.h*0.03).toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`);
  el.innerHTML = art.draw(pose.face, pose.torso);
  const nm = document.getElementById("camname");
  if(nm) nm.textContent = art.name;
}

function wheelPick(ev){
  const svg = document.getElementById("wheel");
  const r = svg.getBoundingClientRect();
  const vx = ev.clientX - r.left - WC, vy = ev.clientY - r.top - WC;
  const w = wheelState[curChar];
  let mag = Math.hypot(vx,vy) / WR;
  mag = Math.min(mag, 1.0);
  if(mag < 0.2){ w.intensity = 0; w.emotion = 0; }    // "detente in the center"
  else { w.intensity = mag; w.emotion = Math.atan2(vy, vx); }
  w.touched = true;
  renderWheel(); renderRoster();
}
{
  const el = document.getElementById("wheel");
  let drag = false;
  el.addEventListener("pointerdown", e=>{ drag = true; el.setPointerCapture(e.pointerId); wheelPick(e); });
  el.addEventListener("pointermove", e=>{ if(drag) wheelPick(e); });
  el.addEventListener("pointerup", ()=> drag = false);
}

/* mode-aware placeholder so nobody has to know IRC folklore */
const MODE_PLACEHOLDER = {
  say:     "Type a message…",
  think:   "Type a thought — it appears in a cloud with a bubble trail",
  whisper: "Type a whisper — dashed balloon, italics",
  action:  'Describe what your character does — e.g. "waves goodbye"'
};
function updatePlaceholder(){
  document.getElementById("msg").placeholder = MODE_PLACEHOLDER[curMode] || MODE_PLACEHOLDER.say;
}

/* live preview of what the message will become */
function updateRuleHint(){
  renderBodyCam();
  const raw = document.getElementById("msg").value;
  // Action becomes a narration caption: the text is appended to the name
  let mode = curMode, tt = raw;
  if(/^\/me\s+/i.test(tt)){ mode = "action"; tt = tt.replace(/^\/me\s+/i,""); }
  if(mode === "action"){
    const nm = getArt(curChar).name.toUpperCase();
    document.getElementById("rulehint").textContent = tt.trim()
      ? `Caption preview: ✱ ${nm} ${tt.trim().toUpperCase()} ✱`
      : `Action = a narration caption. Your words go after the name: "waves" → ✱ ${nm} WAVES ✱`;
    return;
  }
  const t = raw;
  const opts = t ? getEmotionsFromString(t) : [];
  const names = {};
  names[EM.SHOUT]="shout"; names[EM.LAUGH]="laugh"; names[EM.HAPPY]="happy"; names[EM.SAD]="sad";
  names[EM.COY]="coy"; names[EM.WAVE]="wave"; names[EM.POINTOTHER]="point at you"; names[EM.POINTSELF]="point at self";
  const w = wheelState[curChar];
  const el = document.getElementById("rulehint");
  if(w && w.touched){ el.textContent = "Wheel set — it overrides the text rules for this one message."; return; }
  el.textContent = opts.length
    ? "Text rules: " + opts.sort((a,b)=>b.priority-a.priority).map(o=>`${names[o.emotion]||"?"}(${o.priority})`).join(", ")
    : 'Or start a line with "/me waves" (action caption), "/think …" (thought), "/w …" (whisper).';
}

document.querySelectorAll(".tog").forEach(b=> b.onclick = ()=>{
  document.querySelectorAll(".tog").forEach(x=>x.classList.remove("on"));
  b.classList.add("on"); curMode = b.dataset.mode;
  updatePlaceholder(); updateRuleHint();
  document.getElementById("msg").focus();
});
document.getElementById("send").onclick = ()=>{
  const inp = document.getElementById("msg");
  send(inp.value); inp.value = "";
  document.querySelectorAll(".tog").forEach(x=>x.classList.toggle("on", x.dataset.mode === "say"));
  curMode = "say"; updatePlaceholder(); updateRuleHint(); inp.focus();
};
document.getElementById("msg").addEventListener("keydown", e=>{
  if(e.key === "Enter" || e.keyCode === 13) document.getElementById("send").click();
});
document.getElementById("msg").addEventListener("input", updateRuleHint);

const bgsel = document.getElementById("bgsel");
function refreshScenes(){
  bgsel.innerHTML = Object.keys(CC_BACKDROPS).map(k=>`<option value="${k}">${CC_BACKDROPS[k].label}</option>`).join("")
                  + `<option value="none">(none)</option>`;
  bgsel.value = (CC_BACKDROPS[state.bg] || state.bg === "none") ? state.bg : "none";
}
refreshScenes();
bgsel.onchange = ()=>{ state.bg = bgsel.value; persist(); renderAll(); };

const artsel = document.getElementById("artsel");
artsel.value = state.style;
artsel.onchange = ()=>{
  if(artsel.value === "original" && !HAVE_ORIGINAL){ artsel.value = state.style; return; }
  const oldIds = castIds();
  const prev = state.style;
  state.style = artsel.value;
  const newIds = castIds();
  if(prev !== state.style && oldIds.length && newIds.length){
    // The two casts have different names, so recast the existing strip by
    // position — otherwise every line falls back to the first character.
    const map = {};
    oldIds.forEach((id,i)=> map[id] = newIds[i % newIds.length]);
    for(const m of state.msgs){
      m.charId = map[m.charId] || newIds[0];
      m.talkTos = (m.talkTos || []).map(t=> map[t] || newIds[0]);
      if(m.mode === "action") m.display = (getArt(m.charId).name + " " + m.text).toUpperCase();
    }
  }
  curChar = null;
  persist(); ensureCast(); renderRoster(); renderWheel(); renderAll();
};
const wide = document.getElementById("wide");
wide.value = String(state.wide);
wide.onchange = ()=>{ state.wide = +wide.value; persist(); renderAll(); };
const tp = document.getElementById("titlepanel");
tp.checked = state.title;
tp.onchange = ()=>{ state.title = tp.checked; persist(); renderAll(); };
document.getElementById("clear").onclick = ()=>{
  if(confirm("Clear the whole strip?")){ state.msgs = []; persist(); renderAll(); }
};
function updateStatusNote(){
  const el = document.getElementById("statusnote");
  if(!HAVE_ORIGINAL){
    artsel.querySelector('option[value="original"]').disabled = true;
    el.className = "note";
    el.textContent = window.CC_ARTIFACT_BUILD
      ? "Modern art only — load the artpack for the original Microsoft artwork."
      : "Original artwork not installed — art-original.js missing.";
  } else {
    el.className = "help";
    el.textContent = "Artwork © 1996-1998 Microsoft Corporation (MIT).";
  }
}
updateStatusNote();

/* ==================== artpack loading (artifact build) ==================== */
/* The claude.ai artifact ships without the ~2 MB of artwork. The user loads
   comic-chat-artpack.json once; we keep it for next time if storage allows
   (sandboxed artifact iframes usually have none — then it's a per-visit drop). */
function applyArtpack(text){
  let pack;
  try{ pack = JSON.parse(text); }catch(e){ alert("That file isn't a Comic Chat artpack (bad JSON)."); return false; }
  if(!pack || pack.format !== "comic-chat-artpack-1" || !pack.original){
    alert("That file isn't a Comic Chat artpack."); return false;
  }
  installOriginalArt(CC_buildOriginalArt(pack.original), pack.backdrops);
  try{ localStorage.setItem("comicchat-artpack", text); }catch(e){}
  const dz = document.getElementById("dropzone");
  if(dz) dz.hidden = true;
  return true;
}
{
  const dz = document.getElementById("dropzone");
  if(dz){
    if(HAVE_ORIGINAL) dz.hidden = true;
    else{
      try{
        const saved = localStorage.getItem("comicchat-artpack");
        if(saved) applyArtpack(saved);
      }catch(e){}
    }
    const fi = document.getElementById("artfile");
    fi.onchange = ()=>{ if(fi.files[0]) fi.files[0].text().then(applyArtpack); };
    document.addEventListener("dragover", ev=>ev.preventDefault());
    document.addEventListener("drop", ev=>{
      ev.preventDefault();
      const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if(f) f.text().then(applyArtpack);
    });
  }
}

/* ========================= AI cast replies ========================== */
/* Available only inside a claude.ai artifact, where window.claude.complete is
   the keyless completion API. Hidden everywhere else. */
const AI_BIOS = {
  anna:     "sleek black bob, arch expression; dry, deadpan wit — the sardonic straight woman who is secretly fond of everyone",
  bolo:     "pompadour and a bolo tie; earnest retro-cool, takes fashion and manners very seriously",
  tiki:     "a living carved tiki mask on legs; speaks in grand dramatic pronouncements, prone to volcano metaphors",
  scotty:   "a droopy, rumpled dog-like fellow; easily confused, endlessly good-natured, food-motivated",
  kirby:    "a kid in a red jacket and round glasses; boundless enthusiasm, everything is the BEST THING EVER",
  dan:      "spiky-haired guy with a big grin; laid-back surfer energy, nothing fazes him",
  margaret: "curly hair, hands on hips; brooks absolutely no nonsense, delivers withering one-liners",
  xeno:     "a slender grey alien; deadpan and literal, quietly conducting field research on humans",
  susan:    "sensible and organized; the one who actually read the manual",
  cro:      "a hulking caveman type; simple words, surprisingly deep thoughts",
  lynnea:   "theatrical and glamorous; treats every panel as her big scene",
  veronica: "stylish and self-assured; always slightly above it all",
  buck:     "a big friendly galoot; enthusiastic, not always accurate",
  jordan:   "cool and mysterious; says little, means much",
  connor:   "an odd knight-ish figure; formal, chivalrous, slightly out of era"
};
/* ---- AI with a user-supplied key: Claude, ChatGPT, or Gemini ---- */
/* Defaults are each provider's current small ("mini") model as of July 2026;
   the model field is editable, and a model-shaped error falls back once to a
   long-lived known-good id so a stale default never breaks every call. */
const AI_PROVIDERS = {
  claude: {label:"Claude (Anthropic)", model:"claude-haiku-4-5-20251001", fallback:"claude-sonnet-5",   keyHint:"sk-ant-…"},
  openai: {label:"ChatGPT (OpenAI)",   model:"gpt-5.4-mini",              fallback:"gpt-5-mini",        keyHint:"sk-…"},
  gemini: {label:"Gemini (Google)",    model:"gemini-3.6-flash",          fallback:"gemini-2.5-flash",  keyHint:"AIza…"}
};
let AI_CFG = {provider:"claude", models:{}, keys:{}, chosen:false};
try{
  const c = JSON.parse(localStorage.getItem("comicchat-ai-cfg"));
  if(c && (AI_PROVIDERS[c.provider] || c.provider === "nano"))
    AI_CFG = {provider:c.provider, models:c.models||{}, keys:c.keys||{}, chosen:!!c.chosen};
  const legacy = localStorage.getItem("comicchat-apikey");   // pre-provider versions
  if(legacy && !AI_CFG.keys.claude){ AI_CFG.keys.claude = legacy; localStorage.removeItem("comicchat-apikey"); }
}catch(e){}

/* ---- Gemini Nano, built into Chrome (the Prompt API) ----
   Feature-detected: the LanguageModel global (Chrome 138+), with the older
   window.ai.languageModel shape as fallback. When the on-device model is
   ready it becomes an AI provider needing NO key, and the default — unless
   the user has explicitly picked a provider themselves. */
const NANO = {state:"unsupported", api:null, legacy:false};
async function nanoDetect(){
  try{
    if(typeof LanguageModel !== "undefined" && LanguageModel.availability){
      NANO.api = LanguageModel;
      NANO.state = await LanguageModel.availability();
    } else if(window.ai && window.ai.languageModel && window.ai.languageModel.capabilities){
      NANO.api = window.ai.languageModel; NANO.legacy = true;
      const c = await window.ai.languageModel.capabilities();
      NANO.state = c.available === "readily" ? "available"
                 : c.available === "after-download" ? "downloadable" : "unavailable";
    }
  }catch(e){ NANO.state = "unavailable"; }
  if(NANO.state === "available" || NANO.state === "downloadable" || NANO.state === "downloading"){
    AI_PROVIDERS.nano = {label:"Gemini Nano (built into Chrome, no key)",
                         model:"on-device", fallback:null, keyHint:"", local:true};
    if(NANO.state === "available" && !AI_CFG.chosen){
      AI_CFG.provider = "nano"; aiPersistCfg();
    }
  } else if(AI_CFG.provider === "nano"){
    AI_CFG.provider = "claude";       // saved on a machine that had it; this one doesn't
  }
}
const NANO_SCHEMA = {type:"object", properties:{
  text:{type:"string"},
  emotion:{type:"string", enum:["neutral","happy","coy","bored","scared","sad","angry","shout","laugh"]},
  intensity:{type:"number"},
  mode:{type:"string", enum:["say","think","whisper","action"]}
}, required:["text","emotion","intensity","mode"]};
/* Chrome asks for the output language to be declared ("No output language was
   specified…"); older builds reject the options object, hence the fallback. */
const NANO_LANG = {
  expectedInputs:  [{type:"text", languages:["en"]}],
  expectedOutputs: [{type:"text", languages:["en"]}]
};
async function nanoCreate(extraOpts){
  try{ return await NANO.api.create(Object.assign({}, NANO_LANG, extraOpts||{})); }
  catch(e){ return await NANO.api.create(extraOpts||{}); }
}
async function nanoPrompt(prompt){
  const sess = await nanoCreate();
  try{
    try{ return await sess.prompt(prompt, {responseConstraint: NANO_SCHEMA}); }
    catch(e){ return await sess.prompt(prompt); }    // constraint unsupported on this build
  }finally{
    try{ if(sess.destroy) sess.destroy(); }catch(e){}
  }
}
async function nanoDownload(onProgress){
  const sess = await nanoCreate({monitor(m){
    m.addEventListener("downloadprogress", e=>{
      if(onProgress) onProgress(Math.round((e.loaded || 0) * 100));
    });
  }});
  try{ if(sess.destroy) sess.destroy(); }catch(e){}
  NANO.state = "available";
}
nanoDetect();
function aiPersistCfg(){ try{ localStorage.setItem("comicchat-ai-cfg", JSON.stringify(AI_CFG)); }catch(e){} }
function aiKey(){ return AI_CFG.keys[AI_CFG.provider] || ""; }
function aiModel(){
  if(AI_CFG.provider === "nano") return "on-device";
  return (AI_CFG.models[AI_CFG.provider] || "").trim() || AI_PROVIDERS[AI_CFG.provider].model;
}
function aiAvailable(){
  if(AI_CFG.provider === "nano") return NANO.state === "available";
  return !!aiKey();
}

async function callProvider(provider, model, prompt){
  if(provider === "nano") return nanoPrompt(prompt);
  const key = AI_CFG.keys[provider];
  let url, headers, body, pick;
  if(provider === "claude"){
    url = "https://api.anthropic.com/v1/messages";
    headers = {"x-api-key": key, "anthropic-version": "2023-06-01",
               "content-type": "application/json",
               "anthropic-dangerous-direct-browser-access": "true"};
    body = {model, max_tokens: 300, messages: [{role:"user", content: prompt}]};
    pick = d => (d.content && d.content[0] && d.content[0].text) || "";
  } else if(provider === "openai"){
    url = "https://api.openai.com/v1/chat/completions";
    headers = {"authorization": "Bearer " + key, "content-type": "application/json"};
    body = {model, messages: [{role:"user", content: prompt}]};
    pick = d => (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "";
  } else {
    url = "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(model) + ":generateContent";
    headers = {"x-goog-api-key": key, "content-type": "application/json"};
    body = {contents: [{parts: [{text: prompt}]}]};
    pick = d => {
      const parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
      return parts ? parts.map(p=>p.text||"").join("") : "";
    };
  }
  const res = await fetch(url, {method:"POST", headers, body: JSON.stringify(body)});
  if(!res.ok) throw new Error("API " + res.status + ": " + (await res.text()).slice(0,200));
  return pick(await res.json());
}
async function fetchAI(prompt){
  const p = AI_CFG.provider;
  try{
    return await callProvider(p, aiModel(), prompt);
  }catch(e){
    const fb = AI_PROVIDERS[p] && AI_PROVIDERS[p].fallback;
    if(fb && /model/i.test(String(e)) && aiModel() !== fb)
      return await callProvider(p, fb, prompt);
    throw e;
  }
}

/* ---- AI participants: characters played by Claude with YOUR key ---- */
window.AI_PLAYERS = [];   // [{name, charId, chatty, busy}]
try{
  const saved = JSON.parse(localStorage.getItem("comicchat-aiplayers"));
  // Every AI player is chatty now: characters addressed by name already answer
  // for themselves, so a "replies when addressed" player would be redundant.
  if(Array.isArray(saved)) window.AI_PLAYERS = saved.map(p=>({name:p.name, charId:p.charId, chatty:true, busy:false}));
}catch(e){}
function aiPersistPlayers(){
  try{ localStorage.setItem("comicchat-aiplayers",
    JSON.stringify(window.AI_PLAYERS.map(p=>({name:p.name, charId:p.charId, chatty:p.chatty})))); }catch(e){}
}
function aiPrompt(responder){
  const art = getArt(responder);
  const bio = AI_BIOS[responder] || "improvise a fitting playful personality from the name alone";
  const cast = state.msgs.slice(-12).map(m=>{
    const nm = getArt(m.charId) ? getArt(m.charId).name : m.charId;
    return m.mode === "action" ? `[${nm} ${m.text}]` : `${nm} (${m.mode}): ${m.text}`;
  }).join("\n");
  return `You write dialogue for a Microsoft Comic Chat comic strip. You play ${art.name}: ${bio}.

Recent strip:
${cast}

Write ${art.name}'s next line. Playful and funny, 1-2 short sentences, stay in character, react to what was just said.
Plain text only — no markdown, no asterisks or other emphasis marks (the comic lettering has no bold or italics).

Reply with ONLY a JSON object, nothing else. Its fields:
"text" — the actual line of dialogue you wrote (a real sentence, never a placeholder)
"emotion" — exactly one word from: neutral, happy, coy, bored, scared, sad, angry, shout, laugh
"intensity" — a number between 0 and 1
"mode" — exactly one word from: say, think, whisper, action
For mode "action", "text" is a third-person action phrase WITHOUT the name (e.g. "hands Anna a coffee").
Example of the format (do NOT copy its words): {"text":"${AI_EXAMPLE}","emotion":"coy","intensity":0.6,"mode":"say"}`;
}
/* An AI participant decides for ITSELF whether to answer a message:
   always when addressed by name, or (if marked chatty) when the message
   addressed nobody in particular. AI players never answer other AIs, so two
   of them can't chain-react forever. */
const AI_ADHOC = {};   // stand-ins for addressed-but-unclaimed characters
function aiObserve(msg){
  if(msg.ai || !aiAvailable()) return;
  for(const p of window.AI_PLAYERS){
    if(p.busy || p.charId === msg.charId) continue;
    const addressed = (msg.talkTos||[]).includes(p.charId) ||
                      checkWord(msg.text.toLowerCase(), getArt(p.charId).name.toLowerCase());
    if(addressed || (p.chatty && !(msg.talkTos||[]).length)) aiReplyAs(p, msg.charId);
  }
  /* A character addressed by name who is played by nobody — no human, no AI
     player — answers for themselves. In a room only the host's machine does
     this, so the reply happens exactly once. */
  if(AI_CFG.autoCast === false) return;
  if(typeof netActive === "function" && netActive() && !NET.isHost) return;
  const claimed = new Set([msg.charId, curChar]);
  for(const p of window.AI_PLAYERS) claimed.add(p.charId);
  for(const r of lastRoster) claimed.add(r.charId);
  for(const id of (msg.talkTos||[])){
    if(claimed.has(id) || !getArt(id)) continue;
    const p = AI_ADHOC[id] ||
      (AI_ADHOC[id] = {name: getArt(id).name + " (AI)", charId:id, chatty:false, busy:false});
    if(!p.busy) aiReplyAs(p, msg.charId);
  }
}

/* the format example shown to the model; any echo of it is rejected */
const AI_EXAMPLE = "Ha! I knew you would say that.";

/* AI replies must land as plain comic-balloon text, not markdown */
function stripMarkdown(s){
  return s
    .replace(/```[a-z]*\n?/gi, "").replace(/```/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\b_([^_\n]+)_\b/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ").trim();
}
/* one generation attempt; returns null if the model parroted the format
   template ("...", the example sentence, or nothing) instead of writing a line.
   Parsing is three-tier: full JSON, then a "text" field fished out of broken
   JSON (truncation), then the whole reply treated as the spoken line — small
   on-device models often answer in prose despite the instructions, and prose
   is a perfectly good balloon. */
async function aiAttempt(p, extra){
  const raw = await fetchAI(aiPrompt(p.charId) + (extra || ""));
  let r = null, text = "";
  const m = raw.match(/\{[\s\S]*\}/);
  if(m){ try{ r = JSON.parse(m[0]); }catch(e){} }
  if(r){
    text = stripMarkdown(String(r.text||"")).trim();
  } else {
    // the char class stops at any unescaped quote, so the close-quote itself
    // is optional — truncated output loses it
    const tf = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)+)/);
    text = stripMarkdown(tf ? tf[1].replace(/\\(.)/g, "$1")
                            : raw.replace(/^["'\s]+|["'\s]+$/g, "")).trim();
    r = {emotion:"neutral", intensity:0.5, mode:"say"};
  }
  const parroted = !text || text.startsWith("{") ||             // JSON junk is not dialogue
    /^[.…\s]+$/.test(text) ||
    /^[.…\s]+$/.test(text) ||                                   // "...", "…"
    text.toLowerCase().replace(/[^a-z ]/g,"") ===
      AI_EXAMPLE.toLowerCase().replace(/[^a-z ]/g,"");
  if(parroted){
    console.warn("Comic Chat AI: unusable reply from model:", raw);
    return null;
  }
  return {r, text};
}
/* ---- a visible "thinking" panel while the model generates ----
   On-device Nano can take many seconds; instead of a dead strip, the pending
   character stands in a temporary panel with a pulsing thought bubble. These
   panels are local-only presentation — never part of the shared message list,
   so multiplayer layout stays deterministic. */
const AI_THINKING = new Set();
function thinkingPanelHTML(id, px){
  const art = getArt(id);
  const pose = bodyFromEmotion(art, EM.BORED, 0.35, -1);
  const dm = art.dim ? art.dim(pose.face, pose.torso)
                     : {x:art.nat.x, y:art.nat.y, w:art.nat.w, h:art.nat.h};
  const h = S/BODY_H_DIV, scale = h/dm.h, w = dm.w*scale;
  const cx = S/2;
  const tx = cx - w/2 - dm.x*scale, ty = (S - h) - dm.y*scale;
  const fig = `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${art.draw(pose.face,pose.torso)}</g>`;
  const dots = [0,1,2].map(i=>
    `<circle cx="${cx-280+i*280}" cy="880" r="95" fill="#000">`+
    `<animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin="${(i*0.3).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join("");
  const cloud =
    `<ellipse cx="${cx}" cy="880" rx="950" ry="460" fill="#fff" stroke="#000" stroke-width="28"/>`+dots+
    `<circle cx="${cx-430}" cy="1560" r="80" fill="#fff" stroke="#000" stroke-width="26"/>`+
    `<circle cx="${cx-560}" cy="1840" r="50" fill="#fff" stroke="#000" stroke-width="22"/>`;
  const border = `<rect x="${BORDER_W}" y="${BORDER_W}" width="${S-2*BORDER_W}" height="${S-2*BORDER_W}" fill="none" stroke="#000" stroke-width="${2*BORDER_W}"/>`;
  return `<svg class="panel thinkpanel" data-think="${esc(id)}" width="${px}" height="${px}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">`+
         `<rect width="${S}" height="${S}" fill="#fff"/>${fig}${cloud}${border}</svg>`;
}
function updateThinkingPanels(){
  const strip = document.getElementById("strip");
  strip.querySelectorAll("[data-think]").forEach(el=>{
    if(!AI_THINKING.has(el.getAttribute("data-think"))) el.remove();
  });
  const px = panelPx();
  for(const id of AI_THINKING){
    if(!getArt(id)) continue;
    if(!strip.querySelector(`[data-think="${id}"]`))
      strip.insertAdjacentHTML("beforeend", thinkingPanelHTML(id, px));
  }
  if(AI_THINKING.size)
    document.getElementById("page").scrollTop = document.getElementById("page").scrollHeight;
}
function showThinking(id){ AI_THINKING.add(id); updateThinkingPanels(); }
function hideThinking(id){ AI_THINKING.delete(id); updateThinkingPanels(); }

async function aiReplyAs(p, replyToId){
  p.busy = true;
  const hint = document.getElementById("rulehint");
  hint.textContent = `💭 ${getArt(p.charId).name} is thinking…`;
  showThinking(p.charId);
  try{
    let got = await aiAttempt(p);
    if(!got) got = await aiAttempt(p,
      `\n\nIMPORTANT: your previous reply used a placeholder instead of dialogue. ` +
      `The "text" field must be a real line ${getArt(p.charId).name} would actually say in this scene.`);
    if(!got){
      hint.textContent = "🤖 " + getArt(p.charId).name + " had nothing to say (the model returned a placeholder twice).";
      return;
    }
    const r = got.r;
    const emoKey = String(r.emotion||"neutral").toLowerCase();
    const wheelEntry = WHEEL.find(w=>w.key===emoKey || (emoKey==="laughing" && w.key==="laugh"));
    wheelState[p.charId] = wheelEntry
      ? {emotion: wheelEntry.em, intensity: Math.max(0.25, Math.min(1, +r.intensity || 0.7)), touched:true}
      : {emotion: EM.HAPPY, intensity: 0, touched:true};
    const mode = ["say","think","whisper","action"].includes(r.mode) ? r.mode : "say";
    hideThinking(p.charId);              // the real panel replaces the pending one
    send(got.text.slice(0,200), p.charId, mode, {ai:true, replyTo: replyToId || null});
  }catch(e){
    hint.textContent = "🤖 " + getArt(p.charId).name + " lost their train of thought (" +
                       String(e.message||e).slice(0,80) + ")";
  }finally{
    hideThinking(p.charId);
    p.busy = false;
    setTimeout(updateRuleHint, 2500);
  }
}

/* ================================= demo ================================== */
const DEMO = [
  ["say",     null,                        "Hi everyone! Welcome to Comic Chat."],
  ["say",     null,                        "I'm just here for the free coffee."],
  ["say",     null,                        "lol you are ALWAYS here for the coffee"],
  ["say",     {emotion:EM.ANGRY, i:0.9},   "WHO DRANK MY COFFEE"],
  ["think",   {emotion:EM.BORED, i:0.7},   "Humans are such strange creatures."],
  ["action",  null,                        "hands over a fresh cup"],
  ["say",     {emotion:EM.HAPPY, i:0.9},   "Ah, splendid. All is forgiven :)"],
  ["whisper", {emotion:EM.COY,   i:0.8},   "psst... want to raid the fridge later?"],
  ["say",     {emotion:EM.SCARED,i:1.0},   "MY COVER IS BLOWN!!!"]
];
document.getElementById("demo").onclick = ()=>{
  const ids = castIds();
  state.msgs = [];
  let i = 0;
  const step = ()=>{
    if(i >= DEMO.length){ renderRoster(); return; }
    const [mode, emo, text] = DEMO[i];
    const id = ids[i % ids.length];
    const w = wheelState[id];
    if(emo){ w.emotion = emo.emotion; w.intensity = emo.i; w.touched = true; }
    i++;
    send(text, id, mode);
    setTimeout(step, 420);
  };
  step();
};

/* =============================== save PNG ================================ */
document.getElementById("save").onclick = async ()=>{
  const svgs = [...document.querySelectorAll("svg.panel")];
  if(!svgs.length) return;
  const cols = Math.min(state.wide, svgs.length), gap = 12, px = 420;
  const rows = Math.ceil(svgs.length / cols);
  const cv = document.createElement("canvas");
  cv.width = cols*px + (cols+1)*gap;
  cv.height = rows*px + (rows+1)*gap;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0,0,cv.width,cv.height);
  await Promise.all(svgs.map((svg,i)=> new Promise(res=>{
    const img = new Image();
    img.onload = ()=>{
      ctx.drawImage(img, gap + (i%cols)*(px+gap), gap + Math.floor(i/cols)*(px+gap), px, px);
      res();
    };
    img.onerror = res;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  })));
  const a = document.createElement("a");
  a.download = "comic-chat-strip.png";
  a.href = cv.toDataURL("image/png");
  a.click();
};

/* ============================ DOM modal system =========================== */
function ccModal(title, bodyHTML){
  const old = document.getElementById("ccmodal");
  if(old) old.remove();
  const ov = document.createElement("div");
  ov.id = "ccmodal";
  ov.innerHTML = `<div class="mwin"><div class="mtitle">${esc(title)}
    <button class="mclose">×</button></div><div class="mbody">${bodyHTML}</div></div>`;
  document.body.appendChild(ov);
  const close = ()=>ov.remove();
  ov.querySelector(".mclose").onclick = close;
  ov.addEventListener("pointerdown", ev=>{ if(ev.target === ov) close(); });
  return {el: ov, close};
}
function copyText(t){
  try{
    const ta = document.createElement("textarea");
    ta.value = t; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); ta.remove();
    return true;
  }catch(e){ return false; }
}

/* ========================= multiplayer UI wiring ========================= */
function enterRoomMode(){
  // shared strips reference the original cast ids, so everyone plays with it
  if(HAVE_ORIGINAL && state.style !== "original"){
    artsel.value = "original"; artsel.onchange();
  }
  document.getElementById("demo").disabled = true;
  document.getElementById("clear").disabled = !NET.isHost;
  document.getElementById("clear").title = NET.isHost ? "" : "Only the host can clear the shared strip";
}
function leaveRoomMode(){
  document.getElementById("demo").disabled = false;
  document.getElementById("clear").disabled = false;
  document.getElementById("clear").title = "";
}
function rosterHTML(parts){
  if(!parts || !parts.length) return "";
  return "<div class='mrow'><b>In the room:</b> " +
    parts.map(p=>esc(p.name) + (p.ai ? " 🤖" : "") +
      " <span class='small'>(" + esc(getArt(p.charId) ? getArt(p.charId).name : "?") + ")</span>").join(" · ") +
    "</div>";
}
let lastRoster = [];
if(typeof NET !== "undefined"){
  NET.onStatus = t=>{ const el = document.getElementById("netstatus"); if(el) el.textContent = t; };
  NET.onRoster = parts=>{
    lastRoster = parts;
    const box = document.getElementById("mroster");
    if(box) box.innerHTML = rosterHTML(parts);
  };
}
/* Accept a bare code, a pasted invite URL (file:///...#join=cc-xxxxxx), or
   anything containing a cc- code — extract the room id from all of them. */
function parseRoomCode(s){
  s = (s||"").trim();
  const m = s.match(/#?join=([\w-]+)/i) || s.match(/\b(cc-[a-z0-9]+)\b/i);
  return m ? m[1] : s;
}
function openNetModal(){
  const joined = netActive();
  const hashJoin = (location.hash.match(/#join=([\w-]+)/)||[])[1] || "";
  let body;
  if(joined){
    body = `<div class="mrow">Room code: <code>${esc(NET.roomId||"")}</code>
        <button id="mcopy">Copy invite link</button> <span id="mcopied" class="small"></span></div>
      <div id="mroster">${rosterHTML(lastRoster)}</div>
      <div class="mrow"><button id="mleave">Leave room</button></div>
      <div class="small">Messages travel peer-to-peer (WebRTC). The host's browser keeps the
      strip in order — if the host leaves, the room closes.</div>`;
  } else {
    body = `<div class="mrow">Your name: <input id="mname" maxlength="24" value="${esc(localStorage.getItem("comicchat-name")||"")}" placeholder="e.g. Ken"></div>
      <div class="mrow"><button id="mhost"><b>Host a new room</b></button>
        — then send the invite link to friends.</div>
      <div class="mrow"><input id="mcode" placeholder="room code, e.g. cc-x7k2mp" value="${esc(hashJoin)}" style="width:14em">
        <button id="mjoin"><b>Join</b></button></div>
      <div id="mroster"></div>
      <div class="small">No account, no server of ours: WebRTC with a public signalling
      broker. Both sides need this page open in a browser.</div>`;
  }
  const m = ccModal("🌐 Multiplayer", body);
  const nameOf = ()=>{
    const v = (m.el.querySelector("#mname") ? m.el.querySelector("#mname").value : "").trim() || "Player";
    try{ localStorage.setItem("comicchat-name", v); }catch(e){}
    return v;
  };
  if(joined){
    m.el.querySelector("#mcopy").onclick = ()=>{
      const link = location.href.split("#")[0] + "#join=" + NET.roomId;
      m.el.querySelector("#mcopied").textContent = copyText(link) ? "copied!" : link;
    };
    m.el.querySelector("#mleave").onclick = ()=>{ netLeave(); leaveRoomMode(); m.close(); };
  } else {
    m.el.querySelector("#mhost").onclick = ()=>{
      netHost(nameOf(), ()=>{ enterRoomMode(); m.close(); openNetModal(); });
      m.el.querySelector("#mhost").textContent = "connecting…";
    };
    m.el.querySelector("#mjoin").onclick = ()=>{
      const code = parseRoomCode(m.el.querySelector("#mcode").value);
      if(!code) return;
      m.el.querySelector("#mcode").value = code;
      netJoin(code, nameOf(), ()=>{ enterRoomMode(); m.close(); openNetModal(); });
      m.el.querySelector("#mjoin").textContent = "connecting…";
    };
  }
}

/* ============================ AI setup wiring ============================ */
function openAiModal(){
  const players = window.AI_PLAYERS;
  const chars = castIds().map(id=>`<option value="${id}">${esc(getArt(id).name)}</option>`).join("");
  const list = players.length
    ? players.map((p,i)=>`<div class="mrow">🤖 <b>${esc(p.name)}</b> plays ${esc(getArt(p.charId).name)}
        <button data-rm="${i}">remove</button></div>`).join("")
    : `<div class="mrow small">No AI players yet.</div>`;
  const provOpts = Object.keys(AI_PROVIDERS).map(k=>
    `<option value="${k}"${k===AI_CFG.provider?" selected":""}>${esc(AI_PROVIDERS[k].label)}</option>`).join("");
  const m = ccModal("🤖 AI players", `
    <div class="mrow">Provider: <select id="mprov">${provOpts}</select>
      <span id="mmodelrow">&nbsp; Model: <input id="mmodel" style="width:14em" value="${esc(aiModel())}"></span></div>
    <div class="mrow" id="mkeyrow">API key:
      <input id="mkey" type="password" style="width:16em" value="${esc(aiKey())}" placeholder="${esc(AI_PROVIDERS[AI_CFG.provider].keyHint)}">
      <button id="mkeysave">Save</button> <span id="mkeynote" class="small"></span></div>
    <div class="mrow" id="mnanorow" style="display:none"><span id="mnanostate"></span>
      <button id="mnanodl" style="display:none">Download model</button></div>
    <div class="small mrow" id="mkeyhelp">The key stays in this browser's storage and goes only to the
      provider you chose — never to other players. Calls are made from whoever added the
      AI player, so only you need a key. The model box is prefilled with the provider's
      current small model; edit it to use any model your key can access.</div>
    <hr>${list}
    <div class="mrow">Add: <select id="mchar">${chars}</select>
      <button id="madd"><b>Add AI player</b></button></div>
    <div class="small">Any character you address by name already answers for themselves —
      an AI player goes further and joins in even when nobody addressed them.
      Their replies use your key and appear to everyone in the room.</div>
    <div class="mrow"><label><input type="checkbox" id="mauto"${AI_CFG.autoCast===false?"":" checked"}>
      Unclaimed characters answer for themselves when addressed</label>
      <span class="small">(in a room, the host's AI does the talking)</span></div>`);
  m.el.querySelector("#mauto").onchange = ()=>{
    AI_CFG.autoCast = m.el.querySelector("#mauto").checked;
    aiPersistCfg();
  };
  const readFields = ()=>{
    if(AI_CFG.provider !== "nano"){
      AI_CFG.models[AI_CFG.provider] = m.el.querySelector("#mmodel").value.trim();
      AI_CFG.keys[AI_CFG.provider] = m.el.querySelector("#mkey").value.trim();
    }
    aiPersistCfg();
  };
  const refreshProviderRows = ()=>{
    const isNano = AI_CFG.provider === "nano";
    m.el.querySelector("#mmodelrow").style.display = isNano ? "none" : "";
    m.el.querySelector("#mkeyrow").style.display = isNano ? "none" : "";
    m.el.querySelector("#mkeyhelp").style.display = isNano ? "none" : "";
    m.el.querySelector("#mnanorow").style.display = isNano ? "" : "none";
    if(isNano){
      const st = m.el.querySelector("#mnanostate");
      const dl = m.el.querySelector("#mnanodl");
      if(NANO.state === "available"){
        st.textContent = "✅ Ready — runs on this machine inside Chrome, no key and no cost.";
        dl.style.display = "none";
      } else {
        st.textContent = "The on-device model isn't downloaded yet (a few GB, one time).";
        dl.style.display = "";
        dl.onclick = async ()=>{
          dl.disabled = true;
          try{
            await nanoDownload(pct=>{ st.textContent = "Downloading… " + pct + "%"; });
            refreshProviderRows();
          }catch(e){
            st.textContent = "Download failed: " + String(e.message||e).slice(0,80);
            dl.disabled = false;
          }
        };
      }
    }
  };
  refreshProviderRows();
  m.el.querySelector("#mprov").onchange = ()=>{
    readFields();
    AI_CFG.provider = m.el.querySelector("#mprov").value;
    AI_CFG.chosen = true;                      // an explicit choice sticks
    aiPersistCfg();
    if(AI_CFG.provider !== "nano"){
      m.el.querySelector("#mmodel").value = aiModel();
      m.el.querySelector("#mkey").value = aiKey();
      m.el.querySelector("#mkey").placeholder = AI_PROVIDERS[AI_CFG.provider].keyHint;
    }
    m.el.querySelector("#mkeynote").textContent = "";
    refreshProviderRows();
  };
  m.el.querySelector("#mkeysave").onclick = ()=>{
    readFields();
    m.el.querySelector("#mkeynote").textContent = aiKey() ? "saved" : "cleared";
  };
  m.el.querySelectorAll("[data-rm]").forEach(b=> b.onclick = ()=>{
    players.splice(+b.dataset.rm, 1); aiPersistPlayers(); m.close(); openAiModal();
  });
  m.el.querySelector("#madd").onclick = ()=>{
    readFields();
    if(!aiAvailable()){
      const note = AI_CFG.provider === "nano"
        ? "download the on-device model first"
        : "an API key is needed first";
      (AI_CFG.provider === "nano" ? m.el.querySelector("#mnanostate")
                                  : m.el.querySelector("#mkeynote")).textContent = note;
      return;
    }
    const charId = m.el.querySelector("#mchar").value;
    players.push({name: getArt(charId).name + " (AI)", charId, chatty:true, busy:false});
    aiPersistPlayers();
    if(typeof netAnnounceAI === "function" && netActive()) netAnnounceAI();
    m.close(); openAiModal();
  };
}

{
  const nb = document.getElementById("netbtn");
  if(nb){
    if(typeof netAvailable === "function" && netAvailable()) nb.onclick = openNetModal;
    else nb.style.display = "none";
  }
  const ab = document.getElementById("aibtn");
  if(ab) ab.onclick = openAiModal;
  if(location.hash.startsWith("#join=") && typeof netAvailable === "function" && netAvailable())
    openNetModal();
}

ensureCast();
renderRoster();
renderWheel();
renderAll();
updatePlaceholder();
updateRuleHint();
window.addEventListener("resize", ()=>renderAll());
