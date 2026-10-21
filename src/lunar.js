// Símbolos e volumes compartilhados pelos personagens do Reino da Lua. Sem texturas externas.
import * as THREE from 'three';
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export function crescent(r=.2,depth=.025){
  // Contorno único, sem duas esferas sobrepostas: o recorte da lua é um vão real.
  const shape=new THREE.Shape(),angle=.92,offset=.48*r;
  const top=V(Math.cos(angle)*r,Math.sin(angle)*r),ia=Math.atan2(top.y,top.x-offset);
  shape.moveTo(top.x,top.y);
  for(let i=1;i<=48;i++){const a=angle+(Math.PI*2-2*angle)*i/48;shape.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
  for(let i=1;i<=40;i++){const a=-ia-(Math.PI*2-2*ia)*i/40;shape.lineTo(offset+Math.cos(a)*Math.hypot(top.x-offset,top.y),Math.sin(a)*Math.hypot(top.x-offset,top.y))}
  shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:depth*.25,bevelThickness:depth*.25,curveSegments:24});
}
export function tube(points,r=.025){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(24,points.length*8),r,8,false)}
export function orb(p,r,scale=V(1,1,1)){const g=new THREE.SphereGeometry(r,24,16);g.scale(scale.x,scale.y,scale.z);g.translate(p.x,p.y,p.z);return g}
export function feather(a,b,width=.16){
  const delta=b.clone().sub(a),g=new THREE.SphereGeometry(1,16,12);g.scale(width,delta.length()*.57,width*.3);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),delta.normalize()));g.translate(...a.clone().lerp(b,.5).toArray());return g;
}
export function disposeGroup(group){const geos=new Set(),mats=new Set();group.traverse(m=>{if(m.isMesh){geos.add(m.geometry);for(const mat of [m.material].flat())mats.add(mat)}});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())}
