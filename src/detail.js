// Acabamentos procedurais compartilhados: volumes fechados, contornos curvos e materiais exportáveis.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {clothSurface} from './fabric.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;
export function tuft(a,b,width=.14,thickness=.055,bend=.12){
  const d=b.clone().sub(a),axis=d.clone().normalize(),u=V(0,0,1).cross(axis).normalize();if(u.lengthSq()<.1)u.set(1,0,0);const v=axis.clone().cross(u),p=[],ix=[],nr=18,nc=12;
  for(let i=0;i<=nr;i++){const t=i/nr,c=a.clone().lerp(b,t).addScaledVector(v,bend*Math.sin(PI*t)),r=Math.max(.002,Math.sin(PI*(.12+.88*t))**.8*(1-.6*t));for(let j=0;j<=nc;j++){const q=c.clone().addScaledVector(u,Math.cos(2*PI*j/nc)*width*r).addScaledVector(v,Math.sin(2*PI*j/nc)*thickness*r);p.push(...q.toArray());if(i<nr&&j<nc){const k=i*(nc+1)+j;ix.push(k,k+1,k+nc+1,k+1,k+nc+2,k+nc+1)}}}
  const root=p.length/3;p.push(...a.toArray(),...b.toArray());for(let j=0;j<nc;j++){ix.push(root,j+1,j,root+1,nr*(nc+1)+j,nr*(nc+1)+j+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();const n=g.attributes.normal;for(let i=0;i<=nr;i++){const j=i*(nc+1),v=V(n.getX(j)+n.getX(j+nc),n.getY(j)+n.getY(j+nc),n.getZ(j)+n.getZ(j+nc)).normalize();n.setXYZ(j,...v.toArray());n.setXYZ(j+nc,...v.toArray())}return g;
}
export function ribbon(points,width=.1,thickness=.025){
  const curve=new THREE.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(64,false);
  return clothSurface(64,6,(t,u)=>{const i=Math.round(t*64);return curve.getPoint(t).addScaledVector(frames.normals[i],(u-.5)*width)},{thickness});
}
export function badge(kind,r=.15,depth=.025){
  const s=new THREE.Shape();
  if(kind==='star'){for(let i=0;i<10;i++){const a=PI/2+i*PI/5,q=i%2?r*.44:r;if(!i)s.moveTo(Math.cos(a)*q,Math.sin(a)*q);else s.lineTo(Math.cos(a)*q,Math.sin(a)*q)}}
  else if(kind==='flame'){s.moveTo(0,-r);s.bezierCurveTo(-r*1.1,-r*.25,-r*.52,r*.1,-r*.3,r*.43);s.quadraticCurveTo(-r*.28,-r*.02,0,r);s.quadraticCurveTo(r*.12,r*.2,r*.5,r*.35);s.bezierCurveTo(r*.45,-r*.05,r*.95,-r*.55,0,-r)}
  else {s.moveTo(-r,-r*.7);s.lineTo(r,-r*.7);s.lineTo(r*.8,r*.7);s.quadraticCurveTo(0,r,-r*.8,r*.7)}
  s.closePath();return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:depth*.3,bevelThickness:depth*.3,bevelSegments:3,curveSegments:24});
}
export function panel(w,h,depth=.04){return new RoundedBoxGeometry(w,h,depth,4,Math.min(w,h,depth)*.28)}
export function buckleGeo(w=.2,h=.14,t=.022){
  const shape=new THREE.Shape(),rr=(s,x,y,a,b)=>{s.moveTo(x+a*.15,y);s.lineTo(x+a*.85,y);s.quadraticCurveTo(x+a,y,x+a,y+b*.15);s.lineTo(x+a,y+b*.85);s.quadraticCurveTo(x+a,y+b,x+a*.85,y+b);s.lineTo(x+a*.15,y+b);s.quadraticCurveTo(x,y+b,x,y+b*.85);s.lineTo(x,y+b*.15);s.quadraticCurveTo(x,y,x+a*.15,y)};
  rr(shape,-w/2,-h/2,w,h);const hole=new THREE.Path();rr(hole,-w/2+t,-h/2+t,w-2*t,h-2*t);shape.holes.push(hole);return new THREE.ExtrudeGeometry(shape,{depth:t*.65,bevelEnabled:true,bevelSize:t*.2,bevelThickness:t*.2,bevelSegments:3,curveSegments:8});
}
export function gear(r=.13,depth=.035){
  const shape=new THREE.Shape();for(let i=0;i<48;i++){const a=i/48*2*PI,q=i%4<2?r:r*.82;if(!i)shape.moveTo(Math.cos(a)*q,Math.sin(a)*q);else shape.lineTo(Math.cos(a)*q,Math.sin(a)*q)}shape.closePath();const hole=new THREE.Path();hole.absarc(0,0,r*.42,0,2*PI,false);shape.holes.push(hole);return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2});
}
export function finishMaterial(mat,kind='fabric'){
  if(kind==='metal'){mat.metalness=.78;mat.roughness=.38;mat.clearcoat=.16;mat.clearcoatRoughness=.4}
  else if(kind==='leather'){mat.roughness=.66;mat.sheen=.12;mat.clearcoat=.12;mat.clearcoatRoughness=.65}
  else{mat.roughness=.91;mat.sheen=.55;mat.sheenRoughness=.85;mat.clearcoat=0}
  return mat;
}
export function shadeGeometry(g,strength=.06){
  const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=1-strength*(.5+.5*Math.sin(x*43+y*17)*Math.sin(z*37-y*11));c.fill(a,i*3,i*3+3)}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;
}
