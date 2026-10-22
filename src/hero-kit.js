// Modelagem de acabamento: superfícies medidas, bordado em relevo e ferragens com espessura.
import * as THREE from 'three';
import {clothSurface} from './fabric.js';
import {buckleGeo} from './detail.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;
export function shapePlate(C,slot,ch,shape,y,phi,field,o={}){
  const {W,z0,surfAt,addGeoS}=C,depth=o.depth??.025*W;
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:depth*.3,bevelSize:depth*.32,bevelSegments:3,curveSegments:24});
  const p=g.attributes.position,scale=o.scale??1,rotation=o.rotation||0;
  const pc=surfAt(field,y,phi),r=Math.max(.12*W,Math.hypot(pc.x,pc.z-z0));
  for(let i=0;i<p.count;i++){
    const x=(p.getX(i)*Math.cos(rotation)-p.getY(i)*Math.sin(rotation))*scale;
    const yy=(p.getY(i)*Math.cos(rotation)+p.getX(i)*Math.sin(rotation))*scale;
    const q=surfAt(field,y+yy,phi+x/r,(o.off??.03*W)+p.getZ(i));p.setXYZ(i,q.x,q.y,q.z);
  }
  g.computeVertexNormals();addGeoS(slot,ch,g);return g;
}
export function stitchLine(C,slot,field,coords,o={}){
  const {W,surfAt,addGeoS,tubeG}=C;
  const points=coords.map(([y,a])=>surfAt(field,y,a,o.off??.035*W));
  const curve=new THREE.CatmullRomCurve3(points),n=Math.min(120,Math.max(3,Math.round(curve.getLength()/(.055*W))));
  for(let i=0;i<n;i++)addGeoS(slot,o.channel||'secondary',tubeG([curve.getPoint(i/n),curve.getPoint((i+.57)/n)],o.r??.0045*W,5));
}
export function strap(C,slot,ch,field,coords,width=.09,off=.045){
  const {W,z0,surfAt,addGeoS}=C,curve=new THREE.CatmullRomCurve3(coords.map(([y,a])=>V(a,y,0)));
  const point=(t,u)=>{const q=curve.getPoint(t),p=surfAt(field,q.y,q.x),r=Math.max(.15*W,Math.hypot(p.x,p.z-z0));return surfAt(field,q.y,q.x+(u-.5)*width*W/r,off*W)};
  addGeoS(slot,ch,clothSurface(72,8,point,{thickness:.018*W}));
  for(const u of [.1,.9]){
    const pts=Array.from({length:49},(_,i)=>point(i/48,u));addGeoS(slot,'lining',C.tubeG(pts,.004*W,5));
  }
  return point;
}
export function fastener(C,slot,field,y,phi,w=.16,h=.13,off=.09){
  const p=C.surfAt(field,y,phi,off*C.W),n=V(Math.sin(phi),0,Math.cos(phi));
  C.addGeoS(slot,'trim',C.orient(buckleGeo(w*C.W,h*C.W,.018*C.W),p,n));
  C.addGeoS(slot,'trim',C.tubeG([p.clone().add(V(-w*.35*C.W,0,0)),p.clone().add(V(w*.4*C.W,0,.009*C.W))],.008*C.W,6));
}
export function tassel(C,slot,p,size=.22){
  const {W,addGeoS,tubeG,sph}=C,r=size*W;
  addGeoS(slot,'trim',sph(p.clone(),r*.2,1,.65,1,20,12));
  for(let j=0;j<14;j++){
    const a=j/14*2*PI,d=V(Math.cos(a)*r*.18,0,Math.sin(a)*r*.18),q=p.clone().add(d);
    addGeoS(slot,'trim',tubeG([q,q.clone().add(V(d.x*.7,-r*.45,d.z*.7)),q.clone().add(V(d.x,-r,d.z))],r*.033,5));
  }
}
export function fringe(C,slot,point,n=38,length=.10){
  const {W,addGeoS,tubeG}=C;
  for(let j=0;j<n;j++){
    const p=point((j+.5)/n),l=length*W*(.85+.15*Math.sin(j*2.4));
    addGeoS(slot,'trim',tubeG([p,p.clone().add(V(.008*W,-l*.5,.004*W)),p.clone().add(V(.013*W,-l,.009*W))],.006*W,5));
  }
}
export function filigree(C,slot,field,y,phi,size=.18,off=.065){
  const {W,surfAt,addGeoS,tubeG}=C,pc=surfAt(field,y,phi),r=Math.max(.2*W,Math.hypot(pc.x,pc.z-C.z0));
  for(const side of [-1,1]){
    const pts=[];for(let i=0;i<=30;i++){const t=i/30,a=t*PI*2.1,rr=size*W*(1-t*.75);pts.push(surfAt(field,y+Math.sin(a)*rr,phi+side*(.05*W+Math.cos(a)*rr)/r,off*W))}
    addGeoS(slot,'trim',tubeG(pts,.0065*W,6));
  }
}
export function shieldOutline(w,h){
  const s=new THREE.Shape();s.moveTo(0,h*.52);s.quadraticCurveTo(w*.2,h*.5,w*.51,h*.3);s.lineTo(w*.45,-h*.25);s.quadraticCurveTo(w*.22,-h*.46,0,-h*.57);s.quadraticCurveTo(-w*.22,-h*.46,-w*.45,-h*.25);s.lineTo(-w*.51,h*.3);s.quadraticCurveTo(-w*.2,h*.5,0,h*.52);return s;
}
export function curvedPlate(C,slot,field,y,phi,w,h,ch='enamel',o={}){
  const s=shieldOutline(w*C.W,h*C.W);
  shapePlate(C,slot,'trim',s,y,phi,field,{off:o.off??.045*C.W,depth:.028*C.W});
  shapePlate(C,slot,ch,s,y,phi,field,{off:(o.off??.045*C.W)+.033*C.W,depth:.024*C.W,scale:.89});
}
