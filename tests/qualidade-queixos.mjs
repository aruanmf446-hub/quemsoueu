// O refinamento do queixo precisa acrescentar apoio sem mover os traços aprovados.
import assert from 'node:assert/strict';
import {buildHead} from '../src/head.js';
import {PRESETS} from '../src/presets.js';
import {CHIN_IDENTITIES} from '../src/face-identities.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
let sampled=0;
for(const id of Object.keys(CHIN_IDENTITIES)){
 const now=buildHead(id,{}, {quality:.35}),shape=PRESETS[id].chinShape;
 delete PRESETS[id].chinShape;
 const mandible=PRESETS[id].mandible,jawChinY=PRESETS[id].jawChinY;
 if(mandible){PRESETS[id].chinShape=shape;delete PRESETS[id].mandible;delete PRESETS[id].jawChinY}
 let previous;
 try{previous=buildHead(id,{}, {quality:.35})}finally{PRESETS[id].chinShape=shape;if(mandible){PRESETS[id].mandible=mandible;PRESETS[id].jawChinY=jawChinY}}
 try{
  const p=now.params,bottom=p.loft.y[0],lowerLip=p.mouthY-p.lipL;
  const center=bottom+(lowerLip-bottom)*.46;
  const delta=now.fit.surfZ(0,center)-previous.fit.surfZ(0,center);
  let extension=0;
  if(mandible){
   const chinFloor=h=>{const a=h.group.getObjectByName('Head_Skin').geometry.attributes.position;let y=Infinity;for(let i=0;i<a.count;i++)if(Math.abs(a.getX(i))<.16&&a.getZ(i)>.48)y=Math.min(y,a.getY(i));return y};
   extension=chinFloor(previous)-chinFloor(now);
   assert(extension>mandible.extension*.6,id+': a silhueta inferior não ganhou altura de queixo');
   assert(now.fit.sdf(0,mandible.bottom+.12,mandible.front-.08)<0,id+': o volume mandibular está ausente');
  }else assert(delta>.025&&delta<.14,id+': projeção insuficiente ou excessiva no apoio do queixo');
  // Nariz, lábios, olhos e arcada permanecem acima da união mandibular.
  for(const y of [p.eyeY,p.eyeY+.15,p.noseTipY,p.mouthY,p.mouthY-p.lipL*.55,lowerLip-.015])
   for(const x of [0,.08,.2,.35,-.2]){
    assert(Math.abs(now.fit.surfZ(x,y)-previous.fit.surfZ(x,y))<1e-10,id+': o queixo alterou um traço acima dele');sampled++;
   }
  // Entrada/saída do volume com tangentes contínuas, sem degrau na pele.
  for(const y of mandible?[mandible.join,mandible.join+.02]:[lowerLip-.015,lowerLip-.17,bottom-.03,bottom+.08]){
   const displacement=y=>now.fit.surfZ(0,y)-previous.fit.surfZ(0,y);
   const e=1e-4,z=displacement(y),a=(displacement(y+e)-z)/e,b=(z-displacement(y-e))/e;
   assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.15,id+': quebra de tangente na transição do queixo');
  }
  assert.equal(now.rig.makeClips().length,12,id+': clipes faciais perdidos');
  console.log(id,JSON.stringify({projecaoAcrescentada:delta,extensaoDaSilhueta:extension}));
 }finally{now.dispose();previous.dispose()}
}
console.log(JSON.stringify({personagens:Object.keys(CHIN_IDENTITIES).length,amostrasPreservadas:sampled}));
