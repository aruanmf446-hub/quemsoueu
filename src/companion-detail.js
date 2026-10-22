// Pelagem e plumagem procedurais dos novos companheiros; cada mecha é um volume fechado.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI;
export function quill(a,b,width=.12,depth=.035,bend=.05,feather=false){
 width*=feather?1:.63;depth*=feather?.52:.56;
 const d=b.clone().sub(a),axis=d.clone().normalize(),normal=V(0,0,1),u=normal.clone().cross(axis).normalize();if(u.lengthSq()<.1)u.set(1,0,0);const v=axis.clone().cross(u).normalize(),rows=20,cols=12,p=[],ix=[],colors=[];
 for(let i=0;i<=rows;i++){const t=i/rows,c=a.clone().lerp(b,t).addScaledVector(v,bend*Math.sin(t*PI)),w=Math.max(.001,width*Math.sin(PI*(.12+.88*t))**(feather?.7:.9)*(1-.44*t));for(let j=0;j<=cols;j++){const ph=j/cols*2*PI,ridge=1+.13*Math.cos(ph*2),q=c.clone().addScaledVector(u,w*Math.cos(ph)).addScaledVector(v,depth*Math.sin(ph)*Math.sin(PI*(.10+.90*t))*ridge);p.push(q.x,q.y,q.z);const shade=.92+.065*Math.sin(ph)*Math.sin(ph)+.025*Math.sin(ph)**12+(feather?.009*Math.sin(t*135+ph*5):.018*Math.sin(t*85+ph*3));colors.push(shade,shade,shade);if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1)}}}
 const k=p.length/3;p.push(...a.toArray(),...b.toArray());colors.push(.8,.8,.8,.75,.75,.75);for(let j=0;j<cols;j++)ix.push(k,j+1,j,k+1,rows*(cols+1)+j,rows*(cols+1)+j+1);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function mergeVolumes(gs){
 const normalized=gs.map(g=>{const c=g.clone();for(const key of Object.keys(c.attributes))if(!['position','normal','color'].includes(key))c.deleteAttribute(key);if(!c.attributes.color){const cs=new Float32Array(c.attributes.position.count*3);cs.fill(1);c.setAttribute('color',new THREE.BufferAttribute(cs,3))}return c.index?c.toNonIndexed():c});const merged=mergeGeometries(normalized,false);normalized.forEach(g=>g.dispose());gs.forEach(g=>g.dispose());return merged;
}
export function grain(g,strength=.09){const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1-strength*(.42+.24*Math.sin(x*71+y*53)*Math.cos(z*67-y*13)+.18*Math.sin(x*163+y*89-z*29));c.fill(n,i*3,i*3+3)}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
export function petalPlate(w=.25,h=.4,d=.045){const shape=new THREE.Shape();shape.moveTo(0,-h*.5);shape.bezierCurveTo(-w*.55,-h*.28,-w*.59,h*.12,-w*.28,h*.4);shape.quadraticCurveTo(0,h*.56,w*.28,h*.4);shape.bezierCurveTo(w*.59,h*.12,w*.55,-h*.28,0,-h*.5);return new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,bevelSize:d*.3,bevelThickness:d*.3,curveSegments:20})}

// Disco da íris sobre a curvatura da esclera: sem anéis saltados ou olhos de vidro presos por fora.
export function eyeDisc(radius,rx=.23,ry=.21,depth=.14,lift=.003){
 const p=[0,0,depth+lift],ix=[],segments=64,rings=16;for(let i=1;i<=rings;i++)for(let j=0;j<=segments;j++){const t=i/rings,a=j/segments*2*Math.PI,x=Math.cos(a)*radius*t,y=Math.sin(a)*radius*t;p.push(x,y,depth*Math.sqrt(Math.max(0,1-(x/rx)**2-(y/ry)**2))+lift)}
 for(let j=0;j<segments;j++)ix.push(0,1+j,2+j);for(let i=1;i<rings;i++)for(let j=0;j<segments;j++){const k=1+(i-1)*(segments+1)+j;ix.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
