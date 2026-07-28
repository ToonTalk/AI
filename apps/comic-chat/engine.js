"use strict";
/* ===========================================================================
   Web Comic Chat — layout & behavior engine
   Reimplemented from the MIT-licensed Microsoft Comic Chat source
   (github.com/microsoft/ComicChat). Comic Chat is
   Copyright (c) 1996, 1997, 1998 Microsoft Corporation. Released under MIT.

   All geometry is in TWIPS (1440/inch), matching the original. The original
   used y-up (panel top = 0, floor = -unitHeight); this port uses y-DOWN
   (panel top = 0, floor = +S) because that is SVG's convention. Constants are
   translated accordingly and noted where the sign flips.
   =========================================================================== */

/* ---- panel geometry (panel.h, pageview.cpp, backdrop.cpp) ---- */
const S              = 4860;   // design reference panel side (3.375") — panels are SQUARE
const BORDER_W       = 60;     // CUnitPanel::m_borderWidth
const INTERSTICE     = 144;    // gap between panels (0.1")
const MAX_BALLOONS   = 5;      // pOldP->m_elements.GetCount() >= 5 -> new panel
const MAX_BODIES     = 5;      // "don't add more than 5 people to the panel!!!"
const MAX_LINES      = 10;     // MAXLINES

/* ---- balloon constants (balloon.cpp / balloon.h) ---- */
const ONELINE_THRESH = 500;    // ONELINETHRESHOLD
const MIN_HOOK_H     = 100;    // MINHOOKHEIGHT
const MIN_ROUTE_W    = 300;    // MINROUTEWIDTH
const XBORDER        = 100, YBORDER = 40, TOPBORDER = -20;
const WAVE_H         = 70,  WAVE_INTERVAL = 300;   // H/VWAVEHEIGHT, H/VWAVEINTERVAL
const DOCK_SHIFT     = 90;     // TOPBORDER + YBORDER + HWAVEHEIGHT
const XBOXDELTA      = 90,  YBOXDELTA = 50;        // caption box padding
const MIN_TAIL_H     = 100;    // MINTAILHEIGHT
const TAIL_MOUTH     = 80;     // BreakSpline gap half-width
const BUBBLE_H       = 150, INTERBUBBLE = 100, ENDBUBBLE_W = 400;  // thought chain
const FONT_TWIPS     = 180;    // 9pt balloon text
const LEADING        = -40;    // Comic Sans MS vertical kern adjustment (fonts.cpp)

/* ---- character layout ---- */
const BODY_H_DIV     = 1.9;    // maxBodyHeight = unitHeight / 1.9
const ZOOM_DEADZONE  = 1.1;    // zoomFactor < 1.1 snaps to 1.0
const HEAD_ROOM      = 1.2;    // headFactor = maxBodyHeight / (maxHeadHeight * 1.2)
const BACKDROP_ANCHOR = (1 - 1/BODY_H_DIV);  // 0.4737 — backdrop crop follows the head-line

/* ===========================================================================
   EMOTION MODEL  (avatar.h:326-341)
   Angles are in the original's screen space: atan2(y_down, x).
   Happy=E, Coy=SE, Bored=S, Scared=SW, Sad=W, Angry=NW, Shout=N, Laugh=NE.
   =========================================================================== */
const NEMOTIONS = 8;
const EM = {
  HAPPY:  0*2*Math.PI/8,
  COY:    1*2*Math.PI/8,
  BORED:  2*2*Math.PI/8,
  SCARED: 3*2*Math.PI/8,
  SAD:    4*2*Math.PI/8,
  ANGRY:  5*2*Math.PI/8,
  SHOUT:  6*2*Math.PI/8,
  LAUGH:  7*2*Math.PI/8,
  /* pseudo-emotions: torso gestures, never on the wheel */
  WAVE:1001, POINTOTHER:1002, POINTSELF:1003, DOUBLEPOINT:1004, SHRUG:1005
};
const WHEEL = [
  {key:"happy",  em:EM.HAPPY,  label:"Happy"},
  {key:"coy",    em:EM.COY,    label:"Coy"},
  {key:"bored",  em:EM.BORED,  label:"Bored"},
  {key:"scared", em:EM.SCARED, label:"Scared"},
  {key:"sad",    em:EM.SAD,    label:"Sad"},
  {key:"angry",  em:EM.ANGRY,  label:"Angry"},
  {key:"shout",  em:EM.SHOUT,  label:"Shout"},
  {key:"laugh",  em:EM.LAUGH,  label:"Laughing"}
];
const isGesture = e => e >= 1000;

