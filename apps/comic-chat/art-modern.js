"use strict";
/* ===========================================================================
   "Modern" art style — the original procedural SVG cast.
   Kept as an alternative to the authentic Microsoft artwork.

   Exposes the same art interface the engine expects:
     {name, normHeight, aspect, faceX, headFrac, faces[], torsos[], draw()}
   Natural coordinate box: x in [-46,46], y in [-164,+2].
   =========================================================================== */
const MODERN_NAT = {x:-46, y:-164, w:92, h:166};

const MODERN_CHARS = [
  { id:"margo",    name:"Margo",    skin:"#f2c79a", shirt:"#2aa8a0", hair:"#6b3fa0" },
  { id:"rex",      name:"Rex",      skin:"#b9c2cc", shirt:"#7d8794", hair:"#5a6470" },
  { id:"whiskers", name:"Whiskers", skin:"#f0a05a", shirt:"#4f9d4f", hair:"#c97f36" },
  { id:"zorb",     name:"Zorb",     skin:"#8fd14f", shirt:"#8f9bff", hair:"#5aa32b" },
  { id:"duke",     name:"Duke",     skin:"#e8b088", shirt:"#2c3e70", hair:"#9a9a9a" },
  { id:"pix",      name:"Pix",      skin:"#f2c79a", shirt:"#2b2b2b", hair:"#e6007e" }
];

const OUT = "#1a1a1a";

