// Um corte binário na máscara dos morphs dobrava fileiras no nariz volumoso.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const head=buildHead('dwarf_bard',{}, {quality:1});
try{
 head.rig.apply({smile:1,mouthWide:.2});
 const mesh=head.group.getObjectByName('Head_Skin'),g=mesh.geometry,p=g.attributes.position,ix=g.index.array,deformed=new Float64Array(p.array);
 for(let k=0;k<g.morphAttributes.position.length;k++){
  const w=mesh.morphTargetInfluences[k];if(!w)continue;
  const delta=g.morphAttributes.position[k].array;for(let i=0;i<deformed.length;i++)deformed[i]+=w*delta[i];
 }
 assert(deformed.every(Number.isFinite),'Sorriso gerou coordenadas inválidas');
 const cross=(array,a,b,c)=>{
  const A=new THREE.Vector3().fromArray(array,a*3),B=new THREE.Vector3().fromArray(array,b*3),C=new THREE.Vector3().fromArray(array,c*3);
  return B.sub(A).cross(C.sub(A));
 };
 let tested=0;
 for(let i=0;i<ix.length;i+=3){
  const a=ix[i],b=ix[i+1],c=ix[i+2],x=(p.getX(a)+p.getX(b)+p.getX(c))/3,y=(p.getY(a)+p.getY(b)+p.getY(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;
  if(Math.abs(x)>head.params.tipR*head.params.noseW*1.65||y<head.params.noseTipY-.12||y>head.params.noseTipY+.10||z<head.fit.surfZ(x,y)-.05)continue;
  const before=cross(p.array,a,b,c);if(before.length()<1e-9)continue;
  assert(before.dot(cross(deformed,a,b,c))>0,'O sorriso dobrou a malha do nariz');tested++;
 }
 assert(tested>100,'Região nasal não foi exercitada');
 console.log('Sorriso sem dobras na região nasal:',tested,'triângulos');
}finally{head.dispose()}

// Pimenta: a normal quase vertical da parede interna do lábio não pode prender
// fileiras enquanto o contorno ao lado acompanha o beijo ou a expressão triste.
const chili=buildHead('chili_bandit',{}, {quality:1});
try{
 const mesh=chili.group.getObjectByName('Head_Skin'),g=mesh.geometry,p=g.attributes.position,ix=g.index.array;
 for(const [name,pose]of Object.entries({feliz:{smile:1,mouthWide:.2},beijo:{pucker:1},triste:{smile:-1,press:.35}})){
  chili.rig.apply(pose);const deformed=new Float64Array(p.array);
  for(let k=0;k<g.morphAttributes.position.length;k++){
   const w=mesh.morphTargetInfluences[k];if(!w)continue;
   const delta=g.morphAttributes.position[k].array;for(let i=0;i<deformed.length;i++)deformed[i]+=w*delta[i];
  }
  let tested=0,moved=0;
  for(let i=0;i<ix.length;i+=3){
   const [a,b,c]=[ix[i],ix[i+1],ix[i+2]],x=(p.getX(a)+p.getX(b)+p.getX(c))/3,y=(p.getY(a)+p.getY(b)+p.getY(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;
   if(Math.abs(x)>.4||y<chili.params.mouthY-.32||y>chili.params.mouthY+.2||z<chili.fit.surfZ(x,y)-.15)continue;
   const area=arr=>(arr[b*3]-arr[a*3])*(arr[c*3+1]-arr[a*3+1])-(arr[b*3+1]-arr[a*3+1])*(arr[c*3]-arr[a*3]);
   const [A,B,C]=[a,b,c].map(i=>new THREE.Vector3().fromBufferAttribute(p,i)),normal=B.sub(A).cross(C.sub(A));
   // Paredes quase de perfil podem girar naturalmente para trás do contorno.
   if(normal.z<1e-9||normal.z/normal.length()<.15)continue;
   // A orientação no plano da face detecta inversão; comparar apenas normais
   // confundiria a rotação natural da superfície dos lábios com uma dobra.
   assert(area(deformed)>0,name+': a parede do lábio da pimenta virou do avesso');tested++;
   if(Math.hypot(deformed[a*3]-p.getX(a),deformed[a*3+1]-p.getY(a))>.01)moved++;
  }
  assert(tested>1000&&moved>100,'A expressão não exercitou a boca da pimenta');
  console.log('Pimenta/'+name+':',tested,'triângulos sem inversões;',moved,'em movimento');
 }
 assert.equal(chili.rig.makeClips().length,12);
}finally{chili.dispose()}
