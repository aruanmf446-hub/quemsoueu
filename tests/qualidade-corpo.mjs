// Costuras de pelagem, penas e íris: a luz deve atravessar o fechamento sem salto.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {quill,eyeDisc,smoothRingSeams} from '../src/companion-detail.js';

const fixtures=[
 ['pelagem',()=>quill(new THREE.Vector3(.2,.1,0),new THREE.Vector3(.3,.6,.1)),21,12,0],
 ['pena',()=>quill(new THREE.Vector3(-.1,.2,.1),new THREE.Vector3(.1,.9,.3),.18,.025,.08,true),21,12,0],
 ['íris',()=>eyeDisc(.14),16,64,1],
 ['íris achatada',()=>eyeDisc(.18,.25,.22,.08),16,64,1]
];
let compared=0,previousMaxAngle=0;
for(const [name,make,rows,segments,start]of fixtures){
 const g=make(),before=g.clone();before.computeVertexNormals();
 for(let row=0;row<rows;row++){
  const a=start+row*(segments+1),b=a+segments;
  const pa=new THREE.Vector3().fromBufferAttribute(g.attributes.position,a),pb=new THREE.Vector3().fromBufferAttribute(g.attributes.position,b);
  assert(pa.distanceTo(pb)<1e-7,name+': fechamento mudou de posição');
  const na=new THREE.Vector3().fromBufferAttribute(g.attributes.normal,a),nb=new THREE.Vector3().fromBufferAttribute(g.attributes.normal,b);
  assert(na.distanceTo(nb)<1e-7,name+': a costura ainda interrompe a normal');
  previousMaxAngle=Math.max(previousMaxAngle,new THREE.Vector3().fromBufferAttribute(before.attributes.normal,a).angleTo(new THREE.Vector3().fromBufferAttribute(before.attributes.normal,b)));
  compared++;
 }
 // A correção deve afetar apenas as normais, nunca a modelagem, os índices ou as cores.
 const attributes=Object.fromEntries(Object.entries(before.attributes).filter(([key])=>key!=='normal').map(([key,a])=>[key,a.array.slice()]));
 const indices=before.index.array.slice();smoothRingSeams(before,rows,segments,start);
 for(const [key,array]of Object.entries(attributes))assert.deepEqual(before.attributes[key].array,array,name+': atributo alterado '+key);
 assert.deepEqual(before.index.array,indices,name+': topologia alterada');
 for(let i=0;i<g.attributes.normal.count;i++){
  const n=new THREE.Vector3().fromBufferAttribute(g.attributes.normal,i);
  assert(n.toArray().every(Number.isFinite)&&Math.abs(n.length()-1)<1e-6,name+': normal inválida');
 }
 g.dispose();before.dispose();
}
// Confirma que as amostras exercitam uma falha real do cálculo independente, não casos já lisos.
assert(previousMaxAngle>.01,'A amostra não reproduziu a descontinuidade anterior');
console.log(`OK: ${compared} pares de costura contínuos; salto anterior máximo ${(previousMaxAngle*180/Math.PI).toFixed(2)}°; posições, índices e cores preservados.`);
