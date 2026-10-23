// Mechas sobre a barba existente: a pele e a anatomia facial não são remodeladas.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {groomedLock} from './groom.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
export function beardBundle(points,widths,depths,normal,count=5){
 const at=(a,t)=>{const f=t*(a.length-1),i=Math.min(a.length-2,Math.floor(f));return THREE.MathUtils.lerp(a[i],a[i+1],f-i)};
 const frame=(t,p)=>normal(Math.round(t*(points.length-1)),p),profile=t=>[Math.max(.0004,at(widths,t)*(1-.28*THREE.MathUtils.smoothstep(t,.4,1))),Math.max(.0003,at(depths,t)*.72)];
 const parts=[groomedLock(points,1,1,{rows:48,segments:24,grooveStrength:.075,grooves:Math.min(4,count),normal:frame,profile})],curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
 for(const offset of [-.48,0,.48]){
  const guide=[];for(let i=0;i<=32;i++){const t=.025+i/32*.94,q=curve.getPoint(t),out=frame(t,q).clone().normalize(),side=curve.getTangent(t).cross(out).normalize(),[w,h]=profile(t);guide.push(q.addScaledVector(side,offset*w).addScaledVector(out,h*.88))}
  parts.push(groomedLock(guide,1,1,{rows:40,segments:10,grooveStrength:.04,normal:frame,profile:t=>{const [w,h]=profile(.025+t*.94),taper=Math.sin(t*Math.PI)**.7;return[Math.max(.0003,w*.16*taper),Math.max(.00025,h*.19*taper)]}}));
 }
 const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());return merged;
}