/* ---------- faces ---------- */
function mFace(c, key, t){
  const eyeOpen = (cx,r)=>`<circle cx="${cx}" cy="-115" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="2"/><circle cx="${cx}" cy="-115" r="2.3" fill="${OUT}"/>`;
  const eyeHalf = cx=>eyeOpen(cx,5.5)+`<path d="M ${cx-6} -121 A 6 6 0 0 1 ${cx+6} -121 L ${cx+6} -117 L ${cx-6} -117 Z" fill="${c.skin}"/><line x1="${cx-6}" y1="-117" x2="${cx+6}" y2="-117" stroke="${OUT}" stroke-width="2"/>`;
  const eyeShut = (cx,up)=>`<path d="M ${cx-5.5} -113 Q ${cx} ${up?-121:-108} ${cx+5.5} -113" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
  const brow = (cx,dy,rot)=>`<line x1="${cx-7}" y1="${dy}" x2="${cx+7}" y2="${dy}" stroke="${OUT}" stroke-width="3" stroke-linecap="round" transform="rotate(${rot},${cx},${dy})"/>`;
  let eyes="", brows="", mouth="", extra="";
  switch(key){
    case "happy":
      eyes=eyeOpen(-10,5.5)+eyeOpen(10,5.5); brows=brow(-10,-131,0)+brow(10,-131,0);
      mouth = t>0.55
        ? `<path d="M -10 -100 Q 0 ${-100+14*t} 10 -100 Z" fill="#fff" stroke="${OUT}" stroke-width="2.5"/>`
        : `<path d="M -8 -98 Q 0 ${-94+6*t} 8 -98" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    case "laugh":
      eyes=eyeShut(-10,true)+eyeShut(10,true); brows=brow(-10,-131,0)+brow(10,-131,0);
      mouth=`<path d="M -11 -100 Q 0 ${-100+16+8*t} 11 -100 Z" fill="#6b2737" stroke="${OUT}" stroke-width="2.5"/><ellipse cx="0" cy="${-91+6*t}" rx="5" ry="2.6" fill="#e2777a"/>`;
      extra=`<text x="30" y="-128" font-size="11" font-family="Comic Sans MS,cursive" fill="${OUT}" stroke="#fff" stroke-width="3.5" paint-order="stroke">${t>0.5?"ha ha!":"ha!"}</text>`;
      break;
    case "shout":
      eyes=eyeOpen(-10,6)+eyeOpen(10,6); brows=brow(-10,-129,14)+brow(10,-129,-14);
      mouth=`<ellipse cx="0" cy="${-96+2*t}" rx="${8+3*t}" ry="${7+5*t}" fill="#6b2737" stroke="${OUT}" stroke-width="2.5"/><ellipse cx="0" cy="${-92+4*t}" rx="4.5" ry="2.4" fill="#e2777a"/>`;
      extra=`<g fill="none" stroke="${OUT}" stroke-width="2" opacity="0.85"><path d="M 34 -126 l 9 -4"/><path d="M 34 -118 l 9 0"/><path d="M 33 -134 l 8 -8"/></g>`;
      break;
    case "coy":
      eyes=eyeHalf(-10)+eyeHalf(10); brows=brow(-10,-133,-6)+brow(10,-127,0);
      mouth=`<path d="M -8 -97 Q 2 -92 10 -100" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    case "sad":
      eyes=eyeOpen(-10,5)+eyeOpen(10,5); brows=brow(-10,-129,-14)+brow(10,-129,14);
      mouth=`<path d="M -8 -94 Q 0 ${-101-4*t} 8 -94" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
      if(t>0.65) extra=`<path d="M -14 -110 q -3 6 0 8 q 3 -2 0 -8" fill="#79c4f2" stroke="#4a9fd8" stroke-width="1"/>`;
      break;
    case "scared":
      eyes=eyeOpen(-10,6.5+1.5*t)+eyeOpen(10,6.5+1.5*t); brows=brow(-10,-135,-8)+brow(10,-135,8);
      mouth=`<ellipse cx="0" cy="-95" rx="${3+3*t}" ry="${4+3*t}" fill="#6b2737" stroke="${OUT}" stroke-width="2"/>`;
      if(t>0.45) extra=`<path d="M 26 -132 q -3 7 0 9 q 4 -2 0 -9" fill="#79c4f2" stroke="#4a9fd8" stroke-width="1"/>`;
      break;
    case "bored":
      eyes=eyeHalf(-10)+eyeHalf(10); brows=brow(-10,-126,0)+brow(10,-126,0);
      mouth=`<line x1="-7" y1="-96" x2="7" y2="-96" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    case "angry":
      eyes=eyeOpen(-10,5)+eyeOpen(10,5); brows=brow(-10,-127,16)+brow(10,-127,-16);
      mouth = t>0.6
        ? `<rect x="-10" y="-101" width="20" height="8" rx="3" fill="#fff" stroke="${OUT}" stroke-width="2.5"/><line x1="-4" y1="-101" x2="-4" y2="-93" stroke="${OUT}" stroke-width="1.5"/><line x1="3" y1="-101" x2="3" y2="-93" stroke="${OUT}" stroke-width="1.5"/>`
        : `<path d="M -8 -94 Q 0 ${-101-3*t} 8 -94" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
      if(t>0.7){
        const steam = `<path d="M 33 -140 q 4 -4 0 -8 q -4 -4 0 -8"/><path d="M 40 -136 q 4 -4 0 -8"/>`;
        extra=`<g fill="none" stroke="#fff" stroke-width="4.5">${steam}</g><g fill="none" stroke="${OUT}" stroke-width="1.5">${steam}</g>`;
      }
      break;
    default: /* neutral */
      eyes=eyeOpen(-10,5.5)+eyeOpen(10,5.5); brows=brow(-10,-129,0)+brow(10,-129,0);
      mouth=`<path d="M -6 -97 Q 0 -94.5 6 -97" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  let nose = `<path d="M 0 -110 Q 3.5 -105 0 -103" fill="none" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>`;
  if(c.id==="whiskers") nose = `<path d="M -3 -107 L 3 -107 L 0 -103 Z" fill="#e87ba0" stroke="${OUT}" stroke-width="1.5"/>`;
  if(c.id==="rex") nose = `<circle cx="0" cy="-106" r="2" fill="none" stroke="${OUT}" stroke-width="1.5"/>`;
  return brows+eyes+nose+mouth+extra;
}

/* ---------- per-character head decoration ---------- */
function mExtras(c){
  switch(c.id){
    case "margo": return {
      back:`<circle cx="0" cy="-112" r="33" fill="${c.hair}" stroke="${OUT}" stroke-width="2.5"/><rect x="-33" y="-112" width="12" height="26" rx="5" fill="${c.hair}" stroke="${OUT}" stroke-width="2.5"/><rect x="21" y="-112" width="12" height="26" rx="5" fill="${c.hair}" stroke="${OUT}" stroke-width="2.5"/>`,
      front:`<path d="M -28 -116 Q -22 -140 0 -139 Q 22 -140 28 -116 Q 18 -128 6 -129 Q 10 -134 -2 -133 Q -18 -132 -28 -116 Z" fill="${c.hair}" stroke="${OUT}" stroke-width="2"/>`};
    case "rex": return {
      back:`<line x1="0" y1="-138" x2="0" y2="-152" stroke="${OUT}" stroke-width="2.5"/><circle cx="0" cy="-156" r="4.5" fill="#ffd23e" stroke="${OUT}" stroke-width="2"/>`,
      front:`<rect x="-33" y="-118" width="7" height="12" rx="2" fill="#8b95a1" stroke="${OUT}" stroke-width="2"/><rect x="26" y="-118" width="7" height="12" rx="2" fill="#8b95a1" stroke="${OUT}" stroke-width="2"/><circle cx="-20" cy="-131" r="1.6" fill="${OUT}"/><circle cx="20" cy="-131" r="1.6" fill="${OUT}"/>`};
    case "whiskers": return {
      back:`<path d="M -24 -128 L -33 -155 L -8 -136 Z" fill="${c.skin}" stroke="${OUT}" stroke-width="2.5"/><path d="M 24 -128 L 33 -155 L 8 -136 Z" fill="${c.skin}" stroke="${OUT}" stroke-width="2.5"/><path d="M -24 -132 L -28 -147 L -14 -136 Z" fill="#e87ba0"/><path d="M 24 -132 L 28 -147 L 14 -136 Z" fill="#e87ba0"/>`,
      front:`<g stroke="${OUT}" stroke-width="1.4"><line x1="-26" y1="-106" x2="-42" y2="-109"/><line x1="-26" y1="-101" x2="-42" y2="-100"/><line x1="26" y1="-106" x2="42" y2="-109"/><line x1="26" y1="-101" x2="42" y2="-100"/></g>`};
    case "zorb": return {
      back:`<g fill="none" stroke="${OUT}" stroke-width="2.5"><path d="M -12 -136 Q -18 -148 -14 -156"/><path d="M 12 -136 Q 18 -148 14 -156"/></g><circle cx="-14" cy="-159" r="4.5" fill="#c8f26e" stroke="${OUT}" stroke-width="2"/><circle cx="14" cy="-159" r="4.5" fill="#c8f26e" stroke="${OUT}" stroke-width="2"/>`,
      front:""};
    case "duke": return {
      back:`<ellipse cx="-27" cy="-103" rx="6" ry="9" fill="${c.hair}" stroke="${OUT}" stroke-width="2"/><ellipse cx="27" cy="-103" rx="6" ry="9" fill="${c.hair}" stroke="${OUT}" stroke-width="2"/>`,
      front:`<path d="M -11 -102 Q -6 -107 0 -103 Q 6 -107 11 -102 Q 6 -98 0 -100 Q -6 -98 -11 -102 Z" fill="${c.hair}" stroke="${OUT}" stroke-width="1.5"/><path d="M 0 -84 L -6 -76 L 0 -52 L 6 -76 Z" fill="#c0392b" stroke="${OUT}" stroke-width="2"/>`};
    case "pix": return {
      back:`<path d="M -18 -130 L -12 -160 L -5 -133 L 1 -164 L 8 -133 L 15 -158 L 20 -128 Z" fill="${c.hair}" stroke="${OUT}" stroke-width="2.5"/>`,
      front:`<circle cx="-27" cy="-98" r="3" fill="none" stroke="#d4af37" stroke-width="2"/>`};
  }
  return {back:"", front:""};
}

/* ---------- arms / torso gestures ---------- */
function mArm(c, pts, point){
  const poly = pts.map(p=>p.join(",")).join(" ");
  const h = pts[pts.length-1];
  let extra = "";
  if(point) extra =
    `<line x1="${h[0]}" y1="${h[1]}" x2="${h[0]+10}" y2="${h[1]-1}" stroke="${OUT}" stroke-width="8" stroke-linecap="round"/>`+
    `<line x1="${h[0]}" y1="${h[1]}" x2="${h[0]+10}" y2="${h[1]-1}" stroke="${c.skin}" stroke-width="4.5" stroke-linecap="round"/>`;
  return `<polyline points="${poly}" fill="none" stroke="${OUT}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`+
         `<polyline points="${poly}" fill="none" stroke="${c.shirt}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`+
         extra+`<circle cx="${h[0]}" cy="${h[1]}" r="5.5" fill="${c.skin}" stroke="${OUT}" stroke-width="2"/>`;
}
const TORSO_POSE = {
  rest:      c=>({back:mArm(c,[[-24,-75],[-30,-50],[-26,-26]]),  front:mArm(c,[[24,-75],[30,-50],[26,-26]])}),
  wave:      c=>({back:mArm(c,[[-24,-75],[-30,-50],[-26,-26]]),  front:mArm(c,[[24,-75],[40,-92],[34,-116]])}),
  pointOut:  c=>({back:mArm(c,[[-24,-75],[-30,-50],[-26,-26]]),  front:mArm(c,[[24,-75],[45,-70],[60,-74]],true)}),
  pointSelf: c=>({back:mArm(c,[[-24,-75],[-30,-50],[-26,-26]]),  front:mArm(c,[[24,-75],[40,-62],[14,-68]])}),
  shrug:     c=>({back:mArm(c,[[-24,-75],[-36,-58],[-46,-70]]),  front:mArm(c,[[24,-75],[36,-58],[46,-70]])}),
  crossed:   c=>({back:mArm(c,[[-24,-75],[-4,-56],[16,-62]]),    front:mArm(c,[[24,-75],[2,-54],[-18,-60]])}),
  chin:      c=>({back:mArm(c,[[-24,-75],[-30,-50],[-26,-26]]),  front:mArm(c,[[24,-75],[32,-52],[10,-92]])}),
  handsUp:   c=>({back:mArm(c,[[-24,-75],[-40,-88],[-38,-112]]), front:mArm(c,[[24,-75],[40,-88],[38,-112]])}),
  hips:      c=>({back:mArm(c,[[-24,-75],[-34,-55],[-20,-44]]),  front:mArm(c,[[24,-75],[34,-55],[20,-44]])})
};