/* wrap to (-PI, PI] — vector2d.cpp subtract_angles */
function subAngles(a, b){
  let d = a - b;
  while(d >  Math.PI) d -= 2*Math.PI;
  while(d <= -Math.PI) d += 2*Math.PI;
  return d;
}
/* bodycam.cpp:285 — which wheel sector an angle belongs to */
function emotionKeyFromAngle(ang, intensity){
  if(intensity === 0) return "neutral";
  const a = ((ang + Math.PI) % (2*Math.PI)) - Math.PI;   // normalise to (-PI,PI]
  if(a >= 7*Math.PI/8 || a < -7*Math.PI/8) return "sad";
  if(a <= -5*Math.PI/8) return "angry";
  if(a <= -3*Math.PI/8) return "shout";
  if(a <=   -Math.PI/8) return "laugh";
  if(a >   5*Math.PI/8) return "scared";
  if(a >   3*Math.PI/8) return "bored";
  if(a >     Math.PI/8) return "coy";
  return "happy";
}

/* ===========================================================================
   TEXT ANALYSIS  (textpose.cpp + chat.rc:2290-2304, v2.5 table verbatim)
   =========================================================================== */
const RULES = [
  // [kind, arg, emotion, priority]
  ["allcaps", "",          EM.SHOUT, 9],
  ["find",    "!!!",       EM.SHOUT, 9],
  ["word_i",  "rotfl",     EM.LAUGH, 11],
  ["word_i",  "lol",       EM.LAUGH, 11],
  ["find_i",  "hehe",      EM.LAUGH, 11],
  ["find",    ":)",        EM.HAPPY, 10],
  ["find",    ":-)",       EM.HAPPY, 10],
  ["find",    ":(",        EM.SAD,   10],
  ["find",    ":-(",       EM.SAD,   10],
  ["find",    ";-)",       EM.COY,   10],
  ["find",    ";)",        EM.COY,   10],
  ["start_i", "you",       EM.POINTOTHER, 4],
  ["word_i",  "are you",   EM.POINTOTHER, 8],
  ["word_i",  "will you",  EM.POINTOTHER, 8],
  ["word_i",  "did you",   EM.POINTOTHER, 8],
  ["word_i",  "aren't you",EM.POINTOTHER, 8],
  ["word_i",  "don't you", EM.POINTOTHER, 8],
  ["start_i", "i",         EM.POINTSELF, 3],
  ["word_i",  "i'm",       EM.POINTSELF, 7],
  ["word_i",  "i will",    EM.POINTSELF, 7],
  ["word_i",  "i'll",      EM.POINTSELF, 7],
  ["word_i",  "i am",      EM.POINTSELF, 7],
  ["start_i", "hi",        EM.WAVE, 2],
  ["start_i", "bye",       EM.WAVE, 3],
  ["start_i", "hello",     EM.WAVE, 5],
  ["start_i", "welcome",   EM.WAVE, 5],
  ["start_i", "howdy",     EM.WAVE, 5]
];
// NOTE: angry / scared / bored have NO text rules in the original — wheel only.
// There is NO rule for "?" — question marks are only sentence terminators.

