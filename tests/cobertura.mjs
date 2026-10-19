// Consulta a malha real: cada vértice coberto deve encontrar tecido à frente da pele.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildClothes,defaultClothes,OUTFITS} from '../src/clothes.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const V=()=>new THREE.Vector3();
// Árvore espacial usada somente nos testes; não acrescenta dependências ao aplicativo.
function tree(g){
 const p=g.attributes.position,ix=g.index?.array,tri=[];
 for(let i=0;i<(ix?.length||p.count);i+=3){const v=[0,1,2].map(k=>V().fromBufferAttribute(p,ix?ix[i+k]:i+k));const box=new THREE.Box3().setFromPoints(v);tri.push({v,box,c:box.getCenter(V())})}
 function branch(items){const box=new THREE.Box3();items.forEach(t=>box.union(t.box));if(items.length<16)return{box,items};const size=box.getSize(V()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';items.sort((a,b)=>a.c[axis]-b.c[axis]);const mid=items.length>>1;return{box,left:branch(items.slice(0,mid)),right:branch(items.slice(mid))}}
 return branch(tri);
}
function first(root,ray){let best=Infinity,orientation=0;const hit=V(),ab=V(),ac=V();
 function visit(n){if(!ray.intersectBox(n.box,hit))return;if(n.items){for(const t of n.items){if(ray.intersectTriangle(...t.v,false,hit)){const d=hit.distanceTo(ray.origin);if(d<best){best=d;orientation=ab.subVectors(t.v[1],t.v[0]).cross(ac.subVectors(t.v[2],t.v[0])).dot(ray.direction)}}}}else{visit(n.left);visit(n.right)}}visit(root);return{distance:best,orientation};}
const ids=process.env.ATELIE_PERSONAGENS?.split(',')||['cute_round','cactus_cowboy','chili_bandit','masculine_soft','sad_clown','dwarf_bard','alchemist_villain'];
for(const id of ids){const h=buildHead(id,{}, {quality:.35}),look=defaultClothes(id),b=buildBody(h.fit,id,{cell:.045,headScale:headScale(id),mermaid:!!OUTFITS[look.outfit]?.mermaid}),c=buildClothes(b,look),meshes=[];
 c.group.updateMatrixWorld(true);c.group.traverse(m=>{if(m.isMesh&&m.parent.name==='RoupaSlot_lower'&&/Calca|Bombacha|Macacao/.test(m.name))meshes.push(tree(m.geometry))});
 assert(meshes.length,`${id}: calça ausente`);
 const p=b.geo.attributes.position,n=b.geo.attributes.normal,J=b.joints;let checked=0,min=Infinity;const misses=[];
 const top=J.Y(id==='sad_clown'?.42:id==='dwarf_bard'?.36:id==='masculine_soft'?.42:.41),bottom=J.ankle.y+(id==='masculine_soft'?.27:id==='dwarf_bard'?.21:id==='sad_clown'?.1:.015)*J.Lb+.04;
 for(let i=0;i<p.count;i++){if(p.getY(i)>top||p.getY(i)<bottom||Math.abs(p.getX(i))>J.W*(b.proportions.hip+.28))continue;
 const origin=V().fromBufferAttribute(p,i),dir=V().fromBufferAttribute(n,i).normalize(),hits=meshes.map(t=>first(t,new THREE.Ray(origin,dir))).filter(h=>Number.isFinite(h.distance)).sort((a,b)=>a.distance-b.distance),hit=hits[0];checked++;
 if(!hit||hit.distance<=.001||hit.orientation<=0)misses.push(i);else min=Math.min(min,hit.distance);
 }


 console.log(id,{vertices:checked,folgaMinima:min,falhas:misses.length});assert.equal(misses.length,0,`${id}: pele sem cobertura nos vértices ${misses.slice(0,12)}`);c.dispose();b.geo.dispose();h.dispose();}
