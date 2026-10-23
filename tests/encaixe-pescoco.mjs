// A calota do corpo deve ficar dentro do pescoço da cabeça, sem aflorar em U.
// A referência opcional usa o corpo antigo sobre a mesma anatomia atual.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const previous=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/body.js'))):null;
function inspect(build,h,id){
 const hs=headScale(id),b=build(h.fit,id,{cell:.045,headScale:hs}),p=b.geo.attributes.position,[nr,,,nby,nbz]=h.params.neck;let count=0,worst=-Infinity;
 try{
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(y<nby+.17*hs||Math.hypot(x*1.14,z-nbz)>nr*hs*1.25)continue;
   const distance=h.fit.sdf(x/hs,nby+(y-nby)/hs,nbz+(z-nbz)/hs);
   assert(Number.isFinite(distance));worst=Math.max(worst,distance);count++;
  }
  assert(count>100,id+': a sobreposição dos pescoços não foi exercitada');
  let cap;
  if(build===buildBody){
   const g=h.group.getObjectByName('Head_Skin').geometry,skin=g.attributes.position,normal=g.attributes.normal;let capCount=0,capWorst=-Infinity;
   for(let i=0;i<skin.count;i++)if(skin.getY(i)<nby-.02&&normal.getY(i)<-.2){
    const x=skin.getX(i)*hs,y=nby+(skin.getY(i)-nby)*hs,z=nbz+(skin.getZ(i)-nbz)*hs;
    capWorst=Math.max(capWorst,b.sdf(x,y,z));capCount++;
   }
   assert(capCount>100,id+': tampa interna da cabeça ausente');
   assert(capWorst<-.003,id+': a tampa da cabeça aflora na pele do corpo');cap={vertices:capCount,protrusao:capWorst};
  }
  return{vertices:count,protrusao:worst,tampa:cap};
 }finally{b.geo.dispose()}
}
for(const id of ['nico_inventor','moon_guardian','ruby_sorceress','nana_explorer']){
 const h=buildHead(id,{}, {quality:.35});
 try{
  const now=inspect(buildBody,h,id),old=previous?inspect(previous.buildBody,h,id):null;
  assert(now.protrusao<-.002,id+': a calota do corpo atravessa o pescoço da cabeça');
  if(old)assert(old.protrusao>.02,id+': a referência não reproduziu a emenda');
  for(const side of ['L','R'])assert.equal(h.group.getObjectByName('Eye_'+side).getObjectByName('Iris').material.map.userData.pupilFraction,h.params.irisPupil,id+': pupila não acompanha a identidade');
  console.log(id,JSON.stringify({atual:now,anterior:old}));
 }finally{h.dispose()}
}