/* face list: neutral + 8 emotions at two intensities */
function buildFaces(){
  const faces = [{emotion:EM.HAPPY, intensity:0, key:"neutral"}];
  for(const w of WHEEL) for(const t of [0.5, 1.0]) faces.push({emotion:w.em, intensity:t, key:w.key});
  return faces;
}
/* torso list: neutral, the three text gestures, a shrug, plus emotion-linked stances */
function buildTorsos(){
  return [
    {emotion:EM.HAPPY,      intensity:0,   pose:"rest"},
    {emotion:EM.WAVE,       intensity:1,   pose:"wave"},
    {emotion:EM.POINTOTHER, intensity:1,   pose:"pointOut"},
    {emotion:EM.POINTSELF,  intensity:1,   pose:"pointSelf"},
    {emotion:EM.SHRUG,      intensity:1,   pose:"shrug"},
    {emotion:EM.ANGRY,      intensity:1,   pose:"crossed"},
    {emotion:EM.SCARED,     intensity:1,   pose:"handsUp"},
    {emotion:EM.COY,        intensity:1,   pose:"chin"},
    {emotion:EM.SHOUT,      intensity:1,   pose:"hips"},
    {emotion:EM.BORED,      intensity:1,   pose:"rest"},
    {emotion:EM.LAUGH,      intensity:1,   pose:"rest"},
    {emotion:EM.SAD,        intensity:1,   pose:"rest"}
  ];
}

