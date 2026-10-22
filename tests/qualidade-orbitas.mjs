// Qualidade dos triângulos da pele ao redor dos olhos, incluindo os vegetais.
// Uso opcional: node tests/qualidade-orbitas.mjs /copia/da/versao/anterior
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildHead} from '../src/head.js';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const previous=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/head.js')).href):null;
function inspect(build,id){
 const head=build(id,{}, {quality:.6});
 try{
  const g=head.group.getObjectByName('Head_Skin').geometry,p=g.attributes.position,ix=g.index.array,P=head.params;
  let triangles=0,thin=0;
  for(let i=0;i<ix.length;i+=3){
   const a=ix[i],b=ix[i+1],c=ix[i+2],x=(p.getX(a)+p.getX(b)+p.getX(c))/3,y=(p.getY(a)+p.getY(b)+p.getY(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;
   if(z<.35||Math.abs(Math.abs(x)-P.eyeX)>P.Re*1.4||Math.abs(y-P.eyeY)>P.Re*1.3)continue;
   const ux=p.getX(b)-p.getX(a),uy=p.getY(b)-p.getY(a),uz=p.getZ(b)-p.getZ(a),vx=p.getX(c)-p.getX(a),vy=p.getY(c)-p.getY(a),vz=p.getZ(c)-p.getZ(a);
   const longest=Math.max(ux*ux+uy*uy+uz*uz,vx*vx+vy*vy+vz*vz,(ux-vx)**2+(uy-vy)**2+(uz-vz)**2);
   const quality=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)/longest;
   assert(Number.isFinite(quality),id+': triângulo orbital inválido');triangles++;if(quality<.01)thin++;
  }
  assert(triangles>100,id+': região orbital ausente');
  // Só a versão atual precisa satisfazer o contrato novo de piscada completa.
  if(build===buildHead){
   head.rig.apply({blinkL:1,blinkR:1});head.group.updateMatrixWorld(true);
   for(const side of ['L','R']){
    const e=head.rig.eyeInfo[side].e,edges=[];
    for(const upper of [true,false]){
     const m=head.group.getObjectByName('Lid_Sculpt_'+(upper?'U_':'L_')+side),a=m.geometry.attributes.position;
     const [tx,ty]=e.toHead(0,(upper?1:-1)*e.H(0,upper));let chosen=-1,best=Infinity;
     for(let i=0;i<a.count;i++){const distance=(a.getX(i)-tx)**2+(a.getY(i)-ty)**2;if(distance<best){best=distance;chosen=i}}
     const v=new THREE.Vector3().fromBufferAttribute(a,chosen);m.applyBoneTransform(chosen,v);edges.push(e.local(v.x,v.y)[1]);
    }
    assert(edges[0]-edges[1]<.003,id+'/'+side+': piscada completa deixa a íris exposta no centro');
    assert(edges[1]-edges[0]<.06,id+'/'+side+': pálpebras ultrapassam demais o fechamento');
   }
  }
  return{triangles,thin};
 }finally{head.dispose()}
}
let count=0,total=0,oldTotal=0;
for(const id of PRESET_ORDER){
 if(['robot','companion'].includes(PRESETS[id].kind))continue;
 const now=inspect(buildHead,id);assert(now.thin/now.triangles<.02,id+': excesso de triângulos muito estreitos');
 const old=previous?inspect(previous.buildHead,id):null;
 total+=now.thin;oldTotal+=old?.thin||0;count++;
 console.log(id,JSON.stringify({atual:now,anterior:old}));
}
if(previous)assert(total<oldTotal*.5,'A correção não reduziu os triângulos orbitais estreitos');
console.log(JSON.stringify({personagens:count,triangulosEstreitos:total,anteriores:previous?oldTotal:null}));
