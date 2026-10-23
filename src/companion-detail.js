// Pelagem e plumagem procedurais dos novos companheiros; cada mecha é um volume fechado.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;
// Anéis duplicam a primeira posição para fechar a parametrização. As duas cópias
// recebem a mesma soma de áreas incidentes, evitando uma linha de luz na costura.
// Não altera posições, cores, índices nem as normais fora da própria costura.
export function smoothRingSeams(g,rows,segments,start=0){
 const p=g.attributes.position,n=g.attributes.normal,ix=g.index?.array;
 if(!n||!ix)return g;
 const seam=new Map(),sums=Array.from({length:rows},()=>V());
 for(let row=0;row<rows;row++){const a=start+row*(segments+1),b=a+segments;seam.set(a,row);seam.set(b,row)}
 const a=V(),b=V(),c=V(),ab=V(),ac=V(),face=V();
 for(let i=0;i<ix.length;i+=3){
  const tri=[ix[i],ix[i+1],ix[i+2]];if(!tri.some(k=>seam.has(k)))continue;
  a.fromBufferAttribute(p,tri[0]);b.fromBufferAttribute(p,tri[1]);c.fromBufferAttribute(p,tri[2]);
  face.crossVectors(ab.subVectors(b,a),ac.subVectors(c,a));
  for(const k of tri)if(seam.has(k))sums[seam.get(k)].add(face);
 }
 for(let row=0;row<rows;row++){
  const a=start+row*(segments+1),b=a+segments,s=sums[row];
  if(s.lengthSq()<1e-20)s.fromBufferAttribute(n,a).add(V().fromBufferAttribute(n,b));
  if(s.lengthSq()<1e-20)continue;s.normalize();n.setXYZ(a,s.x,s.y,s.z);n.setXYZ(b,s.x,s.y,s.z);
 }
 n.needsUpdate=true;return g;
}
export function quill(a,b,width=.12,depth=.035,bend=.05,feather=false,surfaceNormal=null){
 // A mecha cresce sobre a superfície: raiz larga embutida, seção convexa e
 // afilamento gradual. O referencial acompanha a face/corpo, em vez de todos
 // os tufos apontarem sua face larga para o mesmo eixo global.
 const axis=b.clone().sub(a).normalize(),out=surfaceNormal?.clone()||V(a.x*.85,.08,a.z+.06);
 out.addScaledVector(axis,-out.dot(axis));if(out.lengthSq()<1e-6)out.copy(Math.abs(axis.z)<.8?V(0,0,1):V(1,0,0)).addScaledVector(axis,-out.dot(axis));out.normalize();
 const across=axis.clone().cross(out).normalize();out.crossVectors(across,axis).normalize();
 const rows=28,cols=20,p=[],ix=[],colors=[],uv=[],smooth=(lo,hi,t)=>THREE.MathUtils.smoothstep(t,lo,hi);
 for(let i=0;i<=rows;i++){
  const t=i/rows,root=.78+.22*smooth(0,.16,t),tip=1-smooth(feather?.48:.40,1,t),w=Math.max(.00022,width*(feather?.82:.88)*root*(1-.23*t)*tip**.78),h=Math.max(.00018,depth*(feather?.48:.64)*(1-.35*t)*tip**.88);
  const c=a.clone().lerp(b,t).addScaledVector(out,bend*Math.sin(PI*t)-.003*(1-t));
  for(let j=0;j<=cols;j++){
   const ph=j/cols*2*PI,cs=Math.cos(ph),sn=Math.sin(ph),flute=1-(feather?.035:.075)*(.5+.5*Math.cos((cs*.5+.5)*PI*6+.22*t)),depthProfile=sn>=0?Math.pow(sn,.70)*flute:sn*.38;
   const q=c.clone().addScaledVector(across,w*cs).addScaledVector(out,h*depthProfile);p.push(...q.toArray());uv.push(j/cols,t);
   const tone=.955+.035*Math.max(0,sn)+.008*Math.cos(ph*3+.4*t);colors.push(tone,tone,tone);
   if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2)}
  }
 }
 for(const end of [0,rows]){
  const center=p.length/3,mid=(end?b:a).clone().addScaledVector(out,end?0:-.003);p.push(...mid.toArray());colors.push(.94,.94,.94);uv.push(.5,.5);
  for(let j=0;j<cols;j++){const k=(end*(cols+1)+j)*3;p.push(p[k],p[k+1],p[k+2]);colors.push(.94,.94,.94);uv.push(.5+.5*Math.cos(j/cols*2*PI),.5+.5*Math.sin(j/cols*2*PI))}
  for(let j=0;j<cols;j++){const aa=center+1+j,bb=center+1+(j+1)%cols;ix.push(center,...(end?[bb,aa]:[aa,bb]))}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.groom=feather?'feather':'fur';return smoothRingSeams(g,rows+1,cols);
}
export function mergeVolumes(gs){
 const normalized=gs.map(g=>{const c=g.clone();for(const key of Object.keys(c.attributes))if(!['position','normal','color','uv'].includes(key))c.deleteAttribute(key);if(!c.attributes.color){const cs=new Float32Array(c.attributes.position.count*3);cs.fill(1);c.setAttribute('color',new THREE.BufferAttribute(cs,3))}if(!c.attributes.uv)c.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(c.attributes.position.count*2),2));if(!c.index)c.setIndex(Array.from({length:c.attributes.position.count},(_,i)=>i));return c});const merged=mergeGeometries(normalized,false);if(gs.every(g=>g.userData.groom))merged.userData.groom=gs[0]?.userData.groom;if(gs.every(g=>Number.isFinite(g.userData.rootSurfaceMax)))merged.userData.rootSurfaceMax=Math.max(...gs.map(g=>g.userData.rootSurfaceMax));normalized.forEach(g=>g.dispose());gs.forEach(g=>g.dispose());return merged;
}
export function grain(g,strength=.09){const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1-strength*(.42+.24*Math.sin(x*71+y*53)*Math.cos(z*67-y*13)+.18*Math.sin(x*163+y*89-z*29));c.fill(n,i*3,i*3+3)}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
export function petalPlate(w=.25,h=.4,d=.045){const shape=new THREE.Shape();shape.moveTo(0,-h*.5);shape.bezierCurveTo(-w*.55,-h*.28,-w*.59,h*.12,-w*.28,h*.4);shape.quadraticCurveTo(0,h*.56,w*.28,h*.4);shape.bezierCurveTo(w*.59,h*.12,w*.55,-h*.28,0,-h*.5);return new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,bevelSize:d*.3,bevelThickness:d*.3,curveSegments:20})}

// Disco da íris sobre a curvatura da esclera: sem anéis saltados ou olhos de vidro presos por fora.
export function eyeDisc(radius,rx=.23,ry=.21,depth=.14,lift=.003){
 const p=[0,0,depth+lift],ix=[],segments=64,rings=16;for(let i=1;i<=rings;i++)for(let j=0;j<=segments;j++){const t=i/rings,a=j/segments*2*Math.PI,x=Math.cos(a)*radius*t,y=Math.sin(a)*radius*t;p.push(x,y,depth*Math.sqrt(Math.max(0,1-(x/rx)**2-(y/ry)**2))+lift)}
 for(let j=0;j<segments;j++)ix.push(0,1+j,2+j);for(let i=1;i<rings;i++)for(let j=0;j<segments;j++){const k=1+(i-1)*(segments+1)+j;ix.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return smoothRingSeams(g,rings,segments,1);
}
