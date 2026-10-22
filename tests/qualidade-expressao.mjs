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
  if(Math.abs(x)>.40||y<-.48||y>-.28||z<.90)continue;
  const before=cross(p.array,a,b,c);if(before.length()<1e-9)continue;
  assert(before.dot(cross(deformed,a,b,c))>0,'O sorriso dobrou a malha do nariz');tested++;
 }
 assert(tested>100,'Região nasal não foi exercitada');
 console.log('Sorriso sem dobras na região nasal:',tested,'triângulos');
}finally{head.dispose()}