/* CheckForUppers (textpose.cpp:26): false if ANY lowercase, needs >1 uppercase */
function allCaps(s){
  let up = 0;
  for(const ch of s){
    if(ch >= 'a' && ch <= 'z') return false;
    if(ch >= 'A' && ch <= 'Z') up++;
  }
  return up > 1;
}
/* CheckWord (textpose.cpp:37): starts a word AND ends a word */
function checkWord(hay, needle){
  let i = 0;
  while((i = hay.indexOf(needle, i)) !== -1){
    const before = i === 0 || /\s/.test(hay[i-1]);
    const after  = i+needle.length >= hay.length || /[\s.,!?;:'"]/.test(hay[i+needle.length]);
    if(before && after) return true;
    i++;
  }
  return false;
}
/* StartCompare2 (textpose.cpp:264): prefix match, next char must not be alphanumeric.
   Faithful to the original bug: only ever tested at offset 0 of the whole message. */
function checkStart(hay, needle){
  if(!hay.startsWith(needle)) return false;
  const next = hay[needle.length];
  return next === undefined || !/[a-z0-9]/i.test(next);
}

/* CEmotionOpts::Add — duplicates keep the MAX priority (OVERRIDEBYPRIORITY) */
function optsAdd(opts, emotion, intensity, priority){
  for(const o of opts){
    if(o.emotion === emotion){ if(o.priority < priority){ o.priority = priority; o.intensity = intensity; } return; }
  }
  if(opts.length >= 10) return;
  opts.push({emotion, intensity, priority});
}
function getEmotionsFromString(str){
  const opts = [];
  const lower = str.toLowerCase();
  for(const [kind, arg, emotion, priority] of RULES){
    let hit = false;
    switch(kind){
      case "allcaps": hit = allCaps(str); break;
      case "find":    hit = str.indexOf(arg) !== -1; break;
      case "find_i":  hit = lower.indexOf(arg) !== -1; break;
      case "word_i":  hit = checkWord(lower, arg); break;
      case "start_i": hit = checkStart(lower, arg); break;
    }
    if(hit) optsAdd(opts, emotion, 1.0, priority);
  }
  return opts;
}

/* ===========================================================================
   POSE RESOLUTION  (avatar.cpp:252-412)
   Face and torso are resolved INDEPENDENTLY, highest priority first, so
   "HI THERE!!!" yields a shouting face AND a waving torso.
   =========================================================================== */
function pickFace(art, emotion, intensity){
  if(isGesture(emotion)) return -1;                 // gestures resolve against torsos only
  let best = -1, bestAng = Infinity, bestInt = Infinity;
  art.faces.forEach((f,i)=>{
    if(isGesture(f.emotion)) return;                // simple avatars mix gestures into the list
    const d = Math.abs(subAngles(f.emotion, emotion));
    const di = Math.abs(f.intensity - intensity);
    if(d < bestAng - 1e-9 || (Math.abs(d-bestAng) < 1e-9 && di < bestInt)){
      best = i; bestAng = d; bestInt = di;
    }
  });
  return best;
}
function pickTorso(art, emotion, intensity, lastTorso){
  const n = art.torsos.length;
  if(!n) return -1;
  if(isGesture(emotion)){
    for(let k=0;k<n;k++){                            // exact equality for gestures
      const i = (lastTorso + 1 + k) % n;
      if(art.torsos[i].emotion === emotion) return i;
    }
    return -1;
  }
  // round-robin from lastTorso so repeats cycle through variants
  let best = -1, bestInt = Infinity;
  for(let k=0;k<n;k++){
    const i = (lastTorso + 1 + k) % n;
    const t = art.torsos[i];
    if(isGesture(t.emotion)) continue;
    if(Math.abs(subAngles(t.emotion, emotion)) >= Math.PI/8) continue;   // within half a sector
    const di = Math.abs(t.intensity - intensity);
    if(di < bestInt){ best = i; bestInt = di; }
  }
  return best;
}
/* GetBodyFromEmotion(CEmotionOpts&) — avatar.cpp:354 */
function bodyFromOpts(art, opts, lastTorso){
  const pool = opts.map(o=>({...o}));
  let face = -1, torso = -1;
  while(true){
    let bi = -1, bp = -1;
    pool.forEach((o,i)=>{ if(o.priority > bp){ bp = o.priority; bi = i; } });
    if(bi < 0 || bp <= 0) break;
    const o = pool[bi];
    const f = pickFace(art, o.emotion, o.intensity);
    const t = pickTorso(art, o.emotion, o.intensity, lastTorso);
    o.priority = 0;
    if(f >= 0 && face < 0) face = f;
    if(t >= 0 && torso < 0) torso = t;
    if(face >= 0 && torso >= 0) break;
  }
  if(face < 0)  face  = pickFace(art, EM.HAPPY, 0);     // SetFaceNeutral
  if(torso < 0) torso = pickTorso(art, EM.HAPPY, 0, lastTorso);
  if(torso < 0) torso = 0;
  return {face, torso};
}
function bodyFromEmotion(art, emotion, intensity, lastTorso){
  return bodyFromOpts(art, [{emotion, intensity, priority:1}], lastTorso);
}

/* ===========================================================================
   TEXT MEASUREMENT — measured at FONT_TWIPS px so 1 measured px == 1 twip
   =========================================================================== */
const _mc = document.createElement("canvas").getContext("2d");
function balloonFont(italic){
  return (italic ? "italic " : "") + "bold " + FONT_TWIPS + 'px "Comic Sans MS","Comic Sans",cursive';
}
let LINE_HEIGHT = FONT_TWIPS * 1.2 + LEADING;
(function(){
  _mc.font = balloonFont(false);
  const m = _mc.measureText("Hg");
  if(m.fontBoundingBoxAscent && m.fontBoundingBoxDescent)
    LINE_HEIGHT = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent + LEADING;
})();
function textWidth(s, italic){ _mc.font = balloonFont(italic); return _mc.measureText(s).width; }
function widestWord(s, italic){
  return s.split(/\s+/).filter(Boolean).reduce((w,x)=>Math.max(w, textWidth(x, italic)), 0);
}
/* greedy wrap; a word wider than the line is force-broken mid-word (no hyphen) */
function wrapLines(s, width, italic){
  const words = s.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for(let w of words){
    while(textWidth(w, italic) > width && w.length > 1){
      let cut = w.length;
      while(cut > 1 && textWidth(w.slice(0,cut), italic) > width) cut--;
      if(line){ lines.push(line); line = ""; }
      lines.push(w.slice(0,cut));
      w = w.slice(cut);
    }
    const test = line ? line + " " + w : w;
    if(line && textWidth(test, italic) > width){ lines.push(line); line = w; }
    else line = test;
  }
  if(line) lines.push(line);
  return lines.slice(0, MAX_LINES);
}

/* ===========================================================================
   SEEDED RNG — the original captures m_seed = rand() per panel and re-seeds
   before every layout so re-layout is deterministic (panel.cpp:552, 861).
   =========================================================================== */
function makeRng(seed){
  let s = (seed >>> 0) || 1;
  return function(){
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

/* ===========================================================================
   AVATAR ORDERING & FACING  (panel.cpp:259-448)
   m_flip === false  => faces +x (right).   true => mirrored, faces left.
   =========================================================================== */
function evalPair(a, b, deltaPlacement){
  let rating = 0;
  let desiredDir;
  if(deltaPlacement > 0) desiredDir = false;         // other is to my RIGHT
  else { desiredDir = true; deltaPlacement = -deltaPlacement; }

  const talkTos = a.talkTos || [];
  if(talkTos.length === 0){
    if(a.flip !== desiredDir) rating += 4;           // I'm not facing him
    if(b.flip === desiredDir) rating += 2;           // he's not facing me
  } else {
    if(talkTos.indexOf(b.charId) !== -1){
      if(a.flip === desiredDir) rating += 4*(deltaPlacement-1);
      else rating += 40;                             // facing away from my addressee
      if(b.flip === desiredDir) rating += 4;
    }
  }
  return rating;
}
function displacementPenalty(order, hyst){
  let p = 0;
  order.forEach((b,i)=>{
    const h = hyst[b.charId];
    if(!h) return;
    const right = i+1 < order.length ? order[i+1].charId : null;
    const left  = i > 0 ? order[i-1].charId : null;
    if(h.lastRight !== undefined && h.lastRight !== right) p += 1;
    if(h.lastLeft  !== undefined && h.lastLeft  !== left)  p += 1;
  });
  return p;
}
function evalPlacement(order, hyst){
  let rating = displacementPenalty(order, hyst);
  for(let i=0;i<order.length;i++)
    for(let j=i+1;j<order.length;j++)
      rating += evalPair(order[i], order[j], j-i) + evalPair(order[j], order[i], i-j);
  return rating;
}
function orderAvatars(bodies, hyst){
  const placed = [];
  for(const b of bodies){
    let best = null, bestRating = 1000;
    for(let pos=0; pos<=placed.length; pos++){
      for(const flip of [false, true]){
        b.flip = flip;
        const trial = placed.slice(0, pos).concat([b], placed.slice(pos));
        const r = evalPlacement(trial, hyst);
        if(r < bestRating){ bestRating = r; best = {pos, flip}; }
      }
    }
    if(!best) best = {pos: placed.length, flip: (hyst[b.charId] && hyst[b.charId].lastDir) || false};
    b.flip = best.flip;
    placed.splice(best.pos, 0, b);
  }
  return placed;
}
function updateHysteresis(order, hyst){
  order.forEach((b,i)=>{
    hyst[b.charId] = {
      lastDir:   b.flip,
      lastRight: i+1 < order.length ? order[i+1].charId : null,
      lastLeft:  i > 0 ? order[i-1].charId : null
    };
  });
}

/* ---- LayoutAvatars (panel.cpp:726-820) ---- */
function layoutAvatars(panel, getArt, hyst, establishing){
  const bodies = panel.bodies;
  if(!bodies.length){ panel.zoom = 1; return; }

  const order = orderAvatars(bodies, hyst);
  panel.bodies = order;

  const maxBodyHeight = S / BODY_H_DIV;
  const maxNorm = Math.max(...order.map(b=>getArt(b.charId).normHeight));
  order.forEach(b=>{
    const art = getArt(b.charId);
    // GetDimInfo (avatar.cpp:77) measures the CURRENT pose's composite box,
    // so aspect and head height are per-pose, not per-character constants.
    b.dm = (art.dim && b.pose) ? art.dim(b.pose.face, b.pose.torso)
         : {x: art.nat.x, y: art.nat.y, w: art.nat.w, h: art.nat.h,
            headH: art.nat.h * art.headFrac, anchorX: art.faceX};
    b.height = maxBodyHeight * (art.normHeight / maxNorm);
    b.width  = b.height * (b.dm.w / b.dm.h);
    b.headHeight = b.height * (b.dm.headH / b.dm.h);
  });

  // preHeight fixes where the head sits. The original never moves `top` when it
  // zooms — the body grows DOWNWARD past the panel floor and the feet are
  // cropped, which is what makes a close-up a close-up.
  order.forEach(b=>{ b.preHeight = b.height; });

  let sumWidth = order.reduce((s,b)=>s+b.width, 0);
  let zoom = 1.0;
  if(sumWidth > S){                                  // too wide -> shrink to fit
    const reduction = S / sumWidth;
    order.forEach(b=>{ b.height *= reduction; b.width *= reduction; b.headHeight *= reduction;
                       b.preHeight = b.height; });
    sumWidth = S;
  } else if(!establishing){                          // room to spare -> zoom in
    zoom = S / sumWidth;
    const maxHead = Math.max(...order.map(b=>b.headHeight));
    zoom = Math.min(zoom, maxBodyHeight / (maxHead * HEAD_ROOM));   // never crop at the neck
    if(zoom < ZOOM_DEADZONE) zoom = 1.0;
    order.forEach(b=>{ b.height *= zoom; b.width *= zoom; b.headHeight *= zoom; });
  }
  panel.zoom = zoom;

  // equal gutters: slack split into n+1 margins, including both outer edges
  const bdyWidth = order.reduce((s,b)=>s+b.width, 0);
  const margin = (S - bdyWidth) / (order.length + 1);
  let x = margin;
  order.forEach(b=>{
    const art = getArt(b.charId);
    b.left = x; b.right = x + b.width;
    b.top = S - b.preHeight;                         // head-line, fixed by the un-zoomed height
    b.bottom = b.top + b.height;                     // may run past the floor and be cropped
    // the balloon-tail anchor is per-pose in the original artwork
    const frac = b.dm.anchorX;
    const fx = b.flip ? (1 - frac) : frac;
    b.arrowX = b.left + fx * b.width;
    x += b.width + margin;
  });
  updateHysteresis(order, hyst);
}

/* ===========================================================================
   BALLOON LAYOUT  (panel.cpp:855-945, balloon.cpp)
   =========================================================================== */
/* inset by WAVE_H as well: the hand-drawn wobble bulges outside the cloud rect */
function balloonRect(){
  return {left: BORDER_W + WAVE_H, right: S - BORDER_W - WAVE_H, top: BORDER_W + WAVE_H, bottom: S/2};
}
/* QueryRouteRgn (balloon.cpp:1358) — keeps tails from ever crossing */
function queryRouteRgn(b, otherToX){
  const toX = b.speakerArrowX;
  if(otherToX > toX) return {left: Math.max(toX, b.routeRgn.left + MIN_ROUTE_W), right: Infinity};
  return {left: -Infinity, right: Math.min(toX, b.routeRgn.right - MIN_ROUTE_W)};
}
function measureBalloon(msg, width){
  const italic = msg.mode === "whisper";
  const lines = wrapLines(msg.display, width, italic);
  const tw = lines.reduce((w,l)=>Math.max(w, textWidth(l, italic)), 0);
  return {lines, textW: tw, textH: lines.length * LINE_HEIGHT};
}
function cloudPad(msg){
  return msg.mode === "action"
    ? {x: XBOXDELTA, y: YBOXDELTA}
    : {x: XBORDER + WAVE_H, y: YBORDER + WAVE_H};
}

function layoutBalloons(panel, rng){
  const free = balloonRect();
  const placed = [];
  for(let i=0;i<panel.balloons.length;i++){
    if(!layoutOneBalloon(panel.balloons[i], placed, free, rng)){
      if(i === 0 && panel.balloons.length === 1){ forceFit(panel.balloons[0], free); return true; }
      return false;                                  // caller starts a new panel
    }
    placed.push(panel.balloons[i]);
  }
  return true;
}

function layoutOneBalloon(b, placed, free, rng){
  const italic = b.msg.mode === "whisper";
  const maxWidth = free.right - free.left;
  const oneLineLen = textWidth(b.msg.display, italic);
  const pad = cloudPad(b.msg);

  /* --- Step A: choose a width (GetCloudEstimate) --- */
  let goalWidth;
  if(oneLineLen <= ONELINE_THRESH){
    goalWidth = oneLineLen;
  } else {
    // lowest previous bottom (y-down: the largest bottom seen so far)
    let lowest = free.top;
    for(const p of placed) lowest = Math.max(lowest, p.cloud.bottom);
    const potentialHeight = Math.max(LINE_HEIGHT, free.bottom - lowest + MIN_HOOK_H);
    const area = 1.3 * oneLineLen * LINE_HEIGHT;
    let minWidth = area / potentialHeight;
    minWidth = Math.max(minWidth, widestWord(b.msg.display, italic));
    minWidth = Math.min(minWidth, maxWidth);
    goalWidth = minWidth + rng() * (maxWidth - minWidth);
  }
  goalWidth = Math.min(goalWidth + 200, maxWidth);
  goalWidth = Math.min(goalWidth, oneLineLen + 200);
  goalWidth = Math.max(goalWidth, Math.min(widestWord(b.msg.display, italic), maxWidth));

  const m = measureBalloon(b.msg, goalWidth);
  const cw = Math.min(m.textW + 2*pad.x, maxWidth);

  /* --- Step B: choose x so the speaker's anchor is inside the balloon --- */
  let left;
  if(b.msg.mode === "action"){
    left = free.left;                                // caption boxes are flush left
  } else {
    const toX = b.speakerArrowX;
    const lo = toX - cw, hi = toX;
    left = lo + rng() * (hi - lo);
  }
  let right = left + cw;

  /* --- Step C: respect every earlier balloon's tail corridor --- */
  let mostLeft = free.left, mostRight = free.right;
  if(b.msg.mode !== "action"){
    for(const p of placed){
      if(p.msg.mode === "action") continue;          // boxes opt out of routing
      const a = queryRouteRgn(p, b.speakerArrowX);
      mostLeft = Math.max(mostLeft, a.left);
      mostRight = Math.min(mostRight, a.right);
    }
  }
  if(mostLeft > left || mostRight < right){
    const clearance = mostRight - mostLeft;
    if(clearance >= cw){
      const delta = (mostLeft > left) ? mostLeft - left : mostRight - right;
      left += delta; right += delta;
    } else { left = mostLeft; right = mostRight; }
  }
  if(left < free.left){ right += free.left - left; left = free.left; }
  if(right > free.right){ left -= right - free.right; right = free.right; }
  if(left < free.left) left = free.left;
  if(right > free.right) right = free.right;

  /* The corridor may be narrower than the balloon wanted to be. Re-wrap the
     text to whatever width actually survived rather than letting the cloud
     spill outside the panel. */
  const availW = right - left;
  if(availW < 2*pad.x + 200) return false;
  const text2 = measureBalloon(b.msg, Math.min(cw, availW) - 2*pad.x);
  const cw2 = Math.min(text2.textW + 2*pad.x, availW);
  const ch2 = text2.textH + 2*pad.y;
  right = left + cw2;

  /* --- vertical: below anything it overlaps, else share the top --- */
  let top = free.top;
  for(const p of placed){
    if(p.cloud.right < left) top = Math.max(top, p.cloud.top);
    else top = Math.max(top, p.cloud.bottom + DOCK_SHIFT);
  }
  let bottom = top + ch2;

  /* --- validate: must leave room for a tail --- */
  if(bottom > free.bottom - MIN_HOOK_H) return false;

  b.cloud = {left, top, right, bottom};
  b.text = text2;
  b.pad = pad;
  b.routeRgn = {left: b.cloud.left, right: b.cloud.right};

  /* AdjustRouteRgns: shrink earlier corridors so they no longer overlap this one */
  for(const p of placed){
    if(p.msg.mode === "action") continue;
    if(b.cloud.left > p.speakerArrowX) p.routeRgn.right = Math.min(p.routeRgn.right, b.cloud.left);
    else if(b.cloud.right < p.speakerArrowX) p.routeRgn.left = Math.max(p.routeRgn.left, b.cloud.right);
  }
  return true;
}

/* ForceFitBalloon — a lone balloon that won't fit gets squeezed rather than dropped */
function forceFit(b, free){
  const pad = cloudPad(b.msg);
  const cw = free.right - free.left;
  const maxH = free.bottom - free.top - MIN_HOOK_H;
  const text = measureBalloon(b.msg, cw - 2*pad.x);
  const ch = Math.min(text.textH + 2*pad.y, maxH);
  b.cloud = {left: free.left, top: free.top, right: free.right, bottom: free.top + ch};
  b.text = text; b.pad = pad;
  b.routeRgn = {left: b.cloud.left, right: b.cloud.right};
}

/* ===========================================================================
   FULL STRIP LAYOUT — ties it together, with the "doesn't fit => new panel"
   retry that the original gets from AddLine recursing (panel.cpp:1110).
   =========================================================================== */
function layoutStrip(messages, getArt, opts){
  const withTitle = opts && opts.title;
  const panels = [];
  const hyst = {};
  const lastTorso = {};
  let forceNew = false;

  if(withTitle) panels.push({title:true, msgs:[], bodies:[], balloons:[], zoom:1});

  const commit = (panel, idx) => {
    // resolve bodies present: speakers + their explicit addressees (talk-tos)
    const ids = [];
    const talkMap = {};
    for(const m of panel.msgs){
      if(ids.indexOf(m.charId) === -1) ids.push(m.charId);
      talkMap[m.charId] = m.talkTos || [];
    }
    for(const m of panel.msgs)
      for(const t of (m.talkTos || []))
        if(ids.indexOf(t) === -1 && ids.length < MAX_BODIES) ids.push(t);

    panel.bodies = ids.map(id=>({charId:id, talkTos: talkMap[id] || [], flip:false}));
    // pose each body
    for(const body of panel.bodies){
      const art = getArt(body.charId);
      const msg = panel.msgs.find(m=>m.charId === body.charId);
      const lt = lastTorso[body.charId] === undefined ? -1 : lastTorso[body.charId];
      if(msg){
        body.pose = msg.wheel
          ? bodyFromEmotion(art, msg.wheel.emotion, msg.wheel.intensity, lt)
          : bodyFromOpts(art, getEmotionsFromString(msg.text), lt);
      } else {
        body.pose = bodyFromEmotion(art, EM.HAPPY, 0, lt);   // addressees stand neutral
      }
      lastTorso[body.charId] = body.pose.torso;
    }
    const establishing = idx <= 1;
    layoutAvatars(panel, getArt, hyst, establishing);

    panel.balloons = panel.msgs.map(m=>{
      const body = panel.bodies.find(b=>b.charId === m.charId);
      return {msg:m, speakerArrowX: body ? body.arrowX : S/2, speaker: body};
    });
    return layoutBalloons(panel, makeRng(panel.seed));
  };

  let seedCounter = 12345;
  for(const m of messages){
    if(m.mode === "action") forceNew = true;
    let cur = panels[panels.length-1];
    const speakerInPanel = cur && !cur.title && cur.msgs.some(x=>x.charId === m.charId);
    let startNew = forceNew || !cur || cur.title ||
                   cur.msgs.length >= MAX_BALLOONS ||
                   panels.length < (withTitle ? 2 : 1) ||
                   speakerInPanel;

    if(!startNew){
      // try appending: clone, re-layout the whole panel, keep only if it fits
      const trial = {msgs: cur.msgs.concat([m]), bodies:[], balloons:[], seed: cur.seed};
      if(commit(trial, panels.length-1)){
        panels[panels.length-1] = trial;
        continue;
      }
      startNew = true;                                // didn't fit -> new panel
    }
    const p = {msgs:[m], bodies:[], balloons:[], seed: (seedCounter = (seedCounter*1103515245+12345) >>> 0)};
    commit(p, panels.length);
    panels.push(p);
    forceNew = false;
  }
  return panels;
}