export function beardSurface(P,skin,mask,mouth){
 const p=skin.geometry.attributes.position,n=skin.geometry.attributes.normal,N=skin.userData.vinfo.N,full=!!P.beardVol;
 if(full){
  const remap=new Map(),pos=[],uv=[],colors=[],ix=[],sourceIds=[],source=skin.geometry.index.array;
  const selected=i=>{const x=p.getX(i),y=p.getY(i),z=p.getZ(i);return i<N&&z>.1&&n.getZ(i)>.25&&Math.abs(x)<.8&&y<P.eyeY-.23&&y>P.loft.y[0]+.025&&mask(x,y,z)>.58};
  for(let i=0;i<source.length;i+=3){const ids=[source[i],source[i+1],source[i+2]];if(!ids.every(selected))continue;
   for(const k of ids){if(!remap.has(k)){
    const x=p.getX(k),y=p.getY(k),z=p.getZ(k),u=(Math.atan2(x,z-P.cran[1])/Math.PI+.5)*2+.035*Math.sin(y*2),v=-y*.65;
    const offset=.0025+.0013*Math.cos(u*Math.PI*64),q=V(x,y,z).addScaledVector(V().fromBufferAttribute(n,k),offset);
    remap.set(k,pos.length/3);sourceIds.push(k);pos.push(...q.toArray());uv.push(u,v);colors.push(.98,.98,.98);
   }ix.push(remap.get(k))}
  }
  if(!ix.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.computeTangents();g.userData.faceSources=new Uint32Array(sourceIds);
  // A cobertura preenche a raiz; grupos menores desenham o caimento e a borda livre.
  const pieces=[g],columns=new Map();
  for(const i of sourceIds){const x=p.getX(i),y=p.getY(i);if(Math.abs(x)<mouth.mw*1.12&&y>mouth.ym(x)-P.lipL-.035)continue;const key=Math.floor(x/.037);if(!columns.has(key))columns.set(key,[]);columns.get(key).push(i)}
  let tufts=0;
  for(const [column,indices] of columns){
   indices.sort((a,b)=>p.getY(b)-p.getY(a));
   for(let layer=0;layer<2;layer++){
    const seed=.5+.5*Math.sin(column*2.173+layer*4.32),topY=p.getY(indices[0])-(layer?.07+.06*seed:0),i=indices.reduce((a,b)=>Math.abs(p.getY(a)-topY)<Math.abs(p.getY(b)-topY)?a:b),a=V().fromBufferAttribute(p,i),out=V().fromBufferAttribute(n,i),bottom=P.loft.y[0],chin=1-THREE.MathUtils.smoothstep(Math.abs(a.x),.12,.70),endY=bottom+.10-.24*chin*(P.beardVol.len/.4)-.025*seed,pts=[];
    if(a.y-endY<.09)continue;
    const sample=y=>{let nearest=indices[0],front=-Infinity;for(const j of indices){if(Math.abs(p.getY(j)-y)<Math.abs(p.getY(nearest)-y))nearest=j;if(Math.abs(p.getY(j)-y)<.035&&p.getZ(j)>front){front=p.getZ(j)}}if(front>-Infinity)for(const j of indices)if(Math.abs(p.getY(j)-y)<.035&&p.getZ(j)===front)return j;return nearest};
    const floor=p.getY(indices[indices.length-1]);
    for(let k=0;k<=24;k++){
     const t=k/24,y=THREE.MathUtils.lerp(a.y,endY,t),j=sample(Math.max(y,floor)),z=p.getZ(j)-Math.max(0,floor-y)*.22,q=V(a.x*(1-.06*t),y,z).addScaledVector(out,.003+(.022+layer*.009)*THREE.MathUtils.smoothstep(t,0,.18)+.006*Math.sin(Math.PI*t));
     q.x+=.004*Math.sin(t*Math.PI*2+seed*3)*Math.sin(t*Math.PI);pts.push(q);
    }
    // Suaviza a amostragem do couro: a guia não reproduz degraus dos vértices da pele.
    for(let pass=0;pass<5;pass++){const z=pts.map(q=>q.z);for(let k=1;k<pts.length-1;k++)pts[k].z=(z[k-1]+2*z[k]+z[k+1])/4}
    const width=(.026+seed*.006)*(layer?.78:1),hair=groomedLock(pts,width,width*.45,{rows:40,segments:16,grooveStrength:.075,grooves:3,tone:.96+seed*.06,normal:()=>out,profile:t=>{const envelope=(.12+.88*THREE.MathUtils.smoothstep(t,0,.16))*Math.pow(1-THREE.MathUtils.smoothstep(t,.58+seed*.14,1),.85);return[Math.max(.00035,width*envelope),Math.max(.0003,width*.45*envelope)]}});
    hair.userData.faceSources=new Uint32Array(hair.attributes.position.count);for(let v=0;v<hair.attributes.position.count;v++){const q=V().fromBufferAttribute(hair.attributes.position,v);let nearest=i,best=Infinity;for(const j of indices){const d=(p.getX(j)-q.x)**2+(p.getY(j)-q.y)**2+(p.getZ(j)-q.z)**2;if(d<best){best=d;nearest=j}}hair.userData.faceSources[v]=nearest;}pieces.push(hair);tufts++;
   }
  }
  const merged=mergeGeometries(pieces,false),sources=new Uint32Array(merged.attributes.position.count);let cursor=0;
  for(const piece of pieces){sources.set(piece.userData.faceSources,cursor);cursor+=piece.attributes.position.count;piece.dispose()}
  merged.userData.faceSources=sources;merged.userData.beardTufts=tufts;return merged;
 }
 const cell=.033,bins=new Map();
 for(let i=0;i<N;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(Math.abs(x)>.75||z<.12||y>P.eyeY-.24||y<P.loft.y[0]-.12||n.getZ(i)<.2)continue;
  const ym=mouth.ym(x),lip=Math.hypot(x/(mouth.mw*1.18),(y-ym)/(.13+P.lipL));if(lip<1.15)continue;
  const line=P.mouthY+.02+(P.eyeY-.24-P.mouthY-.02)*THREE.MathUtils.smoothstep(Math.abs(x),.2,.62);if(y>line-.015)continue;
  const row=Math.floor(y/cell),col=Math.floor(x/cell+(row%2)*.5),key=col+':'+row;if(!bins.has(key))bins.set(key,i);
 }
 const gs=[];
 for(const i of bins.values()){
  const a=V().fromBufferAttribute(p,i),out=V().fromBufferAttribute(n,i),seed=.5+.5*Math.sin(a.x*137+a.y*93),len=.008+.007*seed,dir=V(-Math.sign(a.x)*.20,-1,.04).normalize();
  const b=a.clone().addScaledVector(dir,len*.45).addScaledVector(out,.002),end=a.clone().addScaledVector(dir,len).addScaledVector(out,.002);a.addScaledVector(out,-.001);
  const hair=groomedLock([a,b,end],.0015,.0008,{rows:5,segments:8,tip:.55,normal:()=>out});hair.userData.faceSources=new Uint32Array(hair.attributes.position.count).fill(i);gs.push(hair);
 }
 if(!gs.length)return null;const g=mergeGeometries(gs,false),sources=new Uint32Array(g.attributes.position.count);let offset=0;for(const hair of gs){sources.set(hair.userData.faceSources,offset);offset+=hair.attributes.position.count}g.userData.faceSources=sources;gs.forEach(g=>g.dispose());return g;
}

// Copia os deltas e pesos do ponto de origem, mantendo os pelos presos à pele animada.
export function beardAttribute(attribute,sources){
 const values=new attribute.array.constructor(sources.length*attribute.itemSize);for(let i=0;i<sources.length;i++)for(let k=0;k<attribute.itemSize;k++)values[i*attribute.itemSize+k]=attribute.array[sources[i]*attribute.itemSize+k];
 const a=new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized);a.name=attribute.name;return a;
}
