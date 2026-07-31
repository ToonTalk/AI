"use strict";
/* Builds the art objects the engine consumes from packed Comic Chat data.
   Used by art-original.js (embedded data) and by the artifact build, where the
   same data arrives at runtime as a dropped artpack file. */
function CC_buildOriginalArt(DATA){
  const ART = {};
  for(const id of Object.keys(DATA)){
    const d = DATA[id];
    const uri = i => "data:image/png;base64," + d.imgs[i];

    /* Halos (aura planes) are drawn for EVERY layer before ANY artwork — the
     client blits all auras first (bodycam.cpp:520-560), so a halo can never
     erase a neighboring layer's art. Compositing the halo into the image is
     what separated heads from bodies at the neck. */
  const auraImg = (rec, x, y) => (rec.aimg >= 0)
    ? `<image href="${"data:image/png;base64," + d.imgs[rec.aimg]}" x="${x}" y="${y}" width="${rec.w}" height="${rec.h}"/>`
    : "";

  if(d.bodies){
      /* AT_SIMPLE: one image per pose; gestures and emotions share the list. */
      const pick = (fi, ti) => {
        const t = d.bodies[Math.max(0,ti)], f = d.bodies[Math.max(0,fi)];
        return (t && t.e >= 1000) ? t : (f || t || d.bodies[0]);
      };
      ART[id] = {
        id: d.id, name: d.name, normHeight: d.normHeight,
        nat: d.nat, aspect: d.nat.w / d.nat.h, headFrac: d.headFrac, faceX: 0.5,
        faces: d.bodies.map(b => ({emotion: b.e, intensity: b.i})),
        torsos: d.bodies.map(b => ({emotion: b.e, intensity: b.i})),
        dim(fi, ti){
          const b = pick(fi, ti);
          return {x: -b.w/2, y: -b.h, w: b.w, h: b.h,
                  headH: b.h/2, anchorX: b.fx / b.w};
        },
        draw(fi, ti){
          const b = pick(fi, ti);
          return auraImg(b, -b.w/2, -b.h) +
                 `<image href="${uri(b.img)}" x="${-b.w/2}" y="${-b.h}" width="${b.w}" height="${b.h}"/>`;
        }
      };
      continue;
    }

    const offset = (f, t) => ({
      tx: -t.w/2, ty: -t.h,
      hx: -t.w/2 + t.cx + f.cxd - f.cx,
      hy: -t.h  + t.cy + f.cyd - f.cy
    });
    ART[id] = {
      id: d.id, name: d.name, normHeight: d.normHeight,
      nat: d.nat, aspect: d.nat.w / d.nat.h, headFrac: d.headFrac, faceX: 0.5,
      faces:  d.faces.map(f  => ({emotion: f.e, intensity: f.i})),
      torsos: d.torsos.map(t => ({emotion: t.e, intensity: t.i})),
      /* CBodyDouble::GetDimInfo (avatar.cpp:77): the CURRENT pose's composite
         box; headHeight runs from the box top to the head image's bottom. */
      dim(fi, ti){
        const f = d.faces[Math.max(0,fi)] || d.faces[0];
        const t = d.torsos[Math.max(0,ti)] || d.torsos[0];
        const o = offset(f, t);
        const x0 = Math.min(o.tx, o.hx), y0 = Math.min(o.ty, o.hy);
        const x1 = Math.max(o.tx + t.w, o.hx + f.w), y1 = Math.max(o.ty + t.h, o.hy + f.h);
        return {x: x0, y: y0, w: x1 - x0, h: y1 - y0,
                headH: (o.hy + f.h) - y0, anchorX: (o.hx + f.fx - x0) / (x1 - x0)};
      },
      draw(fi, ti){
        const f = d.faces[Math.max(0,fi)] || d.faces[0];
        const t = d.torsos[Math.max(0,ti)] || d.torsos[0];
        const o = offset(f, t);
        const halos = auraImg(t, o.tx, o.ty) + auraImg(f, o.hx, o.hy);
        const torso = `<image href="${uri(t.img)}" x="${o.tx}" y="${o.ty}" width="${t.w}" height="${t.h}"/>`;
        const head  = `<image href="${uri(f.img)}" x="${o.hx}" y="${o.hy}" width="${f.w}" height="${f.h}"/>`;
        return halos + (d.torsoFirst ? torso + head : head + torso);
      }
    };
  }
  return ART;
}
