import * as T from './vendor/three.module.js';

export const HOUSE={width:8.01,depth:6,extensionLeft:.61,extensionBack:11.51,extensionRight:7.683,first:2.717,bedFloor:2.488};
export const rooms=[
 {id:'front',name:'Front garden',floor:0,point:[4.04,-4.6],look:[4.04,2.2]},
 {id:'hall',name:'Entrance hall',floor:0,rect:[3.48,0,4.6,1.2],point:[4.04,.62],look:[4.04,3]},
 {id:'sitting',name:'Sitting room',floor:0,rect:[.25,0,3.48,3.38],point:[2.6,1.25],look:[1,2]},
 {id:'reception',name:'Reception room',floor:0,rect:[4.62,0,7.76,5.78],point:[5.28,3.35],look:[6.6,1.2]},
 {id:'utility',name:'Utility',floor:0,rect:[.25,3.5,2.74,5.82],point:[1.68,4.6],look:[.4,4.8]},
 {id:'shower',name:'Steam shower',floor:0,rect:[2.87,3.51,4.45,5.8],point:[3.75,4.32],look:[3.45,5.65]},
 {id:'kitchen',name:'Kitchen',floor:0,rect:[.96,6.18,4.2,11.16],point:[1.5,8.17],look:[4,10.5]},
 {id:'dining',name:'Dining area',floor:0,rect:[4.21,6.18,7.333,11.16],point:[6.95,9.55],look:[4.4,10.25]},
 {id:'garden',name:'Rear terrace',floor:0,point:[6.2,14.9],look:[4.2,10]},
 {id:'bed2',name:'Bedroom 2',floor:1,rect:[.25,.25,3.48,2.63],point:[2.68,1.2],look:[1.4,1.3]},
 {id:'study1',name:'Study 1',floor:1,rect:[4.62,.25,7.75,2.73],point:[5.15,1.25],look:[7.1,1.4]},
 {id:'study2',name:'Study 2',floor:1,rect:[5.56,2.89,7.75,5.76],point:[6.13,3.45],look:[7.1,5.1]},
 {id:'bath',name:'Bathroom',floor:1,rect:[.25,2.78,2.76,4.36],point:[2.18,3.62],look:[.8,3.5]},
 {id:'ensuite',name:'En-suite',floor:1,rect:[.25,4.51,2.76,5.78],point:[1.92,5.06],look:[.6,5.1]},
 {id:'landing',name:'Landing',floor:1,rect:[2.9,2.86,5.41,5.84],point:[4.04,3.2],look:[3.42,6.5]},
 {id:'bed1',name:'Bedroom 1',floor:1,rect:[.96,6.13,5.53,8.63],point:[4.83,7.19],look:[2.4,7.5]},
];

