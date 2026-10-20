// Limites de folga: roupa não pode esconder a mudança de tipo físico nem formar um aro no cós.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildClothes,outfitColors} from '../src/clothes.js';
import {defaultLook} from '../src/look.js';
import {previewChoice} from '../src/preview-spec.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const builds=[{weight:-1,muscle:0},{weight:0,muscle:0},{weight:1,muscle:0},{weight:0,muscle:1}];
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function section(body,meshes,f,ph){
 const y=body.joints.Y(f),z=body.joints.zCenter,dir=V(Math.sin(ph),0,Math.cos(ph));
 let skin=0;while(skin<5*body.joints.W&&body.sdf(dir.x*skin,y,z+dir.z*skin)<0)skin+=.001;
 const hits=new THREE.Raycaster(V(0,y,z),dir).intersectObjects(meshes,false);assert(hits.length,'Seção coberta sem tecido');
 return {skin,cloth:hits[0].distance,gap:(hits[0].distance-skin)/body.joints.W};
}
for(const [id,outfit,slot,ys]of [['orc_warrior','casual','upper',[.2,.25,.28]],['feminine_soft','mermaid_pearl','lower',[.38,.4,.43]],['feminine_bold','mermaid_ruby','lower',[.38,.4,.43]]]){
 const h=buildHead(id,{},{quality:.35}),radii=[];
 for(const build of builds){
  const look={...defaultLook(id),outfit,clothColors:outfitColors(outfit),build},before=structuredClone(look),p=previewChoice({id,look,spec:{kind:'outfit',value:outfit}});
  assert.deepEqual(p.look.build,build,'Prévia perdeu o tipo físico selecionado');assert.deepEqual(look,before,'Prévia alterou o visual original');
  const b=buildBody(h.fit,id,{headScale:headScale(id),cell:.045,build,mermaid:slot==='lower'}),skin=b.geo.attributes.position.array.slice(),c=buildClothes(b,look),meshes=[];
  c.group.updateMatrixWorld(true);c.group.getObjectByName('RoupaSlot_'+slot).traverse(m=>{if(m.isMesh&&!/Detalhes|Dobra|Nadadeira/.test(m.name))meshes.push(m)});
  let maxGap=0;for(const f of ys)for(const ph of slot==='lower'?[0,Math.PI/2,Math.PI]:[0,Math.PI]){const s=section(b,meshes,f,ph);assert(s.gap>.005,`${id}: tecido atravessou a pele (${s.gap})`);assert(s.gap<.16,`${id}: folga excessiva (${s.gap})`);maxGap=Math.max(maxGap,s.gap)}
  radii.push(section(b,meshes,slot==='lower'?.4:.25,Math.PI/2).cloth);
  const warm=buildClothes(b,look);const start=performance.now();warm.setPiece(slot,outfit+':'+slot);assert(performance.now()-start<500,'Troca em cache acima de 500 ms');warm.dispose();
  c.setPieceColors(slot,{fabric:'#246366'});assert(skin.every((v,i)=>v===b.geo.attributes.position.array[i]),'Roupa modificou a malha do corpo');
  console.log(id,build,'folga máxima / W:',maxGap.toFixed(4));c.dispose();b.geo.dispose();
 }
 assert(radii[0]<radii[1]&&radii[1]<radii[2],`${id}: roupa não acompanhou magro → padrão → gordo`);h.dispose();
}
console.log('OK: folga limitada, cobertura nas seções, prévias, tipos físicos, cores e cache.');
