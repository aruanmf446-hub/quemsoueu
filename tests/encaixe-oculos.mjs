// Regressão: aros cruzados e enterrados no nariz davam a impressão de óculos quebrados.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildAccessories} from '../src/accessories.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,0,-1);
let samples=0;
for(const id of ['nico_inventor','cute_round','moon_guardian','old_king','orc_warrior']){
 const h=buildHead(id,{}, {quality:.35}),a=buildAccessories(h.fit,{face:'glasses'});
 try{
  a.group.updateMatrixWorld(true);const metal=a.group.getObjectByName('Acc_metal'),eyes=h.fit.eyes;
  const separation=Math.abs(eyes[0].x-eyes[1].x),radius=Math.min(eyes[0].R*1.22,separation*.47);
  for(const eye of eyes)for(let j=0;j<24;j++){
   const angle=j/24*Math.PI*2,x=eye.x+radius*Math.cos(angle),y=eye.y-.01+radius*Math.sin(angle);
   ray.set(new THREE.Vector3(x,y,4),direction);const hit=ray.intersectObject(metal,false)[0];
   assert(hit,id+': trecho do aro ausente');assert(hit.point.z>h.fit.surfZ(x,y)+.025,id+': aro enterrado na face');samples++;
  }
 }finally{a.dispose();h.dispose()}
}
console.log(JSON.stringify({personagens:5,amostrasDeEncaixe:samples}));