export function buildHouse(scene){
 const ground=new T.Group(),upper=new T.Group(),roof=new T.Group(),garden=new T.Group(),decor=new T.Group();
 ground.name='Ground floor';upper.name='First floor';roof.name='Roofs';scene.add(ground,upper,roof,garden,decor);
 const furniture=[new T.Group(),new T.Group()];ground.add(furniture[0]);upper.add(furniture[1]);
 const ceilings=[],colliders=[[],[]];let target=ground;
 const mat=(color,roughness=.8,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
 function texture(type){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');let seed=37;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  if(type==='brick'){ctx.fillStyle='#cab5a0';ctx.fillRect(0,0,512,512);for(let row=0;row<16;row++)for(let col=-1;col<5;col++){const shade=Math.floor(rand()*20);ctx.fillStyle=`rgb(${175+shade},${137+shade},${105+shade})`;ctx.fillRect(col*128+(row%2)*64+2,row*32+2,124,28);for(let i=0;i<30;i++){ctx.fillStyle=`rgba(70,53,39,${rand()*.1})`;ctx.fillRect(col*128+(row%2)*64+rand()*126,row*32+rand()*28,5,2)}}}
  if(type==='wood'){ctx.fillStyle='#c6b28e';ctx.fillRect(0,0,512,512);for(let n=0;n<8;n++){ctx.fillStyle=`hsl(35 29% ${62+rand()*12}%)`;ctx.fillRect(n*64+1,0,62,512);for(let i=0;i<100;i++){ctx.strokeStyle=`rgba(80,53,27,${rand()*.12})`;ctx.beginPath();const x=n*64+rand()*62;ctx.moveTo(x,0);ctx.bezierCurveTo(x+3,140,x-4,360,x+2,512);ctx.stroke()}ctx.fillStyle='#9e8b6e';ctx.fillRect(n*64,0,1,512);ctx.fillRect(n*64,(n%3)*170,64,1)}}
  if(type==='slate'){ctx.fillStyle='#555d5e';ctx.fillRect(0,0,512,512);for(let r=0;r<12;r++)for(let col=-1;col<7;col++){ctx.fillStyle=`hsl(180 4% ${26+rand()*12}%)`;ctx.fillRect(col*85+(r%2)*42+1,r*43+1,83,40);ctx.fillStyle='#262f30';ctx.fillRect(col*85+(r%2)*42,r*43+39,85,3)}}
  if(type==='tile'){ctx.fillStyle='#dddcd0';ctx.fillRect(0,0,512,512);for(let r=0;r<4;r++)for(let col=0;col<4;col++){ctx.fillStyle=`hsl(45 13% ${78+rand()*8}%)`;ctx.fillRect(col*128+2,r*128+2,124,124)}}
  const tx=new T.CanvasTexture(c);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=8;tx.repeat.set(type==='brick'?2:2,type==='brick'?2:2);return tx;
 }
 const wallM=mat('#f1eee4'),brickM=mat('#fff',.92,{map:texture('brick')}),renderM=mat('#e9e6db'),woodM=mat('#fff',.78,{map:texture('wood')}),tileM=mat('#fff',.8,{map:texture('tile')}),slateM=mat('#fff',.85,{map:texture('slate')}),trimM=mat('#eeeede'),frameM=mat('#ebeade'),darkM=mat('#37453f'),greenM=mat('#718476'),oakM=mat('#a99371'),stoneM=mat('#e3dfd0'),linenM=mat('#d8d3c5'),sofaM=mat('#a8b3a0'),glassM=mat('#abc8cb',.12,{transparent:true,opacity:.20,metalness:.18,depthWrite:false}),carpetM=mat('#d6cec0'),waterM=mat('#b6d3d0',.17,{transparent:true,opacity:.4}),metalM=mat('#9c9b8e',.32,{metalness:.75});
 const boxGeo=new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,h,d,m=wallM,parent=target){const o=new T.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 function sphere(x,y,z,r,m,parent=target,sx=1,sy=1,sz=1){const o=new T.Mesh(new T.SphereGeometry(r,12,8),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o}
 function cyl(x,y,z,r,h,m,parent=target){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,16),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 function poly(points,m,parent=target){const geo=new T.BufferGeometry();const verts=[];for(let i=1;i<points.length-1;i++)verts.push(...points[0],...points[i],...points[i+1]);geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();const o=new T.Mesh(geo,m);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 function bar(a,b,r,m,parent=target){const v1=new T.Vector3(...a),v2=new T.Vector3(...b),delta=v2.clone().sub(v1);const o=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),m);o.position.copy(v1.add(v2).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());parent.add(o);return o}
 function wall(a,b,h,y=0,{outside=false,openings=[],depth=.14,material=wallM,floor=0}={}){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);const mats=outside?[wallM,wallM,material,material,wallM,material]:material;
  function segment(start,end,lo,hi){if(end-start<.005||hi-lo<.005)return;const cx=a[0]+dx*(start+end)/2/length,cz=a[1]+dz*(start+end)/2/length;const o=box(cx,y+(lo+hi)/2,cz,end-start,hi-lo,depth,mats);o.rotation.y=angle;if(lo<.4&&hi>.1)colliders[floor].push({a:[a[0]+dx*start/length,a[1]+dz*start/length],b:[a[0]+dx*end/length,a[1]+dz*end/length],r:depth/2});}
  let cursor=0;for(const op of openings.sort((a,b)=>a.s-b.s)){segment(cursor,op.s,0,h);segment(op.s,op.s+op.w,0,op.bottom||0);segment(op.s,op.s+op.w,op.top,h);cursor=op.s+op.w;}segment(cursor,length,0,h);
  if(!outside){const skirt=box((a[0]+b[0])/2,y+.065,(a[1]+b[1])/2,length,.13,depth+.025,trimM);skirt.rotation.y=angle;for(const op of openings){/* door openings remain clear at ankle level */}skirt.visible=openings.length===0;}
 }
 function window(a,b,y,h,{sash=false,frame=frameM,glass=glassM,parent=target}={}){const dx=b[0]-a[0],dz=b[1]-a[1],w=Math.hypot(dx,dz),g=new T.Group();g.position.set((a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2);g.rotation.y=-Math.atan2(dz,dx);parent.add(g);
  box(0,0,0,w,h,.035,glass,g);box(0,h/2,0,w+.06,.065,.13,frame,g);box(0,-h/2,0,w+.06,.065,.16,frame,g);box(-w/2,0,0,.065,h,.13,frame,g);box(w/2,0,0,.065,h,.13,frame,g);box(0,0,0,.045,h,.095,frame,g);if(sash){box(0,.04,0,w,.06,.1,frame,g);box(-w/4,.3,0,.024,h/2-.2,.08,frame,g);box(w/4,.3,0,.024,h/2-.2,.08,frame,g);}else box(0,h*.34,0,w,.03,.07,frame,g);return g;
 }
 function doorway(a,b,y=0,h=2.04){const dx=b[0]-a[0],dz=b[1]-a[1],w=Math.hypot(dx,dz),g=new T.Group();g.position.set((a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2);g.rotation.y=-Math.atan2(dz,dx);target.add(g);box(-w/2,0,0,.06,h,.18,trimM,g);box(w/2,0,0,.06,h,.18,trimM,g);box(0,h/2,0,w+.07,.07,.18,trimM,g);}
 function flatFloor(x1,z1,x2,z2,y,m=woodM,parent=target){return box((x1+x2)/2,y-.055,(z1+z2)/2,x2-x1,.11,z2-z1,m,parent)}
 function slab(){const y=HOUSE.first;flatFloor(0,0,3.55,6,y,woodM,upper);flatFloor(4.55,0,8.01,6,y,woodM,upper);flatFloor(3.55,0,4.55,1.2,y,woodM,upper);flatFloor(3.55,2.85,4.55,6,y,woodM,upper);const ceiling=box(4,2.495,3,8,.04,6,wallM,ground);ceiling.visible=true;ceilings.push(ceiling);/* split ceiling leaves stairwell open */ground.remove(ceiling);for(const r of [[0,0,3.55,6],[4.55,0,8.01,6],[3.55,0,4.55,1.2],[3.55,2.85,4.55,6]]){const c=box((r[0]+r[2])/2,2.485,(r[1]+r[3])/2,r[2]-r[0],.02,r[3]-r[1],wallM,ground);ceilings.push(c)}flatFloor(.61,6,5.883,8.98,HOUSE.bedFloor,woodM,upper);const bc=box(3.246,2.25,7.49,5.273,.025,2.98,wallM,ground);ceilings.push(bc);}
 // The frontage and extension widths come from the figured plan dimensions.
 target=ground;flatFloor(0,0,8.01,6,0);flatFloor(.61,6,7.683,11.51,0);slab();
 const front=[[[0,0],[.35,0],false],[[.35,0],[.95,-.75],true],[[.95,-.75],[2.7,-.75],true],[[2.7,-.75],[3.35,0],true],[[3.35,0],[3.52,0],false],[[3.52,0],[4.58,0],false],[[4.58,0],[4.75,0],false],[[4.75,0],[5.4,-.75],true],[[5.4,-.75],[7.1,-.75],true],[[7.1,-.75],[7.76,0],true],[[7.76,0],[8.01,0],false]];
 for(let i=0;i<front.length;i++){const [a,b,bay]=front[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const ops=bay?[{s:.04,w:len-.08,bottom:.63,top:2.15}]:i===5?[{s:.05,w:.96,bottom:0,top:2.18}]:[];wall(a,b,2.475,0,{outside:true,material:brickM,depth:.28,openings:ops});if(bay){window(a,b,.67,1.44,{sash:true});poly([[a[0],-.005,a[1]],[b[0],-.005,b[1]],[b[0],-.005,0],[a[0],-.005,0]],woodM);}}
 doorway([3.57,0],[4.53,0],0,2.18);const door=box(3.56,1.04,.46,.065,2.08,.9,mat('#6c7c6c'));box(3.59,1.37,.35,.075,.7,.44,glassM);sphere(3.61,1.01,.82,.028,metalM);
 wall([8.01,0],[8.01,6],2.475,0,{outside:true,material:brickM,depth:.28});wall([8.01,6],[7.683,6],2.475,0,{outside:true,material:brickM,depth:.28});wall([7.683,6],[7.683,11.51],2.23,0,{outside:true,material:renderM,depth:.35});wall([.61,11.51],[.61,6],2.23,0,{outside:true,material:renderM,depth:.35,openings:[{s:4.375,w:.91,bottom:0,top:2.11}]});doorway([.61,6.225],[.61,7.135]);
 wall([.61,6],[0,6],2.475,0,{outside:true,material:brickM,depth:.28});wall([0,6],[0,0],2.475,0,{outside:true,material:brickM,depth:.28});
 wall([7.683,11.51],[.61,11.51],2.23,0,{outside:true,material:renderM,depth:.35,openings:[{s:1.0,w:2.485,bottom:0,top:2.11},{s:4.468,w:1.625,bottom:1.05,top:2.10}]});window([1.59,11.51],[3.215,11.51],1.05,1.05);window([4.2,11.51],[6.685,11.51],.025,2.09,{frame:darkM}); // Middle door panel is slid open.
 const slidingGlass=ground.children[ground.children.length-1];slidingGlass.children[0].visible=false;box(4.64,1.065,11.51,.84,2.03,.035,glassM);box(6.25,1.065,11.51,.84,2.03,.035,glassM);box(5.06,1.065,11.51,.045,2.09,.11,darkM);box(5.84,1.065,11.51,.045,2.09,.11,darkM);
 wall([.61,6],[8.01,6],2.475,0,{depth:.22,openings:[{s:.39,w:.915,bottom:0,top:2.11},{s:4.24,w:1.754,bottom:0,top:2.11}]});doorway([1,6],[1.915,6],0,2.11);doorway([4.85,6],[6.604,6],0,2.11);
 wall([3.48,0],[3.48,3.38],2.475,0,{openings:[{s:.21,w:.83,bottom:0,top:2.04}]});doorway([3.48,.21],[3.48,1.04]);wall([4.58,0],[4.58,6],2.475,0,{openings:[{s:.21,w:.83,bottom:0,top:2.04},{s:4.35,w:.91,bottom:0,top:2.11}]});doorway([4.58,.21],[4.58,1.04]);doorway([4.58,4.35],[4.58,5.26]);
 wall([0,3.45],[4.58,3.45],2.475);wall([2.8,3.45],[2.8,6],2.475);wall([3.48,2.65],[3.48,3.45],2.475,0,{openings:[{s:.13,w:.526,bottom:0,top:2.04}]});
 // A straight stair is a simplified version of the existing central flight.
 for(let i=0;i<15;i++)box(4.05,(i+1)*HOUSE.first/30,1.25+i*.108,1.0,(i+1)*HOUSE.first/15,.11,oakM);
 bar([3.53,.9,1.2],[3.53,HOUSE.first+.9,2.87],.025,oakM);for(let i=0;i<9;i++)bar([3.53,i*HOUSE.first/8,1.25+i*.19],[3.53,i*HOUSE.first/8+.86,1.25+i*.19],.012,trimM);
 // Upper level: two studies to the right; bathrooms and Bedroom 2 to the left.
 target=upper;const fy=HOUSE.first,uh=2.329;
 wall([0,0],[8.01,0],uh,fy,{outside:true,material:brickM,depth:.28,floor:1,openings:[{s:1.16,w:1.1,bottom:.74,top:2.10},{s:3.66,w:.65,bottom:.74,top:2.10},{s:5.72,w:1.1,bottom:.74,top:2.10}]});for(const [a,w] of [[1.16,1.1],[3.66,.65],[5.72,1.1]])window([a,0],[a+w,0],fy+.74,1.36,{sash:true});
 wall([8.01,0],[8.01,6],uh,fy,{outside:true,material:brickM,depth:.28,floor:1});wall([8.01,6],[5.883,6],uh,fy,{outside:true,material:brickM,depth:.28,floor:1,openings:[{s:.36,w:1.13,bottom:.86,top:2.10}]});window([6.52,6],[7.65,6],fy+.86,1.24,{sash:true});
 wall([0,6],[0,0],uh,fy,{outside:true,material:brickM,depth:.28,floor:1,openings:[{s:1.62,w:.685,bottom:1.10,top:2.15}]});window([0,3.695],[0,4.38],fy+1.10,1.05,{glass:mat('#cbd6d1',.5,{transparent:true,opacity:.7})});
 wall([.61,6],[0,6],uh,fy,{outside:true,material:brickM,depth:.28,floor:1});wall([.61,8.98],[.61,6],2.63,HOUSE.bedFloor,{outside:true,material:renderM,depth:.35,floor:1});wall([5.883,6],[5.883,8.98],2.63,HOUSE.bedFloor,{outside:true,material:renderM,depth:.35,floor:1});wall([5.883,8.98],[.61,8.98],2.63,HOUSE.bedFloor,{outside:true,material:renderM,depth:.35,floor:1,openings:[{s:2.668,w:1.625,bottom:1.1185,top:2.1685}]});window([1.59,8.98],[3.215,8.98],HOUSE.bedFloor+1.1185,1.05);
 wall([0,6],[5.883,6],uh,fy,{floor:1,openings:[{s:1.1,w:.615,bottom:0,top:2.01},{s:3.12,w:.81,bottom:0,top:2.04}]});doorway([1.1,6],[1.715,6],HOUSE.bedFloor,2.01);doorway([3.12,6],[3.93,6],fy);
 wall([4.58,0],[4.58,2.83],uh,fy,{floor:1,openings:[{s:2.0,w:.81,bottom:0,top:2.04}]});doorway([4.58,2.0],[4.58,2.81],fy);wall([4.58,2.83],[8.01,2.83],uh,fy,{floor:1});wall([5.48,2.83],[5.48,6],uh,fy,{floor:1,openings:[{s:.25,w:.81,bottom:0,top:2.04}]});doorway([5.48,3.08],[5.48,3.89],fy);
 wall([0,2.71],[3.48,2.71],uh,fy,{floor:1});wall([3.48,1.9],[3.48,2.85],uh,fy,{floor:1,openings:[{s:.15,w:.71,bottom:0,top:2.04}]});doorway([3.48,2.05],[3.48,2.76],fy);
 wall([2.83,2.71],[2.83,6],uh,fy,{floor:1,openings:[{s:.90,w:.71,bottom:0,top:2.04}]});doorway([2.83,3.61],[2.83,4.32],fy);wall([0,4.44],[2.83,4.44],uh,fy,{floor:1});wall([3.98,4.60],[5.48,4.60],uh,fy,{floor:1,openings:[{s:.21,w:.81,bottom:0,top:2.04}]});doorway([4.19,4.60],[5,4.60],fy);wall([3.98,4.60],[3.98,6],uh,fy,{floor:1});
 // Stair opening is edged with a guard and an oak handrail.
 for(let i=0;i<7;i++)bar([4.57,fy,1.35+i*.23],[4.57,fy+.92,1.35+i*.23],.012,trimM);bar([4.57,fy+.94,1.25],[4.57,fy+.94,2.88],.03,oakM);
 const mainCeil=box(4,fy+uh,3,8,.035,6,wallM);ceilings.push(mainCeil);const bedroomCeil=box(3.246,HOUSE.bedFloor+2.63,7.49,5.273,.035,2.98,wallM);ceilings.push(bedroomCeil);
 // Carpet and bathroom floors laid over the continuous structural floor.
 flatFloor(.16,.16,3.47,2.63,fy+.006,carpetM);flatFloor(.96,6.12,5.53,8.64,HOUSE.bedFloor+.006,carpetM);flatFloor(.14,2.79,2.75,4.36,fy+.009,tileM);flatFloor(.14,4.52,2.75,5.85,fy+.009,tileM);flatFloor(2.87,3.52,4.46,5.85,.009,tileM,ground);flatFloor(.13,3.52,2.73,5.85,.006,tileM,ground);
 // Roofs are explicit planes, including openings for both rear rooflights.
 target=roof;const roofMat=slateM.clone();roofMat.side=T.DoubleSide;
 function roofFace(points){poly(points,roofMat);const underside=poly(points.map(p=>[p[0],p[1]-.06,p[2]]),new T.MeshStandardMaterial({color:'#ebe9de',side:T.DoubleSide,roughness:.9}));ceilings.push(underside)}
 const e=5.08,r=7.38;roofFace([[-.2,e,-.22],[8.15,e,-.22],[8.15,r,2.85],[2.4,r,2.85]]);roofFace([[-.2,e,6.17],[2.4,r,2.85],[8.15,r,2.85],[8.15,e,6.17]]);roofFace([[-.2,e,-.22],[2.4,r,2.85],[-.2,e,6.17]]);poly([[8.01,e,0],[8.01,r,2.85],[8.01,e,6]],brickM);bar([2.4,r,2.85],[8.15,r,2.85],.055,darkM);
 // Hipped roof to the first-floor rear bedroom.
 const eb=5.16,rb=7.12;roofFace([[.41,eb,6],[3.25,rb,6],[3.25,rb,6.8],[.41,eb,9.15]]);roofFace([[3.25,rb,6],[6.08,eb,6],[6.08,eb,9.15],[3.25,rb,6.8]]);roofFace([[.41,eb,9.15],[3.25,rb,6.8],[6.08,eb,9.15]]);
 const ridgeX=4.15,ridgeY=3.995,eaveY=2.30,z1=8.98,z2=11.72;
 function pitchedSide(x0,x1,holeX0,holeX1){const yy=x=>eaveY+(ridgeY-eaveY)*(x-x0)/(x1-x0);const hz0=9.9,hz1=10.68;for(const rect of [[x0,z1,holeX0,z2],[holeX1,z1,x1,z2],[holeX0,z1,holeX1,hz0],[holeX0,hz1,holeX1,z2]]){const [xa,za,xb,zb]=rect;roofFace([[xa,yy(xa),za],[xb,yy(xb),za],[xb,yy(xb),zb],[xa,yy(xa),zb]])}const pts=[[holeX0,yy(holeX0),hz0],[holeX1,yy(holeX1),hz0],[holeX1,yy(holeX1),hz1],[holeX0,yy(holeX0),hz1]];poly(pts,new T.MeshStandardMaterial({color:'#9fbdc0',transparent:true,opacity:.22,roughness:.15,side:T.DoubleSide}));for(let i=0;i<4;i++)bar(pts[i],pts[(i+1)%4],.042,darkM)}
 pitchedSide(.41,ridgeX,1.85,3.03);pitchedSide(7.883,ridgeX,6.2,5.02);bar([ridgeX,ridgeY,z1],[ridgeX,ridgeY,z2],.05,darkM);
 // Rear gable, with a glazed top-light above the dining doors.
 const gableMat=new T.MeshStandardMaterial({color:'#e9e6db',side:T.DoubleSide});poly([[.61,2.23,11.51],[4.15,3.90,11.51],[4.15,2.23,11.51]],gableMat,ground);poly([[6.685,2.23,11.51],[6.685,2.70,11.51],[7.683,2.23,11.51]],gableMat,ground);poly([[4.15,2.13,11.51],[4.15,3.90,11.51],[6.685,2.70,11.51],[6.685,2.13,11.51]],new T.MeshStandardMaterial({color:'#acc7c9',transparent:true,opacity:.22,side:T.DoubleSide}),ground);bar([4.15,2.13,11.51],[4.15,3.90,11.51],.025,darkM,ground);bar([4.15,3.90,11.51],[6.685,2.70,11.51],.035,darkM,ground);bar([6.685,2.13,11.51],[6.685,2.70,11.51],.03,darkM,ground);
 // Sloping roof beside the rear bedroom, over the forward dining area.
 roofFace([[5.95,4.1,6],[7.883,2.3,6],[7.883,2.3,8.98],[5.95,4.1,8.98]]);poly([[5.95,2.23,6],[5.95,4.1,6],[7.683,2.23,6]],gableMat,ground);
 // Low roof over the existing front bays and entrance.
 roofFace([[-.13,2.48,-.92],[8.14,2.48,-.92],[8.14,2.99,.17],[-.13,2.99,.17]]);
 // Chimneys, gutters and subtle exterior detailing.
 box(7.59,7.72,2.85,.63,1.14,.73,brickM);box(7.59,8.30,2.85,.77,.10,.86,stoneM);for(const z of [2.65,3.03])cyl(7.59,8.48,z,.11,.33,mat('#9c7156'));box(.25,5.93,5.55,.48,1.8,.56,brickM);box(.25,6.85,5.55,.59,.1,.65,stoneM);cyl(.25,7.04,5.55,.1,.3,mat('#9c7156'));
 bar([-.14,5.07,-.2],[8.1,5.07,-.2],.055,darkM);bar([.41,2.28,8.98],[.41,2.28,11.72],.045,darkM);bar([7.873,2.28,6],[7.873,2.28,11.72],.045,darkM);bar([.47,.2,8.9],[.47,2.25,8.9],.045,darkM,ground);
 // Furnishing is illustrative, with arrangements kept clear of doorways.
 function rug(x,z,w,d,y=0,parent=target){const o=box(x,y+.012,z,w,.025,d,mat('#dad4c6'),parent);for(let i=-3;i<=3;i++)box(x+i*w/8,y+.027,z,.012,.003,d*.97,mat('#b8b79f'),parent);return o}
 function plant(x,z,y=0,parent=target,s=1){cyl(x,y+.20*s,z,.16*s,.4*s,mat('#bcb5a0'),parent);bar([x,y+.35*s,z],[x,y+1.12*s,z],.018*s,oakM,parent);for(let i=0;i<8;i++){const a=i*2.4;const leaf=sphere(x+Math.cos(a)*.17*s,y+(.68+i*.065)*s,z+Math.sin(a)*.17*s,.13*s,mat(i%2?'#6f8260':'#87936b'),parent,1,.45,1.7);leaf.rotation.y=a}}
 function sofa(x,z,w,rotation=0,y=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;target.add(g);box(0,.36,0,w,.32,.84,sofaM,g);box(0,.65,-.35,w,.56,.18,sofaM,g);box(-w/2,.53,0,.16,.51,.9,sofaM,g);box(w/2,.53,0,.16,.51,.9,sofaM,g);for(let i=0;i<3;i++)box((i-1)*w/3,.56,0,w/3-.06,.12,.65,linenM,g);for(const xx of [-w/2+.16,w/2-.16])for(const zz of [-.29,.29])cyl(xx,.12,zz,.025,.24,oakM,g);box(-w/3,.76,-.19,.4,.35,.16,mat('#d8c6b0'),g);return g}
 function table(x,z,w,d,y=0){box(x,y+.76,z,w,.06,d,oakM);for(const xx of [-w/2+.10,w/2-.1])for(const zz of [-d/2+.1,d/2-.1])box(x+xx,y+.37,z+zz,.065,.74,.065,oakM)}
 function chair(x,z,rotation=0,y=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;target.add(g);box(0,.46,0,.43,.065,.43,oakM,g);box(0,.72,-.19,.43,.49,.055,oakM,g);for(const xx of [-.16,.16])for(const zz of [-.16,.16])box(xx,.23,zz,.035,.46,.035,darkM,g)}
 function bed(x,z,w=1.6,rotation=0,y=fy){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;target.add(g);box(0,.23,0,w,.33,2.0,oakM,g);box(0,.48,0,w-.02,.25,1.97,linenM,g);box(0,.77,-1.02,w+.12,.94,.1,mat('#aaa38e'),g);box(0,.625,.38,w,.07,1.17,mat('#879787'),g);for(const xx of [-w/4,w/4]){box(xx,.68,-.60,w*.44,.12,.41,mat('#f3f1e8'),g);box(xx,.56,.76,w*.43,.13,.45,mat('#a7ad98'),g)}for(const xx of [-w/2-.28,w/2+.28]){box(xx,.3,-.69,.44,.59,.43,oakM,g);cyl(xx,.65,-.69,.08,.10,stoneM,g);cyl(xx,.86,-.69,.15,.28,linenM,g)}}
 function art(x,y,z,w,h,rot=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;target.add(g);box(0,0,0,w,h,.045,oakM,g);box(0,0,.03,w-.05,h-.05,.005,mat('#dedbca'),g);sphere(0,-.05,.04,.23,mat('#9aab95'),g,w,1,.02);box(0,-h*.24,.044,w*.85,h*.15,.003,mat('#839680'),g)}
 function pendant(x,z,y){bar([x,y,z],[x,y-.58,z],.009,darkM);const p=new T.Mesh(new T.ConeGeometry(.25,.23,20,1,true),mat('#dcd6c3',.8,{side:T.DoubleSide}));p.position.set(x,y-.61,z);target.add(p);sphere(x,y-.67,z,.065,new T.MeshStandardMaterial({color:'#fff5d6',emissive:'#fff0ba',emissiveIntensity:.5}));}
 function wc(x,z,y=0,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;target.add(g);box(0,.51,-.17,.40,.65,.19,trimM,g);sphere(0,.36,.13,.27,trimM,g,.80,.85,1.13);const seat=cyl(0,.55,.13,.23,.025,linenM,g);seat.scale.z=1.25;box(0,.2,.03,.29,.35,.39,trimM,g)}
 function basin(x,z,y=0,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;target.add(g);box(0,.43,0,.67,.77,.45,greenM,g);box(0,.84,0,.72,.09,.51,stoneM,g);sphere(0,.89,.02,.20,trimM,g,1.4,.15,.9);bar([0,.89,-.17],[0,1.12,-.17],.015,metalM,g);bar([0,1.12,-.17],[0,1.12,.01],.015,metalM,g);box(0,1.45,-.27,.60,.65,.03,mat('#9db5b2',.1,{metalness:.6}),g)}
 target=furniture[0];rug(1.7,1.85,2.25,2.5);sofa(.73,1.90,1.9,Math.PI/2);sofa(2.15,2.84,1.65,0);cyl(1.90,.40,1.80,.38,.06,oakM);bar([1.9,.02,1.8],[1.9,.39,1.8],.08,darkM);plant(2.84,.3);art(1.72,1.56,3.35,1.0,.72,Math.PI);
 rug(6.31,2.31,2.25,3.1);sofa(7.12,2.04,2.15,-Math.PI/2);sofa(6.21,.69,1.7,Math.PI);table(6.18,2.16,.72,1.07,-.34);box(6.27,.43,2.18,.22,.06,.30,greenM);plant(7.29,5.34);box(7.69,1.07,3.9,.18,1.90,1.12,brickM);box(7.55,.42,3.9,.15,.54,.72,darkM);box(7.50,.96,3.9,.38,.08,1.35,oakM);art(7.58,1.55,4,1.04,.64,-Math.PI/2);
 // Kitchen layout follows the L-shaped run and island shown on plan.
 for(let z=7.5;z<=10.2;z+=.6){box(1.27,.46,z,.61,.90,.58,greenM);box(1.27,.93,z,.64,.06,.6,stoneM);box(1.595,.67,z,.014,.024,.28,metalM)}for(let x=1.88;x<3.51;x+=.6){box(x,.46,10.87,.58,.9,.61,greenM);box(x,.93,10.87,.6,.06,.65,stoneM)}
 box(1.30,1.13,6.77,.65,2.24,.65,greenM);box(1.635,1.3,6.77,.02,1.3,.53,metalM);box(1.26,.973,9.47,.5,.015,.5,darkM);for(const [dx,dz] of [[-.14,-.14],[.14,-.14],[-.14,.14],[.14,.14]])cyl(1.26+dx,.988,9.47+dz,.075,.006,metalM);box(1.25,1.8,9.47,.57,.18,.56,metalM);bar([1.25,1.83,9.47],[1.25,2.28,9.47],.06,metalM);
 sphere(2.25,.961,10.89,.21,metalM,target,1.4,.05,.9);bar([2.25,.96,11.08],[2.25,1.30,11.08],.015,metalM);bar([2.25,1.30,11.08],[2.25,1.30,10.91],.015,metalM);
 box(3.62,.46,7.57,.82,.91,1.60,greenM);box(3.62,.95,7.57,.90,.07,1.7,stoneM);for(let i=0;i<3;i++){cyl(4.35,.72,6.98+i*.56,.20,.06,oakM);for(const [dx,dz] of [[-.12,-.12],[.12,-.12],[-.12,.12],[.12,.12]])bar([4.35+dx,.03,6.98+i*.56+dz],[4.35+dx,.69,6.98+i*.56+dz],.017,darkM)}sphere(3.64,1.08,7.64,.16,mat('#bdb6a3'),target,1,.7,1);pendant(3.60,7.1,2.23);pendant(3.60,8.02,2.23);
 table(5.55,10.0,1.08,1.65);for(const z of [9.45,10.45]){chair(4.80,z,-Math.PI/2);chair(6.30,z,Math.PI/2)}chair(5.55,8.91,Math.PI);chair(5.55,11.06);plant(7.29,10.66);cyl(5.55,.86,10,.12,.18,stoneM);sphere(5.55,1.10,10,.14,greenM);box(7.29,.52,7.22,.35,1.02,1.60,oakM);
 box(.58,.5,5.20,.58,.98,1.10,greenM);box(.58,1.01,5.20,.63,.05,1.13,stoneM);box(.64,.48,3.99,.70,.92,.64,trimM);const washer=cyl(.996,.52,3.99,.22,.04,darkM);washer.rotation.z=Math.PI/2;box(2.22,1.09,5.40,.54,2.14,.68,oakM);basin(3.37,3.76,0,Math.PI);wc(4.03,3.77,0,Math.PI);flatFloor(2.91,5.07,4.34,5.78,.02,stoneM);box(3.63,1.02,5.10,1.35,2.04,.015,glassM);bar([3.08,1.68,5.72],[3.08,1.98,5.72],.015,metalM);bar([3.08,1.98,5.72],[3.30,1.98,5.72],.015,metalM);cyl(3.3,1.97,5.72,.10,.03,metalM);
 target=furniture[1];bed(1.29,1.39,1.48,Math.PI/2,fy);box(3.14,fy+1,.52,.51,2.0,.55,linenM);bed(2.18,7.38,1.6,Math.PI/2,HOUSE.bedFloor);box(5.15,HOUSE.bedFloor+1.1,7.30,.53,2.2,2.35,linenM);plant(5.0,8.36,HOUSE.bedFloor,target,.72);
 function desk(x,z,y=fy,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;target.add(g);box(0,.75,0,1.25,.06,.59,oakM,g);for(const xx of [-.54,.54])box(xx,.38,0,.05,.75,.48,darkM,g);box(0,1.06,-.15,.53,.36,.04,darkM,g);box(0,.9,-.14,.03,.18,.05,darkM,g);box(0,.8,-.12,.31,.025,.16,darkM,g);box(0,.80,.12,.40,.016,.13,mat('#b9bbae'),g);chair(x+Math.sin(rotation)*.57,z+Math.cos(rotation)*.57,rotation+Math.PI,y)}
 desk(7.10,1.11,fy,-Math.PI/2);desk(7.08,4.76,fy,-Math.PI/2);box(5.05,fy+1.05,.85,.28,2.10,1.2,oakM);for(let j=0;j<4;j++){box(5.06,fy+.3+j*.46,.85,.32,.035,1.2,oakM);for(let i=0;i<8;i++)box(5.07,fy+.45+j*.46,.35+i*.12,.23,.27,.07,mat(['#8a967d','#b8b39e','#c5ad91'][i%3]))}plant(7.3,2.36,fy,target,.8);plant(7.32,3.36,fy,target,.8);art(6.48,fy+1.48,2.89,1.1,.70);
 // Bath, en-suite, and the steam-shower space are represented schematically.
 box(1.05,fy+.28,3.13,1.7,.55,.70,trimM);box(1.05,fy+.566,3.13,1.44,.015,.49,waterM);basin(1.47,4.13,fy);wc(.62,3.91,fy,Math.PI/2);flatFloor(.36,4.67,1.12,5.61,fy+.03,stoneM);box(1.14,fy+1.02,5.14,.015,2.04,.94,glassM);bar([.51,fy+1.75,5.67],[.51,fy+2.03,5.67],.017,metalM);bar([.51,fy+2.03,5.67],[.69,fy+2.03,5.67],.017,metalM);basin(2.07,4.74,fy,Math.PI);wc(2.2,5.55,fy);
 // Garden context is a visual assumption, kept deliberately simple.
 target=garden;flatFloor(-35,-30,40,45,-.13,mat('#9ea98e'));flatFloor(-.6,11.54,8.55,14.53,-.015,tileM);flatFloor(3.35,-6.9,4.75,-.14,-.01,stoneM);flatFloor(-1,-7.4,9,-6.9,-.06,mat('#c6c7ba'));flatFloor(-35,-14,40,-7.45,-.07,mat('#bac0b9'));box(-.80,.52,4.5,.12,1.10,20,mat('#77876c'));box(8.90,.52,5.2,.12,1.10,20,mat('#77876c'));
 for(const x of [-.62,8.7])for(let z=-5.6;z<19;z+=2.0){sphere(x,.72,z,.60,mat('#7d8e70'),garden,.75,.8,1.8)}for(const [x,z,s] of [[-3,16,1.5],[12,18,1.8],[-4,3,1.4],[-5,6,.8]]){cyl(x,1.1*s,z,.15*s,2.2*s,oakM);sphere(x,2.7*s,z,1.08*s,mat('#829375'),garden,1,1.18,1);sphere(x+.5*s,2.48*s,z+.4*s,.8*s,mat('#8c9d7f'),garden)}
 plant(3.09,-.18,0,garden,.8);plant(4.98,-.12,0,garden,.8);box(7.50,.57,12.42,.70,1.10,.45,mat('#babeb3'));box(7.5,.57,12.18,.57,.81,.014,darkM);for(let i=0;i<8;i++)box(7.5,.21+i*.1,12.16,.57,.018,.012,metalM);table(2.6,13.13,1.05,.70);chair(2.6,13.82);chair(2.6,12.46,Math.PI);plant(.29,12.03,0,garden,1.2);plant(7.81,14.0,0,garden,1.1);
 // A muted adjoining mass makes the party-wall context readable from outside.
 const neighbour=mat('#d9d7cc');box(11.15,2.5,3,6.1,5,6,neighbour,decor);poly([[8.16,5.08,-.2],[14.3,5.08,-.2],[14.3,7.38,2.85],[8.16,7.38,2.85]],mat('#929b95'),decor);poly([[8.16,5.08,6.17],[8.16,7.38,2.85],[14.3,7.38,2.85],[14.3,5.08,6.17]],mat('#929b95'),decor);for(const x of [9.6,12.1]){window([x,0],[x+1,0],3.46,1.3,{parent:decor});window([x,0],[x+1,0],.8,1.3,{parent:decor})}
 colliders[0].push({a:[4.2,11.51],b:[5.06,11.51],r:.05},{a:[5.84,11.51],b:[6.685,11.51],r:.05});
 woodM.side=T.DoubleSide;
 return {ground,upper,roof,garden,decor,furniture,ceilings,colliders};
}
