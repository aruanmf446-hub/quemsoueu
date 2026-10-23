// Mechas sobre a barba existente: a pele e a anatomia facial não são remodeladas.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {groomedLock} from './groom.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),clamp=THREE.MathUtils.clamp;
export function beardBundle(points,widths,depths,normal,count=5){
 const at=(a,t)=>{const f=t*(a.length-1),i=Math.min(a.length-2,Math.floor(f));return THREE.MathUtils.lerp(a[i],a[i+1],f-i)};
 return groomedLock(points,1,1,{rows:48,segments:32,grooves:Math.min(4,count),normal:(t,p)=>normal(Math.round(t*(points.length-1)),p),profile:t=>[Math.max(.0004,at(widths,t)),Math.max(.0003,at(depths,t)*.85)]});
}

export function beardSurface(P,skin,mask,mouth){
 const p=skin.geometry.attributes.position,n=skin.geometry.attributes.normal,N=skin.userData.vinfo.N,full=!!P.beardVol;
 if(full){
  const remap=new Map(),pos=[],uv=[],colors=[],ix=[],sourceIds=[],source=skin.geometry.index.array;
  const selected=i=>{const x=p.getX(i),y=p.getY(i),z=p.getZ(i);return i<N&&z>.1&&Math.abs(x)<.8&&y<P.eyeY-.23&&mask(x,y,z)>.58};
  for(let i=0;i<source.length;i+=3){const ids=[source[i],source[i+1],source[i+2]];if(!ids.every(selected))continue;
   for(const k of ids){if(!remap.has(k)){
    const x=p.getX(k),y=p.getY(k),z=p.getZ(k),u=(Math.atan2(x,z-P.cran[1])/Math.PI+.5)*2+.035*Math.sin(y*2),v=-y*.65;
    const offset=.0025+.0013*Math.cos(u*Math.PI*64),q=V(x,y,z).addScaledVector(V().fromBufferAttribute(n,k),offset);
    remap.set(k,pos.length/3);sourceIds.push(k);pos.push(...q.toArray());uv.push(u,v);colors.push(.98,.98,.98);
   }ix.push(remap.get(k))}
  }
  if(!ix.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.computeTangents();g.userData.beardSurface=true;g.userData.faceSources=new Uint32Array(sourceIds);return g;
 }
 const cell=.047,bins=new Map();
 for(let i=0;i<N;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(Math.abs(x)>.75||z<.12||y>P.eyeY-.24||y<P.loft.y[0]-.12||n.getZ(i)<.2)continue;
  const ym=mouth.ym(x),lip=Math.hypot(x/(mouth.mw*1.18),(y-ym)/(.13+P.lipL));if(lip<1.15)continue;
  const line=P.mouthY+.02+(P.eyeY-.24-P.mouthY-.02)*THREE.MathUtils.smoothstep(Math.abs(x),.2,.62);if(y>line-.015)continue;
  const row=Math.floor(y/cell),col=Math.floor(x/cell+(row%2)*.5),key=col+':'+row;if(!bins.has(key))bins.set(key,i);
 }
 const gs=[];
 for(const i of bins.values()){
  const a=V().fromBufferAttribute(p,i),out=V().fromBufferAttribute(n,i),seed=.5+.5*Math.sin(a.x*137+a.y*93),len=.009+.004*seed,dir=V(-Math.sign(a.x)*.20,-1,.04).normalize();
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
