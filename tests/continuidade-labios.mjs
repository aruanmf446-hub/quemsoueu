// A mesma superfície deve chegar à linha de repouso pelos dois lábios.
// O defeito anterior construía duas alturas diferentes e uma incisão comparável ao volume do lábio.
// Uso opcional: node tests/continuidade-labios.mjs /copia/da/versao/anterior
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {buildHead,mouthCurve} from '../src/head.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const previous=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/head.js'))):null;
function inspect(build,curve,id){
 const h=build(id,{}, {quality:.35});
 try{
  const p=h.params,m=curve(p),epsilon=1e-5;let largest=0;
  for(let i=0;i<25;i++){
   const x=(i/24*2-1)*p.mouthW*.85,y=m.ym(x);
   const upper=h.fit.surfZ(x,y+epsilon),lower=h.fit.surfZ(x,y-epsilon);
   assert(Number.isFinite(upper)&&Number.isFinite(lower),id+': superfície labial inválida');
   largest=Math.max(largest,Math.abs(upper-lower));
  }
  return largest;
 }finally{h.dispose()}
}
let count=0,largest=0,total=0,oldTotal=0;
for(const id of PRESET_ORDER){
 const P=PRESETS[id];if(!P.sculptedFace||P.open)continue;
 const now=inspect(buildHead,mouthCurve,id),before=previous?inspect(previous.buildHead,previous.mouthCurve,id):null;
 assert(now<1e-4,id+': os lábios chegam à linha da boca em alturas diferentes');
 largest=Math.max(largest,now);total+=now;oldTotal+=before||0;count++;
 console.log(id,JSON.stringify({descontinuidade:now,anterior:before}));
}
assert(count>=20,'A continuidade não foi exercitada em todo o catálogo humanoide');
if(previous)assert(total<oldTotal*.1,'A descontinuidade dos lábios não foi reduzida');
console.log(JSON.stringify({personagens:count,maiorDescontinuidade:largest,comparacao:!!previous}));