const MODERN_ART = {};
for(const c of MODERN_CHARS){
  const faces = buildFaces(), torsos = buildTorsos();
  MODERN_ART[c.id] = {
    id: c.id, name: c.name, normHeight: 100,
    aspect: MODERN_NAT.w / MODERN_NAT.h,
    faceX: 0.5, headFrac: 0.494,
    nat: MODERN_NAT,
    faces, torsos,
    draw(faceIdx, torsoIdx){
      const f = faces[Math.max(0,faceIdx)] || faces[0];
      const t = torsos[Math.max(0,torsoIdx)] || torsos[0];
      const key = f.intensity === 0 ? "neutral" : emotionKeyFromAngle(f.emotion, f.intensity);
      const ex = mExtras(c);
      const arms = (TORSO_POSE[t.pose] || TORSO_POSE.rest)(c);
      const head = c.id === "rex"
        ? `<rect x="-27" y="-137" width="54" height="52" rx="12" fill="${c.skin}" stroke="${OUT}" stroke-width="2.5"/>`
        : `<circle cx="0" cy="-110" r="28" fill="${c.skin}" stroke="${OUT}" stroke-width="2.5"/>`;
      const deco = c.id === "rex"
        ? `<circle cx="0" cy="-66" r="3" fill="#ffd23e" stroke="${OUT}" stroke-width="1.5"/><circle cx="0" cy="-52" r="3" fill="#ffd23e" stroke="${OUT}" stroke-width="1.5"/>`
        : c.id === "pix" ? `<circle cx="-12" cy="-70" r="2" fill="#d4af37"/><circle cx="0" cy="-73" r="2" fill="#d4af37"/><circle cx="12" cy="-70" r="2" fill="#d4af37"/>` : "";
      const body = `<path d="M -30 2 C -36 -55 -28 -84 0 -86 C 28 -84 36 -55 30 2 Z" fill="${c.shirt}" stroke="${OUT}" stroke-width="2.5"/>`;
      const neck = `<rect x="-7" y="-92" width="14" height="10" fill="${c.skin}" stroke="${OUT}" stroke-width="2"/>`;
      return arms.back+body+deco+neck+ex.back+head+ex.front+mFace(c, key, f.intensity)+arms.front;
    }
  };
}
