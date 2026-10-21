// Juntas e encaixe não acompanham as mudanças de largura; o volume, sim.
import assert from 'node:assert/strict';
import {buildHead} from '../src/head.js';
import {buildBody,headScale,BODIES,normalizeBuild} from '../src/body.js';
import {defaultClothes,OUTFITS} from '../src/clothes.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
export const BUILDS={magro:{weight:-1,muscle:0},padrao:{weight:0,muscle:0},gordo:{weight:1,muscle:0},musculoso:{weight:0,muscle:1}};
assert.deepEqual(normalizeBuild({weight:20,muscle:-2}),{weight:1,muscle:0});
assert.deepEqual(normalizeBuild({weight:NaN,muscle:Infinity}),BUILDS.padrao);
function volume(g){const p=g.attributes.position,ix=g.index.array;let sum=0;for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2];sum+=p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))+p.getY(a)*(p.getZ(b)*p.getX(c)-p.getX(b)*p.getZ(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c))}return Math.abs(sum/6)}
for(const id of (process.env.ATELIE_PERSONAGENS?.split(',')||Object.keys(BODIES)).filter(id=>BODIES[id])){
 const h=buildHead(id,{}, {quality:.35}),look=defaultClothes(id),opts={cell:.045,headScale:headScale(id),mermaid:!!OUTFITS[look.outfit]?.mermaid},neutral=buildBody(h.fit,id,opts),volumes={};
 for(const [name,build]of Object.entries(BUILDS)){
  const b=buildBody(h.fit,id,{...opts,build});
  assert(b.geo.attributes.position.array.every(Number.isFinite),`${id}/${name}: coordenadas inválidas`);
  for(const joint of ['shoulder','elbow','wrist','hip','knee','ankle'])assert.deepEqual(b.joints[joint].toArray(),neutral.joints[joint].toArray(),`${id}/${name}: junta ${joint} deslocada`);
  for(const key of ['yNeck','zCenter','ySole','Lb'])assert.equal(b.joints[key],neutral.joints[key]);
  assert.equal(b.hs,neutral.hs);assert.equal(b.proportions.breasts,neutral.proportions.breasts);
  // Toda a seção junto à cabeça deve ser exatamente a mesma, não só o raio no centro.
  const y=h.fit.P.neck[3]+.10*opts.headScale;
  for(let k=0;k<32;k++){const a=k*Math.PI/16,x=Math.sin(a)*.5,z=h.fit.P.neck[4]+Math.cos(a)*.5;assert.equal(b.sdf(x,y,z),neutral.sdf(x,y,z),`${id}/${name}: emenda do pescoço alterada`)}
  const hit=buildBody(h.fit,id,{...opts,build});assert.equal(hit.sdf,b.sdf,'Campo do mesmo build deve ser compartilhado');hit.geo.dispose();
  if(name!=='padrao')assert.notEqual(b.sdf,neutral.sdf,'Builds distintos não compartilham contornos');
  volumes[name]=volume(b.geo);b.geo.dispose();
 }
 assert(volumes.magro<volumes.padrao&&volumes.padrao<volumes.gordo,`${id}: volume não crescente ${JSON.stringify(volumes)}`);
 console.log(id, 'juntas e pescoço preservados; volumes',Object.fromEntries(Object.entries(volumes).map(([k,v])=>[k,+v.toFixed(3)])));
 neutral.geo.dispose();h.dispose();
}
